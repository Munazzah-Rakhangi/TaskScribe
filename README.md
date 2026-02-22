# TaskScribe

**TaskScribe** converts meeting conversations into structured notes, summaries, and action items. Paste raw dialogue from your meetings — get clear notes, deadlines, and follow-ups in one place.

![TaskScribe](https://img.shields.io/badge/TaskScribe-AI%20Meeting%20Assistant-9b8bc7)

## Features

- **AI-powered extraction** — Paste meeting transcripts and get summaries plus action items (task, owner, deadline) via OpenAI GPT-4o-mini
- **User accounts** — Sign up, login, JWT auth, password reset via email
- **Meetings management** — Create, edit, delete meetings; search and filter by title, summary, or action items
- **Upcoming deadlines** — View action items with deadlines; email reminders sent automatically for upcoming due dates
- **Export to PDF** — Download meeting notes and action items as PDF
- **Theme toggle** — Light/dark mode with persistence
- **Responsive UI** — Collapsible sidebar, clean layout, Plus Jakarta Sans font

## Tech Stack

| Layer   | Technology                    |
|---------|-------------------------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend  | FastAPI, SQLAlchemy, Alembic |
| Database | SQLite (dev) / PostgreSQL (prod) |
| AI       | OpenAI GPT-4o-mini            |
| Auth     | JWT, bcrypt                   |

## AI & Agentic Capabilities

TaskScribe uses **agentic AI** to automate meeting workflows:

- **Automated extraction pipeline** — Raw transcript → structured JSON (summary + action items) via OpenAI. The model follows strict output schemas and extracts tasks, owners, and deadlines when mentioned.
- **Deadline reminder agent** — A background agent runs every 24 hours: parses action-item deadlines, identifies items due within 2 days, and sends email reminders to meeting owners. Runs independently without user action.
- **Extensible for RAG / advanced agents** — The architecture supports adding semantic search (RAG), meeting Q&A, or a multi-tool meeting assistant agent in the future.

## Project Structure

```
meeting-notes-agent/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── auth.py          # JWT, password hashing
│   │   ├── core/config.py   # Settings (env vars)
│   │   ├── db.py            # SQLAlchemy engine
│   │   ├── deps.py          # FastAPI dependencies
│   │   ├── email_utils.py   # Password reset & deadline reminder emails
│   │   ├── main.py          # FastAPI app, routes, reminder job
│   │   ├── models.py        # User, Meeting, ActionItem
│   │   ├── reminders.py     # Deadline reminder background job
│   │   ├── routers/auth.py  # Auth endpoints
│   │   └── schemas.py       # Pydantic models
│   ├── alembic/             # DB migrations
│   ├── requirements.txt
│   └── .env                 # (create from template below)
│
├── frontend/                # Next.js frontend
│   ├── app/
│   │   ├── components/      # Sidebar, ThemeToggle, RequireAuth, etc.
│   │   ├── context/         # AuthContext, ToastContext
│   │   ├── meetings/        # List, detail, edit, delete
│   │   ├── utils/           # PDF export
│   │   ├── create/          # New meeting page
│   │   ├── login, signup, forgot-password, reset-password
│   │   ├── settings/        # Profile, change password
│   │   └── page.tsx         # Landing page
│   ├── package.json
│   └── .env.local           # (create: NEXT_PUBLIC_API_URL)
│
└── infra/
    └── docker-compose.yml   # PostgreSQL for production
```

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **OpenAI API key** — [platform.openai.com](https://platform.openai.com/api-keys)

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/meeting-notes-agent.git
cd meeting-notes-agent
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Copy the example and fill in values:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your OPENAI_API_KEY
```

Required variables in `backend/.env`:

```env
DATABASE_URL=sqlite:///./app.db
OPENAI_API_KEY=sk-your-openai-api-key

# Optional: SMTP for password reset & deadline reminders (if not set, links/logs go to console)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
# SMTP_FROM=your-email@gmail.com
```

Run migrations and start the backend:

```bash
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

Backend: **http://127.0.0.1:8002**

### 3. Frontend setup

```bash
cd frontend
npm install
```

```bash
cp frontend/.env.example frontend/.env.local
# Adjust NEXT_PUBLIC_API_URL if your backend runs elsewhere
```

Start the frontend:

```bash
npm run dev
```

Frontend: **http://localhost:3000**

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Sign up |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Current user (protected) |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| PATCH | `/auth/me/change-password` | Change password (protected) |
| POST | `/extract-action-items` | Extract summary + action items from transcript |
| GET/POST/PUT/DELETE | `/meetings` | CRUD meetings (protected) |
| GET | `/meetings/{id}` | Get meeting (protected) |
| GET | `/reminders` | List upcoming deadlines (protected) |
| POST | `/reminders/run` | Manually trigger reminder job (testing) |

## Database Migrations

```bash
cd backend
source .venv/bin/activate
alembic upgrade head    # Apply migrations
alembic revision -m "description"   # Create new migration
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | e.g. `sqlite:///./app.db` or Postgres URL |
| `OPENAI_API_KEY` | Yes* | — | For AI extraction (*optional if not using extract) |
| `JWT_SECRET` | No | change-me-in-production | Change in production |
| `FRONTEND_URL` | No | http://localhost:3000 | For reset links |
| `SMTP_HOST`, `SMTP_USER`, etc. | No | — | For real email delivery |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | Defaults to http://127.0.0.1:8002 |

## Email (SMTP)

Without SMTP, password reset and deadline reminders are **logged to the backend console** instead of sent:

- **Password reset:** link printed as `[DEV] Password reset link for ...`
- **Deadline reminders:** run via background job every 24h; links printed as `[DEV] Email to ...`

Configure SMTP in `backend/.env` to send real emails.

## Deadline Reminders

A background job runs every 24 hours to send emails for action items with deadlines in the next 2 days. To test manually:

```bash
curl -X POST http://127.0.0.1:8002/reminders/run
```

## Production (PostgreSQL)

Use the included Docker Compose for Postgres:

```bash
cd infra
docker compose up -d
```

Set in `backend/.env`:

```env
DATABASE_URL=postgresql://meeting_user:meeting_pass@localhost:5432/meeting_notes
```

Then run migrations and start the backend.

## License

MIT
