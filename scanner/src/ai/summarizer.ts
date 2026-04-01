/**
 * AI Scan Summarizer — uses Claude to generate plain-English summaries
 * of scan results for the compliance dashboard.
 */
import OpenAI from "openai";

interface ScanSummaryInput {
  domain: string;
  pagesCrawled: number;
  cookies: { name: string; category: string; service: string | null }[];
  trackers: { name: string; category: string }[];
  forms: { url: string; collectsPersonalData: boolean; fieldCount: number }[];
  scripts: { src: string; service: string | null; isThirdParty: boolean }[];
}

export interface ScanSummary {
  overview: string;
  keyFindings: string[];
  complianceRisks: string[];
  recommendations: string[];
}

const client = new OpenAI({
  apiKey: process.env.ZHIPUAI_API_KEY,
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
});

export async function summarizeScan(input: ScanSummaryInput): Promise<ScanSummary> {
  const thirdPartyScripts = input.scripts.filter((s) => s.isThirdParty);
  const piiCollectingForms = input.forms.filter((f) => f.collectsPersonalData);

  const completion = await client.chat.completions.create({
    model: "glm-4.5-flash",
    max_tokens: 1500,
    messages: [
      { role: "system", content: "You are a privacy compliance analyst. Respond ONLY with valid JSON — no markdown fences." },
      {
        role: "user",
        content: `Analyze this website privacy scan and provide a concise summary. Respond with JSON:
{"overview":"string","keyFindings":["string"],"complianceRisks":["string"],"recommendations":["string"]}

SCAN DATA FOR ${input.domain}:
- Pages crawled: ${input.pagesCrawled}
- Cookies found: ${input.cookies.length} (${input.cookies.filter((c) => c.category === "analytics").length} analytics, ${input.cookies.filter((c) => c.category === "marketing").length} marketing, ${input.cookies.filter((c) => c.category === "necessary").length} necessary, ${input.cookies.filter((c) => c.category === "unknown").length} unclassified)
- Known services: ${[...new Set(input.cookies.filter((c) => c.service).map((c) => c.service))].join(", ") || "none"}
- Trackers: ${input.trackers.map((t) => `${t.name} (${t.category})`).join(", ") || "none"}
- Third-party scripts: ${thirdPartyScripts.length} (${[...new Set(thirdPartyScripts.filter((s) => s.service).map((s) => s.service))].join(", ") || "unidentified"})
- Forms collecting personal data: ${piiCollectingForms.length}
- Total forms: ${input.forms.length}

Keep findings specific and actionable. Use plain English, not legalese. Limit to 3-5 key findings, 2-4 compliance risks, and 3-5 recommendations.`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "{}";

  try {
    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      overview: parsed.overview ?? "",
      keyFindings: parsed.keyFindings ?? [],
      complianceRisks: parsed.complianceRisks ?? [],
      recommendations: parsed.recommendations ?? [],
    };
  } catch {
    // Fallback if AI response isn't valid JSON
    return {
      overview: `Scan of ${input.domain} found ${input.cookies.length} cookies, ${input.trackers.length} trackers, and ${input.forms.length} forms across ${input.pagesCrawled} pages.`,
      keyFindings: [
        `${input.cookies.length} cookies detected (${input.cookies.filter((c) => c.category === "unknown").length} unclassified)`,
        `${input.trackers.length} third-party trackers identified`,
        `${piiCollectingForms.length} forms collecting personal data`,
      ],
      complianceRisks: input.trackers.length > 0
        ? ["Third-party trackers may require user consent under GDPR"]
        : [],
      recommendations: [
        "Review and classify all cookies",
        "Implement cookie consent before loading trackers",
      ],
    };
  }
}
