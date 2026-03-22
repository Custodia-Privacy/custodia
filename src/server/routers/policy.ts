import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../trpc";
import { PLANS } from "@/lib/stripe";
import Anthropic from "@anthropic-ai/sdk";

export const policyRouter = createRouter({
  /** Get the current privacy policy for a site */
  get: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      return ctx.db.policy.findUnique({ where: { siteId: input.siteId } });
    }),

  /** Generate a new privacy policy from the latest scan using AI */
  generate: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUniqueOrThrow({ where: { id: ctx.orgId } });
      const planLimits = PLANS[org.plan as keyof typeof PLANS];
      if (!planLimits.policy) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Privacy policy generation requires a Starter or Pro plan.",
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
          message: "No completed scan found. Run a scan first before generating a policy.",
        });
      }

      // Build context from findings
      const cookies = latestScan.findings
        .filter((f) => f.category === "cookie")
        .map((f) => ({ name: f.title, details: f.details }));
      const trackers = latestScan.findings
        .filter((f) => f.category === "tracker")
        .map((f) => ({ name: f.title, description: f.description }));
      const dataCollection = latestScan.findings
        .filter((f) => f.category === "data_collection")
        .map((f) => f.title);

      // Generate policy with Claude
      const client = new Anthropic();
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `Generate a comprehensive, clear privacy policy for the website ${site.domain} (${org.name}).

Based on our automated scan, here is what the site does:

COOKIES FOUND:
${cookies.map((c) => `- ${c.name}`).join("\n") || "- No cookies detected"}

THIRD-PARTY TRACKERS:
${trackers.map((t) => `- ${t.name}: ${t.description}`).join("\n") || "- No trackers detected"}

PERSONAL DATA COLLECTED:
${dataCollection.join(", ") || "No personal data collection forms detected"}

REQUIREMENTS:
1. Write in clear, readable English — not legalese
2. Include GDPR-required sections (data controller, legal basis, data subject rights, data retention)
3. Include CCPA-required sections (categories of PI collected, right to know/delete/opt-out)
4. List the specific cookies and trackers found
5. Include sections for: Introduction, What Data We Collect, How We Use Your Data, Cookies & Tracking, Third-Party Services, Your Rights, Data Retention, Contact Information
6. Use [COMPANY NAME], [COMPANY ADDRESS], and [CONTACT EMAIL] as placeholders for company details
7. Include the current date as the effective date

Output in Markdown format only.`,
          },
        ],
      });

      const markdown =
        message.content[0].type === "text" ? message.content[0].text : "";

      // Convert markdown to basic HTML
      const html = markdownToHtml(markdown);

      // Upsert policy
      const existingPolicy = await ctx.db.policy.findUnique({
        where: { siteId: input.siteId },
      });

      const policy = await ctx.db.policy.upsert({
        where: { siteId: input.siteId },
        create: {
          siteId: input.siteId,
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
          version: { increment: 1 },
        },
      });

      return policy;
    }),

  /** Manually update the policy content */
  update: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        contentMarkdown: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      const html = markdownToHtml(input.contentMarkdown);

      return ctx.db.policy.upsert({
        where: { siteId: input.siteId },
        create: {
          siteId: input.siteId,
          contentMarkdown: input.contentMarkdown,
          contentHtml: html,
          version: 1,
        },
        update: {
          contentMarkdown: input.contentMarkdown,
          contentHtml: html,
          version: { increment: 1 },
        },
      });
    }),

  /** Publish the policy (make it live) */
  publish: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const policy = await ctx.db.policy.findUnique({ where: { siteId: input.siteId } });
      if (!policy) throw new TRPCError({ code: "NOT_FOUND", message: "Policy not found" });

      return ctx.db.policy.update({
        where: { siteId: input.siteId },
        data: { publishedAt: new Date() },
      });
    }),

  /** Get version history (using updatedAt as version timestamps) */
  versions: orgProcedure
    .input(z.object({ siteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      // Since we don't store version history separately, return current policy info
      const policy = await ctx.db.policy.findUnique({
        where: { siteId: input.siteId },
        select: {
          id: true,
          version: true,
          generatedAt: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          basedOnScanId: true,
        },
      });

      return policy ? [policy] : [];
    }),
});

/** Basic markdown to HTML converter for privacy policies */
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
      if (
        line.startsWith("<h") ||
        line.startsWith("<ul") ||
        line.startsWith("<li") ||
        line.startsWith("</")
      )
        return line;
      return line;
    })
    .trim();
}
