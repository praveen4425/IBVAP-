"""
IBVAP Object Detector — ONNX Runtime backend.

Uses YOLOv8n exported to ONNX format so that PyTorch and Ultralytics are NOT
imported at runtime.  This saves ~170 MB of RAM compared to the PyTorch backend.

Memory profile (approximate, Render free tier):
  Before (PyTorch): ~247 MB baseline + ~160 MB BLAS spike = ~410 MB peak
  After  (ONNX RT): ~80 MB baseline  + ~30 MB spike       = ~110 MB peak
"""
from __future__ import annotations

import threading
from typing import Any

import cv2
import numpy as np

from app.core.detection_config import ALLOWED_CLASSES
from app.services.detector import Detector, Detection, BoundingBox, create_detection

# COCO class names — index matches YOLOv8 output class IDs
_COCO_NAMES: list[str] = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
    "truck", "boat", "traffic light", "fire hydrant", "stop sign",
    "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
    "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella", "handbag",
    "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball", "kite",
    "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana",
    "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza",
    "donut", "cake", "chair", "couch", "potted plant", "bed", "dining table",
    "toilet", "tv", "laptop", "mouse", "remote", "keyboard", "cell phone",
    "microwave", "oven", "toaster", "sink", "refrigerator", "book", "clock",
    "vase", "scissors", "teddy bear", "hair drier", "toothbrush",
]


def _letterbox(
    img: np.ndarray,
    new_shape: tuple[int, int] = (640, 640),
    color: tuple[int, int, int] = (114, 114, 114),
) -> tuple[np.ndarray, float, tuple[int, int]]:
    """Resize + pad to new_shape while preserving aspect ratio."""
    h, w = img.shape[:2]
    r = min(new_shape[0] / h, new_shape[1] / w)
    new_w, new_h = int(round(w * r)), int(round(h * r))
    img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    dw = new_shape[1] - new_w
    dh = new_shape[0] - new_h
    dw, dh = dw / 2, dh / 2
    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    img = cv2.copyMakeBorder(img, top, bottom, left, right,
                             cv2.BORDER_CONSTANT, value=color)
    return img, r, (dw, dh)


def _xywh2xyxy(boxes: np.ndarray) -> np.ndarray:
    """Convert [cx, cy, w, h] → [x1, y1, x2, y2]."""
    out = boxes.copy()
    out[..., 0] = boxes[..., 0] - boxes[..., 2] / 2
    out[..., 1] = boxes[..., 1] - boxes[..., 3] / 2
    out[..., 2] = boxes[..., 0] + boxes[..., 2] / 2
    out[..., 3] = boxes[..., 1] + boxes[..., 3] / 2
    return out


def _nms(boxes: np.ndarray, scores: np.ndarray, iou_threshold: float = 0.45) -> list[int]:
    """Pure-numpy NMS."""
    x1, y1, x2, y2 = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]
    keep: list[int] = []
    while order.size:
        i = order[0]
        keep.append(int(i))
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        inter = np.maximum(0.0, xx2 - xx1) * np.maximum(0.0, yy2 - yy1)
        iou = inter / (areas[i] + areas[order[1:]] - inter + 1e-6)
        order = order[np.where(iou <= iou_threshold)[0] + 1]
    return keep


class OnnxDetector(Detector):
    """
    YOLOv8n detector backed by ONNX Runtime (no PyTorch / Ultralytics at runtime).
    """

    def __init__(
        self,
        model_path: str = "yolov8n.onnx",
        conf_thresh: float = 0.45,
        iou_thresh: float = 0.45,
        input_size: int = 640,
    ) -> None:
        import onnxruntime as ort

        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 1
        opts.inter_op_num_threads = 1
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        self._session = ort.InferenceSession(
            model_path,
            sess_options=opts,
            providers=["CPUExecutionProvider"],
        )
        self._input_name: str = self._session.get_inputs()[0].name
        self._conf_thresh = conf_thresh
        self._iou_thresh = iou_thresh
        self._input_size = input_size
        self._lock = threading.Lock()

    def detect(self, frame: Any) -> list[Detection]:
        img_h, img_w = frame.shape[:2]

        # Pre-process
        img, ratio, (dw, dh) = _letterbox(frame, (self._input_size, self._input_size))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = img.astype(np.float32) / 255.0
        img = img.transpose(2, 0, 1)[np.newaxis]  # (1, 3, H, W)

        # Inference
        with self._lock:
            raw = self._session.run(None, {self._input_name: img})[0]  # (1, 84, 8400)

        preds = raw[0].T  # (8400, 84)
        box_raw = preds[:, :4]
        scores_all = preds[:, 4:]

        class_ids = scores_all.argmax(axis=1)
        confidences = scores_all[np.arange(len(class_ids)), class_ids]

        # Confidence filter
        mask = confidences >= self._conf_thresh
        box_raw = box_raw[mask]
        confidences = confidences[mask]
        class_ids = class_ids[mask]

        if len(box_raw) == 0:
            return []

        # Convert cx,cy,w,h → x1,y1,x2,y2 in letterboxed space
        boxes_xyxy = _xywh2xyxy(box_raw)

        # NMS
        keep = _nms(boxes_xyxy, confidences, self._iou_thresh)
        boxes_xyxy = boxes_xyxy[keep]
        confidences = confidences[keep]
        class_ids = class_ids[keep]

        detections: list[Detection] = []
        for i in range(len(keep)):
            cls_id = int(class_ids[i])
            cls_name = _COCO_NAMES[cls_id] if cls_id < len(_COCO_NAMES) else str(cls_id)
            if cls_name.lower() not in ALLOWED_CLASSES:
                continue

            # Unscale letterbox → original image coords
            x1 = (boxes_xyxy[i, 0] - dw) / ratio
            y1 = (boxes_xyxy[i, 1] - dh) / ratio
            x2 = (boxes_xyxy[i, 2] - dw) / ratio
            y2 = (boxes_xyxy[i, 3] - dh) / ratio

            # Clamp
            x1, x2 = max(0.0, x1), min(float(img_w), x2)
            y1, y2 = max(0.0, y1), min(float(img_h), y2)

            detections.append(create_detection(
                class_id=cls_id,
                class_name=cls_name.upper(),
                confidence=float(confidences[i]),
                bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
            ))

        return detections


# ---------------------------------------------------------------------------
# Process-wide singleton — one ONNX session shared across all requests.
# ---------------------------------------------------------------------------
_shared_detector: OnnxDetector | None = None
_shared_detector_lock = threading.Lock()


def get_shared_detector(
    model_path: str = "yolov8n.onnx",
    conf_thresh: float = 0.45,
) -> OnnxDetector:
    global _shared_detector
    if _shared_detector is None:
        with _shared_detector_lock:
            if _shared_detector is None:
                _shared_detector = OnnxDetector(
                    model_path=model_path,
                    conf_thresh=conf_thresh,
                )
    return _shared_detector


# Keep old name as alias so any leftover imports don't break.
UltralyticsDetector = OnnxDetector
