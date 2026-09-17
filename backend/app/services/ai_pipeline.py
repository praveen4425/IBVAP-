from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from datetime import datetime, timezone

from app.services.camera_manager import (
    CameraManager,
    camera_manager,
)
from app.services.detector import Detection, Detector


@dataclass
class PipelineStatus:
    camera_id: str
    running: bool = False
    frames_processed: int = 0
    last_processed_at: str | None = None
    last_detection_count: int = 0
    error: str | None = None


class AIPipelineWorker:
    """
    Connects one camera stream to one detector.

    Responsibilities:
    - Read the latest frame from CameraManager.
    - Send the frame to the configured Detector.
    - Track basic inference health.
    - Expose normalized detections for future analytics.

    This class does NOT contain:
    - YOLO-specific code
    - tracking logic
    - zone logic
    - incident logic
    - evidence logic
    """

    def __init__(
        self,
        camera_id: str,
        camera_manager: CameraManager,
        detector: Detector,
        process_interval: float = 0.1,
    ):
        self.camera_id = camera_id
        self.camera_manager = camera_manager
        self.detector = detector
        self.process_interval = process_interval

        self.status = PipelineStatus(
            camera_id=camera_id,
        )

        self._running = False
        self._thread: threading.Thread | None = None
        self._latest_detections: list[Detection] = []

        self._lock = threading.Lock()

    def start(self) -> None:
        if self._running:
            return

        self._running = True
        self.status.running = True

        self._thread = threading.Thread(
            target=self._run,
            daemon=True,
            name=f"IBVAP-AI-{self.camera_id}",
        )

        self._thread.start()

    def stop(self) -> None:
        self._running = False
        self.status.running = False

    def get_status(self) -> PipelineStatus:
        return self.status

    def get_latest_detections(self) -> list[Detection]:
        with self._lock:
            return list(self._latest_detections)

    def _run(self) -> None:
        while self._running:
            try:
                frame = self.camera_manager.get_frame(
                    self.camera_id
                )

                if frame is None:
                    time.sleep(self.process_interval)
                    continue

                detections = self.detector.detect(frame)

                with self._lock:
                    self._latest_detections = detections

                self.status.frames_processed += 1
                self.status.last_detection_count = len(
                    detections
                )
                self.status.last_processed_at = (
                    datetime.now(timezone.utc).isoformat()
                )
                self.status.error = None

            except Exception as exc:
                self.status.error = str(exc)

            time.sleep(self.process_interval)


class AIPipelineManager:
    """
    Manages AI inference workers across multiple cameras.
    """

    def __init__(
        self,
        camera_manager: CameraManager,
    ):
        self.camera_manager = camera_manager
        self.workers: dict[str, AIPipelineWorker] = {}

    def start_camera(
        self,
        camera_id: str,
        detector: Detector,
    ) -> PipelineStatus:

        if camera_id in self.workers:
            raise ValueError(
                "AI pipeline already exists for camera"
            )

        if self.camera_manager.get_status(
            camera_id
        ) is None:
            raise ValueError(
                "Camera not found"
            )

        worker = AIPipelineWorker(
            camera_id=camera_id,
            camera_manager=self.camera_manager,
            detector=detector,
        )

        self.workers[camera_id] = worker
        worker.start()

        return worker.get_status()

    def stop_camera(
        self,
        camera_id: str,
    ) -> None:

        worker = self.workers.pop(
            camera_id,
            None,
        )

        if worker:
            worker.stop()

    def get_status(
        self,
        camera_id: str,
    ) -> PipelineStatus | None:

        worker = self.workers.get(camera_id)

        if worker is None:
            return None

        return worker.get_status()

    def get_all_status(
        self,
    ) -> list[PipelineStatus]:

        return [
            worker.get_status()
            for worker in self.workers.values()
        ]

    def get_detections(
        self,
        camera_id: str,
    ) -> list[Detection]:

        worker = self.workers.get(camera_id)

        if worker is None:
            return []

        return worker.get_latest_detections()


ai_pipeline_manager = AIPipelineManager(
    camera_manager=camera_manager,
)