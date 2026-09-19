from datetime import datetime, timezone
from typing import Any
import threading
import numpy as np

from ultralytics import YOLO

from app.core.detection_config import ALLOWED_CLASSES
from app.services.detector import Detector, Detection, BoundingBox, create_detection

class UltralyticsDetector(Detector):
    """
    Ultralytics YOLO wrapper implementing the IBVAP Detector interface.
    """

    def __init__(self, model_path: str = "yolov8n.pt", conf_thresh: float = 0.25):
        self.model = YOLO(model_path)
        self.conf_thresh = conf_thresh
        self._inference_lock = threading.Lock()

    def detect(self, frame: Any) -> list[Detection]:
        # Run inference
        with self._inference_lock:
            results = self.model(frame, conf=self.conf_thresh, verbose=False)
        
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
