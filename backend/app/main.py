from pathlib import Path
from functools import lru_cache

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.background import BackgroundTasks

from pydantic import BaseModel

from app.services.camera_manager import camera_manager
from app.analytics.anpr_engine import ANPREngine
from app.services.ultralytics_detector import UltralyticsDetector

from app.core.config import APP_NAME, APP_VERSION
from app.schemas.events import HealthResponse, utc_now
from app.services.video_processing import (
    MAX_UPLOAD_BYTES,
    UPLOAD_DIR,
    VIDEO_EXTENSIONS,
    VIDEO_DIR,
    create_job,
    get_job,
    process_video,
    get_live_results,
    MODEL_PATH,
)


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Intelligent Border Video Analytics Platform",
)

import os
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000"
]
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    origins.extend([url.strip() for url in frontend_url.split(",") if url.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": APP_NAME,
        "version": APP_VERSION,
        "status": "running",
    }


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="healthy",
        service=APP_NAME,
        timestamp=utc_now(),
    )


@app.post("/api/video/upload")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    filename = Path(file.filename or "").name
    extension = Path(filename).suffix.lower()
    if not filename or extension not in VIDEO_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Supported video formats: MP4, AVI, MOV, MKV")

    job = create_job(filename)
    input_path = UPLOAD_DIR / f"{job.job_id}{extension}"
    bytes_written = 0
    try:
        with input_path.open("wb") as destination:
            while chunk := await file.read(1024 * 1024):
                bytes_written += len(chunk)
                if bytes_written > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="Video exceeds the 500 MB upload limit")
                destination.write(chunk)
    except HTTPException:
        input_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        input_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Upload failed: {exc}") from exc
    finally:
        await file.close()

    background_tasks.add_task(process_video, job.job_id, input_path)
    return job.public()


@app.get("/api/video/jobs/{job_id}")
def video_job_status(job_id: str):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Video job not found")
    return job.public()


@app.get("/api/video/jobs/{job_id}/output")
def video_job_output(job_id: str):
    job = get_job(job_id)
    if job is None or job.state != "completed":
        raise HTTPException(status_code=404, detail="Processed video is not available")
    output_path = VIDEO_DIR / f"{job_id}.mp4"
    if not output_path.is_file():
        raise HTTPException(status_code=404, detail="Processed video is not available")
    return FileResponse(output_path, media_type="video/mp4", filename=f"{job.filename}.annotated.mp4")


@app.get("/api/video/live")
def video_live_results():
    return get_live_results()

class CameraRequest(BaseModel):
    camera_id: str
    name: str
    stream_url: str


@app.post("/api/cameras")
def add_camera(camera: CameraRequest):
    status = camera_manager.add_camera(
        camera_id=camera.camera_id,
        name=camera.name,
        stream_url=camera.stream_url,
    )

    return status


@app.get("/api/cameras")
def list_cameras():
    return camera_manager.get_all_status()


@app.get("/api/cameras/{camera_id}")
def camera_status(camera_id: str):
    status = camera_manager.get_status(camera_id)

    if status is None:
        return {
            "error": "Camera not found"
        }

    return status

from app.services.event_engine import event_engine
from app.services.incident_engine import incident_engine
from app.services.evidence_service import evidence_service
from app.services.ai_pipeline import ai_pipeline_manager

@app.get("/api/events")
def list_events():
    return event_engine.get_all_events()

@app.get("/api/events/{event_id}")
def get_event(event_id: str):
    return event_engine.get_event(event_id)

@app.post("/api/events/{event_id}/acknowledge")
def ack_event(event_id: str):
    return event_engine.acknowledge_event(event_id)

@app.post("/api/events/{event_id}/resolve")
def resolve_event(event_id: str):
    return event_engine.resolve_event(event_id)

@app.get("/api/incidents")
def list_incidents():
    return incident_engine.get_all_incidents()

@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str):
    return incident_engine.get_incident(incident_id)

@app.post("/api/incidents/{incident_id}/acknowledge")
def ack_incident(incident_id: str):
    return incident_engine.acknowledge_incident(incident_id)

@app.post("/api/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: str):
    return incident_engine.resolve_incident(incident_id)

@app.get('/api/evidence')
def list_evidence():
    from app.storage.database import database_service
    return database_service.get_evidence()

@app.get('/api/evidence/{evidence_id}')
def get_evidence(evidence_id: str):
    return {"evidence_id": evidence_id, "status": "available"}

@app.get("/api/evidence/download/{evidence_id}")
def download_evidence(evidence_id: str):
    from app.storage.database import database_service
    from fastapi.responses import FileResponse
    ev_list = database_service.get_evidence()
    ev = next((e for e in ev_list if e["evidence_id"] == evidence_id), None)
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return FileResponse(ev["path"])


@app.get("/api/anpr")
def get_anpr():
    return [
        event
        for event in event_engine.get_all_events()
        if event.event_type.value in {"anpr_read", "anpr_detected"}
    ]


@lru_cache(maxsize=1)
def _get_anpr_components():
    return UltralyticsDetector(str(MODEL_PATH)), ANPREngine()


@app.post("/api/anpr")
async def analyze_anpr(file: UploadFile = File(...)):
    image_bytes = await file.read()
    await file.close()
    frame = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Uploaded file is not a readable image")

    detector, anpr_engine = _get_anpr_components()
    vehicle_detections = [
        detection
        for detection in detector.detect(frame)
        if detection.class_name.lower() in {"car", "motorcycle", "bus", "truck"}
    ]
    if not vehicle_detections:
        return {"plate_number": None, "confidence": 0.0, "vehicle_detected": False}

    event = anpr_engine.analyze_once(
        camera_id="anpr-upload",
        track_id="ANPR-1",
        frame=frame,
        bbox=vehicle_detections[0].bbox,
    )
    if event is None:
        return {"plate_number": None, "confidence": 0.0, "vehicle_detected": True}

    return {
        "plate_number": event.plate_number,
        "confidence": event.confidence,
        "vehicle_detected": True,
        "vehicle_class": vehicle_detections[0].class_name,
    }

@app.get("/api/face-analytics")
def get_face_analytics():
    return []

@app.get("/api/ai/status")
def ai_status():
    return ai_pipeline_manager.get_all_status()

@app.get("/api/ai/detections/{camera_id}")
def get_detections(camera_id: str):
    return ai_pipeline_manager.get_detections(camera_id)
