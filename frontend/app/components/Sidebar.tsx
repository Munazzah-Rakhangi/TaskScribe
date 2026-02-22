"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const iconClass = "shrink-0 w-5 h-5";

const ChevronLeft = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const IconClipboard = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </svg>
);

const IconPlus = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const IconSettings = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconLogIn = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" x2="3" y1="12" y2="12" />
  </svg>
);

const IconUserPlus = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </svg>
);

const IconLogOut = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

export function Sidebar() {
  const { user, token, logout } = useAuth();
  const displayName = user?.email?.split("@")[0] ?? "";
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) setIsCollapsed(stored === "true");
  }, []);

  const toggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  return (
    <aside
      className={`shrink-0 border-r border-pastel-border bg-pastel-card/80 flex flex-col min-h-screen transition-[width] duration-200 ease-in-out overflow-hidden ${
        isCollapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="p-4 border-b border-pastel-border flex items-center justify-between gap-2 min-w-0">
        {!isCollapsed && (
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-pastel-text hover:text-pastel-accent transition-colors truncate"
          >
            TaskScribe
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0 p-1.5 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-lavender/20 transition-colors"
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {token ? (
          <>
            {user && !isCollapsed && (
              <div className="text-sm text-pastel-text-muted mb-2 truncate" title={user.email}>
                Signed in as <span className="font-medium text-pastel-text">{displayName}</span>
              </div>
            )}
            <Link
              href="/meetings"
              title="View Meetings"
              className="flex items-center gap-3 py-2 px-3 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-lavender/20 transition-colors min-w-0"
            >
              <IconClipboard />
              {!isCollapsed && <span className="truncate">View Meetings</span>}
            </Link>
            <Link
              href="/create"
              title="New meeting"
              className="flex items-center gap-3 py-2 px-3 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-lavender/20 transition-colors min-w-0"
            >
              <IconPlus />
              {!isCollapsed && <span className="truncate">New</span>}
            </Link>
            <Link
              href="/settings"
              title="Settings"
              className="flex items-center gap-3 py-2 px-3 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-lavender/20 transition-colors min-w-0"
            >
              <IconSettings />
              {!isCollapsed && <span className="truncate">Settings</span>}
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              title="Sign in"
              className="flex items-center gap-3 py-2 px-3 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-lavender/20 transition-colors min-w-0"
            >
              <IconLogIn />
              {!isCollapsed && <span className="truncate">Sign in</span>}
            </Link>
            <Link
              href="/signup"
              title="Sign up"
              className="flex items-center gap-3 py-2 px-3 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-lavender/20 transition-colors min-w-0"
            >
              <IconUserPlus />
              {!isCollapsed && <span className="truncate">Sign up</span>}
            </Link>
          </>
        )}
      </nav>
      <div className="p-4 border-t border-pastel-border space-y-2">
        {token && (
          <button
            type="button"
            onClick={logout}
            title="Log out"
            className="flex items-center gap-3 w-full text-left py-2 px-3 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-lavender/20 transition-colors text-sm min-w-0"
          >
            <IconLogOut />
            {!isCollapsed && <span className="truncate">Log out</span>}
          </button>
        )}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
