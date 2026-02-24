"use client";

import Link from "next/link";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8003";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Something went wrong");
      setSent(true);
    } catch (e: any) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-pastel-cream flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-pastel-card border border-pastel-border rounded-xl p-6 shadow-md text-center">
            <h1 className="text-xl font-bold text-pastel-text mb-2">Check your email</h1>
            <p className="text-pastel-text-muted">
              If an account exists for {email}, we&apos;ve sent a password reset link.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 text-pastel-accent hover:underline font-medium"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pastel-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-pastel-text text-center mb-6">
          Forgot password
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-pastel-card border border-pastel-border rounded-xl p-6 shadow-sm space-y-4"
        >
          {error && (
            <div className="bg-pastel-blush border border-pastel-border rounded-xl p-3 text-red-600 text-sm">
              {error}
            </div>
          )}
          <p className="text-sm text-pastel-text-muted">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
          <div>
            <label className="block text-sm font-medium text-pastel-text mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream text-pastel-text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pastel-accent text-white py-3 rounded-xl font-medium hover:bg-pastel-accent-hover disabled:opacity-60 transition-colors"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-pastel-text-muted">
          <Link href="/login" className="text-pastel-accent hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
