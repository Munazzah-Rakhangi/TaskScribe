"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8003";
const TOKEN_KEY = "meeting_notes_token";

type AuthContextType = {
  token: string | null;
  user: { id: number; email: string; first_name?: string; last_name?: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, opts?: { first_name?: string; last_name?: string }) => Promise<void>;
  logout: () => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; email: string; first_name?: string; last_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (t) {
      setToken(t);
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => u && setUser({ id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name }))
        .catch(() => setToken(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (e: any) {
      throw new Error(
        "Cannot reach backend. Is it running? Try: cd backend && uvicorn app.main:app --reload --port 8003"
      );
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "Login failed");
    const t = data.access_token;
    setToken(t);
    localStorage.setItem(TOKEN_KEY, t);
    const meRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const me = await meRes.json();
    if (meRes.ok) setUser({ id: me.id, email: me.email, first_name: me.first_name, last_name: me.last_name });
  }

  async function register(email: string, password: string, opts?: { first_name?: string; last_name?: string }) {
    const body: Record<string, string> = { email, password };
    if (opts?.first_name) body.first_name = opts.first_name;
    if (opts?.last_name) body.last_name = opts.last_name;
    let res: Response;
    try {
      res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e: any) {
      throw new Error(
        "Cannot reach backend. Is it running? Try: cd backend && uvicorn app.main:app --reload --port 8003"
      );
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "Registration failed");
    const t = data.access_token;
    setToken(t);
    localStorage.setItem(TOKEN_KEY, t);
    const meRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const me = await meRes.json();
    if (meRes.ok) setUser({ id: me.id, email: me.email, first_name: me.first_name, last_name: me.last_name });
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
  }

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const t = token || (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
    const headers = new Headers(options.headers);
    if (t) headers.set("Authorization", `Bearer ${t}`);
    return fetch(url, { ...options, headers });
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        logout,
        fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
