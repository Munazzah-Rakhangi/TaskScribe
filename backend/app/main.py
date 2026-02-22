# backend/app/main.py

import os
import json
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from dotenv import load_dotenv

from fastapi import FastAPI, Depends, HTTPException, Body
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

app.include_router(auth_router.router)

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


@app.post("/meetings", response_model=MeetingOut)
def create_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = Meeting(
        user_id=current_user.id,
        title=payload.title,
        transcript=payload.transcript,
        summary=payload.summary,
        created_at=datetime.now(timezone.utc),
    )

    for item in payload.action_items:
        meeting.action_items.append(
            ActionItem(task=item.task, owner=item.owner, deadline=item.deadline)
        )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


@app.get("/meetings", response_model=list[MeetingOut])
def list_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Meeting)
        .filter(Meeting.user_id == current_user.id)
        .order_by(Meeting.id.desc())
        .all()
    )


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

    db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).delete(
        synchronize_session=False
    )

    for item in payload.action_items:
        meeting.action_items.append(
            ActionItem(task=item.task, owner=item.owner, deadline=item.deadline)
        )

    db.commit()
    db.refresh(meeting)
    return meeting


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
            if ai.deadline:  # Only include items with a deadline
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
