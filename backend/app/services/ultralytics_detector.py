from datetime import datetime, timezone
from typing import Any
import threading
import numpy as np

_torch_initialized = False

def _init_torch():
    global _torch_initialized
    if not _torch_initialized:
        import os
        os.environ["OMP_NUM_THREADS"] = "1"
        os.environ["MKL_NUM_THREADS"] = "1"
        os.environ["OPENBLAS_NUM_THREADS"] = "1"
        os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
        os.environ["NUMEXPR_NUM_THREADS"] = "1"
        import torch
        try:
            torch.set_num_threads(1)
            if hasattr(torch, "set_num_interop_threads"):
                torch.set_num_interop_threads(1)
            torch.set_grad_enabled(False)
        except Exception:
            pass
        _torch_initialized = True

from app.core.detection_config import ALLOWED_CLASSES
from app.services.detector import Detector, Detection, BoundingBox, create_detection

class UltralyticsDetector(Detector):
    """
    Ultralytics YOLO wrapper implementing the IBVAP Detector interface.
    """

    def __init__(self, model_path: str = "yolov8n.pt", conf_thresh: float = 0.25):
        _init_torch()
        from ultralytics import YOLO
        self.model = YOLO(model_path)
        self.conf_thresh = conf_thresh
        self._inference_lock = threading.Lock()

    def detect(self, frame: Any) -> list[Detection]:
        import torch
        # Run inference with torch.inference_mode to minimize memory usage
        with self._inference_lock:
            with torch.inference_mode():
                results = self.model(frame, conf=self.conf_thresh, imgsz=640, verbose=False)
        
        detections = []
        if not results:
            return detections
            
        result = results[0]
        boxes = result.boxes
        
        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            cls_name = result.names[cls_id]

            if cls_name.lower() not in ALLOWED_CLASSES:
                continue
            
            bbox = BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2)
            
            det = create_detection(
                class_id=cls_id,
                class_name=cls_name.upper(),
                confidence=conf,
                bbox=bbox,
                metadata={}
            )
            detections.append(det)
            
        return detections


_shared_detector: UltralyticsDetector | None = None
_shared_detector_lock = threading.Lock()


def get_shared_detector(model_path: str = "yolov8n.pt", conf_thresh: float = 0.45) -> UltralyticsDetector:
    global _shared_detector
    if _shared_detector is None:
        with _shared_detector_lock:
            if _shared_detector is None:
                _shared_detector = UltralyticsDetector(model_path=model_path, conf_thresh=conf_thresh)
    return _shared_detector

