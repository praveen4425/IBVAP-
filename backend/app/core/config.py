from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]

EVIDENCE_DIR = BASE_DIR / "evidence"
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)

APP_NAME = "IBVAP Backend"
APP_VERSION = "0.1.0"

HOST = "127.0.0.1"
PORT = 8000