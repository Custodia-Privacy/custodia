/**
 * Compliance scoring engine.
 * Scores a site's compliance against GDPR, CCPA, and other privacy regulations.
 */
import type { ComplianceScores, Regulation } from "@/types";

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

/** Severity weights for scoring */
const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 25,
  warning: 10,
  info: 3,
  ok: 0,
};

/** Score GDPR compliance (0–100) */
function scoreGDPR(input: ComplianceInput): number {
  let score = 100;

  // No privacy policy is critical
  if (!input.hasPrivacyPolicy) score -= 30;

  // No cookie consent mechanism
  if (!input.hasCookieConsent) score -= 25;

  // Trackers firing without consent (opt-in required for GDPR)
  score -= Math.min(30, input.trackersWithoutConsent * 10);

  // Third-party cookies without consent
  score -= Math.min(20, input.thirdPartyCookiesWithoutConsent * 5);

  // Deduct for GDPR-specific findings
  for (const finding of input.findings) {
    if (finding.regulations.includes("gdpr") && finding.severity !== "ok") {
      score -= SEVERITY_WEIGHTS[finding.severity] ?? 0;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/** Score CCPA compliance (0–100) */
function scoreCCPA(input: ComplianceInput): number {
  let score = 100;

  // No privacy policy
  if (!input.hasPrivacyPolicy) score -= 25;

  // No "Do Not Sell" link (required for CCPA)
  if (!input.hasDoNotSellLink && input.trackersWithoutConsent > 0) score -= 30;

  // No opt-out mechanism
  if (!input.hasCookieConsent && input.trackersWithoutConsent > 0) score -= 20;

  // Deduct for CCPA-specific findings
  for (const finding of input.findings) {
    if (finding.regulations.includes("ccpa") && finding.severity !== "ok") {
      score -= SEVERITY_WEIGHTS[finding.severity] ?? 0;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/** Calculate compliance scores for all applicable regulations */
export function calculateComplianceScores(input: ComplianceInput): ComplianceScores {
  const gdpr = scoreGDPR(input);
  const ccpa = scoreCCPA(input);

  // Overall = weighted average of applicable regulations
  const overall = Math.round((gdpr + ccpa) / 2);

  return {
    overall,
    regulations: {
      gdpr,
      ccpa,
      cpra: ccpa, // CPRA extends CCPA — use same score
      vcdpa: null,
      ctdpa: null,
      cpa: null,
      ucpa: null,
    },
  };
}

/** Get score color for UI (red/yellow/green) */
export function getScoreStatus(score: number): "critical" | "warning" | "good" {
  if (score < 50) return "critical";
  if (score < 80) return "warning";
  return "good";
}

/** Generate recommendations based on compliance gaps */
export function generateRecommendations(input: ComplianceInput): string[] {
  const recommendations: string[] = [];

  if (!input.hasPrivacyPolicy) {
    recommendations.push(
      "Add a privacy policy to your website. This is required by both GDPR and CCPA.",
    );
  }

  if (!input.hasCookieConsent) {
    recommendations.push(
      "Implement a cookie consent banner. GDPR requires opt-in consent before setting non-essential cookies.",
    );
  }

  if (input.trackersWithoutConsent > 0) {
    recommendations.push(
      `${input.trackersWithoutConsent} tracker(s) are loading without user consent. Under GDPR, tracking scripts must not fire until the user consents.`,
    );
  }

  if (input.thirdPartyCookiesWithoutConsent > 0) {
    recommendations.push(
      `${input.thirdPartyCookiesWithoutConsent} third-party cookie(s) are set without consent. Block these until the user opts in.`,
    );
  }

  if (!input.hasDoNotSellLink && input.collectsPersonalData) {
    recommendations.push(
      'Add a "Do Not Sell My Personal Information" link, required by CCPA for businesses serving California residents.',
    );
  }

  if (input.personalDataTypes.length > 0) {
    recommendations.push(
      `Your site collects ${input.personalDataTypes.join(", ")} data. Ensure you document the purpose and legal basis for each type in your privacy policy.`,
    );
  }

  return recommendations;
}
