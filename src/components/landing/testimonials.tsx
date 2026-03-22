const testimonials = [
  {
    quote:
      "I was spending $3,000/year on a privacy consultant who basically copy-pasted templates. Custodia does a better job for $29/month and actually keeps up when I add new tools.",
    name: "Sarah Chen",
    role: "Solo SaaS Founder",
    company: "TaskFlow",
  },
  {
    quote:
      "We got a GDPR compliance request from a European customer and had no idea where to start. Custodia had our privacy policy, cookie banner, and DSAR portal set up in an afternoon.",
    name: "Marcus Rivera",
    role: "E-commerce Store Owner",
    company: "Riviera Goods",
  },
  {
    quote:
      "We manage 15 client sites. Instead of manually auditing each one for privacy compliance, we run Custodia scans and get instant reports. Game changer for our agency.",
    name: "Emily Okoro",
    role: "Web Agency Director",
    company: "Brightpath Digital",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-navy-600 dark:text-navy-400">
            Testimonials
          </p>
          <h2 className="mt-2 text-3xl font-bold text-navy-950 sm:text-4xl dark:text-white">
            Trusted by businesses like yours
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-700 dark:bg-navy-900 dark:text-navy-300">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
