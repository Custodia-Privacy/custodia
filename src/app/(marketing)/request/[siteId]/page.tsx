"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type SiteMeta = { siteId: string; domain: string; name: string };

const TYPES: { value: string; label: string }[] = [
  { value: "access", label: "Access my personal data" },
  { value: "deletion", label: "Delete my personal data" },
  { value: "rectification", label: "Correct inaccurate data" },
  { value: "portability", label: "Export my data (portability)" },
  { value: "opt_out", label: "Opt-out / do not sell or share" },
  { value: "restrict_processing", label: "Restrict processing" },
];

export default function PublicDsarPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [meta, setMeta] = useState<SiteMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [requestType, setRequestType] = useState("access");
  const [jurisdiction, setJurisdiction] = useState("gdpr");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [details, setDetails] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ message: string; reference: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/site/${siteId}`);
        if (!res.ok) {
          if (!cancelled) setLoadError("This form link is not valid or the site was removed.");
          return;
        }
        const data = (await res.json()) as SiteMeta;
        if (!cancelled) setMeta(data);
      } catch {
        if (!cancelled) setLoadError("Could not load this page.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/dsar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          requestType,
          jurisdiction,
          requesterName,
          requesterEmail,
          requesterPhone: requesterPhone.trim() || undefined,
          details: details.trim() || undefined,
          website,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        reference?: string;
        error?: string;
        retryAfterSec?: number;
      };
      if (res.status === 429) {
        setSubmitError(`Too many submissions. Try again in ${data.retryAfterSec ?? 60} seconds.`);
        return;
      }
      if (!res.ok) {
        setSubmitError("Could not submit. Check your entries and try again.");
        return;
      }
      setDone({
        message: data.message ?? "Thank you — your request was received.",
        reference: data.reference ?? "",
      });
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Request unavailable</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{loadError}</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-slate-600 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Request received</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">{done.message}</p>
        {done.reference ? (
          <p className="mt-4 text-sm text-slate-500">
            Reference ID: <code className="text-xs">{done.reference}</code>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <p className="text-sm text-slate-500 dark:text-slate-400">Privacy request</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{meta.name}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">{meta.domain}</p>
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        Use this form to exercise privacy rights. Fields are sent securely to the organization operating this site.
        This is not legal advice.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {/* Honeypot */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Request type</label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Region / law</label>
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="gdpr">GDPR (EU/UK-style)</option>
            <option value="ccpa">CCPA / CPRA (California)</option>
            <option value="lgpd">LGPD (Brazil)</option>
            <option value="pipeda">PIPEDA (Canada)</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
          <input
            required
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
          <input
            type="email"
            required
            value={requesterEmail}
            onChange={(e) => setRequesterEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Phone <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            value={requesterPhone}
            onChange={(e) => setRequesterPhone(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Details <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="Any specifics that help the organization locate your data…"
          />
        </div>

        {submitError && (
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-navy-950 py-2.5 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600"
        >
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </div>
  );
}
