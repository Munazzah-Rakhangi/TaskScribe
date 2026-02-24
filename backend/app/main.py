# backend/app/main.py

import os
import json
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from dotenv import load_dotenv

import tempfile
from pathlib import Path

from fastapi import FastAPI, Depends, File, HTTPException, Body, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from openai import OpenAI

from app.auth import get_current_user
from app.db import engine
from app.deps import get_db
from app.models import Meeting, ActionItem, User
from app.schemas import (
    MeetingCreate,
    MeetingOut,
    ExtractActionItemsRequest,
    ExtractActionItemsResponse,
    ReminderItem,
    ActionItemCompleteRequest,
)

# ✅ Load backend/.env into process env
load_dotenv()

_reminder_thread: threading.Thread | None = None
_reminder_stop = threading.Event()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _reminder_thread

    def reminder_loop():
        from app.reminders import run_deadline_reminders

        while not _reminder_stop.is_set():
            try:
                n = run_deadline_reminders()
                if n > 0:
                    print(f"[REMINDERS] Sent {n} deadline reminder(s)")
            except Exception as e:
                print(f"[REMINDERS] Job error: {e}")
            _reminder_stop.wait(timeout=24 * 3600)  # Sleep 24h or until stop

    _reminder_thread = threading.Thread(target=reminder_loop, daemon=True)
    _reminder_thread.start()
    yield
    _reminder_stop.set()
    if _reminder_thread:
        _reminder_thread.join(timeout=2)


app = FastAPI(title="TaskScribe API", version="0.1.0", lifespan=lifespan)

from app.routers import auth as auth_router
from app.routers import folders as folders_router

app.include_router(auth_router.router)
app.include_router(folders_router.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/db-check")
def db_check():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
    return {"db": "ok", "result": result}


@app.post("/extract-action-items", response_model=ExtractActionItemsResponse)
def extract_action_items(payload: ExtractActionItemsRequest = Body(...)):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set in backend env")

    client = OpenAI(api_key=api_key)

    system = (
        "You convert raw meeting conversations into structured notes. The input is a conversational transcript "
        "(people talking back and forth, e.g. 'Sarah: So we need to... John: Yeah I'll handle that by Friday').\n\n"
        "Return ONLY valid JSON (no markdown, no extra text).\n\n"
        "1. summary: Write clear, concise meeting notes (2-5 short paragraphs) that help someone remember what the meeting "
        "was about. Include: main topics discussed, key decisions made, context, and outcomes. Use plain prose, not bullet points.\n\n"
        "2. action_items: Extract concrete tasks with owner and deadline when clear.\n"
        "- task: short, imperative, specific (e.g. 'Send design mockups to team').\n"
        "- owner: name if clearly assigned, else null.\n"
        "- deadline: use YYYY-MM-DD when a date is stated (e.g. '2026-02-22'), else null. Do not invent owners or deadlines.\n\n"
        'Output schema exactly: {"summary":"...","action_items":[{"task":"...","owner":null,"deadline":null}]}\n'
    )

    user = f"Conversational transcript:\n{payload.transcript}"

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0,
    )

    text_out = (resp.choices[0].message.content or "").strip()
    # Strip markdown code blocks if present
    if text_out.startswith("```"):
        text_out = text_out.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    try:
        data = json.loads(text_out)
    except Exception:
        raise HTTPException(status_code=500, detail=f"Model returned non-JSON output: {text_out[:200]}")

    if "action_items" not in data or not isinstance(data["action_items"], list):
        raise HTTPException(status_code=500, detail="Model JSON missing action_items list")

    summary = data.get("summary") or ""
    return {"summary": summary, "action_items": data["action_items"]}


_whisper_model = None
_transcribe_lock = threading.Lock()


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        _whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
    return _whisper_model


@app.post("/transcribe")
def transcribe_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Transcribe audio file to text using faster-whisper (open-source)."""
    suffix = Path(audio.filename or "audio").suffix or ".webm"
    if suffix not in {".mp3", ".wav", ".m4a", ".webm", ".ogg", ".flac", ".mp4"}:
        raise HTTPException(status_code=400, detail="Unsupported audio format. Use mp3, wav, m4a, webm, ogg, or flac.")
    try:
        content = audio.file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read audio: {e}")

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        with _transcribe_lock:
            model = _get_whisper_model()
            segments, _ = model.transcribe(tmp_path, language="en")
            transcript = " ".join(s.text.strip() for s in segments if s.text.strip())
        # Return empty for silent chunks (e.g. live mode) to avoid clutter
        return {"transcript": transcript if transcript else ""}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@app.post("/meetings", response_model=MeetingOut)
def create_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder_id = payload.folder_id
    if folder_id:
        from app.models import Folder
        f = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
        if not f:
            raise HTTPException(status_code=400, detail="Folder not found")
    meeting = Meeting(
        user_id=current_user.id,
        folder_id=folder_id,
        title=payload.title,
        transcript=payload.transcript,
        summary=payload.summary,
        created_at=datetime.now(timezone.utc),
    )

    for item in payload.action_items:
        meeting.action_items.append(
            ActionItem(
                task=item.task,
                owner=item.owner,
                deadline=item.deadline,
                completed_at=datetime.now(timezone.utc) if getattr(item, "completed", False) else None,
            )
        )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


@app.get("/meetings", response_model=list[MeetingOut])
def list_meetings(
    folder_id: int | None = None,
    uncategorized: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Meeting).filter(Meeting.user_id == current_user.id)
    if uncategorized:
        q = q.filter(Meeting.folder_id.is_(None))
    elif folder_id is not None:
        q = q.filter(Meeting.folder_id == folder_id)
    return q.order_by(Meeting.id.desc()).all()


@app.get("/meetings/{meeting_id}", response_model=MeetingOut)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@app.put("/meetings/{meeting_id}", response_model=MeetingOut)
def update_meeting(
    meeting_id: int,
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting.title = payload.title
    meeting.transcript = payload.transcript
    meeting.summary = payload.summary
    meeting.folder_id = payload.folder_id
    if payload.folder_id:
        from app.models import Folder
        f = db.query(Folder).filter(Folder.id == payload.folder_id, Folder.user_id == current_user.id).first()
        if not f:
            raise HTTPException(status_code=400, detail="Folder not found")

    db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).delete(
        synchronize_session=False
    )

    for item in payload.action_items:
        meeting.action_items.append(
            ActionItem(
                task=item.task,
                owner=item.owner,
                deadline=item.deadline,
                completed_at=datetime.now(timezone.utc) if getattr(item, "completed", False) else None,
            )
        )

    db.commit()
    db.refresh(meeting)
    return meeting


@app.patch("/meetings/{meeting_id}/action-items/{action_item_id}")
def toggle_action_item_complete(
    meeting_id: int,
    action_item_id: int,
    payload: ActionItemCompleteRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    ai = db.query(ActionItem).filter(
        ActionItem.id == action_item_id,
        ActionItem.meeting_id == meeting_id,
    ).first()
    if not ai:
        raise HTTPException(status_code=404, detail="Action item not found")
    ai.completed_at = datetime.now(timezone.utc) if payload.completed else None
    db.commit()
    return {"ok": True, "completed": payload.completed}


@app.delete("/meetings/{meeting_id}")
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).delete(
        synchronize_session=False
    )

    db.delete(meeting)
    db.commit()

    return {"ok": True, "deleted_id": meeting_id}


@app.post("/reminders/run")
def trigger_reminders():
    """Manually trigger the deadline reminder job (for testing)."""
    from app.reminders import run_deadline_reminders

    n = run_deadline_reminders()
    return {"sent": n}


@app.get("/reminders", response_model=list[ReminderItem])
def list_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meetings = (
        db.query(Meeting)
        .filter(Meeting.user_id == current_user.id)
        .all()
    )
    reminders = []
    for m in meetings:
        for ai in m.action_items:
            if ai.deadline and not ai.completed_at:  # Only include items with a deadline that aren't done
                reminders.append(
                    ReminderItem(
                        meeting_id=m.id,
                        meeting_title=m.title,
                        task=ai.task,
                        owner=ai.owner,
                        deadline=ai.deadline,
                    )
                )
    return reminders
