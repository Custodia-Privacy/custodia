const steps = [
  {
    step: "01",
    title: "Scan your site",
    description:
      "Enter your URL and our AI-powered crawler identifies every cookie, tracker, pixel, and third-party script on your website in under 60 seconds.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    ),
  },
  {
    step: "02",
    title: "AI builds your compliance stack",
    description:
      "Based on scan results, AI generates your consent banner, privacy policy, cookie policy, and data map — all customized to your actual site.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    ),
  },
  {
    step: "03",
    title: "Stay compliant automatically",
    description:
      "Weekly re-scans detect new trackers, auto-update policies, and alert you to compliance changes. Your AI privacy team never sleeps.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    ),
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-slate-50 py-20 md:py-28 dark:bg-slate-900/50"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-navy-600 dark:text-navy-400">
            Simple setup
          </p>
          <h2 className="mt-2 text-3xl font-bold text-navy-950 sm:text-4xl dark:text-white">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
            Go from zero to fully compliant in minutes, not months.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.step} className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-950 text-white dark:bg-navy-600">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  {step.icon}
                </svg>
              </div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-navy-500 dark:text-navy-400">
                Step {step.step}
              </span>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
