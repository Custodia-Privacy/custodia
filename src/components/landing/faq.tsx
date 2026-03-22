"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is this legally binding?",
    a: "Custodia generates policies and consent mechanisms based on current privacy regulations (GDPR, CCPA, etc.) and best practices. While our AI-generated documents are comprehensive and regularly updated, we recommend having a legal professional review them for your specific situation. Many of our customers use Custodia as their starting point and have their lawyer do a quick review — saving thousands vs. drafting from scratch.",
  },
  {
    q: "Do I really need this?",
    a: "If your website has any analytics, advertising pixels, or collects any user data (even email addresses), you likely need privacy compliance measures. GDPR applies to any business serving EU visitors, and CCPA/state privacy laws cover most US-based businesses. Fines can be significant — up to 4% of annual revenue under GDPR. Custodia makes compliance affordable and automatic.",
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
    q: "How does the AI scanner work?",
    a: "Our scanner uses a headless browser to visit your website exactly like a real user would. It identifies all cookies set, JavaScript trackers loaded, third-party requests made, local storage usage, and fingerprinting techniques. AI then classifies each element by category (analytics, advertising, functional, etc.) and assesses compliance risks.",
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
