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
        process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8003";

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
      className="border border-pastel-border rounded-lg p-2 hover:bg-pastel-cream text-pastel-text-muted disabled:opacity-50 transition-colors"
      title="Delete"
    >
      {loading ? (
        <span className="text-sm">...</span>
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
