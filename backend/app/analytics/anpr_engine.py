from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
import re
import numpy as np
import cv2

@dataclass
class ANPREvent:
    event_type: str
    camera_id: str
    track_id: str
    plate_number: str
    confidence: float
    timestamp: datetime
    evidence_crop: Any | None

class ANPREngine:
    def __init__(self):
        try:
            import easyocr
            self.reader = easyocr.Reader(['en'], gpu=False) # Use CPU for safety in MVP unless GPU is guaranteed
            self.enabled = True
        except ImportError:
            self.enabled = False
            self.reader = None
            
        self.plate_history = {} # track_id -> dict of plate strings to counts

    def _normalize_plate(self, text: str) -> str:
        # Keep only alphanumeric
        normalized = re.sub(r'[^A-Z0-9]', '', text.upper())
        return normalized

    def analyze(self, camera_id: str, track_id: str, frame: Any, bbox: Any) -> ANPREvent | None:
        if not self.enabled:
            return None
            
        # Mocking the pipeline for MVP to prevent hanging on full inference:
        # 1. Crop vehicle
        # 2. Detect plate (skipping explicit plate detection for MVP, running OCR on lower third of vehicle)
        
        x1, y1, x2, y2 = int(bbox.x1), int(bbox.y1), int(bbox.x2), int(bbox.y2)
        h, w = frame.shape[:2]
        
        # Ensure bounds
        x1, y1, x2, y2 = max(0, x1), max(0, y1), min(w, x2), min(h, y2)
        
        if y2 - y1 < 20 or x2 - x1 < 20:
            return None

        # Take lower third of bounding box where plates usually are
        y1_plate = int(y1 + 0.6 * (y2 - y1))
        crop = frame[y1_plate:y2, x1:x2]
        
        results = self.reader.readtext(crop)
        
        best_plate = None
        best_conf = 0.0
        
        for (box, text, prob) in results:
            norm = self._normalize_plate(text)
            if len(norm) >= 6 and prob > best_conf: # Typical Indian plate length
                best_plate = norm
                best_conf = prob
                
        if best_plate and best_conf > 0.5:
            if track_id not in self.plate_history:
                self.plate_history[track_id] = {}
            
            self.plate_history[track_id][best_plate] = self.plate_history[track_id].get(best_plate, 0) + 1
            
            # Multi-frame voting (if seen 3 times)
            if self.plate_history[track_id][best_plate] == 3:
                return ANPREvent(
                    event_type="anpr_read",
                    camera_id=camera_id,
                    track_id=track_id,
                    plate_number=best_plate,
                    confidence=best_conf,
                    timestamp=datetime.now(timezone.utc),
                    evidence_crop=crop
                )
        return None

    def analyze_once(self, camera_id: str, track_id: str, frame: Any, bbox: Any) -> ANPREvent | None:
        if not self.enabled:
            return None

        x1, y1, x2, y2 = int(bbox.x1), int(bbox.y1), int(bbox.x2), int(bbox.y2)
        height, width = frame.shape[:2]
        x1, y1, x2, y2 = max(0, x1), max(0, y1), min(width, x2), min(height, y2)
        if y2 - y1 < 20 or x2 - x1 < 20:
            return None

        plate_crop = frame[int(y1 + 0.6 * (y2 - y1)):y2, x1:x2]
        best_plate = None
        best_conf = 0.0
        for _, text, probability in self.reader.readtext(plate_crop):
            normalized = self._normalize_plate(text)
            if len(normalized) >= 6 and probability > best_conf:
                best_plate = normalized
                best_conf = probability

        if not best_plate or best_conf <= 0.5:
            return None

        return ANPREvent(
            event_type="anpr_read",
            camera_id=camera_id,
            track_id=track_id,
            plate_number=best_plate,
            confidence=best_conf,
            timestamp=datetime.now(timezone.utc),
            evidence_crop=plate_crop,
        )
