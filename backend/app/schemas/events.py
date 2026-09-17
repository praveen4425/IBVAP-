from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class EventType(str, Enum):
    ZONE_INTRUSION = "zone_intrusion"
    LINE_CROSSING = "line_crossing"
    WRONG_DIRECTION = "wrong_direction"
    RESTRICTED_VEHICLE = "restricted_vehicle"
    DWELL_STARTED = "dwell_started"
    DWELL_EXCEEDED = "dwell_exceeded"
    ANOMALY = "anomaly"
    ANPR_DETECTED = "anpr_detected"
    FACE_DETECTED = "face_detected"


class Severity(str, Enum):
    P4_INFO = "P4_INFO"
    P3_LOW = "P3_LOW"
    P2_MEDIUM = "P2_MEDIUM"
    P1_HIGH = "P1_HIGH"
    P0_CRITICAL = "P0_CRITICAL"


class EventStatus(str, Enum):
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class SecurityEvent(BaseModel):
    event_id: str
    event_type: EventType

    camera_id: str
    track_ids: list[str] = Field(default_factory=list)

    timestamp_start: datetime
    timestamp_end: datetime | None = None

    confidence: float = Field(ge=0.0, le=1.0)
    severity: Severity

    zone_id: str | None = None

    evidence_refs: list[str] = Field(default_factory=list)

    explanation: str

    lifecycle_status: EventStatus = EventStatus.NEW

    metadata: dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime


def utc_now() -> datetime:
    return datetime.now(timezone.utc)