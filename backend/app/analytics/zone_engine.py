from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from math import hypot
from typing import Iterable

from app.services.tracker import Track


@dataclass(frozen=True)
class Zone:
    zone_id: str
    name: str
    polygon: tuple[tuple[float, float], ...]
    enabled: bool = True


@dataclass(frozen=True)
class VirtualLine:
    line_id: str
    name: str
    start: tuple[float, float]
    end: tuple[float, float]
    enabled: bool = True


@dataclass(frozen=True)
class ZoneEvent:
    event_type: str
    camera_id: str
    track_id: str
    zone_id: str | None
    line_id: str | None
    timestamp: datetime
    explanation: str


@dataclass
class _TrackState:
    previous_center: tuple[float, float] | None = None
    zone_entry_times: dict[str, datetime] | None = None
    last_event_times: dict[str, datetime] | None = None

    def __post_init__(self):
        if self.zone_entry_times is None:
            self.zone_entry_times = {}

        if self.last_event_times is None:
            self.last_event_times = {}


class ZoneEngine:
    """
    IBVAP virtual-fence and movement-event engine.

    Responsibilities:
    - Polygon intrusion detection
    - Persistence / dwell detection
    - Line-crossing detection
    - Event cooldown / deduplication

    This module only analyzes tracked objects.
    It does not perform object detection or tracking.
    """

    def __init__(
        self,
        zones: Iterable[Zone] | None = None,
        lines: Iterable[VirtualLine] | None = None,
        persistence_seconds: float = 2.0,
        cooldown_seconds: float = 10.0,
    ):
        self.zones = {
            zone.zone_id: zone
            for zone in (zones or [])
        }

        self.lines = {
            line.line_id: line
            for line in (lines or [])
        }

        self.persistence_seconds = persistence_seconds
        self.cooldown_seconds = cooldown_seconds

        self._track_states: dict[
            tuple[str, str],
            _TrackState,
        ] = {}

    def analyze(
        self,
        camera_id: str,
        tracks: Iterable[Track],
        now: datetime | None = None,
    ) -> list[ZoneEvent]:
        timestamp = now or datetime.now(timezone.utc)

        events: list[ZoneEvent] = []

        for track in tracks:
            state_key = (camera_id, track.track_id)

            state = self._track_states.setdefault(
                state_key,
                _TrackState(),
            )

            center = self._track_center(track)

            events.extend(
                self._analyze_zones(
                    camera_id,
                    track,
                    center,
                    state,
                    timestamp,
                )
            )

            events.extend(
                self._analyze_lines(
                    camera_id,
                    track,
                    center,
                    state,
                    timestamp,
                )
            )

            state.previous_center = center

        return events

    def _analyze_zones(
        self,
        camera_id: str,
        track: Track,
        center: tuple[float, float],
        state: _TrackState,
        timestamp: datetime,
    ) -> list[ZoneEvent]:
        events: list[ZoneEvent] = []

        for zone in self.zones.values():
            if not zone.enabled or len(zone.polygon) < 3:
                continue

            inside = self._point_in_polygon(
                center,
                zone.polygon,
            )

            if not inside:
                state.zone_entry_times.pop(
                    zone.zone_id,
                    None,
                )
                continue

            if zone.zone_id not in state.zone_entry_times:
                state.zone_entry_times[zone.zone_id] = timestamp
                continue

            entry_time = state.zone_entry_times[zone.zone_id]

            dwell_seconds = (
                timestamp - entry_time
            ).total_seconds()

            if dwell_seconds < self.persistence_seconds:
                continue

            event_key = f"zone_intrusion:{zone.zone_id}"

            if not self._cooldown_expired(
                state,
                event_key,
                timestamp,
            ):
                continue

            state.last_event_times[event_key] = timestamp

            events.append(
                ZoneEvent(
                    event_type="zone_intrusion",
                    camera_id=camera_id,
                    track_id=track.track_id,
                    zone_id=zone.zone_id,
                    line_id=None,
                    timestamp=timestamp,
                    explanation=(
                        f"{track.class_name} remained inside "
                        f"restricted zone '{zone.name}' "
                        f"for {dwell_seconds:.1f} seconds."
                    ),
                )
            )

        return events

    def _analyze_lines(
        self,
        camera_id: str,
        track: Track,
        center: tuple[float, float],
        state: _TrackState,
        timestamp: datetime,
    ) -> list[ZoneEvent]:
        events: list[ZoneEvent] = []

        previous = state.previous_center

        if previous is None:
            return events

        for line in self.lines.values():
            if not line.enabled:
                continue

            previous_side = self._line_side(
                previous,
                line.start,
                line.end,
            )

            current_side = self._line_side(
                center,
                line.start,
                line.end,
            )

            if previous_side == 0 or current_side == 0:
                continue

            crossed = (
                previous_side != current_side
            )

            if not crossed:
                continue

            event_key = f"line_crossing:{line.line_id}"

            if not self._cooldown_expired(
                state,
                event_key,
                timestamp,
            ):
                continue

            state.last_event_times[event_key] = timestamp

            events.append(
                ZoneEvent(
                    event_type="line_crossing",
                    camera_id=camera_id,
                    track_id=track.track_id,
                    zone_id=None,
                    line_id=line.line_id,
                    timestamp=timestamp,
                    explanation=(
                        f"{track.class_name} crossed "
                        f"virtual line '{line.name}'."
                    ),
                )
            )

        return events

    def _cooldown_expired(
        self,
        state: _TrackState,
        event_key: str,
        timestamp: datetime,
    ) -> bool:
        last_event = state.last_event_times.get(event_key)

        if last_event is None:
            return True

        elapsed = (
            timestamp - last_event
        ).total_seconds()

        return elapsed >= self.cooldown_seconds

    @staticmethod
    def _track_center(
        track: Track,
    ) -> tuple[float, float]:
        bbox = track.bbox

        return (
            (bbox.x1 + bbox.x2) / 2.0,
            (bbox.y1 + bbox.y2) / 2.0,
        )

    @staticmethod
    def _point_in_polygon(
        point: tuple[float, float],
        polygon: tuple[tuple[float, float], ...],
    ) -> bool:
        x, y = point
        inside = False

        j = len(polygon) - 1

        for i in range(len(polygon)):
            xi, yi = polygon[i]
            xj, yj = polygon[j]

            intersects = (
                (yi > y) != (yj > y)
                and x
                < (
                    (xj - xi)
                    * (y - yi)
                    / ((yj - yi) or 1e-12)
                    + xi
                )
            )

            if intersects:
                inside = not inside

            j = i

        return inside

    @staticmethod
    def _line_side(
        point: tuple[float, float],
        start: tuple[float, float],
        end: tuple[float, float],
    ) -> int:
        value = (
            (end[0] - start[0])
            * (point[1] - start[1])
            - (end[1] - start[1])
            * (point[0] - start[0])
        )

        if abs(value) < 1e-9:
            return 0

        return 1 if value > 0 else -1

    def remove_track(
        self,
        camera_id: str,
        track_id: str,
    ) -> None:
        self._track_states.pop(
            (camera_id, track_id),
            None,
        )

    def clear_camera(
        self,
        camera_id: str,
    ) -> None:
        keys = [
            key
            for key in self._track_states
            if key[0] == camera_id
        ]

        for key in keys:
            del self._track_states[key]

    def add_zone(self, zone: Zone) -> None:
        self.zones[zone.zone_id] = zone

    def add_line(self, line: VirtualLine) -> None:
        self.lines[line.line_id] = line