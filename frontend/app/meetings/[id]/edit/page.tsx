"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import RequireAuth from "../../../components/RequireAuth";
import { FOLDER_COLORS } from "../../../data/folderColors";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

type ActionItem = {
  task: string;
  owner?: string | null;
  deadline?: string | null;
  completed?: boolean;
};

type Meeting = {
  id: number;
  title: string;
  transcript: string;
  summary?: string | null;
  folder_id?: number | null;
  action_items: { id: number; task: string; owner?: string | null; deadline?: string | null; completed_at?: string | null }[];
};

function EditMeetingForm() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { fetchWithAuth } = useAuth();
  const { success, error: showError } = useToast();

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8003";

  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { task: "", owner: "", deadline: "", completed: false },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<number | null>(null);
  const [folders, setFolders] = useState<{ id: number; name: string; color: string }[]>([]);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchWithAuth(`${API_URL}/meetings/${id}`, { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) throw new Error(data?.detail || "Failed to load meeting");

        const m: Meeting = data;
        setTitle(m.title);
        setTranscript(m.transcript);
        setSummary(m.summary ?? "");
        setFolderId(m.folder_id ?? null);

        const mapped = (m.action_items || []).map((a) => ({
          task: a.task,
          owner: a.owner ?? "",
          deadline: a.deadline ?? "",
          completed: !!a.completed_at,
        }));

        setActionItems(mapped.length ? mapped : [{ task: "", owner: "", deadline: "", completed: false }]);
      } catch (e: any) {
        setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, fetchWithAuth]);

  useEffect(() => {
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
    loadFolders();
  }, [fetchWithAuth]);

  function updateItem(index: number, field: keyof ActionItem, value: string | boolean) {
    setActionItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addItem() {
    setActionItems((prev) => [...prev, { task: "", owner: "", deadline: "", completed: false }]);
  }

  function removeItem(index: number) {
    setActionItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      setError(null);

      const cleaned = actionItems
        .map((x) => ({
          task: x.task.trim(),
          owner: x.owner?.toString().trim() || null,
          deadline: x.deadline?.toString().trim() || null,
          completed: x.completed ?? false,
        }))
        .filter((x) => x.task.length > 0);

      const res = await fetchWithAuth(`${API_URL}/meetings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          transcript,
          summary: summary.trim() || null,
          folder_id: folderId,
          action_items: cleaned,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.detail || "Failed to save changes");

      success("Meeting updated");
      router.push(`/meetings/${id}`);
      router.refresh();
    } catch (e: any) {
      const msg = e.message || "Save failed";
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!id) return null;

  if (loading) {
    return (
      <main className="min-h-screen bg-pastel-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-pastel-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-pastel-text-muted text-sm">Loading meeting…</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pastel-cream">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Link href={`/meetings/${id}`} className="border border-pastel-border rounded-lg px-4 py-2 text-pastel-text hover:bg-pastel-cream transition-colors">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-pastel-text">Edit Meeting</h1>
          <div />
        </div>

        {error && (
          <div className="bg-pastel-blush/50 border border-pastel-border rounded-xl p-4 text-red-700 dark:text-red-400">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-pastel-card border border-pastel-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Folder</label>
            <select
              value={folderId ?? ""}
              onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream text-pastel-text"
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {folderId != null && (
              <div className="mt-2 pt-2 border-t border-pastel-border">
                <p className="text-sm text-pastel-text-muted mb-2">Change folder color</p>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_COLORS.map((c) => {
                    const folder = folders.find((x) => x.id === folderId);
                    const isSelected = folder ? folder.color === c.value : false;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetchWithAuth(`${API_URL}/folders/${folderId}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ color: c.value }),
                            });
                            const data = await res.json();
                            if (res.ok) {
                              setFolders((prev) => prev.map((x) => (x.id === folderId ? data : x)));
                            }
                          } catch {
                            // ignore
                          }
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          isSelected ? "border-pastel-text scale-110" : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Title</label>
            <input
              className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Conversation transcript</label>
            <textarea
              className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream resize-y"
              rows={7}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Meeting notes (summary)</label>
            <textarea
              className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream resize-y"
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Key points and context from the meeting..."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-pastel-text">Action Items</h2>
              <button type="button" onClick={addItem} className="px-4 py-2 rounded-lg border border-pastel-border hover:bg-pastel-cream text-pastel-text transition-colors">
                + Add
              </button>
            </div>

            <div className="space-y-3">
              {actionItems.map((item, idx) => (
                <div key={idx} className="border border-pastel-border rounded-lg p-3 bg-pastel-cream">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <button
                      type="button"
                      onClick={() => updateItem(idx, "completed", !item.completed)}
                      className="shrink-0 w-8 h-8 rounded border border-pastel-border flex items-center justify-center hover:bg-pastel-cream transition-colors"
                      title={item.completed ? "Mark as not done" : "Mark as done"}
                    >
                      {item.completed ? <span className="text-pastel-accent">✓</span> : null}
                    </button>
                    <input
                      className={`border border-pastel-border p-2 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-card md:col-span-5 ${item.completed ? "line-through opacity-70" : ""}`}
                      placeholder="Task (required)"
                      value={item.task}
                      onChange={(e) => updateItem(idx, "task", e.target.value)}
                    />

                    <input
                      className="border border-pastel-border p-2 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-card md:col-span-3"
                      placeholder="Owner"
                      value={item.owner || ""}
                      onChange={(e) => updateItem(idx, "owner", e.target.value)}
                    />

                    <input
                      className="border border-pastel-border p-2 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-card md:col-span-2"
                      placeholder="Deadline"
                      value={item.deadline || ""}
                      onChange={(e) => updateItem(idx, "deadline", e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="md:col-span-1 border border-pastel-border rounded-lg h-10 w-10 flex items-center justify-center hover:bg-pastel-cream text-pastel-text-muted transition-colors"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-pastel-text-muted">
              Tip: Leave a task blank to ignore that row.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-pastel-accent text-white px-6 py-3 rounded-xl font-medium hover:bg-pastel-accent-hover disabled:opacity-70 transition-colors shadow-sm"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function EditMeetingPage() {
  return (
    <RequireAuth>
      <EditMeetingForm />
    </RequireAuth>
  );
}
