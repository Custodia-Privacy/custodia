import type { Metadata } from "next";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — Custodia",
  description:
    "Privacy compliance for businesses that can't afford a legal team. Free scan, plans from $29/mo.",
};

const featureRows: { label: string; starter: string | boolean; growth: string | boolean; business: string | boolean }[] = [
  { label: "Websites", starter: "1", growth: "Up to 5", business: "Up to 25" },
  { label: "Automated scans", starter: "Weekly", growth: "Daily", business: "Daily" },
  { label: "Cookie consent banner", starter: true, growth: true, business: true },
  { label: "AI privacy policy", starter: true, growth: true, business: true },
  { label: "Compliance score", starter: true, growth: true, business: true },
  { label: "AI co-pilot", starter: true, growth: true, business: true },
  { label: "Data request portal", starter: false, growth: true, business: true },
  { label: "Vendor risk management", starter: false, growth: true, business: true },
  { label: "Privacy impact assessments", starter: false, growth: true, business: true },
  { label: "Data governance", starter: false, growth: false, business: true },
  { label: "Custom branding", starter: false, growth: false, business: true },
  { label: "API & MCP access", starter: false, growth: false, business: true },
  { label: "Team seats", starter: "3", growth: "10", business: "50" },
  { label: "Consent log retention", starter: "90 days", growth: "1 year", business: "2 years" },
  { label: "Support", starter: "Email", growth: "Priority", business: "Dedicated" },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-slate-700 dark:text-slate-300">{value}</span>;
  }
  return value ? (
    <svg className="mx-auto h-5 w-5 text-compliant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ) : (
    <svg className="mx-auto h-5 w-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <>
      <div className="pt-24">
        <Pricing />
      </div>

      {/* Detailed feature comparison */}
      <section className="bg-slate-50 py-20 md:py-28 dark:bg-slate-900/50">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-navy-950 sm:text-3xl dark:text-white">
              Full feature comparison
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400">
              See exactly what&apos;s included in each plan.
            </p>
          </div>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr>
                  <th className="pb-4 pr-4 text-sm font-medium text-slate-500 dark:text-slate-400" />
                  <th className="pb-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Starter
                    <span className="block text-xs font-normal text-slate-400">$29/mo</span>
                  </th>
                  <th className="pb-4 text-center text-sm font-semibold text-navy-700 dark:text-navy-300">
                    Growth
                    <span className="block text-xs font-normal text-navy-400">$79/mo</span>
                  </th>
                  <th className="pb-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Business
                    <span className="block text-xs font-normal text-slate-400">$149/mo</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row) => (
                  <tr key={row.label} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="py-3 pr-4 text-sm text-slate-600 dark:text-slate-400">
                      {row.label}
                    </td>
                    <td className="py-3 text-center">
                      <CellValue value={row.starter} />
                    </td>
                    <td className="py-3 text-center bg-navy-50/50 dark:bg-navy-950/20">
                      <CellValue value={row.growth} />
                    </td>
                    <td className="py-3 text-center">
                      <CellValue value={row.business} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/signup"
              className="inline-block rounded-xl bg-navy-950 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500"
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </section>

      <FAQ />
      <CTA />
    </>
  );
}
