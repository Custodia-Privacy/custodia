"use client";

import { useEffect, useState } from "react";

type Branding = {
  companyName: string;
  logoUrl: string | null;
  accentColor: string | null;
  website: string;
};

type SiteMeta = {
  siteId: string;
  domain: string;
  name: string;
  branding: Branding;
};

const TYPES: { value: string; label: string; description: string }[] = [
  { value: "access", label: "See my data", description: "Get a copy of all personal data you hold about me" },
  { value: "deletion", label: "Delete my data", description: "Remove all my personal data from your systems" },
  { value: "rectification", label: "Correct my data", description: "Fix inaccurate personal information you hold about me" },
  { value: "portability", label: "Export my data", description: "Send me my data in a portable format" },
  { value: "opt_out", label: "Stop selling/sharing my data", description: "Opt me out of data sales or sharing with third parties" },
  { value: "restrict_processing", label: "Limit how you use my data", description: "Restrict how my personal data is processed" },
];

interface DsarFormProps {
  siteId: string;
  compact?: boolean;
}

export function DsarForm({ siteId, compact = false }: DsarFormProps) {
  const [meta, setMeta] = useState<SiteMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [requestType, setRequestType] = useState("access");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [details, setDetails] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ message: string; reference: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const accent = meta?.branding.accentColor || "#4f46e5";

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
    return () => { cancelled = true; };
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
          jurisdiction: "auto",
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
        message: data.message ?? "Thank you — your request has been received.",
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
      <div className="flex min-h-[300px] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Form unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading…
        </div>
      </div>
    );
  }

  const { branding } = meta;

  if (done) {
    return (
      <div className={compact ? "px-4 py-6" : "mx-auto max-w-lg px-4 py-16"}>
        <div className="text-center">
          {branding.logoUrl && (
            <img src={branding.logoUrl} alt={branding.companyName} className="mx-auto mb-6 h-10 object-contain" />
          )}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}15` }}>
            <svg className="h-7 w-7" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">Request received</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{done.message}</p>
          {done.reference && (
            <p className="mt-4 text-xs text-slate-400">
              Reference: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">{done.reference}</code>
            </p>
          )}
          <p className="mt-6 text-xs text-slate-400">
            We&apos;ll respond within the legally required timeframe. You can reach us at{" "}
            <a href={branding.website} className="underline" style={{ color: accent }}>{branding.companyName}</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "px-4 py-6" : "mx-auto max-w-lg px-4 py-12"}>
      {/* Branded header */}
      <div className={compact ? "mb-4" : "mb-8 text-center"}>
        {branding.logoUrl && !compact && (
          <img src={branding.logoUrl} alt={branding.companyName} className="mx-auto mb-5 h-10 object-contain" />
        )}
        <h1 className={`font-semibold text-slate-900 dark:text-white ${compact ? "text-base" : "text-2xl"}`}>
          {compact ? `Privacy Request — ${branding.companyName}` : "Privacy Data Request"}
        </h1>
        {!compact && (
          <p className="mt-1 text-sm text-slate-500">{branding.companyName} · {meta.domain}</p>
        )}
        <p className={`${compact ? "mt-2" : "mt-4"} text-sm text-slate-500 dark:text-slate-400 ${compact ? "" : "mx-auto max-w-md"}`}>
          Use this form to exercise your privacy rights. Your request is sent directly and securely to {branding.companyName}.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Honeypot */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
        </div>

        {/* Request type — card selector */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">What would you like to do?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {TYPES.map((t) => (
              <label
                key={t.value}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 transition-colors ${
                  requestType === t.value
                    ? "border-transparent ring-2"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                }`}
                style={requestType === t.value ? { borderColor: accent, ringColor: accent, boxShadow: `0 0 0 2px ${accent}` } : undefined}
              >
                <input
                  type="radio"
                  name="requestType"
                  value={t.value}
                  checked={requestType === t.value}
                  onChange={() => setRequestType(t.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-medium text-slate-900 dark:text-white">{t.label}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{t.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
          <input
            required
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-transparent focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            style={{ "--tw-ring-color": accent } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
          <input
            type="email"
            required
            value={requesterEmail}
            onChange={(e) => setRequesterEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-transparent focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            style={{ "--tw-ring-color": accent } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Phone <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            value={requesterPhone}
            onChange={(e) => setRequesterPhone(e.target.value)}
            placeholder="+1 555 123 4567"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-transparent focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            style={{ "--tw-ring-color": accent } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Additional details <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={compact ? 3 : 4}
            placeholder="Any information that helps locate your data (e.g. account email, username, order number)…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-transparent focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            style={{ "--tw-ring-color": accent } as React.CSSProperties}
          />
        </div>

        {submitError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: accent }}
        >
          {submitting ? "Submitting…" : "Submit Request"}
        </button>

        <p className="text-center text-xs text-slate-400">
          Your data is transmitted securely and processed in accordance with applicable privacy regulations.
        </p>
      </form>
    </div>
  );
}
