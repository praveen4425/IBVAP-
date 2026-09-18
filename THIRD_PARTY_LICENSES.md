# IBVAP Third-Party Licenses

This file documents the open-source libraries and models integrated into the Intelligent Border Video Analytics Platform (IBVAP), along with their licenses.

## 1. Ultralytics YOLO (Object Detection)
- **Repository:** https://github.com/ultralytics/ultralytics
- **License:** AGPL-3.0
- **Usage:** Used strictly behind the decoupled `Detector` interface (`app.services.ultralytics_detector.UltralyticsDetector`) to perform raw bounding-box detection.

## 2. EasyOCR (ANPR / Text Recognition)
- **Repository:** https://github.com/JaidedAI/EasyOCR
- **License:** Apache-2.0
- **Usage:** Used in `anpr_engine.py` for text extraction from vehicle plate crops.

## 3. RetinaFace (Face Detection)
- **Repository:** https://github.com/serengil/retinaface
- **License:** MIT
- **Usage:** Used in `face_engine.py` to localize faces and landmarks.

## 4. PyOD (Anomaly Detection)
- **Repository:** https://github.com/yzhao062/pyod
- **License:** BSD 2-Clause
- **Usage:** Used in `anomaly_engine.py` (Isolation Forest) to detect unusual movement patterns.

## 5. SciPy & FilterPy (Tracking)
- **Licenses:** BSD
- **Usage:** `scipy.optimize.linear_sum_assignment` used in `sort_tracker.py` for deterministic Hungarian matching.

## 6. OpenCV (Video Ingestion)
- **License:** Apache-2.0
- **Usage:** Used in `camera_manager.py` for RTSP stream decoding.

*Note: No duplicate implementations of trackers or detectors were retained in the final architecture to keep the MVP lightweight and explainable.*
