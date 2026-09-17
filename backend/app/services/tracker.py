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

    def update(self, detections: list[Detection]) -> list[Track]:
        now = datetime.now(timezone.utc)

        tracks: list[Track] = []

        for detection in detections:
            track = Track(
                track_id=f"TRK-{self._next_id:06d}",
                class_id=detection.class_id,
                class_name=detection.class_name,
                confidence=detection.confidence,
                bbox=detection.bbox,
                first_seen=now,
                last_seen=now,
                metadata=detection.metadata.copy(),
            )

            tracks.append(track)
            self._next_id += 1

        return tracks

    def reset(self) -> None:
        self._next_id = 1