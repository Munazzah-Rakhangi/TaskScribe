"use client";

import { useState } from "react";

export default function MeetingDeleteButton({
  id,
  onDeleted,
}: {
  id: number;
  onDeleted: (id: number) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation(); // important when card is clickable
    e.preventDefault(); // prevents Link navigation if inside a Link

    const ok = confirm(
      `Permanently delete meeting #${id}? This cannot be undone.`
    );
    if (!ok) return;

    try {
      setLoading(true);

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8003";

      const res = await fetch(`${API_URL}/meetings/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || "Failed to delete meeting");
      }

      onDeleted(id);
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Delete meeting"
      className="border border-pastel-border rounded-lg p-2 hover:bg-pastel-cream disabled:opacity-60 transition-colors text-pastel-text-muted"
    >
      {loading ? (
        <span className="text-sm">…</span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
          aria-hidden
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      )}
    </button>
  );
}
