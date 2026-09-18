from dataclasses import dataclass
from datetime import datetime, timezone
import numpy as np

from app.services.tracker import Track

@dataclass(frozen=True)
class AnomalyEvent:
    event_type: str
    camera_id: str
    track_id: str
    timestamp: datetime
    anomaly_score: float
    explanation: str

class AnomalyEngine:
    """
    Lightweight anomaly detection using Isolation Forest (via PyOD if available).
    """
    def __init__(self, score_threshold: float = 0.7):
        self.score_threshold = score_threshold
        self.clf = None
        try:
            from pyod.models.iforest import IForest
            self.clf = IForest(contamination=0.1, random_state=42)
            self.is_trained = False
            self.buffer = []
        except ImportError:
            self.clf = None

    def add_training_data(self, features: list[float]):
        if self.clf is not None:
            self.buffer.append(features)
            if len(self.buffer) >= 50 and not self.is_trained:
                self.clf.fit(np.array(self.buffer))
                self.is_trained = True

    def analyze(self, camera_id: str, track: Track, features: list[float], now: datetime = None) -> list[AnomalyEvent]:
        """
        Features might include: [dwell_seconds, path_length, average_speed]
        """
        if self.clf is None or not self.is_trained:
            return []
            
        timestamp = now or datetime.now(timezone.utc)
        X = np.array([features])
        
        # decision_function returns anomaly scores (larger = more anomalous)
        # However, predict_proba might be better, we'll use decision_function normalized or just predict.
        is_anomaly = self.clf.predict(X)[0]
        score = self.clf.decision_function(X)[0]
        
        # normalize score to 0-1 loosely for the MVP
        norm_score = min(max((score + 0.5) / 1.0, 0.0), 1.0)
        
        if is_anomaly == 1 and norm_score >= self.score_threshold:
            return [
                AnomalyEvent(
                    event_type="behavior_anomaly",
                    camera_id=camera_id,
                    track_id=track.track_id,
                    timestamp=timestamp,
                    anomaly_score=norm_score,
                    explanation=f"Unusual movement pattern detected (score: {norm_score:.2f})."
                )
            ]
        return []
