# backend/app/db.py

from __future__ import annotations

from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


def _normalize_sqlite_url(url: str) -> str:
    """
    If DATABASE_URL is sqlite and uses a relative path like:
      sqlite:///./app.db
    make it absolute so you don't accidentally create multiple DBs depending
    on where you run uvicorn from.
    """
    url = (url or "").strip()

    if url.startswith("sqlite:///./"):
        # Convert to absolute path based on backend/ directory
        # This file is at backend/app/db.py => backend/ is two parents up
        backend_dir = Path(__file__).resolve().parents[1]
        rel_path = url.replace("sqlite:///./", "")
        abs_path = (backend_dir / rel_path).resolve()
        return f"sqlite:///{abs_path}"

    return url


DATABASE_URL = _normalize_sqlite_url(settings.DATABASE_URL)

# For SQLite, need check_same_thread=False
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Enable SQLite foreign key constraints (important if you want cascade deletes)
@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    if DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()
