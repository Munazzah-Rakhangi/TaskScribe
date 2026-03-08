"""
Semantic search (RAG) over meetings using OpenAI embeddings.
Stores one embedding per meeting (title + summary + transcript); search returns similar meetings.
"""
import json
import os
from typing import List

from openai import OpenAI
from sqlalchemy.orm import Session

from app.models import Meeting

# Max chars to send to embedding model (~8k tokens)
MAX_EMBEDDING_CHARS = 28_000


def _get_client() -> OpenAI | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)


def _text_to_embed(meeting: Meeting) -> str:
    """Build searchable text for a meeting."""
    parts = [meeting.title or ""]
    if meeting.summary:
        parts.append(meeting.summary)
    parts.append(meeting.transcript or "")
    text = "\n".join(parts)
    if len(text) > MAX_EMBEDDING_CHARS:
        text = text[:MAX_EMBEDDING_CHARS]
    return text or " "


def get_embedding(text: str) -> List[float] | None:
    """Return embedding vector for text, or None if OpenAI not configured."""
    client = _get_client()
    if not client:
        return None
    text = (text or " ").strip()[:MAX_EMBEDDING_CHARS] or " "
    try:
        resp = client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return resp.data[0].embedding
    except Exception:
        return None


def upsert_meeting_embedding(db: Session, meeting: Meeting) -> None:
    """Compute embedding for meeting and store in meeting_embeddings. Idempotent."""
    from app.models import MeetingEmbedding

    client = _get_client()
    if not client:
        return
    text = _text_to_embed(meeting)
    try:
        vec = get_embedding(text)
        if not vec:
            return
        row = db.query(MeetingEmbedding).filter(MeetingEmbedding.meeting_id == meeting.id).first()
        embedding_json = json.dumps(vec)
        if row:
            row.embedding_json = embedding_json
        else:
            db.add(MeetingEmbedding(meeting_id=meeting.id, embedding_json=embedding_json))
        db.commit()
    except Exception:
        db.rollback()


def delete_meeting_embedding(db: Session, meeting_id: int) -> None:
    """Remove embedding row for a meeting (e.g. when meeting is deleted)."""
    from app.models import MeetingEmbedding

    db.query(MeetingEmbedding).filter(MeetingEmbedding.meeting_id == meeting_id).delete(
        synchronize_session=False
    )
    db.commit()


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def search_meetings(
    db: Session,
    user_id: int,
    query: str,
    top_k: int = 20,
) -> List[tuple[int, float]]:
    """
    Return list of (meeting_id, score) for meetings belonging to user, sorted by relevance.
    Score is cosine similarity in [0, 1]. Returns [] if OpenAI not configured or no embeddings.
    """
    from app.models import MeetingEmbedding

    query_vec = get_embedding(query)
    if not query_vec:
        return []

    rows = (
        db.query(MeetingEmbedding)
        .join(Meeting, Meeting.id == MeetingEmbedding.meeting_id)
        .filter(Meeting.user_id == user_id)
        .all()
    )
    scored: List[tuple[int, float]] = []
    for row in rows:
        try:
            vec = json.loads(row.embedding_json)
            sim = _cosine_similarity(query_vec, vec)
            scored.append((row.meeting_id, sim))
        except (json.JSONDecodeError, TypeError):
            continue
    scored.sort(key=lambda x: -x[1])
    return scored[:top_k]
