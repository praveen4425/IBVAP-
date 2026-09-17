from __future__ import annotations

from datetime import datetime, timezone
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
        events: list[ZoneEvent],
    ) -> list[SecurityEvent]:
        security_events: list[SecurityEvent] = []

        for event in events:
            security_event = self._convert_zone_event(event)

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
    def _convert_zone_event(
        event: ZoneEvent,
    ) -> SecurityEvent:
        event_type = EventType(event.event_type)

        severity = EventEngine._calculate_severity(
            event_type
        )

        return SecurityEvent(
            event_id=f"EVT-{uuid4().hex[:12].upper()}",
            event_type=event_type,
            camera_id=event.camera_id,
            track_ids=[event.track_id],
            timestamp_start=event.timestamp,
            timestamp_end=None,
            confidence=1.0,
            severity=severity,
            zone_id=event.zone_id,
            evidence_refs=[],
            explanation=event.explanation,
            lifecycle_status=EventStatus.NEW,
            metadata={
                "line_id": event.line_id,
                "source": "zone_engine",
            },
        )

    @staticmethod
    def _calculate_severity(
        event_type: EventType,
    ) -> Severity:
        """
        Initial deterministic severity mapping.

        This is intentionally conservative. Later the Incident
        Engine will combine multiple signals before assigning
        final incident priority.
        """

        if event_type == EventType.ZONE_INTRUSION:
            return Severity.P2_MEDIUM

        if event_type == EventType.LINE_CROSSING:
            return Severity.P3_LOW

        if event_type == EventType.WRONG_DIRECTION:
            return Severity.P2_MEDIUM

        if event_type == EventType.RESTRICTED_VEHICLE:
            return Severity.P2_MEDIUM

        if event_type == EventType.DWELL_EXCEEDED:
            return Severity.P2_MEDIUM

        return Severity.P4_INFO


event_engine = EventEngine()