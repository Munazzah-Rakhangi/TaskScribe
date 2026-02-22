// frontend/app/meetings/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DeleteFromListButton from "./DeleteFromListButton";
import RequireAuth from "../components/RequireAuth";
import { useAuth } from "../context/AuthContext";

type Reminder = {
  meeting_id: number;
  meeting_title: string;
  task: string;
  owner: string | null;
  deadline: string | null;
};

type ActionItem = {
  id: number;
  task: string;
  owner?: string | null;
  deadline?: string | null;
};

type Meeting = {
  id: number;
  title: string;
  transcript: string;
  summary?: string | null;
  created_at: string;
  action_items: ActionItem[];
};

function filterMeetings(meetings: Meeting[], query: string): Meeting[] {
  if (!query.trim()) return meetings;
  const q = query.toLowerCase().trim();
  return meetings.filter((m) => {
    if (m.title.toLowerCase().includes(q)) return true;
    if (m.summary && m.summary.toLowerCase().includes(q)) return true;
    if (m.transcript && m.transcript.toLowerCase().includes(q)) return true;
    if (m.action_items.some((a) => a.task?.toLowerCase().includes(q))) return true;
    if (m.action_items.some((a) => a.owner?.toLowerCase().includes(q))) return true;
    return false;
  });
}

function MeetingsPageContent() {
  const router = useRouter();
  const { fetchWithAuth } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  async function loadMeetings() {
    try {
      setLoading(true);
      setError(null);

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8002";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetchWithAuth(`${API_URL}/meetings`, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) throw new Error(data?.detail || "Failed to load meetings");
      setMeetings(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (e.name === "AbortError") {
        setError("Request timed out. Is the backend running? Start it with: cd backend && .venv/bin/uvicorn app.main:app --reload --port 8002");
      } else {
        setError(e.message || "Could not load meetings. Make sure the backend is running on port 8002.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeetings();
  }, [fetchWithAuth]);

  useEffect(() => {
    async function loadReminders() {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8002"}/reminders`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setReminders(data);
        }
      } catch {
        // Ignore reminders errors
      }
    }
    loadReminders();
  }, [fetchWithAuth]);

  function removeFromUI(id: number) {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  const filteredMeetings = filterMeetings(meetings, searchQuery);
  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortBy === "newest" ? db - da : da - db;
  });

  return (
    <main className="min-h-screen bg-pastel-cream">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/" className="text-sm text-pastel-text-muted hover:text-pastel-accent transition-colors">
                ← Home
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-pastel-text">Meetings</h1>
            <p className="text-pastel-text-muted mt-1">
              View saved meetings and their action items.
            </p>
          </div>

          <Link
            href="/create"
            className="bg-pastel-accent text-white px-5 py-2.5 rounded-xl font-medium hover:bg-pastel-accent-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md mt-8"
          >
            + New
          </Link>
        </div>

        {/* Search and filter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="search"
              placeholder="Search by title, notes, or action items…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 border-2 border-pastel-border px-3 pl-10 rounded-xl focus:border-pastel-accent focus:outline-none bg-pastel-cream text-pastel-text"
              aria-label="Search meetings"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pastel-text-muted" aria-hidden>
              🔍
            </span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
            className="h-11 border-2 border-pastel-border pl-4 pr-10 rounded-xl focus:border-pastel-accent focus:outline-none bg-pastel-card text-pastel-text min-w-[140px]"
            aria-label="Sort meetings"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        {searchQuery && (
          <p className="text-sm text-pastel-text-muted mb-4">
            {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? "s" : ""} match
          </p>
        )}

        {/* Upcoming deadlines (reminders) */}
        {reminders.length > 0 && (
          <div className="mb-6 bg-pastel-card border-2 border-pastel-border rounded-2xl p-5 shadow-md">
            <h2 className="text-lg font-semibold text-pastel-text mb-3">📌 Upcoming deadlines</h2>
            <ul className="space-y-2">
              {reminders.slice(0, 5).map((r, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Link href={`/meetings/${r.meeting_id}`} className="text-pastel-accent hover:underline font-medium truncate">
                    {r.task}
                  </Link>
                  <span className="text-pastel-text-muted shrink-0">
                    {r.deadline && `by ${r.deadline}`}
                    {r.owner && ` • ${r.owner}`}
                  </span>
                </li>
              ))}
            </ul>
            {reminders.length > 5 && (
              <p className="text-xs text-pastel-text-muted mt-2">+ {reminders.length - 5} more</p>
            )}
          </div>
        )}

        {/* States */}
        {loading && (
          <div className="bg-pastel-card border-2 border-pastel-border rounded-2xl p-8 shadow-md animate-pulse">
            <div className="h-4 bg-pastel-lavender/30 rounded w-3/4 mb-4" />
            <div className="h-4 bg-pastel-lavender/20 rounded w-full mb-3" />
            <div className="h-4 bg-pastel-lavender/20 rounded w-5/6 mb-3" />
            <div className="h-4 bg-pastel-lavender/20 rounded w-4/5" />
          </div>
        )}
        {error && (
          <div className="bg-pastel-blush border border-pastel-border rounded-2xl p-4 text-red-600 space-y-2">
            <p>Error: {error}</p>
            <button
              type="button"
              onClick={() => loadMeetings()}
              className="mt-2 px-4 py-2 rounded-xl border-2 border-pastel-border hover:bg-pastel-sage/50 text-pastel-text text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* List */}
        <div className="space-y-4 mt-6">
          {sortedMeetings.map((m) => (
            <div
              key={m.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/meetings/${m.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/meetings/${m.id}`);
                }
              }}
              className="cursor-pointer bg-pastel-card border-2 border-pastel-border rounded-2xl p-5 shadow-md hover:shadow-lg hover:border-pastel-lavender transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-pastel-text">{m.title}</h2>

                  <p className="text-sm text-pastel-text-muted mt-1">
                    Meeting ID: {m.id} • Action items: {m.action_items.length}
                  </p>

                  <p className="text-xs text-pastel-text-muted mt-1">
                    Created:{" "}
                    {m.created_at
                      ? new Date(m.created_at).toLocaleString()
                      : "—"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="border-2 border-pastel-border rounded-xl px-4 py-2 text-pastel-text hover:bg-pastel-sage/50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/meetings/${m.id}`);
                    }}
                  >
                    View →
                  </button>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <DeleteFromListButton
                      id={m.id}
                      title={m.title}
                      onDeleted={removeFromUI}
                      fetchWithAuth={fetchWithAuth}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-medium mb-2 text-pastel-text">Action Items</h3>

                {m.action_items.length === 0 ? (
                  <p className="text-sm text-pastel-text-muted">No action items.</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1">
                    {m.action_items.slice(0, 3).map((a) => (
                      <li key={a.id} className="text-sm text-pastel-text">
                        <span className="font-medium">{a.task}</span>
                        {a.owner ? ` — ${a.owner}` : ""}
                        {a.deadline ? ` (by ${a.deadline})` : ""}
                      </li>
                    ))}
                    {m.action_items.length > 3 && (
                      <li className="text-sm text-pastel-text-muted">
                        + {m.action_items.length - 3} more…
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        {!loading && !error && searchQuery && filteredMeetings.length === 0 && (
          <div className="bg-pastel-card border-2 border-pastel-border rounded-2xl p-8 shadow-md text-center">
            <p className="text-pastel-text-muted">No meetings match &quot;{searchQuery}&quot;</p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-3 text-sm text-pastel-accent hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
        {!loading && !error && meetings.length === 0 && !searchQuery && (
          <div className="bg-pastel-card border-2 border-pastel-border rounded-2xl p-12 shadow-md mt-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-pastel-sky/50 flex items-center justify-center mx-auto mb-4 text-3xl">
              📋
            </div>
            <p className="text-pastel-text-muted text-lg">No meetings yet.</p>
            <p className="text-pastel-text-muted mt-1">
              Click <Link href="/create" className="font-medium text-pastel-accent hover:underline">+ New</Link> to create one.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MeetingsPage() {
  return (
    <RequireAuth>
      <MeetingsPageContent />
    </RequireAuth>
  );
}
