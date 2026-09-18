from __future__ import annotations

import threading
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

import cv2

from app.core.config import BASE_DIR, EVIDENCE_DIR
from app.services.tracker import BasicTracker
from app.services.ultralytics_detector import UltralyticsDetector

VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv"}
MAX_UPLOAD_BYTES = 500 * 1024 * 1024
VIDEO_DIR = EVIDENCE_DIR / "videos"
UPLOAD_DIR = VIDEO_DIR / "uploads"
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = BASE_DIR / "yolov8n.pt"


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


def process_video(job_id: str, input_path: Path) -> None:
    output_path = VIDEO_DIR / f"{job_id}.mp4"
    capture = None
    writer = None
    try:
        if not MODEL_PATH.is_file():
            raise RuntimeError(f"YOLO model not found: {MODEL_PATH.name}")

        capture = cv2.VideoCapture(str(input_path))
        if not capture.isOpened():
            raise RuntimeError("The uploaded file is not a readable video")

        total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = capture.get(cv2.CAP_PROP_FPS) or 25.0
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        if width <= 0 or height <= 0:
            raise RuntimeError("The video has no readable frame dimensions")

        writer = cv2.VideoWriter(
            str(output_path),
            cv2.CAP_MSMF,
            cv2.VideoWriter_fourcc(*"avc1"),
            fps,
            (width, height),
        )
        if not writer.isOpened():
            raise RuntimeError("Unable to create the annotated output video")

        update_job(job_id, state="processing", total_frames=total_frames)
        detector = UltralyticsDetector(str(MODEL_PATH))
        tracker = BasicTracker()
        counts: dict[str, int] = {}

        while True:
            success, frame = capture.read()
            if not success:
                break

            detections = detector.detect(frame)
            tracks = tracker.update(detections)
            for detection in detections:
                counts[detection.class_name] = counts.get(detection.class_name, 0) + 1
            writer.write(_annotate_frame(frame, detections, tracks))

            processed_frames = int(capture.get(cv2.CAP_PROP_POS_FRAMES))
            progress = (processed_frames / total_frames * 100.0) if total_frames else 0.0
            update_job(
                job_id,
                processed_frames=processed_frames,
                progress=min(progress, 100.0),
                detection_counts=dict(counts),
            )

        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise RuntimeError("No annotated video was produced")
        update_job(
            job_id,
            state="completed",
            progress=100.0,
            output_url=f"/api/video/jobs/{job_id}/output",
            detection_counts=counts,
        )
    except Exception as exc:
        update_job(job_id, state="failed", error=str(exc))
        output_path.unlink(missing_ok=True)
    finally:
        if capture is not None:
            capture.release()
        if writer is not None:
            writer.release()
        input_path.unlink(missing_ok=True)


def start_processing(job_id: str, input_path: Path) -> None:
    thread = threading.Thread(
        target=process_video,
        args=(job_id, input_path),
        daemon=True,
        name=f"IBVAP-video-{job_id[:8]}",
    )
    thread.start()
