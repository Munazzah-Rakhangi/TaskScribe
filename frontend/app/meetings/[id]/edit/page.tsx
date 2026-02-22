"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import RequireAuth from "../../../components/RequireAuth";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

type ActionItem = {
  task: string;
  owner?: string | null;
  deadline?: string | null;
};

type Meeting = {
  id: number;
  title: string;
  transcript: string;
  summary?: string | null;
  action_items: { id: number; task: string; owner?: string | null; deadline?: string | null }[];
};

function EditMeetingForm() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { fetchWithAuth } = useAuth();
  const { success, error: showError } = useToast();

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8002";

  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { task: "", owner: "", deadline: "" },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        const mapped = (m.action_items || []).map((a) => ({
          task: a.task,
          owner: a.owner ?? "",
          deadline: a.deadline ?? "",
        }));

        setActionItems(mapped.length ? mapped : [{ task: "", owner: "", deadline: "" }]);
      } catch (e: any) {
        setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, API_URL]);

  function updateItem(index: number, field: keyof ActionItem, value: string) {
    setActionItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addItem() {
    setActionItems((prev) => [...prev, { task: "", owner: "", deadline: "" }]);
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
        }))
        .filter((x) => x.task.length > 0);

      const res = await fetchWithAuth(`${API_URL}/meetings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          transcript,
          summary: summary.trim() || null,
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
          <Link href={`/meetings/${id}`} className="border-2 border-pastel-border rounded-xl px-4 py-2 text-pastel-text hover:bg-pastel-lavender/40 transition-colors">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-pastel-text">Edit Meeting</h1>
          <div />
        </div>

        {error && (
          <div className="bg-pastel-blush border border-pastel-border rounded-2xl p-4 text-red-600">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-pastel-card border-2 border-pastel-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Title</label>
            <input
              className="w-full border-2 border-pastel-border p-3 rounded-xl focus:border-pastel-accent focus:outline-none bg-pastel-cream"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Conversation transcript</label>
            <textarea
              className="w-full border-2 border-pastel-border p-3 rounded-xl focus:border-pastel-accent focus:outline-none bg-pastel-cream resize-y"
              rows={7}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Meeting notes (summary)</label>
            <textarea
              className="w-full border-2 border-pastel-border p-3 rounded-xl focus:border-pastel-accent focus:outline-none bg-pastel-cream resize-y"
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Key points and context from the meeting..."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-pastel-text">Action Items</h2>
              <button type="button" onClick={addItem} className="px-4 py-2 rounded-xl border-2 border-pastel-border hover:bg-pastel-sage/50 text-pastel-text transition-colors">
                + Add
              </button>
            </div>

            <div className="space-y-3">
              {actionItems.map((item, idx) => (
                <div key={idx} className="border-2 border-pastel-border rounded-xl p-3 bg-pastel-cream">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <input
                      className="border-2 border-pastel-border p-2 rounded-lg focus:border-pastel-accent focus:outline-none bg-pastel-card md:col-span-6"
                      placeholder="Task (required)"
                      value={item.task}
                      onChange={(e) => updateItem(idx, "task", e.target.value)}
                    />

                    <input
                      className="border-2 border-pastel-border p-2 rounded-lg focus:border-pastel-accent focus:outline-none bg-pastel-card md:col-span-3"
                      placeholder="Owner"
                      value={item.owner || ""}
                      onChange={(e) => updateItem(idx, "owner", e.target.value)}
                    />

                    <input
                      className="border-2 border-pastel-border p-2 rounded-lg focus:border-pastel-accent focus:outline-none bg-pastel-card md:col-span-2"
                      placeholder="Deadline"
                      value={item.deadline || ""}
                      onChange={(e) => updateItem(idx, "deadline", e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="md:col-span-1 border-2 border-pastel-border rounded-lg h-10 w-10 flex items-center justify-center hover:bg-pastel-blush/50 text-pastel-text-muted transition-colors"
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
