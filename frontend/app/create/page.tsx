"use client";

import Link from "next/link";
import { useState } from "react";
import RequireAuth from "../components/RequireAuth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

type ActionItem = {
  task: string;
  owner?: string;
  deadline?: string;
};

function CreateMeetingForm() {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8002";

  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { task: "", owner: "", deadline: "" },
  ]);

  const { fetchWithAuth } = useAuth();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function handleGenerate() {
    if (!transcript.trim()) {
      setError("Please paste a transcript first.");
      return;
    }

    try {
      setError(null);
      setGenerating(true);

      const res = await fetch(`${API_URL}/extract-action-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.detail || "Failed to extract action items");

      const extracted: ActionItem[] = (data?.action_items || []).map((a: any) => ({
        task: a.task ?? "",
        owner: a.owner ?? "",
        deadline: a.deadline ?? "",
      }));

      setSummary((data?.summary || "").trim());
      setActionItems(extracted.length ? extracted : [{ task: "", owner: "", deadline: "" }]);
    } catch (e: any) {
      const msg = e.message || "Generate failed";
      setError(msg);
      showError(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    const cleaned = actionItems
      .map((x) => ({
        task: x.task.trim(),
        owner: x.owner?.trim() || null,
        deadline: x.deadline?.trim() || null,
      }))
      .filter((x) => x.task.length > 0);

    const res = await fetchWithAuth(`${API_URL}/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        transcript,
        summary: summary.trim() || null,
        action_items: cleaned,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.detail || "Failed to save meeting";
      setLoading(false);
      setError(msg);
      showError(msg);
      return;
    }

    setResult(data);
    success("Meeting saved!");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-pastel-cream">
      <div className="max-w-3xl mx-auto p-6">
        {/* Top header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-pastel-text-muted hover:text-pastel-accent transition-colors">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold text-pastel-text">Create Meeting</h1>
        </div>

        {error && (
          <div className="mb-6 bg-pastel-blush border border-pastel-border rounded-xl p-4 text-red-600">
            Error: {error}
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-pastel-card rounded-2xl border border-pastel-border p-5 shadow-sm space-y-4">
          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Meeting title</label>
            <input
              className="w-full border-2 border-pastel-border p-3 rounded-xl focus:border-pastel-accent focus:outline-none bg-pastel-cream"
              placeholder="Team Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium text-pastel-text">Conversation transcript</label>
            <textarea
              className="w-full border-2 border-pastel-border p-3 rounded-xl focus:border-pastel-accent focus:outline-none bg-pastel-cream resize-y"
              placeholder="Paste the raw conversation (e.g. Sarah: So we need to... John: Yeah I'll handle that by Friday. Sarah: Who's on design? John: Emma.)"
              rows={7}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              required
            />
            <p className="text-xs text-pastel-text-muted">
              Paste the dialogue as people spoke — our AI converts it into clear notes and action items.
            </p>
          </div>
        </div>

        {summary && (
          <div className="bg-pastel-card rounded-2xl border border-pastel-border p-5 shadow-sm space-y-2">
            <label className="font-medium text-pastel-text">Meeting notes (summary)</label>
            <textarea
              className="w-full border-2 border-pastel-border p-3 rounded-xl focus:border-pastel-accent focus:outline-none bg-pastel-cream resize-y min-h-[120px]"
              placeholder="Generated notes will appear here..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
            />
          </div>
        )}

        <div className="bg-pastel-card rounded-2xl border border-pastel-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-xl font-semibold text-pastel-text">Action items</h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 rounded-xl border-2 border-pastel-border bg-pastel-mint/50 text-pastel-text hover:bg-pastel-mint disabled:opacity-60 transition-colors"
                title="Convert conversation into notes and action items"
              >
                {generating ? "Converting..." : "✨ Convert to notes"}
              </button>

              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 rounded-xl border-2 border-pastel-border hover:bg-pastel-sage/50 text-pastel-text transition-colors"
              >
                + Add
              </button>
            </div>
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
            Tip: Click <span className="font-medium text-pastel-text">Convert to notes</span> to turn your
            conversation into a summary and action items. You can edit both before saving.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto bg-pastel-accent text-white px-6 py-3.5 rounded-xl font-medium hover:bg-pastel-accent-hover disabled:opacity-60 transition-colors shadow-sm"
        >
          {loading ? "Saving..." : "Save Meeting"}
        </button>
      </form>

      {result && (
        <div className="mt-8 p-6 rounded-2xl border-2 border-pastel-border bg-pastel-sage/30 text-center">
          <h2 className="text-xl font-semibold text-pastel-text">Meeting saved!</h2>
          <p className="mt-2 text-pastel-text-muted">
            Your meeting &quot;{result.title}&quot; has been saved.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href={`/meetings/${result.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-pastel-accent text-white px-5 py-2.5 font-medium hover:bg-pastel-accent-hover transition-colors"
            >
              View meeting
            </Link>
            <Link
              href="/meetings"
              className="inline-flex items-center justify-center rounded-xl border-2 border-pastel-border px-5 py-2.5 font-medium text-pastel-text hover:bg-pastel-lavender/40 transition-colors"
            >
              All meetings
            </Link>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}

export default function CreateMeeting() {
  return (
    <RequireAuth>
      <CreateMeetingForm />
    </RequireAuth>
  );
}
