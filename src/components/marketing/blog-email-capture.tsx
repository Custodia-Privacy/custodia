"use client";

import { useState } from "react";

export function BlogEmailCapture() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/public/blog-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), website }),
      });

      if (res.status === 429) {
        setStatus("error");
        setErrorMsg("Too many attempts. Please try again later.");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setErrorMsg("Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-8 py-10 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-xl font-bold text-navy-950 dark:text-white">
        Get privacy compliance updates
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Weekly tips on GDPR, CCPA, and privacy law changes for small businesses. No spam.
      </p>

      {status === "success" ? (
        <p className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          You&apos;re in. Check your inbox.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6">
          {/* Honeypot — hidden from real users */}
          <div className="hidden" aria-hidden="true">
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              name="website"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourcompany.com"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-navy-400 focus:ring-2 focus:ring-navy-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-navy-600 dark:focus:ring-navy-900"
              disabled={status === "loading"}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60 dark:bg-navy-700 dark:hover:bg-navy-600"
            >
              {status === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </div>

          {errorMsg && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
          )}
        </form>
      )}
    </div>
  );
}
