"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RequireAuth from "../components/RequireAuth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8003";

type UserProfile = {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
  has_password: boolean;
};

function SettingsContent() {
  const router = useRouter();
  const { fetchWithAuth, logout } = useAuth();
  const { success, error: showError } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changing, setChanging] = useState(false);
  const [newPasswordOnly, setNewPasswordOnly] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchWithAuth(`${API_URL}/auth/me`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setFirstName(data.first_name ?? "");
          setLastName(data.last_name ?? "");
          setEmail(data.email ?? "");
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchWithAuth]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          email: email.trim().toLowerCase(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Failed to update profile");
      setProfile((p) => (p ? { ...p, first_name: firstName.trim() || null, last_name: lastName.trim() || null, email: email.trim().toLowerCase() } : p));
      success("Profile updated");
    } catch (e: any) {
      showError(e.message || "Update failed");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPasswordOnly !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }
    if (newPasswordOnly.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }
    setSettingPassword(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/auth/me/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPasswordOnly }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Failed to set password");
      success("Password set. You can now sign in with email.");
      setProfile((p) => (p ? { ...p, has_password: true } : p));
      setNewPasswordOnly("");
      setConfirmPassword("");
    } catch (e: any) {
      showError(e.message || "Failed");
    } finally {
      setSettingPassword(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setChanging(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/auth/me/change-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Failed to update password");
      success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: any) {
      showError(e.message || "Update failed");
    } finally {
      setChanging(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "delete" && deleteConfirm !== "DELETE") {
      showError('Type "delete" to confirm');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/auth/me`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Failed to delete account");
      logout();
      router.push("/");
      success("Account deleted");
    } catch (e: any) {
      showError(e.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const inputClass =
    "w-full border border-pastel-border p-3 rounded-lg focus:border-pastel-accent focus:ring-2 focus:ring-pastel-accent/20 focus:outline-none bg-pastel-cream text-pastel-text";
  const labelClass = "block text-sm font-medium text-pastel-text mb-1";

  if (loading) {
    return (
      <main className="min-h-screen bg-pastel-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-pastel-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-pastel-text-muted text-sm">Loading...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pastel-cream">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-pastel-text-muted hover:text-pastel-accent transition-colors">
            ← Home
          </Link>
          <h1 className="text-2xl font-bold text-pastel-text">Account settings</h1>
        </div>

        {/* Personal Information */}
        <div className="bg-pastel-card border border-pastel-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-pastel-text mb-4">Personal information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input
                  type="text"
                  className={inputClass}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input
                  type="text"
                  className={inputClass}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email address</label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="bg-pastel-accent text-white px-5 py-2.5 rounded-xl font-medium hover:bg-pastel-accent-hover disabled:opacity-60 transition-colors"
            >
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>

        {/* Sign-in methods: Unlink from Google (OAuth-only) or info for email users */}
        <div className="bg-pastel-card border border-pastel-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-pastel-text mb-2">Sign-in methods</h2>
          {profile && !profile.has_password ? (
            <>
              <p className="text-sm text-pastel-text-muted mb-4">
                Your account uses Google sign-in only. Add a password below to also sign in with email.
              </p>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className={labelClass}>New password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  className={inputClass}
                  value={newPasswordOnly}
                  onChange={(e) => setNewPasswordOnly(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className={labelClass}>Confirm password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  className={inputClass}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={settingPassword}
                className="bg-pastel-accent text-white px-5 py-2.5 rounded-xl font-medium hover:bg-pastel-accent-hover disabled:opacity-60 transition-colors"
              >
                {settingPassword ? "Setting..." : "Set password & unlink from Google"}
              </button>
            </form>
            </>
          ) : (
            <p className="text-sm text-pastel-text-muted">
              You can sign in with email and password. You can also use Google sign-in with the same email address.
            </p>
          )}
        </div>

        {/* Change password (users with password) */}
        {profile?.has_password && (
          <div className="bg-pastel-card border border-pastel-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-pastel-text mb-4">Change password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className={labelClass}>Current password</label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    className={`${inputClass} pr-12`}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-pastel-text-muted hover:text-pastel-text p-1"
                    aria-label={showPasswords ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPasswords ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>New password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  className={inputClass}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-pastel-text-muted mt-1">At least 6 characters</p>
              </div>
              <button
                type="submit"
                disabled={changing}
                className="bg-pastel-accent text-white px-5 py-2.5 rounded-xl font-medium hover:bg-pastel-accent-hover disabled:opacity-60 transition-colors"
              >
                {changing ? "Updating..." : "Update password"}
              </button>
            </form>
          </div>
        )}

        {profile?.has_password && (
          <p className="text-sm text-pastel-text-muted">
            <Link href="/forgot-password" className="text-pastel-accent hover:underline">
              Forgot your password?
            </Link>{" "}
            Use the reset flow instead.
          </p>
        )}

        {/* Danger zone - Delete account */}
        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Danger zone</h2>
          <p className="text-sm text-red-600 dark:text-red-500 mb-4">
            Deleting your account will permanently remove all your meetings and data. This action cannot be undone.
          </p>
          <div className="space-y-3">
            <label className={labelClass}>
              Type <span className="font-mono font-bold">delete</span> to confirm
            </label>
            <input
              type="text"
              className={`${inputClass} border-red-300 dark:border-red-800`}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="delete"
            />
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting || (deleteConfirm.toLowerCase() !== "delete")}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
            >
              {deleting ? "Deleting..." : "Delete my account"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}
