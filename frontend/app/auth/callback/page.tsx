"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const TOKEN_KEY = "meeting_notes_token";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const err = searchParams.get("error");
    if (err) {
      setError(err.replace(/_/g, " "));
      return;
    }
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      window.location.href = "/meetings";
    } else {
      setError("No token received");
    }
  }, [searchParams]);

  if (error) {
    return (
      <main className="min-h-screen bg-pastel-cream flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/login" className="text-pastel-accent hover:underline">
            Back to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pastel-cream flex items-center justify-center p-6">
      <p className="text-pastel-text-muted">Signing you in...</p>
    </main>
  );
}
