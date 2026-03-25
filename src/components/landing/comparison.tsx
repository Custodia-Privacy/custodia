const competitors = [
  {
    name: "Custodia",
    highlight: true,
    values: {
      price: "From $29/mo",
      cookieBanner: true,
      policyGenerator: true,
      scanner: true,
      dataMapping: true,
      dsar: true,
      pia: true,
      consentMode: true,
      multiJurisdiction: true,
      aiPowered: true,
      setupTime: "5 minutes",
    },
  },
  {
    name: "CookieBot",
    highlight: false,
    values: {
      price: "From $14/mo",
      cookieBanner: true,
      policyGenerator: false,
      scanner: true,
      dataMapping: false,
      dsar: false,
      pia: false,
      consentMode: true,
      multiJurisdiction: true,
      aiPowered: false,
      setupTime: "30 minutes",
    },
  },
  {
    name: "OneTrust",
    highlight: false,
    values: {
      price: "$5,000+/yr",
      cookieBanner: true,
      policyGenerator: true,
      scanner: true,
      dataMapping: true,
      dsar: true,
      pia: true,
      consentMode: true,
      multiJurisdiction: true,
      aiPowered: false,
      setupTime: "Weeks",
    },
  },
];

const featureRows: { key: keyof (typeof competitors)[0]["values"]; label: string }[] = [
  { key: "price", label: "Starting Price" },
  { key: "cookieBanner", label: "Cookie Consent Banner" },
  { key: "policyGenerator", label: "AI Policy Generator" },
  { key: "scanner", label: "Website Scanner" },
  { key: "dataMapping", label: "Data Mapping" },
  { key: "dsar", label: "DSAR Management" },
  { key: "pia", label: "Privacy Impact Assessments" },
  { key: "consentMode", label: "Google Consent Mode v2" },
  { key: "multiJurisdiction", label: "Multi-Jurisdiction" },
  { key: "aiPowered", label: "AI-Powered" },
  { key: "setupTime", label: "Setup Time" },
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

export function Comparison() {
  return (
    <section className="bg-slate-50 py-20 md:py-28 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-navy-600 dark:text-navy-400">
            Comparison
          </p>
          <h2 className="mt-2 text-3xl font-bold text-navy-950 sm:text-4xl dark:text-white">
            Full platform, fraction of the cost
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
            Cookie-only tools are too thin. Enterprise platforms are too
            expensive. Custodia is the sweet spot.
          </p>
        </div>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr>
                <th className="pb-4 pr-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Feature
                </th>
                {competitors.map((c) => (
                  <th
                    key={c.name}
                    className={`pb-4 text-center text-sm font-semibold ${
                      c.highlight
                        ? "text-navy-700 dark:text-navy-300"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureRows.map((row) => (
                <tr
                  key={row.key}
                  className="border-t border-slate-200 dark:border-slate-700"
                >
                  <td className="py-3 pr-4 text-sm text-slate-600 dark:text-slate-400">
                    {row.label}
                  </td>
                  {competitors.map((c) => (
                    <td
                      key={c.name}
                      className={`py-3 text-center ${
                        c.highlight
                          ? "bg-navy-50/50 dark:bg-navy-950/20"
                          : ""
                      }`}
                    >
                      <CellValue value={c.values[row.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
