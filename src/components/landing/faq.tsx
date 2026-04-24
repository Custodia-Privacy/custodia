"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is this legally binding? Does it replace a lawyer?",
    a: "No — Custodia generates privacy policies, cookie banners, and consent mechanisms based on current privacy regulations (GDPR, CCPA, and US state laws) and industry best practices, but it is not legal advice. We built it to be a strong starting point, the way template libraries already are for most lawyers. For anything sensitive to your business, a 30-minute review by a privacy attorney on top of Custodia's output costs a fraction of drafting from scratch.",
  },
  {
    q: "Do I really need this?",
    a: "If your website runs analytics, advertising pixels, or collects any user data (even just email addresses for a newsletter), you have privacy obligations. GDPR applies to any business serving EU visitors — maximum fines are up to 4% of annual revenue. CCPA and the other US state privacy laws cover most US-based businesses. Custodia gives you the artifacts you need — a scan, a policy, a banner, a DSAR workflow — at a price point that's actually reasonable for a small business.",
  },
  {
    q: "What regulations apply to me?",
    a: "It depends on where your users are located, not where your business is based. If you have EU visitors, GDPR applies. California visitors trigger CCPA/CPRA. Virginia, Colorado, Connecticut, and other states have their own laws too. Custodia automatically detects applicable regulations based on your traffic patterns and ensures you comply with all of them.",
  },
  {
    q: "How is this different from a cookie banner?",
    a: "A cookie banner is just one piece of the puzzle. Real compliance requires a privacy policy that matches your actual data practices, a way to handle data subject requests (like 'delete my data'), proper consent management across jurisdictions, data mapping, and ongoing monitoring. Custodia provides the complete stack — cookie banner tools like CookieBot only cover the surface.",
  },
  {
    q: "How does the scanner work?",
    a: "The free homepage scanner fetches your site's HTML and matches it against a library of known tracker, analytics, and advertising script patterns — Google Analytics, Meta Pixel, Hotjar, Google Ads, and dozens more. It's fast (under a second) and honest about what it can see: it won't catch trackers that only load after consent or deep inside specific pages. That class of coverage is on our roadmap.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. All plans are month-to-month with no long-term contracts. You can cancel anytime from your dashboard. If you cancel, you keep access through the end of your billing period. Your data and configurations are retained for 30 days in case you decide to come back.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-navy-600 dark:text-navy-400">
            FAQ
          </p>
          <h2 className="mt-2 text-3xl font-bold text-navy-950 sm:text-4xl dark:text-white">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {faq.q}
                </span>
                <svg
                  className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
