from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.schemas.events import EventStatus, SecurityEvent, Severity


@dataclass
class Incident:
    incident_id: str
    event_ids: list[str]
    camera_ids: list[str]
    track_ids: list[str]

    timestamp_start: datetime
    timestamp_end: datetime

    severity: Severity
    lifecycle_status: EventStatus

    explanation: str
    correlation_score: float

    metadata: dict = field(default_factory=dict)


class IncidentEngine:
    """
    Correlates individual SecurityEvents into higher-level
    security incidents.

    The engine intentionally uses deterministic rules so that
    every incident can be explained to a human operator.
    """

    CORRELATION_WINDOW_SECONDS = 30

    SEVERITY_WEIGHT = {
        Severity.P4_INFO: 0,
        Severity.P3_LOW: 1,
        Severity.P2_MEDIUM: 2,
        Severity.P1_HIGH: 3,
        Severity.P0_CRITICAL: 4,
    }

    def __init__(self):
        self._incidents: dict[str, Incident] = {}

    def process_events(
        self,
        events: list[SecurityEvent],
    ) -> list[Incident]:
        if not events:
            return []

        ordered_events = sorted(
            events,
            key=lambda event: event.timestamp_start,
        )

        groups: list[list[SecurityEvent]] = []

        for event in ordered_events:
            matching_group = self._find_matching_group(
                event,
                groups,
            )

            if matching_group is None:
                groups.append([event])
            else:
                matching_group.append(event)

        incidents: list[Incident] = []

        for group in groups:
            incident = self._build_incident(group)

            self._incidents[incident.incident_id] = incident
            incidents.append(incident)

        return incidents

    def get_incident(
        self,
        incident_id: str,
    ) -> Incident | None:
        return self._incidents.get(incident_id)

    def get_all_incidents(self) -> list[Incident]:
        return list(self._incidents.values())

    def acknowledge_incident(
        self,
        incident_id: str,
    ) -> Incident | None:
        incident = self._incidents.get(incident_id)

        if incident is None:
            return None

        incident.lifecycle_status = EventStatus.ACKNOWLEDGED
        return incident

    def resolve_incident(
        self,
        incident_id: str,
    ) -> Incident | None:
        incident = self._incidents.get(incident_id)

        if incident is None:
            return None

        incident.lifecycle_status = EventStatus.RESOLVED
        return incident

    def clear(self) -> None:
        self._incidents.clear()

    def _find_matching_group(
        self,
        event: SecurityEvent,
        groups: list[list[SecurityEvent]],
    ) -> list[SecurityEvent] | None:

        for group in groups:
            if self._events_correlate(event, group):
                return group

        return None

    def _events_correlate(
        self,
        event: SecurityEvent,
        group: list[SecurityEvent],
    ) -> bool:

        latest_event = max(
            group,
            key=lambda item: item.timestamp_start,
        )

        time_difference = abs(
            (
                event.timestamp_start
                - latest_event.timestamp_start
            ).total_seconds()
        )

        if time_difference > self.CORRELATION_WINDOW_SECONDS:
            return False

        # Same tracked object = strong correlation.
        if set(event.track_ids) & self._group_track_ids(group):
            return True

        # Same camera + nearby timestamp = useful correlation.
        if event.camera_id in self._group_camera_ids(group):
            return True

        # Different cameras can still be correlated when
        # their events happen within the same short window.
        return time_difference <= 10

    @staticmethod
    def _group_track_ids(
        group: list[SecurityEvent],
    ) -> set[str]:
        track_ids: set[str] = set()

        for event in group:
            track_ids.update(event.track_ids)

        return track_ids

    @staticmethod
    def _group_camera_ids(
        group: list[SecurityEvent],
    ) -> set[str]:
        return {
            event.camera_id
            for event in group
        }

    def _build_incident(
        self,
        events: list[SecurityEvent],
    ) -> Incident:

        event_ids = [
            event.event_id
            for event in events
        ]

        camera_ids = sorted({
            event.camera_id
            for event in events
        })

        track_ids = sorted(
            self._group_track_ids(events)
        )

        timestamp_start = min(
            event.timestamp_start
            for event in events
        )

        timestamp_end = max(
            event.timestamp_end or event.timestamp_start
            for event in events
        )

        severity = max(
            (event.severity for event in events),
            key=lambda value: self.SEVERITY_WEIGHT[value],
        )

        correlation_score = self._calculate_correlation_score(
            events
        )

        explanation = self._build_explanation(
            events,
            camera_ids,
            track_ids,
        )

        return Incident(
            incident_id=f"INC-{uuid4().hex[:12].upper()}",
            event_ids=event_ids,
            camera_ids=camera_ids,
            track_ids=track_ids,
            timestamp_start=timestamp_start,
            timestamp_end=timestamp_end,
            severity=severity,
            lifecycle_status=EventStatus.NEW,
            explanation=explanation,
            correlation_score=correlation_score,
            metadata={
                "event_count": len(events),
                "camera_count": len(camera_ids),
                "source": "incident_engine",
            },
        )

    @staticmethod
    def _calculate_correlation_score(
        events: list[SecurityEvent],
    ) -> float:

        if not events:
            return 0.0

        score = 0.0

        # More independent observations increase confidence.
        score += min(len(events) / 4.0, 1.0) * 0.40

        # Multiple cameras provide cross-camera context.
        camera_count = len({
            event.camera_id
            for event in events
        })

        score += min(camera_count / 3.0, 1.0) * 0.30

        # Shared track identity is a strong signal.
        track_sets = [
            set(event.track_ids)
            for event in events
            if event.track_ids
        ]

        shared_track = False

        if len(track_sets) >= 2:
            first = track_sets[0]

            for track_set in track_sets[1:]:
                if first & track_set:
                    shared_track = True
                    break

        if shared_track:
            score += 0.30

        return round(min(score, 1.0), 3)

    @staticmethod
    def _build_explanation(
        events: list[SecurityEvent],
        camera_ids: list[str],
        track_ids: list[str],
    ) -> str:

        event_types = sorted({
            event.event_type.value
            for event in events
        })

        if len(camera_ids) > 1:
            location_text = (
                f"activity correlated across "
                f"{len(camera_ids)} cameras"
            )
        else:
            location_text = (
                f"activity detected on camera "
                f"{camera_ids[0]}"
            )

        track_text = ""

        if track_ids:
            track_text = (
                f" involving {len(track_ids)} tracked object(s)"
            )

        return (
            f"{location_text}{track_text}. "
            f"Observed event types: "
            f"{', '.join(event_types)}."
        )


incident_engine = IncidentEngine()