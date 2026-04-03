/**
 * AI Privacy Policy Generator — uses Claude to generate a customized
 * privacy policy based on actual scan results.
 */
import Anthropic from "@anthropic-ai/sdk";

interface PolicyGenInput {
  domain: string;
  companyName: string;
  cookies: { name: string; category: string; service: string | null; description: string | null }[];
  trackers: { name: string; category: string; description: string }[];
  collectsPersonalData: boolean;
  personalDataTypes: string[];
  regulations: string[];
}

export interface GeneratedPolicy {
  markdown: string;
  html: string;
  sections: string[];
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generatePrivacyPolicy(
  input: PolicyGenInput,
): Promise<GeneratedPolicy> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    system: "You are a privacy policy expert. Output Markdown only — no code fences.",
    messages: [
      {
        role: "user",
        content: `Generate a comprehensive privacy policy for ${input.domain} (${input.companyName}).

SITE DATA FROM AUTOMATED SCAN:
Cookies: ${input.cookies.map((c) => `${c.name} (${c.category}${c.service ? `, ${c.service}` : ""})`).join("; ") || "None detected"}

Trackers: ${input.trackers.map((t) => `${t.name} - ${t.description}`).join("; ") || "None detected"}

Personal data collected: ${input.collectsPersonalData ? input.personalDataTypes.join(", ") : "No forms detected"}

Applicable regulations: ${input.regulations.join(", ")}

REQUIREMENTS:
1. Write in clear, readable language — not legalese
2. Include GDPR sections: data controller, legal basis, data subject rights, data retention, international transfers
3. Include CCPA sections: categories of personal information, right to know/delete/opt-out, non-discrimination
4. List the SPECIFIC cookies and trackers found above
5. Sections: Introduction, Information We Collect, How We Use Your Data, Cookies & Tracking Technologies, Third-Party Services, Your Privacy Rights, Data Retention, Security, Children's Privacy, Changes to This Policy, Contact Us
6. Use [COMPANY NAME], [COMPANY ADDRESS], [CONTACT EMAIL] as placeholders
7. Today's date: ${new Date().toISOString().split("T")[0]}

Output ONLY the privacy policy in Markdown format.`,
      },
    ],
  });

  const markdown = message.content[0]?.type === "text" ? message.content[0].text : "";

  // Extract section headings
  const sections = (markdown.match(/^#{1,3}\s+(.+)$/gm) ?? []).map((h) =>
    h.replace(/^#+\s+/, ""),
  );

  // Convert to basic HTML
  const html = markdownToHtml(markdown);

  return { markdown, html, sections };
}

function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Wrap remaining paragraphs
  const lines = html.split("\n\n");
  html = lines
    .map((block) => {
      const trimmed = block.trim();
      if (
        !trimmed ||
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<li")
      ) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  return html;
}
