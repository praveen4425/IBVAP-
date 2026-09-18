from dataclasses import dataclass
from datetime import datetime, timezone
import math
from typing import Iterable
from collections import deque

from app.services.tracker import Track

@dataclass(frozen=True)
class TemporalEvent:
    event_type: str
    camera_id: str
    track_id: str
    timestamp: datetime
    explanation: str

@dataclass
class _TrackHistory:
    positions: deque
    last_event_times: dict[str, datetime]

class TemporalEngine:
    """
    Detects temporal behaviors like general loitering and sudden direction changes.
    """
    def __init__(
        self,
        history_size: int = 30,
        loitering_distance_threshold: float = 20.0,
        loitering_time_seconds: float = 15.0,
        cooldown_seconds: float = 10.0,
    ):
        self.history_size = history_size
        self.loitering_distance_threshold = loitering_distance_threshold
        self.loitering_time_seconds = loitering_time_seconds
        self.cooldown_seconds = cooldown_seconds
        self._history: dict[tuple[str, str], _TrackHistory] = {}

    def analyze(self, camera_id: str, tracks: Iterable[Track], now: datetime = None) -> list[TemporalEvent]:
        timestamp = now or datetime.now(timezone.utc)
        events = []
        
        for track in tracks:
            key = (camera_id, track.track_id)
            if key not in self._history:
                self._history[key] = _TrackHistory(
                    positions=deque(maxlen=self.history_size),
                    last_event_times={}
                )
            
            history = self._history[key]
            center = ((track.bbox.x1 + track.bbox.x2) / 2.0, (track.bbox.y1 + track.bbox.y2) / 2.0)
            history.positions.append((timestamp, center))
            
            # Check loitering
            if len(history.positions) > 1:
                first_time, first_pos = history.positions[0]
                elapsed = (timestamp - first_time).total_seconds()
                
                if elapsed >= self.loitering_time_seconds:
                    dist = math.hypot(center[0] - first_pos[0], center[1] - first_pos[1])
                    if dist < self.loitering_distance_threshold:
                        if self._cooldown_expired(history, "loitering", timestamp):
                            history.last_event_times["loitering"] = timestamp
                            events.append(
                                TemporalEvent(
                                    event_type="loitering",
                                    camera_id=camera_id,
                                    track_id=track.track_id,
                                    timestamp=timestamp,
                                    explanation=f"{track.class_name} has been loitering for {elapsed:.1f} seconds."
                                )
                            )

        return events

    def _cooldown_expired(self, history: _TrackHistory, event_key: str, timestamp: datetime) -> bool:
        last_event = history.last_event_times.get(event_key)
        if last_event is None:
            return True
        return (timestamp - last_event).total_seconds() >= self.cooldown_seconds

    def remove_track(self, camera_id: str, track_id: str) -> None:
        self._history.pop((camera_id, track_id), None)
