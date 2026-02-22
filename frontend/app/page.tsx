"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";

export default function Landing() {
  const router = useRouter();
  const { token } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-pastel-cream">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-pastel-lavender flex items-center justify-center mb-6 shadow-lg ring-2 ring-pastel-lavender/30 text-pastel-text">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-pastel-text tracking-tight mb-4">
          TaskScribe
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-pastel-accent max-w-2xl leading-tight">
          Convert conversations into clear meeting notes
        </p>
        <p className="mt-6 text-lg text-pastel-text-muted max-w-xl leading-relaxed">
          Paste raw dialogue from your meetings — we turn it into structured notes, summaries, and action items so you remember what mattered.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/create")}
            className="inline-flex items-center justify-center rounded-xl bg-pastel-accent text-white px-7 py-3.5 font-medium hover:bg-pastel-accent-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shadow-md"
          >
            Create Meeting
          </button>
          <button
            type="button"
            onClick={() => router.push("/meetings")}
            className="inline-flex items-center justify-center rounded-xl border-2 border-pastel-border bg-pastel-card text-pastel-text px-7 py-3.5 font-medium hover:bg-pastel-lavender/40 hover:border-pastel-lavender hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shadow-sm"
          >
            View Meetings
          </button>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-pastel-border bg-gradient-to-b from-pastel-cream to-pastel-sky/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-center text-sm font-medium uppercase tracking-wider text-pastel-text-muted mb-10">
            How it works
          </h2>
          <ul className="grid sm:grid-cols-3 gap-8">
            <li className="bg-pastel-card rounded-2xl p-7 border border-pastel-border shadow-md text-center hover:shadow-lg hover:border-pastel-lavender/50 transition-all duration-200">
              <span className="inline-flex w-12 h-12 rounded-xl bg-pastel-blush text-pastel-text items-center justify-center font-semibold text-lg mb-4">
                1
              </span>
              <h3 className="font-semibold text-pastel-text">Paste conversation</h3>
              <p className="mt-2 text-sm text-pastel-text-muted">
                Add the raw dialogue from your meeting.
              </p>
            </li>
            <li className="bg-pastel-card rounded-2xl p-7 border border-pastel-border shadow-md text-center hover:shadow-lg hover:border-pastel-lavender/50 transition-all duration-200">
              <span className="inline-flex w-12 h-12 rounded-xl bg-pastel-mint text-pastel-text items-center justify-center font-semibold text-lg mb-4">
                2
              </span>
              <h3 className="font-semibold text-pastel-text">Convert to notes</h3>
              <p className="mt-2 text-sm text-pastel-text-muted">
                AI turns the conversation into notes and action items.
              </p>
            </li>
            <li className="bg-pastel-card rounded-2xl p-7 border border-pastel-border shadow-md text-center hover:shadow-lg hover:border-pastel-lavender/50 transition-all duration-200">
              <span className="inline-flex w-12 h-12 rounded-xl bg-pastel-peach text-pastel-text items-center justify-center font-semibold text-lg mb-4">
                3
              </span>
              <h3 className="font-semibold text-pastel-text">Save & manage</h3>
              <p className="mt-2 text-sm text-pastel-text-muted">
                Store meetings and edit or revisit anytime.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="border-t border-pastel-border bg-pastel-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-center text-2xl font-bold text-pastel-text mb-2">
            Your data is safe
          </h2>
          <p className="text-center text-pastel-text-muted mb-10">
            Privacy and security built in from day one
          </p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <li className="bg-pastel-card rounded-2xl p-6 border border-pastel-border shadow-md text-center hover:shadow-lg hover:border-pastel-lavender/50 transition-all duration-200">
              <span className="inline-flex w-12 h-12 rounded-xl bg-pastel-sage/50 text-pastel-text items-center justify-center mb-4">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </span>
              <h3 className="font-semibold text-pastel-text">Encrypted</h3>
              <p className="mt-2 text-sm text-pastel-text-muted">
                TLS encryption in transit, encrypted at rest
              </p>
            </li>
            <li className="bg-pastel-card rounded-2xl p-6 border border-pastel-border shadow-md text-center hover:shadow-lg hover:border-pastel-lavender/50 transition-all duration-200">
              <span className="inline-flex w-12 h-12 rounded-xl bg-pastel-blush/50 text-pastel-text items-center justify-center mb-4">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </span>
              <h3 className="font-semibold text-pastel-text">Your control</h3>
              <p className="mt-2 text-sm text-pastel-text-muted">
                Delete your data anytime
              </p>
            </li>
            <li className="bg-pastel-card rounded-2xl p-6 border border-pastel-border shadow-md text-center hover:shadow-lg hover:border-pastel-lavender/50 transition-all duration-200">
              <span className="inline-flex w-12 h-12 rounded-xl bg-pastel-lavender/50 text-pastel-text items-center justify-center mb-4">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              </span>
              <h3 className="font-semibold text-pastel-text">AI-powered processing</h3>
              <p className="mt-2 text-sm text-pastel-text-muted">
                Processed by OpenAI under strict data agreements — never sold or used for training
              </p>
            </li>
            <li className="bg-pastel-card rounded-2xl p-6 border border-pastel-border shadow-md text-center hover:shadow-lg hover:border-pastel-lavender/50 transition-all duration-200">
              <span className="inline-flex w-12 h-12 rounded-xl bg-pastel-mint/50 text-pastel-text items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </span>
              <h3 className="font-semibold text-pastel-text">Privacy-first</h3>
              <p className="mt-2 text-sm text-pastel-text-muted max-w-md mx-auto">
                Built with privacy regulations in mind
              </p>
            </li>
          </ul>
        </div>
      </section>

      <footer className="border-t border-pastel-border bg-pastel-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-pastel-text mb-2">Get started</h3>
              <ul className="list-none p-0 m-0 space-y-1 text-sm text-pastel-text-muted">
                <li><a href="#" className="hover:text-pastel-accent transition-colors">Sign up</a></li>
                <li><a href="#" className="hover:text-pastel-accent transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-pastel-accent transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-pastel-text mb-2">Connect</h3>
              <ul className="list-none p-0 m-0 space-y-1 text-sm text-pastel-text-muted">
                <li><a href="#" className="hover:text-pastel-accent transition-colors">About us</a></li>
                <li><a href="#" className="hover:text-pastel-accent transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-pastel-accent transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-pastel-text mb-2">Follow us</h3>
              <div className="flex gap-2">
                <a href="#" aria-label="Email" className="p-2 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-lavender/30 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </a>
                <a href="#" aria-label="Instagram" className="p-2 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-lavender/30 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="#" aria-label="Facebook" className="p-2 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-lavender/30 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-pastel-border text-center text-sm text-pastel-text-muted">
            TaskScribe — summary and action items from your meetings
          </div>
        </div>
      </footer>
    </div>
  );
}
