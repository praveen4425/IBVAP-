from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
import cv2

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
        self.seen_tracks = set()
        self.enabled = False
        try:
            if hasattr(cv2, "CascadeClassifier") and hasattr(cv2, "data") and hasattr(cv2.data, "haarcascades"):
                cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
                self.model = cv2.CascadeClassifier(cascade_path)
                self.enabled = not self.model.empty()
        except Exception:
            self.enabled = False

    def analyze(self, camera_id: str, track_id: str, frame: Any, bbox: Any) -> FaceEvent | None:
        if not self.enabled or track_id in self.seen_tracks:
            return None
            
        x1, y1, x2, y2 = int(bbox.x1), int(bbox.y1), int(bbox.x2), int(bbox.y2)
        h, w = frame.shape[:2]
        x1, y1, x2, y2 = max(0, x1), max(0, y1), min(w, x2), min(h, y2)
        
        if y2 - y1 < 30 or x2 - x1 < 30:
            return None
            
        # Crop person bounding box
        crop = frame[y1:y2, x1:x2]
        
        faces = self.model.detectMultiScale(
            cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY),
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
        )
        if len(faces):
            x, y, width, height = max(faces, key=lambda face: face[2] * face[3])
            confidence = min(0.99, (width * height) / float(crop.shape[0] * crop.shape[1]) + 0.5)
            self.seen_tracks.add(track_id)
            return FaceEvent(
                event_type="face_detected",
                camera_id=camera_id,
                track_id=track_id,
                confidence=confidence,
                timestamp=datetime.now(timezone.utc),
                evidence_crop=crop,
                metadata={"facial_area": [int(x), int(y), int(width), int(height)]},
            )
                
        return None
