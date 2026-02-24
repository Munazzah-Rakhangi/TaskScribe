"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({
  id,
  fetchWithAuth,
}: {
  id: number;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(
      `Permanently delete meeting #${id}? This cannot be undone.`
    );
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
        throw new Error(data?.detail || "Failed to delete meeting");
      }

      // go back to list + refresh it
      router.push("/meetings");
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="border border-pastel-border rounded-lg px-4 py-2 hover:bg-pastel-cream text-pastel-text-muted disabled:opacity-50 transition-colors"
      title="Delete meeting"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
