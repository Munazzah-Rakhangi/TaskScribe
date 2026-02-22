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
        process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";

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
      className="border-2 border-pastel-border rounded-xl px-3 py-2 hover:bg-pastel-blush/50 disabled:opacity-60 transition-colors text-pastel-text-muted"
    >
      {loading ? "…" : "🗑️"}
    </button>
  );
}
