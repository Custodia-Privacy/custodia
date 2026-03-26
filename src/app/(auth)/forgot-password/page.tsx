"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // TODO: Wire to actual password reset API (Resend + token flow)
    // For now, always show success to avoid email enumeration
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-navy-950 text-white dark:bg-navy-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-navy-950 dark:text-white">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {submitted
            ? "Check your email for a reset link."
            : "Enter your email and we'll send you a reset link."}
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
            If an account exists for <strong>{email}</strong>, you&apos;ll receive a
            password reset email shortly.
          </div>
          <Link
            href="/login"
            className="block w-full rounded-lg bg-navy-950 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600 dark:hover:bg-navy-500"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-navy-700 hover:text-navy-900 dark:text-navy-400"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
