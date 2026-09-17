from __future__ import annotations

from typing import Any

from app.services.detector import (
    BoundingBox,
    Detection,
    Detector,
    create_detection,
)


class FakeDetector:
    """
    Development-only detector.

    It does not perform AI inference.
    It exists only to verify the IBVAP detector contract
    before connecting a real model.
    """

    def detect(self, frame: Any) -> list[Detection]:
        if frame is None:
            return []

        height, width = frame.shape[:2]

        return [
            create_detection(
                class_id=0,
                class_name="person",
                confidence=0.95,
                bbox=BoundingBox(
                    x1=width * 0.25,
                    y1=height * 0.20,
                    x2=width * 0.45,
                    y2=height * 0.85,
                ),
                metadata={
                    "source": "fake_detector",
                },
            )
        ]


def create_fake_detector() -> Detector:
    return FakeDetector()