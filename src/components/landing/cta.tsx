"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";

export function CTA() {
  const [url, setUrl] = useState("");
  const scan = api.scan.quick.useMutation();

  function handleScan() {
    const raw = url.trim();
    if (!raw) return;
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    scan.mutate({ url: normalized });
  }

  return (
    <section
      id="cta"
      className="bg-navy-950 py-20 md:py-28 dark:bg-navy-900"
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Find out what your website is really doing with user data
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-navy-200">
          Run a free privacy scan right now. No signup required. Get a full
          report of every tracker, cookie, and third-party script — plus
          AI-powered compliance recommendations.
        </p>

        <form
          className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row"
          onSubmit={(e) => { e.preventDefault(); handleScan(); }}
        >
          <input
            type="text"
            placeholder="https://your-website.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-xl border border-navy-700 bg-navy-900 px-4 py-3 text-sm text-white outline-none placeholder:text-navy-400 focus:border-navy-500 dark:bg-navy-800"
          />
          <button
            type="submit"
            disabled={scan.isPending}
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-navy-50 disabled:opacity-60"
          >
            {scan.isPending ? "Scanning…" : "Scan My Site Free"}
          </button>
        </form>

        {scan.isSuccess && (
          <p className="mt-4 text-sm text-green-400">
            Scan queued! Your privacy report is being generated.
          </p>
        )}
        {scan.error && (
          <p className="mt-4 text-sm text-red-400">{scan.error.message}</p>
        )}

        <p className="mt-4 text-xs text-navy-400">
          No credit card required. Results in under 60 seconds. Your data is
          never shared.
        </p>
      </div>
    </section>
  );
}
