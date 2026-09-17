import cv2
import time
import threading
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class CameraStatus:
    camera_id: str
    name: str
    stream_url: str
    connected: bool = False
    last_frame_at: str | None = None
    error: str | None = None


class CameraWorker:
    def __init__(self, camera_id: str, name: str, stream_url: str):
        self.status = CameraStatus(
            camera_id=camera_id,
            name=name,
            stream_url=stream_url,
        )

        self.running = False
        self.cap = None
        self.latest_frame = None
        self.lock = threading.Lock()

    def start(self):
        if self.running:
            return

        self.running = True
        thread = threading.Thread(
            target=self._capture_loop,
            daemon=True,
        )
        thread.start()

    def stop(self):
        self.running = False

        if self.cap:
            self.cap.release()

        self.status.connected = False

    def get_frame(self):
        with self.lock:
            if self.latest_frame is None:
                return None

            return self.latest_frame.copy()

    def _capture_loop(self):
        while self.running:

            try:
                if self.cap is None or not self.cap.isOpened():
                    self.status.connected = False

                    self.cap = cv2.VideoCapture(
                        self.status.stream_url
                    )

                    if not self.cap.isOpened():
                        self.status.error = "Unable to connect to camera"
                        time.sleep(3)
                        continue

                    self.status.connected = True
                    self.status.error = None

                success, frame = self.cap.read()

                if not success:
                    self.status.connected = False
                    self.status.error = "Frame read failed"

                    self.cap.release()
                    self.cap = None

                    time.sleep(2)
                    continue

                with self.lock:
                    self.latest_frame = frame

                self.status.last_frame_at = (
                    datetime.now(timezone.utc).isoformat()
                )

            except Exception as exc:
                self.status.connected = False
                self.status.error = str(exc)

                if self.cap:
                    self.cap.release()

                self.cap = None
                time.sleep(3)


class CameraManager:
    def __init__(self):
        self.cameras: dict[str, CameraWorker] = {}

    def add_camera(
        self,
        camera_id: str,
        name: str,
        stream_url: str,
    ):
        if camera_id in self.cameras:
            raise ValueError("Camera already exists")

        worker = CameraWorker(
            camera_id=camera_id,
            name=name,
            stream_url=stream_url,
        )

        self.cameras[camera_id] = worker
        worker.start()

        return worker.status

    def remove_camera(self, camera_id: str):
        worker = self.cameras.pop(camera_id, None)

        if worker:
            worker.stop()

    def get_status(self, camera_id: str):
        worker = self.cameras.get(camera_id)

        if not worker:
            return None

        return worker.status

    def get_all_status(self):
        return [
            worker.status
            for worker in self.cameras.values()
        ]

    def get_frame(self, camera_id: str):
        worker = self.cameras.get(camera_id)

        if not worker:
            return None

        return worker.get_frame()


camera_manager = CameraManager()