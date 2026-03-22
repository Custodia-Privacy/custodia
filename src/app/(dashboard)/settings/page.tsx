import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Custodia",
};

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your account, billing, and notification preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Profile
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Name
              </label>
              <input
                type="text"
                defaultValue="John Doe"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                defaultValue="john@example.com"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Billing
            </h2>
            <button className="text-sm font-medium text-navy-700 transition-colors hover:text-navy-900 dark:text-navy-400">
              Manage subscription
            </button>
          </div>
          <div className="rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Starter Plan
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  1 website &middot; Renews April 20, 2026
                </p>
              </div>
              <p className="text-lg font-bold text-navy-700 dark:text-navy-300">
                $29/mo
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Notifications
          </h2>
          <div className="space-y-4">
            {[
              { label: "Weekly scan reports", description: "Get scan results emailed weekly", defaultChecked: true },
              { label: "New tracker alerts", description: "Alert when new trackers are detected", defaultChecked: true },
              { label: "DSAR deadlines", description: "Reminders before DSAR deadlines", defaultChecked: true },
              { label: "Policy updates", description: "Notifications when policies are auto-updated", defaultChecked: false },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {pref.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {pref.description}
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    defaultChecked={pref.defaultChecked}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-navy-600 peer-checked:after:translate-x-full dark:bg-slate-700" />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button className="rounded-lg bg-navy-950 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
