"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "../context/ToastContext";

export default function DeleteFromListButton({
  id,
  title,
  onDeleted,
  fetchWithAuth,
}: {
  id: number;
  title: string;
  onDeleted: (id: number) => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation(); // ✅ prevents card click (navigation)
    e.preventDefault();

    const ok = confirm(`Delete "${title}" permanently?`);
    if (!ok) return;

    try {
      setLoading(true);

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8002";

      const res = await fetchWithAuth(`${API_URL}/meetings/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail || "Delete failed");
      }

      onDeleted(id);
      success("Meeting deleted");
      router.refresh();
    } catch (err: any) {
      showError(err?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="border-2 border-pastel-border rounded-xl px-3 py-2 hover:bg-pastel-blush/50 text-pastel-text-muted disabled:opacity-50 transition-colors"
      title="Delete"
    >
      {loading ? "..." : "🗑️"}
    </button>
  );
}
