from fastapi import FastAPI

from pydantic import BaseModel

from app.services.camera_manager import camera_manager

from app.core.config import APP_NAME, APP_VERSION
from app.schemas.events import HealthResponse, utc_now


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
    return []

@app.get("/api/face-analytics")
def get_face_analytics():
    return []

@app.get("/api/ai/status")
def ai_status():
    return ai_pipeline_manager.get_all_status()

@app.get("/api/ai/detections/{camera_id}")
def get_detections(camera_id: str):
    return ai_pipeline_manager.get_detections(camera_id)