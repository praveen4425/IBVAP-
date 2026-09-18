# IBVAP — Intelligent Border Video Analytics Platform

## Project Overview
IBVAP transforms standard IP-based CCTV infrastructure into an intelligent border surveillance network. It eliminates the need for expensive proprietary hardware by applying AI-powered video analytics directly to RTSP video feeds, providing real-time alerts for security incidents and border intrusions.

## Architecture
The system employs a decoupled, pipeline-driven architecture:
1. **Video Ingestion:** `CameraManager` connects to RTSP feeds (via OpenCV).
2. **AI Object Detection:** YOLOv8 via `UltralyticsDetector` wrapped behind a clean interface.
3. **Tracking:** Deterministic SORT tracker (`SortTracker`) to maintain lightweight performance.
4. **Analytics Engines:**
   - `ZoneEngine`: Virtual fence intrusion, line crossing, and area loitering.
   - `TemporalEngine`: Time-based behavioral analytics (loitering).
   - `AnomalyEngine`: PyOD-based Isolation Forest for unusual movement paths.
   - `ANPREngine` & `FaceEngine`: EasyOCR and RetinaFace.
5. **Event & Incident Correlation:** `EventEngine` normalizes signals. `IncidentEngine` correlates related events across time and multiple cameras into actionable incidents.
6. **Persistence & API:** SQLite persistence and FastAPI REST layer.
7. **Frontend:** React + Tailwind dashboard.

## Folder Structure
```text
.antigravity/    - AI agent planning and state logs
backend/         - FastAPI backend, services, analytics engines, and database
css/             - Static CSS
js/              - Static JS
src/             - React Frontend components and views
```

## Installation

### 1. Python Environment (Backend)
Requires Python 3.10+.
```bash
cd backend
pip install -r requirements.txt
pip install ultralytics scipy filterpy lap easyocr retina-face pyod
```

### 2. Node Setup (Frontend)
```bash
npm install
```

## Running the Application

### Demo Mode
We have provided a convenient batch script to start both the backend pipeline (using a webcam or test video) and the frontend dashboard simultaneously:
```cmd
run.bat
```

**Manual Startup:**
Terminal 1 (Backend):
```bash
cd backend
python run_demo.py
```
Terminal 2 (Frontend):
```bash
npm run dev
```

## API Usage
The FastAPI backend serves endpoints at `http://127.0.0.1:8000`:
- `GET /api/incidents` - List correlated security incidents
- `GET /api/events` - List raw security events
- `GET /api/cameras` - Camera health and connectivity status
- `GET /api/ai/status` - Pipeline processing health

## Third-Party Licenses
Please review `THIRD_PARTY_LICENSES.md` for complete licensing information of integrated ML models and algorithms.

## Troubleshooting
- **No Video Feed?** Ensure your webcam is available, or modify `run_demo.py` to point to an MP4 or RTSP stream instead of `"0"`.
- **High CPU/GPU Usage?** The system will attempt to use GPU if PyTorch is configured with CUDA. Otherwise, CPU fallback is used.
