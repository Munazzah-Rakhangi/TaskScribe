"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8002";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Reset failed");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-pastel-cream flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-pastel-card border-2 border-pastel-border rounded-2xl p-6 shadow-md text-center">
            <h1 className="text-xl font-bold text-pastel-text mb-2">Invalid link</h1>
            <p className="text-pastel-text-muted mb-4">
              This reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="text-pastel-accent hover:underline font-medium"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-pastel-cream flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-pastel-mint/50 border-2 border-pastel-sage rounded-2xl p-6 shadow-md text-center">
            <h1 className="text-xl font-bold text-pastel-text mb-2">Password reset</h1>
            <p className="text-pastel-text-muted">Redirecting you to sign in...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pastel-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-pastel-text text-center mb-6">
          Set new password
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-pastel-card border-2 border-pastel-border rounded-2xl p-6 shadow-md space-y-4"
        >
          {error && (
            <div className="bg-pastel-blush border border-pastel-border rounded-xl p-3 text-red-600 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-pastel-text mb-1">New password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border-2 border-pastel-border p-3 pr-12 rounded-xl focus:border-pastel-accent focus:outline-none bg-pastel-cream text-pastel-text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-pastel-text-muted hover:text-pastel-text p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-pastel-text-muted mt-1">At least 6 characters</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pastel-accent text-white py-3 rounded-xl font-medium hover:bg-pastel-accent-hover disabled:opacity-60 transition-colors"
          >
            {loading ? "Resetting..." : "Reset password"}
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
