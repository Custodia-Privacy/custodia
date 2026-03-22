import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Banner — Custodia",
};

export default async function BannerPage(props: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await props.params;

  return (
    <div className="p-6 lg:p-8">
      <Link
        href={`/sites/${siteId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Cookie Consent Banner
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configure and preview your consent banner. Auto-generated from scan results.
          </p>
        </div>
        <button className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500">
          Publish Changes
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
              Appearance
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Position
                </label>
                <select className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                  <option>Bottom banner</option>
                  <option>Bottom left popup</option>
                  <option>Center modal</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Primary Color
                </label>
                <input
                  type="color"
                  defaultValue="#1e1b4b"
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
              Consent Categories
            </h2>
            <div className="space-y-3">
              {[
                { name: "Essential", count: 2, required: true },
                { name: "Analytics", count: 3, required: false },
                { name: "Advertising", count: 1, required: false },
                { name: "Functional", count: 2, required: false },
              ].map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {cat.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {cat.count} trackers
                    </p>
                  </div>
                  {cat.required ? (
                    <span className="text-xs text-slate-400">Always on</span>
                  ) : (
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-navy-600 peer-checked:after:translate-x-full dark:bg-slate-700" />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Live Preview
          </h2>
          <div className="relative min-h-[400px] rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            {/* Mock website background */}
            <div className="p-4 opacity-30">
              <div className="mb-3 h-4 w-32 rounded bg-slate-300" />
              <div className="mb-2 h-3 w-full rounded bg-slate-200" />
              <div className="mb-2 h-3 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-200" />
            </div>

            {/* Banner preview */}
            <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
              <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
                We use cookies to enhance your browsing experience and analyze
                site traffic. By clicking &quot;Accept All&quot;, you consent to our use
                of cookies.
              </p>
              <div className="flex gap-2">
                <button className="rounded-lg bg-navy-950 px-3 py-1.5 text-xs font-medium text-white">
                  Accept All
                </button>
                <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300">
                  Customize
                </button>
                <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300">
                  Reject All
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-navy-50 p-3 dark:bg-navy-950/30">
            <p className="text-xs text-navy-700 dark:text-navy-300">
              <strong>Embed code:</strong> Add this script to your
              website&apos;s &lt;head&gt; tag to display the consent banner.
            </p>
            <code className="mt-2 block rounded bg-navy-100 px-3 py-2 font-mono text-xs text-navy-800 dark:bg-navy-900 dark:text-navy-200">
              {`<script src="https://cdn.custodia-privacy.com/banner/${siteId}.js" async></script>`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
