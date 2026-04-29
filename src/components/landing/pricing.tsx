import Link from "next/link";

const tiers = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    description: "Everything a single-site business needs to stay compliant.",
    features: [
      "1 website",
      "Weekly automated scans",
      "Cookie consent banner",
      "AI privacy policy",
      "Compliance score & dashboard",
      "3 team members",
      "Email support",
    ],
    cta: "Get Started Free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$79",
    period: "/mo",
    description:
      "For growing businesses that handle customer data requests.",
    features: [
      "Up to 5 websites",
      "Daily automated scans",
      "Everything in Starter",
      "Data request portal & tracking",
      "Data inventory & mapping",
      "Custom branding",
      "Priority support",
    ],
    cta: "Get Started Free",
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$149",
    period: "/mo",
    description: "Full compliance stack for serious operations.",
    features: [
      "Up to 25 websites",
      "Everything in Growth",
      "Advanced data governance",
      "API & MCP access",
      "Team collaboration (50 seats)",
      "Dedicated onboarding",
    ],
    cta: "Get Started Free",
    href: "/signup",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-navy-600 dark:text-navy-400">
            Pricing
          </p>
          <h2 className="mt-2 text-3xl font-bold text-navy-950 sm:text-4xl dark:text-white">
            Compliance shouldn&apos;t cost a fortune
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
            Enterprise-grade privacy compliance at small business prices.
            Start on the free tier, upgrade any time — cancel with one click.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                tier.highlighted
                  ? "border-navy-500 bg-navy-950 text-white shadow-xl shadow-navy-950/20 dark:border-navy-400 dark:bg-navy-900"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-navy-500 px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}

              <h3
                className={`text-lg font-semibold ${
                  tier.highlighted
                    ? "text-white"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {tier.name}
              </h3>

              <div className="mt-4 flex items-baseline gap-1">
                <span
                  className={`text-5xl font-bold tracking-tight ${
                    tier.highlighted
                      ? "text-white"
                      : "text-navy-950 dark:text-white"
                  }`}
                >
                  {tier.price}
                </span>
                <span
                  className={`text-sm ${
                    tier.highlighted
                      ? "text-navy-200"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {tier.period}
                </span>
              </div>

              <p
                className={`mt-4 text-sm leading-relaxed ${
                  tier.highlighted
                    ? "text-navy-200"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {tier.description}
              </p>

              <ul className="mt-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        tier.highlighted ? "text-navy-300" : "text-compliant"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    <span
                      className={`text-sm ${
                        tier.highlighted
                          ? "text-navy-100"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors ${
                  tier.highlighted
                    ? "bg-white text-navy-950 hover:bg-navy-50"
                    : "bg-navy-950 text-white hover:bg-navy-900 dark:bg-navy-600 dark:hover:bg-navy-500"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Need a free scan first?{" "}
          <a href="#cta" className="font-medium text-navy-600 hover:text-navy-700 dark:text-navy-400">
            Try it without signing up
          </a>
        </p>
      </div>
    </section>
  );
}
