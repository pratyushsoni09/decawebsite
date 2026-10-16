"""Append-only JSON-lines storage for contact submissions and poll votes (no database)."""
import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings

_lock = threading.Lock()


def _append(name: str, record: dict) -> dict:
    record = {"id": str(uuid.uuid4()), **record, "created_at": datetime.now(timezone.utc).isoformat()}
    path: Path = settings.DATA_DIR / f"{name}.jsonl"
    with _lock:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return record


def save_contact_submission(data: dict) -> dict:
    return _append("contact_submissions", data)


def save_poll_vote(article_id: int) -> dict:
    return _append("poll_votes", {"article_id": article_id})
