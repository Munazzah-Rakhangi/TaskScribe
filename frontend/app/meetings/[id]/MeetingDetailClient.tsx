"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DeleteButton from "./DeleteButton";
import { useAuth } from "../../context/AuthContext";
import RequireAuth from "../../components/RequireAuth";
import { exportMeetingToPdf } from "../../utils/exportMeetingToPdf";

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
  created_at: string | null;
  action_items: ActionItem[];
};

export default function MeetingDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { fetchWithAuth } = useAuth();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8002";

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchWithAuth(`${API_URL}/meetings/${id}`, { cache: "no-store" });
        if (res.status === 401) {
          setError("Please sign in");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || "Failed to load meeting");
        setMeeting(data);
      } catch (e: any) {
        setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, fetchWithAuth]);

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

  if (error || !meeting) {
    return (
      <main className="min-h-screen bg-pastel-cream">
        <div className="max-w-4xl mx-auto p-6">
          <Link
            href="/meetings"
            className="inline-block border-2 border-pastel-border rounded-xl px-4 py-2 text-pastel-text hover:bg-pastel-lavender/40 transition-colors"
          >
            ← Back
          </Link>
          <div className="bg-pastel-card border-2 border-pastel-border rounded-2xl p-6 shadow-sm mt-6">
            <h1 className="text-2xl font-bold text-pastel-text">Meeting not found</h1>
            <p className="text-pastel-text-muted mt-2">
              {error || `Unable to load meeting with ID ${id}.`}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pastel-cream">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/meetings" className="border-2 border-pastel-border rounded-xl px-4 py-2 text-pastel-text hover:bg-pastel-lavender/40 transition-colors">
              ← Back
            </Link>
            <Link href={`/meetings/${meeting.id}/edit`} className="border-2 border-pastel-border rounded-xl px-4 py-2 text-pastel-text hover:bg-pastel-sage/50 transition-colors">
              ✏️ Edit
            </Link>
            <button
              type="button"
              onClick={() => exportMeetingToPdf(meeting)}
              className="border-2 border-pastel-border rounded-xl px-4 py-2 text-pastel-text hover:bg-pastel-lavender/40 transition-colors"
            >
              📄 Export PDF
            </button>
            <DeleteButton id={meeting.id} fetchWithAuth={fetchWithAuth} />
          </div>
          <div className="text-right text-sm text-pastel-text-muted">
            <div>Meeting ID: {meeting.id}</div>
            <div>
              Created: {meeting.created_at ? new Date(meeting.created_at).toLocaleString() : "—"}
            </div>
          </div>
        </div>

        <div className="bg-pastel-card border-2 border-pastel-border rounded-2xl p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-pastel-text">{meeting.title}</h1>
          <p className="text-pastel-text-muted mt-1">Meeting notes and action items.</p>
        </div>

        {meeting.summary && (
          <div className="bg-pastel-card border-2 border-pastel-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-3 text-pastel-text">Meeting notes</h2>
            <div className="prose prose-sm max-w-none text-pastel-text whitespace-pre-wrap">
              {meeting.summary}
            </div>
          </div>
        )}

        <div className="bg-pastel-card border-2 border-pastel-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3 text-pastel-text">Transcript</h2>
          <div className="bg-pastel-cream border-2 border-pastel-border rounded-xl p-4">
            <pre className="whitespace-pre-wrap text-sm text-pastel-text">{meeting.transcript}</pre>
          </div>
        </div>

        <div className="bg-pastel-card border-2 border-pastel-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3 text-pastel-text">Action Items</h2>
          {meeting.action_items.length > 0 ? (
            <ul className="space-y-3">
              {meeting.action_items.map((item) => (
                <li key={item.id} className="border-2 border-pastel-border rounded-xl p-4 flex flex-col gap-1 bg-pastel-cream">
                  <div className="font-medium text-pastel-text">{item.task}</div>
                  <div className="text-sm text-pastel-text-muted">
                    {item.owner ? <span className="mr-3">Owner: {item.owner}</span> : <span className="mr-3 opacity-70">Owner: —</span>}
                    {item.deadline ? <span>Deadline: {item.deadline}</span> : <span className="opacity-70">Deadline: —</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-pastel-text-muted">No action items.</p>
          )}
        </div>
      </div>
    </main>
  );
}
