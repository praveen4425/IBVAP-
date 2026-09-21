from __future__ import annotations

import threading
from typing import Any
from pathlib import Path

from app.core.config import BASE_DIR, EVIDENCE_DIR

MODEL_PATH = BASE_DIR / "yolov8n.onnx"

# ---------------------------------------------------------------------------
# Live-results store (written by the AI camera pipeline, read by /api/video/live)
# ---------------------------------------------------------------------------

_live_results_lock = threading.Lock()
_live_results: dict[str, Any] = {
    "job_id": None,
    "state": "idle",
    "detections": [],
}


def get_live_results() -> dict[str, Any]:
    with _live_results_lock:
        return dict(_live_results)


def _update_live_results(source_id: str, state: str, detections: list[Any]) -> None:
    with _live_results_lock:
        _live_results.update(
            {
                "job_id": source_id,
                "state": state,
                "detections": [
                    {
                        "class_name": detection.class_name,
                        "confidence": detection.confidence,
                        "bbox": {
                            "x1": detection.bbox.x1,
                            "y1": detection.bbox.y1,
                            "x2": detection.bbox.x2,
                            "y2": detection.bbox.y2,
                        },
                    }
                    for detection in detections
                ],
            }
        )
