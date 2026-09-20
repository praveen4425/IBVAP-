from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Protocol

from app.services.detector import BoundingBox, Detection


@dataclass
class Track:
    track_id: str
    class_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox

    first_seen: datetime
    last_seen: datetime

    age: int = 1
    metadata: dict[str, Any] = field(default_factory=dict)


class Tracker(Protocol):
    """
    Common contract for every IBVAP multi-object tracker.
    """

    def update(self, detections: list[Detection]) -> list[Track]:
        ...

    def reset(self) -> None:
        ...


class BasicTracker:
    """
    Temporary deterministic tracker implementation.

    This is NOT the final tracking algorithm.
    It exists only so downstream modules can be developed
    against the Tracker contract before ByteTrack is integrated.
    """

    def __init__(self):
        self._next_id = 1
        self._previous_tracks: list[Track] = []

    def update(self, detections: list[Detection]) -> list[Track]:
        now = datetime.now(timezone.utc)

        tracks: list[Track] = []

        for detection in detections:
            match = self._best_match(detection)
            track_id = match.track_id if match is not None else f"TRK-{self._next_id:06d}"
            if match is None:
                self._next_id += 1
            track = Track(
                track_id=track_id,
                class_id=detection.class_id,
                class_name=detection.class_name,
                confidence=detection.confidence,
                bbox=detection.bbox,
                first_seen=match.first_seen if match is not None else now,
                last_seen=now,
                age=(match.age + 1) if match is not None else 1,
                metadata=detection.metadata.copy(),
            )

            tracks.append(track)
        self._previous_tracks = tracks

        return tracks

    def reset(self) -> None:
        self._next_id = 1
        self._previous_tracks = []

    def _best_match(self, detection: Detection) -> Track | None:
        candidates = [
            track
            for track in self._previous_tracks
            if track.class_id == detection.class_id
        ]
        if not candidates:
            return None

        match = max(candidates, key=lambda track: self._iou(track.bbox, detection.bbox))
        return match if self._iou(match.bbox, detection.bbox) >= 0.3 else None

    @staticmethod
    def _iou(first: BoundingBox, second: BoundingBox) -> float:
        left = max(first.x1, second.x1)
        top = max(first.y1, second.y1)
        right = min(first.x2, second.x2)
        bottom = min(first.y2, second.y2)
        intersection = max(0.0, right - left) * max(0.0, bottom - top)
        first_area = max(0.0, first.x2 - first.x1) * max(0.0, first.y2 - first.y1)
        second_area = max(0.0, second.x2 - second.x1) * max(0.0, second.y2 - second.y1)
        union = first_area + second_area - intersection
        return intersection / union if union else 0.0
