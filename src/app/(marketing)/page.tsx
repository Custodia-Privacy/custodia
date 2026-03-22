import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custodia — Privacy compliance for businesses that can't afford a legal team",
};

/**
 * Landing page — the main marketing page at custodia-privacy.com
 *
 * Sections:
 * 1. Hero — value prop + free scan CTA
 * 2. Social proof — testimonials
 * 3. Feature breakdown — scanner, banner, policy, dashboard, monitoring
 * 4. How it works — 3-step flow
 * 5. Pricing table — Free / Starter $29 / Pro $49
 * 6. FAQ
 * 7. Final CTA
 */
export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 px-6 py-24 text-white lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Privacy compliance for businesses that{" "}
            <span className="text-navy-300">can&apos;t afford a legal team</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-navy-200">
            AI-powered cookie scanning, consent banners, and privacy policies —
            based on what your site actually does. Not a generic template.
            Starting at $29/month.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {/* TODO: Free scan CTA form (email + URL input) */}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-b border-navy-100 bg-white px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* TODO: Testimonial cards */}
        </div>
      </section>

      {/* Features */}
      <section className="bg-navy-50/30 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-navy-900">
            Everything you need for privacy compliance
          </h2>
          {/* TODO: Feature cards with icons */}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-navy-900">
            Simple, transparent pricing
          </h2>
          {/* TODO: Pricing table component */}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-navy-50/30 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-navy-900">
            Frequently asked questions
          </h2>
          {/* TODO: FAQ accordion */}
        </div>
      </section>
    </div>
  );
}
