/**
 * Compliance scoring engine for the scanner worker.
 * Re-exports from the shared compliance module adapted for scanner context.
 */

interface FindingInput {
  category: string;
  severity: string;
  regulations: string[];
}

interface ComplianceInput {
  findings: FindingInput[];
  hasPrivacyPolicy: boolean;
  hasCookieConsent: boolean;
  hasDoNotSellLink: boolean;
  trackersWithoutConsent: number;
  thirdPartyCookiesWithoutConsent: number;
  collectsPersonalData: boolean;
  personalDataTypes: string[];
}

interface ComplianceScores {
  overall: number;
  regulations: Record<string, number | null>;
}

const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 25,
  warning: 10,
  info: 3,
  ok: 0,
};

function scoreGDPR(input: ComplianceInput): number {
  let score = 100;
  if (!input.hasPrivacyPolicy) score -= 30;
  if (!input.hasCookieConsent) score -= 25;
  score -= Math.min(30, input.trackersWithoutConsent * 10);
  score -= Math.min(20, input.thirdPartyCookiesWithoutConsent * 5);

  for (const finding of input.findings) {
    if (finding.regulations.includes("gdpr") && finding.severity !== "ok") {
      score -= SEVERITY_WEIGHTS[finding.severity] ?? 0;
    }
  }
  return Math.max(0, Math.min(100, score));
}

function scoreCCPA(input: ComplianceInput): number {
  let score = 100;
  if (!input.hasPrivacyPolicy) score -= 25;
  if (!input.hasDoNotSellLink && input.trackersWithoutConsent > 0) score -= 30;
  if (!input.hasCookieConsent && input.trackersWithoutConsent > 0) score -= 20;

  for (const finding of input.findings) {
    if (finding.regulations.includes("ccpa") && finding.severity !== "ok") {
      score -= SEVERITY_WEIGHTS[finding.severity] ?? 0;
    }
  }
  return Math.max(0, Math.min(100, score));
}

export function calculateComplianceScores(input: ComplianceInput): ComplianceScores {
  const gdpr = scoreGDPR(input);
  const ccpa = scoreCCPA(input);
  const overall = Math.round((gdpr + ccpa) / 2);

  return {
    overall,
    regulations: {
      gdpr,
      ccpa,
      cpra: ccpa,
      vcdpa: null,
      ctdpa: null,
      cpa: null,
      ucpa: null,
    },
  };
}

export function generateRecommendations(input: ComplianceInput): string[] {
  const recs: string[] = [];
  if (!input.hasPrivacyPolicy) recs.push("Add a privacy policy to your website.");
  if (!input.hasCookieConsent) recs.push("Implement a cookie consent banner.");
  if (input.trackersWithoutConsent > 0) recs.push(`Block ${input.trackersWithoutConsent} tracker(s) until user consent.`);
  if (!input.hasDoNotSellLink && input.collectsPersonalData) recs.push('Add a "Do Not Sell" link.');
  return recs;
}
