"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/trpc";
import { PLANS } from "@/lib/stripe";

function formatMoney(cents: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

const NOTIF_DEFAULTS = {
  weeklyScanReports: true,
  newTrackerAlerts: true,
  dsarDeadlines: true,
  policyUpdates: false,
};

export default function SettingsPage() {
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);

  const { data: me, isLoading: meLoading } = api.user.me.useQuery();
  const { data: subscription, isLoading: subLoading } = api.billing.getSubscription.useQuery();

  const updateProfile = api.user.update.useMutation({
    onSuccess: () => {
      setProfileMessage("Profile saved.");
      void utils.user.me.invalidate();
    },
    onError: (e) => setProfileMessage(e.message),
  });

  const updateNotif = api.user.updateNotificationSettings.useMutation({
    onSuccess: () => void utils.user.me.invalidate(),
  });

  const portal = api.billing.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (e) => setBillingError(e.message),
  });

  if (meLoading) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-slate-500">Loading settings…</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-red-600 dark:text-red-400">Could not load your account.</p>
      </div>
    );
  }

  const displayName = name || me.name || "";
  const planKey = (subscription?.plan ?? me.org?.plan ?? "free") as keyof typeof PLANS;
  const planInfo = PLANS[planKey] ?? PLANS.free;
  const isOwner = me.role === "owner";

  const rawNotif =
    me.notificationSettings &&
    typeof me.notificationSettings === "object" &&
    !Array.isArray(me.notificationSettings)
      ? (me.notificationSettings as Record<string, boolean>)
      : {};

  const notif = {
    weeklyScanReports: rawNotif.weeklyScanReports ?? NOTIF_DEFAULTS.weeklyScanReports,
    newTrackerAlerts: rawNotif.newTrackerAlerts ?? NOTIF_DEFAULTS.newTrackerAlerts,
    dsarDeadlines: rawNotif.dsarDeadlines ?? NOTIF_DEFAULTS.dsarDeadlines,
    policyUpdates: rawNotif.policyUpdates ?? NOTIF_DEFAULTS.policyUpdates,
  };

  const toggleNotif = (key: keyof typeof NOTIF_DEFAULTS, value: boolean) => {
    updateNotif.mutate({ [key]: value });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Profile and notifications are stored on your <code className="text-xs">users</code> row. Billing comes from
          your org + Stripe when configured.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link
            href="/settings/organization"
            className="font-medium text-navy-700 hover:underline dark:text-navy-400"
          >
            Organization &amp; team →
          </Link>
          <Link href="/assistant" className="font-medium text-navy-700 hover:underline dark:text-navy-400">
            Setup assistant →
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => {
                  if (!name && me.name) setName(me.name);
                }}
                placeholder={me.name ?? "Your name"}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                value={me.email}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              />
              <p className="mt-1 text-xs text-slate-400">Email is tied to login; change via your identity provider.</p>
            </div>
          </div>
          {profileMessage && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{profileMessage}</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Billing</h2>
            {isOwner && (
              <button
                type="button"
                disabled={portal.isPending}
                onClick={() => {
                  setBillingError(null);
                  portal.mutate();
                }}
                className="text-sm font-medium text-navy-700 transition-colors hover:text-navy-900 disabled:opacity-50 dark:text-navy-400"
              >
                {portal.isPending ? "Opening…" : "Manage subscription"}
              </button>
            )}
          </div>
          {billingError && (
            <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">{billingError}</p>
          )}
          {subLoading ? (
            <p className="text-sm text-slate-500">Loading billing…</p>
          ) : (
            <div className="rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {subscription?.planName ?? planInfo.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Org plan: <code className="text-[11px]">{planKey}</code>
                    {subscription?.currentPeriodEnd &&
                      ` · Renews ${subscription.currentPeriodEnd.toLocaleDateString()}`}
                    {subscription?.status && ` · Status: ${subscription.status}`}
                  </p>
                </div>
                <p className="text-lg font-bold text-navy-700 dark:text-navy-300">
                  {planInfo.price === 0 ? "Free" : `${formatMoney(planInfo.price)}/mo`}
                </p>
              </div>
              {!isOwner && (
                <p className="mt-2 text-xs text-slate-500">Only the organization owner can open the billing portal.</p>
              )}
              {planKey === "free" && isOwner && (
                <Link
                  href="/pricing"
                  className="mt-3 inline-block text-sm font-medium text-navy-700 hover:underline dark:text-navy-400"
                >
                  View plans / upgrade
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Notifications</h2>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Stored as JSON on your user (<code className="text-[11px]">notification_settings</code>). Delivery jobs can
            read this later.
          </p>
          <div className="space-y-4">
            {(
              [
                {
                  key: "weeklyScanReports" as const,
                  label: "Weekly scan reports",
                  description: "Summary of scan activity for your org",
                },
                {
                  key: "newTrackerAlerts" as const,
                  label: "New tracker alerts",
                  description: "When new trackers are detected on monitored sites",
                },
                {
                  key: "dsarDeadlines" as const,
                  label: "DSAR deadlines",
                  description: "Reminders before due dates",
                },
                {
                  key: "policyUpdates" as const,
                  label: "Policy updates",
                  description: "When generated policies change materially",
                },
              ] as const
            ).map((pref) => (
              <div key={pref.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{pref.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{pref.description}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={notif[pref.key]}
                    disabled={updateNotif.isPending}
                    onChange={(e) => toggleNotif(pref.key, e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-navy-600 peer-checked:after:translate-x-full dark:bg-slate-700" />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={updateProfile.isPending || !displayName.trim()}
            onClick={() => {
              setProfileMessage(null);
              updateProfile.mutate({ name: displayName.trim() });
            }}
            className="rounded-lg bg-navy-950 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 disabled:opacity-50 dark:bg-navy-600 dark:hover:bg-navy-500"
          >
            {updateProfile.isPending ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
