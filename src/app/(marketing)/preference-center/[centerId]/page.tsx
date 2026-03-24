"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/trpc";

function storageKey(centerId: string) {
  return `custodia_pref_external_${centerId}`;
}

export default function PublicPreferenceCenterPage() {
  const params = useParams();
  const centerId = params.centerId as string;

  const [visitorId, setVisitorId] = useState("");
  const [email, setEmail] = useState("");
  const [choices, setChoices] = useState<Record<string, boolean>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const published = api.preferences.getPublishedCenter.useQuery(
    { centerId },
    { enabled: !!centerId },
  );

  const saved = api.preferences.getPreferences.useQuery(
    { centerId, externalId: visitorId },
    { enabled: !!visitorId && !!published.data },
  );

  const update = api.preferences.updatePreferences.useMutation({
    onSuccess: () => {
      setBanner("Your preferences were saved.");
      void saved.refetch();
    },
    onError: (e) => setBanner(e.message),
  });

  useEffect(() => {
    if (typeof window === "undefined" || !centerId) return;
    const key = storageKey(centerId);
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    setVisitorId(id);
  }, [centerId]);

  useEffect(() => {
    if (!published.data) return;
    const next: Record<string, boolean> = {};
    for (const c of published.data.categories) {
      next[c.key] = !!c.required;
    }
    const remote = saved.data?.preferences;
    if (remote && typeof remote === "object" && !Array.isArray(remote)) {
      for (const k of Object.keys(next)) {
        if (k in (remote as Record<string, boolean>)) {
          next[k] = Boolean((remote as Record<string, boolean>)[k]);
        }
      }
    }
    setChoices(next);
  }, [published.data, saved.data]);

  const canSave = useMemo(() => {
    if (!published.data?.categories.length) return false;
    for (const c of published.data.categories) {
      if (c.required && !choices[c.key]) return false;
    }
    return true;
  }, [published.data, choices]);

  if (published.isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-slate-600 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  if (published.error || !published.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Unavailable</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {published.error?.message ?? "This preference center does not exist or is not published yet."}
        </p>
      </div>
    );
  }

  const d = published.data;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <p className="text-sm text-slate-500 dark:text-slate-400">Communication preferences</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{d.name}</h1>
      {d.siteDomain && (
        <p className="text-sm text-slate-600 dark:text-slate-400">For {d.siteDomain}</p>
      )}
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        Choose how we may use your data for this site. You can update these choices anytime on this page from the
        same browser. Optional email helps the organization match your request to an account.
      </p>

      {banner && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {banner}
        </p>
      )}

      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setBanner(null);
          if (!visitorId || !canSave) return;
          update.mutate({
            centerId,
            externalId: visitorId,
            email: email.trim() || undefined,
            preferences: choices,
            source: "public_center",
          });
        }}
      >
        <div className="space-y-4">
          {d.categories.map((cat) => (
            <div
              key={cat.key}
              className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{cat.name}</p>
                {cat.description && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{cat.description}</p>
                )}
                {cat.required && (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Required — cannot be turned off</p>
                )}
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={!!choices[cat.key]}
                  disabled={cat.required || update.isPending}
                  onChange={(e) =>
                    setChoices((prev) => ({ ...prev, [cat.key]: e.target.checked }))
                  }
                  className="peer sr-only"
                />
                <div className="relative h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-navy-600 peer-checked:after:translate-x-full peer-disabled:opacity-50 dark:bg-slate-700" />
              </label>
            </div>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={update.isPending || !visitorId || !canSave}
          className="w-full rounded-lg bg-navy-950 py-2.5 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600"
        >
          {update.isPending ? "Saving…" : "Save preferences"}
        </button>
      </form>
    </div>
  );
}
