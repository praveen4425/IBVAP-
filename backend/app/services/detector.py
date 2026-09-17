from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Protocol


@dataclass(frozen=True)
class BoundingBox:
    x1: float
    y1: float
    x2: float
    y2: float


@dataclass(frozen=True)
class Detection:
    class_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox
    timestamp: datetime
    metadata: dict[str, Any]


class Detector(Protocol):
    """
    Common contract for every IBVAP object detector.

    Any detector implementation must accept one video frame
    and return a list of Detection objects.
    """

    def detect(self, frame: Any) -> list[Detection]:
        ...


def create_detection(
    class_id: int,
    class_name: str,
    confidence: float,
    bbox: BoundingBox,
    metadata: dict[str, Any] | None = None,
) -> Detection:
    """
    Creates a normalized IBVAP detection object.
    """

    if not 0.0 <= confidence <= 1.0:
        raise ValueError("confidence must be between 0.0 and 1.0")

    return Detection(
        class_id=class_id,
        class_name=class_name,
        confidence=confidence,
        bbox=bbox,
        timestamp=datetime.now(timezone.utc),
        metadata=metadata or {},
    )