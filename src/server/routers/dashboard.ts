/**
 * Aggregated dashboard data — all metrics come from the database.
 */
import { createRouter, orgProcedure } from "../trpc";

const REGULATION_LABELS: { key: string; name: string }[] = [
  { key: "gdpr", name: "GDPR" },
  { key: "ccpa", name: "CCPA / CPRA" },
  { key: "vcdpa", name: "VCDPA" },
  { key: "cpa", name: "CPA" },
  { key: "ctdpa", name: "CTDPA" },
];

export const dashboardRouter = createRouter({
  /** Single query for main dashboard — stats, regulation bars, activity feed */
  overview: orgProcedure.query(async ({ ctx }) => {
    const orgId = ctx.orgId;

    const sites = await ctx.db.site.findMany({
      where: { orgId, deletedAt: null },
      select: { id: true, complianceScore: true, name: true, domain: true },
    });
    const siteIds = sites.map((s) => s.id);

    const scans =
      siteIds.length > 0
        ? await ctx.db.scan.findMany({
            where: { siteId: { in: siteIds }, status: "completed" },
            orderBy: { completedAt: "desc" },
            select: {
              siteId: true,
              complianceScores: true,
              completedAt: true,
              summary: true,
            },
          })
        : [];

    const latestBySite = new Map<string, (typeof scans)[0]>();
    for (const scan of scans) {
      if (!latestBySite.has(scan.siteId)) {
        latestBySite.set(scan.siteId, scan);
      }
    }

    let overallSum = 0;
    let overallN = 0;
    const regulationSums: Record<string, { sum: number; n: number }> = {};

    for (const s of sites) {
      const ls = latestBySite.get(s.id);
      const scores = ls?.complianceScores as {
        overall?: number;
        regulations?: Record<string, number | null>;
      } | null;
      const o = scores?.overall ?? s.complianceScore;
      if (o != null) {
        overallSum += o;
        overallN++;
      }
      if (scores?.regulations) {
        for (const { key } of REGULATION_LABELS) {
          const v = scores.regulations[key];
          if (typeof v === "number") {
            if (!regulationSums[key]) regulationSums[key] = { sum: 0, n: 0 };
            regulationSums[key].sum += v;
            regulationSums[key].n++;
          }
        }
      }
    }

    const overallScore = overallN > 0 ? Math.round(overallSum / overallN) : null;

    const regulations = REGULATION_LABELS.map(({ key, name }) => {
      const agg = regulationSums[key];
      const score = agg && agg.n > 0 ? Math.round(agg.sum / agg.n) : null;
      const displayScore = score ?? overallScore ?? 0;
      const status =
        displayScore >= 90 ? "compliant" : displayScore >= 70 ? "warning" : "violation";
      return { name, score: displayScore, status };
    });

    const trackerCount =
      siteIds.length > 0
        ? await ctx.db.finding.count({
            where: {
              siteId: { in: siteIds },
              category: "tracker",
              resolvedAt: null,
            },
          })
        : 0;

    const openDsars = await ctx.db.dsarRequest.count({
      where: {
        orgId,
        status: { notIn: ["fulfilled", "rejected"] },
      },
    });

    const policies = await ctx.db.policy.findMany({
      where: { site: { orgId, deletedAt: null } },
      select: { publishedAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1,
    });
    const p = policies[0];
    let policyStatus = "No policy";
    let policySubtext = "Generate from a site scan";
    if (p?.publishedAt) {
      policyStatus = "Up to date";
      policySubtext = `Published ${p.publishedAt.toLocaleDateString()}`;
    } else if (p) {
      policyStatus = "Draft";
      policySubtext = `Edited ${p.updatedAt.toLocaleDateString()}`;
    }

    const [alerts, recentScans, dsarActivities, agentRuns] = await Promise.all([
      ctx.db.alert.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { site: { select: { domain: true } } },
      }),
      siteIds.length
        ? ctx.db.scan.findMany({
            where: { siteId: { in: siteIds }, status: "completed" },
            orderBy: { completedAt: "desc" },
            take: 4,
            include: { site: { select: { domain: true } } },
          })
        : Promise.resolve([]),
      ctx.db.dsarActivity.findMany({
        where: { request: { orgId } },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          request: { select: { requestType: true, requesterEmail: true } },
        },
      }),
      ctx.db.agentRun.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

    type ActivityType = "compliant" | "warning" | "violation" | "info";
    const activity: { action: string; detail: string; at: Date; type: ActivityType }[] = [];

    for (const a of alerts) {
      const type: ActivityType =
        a.severity === "critical"
          ? "violation"
          : a.severity === "warning"
            ? "warning"
            : "info";
      activity.push({
        action: a.title,
        detail: a.message.length > 140 ? `${a.message.slice(0, 137)}…` : a.message,
        at: a.createdAt,
        type,
      });
    }

    for (const sc of recentScans) {
      if (!sc.completedAt) continue;
      const sum = sc.summary as { trackersFound?: number; issuesFound?: number } | null;
      activity.push({
        action: "Scan completed",
        detail: `${sc.site.domain} · ${sum?.trackersFound ?? "—"} trackers`,
        at: sc.completedAt,
        type: "info",
      });
    }

    for (const da of dsarActivities) {
      activity.push({
        action: da.action.replace(/_/g, " "),
        detail: `${da.request.requestType} · ${da.request.requesterEmail}`,
        at: da.createdAt,
        type: "compliant",
      });
    }

    for (const ar of agentRuns) {
      activity.push({
        action: `${ar.agentType.replace(/_/g, " ")}`,
        detail: `Run ${ar.status}`,
        at: ar.createdAt,
        type: ar.status === "failed" ? "violation" : "info",
      });
    }

    activity.sort((a, b) => b.at.getTime() - a.at.getTime());
    const recentActivity = activity.slice(0, 10);

    return {
      stats: {
        complianceScore: overallScore,
        trackerCount,
        openDsars,
        policyStatus,
        policySubtext,
      },
      regulations,
      recentActivity,
      siteCount: sites.length,
    };
  }),
});
