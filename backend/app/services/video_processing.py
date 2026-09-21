from __future__ import annotations

import gc
import shutil
import subprocess
import threading
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

import cv2

from app.analytics.temporal_engine import TemporalEngine
from app.analytics.zone_engine import VirtualLine, Zone, ZoneEngine
from app.core.config import BASE_DIR, EVIDENCE_DIR
from app.services.event_engine import event_engine
from app.services.evidence_service import evidence_service
from app.services.incident_engine import incident_engine
from app.services.tracker import BasicTracker
from app.services.ultralytics_detector import get_shared_detector
from app.storage.database import database_service

VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv"}
MAX_UPLOAD_BYTES = 500 * 1024 * 1024
VIDEO_DIR = EVIDENCE_DIR / "videos"
UPLOAD_DIR = VIDEO_DIR / "uploads"
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = BASE_DIR / "yolov8n.onnx"

# ---------------------------------------------------------------------------
# Live-results store (written by the AI camera pipeline, read by /api/video/live)
# ---------------------------------------------------------------------------
_live_results_lock = threading.Lock()
_live_results: dict[str, Any] = {
    "job_id": None,
    "state": "idle",
    "detections": [],
}


def get_live_results() -> dict[str, Any]:
    with _live_results_lock:
        return dict(_live_results)


def _update_live_results(source_id: str, state: str, detections: list[Any]) -> None:
    with _live_results_lock:
        _live_results.update(
            {
                "job_id": source_id,
                "state": state,
                "detections": [
                    {
                        "class_name": detection.class_name,
                        "confidence": detection.confidence,
                        "bbox": {
                            "x1": detection.bbox.x1,
                            "y1": detection.bbox.y1,
                            "x2": detection.bbox.x2,
                            "y2": detection.bbox.y2,
                        },
                    }
                    for detection in detections
                ],
            }
        )


# ---------------------------------------------------------------------------
# Video Upload Job State
# ---------------------------------------------------------------------------
@dataclass
class VideoJob:
    job_id: str
    filename: str
    state: str = "queued"
    progress: float = 0.0
    processed_frames: int = 0
    total_frames: int = 0
    detection_counts: dict[str, int] = field(default_factory=dict)
    output_url: str | None = None
    error: str | None = None
    stage: str = "queued"

    def public(self) -> dict[str, Any]:
        return asdict(self)


_jobs: dict[str, VideoJob] = {}
_jobs_lock = threading.Lock()


def create_job(filename: str) -> VideoJob:
    job = VideoJob(job_id=uuid.uuid4().hex, filename=filename)
    with _jobs_lock:
        _jobs[job.job_id] = job
    return job


def get_job(job_id: str) -> VideoJob | None:
    with _jobs_lock:
        return _jobs.get(job_id)


def update_job(job_id: str, **updates: Any) -> None:
    with _jobs_lock:
        job = _jobs.get(job_id)
        if job is not None:
            for key, value in updates.items():
                setattr(job, key, value)


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------
def _get_ffmpeg_bin() -> str | None:
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and Path(exe).is_file():
            return exe
    except Exception:
        pass
    return shutil.which("ffmpeg")


def _annotate_frame(frame: Any, detections: list[Any], tracks: list[Any]) -> Any:
    for detection, track in zip(detections, tracks):
        box = detection.bbox
        x1, y1, x2, y2 = map(int, (box.x1, box.y1, box.x2, box.y2))
        label = f"{detection.class_name} {detection.confidence:.2f} ID:{track.track_id}"
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 210, 120), 2)
        label_y = max(y1 - 8, 18)
        cv2.putText(
            frame,
            label,
            (x1, label_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 210, 120),
            2,
            cv2.LINE_AA,
        )
    return frame


def _create_video_writer(output_path: Path, fps: float, width: int, height: int) -> tuple[cv2.VideoWriter, str, Path]:
    raw_path = output_path.with_suffix(".raw.mp4")
    codecs_to_try = ["mp4v", "avc1", "H264", "XVID", "MJPG"]
    for codec in codecs_to_try:
        try:
            fourcc = cv2.VideoWriter_fourcc(*codec)
            writer = cv2.VideoWriter(str(raw_path), fourcc, fps, (width, height))
            if writer.isOpened():
                return writer, codec, raw_path
            writer.release()
        except Exception:
            pass

    temp_avi_path = output_path.with_suffix(".temp.avi")
    for avi_codec in ["MJPG", "XVID"]:
        try:
            fourcc = cv2.VideoWriter_fourcc(*avi_codec)
            writer = cv2.VideoWriter(str(temp_avi_path), fourcc, fps, (width, height))
            if writer.isOpened():
                return writer, f"fallback_{avi_codec}", temp_avi_path
            writer.release()
        except Exception:
            pass

    raise RuntimeError("Unable to create output video writer")


# ---------------------------------------------------------------------------
# Core Video Processing MVP Pipeline
# ---------------------------------------------------------------------------
def process_video(job_id: str, input_path: Path) -> None:
    output_path = VIDEO_DIR / f"{job_id}.mp4"
    capture = None
    writer = None
    actual_target_path = None
    frame_idx = 0
    file_size = input_path.stat().st_size if input_path.exists() else 0
    print(f"[VIDEO_PROC] Job {job_id}: Processing '{input_path.name}' ({file_size} bytes)")

    try:
        if not MODEL_PATH.is_file():
            raise RuntimeError(f"ONNX model not found: {MODEL_PATH.name}")

        capture = cv2.VideoCapture(str(input_path))
        if not capture.isOpened():
            raise RuntimeError("Uploaded file is not a readable video")

        total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = capture.get(cv2.CAP_PROP_FPS) or 25.0
        orig_w = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        orig_h = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        if orig_w <= 0 or orig_h <= 0:
            raise RuntimeError("Video has invalid frame dimensions")

        # Bounded resolution guard (max 1280x720)
        MAX_W, MAX_H = 1280, 720
        needs_resize = orig_w > MAX_W or orig_h > MAX_H
        if needs_resize:
            scale = min(MAX_W / orig_w, MAX_H / orig_h)
            width = int(round(orig_w * scale))
            height = int(round(orig_h * scale))
            if width % 2 != 0:
                width -= 1
            if height % 2 != 0:
                height -= 1
        else:
            width, height = orig_w, orig_h

        writer, codec_used, actual_target_path = _create_video_writer(output_path, fps, width, height)
        if not writer or not writer.isOpened():
            raise RuntimeError("Failed to create video writer")

        update_job(job_id, state="processing", total_frames=total_frames, stage="loading_models")

        # Use existing ONNX detector singleton — NO ANPR, NO Face engine
        detector = get_shared_detector(str(MODEL_PATH), conf_thresh=0.45)
        tracker = BasicTracker()
        
        # Configure ZoneEngine & TemporalEngine for event detection on uploaded video
        zone_engine = ZoneEngine(
            lines=[
                VirtualLine(
                    line_id="border-fence",
                    name="Border Fence Boundary Line",
                    start=(0, height * 0.5),
                    end=(width, height * 0.5),
                )
            ],
            zones=[
                Zone(
                    zone_id="restricted-area",
                    name="Restricted Border Zone",
                    polygon=(
                        (width * 0.1, height * 0.1),
                        (width * 0.9, height * 0.1),
                        (width * 0.9, height * 0.9),
                        (width * 0.1, height * 0.9),
                    ),
                )
            ],
        )
        temporal_engine = TemporalEngine()

        update_job(job_id, stage="running_inference")
        counts: dict[str, int] = {}
        seen_tracks: set[str] = set()

        while True:
            frame_idx += 1
            success, frame = capture.read()
            if not success:
                break

            if needs_resize:
                frame = cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)

            # 1. Detect objects using ONNX YOLO (person, car, truck, bus, motorcycle)
            detections = detector.detect(frame)

            # 2. Update object tracks
            tracks = tracker.update(detections)

            # 3. Update live results store
            _update_live_results(job_id, "processing", detections)

            # 4. Generate events (ZoneEngine + TemporalEngine) — NO ANPR / Face
            raw_events = zone_engine.analyze("uploaded-video", tracks)
            temporal_events = temporal_engine.analyze("uploaded-video", tracks)
            if temporal_events:
                raw_events.extend(temporal_events)

            # 5. Flow events into EventEngine -> SecurityEvent -> IncidentEngine -> Incident -> DB
            if raw_events:
                security_events = event_engine.process_events(raw_events)
                if security_events:
                    # Save evidence snapshot for security events
                    for evt in security_events:
                        try:
                            metadata = evidence_service.save_snapshot(
                                frame, "uploaded-video", evt.event_id
                            )
                            database_service.save_evidence(metadata)
                            evt.evidence_refs.append(metadata["evidence_id"])
                        except Exception:
                            pass

                    # Correlate into real incidents and persist to DB
                    new_incidents = incident_engine.process_events(security_events)
                    for inc in new_incidents:
                        try:
                            refs = []
                            for e in security_events:
                                if e.event_id in inc.event_ids:
                                    refs.extend(e.evidence_refs)
                            inc.metadata["evidence_refs"] = refs

                            database_service.save_incident(
                                inc.incident_id,
                                inc.severity.value,
                                inc.lifecycle_status.value,
                                inc.timestamp_start.isoformat(),
                                {
                                    "camera_ids": inc.camera_ids,
                                    "track_ids": inc.track_ids,
                                    "explanation": inc.explanation,
                                    "correlation_score": inc.correlation_score,
                                    "evidence_refs": refs,
                                },
                            )
                        except Exception:
                            pass

            # 6. Count class occurrences
            for track in tracks:
                if track.track_id not in seen_tracks:
                    seen_tracks.add(track.track_id)
                    counts[track.class_name] = counts.get(track.class_name, 0) + 1

            # 7. Annotate frame and write output video
            writer.write(_annotate_frame(frame, detections, tracks))

            progress = (frame_idx / total_frames * 100.0) if total_frames else 0.0
            update_job(
                job_id,
                processed_frames=frame_idx,
                progress=min(progress, 100.0),
                detection_counts=dict(counts),
            )

        writer.release()
        writer = None

        # Transcode video to H.264 (yuv420p) for 100% web browser HTML5 video compatibility
        if actual_target_path and actual_target_path.is_file():
            converted = False
            ffmpeg_bin = _get_ffmpeg_bin()
            if ffmpeg_bin:
                try:
                    cmd = [
                        ffmpeg_bin,
                        "-threads", "1",
                        "-y",
                        "-i", str(actual_target_path),
                        "-c:v", "libx264",
                        "-preset", "ultrafast",
                        "-pix_fmt", "yuv420p",
                        str(output_path),
                    ]
                    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
                    if res.returncode == 0 and output_path.is_file() and output_path.stat().st_size > 0:
                        converted = True
                except Exception as e:
                    print(f"[VIDEO_PROC] FFmpeg transcode exception: {e}")

            if not converted:
                shutil.copy(actual_target_path, output_path)

            if actual_target_path != output_path:
                actual_target_path.unlink(missing_ok=True)

        out_exists = output_path.is_file()
        out_size = output_path.stat().st_size if out_exists else 0
        if not out_exists or out_size == 0:
            raise RuntimeError("No annotated output video was generated")

        update_job(
            job_id,
            state="completed",
            progress=100.0,
            output_url=f"/api/video/jobs/{job_id}/output",
            detection_counts=counts,
            stage="completed",
        )
        _update_live_results(job_id, "completed", [])
        print(f"[VIDEO_PROC] Job {job_id} completed successfully. Frames={frame_idx}, Size={out_size} bytes")

    except Exception as exc:
        import traceback
        tb = traceback.format_exc()
        print(f"[VIDEO_PROC] Job {job_id} failed: {tb}")
        update_job(job_id, state="failed", error=str(exc), stage="failed")
        _update_live_results(job_id, "failed", [])
        if output_path.exists():
            output_path.unlink(missing_ok=True)
    finally:
        if capture is not None:
            capture.release()
        if writer is not None:
            writer.release()
        try:
            input_path.unlink(missing_ok=True)
        except Exception:
            pass
        try:
            output_path.with_suffix(".temp.avi").unlink(missing_ok=True)
        except Exception:
            pass
        gc.collect()
