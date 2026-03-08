# TaskScribe

**TaskScribe** converts meeting conversations into structured notes, summaries, and action items. Paste raw dialogue from your meetings — get clear notes, deadlines, and follow-ups in one place.

![TaskScribe](https://img.shields.io/badge/TaskScribe-AI%20Meeting%20Assistant-9b8bc7)

## Use Cases

How TaskScribe fits into your daily life:

| Scenario | How you use it |
|----------|----------------|
| **After work meetings** | Record the meeting, upload the file, and get a summary plus action items instead of re-listening. |
| **Quick syncs** | Record standups or short calls, upload, and share structured notes with your team. |
| **1:1s with your manager** | Record, get a clear record of what was agreed and who owns what. |
| **Workshops & training** | Upload a long session and turn it into a structured summary and action list. |
| **Client calls** | Keep decisions, owners, and deadlines in one place for follow-ups and reports. |
| **On the go** | Record a voice note, upload later, and get a summary and action items when you’re back at your desk. |

**Flow:** Capture → Transcribe → Extract → Save → Get reminders for deadlines.

## Features

- **AI-powered extraction** — Paste meeting transcripts and get summaries plus action items (task, owner, deadline) via OpenAI GPT-4o-mini
- **Voice transcription** — Upload audio files or record live from your microphone; transcribe to text using faster-whisper (open-source)
- **User accounts** — Sign up, login, JWT auth, password reset via email, **Sign in / Sign up with Google**
- **Organize with folders** — Create folders (name + color) via an "Add folder" modal; click folder chips to filter, use the pencil icon to edit name/color. Assign folders when creating or editing meetings.
- **Meeting templates** — Predefined templates (1:1, standup, retro, interview, etc.) to quickly prefill title and action-item structure
- **Semantic search (RAG)** — "Find meetings where we discussed X" over all your transcripts using AI embeddings
- **Meetings management** — Create, edit, delete meetings; search and filter by title, summary, or action items
- **Upcoming deadlines** — View action items with deadlines; email reminders sent automatically for upcoming due dates
- **Mark as done** — Track completion of action items; done items show with strikethrough and are excluded from reminders
- **Export to PDF** — Download meeting notes and action items as PDF
- **Theme toggle** — Light/dark mode with persistence
- **Responsive UI** — Collapsible sidebar, clean layout, Plus Jakarta Sans font

## Tech Stack

| Layer   | Technology                    |
|---------|-------------------------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend  | FastAPI, SQLAlchemy, Alembic |
| Database | SQLite (dev) / PostgreSQL (prod) |
| AI       | OpenAI GPT-4o-mini, faster-whisper (speech-to-text) |
| Auth     | JWT, bcrypt, Google OAuth     |

## AI & Agentic Capabilities

TaskScribe uses **agentic AI** to automate meeting workflows:

- **Automated extraction pipeline** — Raw transcript → structured JSON (summary + action items) via OpenAI. The model follows strict output schemas and extracts tasks, owners, and deadlines when mentioned.
- **Semantic search (RAG)** — Each meeting is embedded with OpenAI `text-embedding-3-small`; search by meaning (e.g. "payment integration", "launch timeline") returns the most relevant meetings with a relevance score.
- **Deadline reminder agent** — A background agent runs every 24 hours: parses action-item deadlines, identifies items due within 2 days, and sends email reminders to meeting owners. Runs independently without user action.
- **Voice transcription** — Upload audio or record live; faster-whisper (open-source) transcribes to text. No per-use cost.
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
│   │   ├── main.py          # FastAPI app, routes, /transcribe (faster-whisper), reminder job
│   │   ├── models.py        # User, Meeting, ActionItem
│   │   ├── reminders.py     # Deadline reminder background job
│   │   ├── embeddings.py    # Semantic search (RAG) with OpenAI embeddings
│   │   ├── routers/auth.py  # Auth endpoints
│   │   ├── routers/folders.py  # Folder CRUD
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
│   │   ├── data/            # Meeting templates
│   │   ├── utils/           # PDF export
│   │   ├── create/          # New meeting (templates, paste, upload audio, record live)
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
uvicorn app.main:app --reload --host 0.0.0.0 --port 8003
```

Backend: **http://127.0.0.1:8003**

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
| GET | `/auth/google` | Redirect to Google OAuth |
| GET | `/auth/google/callback` | OAuth callback (creates user, redirects to frontend with token) |
| GET | `/auth/me` | Current user (protected) |
| PATCH | `/auth/me` | Update profile (first_name, last_name, email) |
| POST | `/auth/me/set-password` | Set password for OAuth-only users |
| DELETE | `/auth/me` | Delete account |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| PATCH | `/auth/me/change-password` | Change password (protected) |
| POST | `/extract-action-items` | Extract summary + action items from transcript |
| GET | `/folders` | List folders (protected) |
| POST | `/folders` | Create folder (protected) |
| GET/PATCH/DELETE | `/folders/{id}` | Get, update, delete folder (protected) |
| GET/POST/PUT/DELETE | `/meetings` | CRUD meetings (protected); GET supports ?folder_id=, ?uncategorized=true |
| POST | `/meetings/semantic-search` | Semantic search by meaning (body: `{ "query": "...", "top_k": 20 }`) (protected) |
| POST | `/meetings/backfill-embeddings` | Index all meetings for semantic search (protected) |
| GET | `/meetings/{id}` | Get meeting (protected) |
| GET | `/reminders` | List upcoming deadlines (protected) |
| POST | `/reminders/run` | Manually trigger reminder job (testing) |
| POST | `/transcribe` | Transcribe audio to text (protected; multipart form with `audio` file) |

## Folders

On the Meetings page, folders help you group meetings by team, project, or client:

- **Add folder** — Click "+ Add folder" to open a modal where you enter a name and choose a color
- **Filter** — Click a folder chip to show only meetings in that folder; click again to clear the filter
- **Edit** — Use the pencil icon on a folder chip to change its name or color
- **Assign to meetings** — When creating or editing a meeting, pick a folder from the dropdown. You can change a folder’s color from the meeting edit page as well

The color picker appears only in the add-folder modal and when editing a folder, so the main Meetings page stays uncluttered.

## Semantic search (RAG)

On the Meetings page, **Find meetings where we discussed…** lets you search by meaning, not just keywords:

- **How it works** — Meeting content (title, summary, transcript) is embedded with OpenAI `text-embedding-3-small`. Your search query is embedded the same way; results are ranked by similarity.
- **Indexing** — New and updated meetings are indexed automatically. For existing meetings, click **Index all meetings** once (or call `POST /meetings/backfill-embeddings`).
- **Requires** — `OPENAI_API_KEY` in `backend/.env`. If missing, semantic search returns no results; keyword search and the rest of the app still work.

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
| `JWT_SECRET` | No | change-me-in-production | Secret key for signing JWTs (use at least 32 random characters in real deployments) |
| `FRONTEND_URL` | No | http://localhost:3000 | For reset links, OAuth redirect |
| `API_BASE_URL` | No | http://127.0.0.1:8003 | Backend URL for OAuth callback |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | No | — | For Sign in with Google |
| `SMTP_HOST`, `SMTP_USER`, etc. | No | — | For real email delivery |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | Defaults to http://127.0.0.1:8003 |

## Sign in / Sign up with Google

TaskScribe supports **Sign in with Google** and **Sign up with Google** on both the login and signup pages. Users can create an account or log in using their Google account.

**Setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials (Web application)
3. Add **Authorized redirect URI**: `http://127.0.0.1:8003/auth/google/callback` (or `{API_BASE_URL}/auth/google/callback`)
4. Add to `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
5. Restart the backend. The "Sign in with Google" and "Sign up with Google" buttons will appear on the login and signup pages.

## Email (SMTP)

Without SMTP, password reset and deadline reminders are **logged to the backend console** instead of sent:

- **Password reset:** link printed as `[DEV] Password reset link for ...`
- **Deadline reminders:** run via background job every 24h; links printed as `[DEV] Email to ...`

Configure SMTP in `backend/.env` to send real emails.

## Voice Transcription

TaskScribe supports **upload**, **record**, and **live transcription** for voice-to-text:

| Location | What it does |
|----------|--------------|
| **Backend** `main.py` | `POST /transcribe` accepts multipart audio (mp3, wav, m4a, webm, etc.), runs faster-whisper, returns `{ "transcript": "..." }`. Requires auth. |
| **Frontend** `app/create/page.tsx` | "Upload audio", "Record", and "Live transcribe" buttons above the transcript. **Live transcribe** streams 5-second audio chunks to the backend and appends text in real time as you speak. Record uses `MediaRecorder`; all flows send audio to `/transcribe`. |

Transcription uses English by default. On first use, the `base` model (~140MB) downloads automatically.

## Deadline Reminders

A background job runs every 24 hours to send emails for action items with deadlines in the next 2 days. To test manually:

```bash
curl -X POST http://127.0.0.1:8003/reminders/run
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
