/**
 * AI Privacy Policy Analyzer — determines whether the site's privacy policy
 * adequately covers the personal information being collected and the
 * third-party services / trackers detected during the scan.
 */
import Anthropic from "@anthropic-ai/sdk";

export interface PolicyAnalysisInput {
  domain: string;
  policyText: string;
  personalDataTypes: string[];
  trackers: { name: string; category: string }[];
  formsCollectingPII: { url: string; fields: string[] }[];
  hasCookieConsent: boolean;
}

export interface PolicyGap {
  topic: string;
  severity: "critical" | "warning" | "info";
  description: string;
  recommendation: string;
}

export interface PolicyAnalysisResult {
  overallAdequacy: "adequate" | "partial" | "inadequate";
  coveredTopics: string[];
  gaps: PolicyGap[];
  summary: string;
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzePrivacyPolicy(
  input: PolicyAnalysisInput,
): Promise<PolicyAnalysisResult> {
  const trackerList = input.trackers.length > 0
    ? input.trackers.map((t) => `${t.name} (${t.category})`).join(", ")
    : "none detected";

  const formList = input.formsCollectingPII.length > 0
    ? input.formsCollectingPII
        .map((f) => `${new URL(f.url).pathname}: collects ${f.fields.join(", ")}`)
        .join("\n")
    : "none detected";

  const piiList = input.personalDataTypes.length > 0
    ? input.personalDataTypes.join(", ")
    : "none detected";

  const prompt = `You are a privacy compliance analyst. Analyze this privacy policy and determine whether it adequately covers the data collection practices detected on the website.

WEBSITE: ${input.domain}
COOKIE CONSENT BANNER: ${input.hasCookieConsent ? "Present" : "Not detected"}

DETECTED PERSONAL DATA TYPES: ${piiList}

DETECTED TRACKERS/THIRD-PARTY SERVICES:
${trackerList}

FORMS COLLECTING PERSONAL DATA:
${formList}

PRIVACY POLICY TEXT (truncated):
${input.policyText.slice(0, 10_000)}

---

Analyze whether the privacy policy adequately addresses:
1. Each type of personal data being collected (email, name, phone, address, etc.)
2. Each third-party tracker/service and its purpose
3. Legal basis for data processing (GDPR)
4. Data retention periods
5. User rights (access, deletion, portability)
6. Cookie usage and consent
7. Data sharing with third parties
8. Contact information for privacy inquiries

Respond with ONLY valid JSON (no markdown fences):
{
  "overallAdequacy": "adequate" | "partial" | "inadequate",
  "coveredTopics": ["list of topics the policy covers well"],
  "gaps": [
    {
      "topic": "what is missing",
      "severity": "critical" | "warning" | "info",
      "description": "detailed explanation of the gap",
      "recommendation": "specific action to fix"
    }
  ],
  "summary": "1-2 sentence overall assessment"
}

Focus on actionable gaps. A "critical" gap is something legally required (like missing disclosure of PII collection). A "warning" is best practice but not legally mandated everywhere. "info" is nice-to-have.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      system: "You are a privacy compliance analyst specializing in GDPR, CCPA, and global data protection regulations. Respond ONLY with valid JSON — no markdown fences.",
      messages: [
        { role: "user", content: prompt },
      ],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      overallAdequacy: parsed.overallAdequacy ?? "partial",
      coveredTopics: Array.isArray(parsed.coveredTopics) ? parsed.coveredTopics : [],
      gaps: Array.isArray(parsed.gaps)
        ? parsed.gaps.map((g: any) => ({
            topic: g.topic ?? "Unknown",
            severity: ["critical", "warning", "info"].includes(g.severity) ? g.severity : "warning",
            description: g.description ?? "",
            recommendation: g.recommendation ?? "",
          }))
        : [],
      summary: parsed.summary ?? "Unable to determine policy adequacy.",
    };
  } catch (err) {
    console.error("[policy-analyzer] AI analysis failed:", err);
    return buildFallbackAnalysis(input);
  }
}

function buildFallbackAnalysis(input: PolicyAnalysisInput): PolicyAnalysisResult {
  const gaps: PolicyGap[] = [];
  const policyLower = input.policyText.toLowerCase();

  for (const dataType of input.personalDataTypes) {
    const searchTerms = DATA_TYPE_SEARCH_TERMS[dataType] ?? [dataType];
    const mentioned = searchTerms.some((term) => policyLower.includes(term.toLowerCase()));
    if (!mentioned) {
      gaps.push({
        topic: `${dataType} data collection`,
        severity: "critical",
        description: `The privacy policy does not appear to mention the collection of ${dataType} data, which was detected on the website.`,
        recommendation: `Add a section to your privacy policy explaining what ${dataType} data you collect, why, and the legal basis.`,
      });
    }
  }

  for (const tracker of input.trackers) {
    const nameLower = tracker.name.toLowerCase();
    const shortName = nameLower.split(/[\s(]/)[0];
    const mentioned = policyLower.includes(nameLower) || policyLower.includes(shortName);
    if (!mentioned) {
      gaps.push({
        topic: `${tracker.name} disclosure`,
        severity: "warning",
        description: `The privacy policy does not mention ${tracker.name}, a ${tracker.category} service detected on the website.`,
        recommendation: `Disclose the use of ${tracker.name} in your privacy policy, including its purpose and data sharing implications.`,
      });
    }
  }

  const overallAdequacy = gaps.filter((g) => g.severity === "critical").length > 0
    ? "inadequate"
    : gaps.length > 0
      ? "partial"
      : "adequate";

  return {
    overallAdequacy,
    coveredTopics: [],
    gaps,
    summary: gaps.length > 0
      ? `Found ${gaps.length} gap(s) in the privacy policy coverage.`
      : "The privacy policy appears to cover the detected data practices.",
  };
}

const DATA_TYPE_SEARCH_TERMS: Record<string, string[]> = {
  email: ["email", "e-mail", "email address"],
  phone: ["phone", "telephone", "mobile number", "phone number"],
  name: ["name", "full name", "first name", "last name"],
  address: ["address", "mailing address", "postal address", "street address"],
  ssn: ["social security", "ssn", "national identification"],
  date_of_birth: ["date of birth", "birthday", "birth date", "age"],
  financial: ["credit card", "payment", "financial", "billing", "bank"],
  password: ["password", "credentials", "authentication"],
};
