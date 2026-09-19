from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.analytics.zone_engine import ZoneEvent
from app.schemas.events import (
    EventStatus,
    EventType,
    SecurityEvent,
    Severity,
)


class EventEngine:
    """
    Converts analytics-level events into standardized IBVAP
    SecurityEvent objects.

    Analytics modules should not decide how events are stored
    or exposed to the frontend. They only report observations.
    """

    def __init__(self):
        self._events: dict[str, SecurityEvent] = {}

    def process_zone_events(
        self,
        events: list[Any],
    ) -> list[SecurityEvent]:
        security_events: list[SecurityEvent] = []

        for event in events:
            security_event = self._convert_event(event)
            self._events[security_event.event_id] = security_event
            security_events.append(security_event)

        return security_events

    def process_events(
        self,
        events: list[Any],
    ) -> list[SecurityEvent]:
        security_events: list[SecurityEvent] = []

        for event in events:
            security_event = self._convert_event(event)
            self._events[security_event.event_id] = security_event
            security_events.append(security_event)

        return security_events

    def get_event(
        self,
        event_id: str,
    ) -> SecurityEvent | None:
        return self._events.get(event_id)

    def get_all_events(self) -> list[SecurityEvent]:
        return list(self._events.values())

    def acknowledge_event(
        self,
        event_id: str,
    ) -> SecurityEvent | None:
        event = self._events.get(event_id)

        if event is None:
            return None

        event.lifecycle_status = EventStatus.ACKNOWLEDGED
        return event

    def resolve_event(
        self,
        event_id: str,
    ) -> SecurityEvent | None:
        event = self._events.get(event_id)

        if event is None:
            return None

        event.lifecycle_status = EventStatus.RESOLVED
        return event

    def clear(self) -> None:
        self._events.clear()

    @staticmethod
    def _convert_event(
        event: Any,
    ) -> SecurityEvent:
        event_type_str = getattr(event, "event_type", "unknown")
        
        try:
            event_type = EventType(event_type_str)
        except ValueError:
            # Unmapped event type — treat as informational
            event_type = EventType.ANOMALY

        severity = EventEngine._calculate_severity(
            event_type_str
        )

        zone_id = getattr(event, "zone_id", None)
        line_id = getattr(event, "line_id", None)
        
        metadata = {
            "source": event.__class__.__name__,
            "detected_object": getattr(event, "object_class", None),
            "detection_confidence": getattr(event, "confidence", 1.0),
        }
        if line_id:
            metadata["line_id"] = line_id
            
        if getattr(event, "plate_number", None):
            metadata["plate_number"] = event.plate_number
        if getattr(event, "anomaly_score", None):
            metadata["anomaly_score"] = event.anomaly_score
            
        # Mocking evidence references for hackathon
        evidence_refs = []
        if getattr(event, "evidence_crop", None) is not None:
            evidence_refs = ["EV-CROP"]

        return SecurityEvent(
            event_id=f"EVT-{uuid4().hex[:12].upper()}",
            event_type=event_type,
            camera_id=event.camera_id,
            track_ids=[event.track_id] if hasattr(event, "track_id") else [],
            timestamp_start=event.timestamp,
            timestamp_end=None,
            confidence=getattr(event, "confidence", 1.0),
            severity=severity,
            zone_id=zone_id,
            evidence_refs=evidence_refs,
            explanation=getattr(event, "explanation", "Unknown event occurred"),
            lifecycle_status=EventStatus.NEW,
            metadata=metadata,
        )

    @staticmethod
    def _calculate_severity(
        event_type: str,
    ) -> Severity:
        """
        Initial deterministic severity mapping.
        """
        event_type = event_type.lower()
        if event_type == "zone_intrusion":
            return Severity.P2_MEDIUM
        if event_type == "line_crossing":
            return Severity.P3_LOW
        if event_type == "wrong_direction":
            return Severity.P2_MEDIUM
        if event_type == "restricted_vehicle":
            return Severity.P2_MEDIUM
        if event_type == "dwell_exceeded":
            return Severity.P2_MEDIUM
        if event_type == "loitering":
            return Severity.P2_MEDIUM
        if event_type == "behavior_anomaly":
            return Severity.P3_LOW
        if event_type in {"anpr_read", "anpr_detected"}:
            return Severity.P4_INFO
        if event_type == "face_detected":
            return Severity.P4_INFO

        return Severity.P4_INFO

event_engine = EventEngine()