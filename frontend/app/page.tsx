"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";

export default function Landing() {
  const router = useRouter();
  const { token } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-pastel-cream">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-20 sm:py-28 text-center">
        <div className="w-14 h-14 rounded-xl bg-pastel-accent/10 flex items-center justify-center mb-8 text-pastel-accent">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-pastel-text tracking-tight mb-3">
          TaskScribe
        </h1>
        <p className="text-lg sm:text-xl text-pastel-text-muted max-w-xl leading-relaxed">
          Turn meeting conversations into structured notes, summaries, and action items.
        </p>
        <p className="mt-4 text-sm text-pastel-text-muted max-w-lg">
          Record, paste transcripts, or use live transcription — get meeting notes, action items, and deadline reminders in one place.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/create")}
            className="inline-flex items-center justify-center rounded-lg bg-pastel-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-pastel-accent-hover transition-colors cursor-pointer"
          >
            Create meeting
          </button>
          <button
            type="button"
            onClick={() => router.push("/meetings")}
            className="inline-flex items-center justify-center rounded-lg border border-pastel-border bg-pastel-card text-pastel-text px-5 py-2.5 text-sm font-medium hover:bg-pastel-cream transition-colors cursor-pointer"
          >
            View meetings
          </button>
        </div>
      </main>

      {/* Features */}
      <section className="bg-pastel-card/30 scroll-mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-16 sm:pb-24">
          <h2 className="text-center text-xs font-medium uppercase tracking-widest text-pastel-text-muted mb-2">
            How it works
          </h2>
          <p className="text-center text-pastel-text-muted text-sm mb-10">
            Three steps to better meeting notes
          </p>
          <ul className="grid sm:grid-cols-3 gap-6">
            <li className="bg-pastel-card rounded-xl p-6 border border-pastel-border shadow-sm text-center">
              <span className="inline-flex w-9 h-9 rounded-lg bg-pastel-accent/10 text-pastel-accent items-center justify-center font-semibold text-sm mb-4">
                1
              </span>
              <h3 className="font-semibold text-pastel-text">Capture</h3>
              <p className="mt-2 text-sm text-pastel-text-muted leading-relaxed">
                Paste dialogue, upload audio, or record live. Templates for standups, retros, and 1:1s.
              </p>
            </li>
            <li className="bg-pastel-card rounded-xl p-6 border border-pastel-border shadow-sm text-center">
              <span className="inline-flex w-9 h-9 rounded-lg bg-pastel-accent/10 text-pastel-accent items-center justify-center font-semibold text-sm mb-4">
                2
              </span>
              <h3 className="font-semibold text-pastel-text">Extract</h3>
              <p className="mt-2 text-sm text-pastel-text-muted leading-relaxed">
                AI turns it into notes, action items, and deadlines. Mark items done as you go.
              </p>
            </li>
            <li className="bg-pastel-card rounded-xl p-6 border border-pastel-border shadow-sm text-center">
              <span className="inline-flex w-9 h-9 rounded-lg bg-pastel-accent/10 text-pastel-accent items-center justify-center font-semibold text-sm mb-4">
                3
              </span>
              <h3 className="font-semibold text-pastel-text">Organize</h3>
              <p className="mt-2 text-sm text-pastel-text-muted leading-relaxed">
                Organize with folders and color coding. Save, search, get email reminders. Export to PDF.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-pastel-cream scroll-mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20">
          <h2 className="text-center text-base font-semibold text-pastel-text mb-1">Your data stays private</h2>
          <p className="text-center text-base text-pastel-text-muted mb-10 max-w-xl mx-auto">
            Notes visible only to you. Delete anytime. Your data is never used to train models.
          </p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-8 h-8 rounded-lg bg-pastel-accent/10 flex items-center justify-center text-pastel-accent">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </span>
              <div>
                <h3 className="font-medium text-pastel-text text-base">Private</h3>
                <p className="text-sm text-pastel-text-muted mt-0.5">Only you can see your notes</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-8 h-8 rounded-lg bg-pastel-accent/10 flex items-center justify-center text-pastel-accent">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </span>
              <div>
                <h3 className="font-medium text-pastel-text text-base">Secure</h3>
                <p className="text-sm text-pastel-text-muted mt-0.5">Built with security in mind</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-8 h-8 rounded-lg bg-pastel-accent/10 flex items-center justify-center text-pastel-accent">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </span>
              <div>
                <h3 className="font-medium text-pastel-text text-base">Your control</h3>
                <p className="text-sm text-pastel-text-muted mt-0.5">Delete your data anytime</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-8 h-8 rounded-lg bg-pastel-accent/10 flex items-center justify-center text-pastel-accent">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              </span>
              <div>
                <h3 className="font-medium text-pastel-text text-base">AI processing</h3>
                <p className="text-sm text-pastel-text-muted mt-0.5">OpenAI — data not used for training</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <footer className="border-t border-pastel-border bg-pastel-card/40 scroll-mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-12 sm:pb-16">
          <h3 className="text-center text-sm font-semibold text-pastel-text mb-3">
            Connect with us
          </h3>
          <div className="flex justify-center gap-4 mb-8">
            <a
              href="https://github.com/Munazzah-Rakhangi/TaskScribe"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="p-2 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-accent/10 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="mailto:hello@taskscribe.app"
              aria-label="Email"
              className="p-2 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-accent/10 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="p-2 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-accent/10 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/munazzah-rakhangi-9748471b4"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="p-2 rounded-lg text-pastel-text-muted hover:text-pastel-accent hover:bg-pastel-accent/10 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
          <div className="text-center text-sm text-pastel-text-muted">
            TaskScribe — meeting notes and action items
          </div>
          <p className="text-center text-xs text-pastel-text-muted mt-2 opacity-80">
            Capture, extract, organize. All in one place.
          </p>
        </div>
      </footer>
    </div>
  );
}
