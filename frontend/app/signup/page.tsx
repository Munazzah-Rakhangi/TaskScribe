"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8003";

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });
      router.push("/meetings");
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-pastel-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-pastel-text text-center">
          Create your account
        </h1>
        <p className="text-pastel-text-muted text-center mt-1 mb-6">
          Start using TaskScribe in seconds
        </p>

        {/* Social sign-up button */}
        <div className="flex flex-col gap-3 mb-4">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-white border border-neutral-300 text-neutral-800 py-3 rounded-xl font-medium hover:bg-neutral-50 transition-colors dark:border-neutral-600 dark:hover:bg-neutral-100"
            onClick={() => (window.location.href = `${API_URL}/auth/google`)}
            aria-label="Sign up with Google"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>
        </div>

        {/* OR divider */}
        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-pastel-border" />
          <span className="px-4 text-sm text-pastel-text-muted font-medium">OR</span>
          <div className="flex-grow border-t border-pastel-border" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-pastel-card border border-pastel-border rounded-xl p-6 shadow-sm space-y-4"
        >
          {error && (
            <div className="bg-pastel-blush border border-pastel-border rounded-xl p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* First name & Surname side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-pastel-text mb-1">
                First name
              </label>
              <input
                type="text"
                className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream text-pastel-text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-pastel-text mb-1">
                Surname
              </label>
              <input
                type="text"
                className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream text-pastel-text"
                placeholder="Surname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-pastel-text mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream text-pastel-text"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pastel-text mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-pastel-border p-3 pr-12 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream text-pastel-text"
                placeholder="Create a password"
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
            <p className="text-xs text-pastel-text-muted mt-1">
              Min 6 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-pastel-text mb-1">
              Password confirmation
            </label>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream text-pastel-text"
              placeholder="Re-enter your password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pastel-accent text-white py-3 rounded-xl font-medium hover:bg-pastel-accent-hover disabled:opacity-60 transition-colors"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-pastel-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-pastel-accent hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-pastel-text-muted">
          <Link href="/" className="hover:underline">← Back to home</Link>
        </p>
      </div>
    </main>
  );
}
