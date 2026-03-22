import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Custodia",
};

export default async function PolicyPage(props: {
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
            Privacy Policy
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            AI-generated privacy policy based on your latest scan results.
            Auto-updates when your site changes.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900">
            Regenerate
          </button>
          <button className="rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500">
            Publish
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Policy content */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <h2>Privacy Policy</h2>
              <p className="text-xs text-slate-400">
                Last updated: March 18, 2026
              </p>

              <h3>1. Information We Collect</h3>
              <p>
                We collect information you provide directly to us, such as when
                you create an account, make a purchase, or contact us for
                support. This includes your name, email address, shipping
                address, and payment information.
              </p>

              <h3>2. Cookies and Tracking Technologies</h3>
              <p>
                Our website uses the following tracking technologies identified
                by our automated scanner:
              </p>
              <ul>
                <li>
                  <strong>Google Analytics (GA4)</strong> — Analytics tracking
                  to understand site usage patterns
                </li>
                <li>
                  <strong>Stripe.js</strong> — Essential payment processing
                  functionality
                </li>
                <li>
                  <strong>Cloudflare</strong> — Performance and security
                  infrastructure
                </li>
              </ul>

              <h3>3. How We Use Your Information</h3>
              <p>
                We use the information we collect to provide, maintain, and
                improve our services, process transactions, and send you
                technical notices and support messages.
              </p>

              <h3>4. Your Rights</h3>
              <p>
                Depending on your location, you may have certain rights
                regarding your personal information, including the right to
                access, correct, delete, or port your data.
              </p>
            </div>
          </div>
        </div>

        {/* AI explanation sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
              AI Explanation
            </h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <p>
                <strong className="text-slate-700 dark:text-slate-300">
                  Section 1:
                </strong>{" "}
                Lists the personal data you collect. Based on our scan, your
                checkout collects name, email, and payment info via Stripe.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">
                  Section 2:
                </strong>{" "}
                Discloses the 5 trackers we found. We recommend adding consent
                controls for GA4 and Hotjar since they are non-essential.
              </p>
              <p>
                <strong className="text-slate-700 dark:text-slate-300">
                  Section 4:
                </strong>{" "}
                Covers GDPR and CCPA user rights. Since you have EU visitors,
                this section is required.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-compliant/20 bg-compliant-light p-4 dark:bg-green-900/20">
            <p className="text-xs font-medium text-green-800 dark:text-green-400">
              This policy covers GDPR, CCPA/CPRA, and applicable US state
              privacy laws based on your detected visitor jurisdictions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
