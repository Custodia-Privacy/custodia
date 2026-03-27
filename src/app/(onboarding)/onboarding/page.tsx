"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc";

type Step = "website" | "questionnaire" | "results";

interface QuestionnaireData {
  businessType: string;
  collectsEmails: boolean | null;
  sellsOnline: boolean | null;
  customerRegions: string[];
  toolsUsed: string[];
}

const BUSINESS_TYPES = [
  "E-commerce / Online Store",
  "SaaS / Software",
  "Professional Services",
  "Healthcare",
  "Education",
  "Finance / Insurance",
  "Non-profit",
  "Media / Publishing",
  "Other",
];

const REGIONS = [
  { id: "eu", label: "Europe (GDPR)" },
  { id: "us-ca", label: "California (CCPA/CPRA)" },
  { id: "us-other", label: "Other US States" },
  { id: "uk", label: "United Kingdom" },
  { id: "canada", label: "Canada" },
  { id: "australia", label: "Australia" },
  { id: "global", label: "Worldwide / Not sure" },
];

const COMMON_TOOLS = [
  "Google Analytics",
  "Meta Pixel (Facebook)",
  "Mailchimp",
  "HubSpot",
  "Stripe",
  "Shopify",
  "Intercom",
  "Hotjar",
  "Zendesk",
  "Salesforce",
];

function severityLabel(s: string) {
  switch (s) {
    case "critical": return "Critical";
    case "high": return "High";
    case "medium": return "Medium";
    case "low": return "Low";
    default: return s;
  }
}

function severityColor(s: string) {
  switch (s) {
    case "critical": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800";
    case "high": return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800";
    case "medium": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
    case "low": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function riskScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function riskScoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Needs Work";
  if (score >= 40) return "At Risk";
  return "Critical";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("website");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [scanId, setScanId] = useState<string | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({
    businessType: "",
    collectsEmails: null,
    sellsOnline: null,
    customerRegions: [],
    toolsUsed: [],
  });

  const quickScan = api.scan.quick.useMutation();
  const scanResult = api.scan.quickResult.useQuery(
    { scanId: scanId! },
    { enabled: !!scanId, refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 2000;
    }},
  );

  const handleSubmitUrl = useCallback(() => {
    setUrlError("");
    let normalized = url.trim();
    if (!normalized) { setUrlError("Please enter your website URL"); return; }
    if (!/^https?:\/\//.test(normalized)) normalized = "https://" + normalized;
    try { new URL(normalized); } catch { setUrlError("Please enter a valid URL"); return; }

    quickScan.mutate({ url: normalized }, {
      onSuccess: (data) => {
        setScanId(data.scanId);
        setStep("questionnaire");
      },
      onError: (err) => setUrlError(err.message),
    });
  }, [url, quickScan]);

  const handleFinishQuestionnaire = useCallback(() => {
    setStep("results");
  }, []);

  const handleGoToDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const toggleRegion = (id: string) => {
    setQuestionnaire((prev) => ({
      ...prev,
      customerRegions: prev.customerRegions.includes(id)
        ? prev.customerRegions.filter((r) => r !== id)
        : [...prev.customerRegions, id],
    }));
  };

  const toggleTool = (tool: string) => {
    setQuestionnaire((prev) => ({
      ...prev,
      toolsUsed: prev.toolsUsed.includes(tool)
        ? prev.toolsUsed.filter((t) => t !== tool)
        : [...prev.toolsUsed, tool],
    }));
  };

  const scanData = scanResult.data;
  const scanDone = scanData?.status === "completed";
  const scanFailed = scanData?.status === "failed";
  const scores = scanData?.complianceScores as { overall?: number } | null;
  const riskScore = scores?.overall ?? 0;

  return (
    <div className="w-full max-w-xl">
      {/* Progress indicator */}
      <div className="mb-10 flex items-center justify-center gap-2">
        {(["website", "questionnaire", "results"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                step === s
                  ? "bg-navy-600 text-white"
                  : i < (["website", "questionnaire", "results"] as Step[]).indexOf(step)
                    ? "bg-navy-100 text-navy-700 dark:bg-navy-900 dark:text-navy-300"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="h-px w-12 bg-slate-200 dark:bg-slate-700" />}
          </div>
        ))}
      </div>

      {/* Step 1: Website URL */}
      {step === "website" && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Let&apos;s check your website
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter your website URL and we&apos;ll scan it for privacy issues, trackers, and compliance gaps.
          </p>

          <div className="mt-8">
            <label htmlFor="url" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Website URL
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitUrl()}
                placeholder="example.com"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSubmitUrl}
                disabled={quickScan.isPending}
                className="rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-700 disabled:opacity-50"
              >
                {quickScan.isPending ? "Scanning..." : "Scan"}
              </button>
            </div>
            {urlError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{urlError}</p>
            )}
          </div>

          <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
            We&apos;ll scan your homepage for cookies, trackers, third-party scripts, and privacy policy presence.
            This typically takes 15-30 seconds.
          </p>
        </div>
      )}

      {/* Step 2: Questionnaire */}
      {step === "questionnaire" && (
        <div className="animate-fade-in">
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Tell us about your business
            </h1>
            {scanId && !scanDone && !scanFailed && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-600 dark:bg-navy-950 dark:text-navy-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-navy-500" />
                Scanning...
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            This helps us create a personalized compliance plan. The scan is running in the background.
          </p>

          <div className="mt-8 space-y-8">
            {/* Business type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                What kind of business are you?
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => setQuestionnaire((p) => ({ ...p, businessType: bt }))}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      questionnaire.businessType === bt
                        ? "border-navy-300 bg-navy-50 text-navy-700 dark:border-navy-700 dark:bg-navy-950 dark:text-navy-300"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            </div>

            {/* Yes/No questions */}
            <div className="space-y-4">
              <YesNoQuestion
                label="Do you collect email addresses from visitors?"
                value={questionnaire.collectsEmails}
                onChange={(v) => setQuestionnaire((p) => ({ ...p, collectsEmails: v }))}
              />
              <YesNoQuestion
                label="Do you sell products or services online?"
                value={questionnaire.sellsOnline}
                onChange={(v) => setQuestionnaire((p) => ({ ...p, sellsOnline: v }))}
              />
            </div>

            {/* Customer regions */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Where are your customers located?
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRegion(r.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      questionnaire.customerRegions.includes(r.id)
                        ? "border-navy-300 bg-navy-50 text-navy-700 dark:border-navy-700 dark:bg-navy-950 dark:text-navy-300"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Which tools or services do you use?
              </label>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Select all that apply</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {COMMON_TOOLS.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      questionnaire.toolsUsed.includes(tool)
                        ? "border-navy-300 bg-navy-50 text-navy-700 dark:border-navy-700 dark:bg-navy-950 dark:text-navy-300"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinishQuestionnaire}
            className="mt-10 w-full rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-700"
          >
            See My Results
          </button>
        </div>
      )}

      {/* Step 3: Results */}
      {step === "results" && (
        <div className="animate-fade-in">
          {!scanDone && !scanFailed ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-navy-200 border-t-navy-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Finishing your scan...</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This usually takes a few more seconds.</p>
            </div>
          ) : scanFailed ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Scan couldn&apos;t complete</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {scanData?.errorMessage || "Something went wrong. You can try again from the dashboard."}
              </p>
              <button
                type="button"
                onClick={handleGoToDashboard}
                className="mt-6 rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-700"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Your Privacy Risk Score
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  for {scanData?.domain}
                </p>
              </div>

              {/* Risk score */}
              <div className="mt-8 flex flex-col items-center">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <svg className="absolute inset-0" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                    <circle
                      cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8"
                      strokeDasharray={`${(riskScore / 100) * 351.86} 351.86`}
                      strokeLinecap="round"
                      transform="rotate(-90 64 64)"
                      className={riskScoreColor(riskScore)}
                    />
                  </svg>
                  <span className={`text-3xl font-bold ${riskScoreColor(riskScore)}`}>
                    {riskScore}
                  </span>
                </div>
                <p className={`mt-3 text-sm font-semibold ${riskScoreColor(riskScore)}`}>
                  {riskScoreLabel(riskScore)}
                </p>
              </div>

              {/* Findings / Roadmap */}
              {scanData?.findings && scanData.findings.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Your Compliance Roadmap
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Prioritized issues to fix — most critical first
                  </p>

                  <div className="mt-4 space-y-3">
                    {scanData.findings.map((f, i) => (
                      <div
                        key={f.id}
                        className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {f.title}
                            </span>
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityColor(f.severity)}`}>
                              {severityLabel(f.severity)}
                            </span>
                          </div>
                          {f.description && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {f.description}
                            </p>
                          )}
                          {f.recommendation && (
                            <p className="mt-1.5 text-xs text-navy-600 dark:text-navy-400">
                              {f.recommendation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan upsell */}
              <div className="mt-10 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Unlock your full compliance stack
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  The scan is just the start. Starter includes your consent banner, privacy policy, weekly monitoring, and compliance dashboard — all from $29/mo.
                </p>
                <ul className="mt-3 space-y-1.5">
                  {[
                    "Auto-generated consent banner",
                    "AI privacy policy",
                    "Weekly re-scans & alerts",
                    "Compliance dashboard",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <span className="text-emerald-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="/pricing"
                  className="mt-4 flex w-full items-center justify-center rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-700"
                >
                  Start Free Trial — $29/mo
                </a>
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleGoToDashboard}
                  className="text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Continue to dashboard →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function YesNoQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex gap-1.5">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
              value === v
                ? "border-navy-300 bg-navy-50 text-navy-700 dark:border-navy-700 dark:bg-navy-950 dark:text-navy-300"
                : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
            }`}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}
