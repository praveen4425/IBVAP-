from __future__ import annotations

import threading
import uuid
import gc
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

import cv2

import shutil
import subprocess

from app.core.config import BASE_DIR, EVIDENCE_DIR
from app.services.tracker import BasicTracker
from app.services.ultralytics_detector import UltralyticsDetector
from app.analytics.zone_engine import ZoneEngine, VirtualLine
from app.analytics.face_engine import FaceEngine
from app.services.event_engine import event_engine
from app.services.incident_engine import incident_engine
from app.services.evidence_service import evidence_service
from app.storage.database import database_service
from app.analytics.temporal_engine import TemporalEngine

VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv"}
MAX_UPLOAD_BYTES = 500 * 1024 * 1024
VIDEO_DIR = EVIDENCE_DIR / "videos"
UPLOAD_DIR = VIDEO_DIR / "uploads"
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = BASE_DIR / "yolov8n.pt"

_live_results_lock = threading.Lock()
_live_results: dict[str, Any] = {
    "job_id": None,
    "state": "idle",
    "detections": [],
}


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

    def public(self) -> dict[str, Any]:
        return asdict(self)


def get_live_results() -> dict[str, Any]:
    with _live_results_lock:
        return dict(_live_results)


def _update_live_results(job_id: str, state: str, detections: list[Any]) -> None:
    with _live_results_lock:
        _live_results.update(
            {
                "job_id": job_id,
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
    # 1. Try direct MP4 codecs
    codecs_to_try = ["mp4v", "avc1", "H264", "XVID"]
    for codec in codecs_to_try:
        try:
            fourcc = cv2.VideoWriter_fourcc(*codec)
            writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))
            if writer.isOpened():
                return writer, codec, output_path
            writer.release()
        except Exception:
            pass

    # 2. Try Windows MSMF backend if available
    if hasattr(cv2, "CAP_MSMF"):
        for codec in codecs_to_try:
            try:
                fourcc = cv2.VideoWriter_fourcc(*codec)
                writer = cv2.VideoWriter(str(output_path), cv2.CAP_MSMF, fourcc, fps, (width, height))
                if writer.isOpened():
                    return writer, f"CAP_MSMF_{codec}", output_path
                writer.release()
            except Exception:
                pass

    # 3. Universal Fallback: Temporary .avi file with MJPG codec (100% supported on all Linux OpenCV builds)
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

    raise RuntimeError("Unable to create the annotated output video")


def process_video(job_id: str, input_path: Path) -> None:
    output_path = VIDEO_DIR / f"{job_id}.mp4"
    capture = None
    writer = None
    file_size = input_path.stat().st_size if input_path.exists() else 0
    print(f"[DIAGNOSTIC] Job {job_id}: Processing file '{input_path.name}', size={file_size} bytes")

    try:
        if not MODEL_PATH.is_file():
            raise RuntimeError(f"YOLO model not found: {MODEL_PATH.name}")

        capture = cv2.VideoCapture(str(input_path))
        is_opened = capture.isOpened()
        print(f"[DIAGNOSTIC] Job {job_id}: cv2.VideoCapture opened: {is_opened}")
        if not is_opened:
            raise RuntimeError("The uploaded file is not a readable video")

        total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = capture.get(cv2.CAP_PROP_FPS) or 25.0
        orig_width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        orig_height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        if orig_width <= 0 or orig_height <= 0:
            raise RuntimeError("The video has no readable frame dimensions")

        MAX_WIDTH = 1280
        MAX_HEIGHT = 720
        needs_resize = orig_width > MAX_WIDTH or orig_height > MAX_HEIGHT

        if needs_resize:
            scale = min(MAX_WIDTH / orig_width, MAX_HEIGHT / orig_height)
            width = int(round(orig_width * scale))
            height = int(round(orig_height * scale))
            if width % 2 != 0:
                width -= 1
            if height % 2 != 0:
                height -= 1
            print(f"[DIAGNOSTIC] Job {job_id}: 4K/HD memory guard active. Target bounds {width}x{height}")
            # Release capture and garbage collect before spawning FFmpeg
            capture.release()
            capture = None
            gc.collect()

            ffmpeg_bin = _get_ffmpeg_bin()
            if ffmpeg_bin:
                downscaled_path = input_path.with_suffix(".scaled.mp4")
                try:
                    cmd = [
                        ffmpeg_bin,
                        "-threads", "1",
                        "-y",
                        "-i", str(input_path),
                        "-vf", f"scale={width}:{height}",
                        "-c:v", "libx264",
                        "-preset", "ultrafast",
                        "-threads", "1",
                        "-crf", "28",
                        "-an",
                        str(downscaled_path),
                    ]
                    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
                    if res.returncode == 0 and downscaled_path.is_file() and downscaled_path.stat().st_size > 0:
                        input_path.unlink(missing_ok=True)
                        input_path = downscaled_path
                        needs_resize = False
                        print(f"[DIAGNOSTIC] Job {job_id}: Pre-scaled on disk to {width}x{height} via FFmpeg successfully")
                except Exception as e:
                    print(f"[DIAGNOSTIC] Job {job_id}: FFmpeg pre-scale exception: {e}")

            capture = cv2.VideoCapture(str(input_path))
            total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or total_frames)
            fps = capture.get(cv2.CAP_PROP_FPS) or fps
        else:
            width = orig_width
            height = orig_height

        print(f"[DIAGNOSTIC] Job {job_id}: fps={fps}, width={width}, height={height}, total_frames={total_frames}")

        writer, codec_used, actual_target_path = _create_video_writer(output_path, fps, width, height)
        writer_opened = writer.isOpened() if writer else False
        print(f"[DIAGNOSTIC] Job {job_id}: Selected output codec='{codec_used}', target='{actual_target_path.name}', isOpened={writer_opened}")
        if not writer_opened:
            raise RuntimeError("Unable to create the annotated output video")

        update_job(job_id, state="processing", total_frames=total_frames)
        detector = UltralyticsDetector(str(MODEL_PATH), conf_thresh=0.45)
        tracker = BasicTracker()
        face_engine = FaceEngine()
        temporal_engine = TemporalEngine()
        zone_engine = ZoneEngine(
            lines=[
                VirtualLine(
                    line_id="default-midline",
                    name="Default Mid-Frame Fence",
                    start=(0, height / 2),
                    end=(width, height / 2),
                )
            ]
        )
        counts: dict[str, int] = {}
        seen_tracks = set()

        while True:
            success, frame = capture.read()
            if not success:
                break

            if needs_resize:
                frame = cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)

            detections = detector.detect(frame)
            tracks = tracker.update(detections)
            _update_live_results(job_id, "processing", detections)
            raw_events = zone_engine.analyze("video-upload", tracks)
            temporal_events = temporal_engine.analyze("video-upload", tracks)
            if temporal_events:
                raw_events.extend(temporal_events)
            for track in tracks:
                if track.class_name.lower() == "person":
                    face_event = face_engine.analyze("video-upload", track.track_id, frame, track.bbox)
                    if face_event is not None:
                        raw_events.append(face_event)
            if raw_events:
                security_events = event_engine.process_events(raw_events)
                if security_events:
                    for evt in security_events:
                        try:
                            metadata = evidence_service.save_snapshot(
                                frame, "video-upload", evt.event_id
                            )
                            database_service.save_evidence(metadata)
                            evt.evidence_refs.append(metadata["evidence_id"])
                        except Exception:
                            pass
                    new_incidents = incident_engine.process_events(security_events)
                    for inc in new_incidents:
                        try:
                            # Aggregate evidence refs from events
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
                                }
                            )
                        except Exception:
                            pass
            for track in tracks:
                if track.track_id not in seen_tracks:
                    seen_tracks.add(track.track_id)
                    counts[track.class_name] = counts.get(track.class_name, 0) + 1
            writer.write(_annotate_frame(frame, detections, tracks))

            processed_frames = int(capture.get(cv2.CAP_PROP_POS_FRAMES))
            progress = (processed_frames / total_frames * 100.0) if total_frames else 0.0
            update_job(
                job_id,
                processed_frames=processed_frames,
                progress=min(progress, 100.0),
                detection_counts=dict(counts),
            )

        if writer is not None:
            writer.release()
            writer = None

        if actual_target_path != output_path and actual_target_path.is_file():
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
                        "-threads", "1",
                        "-pix_fmt", "yuv420p",
                        str(output_path)
                    ]
                    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
                    if res.returncode == 0 and output_path.is_file() and output_path.stat().st_size > 0:
                        converted = True
                except Exception:
                    pass
            if not converted:
                shutil.copy(actual_target_path, output_path)
            actual_target_path.unlink(missing_ok=True)

        out_exists = output_path.is_file()
        out_size = output_path.stat().st_size if out_exists else 0
        print(f"[DIAGNOSTIC] Job {job_id}: Finished processing {processed_frames} frames. Output exists: {out_exists}, size={out_size} bytes")

        if not out_exists or out_size == 0:
            raise RuntimeError("No annotated video was produced")
        update_job(
            job_id,
            state="completed",
            progress=100.0,
            output_url=f"/api/video/jobs/{job_id}/output",
            detection_counts=counts,
        )
        _update_live_results(job_id, "completed", detections)
    except Exception as exc:
        print(f"[DIAGNOSTIC] Job {job_id}: Exception occurred: {exc}")
        update_job(job_id, state="failed", error=str(exc))
        _update_live_results(job_id, "failed", [])
        output_path.unlink(missing_ok=True)
        output_path.with_suffix(".temp.avi").unlink(missing_ok=True)
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
            input_path.with_suffix(".scaled.mp4").unlink(missing_ok=True)
        except Exception:
            pass
        try:
            output_path.with_suffix(".temp.avi").unlink(missing_ok=True)
        except Exception:
            pass
        gc.collect()
        try:
            import ctypes
            ctypes.CDLL("libc.so.6").malloc_trim(0)
        except Exception:
            pass


def start_processing(job_id: str, input_path: Path) -> None:
    thread = threading.Thread(
        target=process_video,
        args=(job_id, input_path),
        daemon=True,
        name=f"IBVAP-video-{job_id[:8]}",
    )
    thread.start()
