"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { useElapsed, formatElapsed } from "@/hooks/use-elapsed";

export function CTA() {
  const [url, setUrl] = useState("");
  const scan = api.scan.quick.useMutation();
  const scanId = scan.data?.scanId;

  const result = api.scan.quickResult.useQuery(
    { scanId: scanId! },
    {
      enabled: !!scanId,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "completed" || status === "failed") return false;
        return 2000;
      },
    },
  );

  const liveData = result.data;
  const isScanning = !!scanId && (!liveData || liveData.status === "queued" || liveData.status === "running");
  const isDone = liveData?.status === "completed";
  const elapsed = useElapsed(scan.isPending || isScanning);

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
            aria-label="Website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-xl border border-navy-700 bg-navy-900 px-4 py-3 text-sm text-white outline-none placeholder:text-navy-400 focus:border-navy-500 dark:bg-navy-800"
          />
          <button
            type="submit"
            disabled={scan.isPending || isScanning}
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-navy-50 disabled:opacity-60"
          >
            {scan.isPending ? "Submitting…" : isScanning ? "Scanning…" : "Scan My Site Free"}
          </button>
        </form>

        {isScanning && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-navy-200">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Scanning{liveData?.domain ? ` ${liveData.domain}` : ""}…
            <span className="font-mono tabular-nums">{formatElapsed(elapsed)}</span>
          </p>
        )}

        {isDone && liveData && (
          <div className="mt-4 rounded-lg bg-navy-800 px-4 py-3 text-sm text-white">
            Scan complete — found {liveData.findings.length} finding{liveData.findings.length !== 1 ? "s" : ""}.{" "}
            <a href="/signup" className="font-semibold text-navy-200 underline hover:text-white">
              Sign up free to see the full report
            </a>
          </div>
        )}

        {!scanId && !scan.error && (
          <p className="mt-4 text-xs text-navy-400">
            No credit card required. Results in seconds. We don&apos;t share
            your scan results with anyone.
          </p>
        )}
        {scan.error && (
          <p className="mt-4 text-sm text-red-400">{scan.error.message}</p>
        )}
      </div>
    </section>
  );
}
