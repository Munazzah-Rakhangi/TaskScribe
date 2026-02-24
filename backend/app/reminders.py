"""Deadline reminder job: sends emails for action items with upcoming deadlines."""
import re
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import SessionLocal
from app.email_utils import send_deadline_reminder_email
from app.models import ActionItem, Meeting, User


def _parse_deadline(deadline_str: str) -> datetime | None:
    """Try to parse a deadline string into a date. Returns None if unparseable."""
    if not deadline_str or not deadline_str.strip():
        return None
    s = deadline_str.strip()[:20]
    # Extract YYYY-MM-DD or similar patterns
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        try:
            y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
            return datetime(y, mo, d, tzinfo=timezone.utc)
        except (ValueError, TypeError):
            pass
    for fmt in ("%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            dt = datetime.strptime(s[:10], fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def _deadline_is_soon(deadline_dt: datetime, today_start: datetime, days_ahead: int = 2) -> bool:
    """True if deadline falls within [today, today + days_ahead]."""
    deadline_date = deadline_dt.date()
    today = today_start.date()
    end_date = today + timedelta(days=days_ahead)
    return today <= deadline_date <= end_date


def run_deadline_reminders() -> int:
    """Find action items with deadlines today or in the next 2 days, send reminder emails.
    Returns the number of reminders sent.
    """
    db: Session = SessionLocal()
    try:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        sent = 0
        frontend_url = settings.FRONTEND_URL.rstrip("/")

        # Get all action items with deadlines that haven't been reminded yet and aren't completed
        items = (
            db.query(ActionItem)
            .filter(
                ActionItem.deadline.isnot(None),
                ActionItem.reminder_sent_at.is_(None),
                ActionItem.completed_at.is_(None),
            )
            .all()
        )

        for ai in items:
            deadline_dt = _parse_deadline(ai.deadline or "")
            if not deadline_dt or not _deadline_is_soon(deadline_dt, today_start):
                continue

            meeting = db.query(Meeting).filter(Meeting.id == ai.meeting_id).first()
            if not meeting or not meeting.user_id:
                continue

            user = db.query(User).filter(User.id == meeting.user_id).first()
            if not user or not user.email:
                continue

            meeting_url = f"{frontend_url}/meetings/{meeting.id}"
            ok = send_deadline_reminder_email(
                to_email=user.email,
                meeting_title=meeting.title,
                task=ai.task,
                owner=ai.owner,
                deadline=ai.deadline or "",
                meeting_url=meeting_url,
            )

            if ok:
                ai.reminder_sent_at = datetime.now(timezone.utc)
                sent += 1

        db.commit()
        return sent
    except Exception as e:
        db.rollback()
        print(f"[REMINDERS] Error: {e}")
        return 0
    finally:
        db.close()
