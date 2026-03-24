/**
 * Compliance Monitor Agent — generates comprehensive compliance reports
 * across all sites, checks deadlines, detects drift, and creates alerts.
 */
import type { PrismaClient } from "@prisma/client";
import { BaseAgent } from "./base";

interface ComplianceInput {
  siteId?: string;
}

interface SiteComplianceSnapshot {
  siteId: string;
  domain: string;
  lastScannedAt: string | null;
  complianceScore: number | null;
  openFindingsBySeverity: Record<string, number>;
  scoreTrend: "improving" | "declining" | "stable" | "unknown";
  previousScore: number | null;
}

interface DsarDeadlineAlert {
  dsarId: string;
  requesterName: string;
  requestType: string;
  dueDate: string;
  daysRemaining: number;
  status: string;
}

interface ComplianceReport {
  generatedAt: string;
  overallPosture: string;
  regulationScores: Record<string, { score: number | null; trend: string }>;
  topRisks: Array<{ risk: string; severity: string; recommendation: string }>;
  recommendedActions: Array<{ priority: number; action: string; reason: string }>;
  siteSnapshots: SiteComplianceSnapshot[];
  dsarDeadlines: DsarDeadlineAlert[];
  alertsCreated: number;
}

const REGULATION_NAMES: Record<string, string> = {
  gdpr: "GDPR (EU)",
  ccpa: "CCPA (California)",
  vcdpa: "VCDPA (Virginia)",
  cpa: "CPA (Colorado)",
  ctdpa: "CTDPA (Connecticut)",
};

export class ComplianceAgent extends BaseAgent {
  constructor(orgId: string, runId: string, db: PrismaClient) {
    super(orgId, runId, db);
  }

  async execute(input: Record<string, unknown>): Promise<void> {
    const { siteId } = input as ComplianceInput;

    await this.updateStatus("running");
    await this.log("info", `Compliance monitor started${siteId ? ` for site ${siteId}` : " for all org sites"}`);

    const sites = await this.getSites(siteId);
    if (sites.length === 0) {
      await this.log("warn", "No sites found");
      await this.complete({ report: null, message: "No sites to monitor" });
      return;
    }

    const siteSnapshots = await this.buildSiteSnapshots(sites);
    await this.log("info", `Built snapshots for ${siteSnapshots.length} site(s)`);

    const dsarDeadlines = await this.checkDsarDeadlines();
    await this.log("info", `Found ${dsarDeadlines.length} upcoming DSAR deadline(s)`);

    let alertsCreated = 0;
    alertsCreated += await this.createStaleScanAlerts(siteSnapshots);
    alertsCreated += await this.createDecliningScoreAlerts(siteSnapshots);
    alertsCreated += await this.createDsarDeadlineAlerts(dsarDeadlines);
    await this.log("info", `Created ${alertsCreated} alert(s)`);

    const report = await this.generateReport(siteSnapshots, dsarDeadlines, alertsCreated);
    await this.log("info", "Compliance report generated");

    await this.complete({ report });
  }

  private async getSites(siteId?: string) {
    const where: Record<string, unknown> = {
      orgId: this.orgId,
      deletedAt: null,
    };
    if (siteId) where.id = siteId;

    return this.db.site.findMany({
      where,
      select: {
        id: true,
        domain: true,
        complianceScore: true,
        lastScannedAt: true,
        monitoringEnabled: true,
      },
    });
  }

  private async buildSiteSnapshots(
    sites: Array<{
      id: string;
      domain: string;
      complianceScore: number | null;
      lastScannedAt: Date | null;
    }>,
  ): Promise<SiteComplianceSnapshot[]> {
    const snapshots: SiteComplianceSnapshot[] = [];

    for (const site of sites) {
      const openFindings = await this.db.finding.groupBy({
        by: ["severity"],
        where: { siteId: site.id, resolvedAt: null },
        _count: { id: true },
      });

      const findingsBySeverity: Record<string, number> = {};
      for (const g of openFindings) {
        findingsBySeverity[g.severity] = g._count.id;
      }

      const previousScans = await this.db.scan.findMany({
        where: { siteId: site.id, status: "completed" },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { complianceScores: true },
      });

      let scoreTrend: SiteComplianceSnapshot["scoreTrend"] = "unknown";
      let previousScore: number | null = null;

      if (previousScans.length >= 2) {
        const current = (previousScans[0].complianceScores as { overall?: number })?.overall ?? null;
        const prev = (previousScans[1].complianceScores as { overall?: number })?.overall ?? null;
        previousScore = prev;

        if (current !== null && prev !== null) {
          if (current > prev + 2) scoreTrend = "improving";
          else if (current < prev - 2) scoreTrend = "declining";
          else scoreTrend = "stable";
        }
      }

      snapshots.push({
        siteId: site.id,
        domain: site.domain,
        lastScannedAt: site.lastScannedAt?.toISOString() ?? null,
        complianceScore: site.complianceScore,
        openFindingsBySeverity: findingsBySeverity,
        scoreTrend,
        previousScore,
      });
    }

    return snapshots;
  }

  private async checkDsarDeadlines(): Promise<DsarDeadlineAlert[]> {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const upcomingDsars = await this.db.dsarRequest.findMany({
      where: {
        orgId: this.orgId,
        status: { notIn: ["fulfilled", "rejected"] },
        dueDate: { lte: sevenDaysFromNow },
      },
      select: {
        id: true,
        requesterName: true,
        requestType: true,
        dueDate: true,
        status: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return upcomingDsars.map((d) => ({
      dsarId: d.id,
      requesterName: d.requesterName,
      requestType: d.requestType,
      dueDate: d.dueDate.toISOString().split("T")[0],
      daysRemaining: Math.ceil((d.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      status: d.status,
    }));
  }

  private async createStaleScanAlerts(snapshots: SiteComplianceSnapshot[]): Promise<number> {
    let count = 0;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (const snap of snapshots) {
      if (!snap.lastScannedAt || new Date(snap.lastScannedAt) < thirtyDaysAgo) {
        const daysSince = snap.lastScannedAt
          ? Math.floor((Date.now() - new Date(snap.lastScannedAt).getTime()) / (24 * 60 * 60 * 1000))
          : null;

        await this.db.alert.create({
          data: {
            siteId: snap.siteId,
            orgId: this.orgId,
            type: "scan_failed",
            title: daysSince
              ? `${snap.domain} hasn't been scanned in ${daysSince} days`
              : `${snap.domain} has never been scanned`,
            message: "Regular scans are required to maintain compliance. Schedule a new scan.",
            severity: "warning",
          },
        });
        count++;
      }
    }

    return count;
  }

  private async createDecliningScoreAlerts(snapshots: SiteComplianceSnapshot[]): Promise<number> {
    let count = 0;

    for (const snap of snapshots) {
      if (snap.scoreTrend === "declining" && snap.previousScore !== null && snap.complianceScore !== null) {
        await this.db.alert.create({
          data: {
            siteId: snap.siteId,
            orgId: this.orgId,
            type: "compliance_drop",
            title: `${snap.domain} compliance trending down (${snap.previousScore} → ${snap.complianceScore})`,
            message: `Compliance score has been declining. Review open findings (${snap.openFindingsBySeverity["critical"] ?? 0} critical, ${snap.openFindingsBySeverity["warning"] ?? 0} warnings).`,
            severity: snap.complianceScore < 50 ? "critical" : "warning",
          },
        });
        count++;
      }
    }

    return count;
  }

  private async createDsarDeadlineAlerts(deadlines: DsarDeadlineAlert[]): Promise<number> {
    let count = 0;

    for (const d of deadlines) {
      if (d.daysRemaining <= 3) {
        await this.db.alert.create({
          data: {
            orgId: this.orgId,
            type: "dsar_deadline",
            title: d.daysRemaining <= 0
              ? `OVERDUE: ${d.requestType} request from ${d.requesterName}`
              : `URGENT: ${d.requestType} request from ${d.requesterName} due in ${d.daysRemaining} day(s)`,
            message: `DSAR ${d.dsarId} (${d.requestType}) is ${d.daysRemaining <= 0 ? "overdue" : `due ${d.dueDate}`}. Current status: ${d.status}. Failure to respond on time may result in regulatory penalties.`,
            severity: d.daysRemaining <= 0 ? "critical" : "warning",
          },
        });
        count++;
      }
    }

    return count;
  }

  private async generateReport(
    snapshots: SiteComplianceSnapshot[],
    dsarDeadlines: DsarDeadlineAlert[],
    alertsCreated: number,
  ): Promise<ComplianceReport> {
    const regulationScores = await this.aggregateRegulationScores(snapshots);

    const text = await this.callClaude({
      system: `You are a senior privacy compliance officer inside Custodia, an AI-native privacy compliance platform. Generate a comprehensive compliance assessment.

Respond with JSON only:
{
  "overallPosture": "string (1-2 sentence executive summary)",
  "topRisks": [{"risk":"string","severity":"critical|high|medium|low","recommendation":"string"}],
  "recommendedActions": [{"priority":1,"action":"string","reason":"string"}]
}

Limit to 5 top risks and 7 recommended actions. Be specific and actionable.`,
      prompt: `Generate a compliance assessment for this organization:

SITE COMPLIANCE SNAPSHOTS:
${JSON.stringify(snapshots, null, 2)}

REGULATION SCORES:
${JSON.stringify(regulationScores, null, 2)}

UPCOMING DSAR DEADLINES:
${dsarDeadlines.length > 0 ? JSON.stringify(dsarDeadlines, null, 2) : "None"}

ALERTS CREATED THIS RUN: ${alertsCreated}

Consider:
- Sites with declining scores need immediate attention
- Overdue DSARs are a regulatory violation
- Critical severity findings should be top risks
- Stale scans mean unknown compliance posture
- Missing cookie consent with active trackers is a GDPR violation`,
      maxTokens: 2500,
    });

    let parsed: {
      overallPosture: string;
      topRisks: Array<{ risk: string; severity: string; recommendation: string }>;
      recommendedActions: Array<{ priority: number; action: string; reason: string }>;
    };

    try {
      parsed = this.parseJSON(text);
    } catch {
      parsed = {
        overallPosture: `Monitoring ${snapshots.length} site(s). ${alertsCreated} alert(s) generated.`,
        topRisks: [],
        recommendedActions: [{ priority: 1, action: "Review generated alerts", reason: "Automated assessment could not be fully parsed" }],
      };
    }

    return {
      generatedAt: new Date().toISOString(),
      overallPosture: parsed.overallPosture,
      regulationScores,
      topRisks: parsed.topRisks,
      recommendedActions: parsed.recommendedActions,
      siteSnapshots: snapshots,
      dsarDeadlines,
      alertsCreated,
    };
  }

  private async aggregateRegulationScores(
    snapshots: SiteComplianceSnapshot[],
  ): Promise<Record<string, { score: number | null; trend: string }>> {
    const result: Record<string, { score: number | null; trend: string }> = {};

    const siteIds = snapshots.map((s) => s.siteId);
    const latestScans = await this.db.scan.findMany({
      where: {
        siteId: { in: siteIds },
        status: "completed",
      },
      orderBy: { createdAt: "desc" },
      distinct: ["siteId"],
      select: { siteId: true, complianceScores: true },
    });

    const regulationTotals: Record<string, { sum: number; count: number }> = {};

    for (const scan of latestScans) {
      const scores = scan.complianceScores as { regulations?: Record<string, number | null> } | null;
      if (!scores?.regulations) continue;

      for (const [reg, score] of Object.entries(scores.regulations)) {
        if (score === null) continue;
        if (!regulationTotals[reg]) regulationTotals[reg] = { sum: 0, count: 0 };
        regulationTotals[reg].sum += score;
        regulationTotals[reg].count++;
      }
    }

    for (const reg of Object.keys(REGULATION_NAMES)) {
      const totals = regulationTotals[reg];
      const avgScore = totals ? Math.round(totals.sum / totals.count) : null;

      const decliningCount = snapshots.filter((s) => s.scoreTrend === "declining").length;
      const improvingCount = snapshots.filter((s) => s.scoreTrend === "improving").length;

      let trend = "stable";
      if (decliningCount > improvingCount) trend = "declining";
      else if (improvingCount > decliningCount) trend = "improving";

      result[reg] = { score: avgScore, trend };
    }

    return result;
  }
}
