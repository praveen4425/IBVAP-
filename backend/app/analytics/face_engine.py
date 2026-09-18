from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
import numpy as np

@dataclass
class FaceEvent:
    event_type: str
    camera_id: str
    track_id: str
    confidence: float
    timestamp: datetime
    evidence_crop: Any | None
    metadata: dict[str, Any]

class FaceEngine:
    def __init__(self):
        try:
            from retinaface import RetinaFace
            self.model = RetinaFace
            self.enabled = True
        except ImportError:
            self.enabled = False
            self.model = None

    def analyze(self, camera_id: str, track_id: str, frame: Any, bbox: Any) -> FaceEvent | None:
        if not self.enabled:
            return None
            
        x1, y1, x2, y2 = int(bbox.x1), int(bbox.y1), int(bbox.x2), int(bbox.y2)
        h, w = frame.shape[:2]
        x1, y1, x2, y2 = max(0, x1), max(0, y1), min(w, x2), min(h, y2)
        
        if y2 - y1 < 30 or x2 - x1 < 30:
            return None
            
        # Crop person bounding box
        crop = frame[y1:y2, x1:x2]
        
        # Retinaface detection
        resp = self.model.detect_faces(crop)
        
        if isinstance(resp, dict):
            # Find most confident face
            best_face = None
            best_conf = 0.0
            
            for key, face in resp.items():
                conf = face["score"]
                if conf > best_conf:
                    best_conf = conf
                    best_face = face
            
            if best_face and best_conf > 0.8:
                return FaceEvent(
                    event_type="face_detected",
                    camera_id=camera_id,
                    track_id=track_id,
                    confidence=best_conf,
                    timestamp=datetime.now(timezone.utc),
                    evidence_crop=crop,
                    metadata={"facial_area": best_face["facial_area"]}
                )
                
        return None
