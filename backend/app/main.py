from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.background import BackgroundTasks

from pydantic import BaseModel

from app.services.camera_manager import camera_manager

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
)


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Intelligent Border Video Analytics Platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/api/evidence/{evidence_id}")
def get_evidence(evidence_id: str):
    # For MVP, mock fetching from db/service
    return {"evidence_id": evidence_id, "status": "available"}

@app.get("/api/anpr")
def get_anpr():
    return [
        event
        for event in event_engine.get_all_events()
        if event.event_type.value in {"anpr_read", "anpr_detected"}
    ]

@app.get("/api/face-analytics")
def get_face_analytics():
    return []

@app.get("/api/ai/status")
def ai_status():
    return ai_pipeline_manager.get_all_status()

@app.get("/api/ai/detections/{camera_id}")
def get_detections(camera_id: str):
    return ai_pipeline_manager.get_detections(camera_id)