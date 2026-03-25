import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure, publicProcedure } from "../trpc";
import { enqueueScan } from "@/lib/queue";
import { PLANS } from "@/lib/stripe";

export const scanRouter = createRouter({
  /** List scans for a site (paginated) */
  list: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify site belongs to org
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      const items = await ctx.db.scan.findMany({
        where: { siteId: input.siteId },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          _count: { select: { findings: true } },
        },
      });

      let nextCursor: string | null = null;
      if (items.length > input.limit) {
        const lastItem = items.pop()!;
        nextCursor = lastItem.id;
      }

      return { items, nextCursor };
    }),

  /** Get scan details with findings */
  get: orgProcedure
    .input(z.object({ scanId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const scan = await ctx.db.scan.findUnique({
        where: { id: input.scanId },
        include: {
          site: { select: { orgId: true } },
          findings: {
            orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
          },
        },
      });

      if (!scan || scan.site.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scan not found" });
      }

      return scan;
    }),

  /** Trigger a new scan for a site */
  trigger: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        type: z.enum(["full", "quick", "monitoring"]).default("full"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

      // Check plan scan limits
      const org = await ctx.db.organization.findUniqueOrThrow({ where: { id: ctx.orgId } });
      const planLimits = PLANS[org.plan as keyof typeof PLANS];

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const scanCount = await ctx.db.scan.count({
        where: {
          site: { orgId: ctx.orgId },
          createdAt: { gte: startOfMonth },
        },
      });

      if (scanCount >= planLimits.scansPerMonth) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You've used all ${planLimits.scansPerMonth} scans this month. Upgrade your plan for more.`,
        });
      }

      // Check no scan is currently running for this site
      const runningScans = await ctx.db.scan.count({
        where: { siteId: input.siteId, status: { in: ["queued", "running"] } },
      });
      if (runningScans > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A scan is already in progress for this site",
        });
      }

      const scan = await ctx.db.scan.create({
        data: { siteId: input.siteId, scanType: input.type },
      });

      await enqueueScan({
        scanId: scan.id,
        siteId: input.siteId,
        domain: site.domain,
        scanType: input.type,
        maxPages: input.type === "full" ? 50 : input.type === "monitoring" ? 10 : 1,
      });

      return scan;
    }),

  /** Public quick scan — free lead-gen scan (homepage only) */
  quick: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let domain: string;
      try {
        domain = new URL(input.url).hostname;
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid URL" });
      }

      // Quick scans use a sentinel org/site so the FK constraint is satisfied.
      // Find or create the sentinel org for quick scans.
      let sentinelOrg = await ctx.db.organization.findUnique({
        where: { slug: "custodia-quick-scans" },
      });
      if (!sentinelOrg) {
        sentinelOrg = await ctx.db.organization.create({
          data: { name: "Quick Scans", slug: "custodia-quick-scans" },
        });
      }

      // Find or create a site for this domain under the sentinel org
      let site = await ctx.db.site.findFirst({
        where: { orgId: sentinelOrg.id, domain },
      });
      if (!site) {
        site = await ctx.db.site.create({
          data: { orgId: sentinelOrg.id, domain, name: domain },
        });
      }

      const scan = await ctx.db.scan.create({
        data: {
          siteId: site.id,
          scanType: "quick",
          rawData: { email: input.email, originalUrl: input.url },
        },
      });

      await enqueueScan({
        scanId: scan.id,
        siteId: site.id,
        domain,
        scanType: "quick",
        maxPages: 1,
      });

      return { scanId: scan.id, status: "queued" as const };
    }),

  /** Public poll for quick scan results (no auth required) */
  quickResult: publicProcedure
    .input(z.object({ scanId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const scan = await ctx.db.scan.findUnique({
        where: { id: input.scanId },
        include: {
          site: { select: { domain: true } },
          findings: {
            orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
            take: 50,
          },
        },
      });
      if (!scan) throw new TRPCError({ code: "NOT_FOUND", message: "Scan not found" });

      return {
        scanId: scan.id,
        status: scan.status,
        domain: scan.site.domain,
        pagesCrawled: scan.pagesCrawled,
        complianceScores: scan.complianceScores,
        summary: scan.summary,
        errorMessage: scan.errorMessage,
        findings: scan.findings.map((f) => ({
          id: f.id,
          title: f.title,
          description: f.description,
          category: f.category,
          severity: f.severity,
          recommendation: f.recommendation,
        })),
      };
    }),

  /** Compare two scans side by side */
  compare: orgProcedure
    .input(
      z.object({
        scanId1: z.string().uuid(),
        scanId2: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [scan1, scan2] = await Promise.all([
        ctx.db.scan.findUnique({
          where: { id: input.scanId1 },
          include: { site: { select: { orgId: true } }, findings: true },
        }),
        ctx.db.scan.findUnique({
          where: { id: input.scanId2 },
          include: { site: { select: { orgId: true } }, findings: true },
        }),
      ]);

      if (!scan1 || scan1.site.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scan 1 not found" });
      }
      if (!scan2 || scan2.site.orgId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scan 2 not found" });
      }

      const findings1Titles = new Set(scan1.findings.map((f) => f.title));
      const findings2Titles = new Set(scan2.findings.map((f) => f.title));

      const added = scan2.findings.filter((f) => !findings1Titles.has(f.title));
      const removed = scan1.findings.filter((f) => !findings2Titles.has(f.title));
      const unchanged = scan2.findings.filter((f) => findings1Titles.has(f.title));

      return {
        scan1: { id: scan1.id, createdAt: scan1.createdAt, complianceScores: scan1.complianceScores },
        scan2: { id: scan2.id, createdAt: scan2.createdAt, complianceScores: scan2.complianceScores },
        added,
        removed,
        unchanged,
      };
    }),

  /** Latest findings for a site (dashboard site detail) */
  recentFindings: orgProcedure
    .input(
      z.object({
        siteId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const site = await ctx.db.site.findFirst({
        where: { id: input.siteId, orgId: ctx.orgId, deletedAt: null },
      });
      if (!site) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      }

      return ctx.db.finding.findMany({
        where: { siteId: input.siteId },
        orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
        take: input.limit,
      });
    }),
});
