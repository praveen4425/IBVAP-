import sqlite3
from pathlib import Path
from typing import Any
import json

class DatabaseService:
    def __init__(self, db_path: str = "ibvap.db"):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Cameras
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cameras (
                    camera_id TEXT PRIMARY KEY,
                    name TEXT,
                    stream_url TEXT,
                    status TEXT
                )
            ''')
            
            # Events
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS events (
                    event_id TEXT PRIMARY KEY,
                    event_type TEXT,
                    camera_id TEXT,
                    timestamp TEXT,
                    severity TEXT,
                    data TEXT
                )
            ''')
            
            # Incidents
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS incidents (
                    incident_id TEXT PRIMARY KEY,
                    severity TEXT,
                    status TEXT,
                    timestamp_start TEXT,
                    data TEXT
                )
            ''')
            
            # Evidence
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS evidence (
                    evidence_id TEXT PRIMARY KEY,
                    event_id TEXT,
                    camera_id TEXT,
                    timestamp TEXT,
                    path TEXT,
                    sha256 TEXT
                )
            ''')
            conn.commit()

    def save_camera(self, camera_id: str, name: str, stream_url: str):
        with self._get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO cameras (camera_id, name, stream_url, status) VALUES (?, ?, ?, ?)",
                (camera_id, name, stream_url, "offline")
            )
            
    def get_cameras(self) -> list[dict]:
        with self._get_connection() as conn:
            return [dict(row) for row in conn.execute("SELECT * FROM cameras").fetchall()]

    def save_event(self, event_id: str, event_type: str, camera_id: str, timestamp: str, severity: str, data: dict):
        with self._get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO events (event_id, event_type, camera_id, timestamp, severity, data) VALUES (?, ?, ?, ?, ?, ?)",
                (event_id, event_type, camera_id, timestamp, severity, json.dumps(data))
            )
            
    def get_events(self) -> list[dict]:
        with self._get_connection() as conn:
            return [dict(row) for row in conn.execute("SELECT * FROM events ORDER BY timestamp DESC").fetchall()]

    def save_incident(self, incident_id: str, severity: str, status: str, timestamp_start: str, data: dict):
        with self._get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO incidents (incident_id, severity, status, timestamp_start, data) VALUES (?, ?, ?, ?, ?)",
                (incident_id, severity, status, timestamp_start, json.dumps(data))
            )

    def get_incidents(self) -> list[dict]:
        with self._get_connection() as conn:
            return [dict(row) for row in conn.execute("SELECT * FROM incidents ORDER BY timestamp_start DESC").fetchall()]

    def save_evidence(self, metadata: dict):
        with self._get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO evidence (evidence_id, event_id, camera_id, timestamp, path, sha256) VALUES (?, ?, ?, ?, ?, ?)",
                (metadata["evidence_id"], metadata.get("event_id"), metadata["camera_id"], metadata["timestamp"], metadata["path"], metadata["sha256"])
            )

    def get_evidence(self) -> list[dict]:
        with self._get_connection() as conn:
            return [dict(row) for row in conn.execute("SELECT * FROM evidence ORDER BY timestamp DESC").fetchall()]

database_service = DatabaseService()
