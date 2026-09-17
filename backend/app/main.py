from fastapi import FastAPI

from pydantic import BaseModel

from app.services.camera_manager import camera_manager

from app.core.config import APP_NAME, APP_VERSION
from app.schemas.events import HealthResponse, utc_now


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Intelligent Border Video Analytics Platform",
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