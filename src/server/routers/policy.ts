import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../trpc";
import { PLANS } from "@/lib/stripe";
import { DEFAULT_POLICY_PAGE_STYLE, type PolicyPageStyle } from "@/lib/policy-page-defaults";
import { extractSiteBranding } from "@/lib/color-utils";
import { getAI, getAIModel } from "@/lib/ai";

const policyTypeEnum = z.enum([
  "privacy_policy",
  "cookie_policy",
  "terms_of_service",
  "acceptable_use",
  "data_processing",
  "custom",
]);

const POLICY_TYPE_LABELS: Record<string, string> = {
  privacy_policy: "Privacy Policy",
  cookie_policy: "Cookie Policy",
  terms_of_service: "Terms of Service",
  acceptable_use: "Acceptable Use Policy",
  data_processing: "Data Processing Agreement",
  custom: "Custom Policy",
};

export const policyRouter = createRouter({
  /** List all policies for a site */
  list: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      return ctx.db.policy.findMany({
        where: { siteId: input.siteId },
        select: {
          id: true,
          type: true,
          title: true,
          version: true,
          publishedAt: true,
          updatedAt: true,
          createdAt: true,
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  /** Get a specific policy by siteId + type */
  get: orgProcedure
    .input(z.object({
      siteId: z.string().uuid(),
      type: policyTypeEnum.default("privacy_policy"),
    }))
    .query(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      return ctx.db.policy.findUnique({
        where: { siteId_type: { siteId: input.siteId, type: input.type } },
      });
    }),

  /** Get version history for a policy */
  versions: orgProcedure
    .input(z.object({
      siteId: z.string().uuid(),
      type: policyTypeEnum.default("privacy_policy"),
    }))
    .query(async ({ ctx, input }) => {
      const policy = await ctx.db.policy.findUnique({
        where: { siteId_type: { siteId: input.siteId, type: input.type } },
      });
      if (!policy) return [];

      return ctx.db.policyVersion.findMany({
        where: { policyId: policy.id },
        select: {
          id: true,
          version: true,
          changeNote: true,
          createdBy: true,
          createdAt: true,
        },
        orderBy: { version: "desc" },
        take: 50,
      });
    }),

  /** Get a specific version's content */
  getVersion: orgProcedure
    .input(z.object({ versionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const ver = await ctx.db.policyVersion.findUnique({
        where: { id: input.versionId },
        include: { policy: { include: { site: true } } },
      });
      if (!ver || ver.policy.site.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ver;
    }),

  /** Restore a previous version */
  restoreVersion: orgProcedure
    .input(z.object({ versionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const ver = await ctx.db.policyVersion.findUnique({
        where: { id: input.versionId },
        include: { policy: { include: { site: true } } },
      });
      if (!ver || ver.policy.site.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const policy = ver.policy;
      const newVersion = policy.version + 1;

      await ctx.db.policyVersion.create({
        data: {
          policyId: policy.id,
          version: newVersion,
          contentMarkdown: ver.contentMarkdown,
          contentHtml: ver.contentHtml,
          changeNote: `Restored from v${ver.version}`,
          createdBy: ctx.userId,
        },
      });

      return ctx.db.policy.update({
        where: { id: policy.id },
        data: {
          contentMarkdown: ver.contentMarkdown,
          contentHtml: ver.contentHtml,
          version: newVersion,
        },
      });
    }),

  /** Generate a new privacy policy from the latest scan using AI */
  generate: orgProcedure
    .input(z.object({
      siteId: z.string().uuid(),
      type: policyTypeEnum.default("privacy_policy"),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUniqueOrThrow({ where: { id: ctx.orgId } });
      const planLimits = PLANS[org.plan as keyof typeof PLANS];
      if (!planLimits.policy) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Policy generation requires a paid plan.",
        });
      }

      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
        include: {
          scans: {
            where: { status: "completed" },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { findings: true },
          },
        },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      const latestScan = site.scans[0];
      if (!latestScan) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No completed scan found. Run a scan first.",
        });
      }

      const cookies = latestScan.findings.filter((f) => f.category === "cookie").map((f) => f.title);
      const trackers = latestScan.findings.filter((f) => f.category === "tracker").map((f) => `${f.title}: ${f.description}`);
      const dataCollection = latestScan.findings.filter((f) => f.category === "data_collection").map((f) => f.title);

      const typeLabel = POLICY_TYPE_LABELS[input.type] ?? "Privacy Policy";

      const client = getAI();
      const completion = await client.chat.completions.create({
        model: getAIModel(),
        max_tokens: 6000,
        messages: [
          { role: "system", content: "You are a privacy policy expert. Output Markdown only — no code fences." },
          {
            role: "user",
            content: `Generate a comprehensive, clear ${typeLabel} for the website ${site.domain} (${org.name}).

Based on our automated scan:
COOKIES: ${cookies.join(", ") || "None detected"}
TRACKERS: ${trackers.join(", ") || "None detected"}
DATA COLLECTION: ${dataCollection.join(", ") || "None detected"}

REQUIREMENTS:
1. Write in clear, readable English — not legalese
2. Include GDPR-required sections (data controller, legal basis, data subject rights, data retention)
3. Include CCPA-required sections (categories of PI, right to know/delete/opt-out)
4. List the specific cookies and trackers found
5. Use [COMPANY NAME], [COMPANY ADDRESS], and [CONTACT EMAIL] as placeholders
6. Include the current date as effective date
7. This is a ${typeLabel} — tailor the content appropriately

Output in Markdown format only.`,
          },
        ],
      });

      const markdown = completion.choices[0]?.message?.content ?? "";
      const html = markdownToHtml(markdown);
      const title = POLICY_TYPE_LABELS[input.type] ?? "Policy";

      const existing = await ctx.db.policy.findUnique({
        where: { siteId_type: { siteId: input.siteId, type: input.type } },
      });

      const newVersion = existing ? existing.version + 1 : 1;

      const policy = await ctx.db.policy.upsert({
        where: { siteId_type: { siteId: input.siteId, type: input.type } },
        create: {
          siteId: input.siteId,
          type: input.type,
          title,
          contentMarkdown: markdown,
          contentHtml: html,
          basedOnScanId: latestScan.id,
          generatedAt: new Date(),
          version: 1,
        },
        update: {
          contentMarkdown: markdown,
          contentHtml: html,
          basedOnScanId: latestScan.id,
          generatedAt: new Date(),
          version: newVersion,
        },
      });

      await ctx.db.policyVersion.create({
        data: {
          policyId: policy.id,
          version: newVersion,
          contentMarkdown: markdown,
          contentHtml: html,
          basedOnScanId: latestScan.id,
          changeNote: "AI-generated from scan data",
          createdBy: "ai",
        },
      });

      return policy;
    }),

  /** Conversational policy builder */
  chat: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        type: policyTypeEnum.default("privacy_policy"),
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().max(20_000),
        })).max(60),
        currentDraft: z.string().max(200_000).default(""),
        existingPolicy: z.string().max(200_000).default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUniqueOrThrow({ where: { id: ctx.orgId } });
      const planLimits = PLANS[org.plan as keyof typeof PLANS];
      if (!planLimits.policy) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Policy generation requires a paid plan." });
      }

      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
        include: {
          scans: {
            where: { status: "completed" },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { findings: true },
          },
        },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      const latestScan = site.scans[0];
      const cookies = latestScan?.findings.filter((f) => f.category === "cookie").map((f) => f.title) ?? [];
      const trackers = latestScan?.findings.filter((f) => f.category === "tracker").map((f) => `${f.title}: ${f.description}`) ?? [];
      const dataCollection = latestScan?.findings.filter((f) => f.category === "data_collection").map((f) => f.title) ?? [];

      const typeLabel = POLICY_TYPE_LABELS[input.type] ?? "Privacy Policy";

      const systemPrompt = `You are a privacy policy expert helping an SMB owner build a ${typeLabel} for ${site.domain} (${org.name}).

SCAN FINDINGS:
- Cookies: ${cookies.join(", ") || "None detected"}
- Trackers: ${trackers.join(", ") || "None detected"}
- Data collection: ${dataCollection.join(", ") || "None detected"}

${input.existingPolicy ? `EXISTING POLICY (provided by user as starting template):\n---\n${input.existingPolicy.slice(0, 8000)}\n---\n` : ""}
${input.currentDraft ? `CURRENT DRAFT (built so far):\n---\n${input.currentDraft.slice(0, 12000)}\n---\n` : ""}

YOUR ROLE:
1. Ask the user ONE focused question at a time about their business and data practices.
2. After each answer, respond with TWO clearly separated parts:
   a. A brief acknowledgment + your next question (keep it conversational, friendly, plain English)
   b. An UPDATED full ${typeLabel} draft in Markdown, incorporating everything learned so far

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
[Your conversational message and next question here]

---POLICY_DRAFT---
[Complete updated Markdown policy here]
---END_DRAFT---

QUESTION STRATEGY (ask in roughly this order, skip what you already know from scan data or existing policy):
1. Company name, address, and contact email (the "data controller")
2. What the business does (one-liner description)
3. What personal data they collect beyond what the scan found (e.g. account info, payment details, support tickets)
4. Why they collect each type of data (legal basis under GDPR)
5. Do they share data with third parties? Which ones and why?
6. Do they transfer data outside the EU/EEA?
7. How long do they retain data?
8. Do they process children's data (under 16)?
9. Do they do automated decision-making or profiling?
10. Any specific regulations they need to comply with beyond GDPR/CCPA?

If the user says "done", "finish", "that's all", or similar — stop asking questions and present the final polished policy.
If the user provides corrections or requests changes, update the draft accordingly.
Always include the ---POLICY_DRAFT--- section in every response.`;

      const client = getAI();
      const response = await client.chat.completions.create({
        model: getAIModel(),
        max_tokens: 8000,
        messages: [
          { role: "system", content: systemPrompt },
          ...input.messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
      });

      const fullText = response.choices[0]?.message?.content ?? "";
      const draftMatch = fullText.match(/---POLICY_DRAFT---\s*([\s\S]*?)\s*---END_DRAFT---/);
      const policyDraft = draftMatch?.[1]?.trim() ?? input.currentDraft;
      const chatReply = fullText.replace(/---POLICY_DRAFT---[\s\S]*?---END_DRAFT---/, "").trim();

      return {
        reply: chatReply || "I've updated the draft. Take a look at the preview!",
        policyDraft,
      };
    }),

  /** Update an existing policy using AI — merges scan findings into the user's text */
  updateWithAI: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        type: policyTypeEnum.default("privacy_policy"),
        existingPolicy: z.string().min(10).max(100_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUniqueOrThrow({ where: { id: ctx.orgId } });
      const planLimits = PLANS[org.plan as keyof typeof PLANS];
      if (!planLimits.policy) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Policy generation requires a paid plan." });
      }

      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
        include: {
          scans: {
            where: { status: "completed" },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { findings: true },
          },
        },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      const latestScan = site.scans[0];
      const cookies = latestScan?.findings.filter((f) => f.category === "cookie").map((f) => f.title) ?? [];
      const trackers = latestScan?.findings.filter((f) => f.category === "tracker").map((f) => `${f.title}: ${f.description}`) ?? [];
      const dataCollection = latestScan?.findings.filter((f) => f.category === "data_collection").map((f) => f.title) ?? [];

      const client = getAI();
      const completion = await client.chat.completions.create({
        model: getAIModel(),
        max_tokens: 6000,
        messages: [
          { role: "system", content: "You are a privacy policy expert. Output the complete updated policy in Markdown only — no code fences." },
          {
            role: "user",
            content: `Update the user's EXISTING policy for ${site.domain} (${org.name}).

EXISTING POLICY:
---
${input.existingPolicy}
---

SCAN FINDINGS:
- Cookies: ${cookies.join(", ") || "None"}
- Trackers: ${trackers.join(", ") || "None"}
- Data collection: ${dataCollection.join(", ") || "None"}

INSTRUCTIONS:
1. PRESERVE existing structure, tone, and style
2. ADD missing GDPR/CCPA sections
3. UPDATE cookie/tracker sections to reflect scan findings
4. FLAG inaccuracies with [REVIEW: ...] comments
5. Output the COMPLETE updated policy in Markdown.
6. Add a "## Changes Made" summary at the end.`,
          },
        ],
      });

      const markdown = completion.choices[0]?.message?.content ?? "";
      const html = markdownToHtml(markdown);
      const title = POLICY_TYPE_LABELS[input.type] ?? "Policy";

      const existing = await ctx.db.policy.findUnique({
        where: { siteId_type: { siteId: input.siteId, type: input.type } },
      });

      const newVersion = existing ? existing.version + 1 : 1;

      const policy = await ctx.db.policy.upsert({
        where: { siteId_type: { siteId: input.siteId, type: input.type } },
        create: {
          siteId: input.siteId,
          type: input.type,
          title,
          contentMarkdown: markdown,
          contentHtml: html,
          basedOnScanId: latestScan?.id ?? null,
          generatedAt: new Date(),
          version: 1,
        },
        update: {
          contentMarkdown: markdown,
          contentHtml: html,
          basedOnScanId: latestScan?.id ?? null,
          generatedAt: new Date(),
          version: newVersion,
        },
      });

      await ctx.db.policyVersion.create({
        data: {
          policyId: policy.id,
          version: newVersion,
          contentMarkdown: markdown,
          contentHtml: html,
          basedOnScanId: latestScan?.id ?? null,
          changeNote: "AI-updated from existing policy",
          createdBy: "ai",
        },
      });

      return policy;
    }),

  /** Auto-fix privacy policy gaps found during a scan */
  fixGaps: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        gaps: z.array(z.object({
          topic: z.string(),
          description: z.string(),
          recommendation: z.string(),
        })).min(1).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUniqueOrThrow({ where: { id: ctx.orgId } });
      const planLimits = PLANS[org.plan as keyof typeof PLANS];
      if (!planLimits.policy) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Policy generation requires a paid plan." });
      }

      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
        include: {
          scans: {
            where: { status: "completed" },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { findings: true },
          },
        },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      const existingPolicy = await ctx.db.policy.findUnique({
        where: { siteId_type: { siteId: input.siteId, type: "privacy_policy" } },
      });

      const latestScan = site.scans[0];
      const cookies = latestScan?.findings.filter((f) => f.category === "cookie").map((f) => f.title) ?? [];
      const trackers = latestScan?.findings.filter((f) => f.category === "tracker").map((f) => `${f.title}: ${f.description}`) ?? [];
      const dataCollection = latestScan?.findings.filter((f) => f.category === "data_collection").map((f) => f.title) ?? [];

      const gapList = input.gaps
        .map((g, i) => `${i + 1}. **${g.topic}**: ${g.description}\n   Fix: ${g.recommendation}`)
        .join("\n");

      const client = getAI();

      const prompt = existingPolicy?.contentMarkdown
        ? `Update the EXISTING privacy policy for ${site.domain} (${org.name}) to fix the identified gaps.

EXISTING POLICY:
---
${existingPolicy.contentMarkdown.slice(0, 15_000)}
---

GAPS TO FIX:
${gapList}

SCAN CONTEXT:
- Cookies: ${cookies.join(", ") || "None"}
- Trackers: ${trackers.join(", ") || "None"}
- Data collection: ${dataCollection.join(", ") || "None"}

INSTRUCTIONS:
1. PRESERVE the existing structure, tone, and all existing content
2. ADD or UPDATE only the sections needed to address each gap
3. Do NOT remove any existing content
4. Use clear, readable English — not legalese
5. Output the COMPLETE updated policy in Markdown — no code fences`
        : `Generate a comprehensive Privacy Policy for ${site.domain} (${org.name}) that specifically addresses these compliance gaps:

GAPS TO ADDRESS:
${gapList}

SCAN FINDINGS:
- Cookies: ${cookies.join(", ") || "None detected"}
- Trackers: ${trackers.join(", ") || "None detected"}
- Data collection: ${dataCollection.join(", ") || "None detected"}

REQUIREMENTS:
1. Write in clear, readable English — not legalese
2. Include GDPR-required sections (data controller, legal basis, data subject rights, data retention)
3. Include CCPA-required sections (categories of PI, right to know/delete/opt-out)
4. Address EVERY gap listed above with specific, detailed sections
5. Use [COMPANY NAME], [COMPANY ADDRESS], and [CONTACT EMAIL] as placeholders
6. Include the current date as effective date
7. Output in Markdown only — no code fences`;

      const completion = await client.chat.completions.create({
        model: getAIModel(),
        max_tokens: 8000,
        messages: [
          { role: "system", content: "You are a privacy policy expert. Output Markdown only — no code fences." },
          { role: "user", content: prompt },
        ],
      });

      const markdown = completion.choices[0]?.message?.content ?? "";
      if (!markdown.trim()) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI did not return policy content." });
      }

      const html = markdownToHtml(markdown);
      const newVersion = existingPolicy ? existingPolicy.version + 1 : 1;
      const gapTopics = input.gaps.map((g) => g.topic).join(", ");

      const policy = await ctx.db.policy.upsert({
        where: { siteId_type: { siteId: input.siteId, type: "privacy_policy" } },
        create: {
          siteId: input.siteId,
          type: "privacy_policy",
          title: "Privacy Policy",
          contentMarkdown: markdown,
          contentHtml: html,
          basedOnScanId: latestScan?.id ?? null,
          generatedAt: new Date(),
          version: 1,
        },
        update: {
          contentMarkdown: markdown,
          contentHtml: html,
          basedOnScanId: latestScan?.id ?? null,
          generatedAt: new Date(),
          version: newVersion,
        },
      });

      await ctx.db.policyVersion.create({
        data: {
          policyId: policy.id,
          version: newVersion,
          contentMarkdown: markdown,
          contentHtml: html,
          basedOnScanId: latestScan?.id ?? null,
          changeNote: `AI auto-fix: addressed gaps in ${gapTopics}`,
          createdBy: "ai",
        },
      });

      // Auto-resolve the policy gap findings that were fixed
      const gapFindingTitles = input.gaps.map((g) => `Privacy policy gap: ${g.topic}`);
      await ctx.db.finding.updateMany({
        where: {
          siteId: input.siteId,
          category: "policy",
          title: { in: gapFindingTitles },
          resolvedAt: null,
        },
        data: { resolvedAt: new Date() },
      });

      return policy;
    }),

  /** Manually update the policy content */
  update: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        type: policyTypeEnum.default("privacy_policy"),
        title: z.string().max(255).optional(),
        contentMarkdown: z.string().min(1),
        changeNote: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      const html = markdownToHtml(input.contentMarkdown);
      const title = input.title ?? POLICY_TYPE_LABELS[input.type] ?? "Policy";

      const existing = await ctx.db.policy.findUnique({
        where: { siteId_type: { siteId: input.siteId, type: input.type } },
      });

      const newVersion = existing ? existing.version + 1 : 1;

      const policy = await ctx.db.policy.upsert({
        where: { siteId_type: { siteId: input.siteId, type: input.type } },
        create: {
          siteId: input.siteId,
          type: input.type,
          title,
          contentMarkdown: input.contentMarkdown,
          contentHtml: html,
          version: 1,
        },
        update: {
          contentMarkdown: input.contentMarkdown,
          contentHtml: html,
          version: newVersion,
          ...(input.title ? { title: input.title } : {}),
        },
      });

      await ctx.db.policyVersion.create({
        data: {
          policyId: policy.id,
          version: newVersion,
          contentMarkdown: input.contentMarkdown,
          contentHtml: html,
          changeNote: input.changeNote ?? "Manual edit",
          createdBy: ctx.userId,
        },
      });

      return policy;
    }),

  /** Publish the policy (make it live) */
  publish: orgProcedure
    .input(z.object({
      siteId: z.string().uuid(),
      type: policyTypeEnum.default("privacy_policy"),
    }))
    .mutation(async ({ ctx, input }) => {
      const policy = await ctx.db.policy.findUnique({
        where: { siteId_type: { siteId: input.siteId, type: input.type } },
      });
      if (!policy) throw new TRPCError({ code: "NOT_FOUND", message: "Policy not found" });

      return ctx.db.policy.update({
        where: { id: policy.id },
        data: { publishedAt: new Date() },
      });
    }),

  /** Delete a policy */
  delete: orgProcedure
    .input(z.object({
      siteId: z.string().uuid(),
      type: policyTypeEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND" });

      const policy = await ctx.db.policy.findUnique({
        where: { siteId_type: { siteId: input.siteId, type: input.type } },
      });
      if (!policy) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.policy.delete({ where: { id: policy.id } });
      return { deleted: true };
    }),

  /** Get the policy page styling config for a site */
  getPageStyle: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
        select: { policyPageStyle: true },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND" });

      return mergePageStyle(site.policyPageStyle);
    }),

  /** Update the policy page styling config for a site */
  updatePageStyle: orgProcedure
    .input(z.object({
      siteId: z.string().uuid(),
      style: z.object({
        fontFamily: z.string().max(200).optional(),
        fontColor: z.string().max(7).optional(),
        headingColor: z.string().max(7).optional(),
        backgroundColor: z.string().max(7).optional(),
        accentColor: z.string().max(7).optional(),
        logoUrl: z.string().max(2000).optional(),
        logoLink: z.string().max(2000).optional(),
        showTableOfContents: z.boolean().optional(),
        showPoweredBy: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
        select: { id: true, policyPageStyle: true },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND" });

      const org = await ctx.db.organization.findUniqueOrThrow({ where: { id: ctx.orgId } });
      const planLimits = PLANS[org.plan as keyof typeof PLANS] ?? PLANS.free;
      if (input.style.showPoweredBy === false && !planLimits.customBranding) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: 'Hiding "Powered by Custodia" requires a Growth or Business plan.',
        });
      }

      const current = mergePageStyle(site.policyPageStyle);
      const updated = { ...current, ...input.style };

      await ctx.db.site.update({
        where: { id: site.id },
        data: { policyPageStyle: JSON.parse(JSON.stringify(updated)) },
      });

      return updated;
    }),

  /** Magic Style — auto-detect site brand and apply accessible policy page styling */
  magicPageStyle: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
        select: { id: true, domain: true, policyPageStyle: true },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      const branding = await extractSiteBranding(site.domain);
      if (!branding) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Could not fetch https://${site.domain}. Make sure the site is accessible.`,
        });
      }

      const current = mergePageStyle(site.policyPageStyle);
      const updated: PolicyPageStyle = {
        ...current,
        accentColor: branding.accentColor,
        backgroundColor: branding.backgroundColor,
        fontColor: branding.fontColor,
        headingColor: branding.headingColor,
        logoUrl: branding.logoUrl || current.logoUrl,
        logoLink: branding.logoLink || current.logoLink,
      };

      await ctx.db.site.update({
        where: { id: site.id },
        data: { policyPageStyle: JSON.parse(JSON.stringify(updated)) },
      });

      return updated;
    }),
});

function mergePageStyle(raw: unknown): PolicyPageStyle {
  const base = { ...DEFAULT_POLICY_PAGE_STYLE };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const r = raw as Record<string, unknown>;
  if (typeof r.fontFamily === "string") base.fontFamily = r.fontFamily;
  if (typeof r.fontColor === "string") base.fontColor = r.fontColor;
  if (typeof r.headingColor === "string") base.headingColor = r.headingColor;
  if (typeof r.backgroundColor === "string") base.backgroundColor = r.backgroundColor;
  if (typeof r.accentColor === "string") base.accentColor = r.accentColor;
  if (typeof r.logoUrl === "string") base.logoUrl = r.logoUrl;
  if (typeof r.logoLink === "string") base.logoLink = r.logoLink;
  if (typeof r.showTableOfContents === "boolean") base.showTableOfContents = r.showTableOfContents;
  if (typeof r.showPoweredBy === "boolean") base.showPoweredBy = r.showPoweredBy;
  return base;
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith("<h") || line.startsWith("<ul") || line.startsWith("<li") || line.startsWith("</")) return line;
      return line;
    })
    .trim();
}
