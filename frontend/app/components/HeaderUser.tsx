"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export function HeaderUser() {
  const { user, token, logout } = useAuth();

  if (!token || !user) return null;

  // Use the part before @ as a friendly display name, or full email
  const displayName = user.email.split("@")[0];

  return (
    <div className="flex items-center gap-3 flex-wrap justify-end">
      <Link
        href="/settings"
        className="text-sm text-pastel-text hidden sm:inline truncate max-w-[11rem] min-w-0 hover:text-pastel-accent transition-colors"
        title={user.email}
      >
        Signed in as <span className="font-medium text-pastel-text">{displayName}</span>
      </Link>
      <span className="hidden sm:inline text-pastel-border">|</span>
      <Link
        href="/meetings"
        className="text-sm text-pastel-text-muted hover:text-pastel-accent transition-colors py-2 px-1 -m-1 rounded-lg hover:bg-pastel-accent/10 shrink-0"
      >
        View Meetings
      </Link>
      <Link
        href="/create"
        className="text-sm text-pastel-text-muted hover:text-pastel-accent transition-colors py-2 px-1 -m-1 rounded-lg hover:bg-pastel-accent/10 hidden sm:inline shrink-0"
      >
        + New
      </Link>
      <button
        type="button"
        onClick={logout}
        className="text-sm text-pastel-text-muted hover:text-pastel-accent transition-colors bg-transparent border-none cursor-pointer py-2 px-1 -m-1 rounded-lg hover:bg-pastel-accent/10 shrink-0"
      >
        Log out
      </button>
    </div>
  );
}
