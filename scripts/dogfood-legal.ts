/**
 * Dogfood script: run Custodia's own scanner + PolicyAgent against
 * custodia-privacy.com, export the generated policy markdown to disk.
 *
 * Also generates a Terms of Service via a parallel Claude call (no ToS
 * agent exists in-product — a gap we should close post-launch).
 *
 * Usage: npx tsx scripts/dogfood-legal.ts
 *
 * Idempotent: re-running upserts the dogfood org/user/site, creates a
 * fresh scan + agent run, regenerates the policy with an incremented
 * version.
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { runQuickScan } from "../src/lib/quick-scanner";
import { PolicyAgent } from "../src/agents/policy-agent";
import { getAI, getAIModel } from "../src/lib/ai";

const DOMAIN = "custodia-privacy.com";
const ORG_SLUG = "custodia-internal";
const ORG_NAME = "Custodia (internal dogfood)";
const OWNER_EMAIL = "hello@custodia-privacy.com";

async function main() {
  const db = new PrismaClient();

  console.log("[1/7] Upsert Custodia owner user + org + site...");
  const user = await db.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {},
    create: { email: OWNER_EMAIL, name: "Custodia" },
  });

  const org = await db.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: { slug: ORG_SLUG, name: ORG_NAME, plan: "business" },
  });

  await db.orgMember.upsert({
    where: { orgId_userId: { orgId: org.id, userId: user.id } },
    update: { role: "owner" },
    create: { userId: user.id, orgId: org.id, role: "owner" },
  });

  const site = await db.site.upsert({
    where: { orgId_domain: { orgId: org.id, domain: DOMAIN } },
    update: { deletedAt: null },
    create: { orgId: org.id, domain: DOMAIN, name: DOMAIN },
  });
  console.log(`      org=${org.id}  site=${site.id}  user=${user.id}`);

  console.log("[2/7] Creating new Scan row...");
  const scan = await db.scan.create({
    data: { siteId: site.id, status: "queued", scanType: "quick" },
  });

  console.log(`[3/7] Running real quick scanner against https://${DOMAIN}...`);
  const scanResult = await runQuickScan(db, scan.id, site.id, DOMAIN);
  console.log(
    `      findings=${scanResult.findingsCreated} ` +
      `policy=${scanResult.hasPrivacyPolicy} banner=${scanResult.hasConsentBanner} ` +
      `trackers=[${scanResult.trackersFound.join(", ")}]`,
  );

  // quick-scanner does NOT flip status to completed — the worker normally
  // does. For dogfood we finalize it manually.
  await db.scan.update({
    where: { id: scan.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      summary: {
        hasPrivacyPolicy: scanResult.hasPrivacyPolicy,
        hasConsentBanner: scanResult.hasConsentBanner,
        trackers: scanResult.trackersFound,
      },
      rawData: {
        totalCookies: 0,
        totalTrackers: scanResult.trackersFound.length,
        hasCookieConsent: scanResult.hasConsentBanner,
        hasDoNotSellLink: false,
        personalDataTypes: [],
      },
    },
  });

  console.log("[4/7] Creating AgentRun for PolicyAgent...");
  const run = await db.agentRun.create({
    data: {
      orgId: org.id,
      agentType: "policy_generator",
      trigger: "manual",
      status: "queued",
      input: { siteId: site.id },
    },
  });

  console.log("[5/7] Invoking PolicyAgent (real agent, real Claude)...");
  const agent = new PolicyAgent(org.id, run.id, db);
  await agent.execute({ siteId: site.id });

  const finishedRun = await db.agentRun.findUniqueOrThrow({ where: { id: run.id } });
  if (finishedRun.status !== "completed") {
    throw new Error(
      `PolicyAgent failed: status=${finishedRun.status} output=${JSON.stringify(finishedRun.output)}`,
    );
  }
  console.log(`      tokens=${finishedRun.tokensUsed}  cost=${finishedRun.costCents}¢`);

  const policy = await db.policy.findFirstOrThrow({
    where: { siteId: site.id, type: "privacy_policy" },
  });

  console.log("[6/7] Generating Terms of Service (ToS) via Claude directly...");
  const tos = await generateTerms();

  console.log("[7/7] Writing markdown outputs to content/legal/...");
  const outDir = path.join(__dirname, "..", "content", "legal");
  fs.mkdirSync(outDir, { recursive: true });
  const meta = {
    generatedAt: new Date().toISOString(),
    scanId: scan.id,
    policyVersion: policy.version,
    agentRunId: run.id,
    tokensUsed: finishedRun.tokensUsed,
    findingsCount: scanResult.findingsCreated,
    trackersDetected: scanResult.trackersFound,
    model: getAIModel(),
  };
  fs.writeFileSync(
    path.join(outDir, "privacy.md"),
    substitutePlaceholders(policy.contentMarkdown ?? ""),
    "utf8",
  );
  fs.writeFileSync(path.join(outDir, "terms.md"), tos, "utf8");
  fs.writeFileSync(path.join(outDir, "_meta.json"), JSON.stringify(meta, null, 2), "utf8");

  console.log("\nDone. Outputs:");
  console.log(`  content/legal/privacy.md  (v${policy.version}, ${(policy.contentMarkdown ?? "").length} chars)`);
  console.log(`  content/legal/terms.md    (${tos.length} chars)`);
  console.log(`  content/legal/_meta.json`);
  console.log("\nReview, commit, deploy.");
  await db.$disconnect();
}

/**
 * Replace the PolicyAgent's generic placeholders with Custodia-specific
 * values. The agent deliberately emits [ORGANIZATION_NAME] etc. so the
 * same output template can be reused by tenants.
 */
function substitutePlaceholders(md: string): string {
  const today = new Date().toISOString().split("T")[0];
  return md
    .replace(/\[ORGANIZATION_NAME\]/g, "Custodia")
    .replace(/\[CONTACT_EMAIL\]/g, "privacy@custodia-privacy.com")
    .replace(/\[DPO_NAME\]/g, "Custodia Privacy Team")
    .replace(/\[Effective Date\]/g, today)
    .replace(/\[Last Updated\]/g, today)
    .replace(/\[DATE\]/g, today);
}

async function generateTerms(): Promise<string> {
  const ai = getAI();
  const res = await ai.chat.completions.create({
    model: getAIModel(),
    max_tokens: 5000,
    messages: [
      {
        role: "system",
        content: `You write clear, defensible Terms of Service for SaaS products. Output Markdown only — no preamble, no explanation, just the ToS itself. Use plain language. Avoid aspirational language. Be accurate about what the service does and does not do.`,
      },
      {
        role: "user",
        content: `Write a Terms of Service for Custodia, a B2B SaaS for privacy compliance. Facts about Custodia:

- Service: automated privacy scanning of customer websites, AI-generated privacy policies, cookie consent banners, DSAR intake portal, compliance dashboard
- Pricing: Free tier + paid tiers $29/$79/$149 per month billed via Stripe
- Customers: small-to-medium businesses that need GDPR / CCPA / CPRA compliance
- Operator: Custodia (a sole operator for now, not yet incorporated; address these facts honestly in the ToS with a [Legal Entity Name] placeholder the operator can fill in)
- Data handled: customer-provided website URLs, scan results, policy content. No end-consumer PII beyond DSAR records submitted by the customer's end-users.
- Support: email only (privacy@custodia-privacy.com)
- Governing law: [Jurisdiction] placeholder
- Cancellation: customer can cancel any time via the in-app Stripe Customer Portal

Sections to include, in this order, each as an H2 heading:
1. Acceptance of Terms
2. Description of Service
3. Accounts and Eligibility (must be 18+, accurate info, account security)
4. Subscriptions, Billing, and Cancellation (subscription model, auto-renewal, cancel anytime via portal, refund policy — no refunds for partial months; annual customers get pro-rated)
5. Acceptable Use (no abuse, no scanning sites you don't own/have permission to scan, no reverse engineering)
6. Customer Content and Data (customer owns their data, they grant Custodia a license to process it only to deliver the service; see Privacy Policy for specifics; data deleted within 30 days of account closure)
7. AI-Generated Content Disclaimer (Custodia's policy and ToS generators produce outputs that are starting points, not legal advice; customer is responsible for reviewing with qualified counsel before publishing; Custodia provides the tool, not legal services)
8. Third-Party Services (Stripe for billing, Anthropic for AI, AWS for hosting — standard subprocessor disclosure)
9. Service Availability (best-effort uptime, no formal SLA on free or paid tiers at this time, right to change or suspend the service)
10. Termination (customer or Custodia can terminate; Custodia can terminate for cause)
11. Disclaimers and Limitation of Liability (service provided "as is"; Custodia's liability capped at fees paid in the 12 months prior; no consequential damages; this is NOT legal advice; customer remains responsible for their own compliance)
12. Indemnification (customer indemnifies Custodia for customer's misuse)
13. Changes to Terms (Custodia may change these terms with 30 days notice)
14. Governing Law and Dispute Resolution
15. Contact

Include an "Effective Date" at the top (placeholder). Keep it readable — short paragraphs, no sub-sub-clauses. Target ~2,500-3,500 words. Do NOT include any language that promises outcomes, guarantees compliance, or implies Custodia is a law firm.`,
      },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}

main().catch((err) => {
  console.error("\nDOGFOOD FAILED:", err);
  process.exit(1);
});
