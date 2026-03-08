// frontend/app/meetings/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DeleteFromListButton from "./DeleteFromListButton";
import RequireAuth from "../components/RequireAuth";
import { useAuth } from "../context/AuthContext";
import { FOLDER_COLORS } from "../data/folderColors";

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
  folder_id?: number | null;
  created_at: string;
  action_items: ActionItem[];
};

type Folder = {
  id: number;
  name: string;
  color: string;
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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null | "all">("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#6366f1");
  const [addingFolder, setAddingFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [editingFolderColor, setEditingFolderColor] = useState("#6366f1");
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [semanticQuery, setSemanticQuery] = useState("");
  const [semanticResults, setSemanticResults] = useState<{ meeting: Meeting; score: number }[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8003";

  async function loadFolders() {
    try {
      const res = await fetchWithAuth(`${API_URL}/folders`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setFolders(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    }
  }

  async function loadMeetings() {
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const url =
        selectedFolderId === "all"
          ? `${API_URL}/meetings`
          : selectedFolderId === null
            ? `${API_URL}/meetings?uncategorized=true`
            : `${API_URL}/meetings?folder_id=${selectedFolderId}`;
      const res = await fetchWithAuth(url, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) throw new Error(data?.detail || "Failed to load meetings");
      setMeetings(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (e.name === "AbortError") {
        setError("Request timed out. Is the backend running? Start it with: cd backend && .venv/bin/uvicorn app.main:app --reload --port 8003");
      } else {
        setError(e.message || "Could not load meetings. Make sure the backend is running on port 8003.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFolders();
  }, [fetchWithAuth]);

  useEffect(() => {
    loadMeetings();
  }, [fetchWithAuth, selectedFolderId]);

  useEffect(() => {
    async function loadReminders() {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8003"}/reminders`, { cache: "no-store" });
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

  async function addFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setAddingFolder(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim(), color: newFolderColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Failed to create folder");
      setFolders((prev) => [...prev, data]);
      setNewFolderName("");
      setNewFolderColor("#6366f1");
      setShowAddFolderModal(false);
    } catch {
      // ignore
    } finally {
      setAddingFolder(false);
    }
  }

  function startEditFolder(f: Folder) {
    setEditingFolderId(f.id);
    setEditingFolderName(f.name);
    setEditingFolderColor(f.color);
  }

  function cancelEditFolder() {
    setEditingFolderId(null);
  }

  async function saveEditFolder(e: React.FormEvent) {
    e.preventDefault();
    if (editingFolderId == null || !editingFolderName.trim()) return;
    try {
      const res = await fetchWithAuth(`${API_URL}/folders/${editingFolderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingFolderName.trim(), color: editingFolderColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Failed to update folder");
      setFolders((prev) => prev.map((x) => (x.id === editingFolderId ? data : x)));
      setEditingFolderId(null);
    } catch {
      // ignore
    }
  }

  async function backfillEmbeddings() {
    setBackfillLoading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/meetings/backfill-embeddings`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) alert(`Indexed ${data?.indexed ?? 0} meetings. You can use semantic search now.`);
      else alert(data?.detail || "Backfill failed");
    } catch {
      alert("Backfill failed");
    } finally {
      setBackfillLoading(false);
    }
  }

  async function runSemanticSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!semanticQuery.trim()) return;
    setSemanticLoading(true);
    setSemanticResults([]);
    try {
      const res = await fetchWithAuth(`${API_URL}/meetings/semantic-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: semanticQuery.trim(), top_k: 20 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Search failed");
      setSemanticResults(Array.isArray(data) ? data : []);
    } catch {
      setSemanticResults([]);
    } finally {
      setSemanticLoading(false);
    }
  }

  async function deleteFolder(folderId: number) {
    if (!confirm("Delete this folder? Meetings in it will become uncategorized.")) return;
    try {
      const res = await fetchWithAuth(`${API_URL}/folders/${folderId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Failed to delete folder");
      }
      setFolders((prev) => prev.filter((x) => x.id !== folderId));
      if (editingFolderId === folderId) setEditingFolderId(null);
      if (selectedFolderId === folderId) setSelectedFolderId("all");
      loadMeetings();
    } catch {
      // ignore
    }
  }

  const folderById = Object.fromEntries(folders.map((f) => [f.id, f]));

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
            className="inline-flex items-center gap-2 bg-pastel-accent text-white px-5 py-2.5 rounded-lg font-medium hover:bg-pastel-accent-hover transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            New meeting
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
              className="w-full h-11 border border-pastel-border px-3 pl-10 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-card text-pastel-text placeholder:text-pastel-text-muted"
              aria-label="Search meetings"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pastel-text-muted" aria-hidden>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
            </span>
          </div>
          <select
            value={selectedFolderId === "all" ? "all" : selectedFolderId ?? "all"}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedFolderId(v === "all" ? "all" : v === "none" ? null : parseInt(v, 10));
            }}
            className="h-11 border border-pastel-border pl-4 pr-10 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-card text-pastel-text min-w-[140px]"
            aria-label="Filter by folder"
          >
            <option value="all">All folders</option>
            <option value="none">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
            className="h-11 border border-pastel-border pl-4 pr-10 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-card text-pastel-text min-w-[140px]"
            aria-label="Sort meetings"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {/* Semantic search (RAG) */}
        <div className="mb-6 bg-pastel-card border border-pastel-border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-pastel-text mb-2">Find meetings where we discussed…</h2>
          <p className="text-sm text-pastel-text-muted mb-3">
            Search by meaning, not just keywords. New and updated meetings are indexed automatically.
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <form onSubmit={runSemanticSearch} className="flex flex-wrap items-center gap-3 flex-1">
            <input
              type="text"
              placeholder="e.g. payment integration, launch timeline"
              value={semanticQuery}
              onChange={(e) => setSemanticQuery(e.target.value)}
              className="flex-1 min-w-[200px] h-11 border border-pastel-border px-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream text-pastel-text placeholder:text-pastel-text-muted"
              aria-label="Semantic search query"
            />
            <button
              type="submit"
              disabled={semanticLoading || !semanticQuery.trim()}
              className="h-11 px-4 rounded-lg bg-pastel-accent text-white text-sm font-medium hover:bg-pastel-accent-hover disabled:opacity-50"
            >
              {semanticLoading ? "Searching…" : "Search"}
            </button>
            {semanticResults.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSemanticResults([]);
                  setSemanticQuery("");
                }}
                className="text-sm text-pastel-text-muted hover:text-pastel-accent"
              >
                Clear
              </button>
            )}
          </form>
            <button
              type="button"
              onClick={backfillEmbeddings}
              disabled={backfillLoading}
              className="text-sm text-pastel-text-muted hover:text-pastel-accent disabled:opacity-50"
              title="Index all meetings for semantic search"
            >
              {backfillLoading ? "Indexing…" : "Index all meetings"}
            </button>
          </div>
        </div>

        {/* Folders - organize with custom folders */}
        <div className="mb-6 bg-pastel-card border border-pastel-border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-pastel-text mb-3">Organize with folders</h2>
          <p className="text-sm text-pastel-text-muted mb-4">
            Keep recordings organized with custom folders. Click a folder to filter, or add a new one.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {folders.map((f) =>
              editingFolderId === f.id ? (
                <form
                  key={f.id}
                  onSubmit={saveEditFolder}
                  className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg border border-pastel-border bg-pastel-cream"
                >
                  <input
                    type="text"
                    value={editingFolderName}
                    onChange={(e) => setEditingFolderName(e.target.value)}
                    className="w-24 h-8 px-2 rounded border border-pastel-border text-sm text-pastel-text focus:border-pastel-accent focus:ring-1 focus:ring-pastel-accent/20 focus:outline-none"
                    placeholder="Folder name"
                  />
                  <div className="flex gap-0.5">
                    {FOLDER_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setEditingFolderColor(c.value)}
                        className={`w-5 h-5 rounded-full border-2 ${
                          editingFolderColor === c.value ? "border-pastel-text scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                  <button type="submit" className="text-sm text-pastel-accent hover:underline">
                    Save
                  </button>
                  <button type="button" onClick={cancelEditFolder} className="text-sm text-pastel-text-muted hover:underline">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => editingFolderId != null && deleteFolder(editingFolderId)}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    title="Delete folder"
                  >
                    Delete
                  </button>
                </form>
              ) : (
                <span
                  key={f.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer hover:opacity-90 transition-opacity group"
                  style={{ backgroundColor: `${f.color}20`, borderColor: f.color, color: f.color }}
                  onClick={() => setSelectedFolderId(selectedFolderId === f.id ? "all" : f.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedFolderId(selectedFolderId === f.id ? "all" : f.id)}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                  {f.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditFolder(f);
                    }}
                    className="ml-0.5 opacity-60 hover:opacity-100 p-0.5 rounded"
                    title="Edit folder"
                    aria-label="Edit folder"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>
                </span>
              )
            )}
            <button
              type="button"
              onClick={() => setShowAddFolderModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-pastel-border text-pastel-text-muted hover:border-pastel-accent hover:text-pastel-accent transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Add folder
            </button>
          </div>

          {/* Add folder modal */}
          {showAddFolderModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => {
                if (!addingFolder) {
                  setShowAddFolderModal(false);
                  setNewFolderName("");
                  setNewFolderColor("#6366f1");
                }
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-folder-title"
            >
              <div
                className="bg-pastel-card border border-pastel-border rounded-xl p-6 shadow-lg max-w-sm w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="add-folder-title" className="text-lg font-semibold text-pastel-text mb-4">
                  Add folder
                </h3>
                <form
                  onSubmit={addFolder}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-pastel-text mb-2">Folder name</label>
                    <input
                      type="text"
                      placeholder="e.g. Team A"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="w-full h-10 border border-pastel-border px-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream text-pastel-text"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pastel-text mb-2">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {FOLDER_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setNewFolderColor(c.value)}
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${
                            newFolderColor === c.value ? "border-pastel-text scale-110" : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!addingFolder) {
                          setShowAddFolderModal(false);
                          setNewFolderName("");
                          setNewFolderColor("#6366f1");
                        }
                      }}
                      className="px-4 py-2 rounded-lg border border-pastel-border text-pastel-text hover:bg-pastel-cream transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingFolder || !newFolderName.trim()}
                      className="px-4 py-2 rounded-lg bg-pastel-accent text-white font-medium hover:bg-pastel-accent-hover disabled:opacity-50"
                    >
                      {addingFolder ? "Adding..." : "Add folder"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-pastel-text-muted mb-4">
            {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? "s" : ""} match
          </p>
        )}

        {/* Upcoming deadlines (reminders) */}
        {reminders.length > 0 && (
          <div className="mb-6 bg-pastel-card border border-pastel-border rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-pastel-text mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-pastel-accent shrink-0"
                aria-hidden
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Upcoming deadlines
            </h2>
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
          <div className="bg-pastel-card border border-pastel-border rounded-xl p-8 shadow-sm animate-pulse">
            <div className="h-4 bg-pastel-border rounded w-3/4 mb-4" />
            <div className="h-4 bg-pastel-border rounded w-full mb-3 opacity-70" />
            <div className="h-4 bg-pastel-border rounded w-5/6 mb-3 opacity-60" />
            <div className="h-4 bg-pastel-border rounded w-4/5 opacity-50" />
          </div>
        )}
        {error && (
          <div className="bg-pastel-blush/50 border border-pastel-border rounded-xl p-5 space-y-3 text-red-700 dark:text-red-400">
            <p>Error: {error}</p>
            <button
              type="button"
              onClick={() => loadMeetings()}
              className="px-4 py-2 rounded-lg border border-pastel-border hover:bg-pastel-card text-pastel-text text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* List */}
        <div className="space-y-4 mt-6">
          {semanticResults.length > 0 ? (
            <>
              <p className="text-sm text-pastel-text-muted mb-2">
                {semanticResults.length} meeting{semanticResults.length !== 1 ? "s" : ""} match your search.
              </p>
              {semanticResults.map(({ meeting: m, score }) => (
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
                  className="cursor-pointer bg-pastel-card border border-pastel-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-pastel-accent/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-semibold text-pastel-text">{m.title}</h2>
                        <span className="text-xs text-pastel-text-muted bg-pastel-cream px-2 py-0.5 rounded">
                          {Math.round(score * 100)}% match
                        </span>
                        {m.folder_id && folderById[m.folder_id] && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `${folderById[m.folder_id].color}25`,
                              color: folderById[m.folder_id].color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: folderById[m.folder_id].color }}
                            />
                            {folderById[m.folder_id].name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-pastel-text-muted mt-1 line-clamp-2">
                        {m.summary || m.transcript?.slice(0, 160) || "No summary"}
                      </p>
                      {m.action_items && m.action_items.length > 0 && (
                        <ul className="mt-2 text-xs text-pastel-text-muted space-y-0.5">
                          {m.action_items.slice(0, 3).map((a) => (
                            <li key={a.id}>• {a.task}</li>
                          ))}
                          {m.action_items.length > 3 && <li>+ {m.action_items.length - 3} more</li>}
                        </ul>
                      )}
                    </div>
                    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <DeleteFromListButton
                        id={m.id}
                        title={m.title}
                        onDeleted={(id) => {
                          removeFromUI(id);
                          setSemanticResults((prev) => prev.filter((r) => r.meeting.id !== id));
                        }}
                        fetchWithAuth={fetchWithAuth}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            sortedMeetings.map((m) => (
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
              className="cursor-pointer bg-pastel-card border border-pastel-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-pastel-accent/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-semibold text-pastel-text">{m.title}</h2>
                    {m.folder_id && folderById[m.folder_id] && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${folderById[m.folder_id].color}25`,
                          color: folderById[m.folder_id].color,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: folderById[m.folder_id].color }}
                        />
                        {folderById[m.folder_id].name}
                      </span>
                    )}
                  </div>
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
                    className="border border-pastel-border rounded-lg px-4 py-2 text-sm text-pastel-text hover:bg-pastel-cream transition-colors"
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
          ))
          )}
        </div>

        {!loading && !error && searchQuery && filteredMeetings.length === 0 && semanticResults.length === 0 && (
          <div className="bg-pastel-card border border-pastel-border rounded-xl p-8 shadow-sm text-center">
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
          <div className="bg-pastel-card border border-pastel-border rounded-xl p-12 shadow-sm mt-6 text-center">
            <div className="w-14 h-14 rounded-xl bg-pastel-cream border border-pastel-border flex items-center justify-center mx-auto mb-4 text-pastel-text-muted">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>
              </svg>
            </div>
            <p className="text-pastel-text font-medium">No meetings yet</p>
            <p className="text-pastel-text-muted mt-1 text-sm">
              <Link href="/create" className="text-pastel-accent hover:underline font-medium">Create your first meeting</Link> to get started.
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
