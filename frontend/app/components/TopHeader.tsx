"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

function getInitials(user: { first_name?: string; last_name?: string; email: string } | null): string {
  if (!user) return "?";
  const first = user.first_name?.trim().charAt(0) || "";
  const last = user.last_name?.trim().charAt(0) || "";
  if (first && last) return (first + last).toUpperCase();
  if (first) return first.toUpperCase();
  const prefix = user.email.split("@")[0];
  return prefix.length >= 2 ? prefix.slice(0, 2).toUpperCase() : (prefix[0] || "?").toUpperCase();
}

const navLinkClass = (active: boolean) =>
  `text-sm py-2 px-3 rounded-lg transition-colors ${
    active ? "text-pastel-accent font-medium bg-pastel-accent/10" : "text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-accent/10"
  }`;

export function TopHeader() {
  const { user, token, logout } = useAuth();
  const pathname = usePathname();
  const initials = user ? getInitials(user) : "";

  return (
    <header className="shrink-0 h-14 px-4 flex items-center justify-between gap-4 border-b border-pastel-border bg-pastel-card/50">
      <nav className="flex items-center gap-1">
        <Link
          href="/"
          className={`text-sm py-2 px-3 rounded-lg transition-colors font-semibold text-pastel-text hover:text-pastel-accent ${
            pathname === "/" ? "text-pastel-accent" : ""
          }`}
        >
          TaskScribe
        </Link>
        {token && (
          <>
            <Link href="/meetings" className={navLinkClass(pathname === "/meetings" || pathname.startsWith("/meetings/"))}>
              View Meetings
            </Link>
            <Link href="/create" className={navLinkClass(pathname === "/create")}>
              + New
            </Link>
          </>
        )}
      </nav>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {token && user ? (
          <>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-accent/10 py-2 px-3 rounded-lg transition-colors"
            >
              Log out
            </button>
            <Link
              href="/settings"
              className="shrink-0 w-9 h-9 rounded-full bg-pastel-accent/20 flex items-center justify-center text-pastel-accent font-medium text-sm hover:bg-pastel-accent/30 transition-colors"
              title={user.email}
              aria-label="Settings"
            >
              {initials}
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className={navLinkClass(pathname === "/login")}>
              Sign in
            </Link>
            <Link href="/signup" className={navLinkClass(pathname === "/signup")}>
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
