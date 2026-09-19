from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import cv2


class EvidenceService:
    """
    Handles incident evidence storage and integrity metadata.

    Raw video recording is NOT duplicated here.
    The service stores selected snapshots/clips associated
    with security events and incidents.
    """

    def __init__(
        self,
        evidence_root: str | Path = "evidence",
    ):
        self.evidence_root = Path(evidence_root)
        self.evidence_root.mkdir(
            parents=True,
            exist_ok=True,
        )

    def save_snapshot(
        self,
        frame,
        camera_id: str,
        event_id: str,
        timestamp: datetime | None = None,
    ) -> dict:
        """
        Save a JPEG snapshot and return its evidence metadata.
        """

        if frame is None:
            raise ValueError("Frame cannot be None")

        timestamp = timestamp or datetime.now(timezone.utc)

        evidence_id = f"EVD-{uuid4().hex[:12].upper()}"

        camera_dir = (
            self.evidence_root
            / self._safe_name(camera_id)
        )

        camera_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        filename = (
            f"{evidence_id}_"
            f"{timestamp.strftime('%Y%m%dT%H%M%S%fZ')}.jpg"
        )

        file_path = camera_dir / filename

        success = cv2.imwrite(
            str(file_path),
            frame,
        )

        if not success:
            raise RuntimeError(
                "Failed to write evidence snapshot"
            )

        sha256 = self._calculate_sha256(file_path)

        return {
            "evidence_id": evidence_id,
            "evidence_type": "snapshot",
            "camera_id": camera_id,
            "event_id": event_id,
            "timestamp": timestamp.isoformat(),
            "path": str(file_path),
            "sha256": sha256,
        }

    def save_crop(
        self,
        crop,
        camera_id: str,
        event_id: str,
        timestamp: datetime | None = None,
    ) -> dict:
        """Save a crop associated with an event, such as an ANPR plate."""
        metadata = self.save_snapshot(crop, camera_id, event_id, timestamp)
        metadata["evidence_type"] = "crop"
        return metadata

    def get_evidence_path(
        self,
        camera_id: str,
        filename: str,
    ) -> Path:
        """
        Resolve an evidence file path safely.
        """

        camera_dir = (
            self.evidence_root
            / self._safe_name(camera_id)
        )

        path = camera_dir / self._safe_name(filename)

        if not path.exists():
            raise FileNotFoundError(
                "Evidence file not found"
            )

        return path

    @staticmethod
    def _calculate_sha256(
        file_path: Path,
    ) -> str:

        digest = hashlib.sha256()

        with file_path.open("rb") as file:
            for chunk in iter(
                lambda: file.read(1024 * 1024),
                b"",
            ):
                digest.update(chunk)

        return digest.hexdigest()

    @staticmethod
    def _safe_name(value: str) -> str:
        """
        Prevent path traversal when IDs or filenames
        originate from external input.
        """

        cleaned = Path(value).name

        if not cleaned:
            raise ValueError("Invalid path value")

        return cleaned


evidence_service = EvidenceService()