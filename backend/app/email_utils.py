import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings


def _send_email(to_email: str, subject: str, body: str) -> bool:
    """Send a plain text email. Returns True if sent, False on error.
    If SMTP is not configured, logs to console and returns True (dev mode).
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print(f"[DEV] Email to {to_email}: {subject}")
        print(f"[DEV] Body preview: {body[:200]}...")
        return True
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
        msg["To"] = to_email
        msg.attach(MIMEText(body, "plain"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL] Failed to send: {e}")
        return False


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """Send password reset email. Returns True if sent, False otherwise.
    If SMTP is not configured, logs the link and returns True (dev mode).
    """
    subject = "Reset your TaskScribe password"
    body = f"""Hi,

You requested a password reset for TaskScribe.

Click the link below to set a new password (valid for 1 hour):

{reset_link}

If you didn't request this, you can ignore this email.
"""
    return _send_email(to_email, subject, body)


def send_deadline_reminder_email(
    to_email: str,
    meeting_title: str,
    task: str,
    owner: str | None,
    deadline: str,
    meeting_url: str,
) -> bool:
    """Send a reminder email for an upcoming action item deadline."""
    subject = f"TaskScribe: Reminder — {task[:50]}{'…' if len(task) > 50 else ''}"
    owner_line = f"Assigned to: {owner}\n" if owner else ""
    body = f"""Hi,

You have an upcoming deadline in TaskScribe:

Meeting: {meeting_title}
Task: {task}
{owner_line}Deadline: {deadline}

View the meeting: {meeting_url}

—
TaskScribe — summary and action items from your meetings
"""
    return _send_email(to_email, subject, body)
