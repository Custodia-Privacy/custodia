/**
 * Scanner Agent — triggers site scans, compares with previous results,
 * and creates alerts for new trackers or compliance drops.
 */
import type { PrismaClient } from "@prisma/client";
import { BaseAgent } from "./base";
import { enqueueScan } from "@/lib/queue";

interface ScannerInput {
  siteId?: string;
}

interface SiteScanResult {
  siteId: string;
  domain: string;
  scanId: string;
  previousScore: number | null;
  newScore: number | null;
  newTrackers: number;
  newFindings: number;
  status: "completed" | "failed" | "skipped";
  error?: string;
}

export class ScannerAgent extends BaseAgent {
  constructor(orgId: string, runId: string, db: PrismaClient) {
    super(orgId, runId, db);
  }

  async execute(input: Record<string, unknown>): Promise<void> {
    const { siteId } = input as ScannerInput;

    await this.updateStatus("running");
    await this.log("info", `Scanner agent started${siteId ? ` for site ${siteId}` : " for all org sites"}`);

    const sites = await this.getSites(siteId);
    if (sites.length === 0) {
      await this.log("warn", "No sites found to scan");
      await this.complete({ sitesScanned: 0, results: [] });
      return;
    }

    await this.log("info", `Found ${sites.length} site(s) to scan`);

    const results: SiteScanResult[] = [];

    for (const site of sites) {
      try {
        const result = await this.scanSite(site);
        results.push(result);
        await this.log("info", `Scanned ${site.domain}: score ${result.newScore ?? "N/A"}, ${result.newFindings} new findings`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({
          siteId: site.id,
          domain: site.domain,
          scanId: "",
          previousScore: site.complianceScore,
          newScore: null,
          newTrackers: 0,
          newFindings: 0,
          status: "failed",
          error: message,
        });
        await this.log("error", `Failed to scan ${site.domain}: ${message}`);
      }
    }

    const summary = await this.generateSummary(results);

    await this.complete({
      sitesScanned: results.filter((r) => r.status === "completed").length,
      sitesFailed: results.filter((r) => r.status === "failed").length,
      totalNewFindings: results.reduce((sum, r) => sum + r.newFindings, 0),
      totalNewTrackers: results.reduce((sum, r) => sum + r.newTrackers, 0),
      results,
      summary,
    });
  }

  private async getSites(siteId?: string) {
    const where: Record<string, unknown> = {
      orgId: this.orgId,
      deletedAt: null,
    };
    if (siteId) {
      where.id = siteId;
    } else {
      where.monitoringEnabled = true;
    }

    return this.db.site.findMany({
      where,
      select: {
        id: true,
        domain: true,
        complianceScore: true,
        lastScannedAt: true,
        scanFrequency: true,
      },
    });
  }

  private async scanSite(site: {
    id: string;
    domain: string;
    complianceScore: number | null;
    lastScannedAt: Date | null;
  }): Promise<SiteScanResult> {
    const scan = await this.db.scan.create({
      data: {
        siteId: site.id,
        status: "queued",
        scanType: "full",
      },
    });

    await enqueueScan({
      scanId: scan.id,
      siteId: site.id,
      domain: site.domain,
      scanType: "full",
      maxPages: 25,
    });

    const completedScan = await this.waitForScan(scan.id);

    if (completedScan.status === "failed") {
      return {
        siteId: site.id,
        domain: site.domain,
        scanId: scan.id,
        previousScore: site.complianceScore,
        newScore: null,
        newTrackers: 0,
        newFindings: 0,
        status: "failed",
        error: completedScan.errorMessage ?? "Scan failed",
      };
    }

    const { newTrackers, newFindings } = await this.compareWithPrevious(site.id, scan.id);

    const scores = completedScan.complianceScores as { overall?: number } | null;
    const newScore = scores?.overall ?? null;

    if (site.complianceScore !== null && newScore !== null) {
      const drop = site.complianceScore - newScore;
      if (drop >= 10) {
        await this.db.alert.create({
          data: {
            siteId: site.id,
            orgId: this.orgId,
            type: "compliance_drop",
            title: `Compliance score dropped from ${site.complianceScore} to ${newScore}`,
            message: `${site.domain} compliance score fell by ${drop} points. Review the latest scan findings.`,
            severity: newScore < 50 ? "critical" : "warning",
          },
        });
      }
    }

    if (newTrackers > 0) {
      await this.db.alert.create({
        data: {
          siteId: site.id,
          orgId: this.orgId,
          type: "new_tracker",
          title: `${newTrackers} new tracker(s) detected on ${site.domain}`,
          message: `New tracking scripts were found since the last scan. Review the findings to ensure compliance.`,
          severity: "warning",
        },
      });
    }

    return {
      siteId: site.id,
      domain: site.domain,
      scanId: scan.id,
      previousScore: site.complianceScore,
      newScore,
      newTrackers,
      newFindings,
      status: "completed",
    };
  }

  private async waitForScan(scanId: string, timeoutMs = 300_000): Promise<{
    status: string;
    complianceScores: unknown;
    errorMessage: string | null;
  }> {
    const pollInterval = 5_000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const scan = await this.db.scan.findUnique({
        where: { id: scanId },
        select: { status: true, complianceScores: true, errorMessage: true },
      });

      if (!scan) throw new Error(`Scan ${scanId} not found`);

      if (scan.status === "completed" || scan.status === "failed") {
        return scan;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Scan ${scanId} timed out after ${timeoutMs}ms`);
  }

  private async compareWithPrevious(
    siteId: string,
    currentScanId: string,
  ): Promise<{ newTrackers: number; newFindings: number }> {
    const previousScan = await this.db.scan.findFirst({
      where: {
        siteId,
        id: { not: currentScanId },
        status: "completed",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!previousScan) {
      const currentFindings = await this.db.finding.count({
        where: { scanId: currentScanId },
      });
      return { newTrackers: 0, newFindings: currentFindings };
    }

    const previousTrackers = await this.db.finding.findMany({
      where: { scanId: previousScan.id, category: "tracker" },
      select: { title: true },
    });
    const previousTrackerTitles = new Set(previousTrackers.map((f) => f.title));

    const currentTrackers = await this.db.finding.findMany({
      where: { scanId: currentScanId, category: "tracker" },
      select: { title: true },
    });
    const newTrackers = currentTrackers.filter((f) => !previousTrackerTitles.has(f.title)).length;

    const previousFindingTitles = new Set(
      (
        await this.db.finding.findMany({
          where: { scanId: previousScan.id },
          select: { title: true },
        })
      ).map((f) => f.title),
    );

    const currentFindings = await this.db.finding.findMany({
      where: { scanId: currentScanId },
      select: { title: true },
    });
    const newFindings = currentFindings.filter((f) => !previousFindingTitles.has(f.title)).length;

    return { newTrackers, newFindings };
  }

  private async generateSummary(results: SiteScanResult[]): Promise<string> {
    const completed = results.filter((r) => r.status === "completed");
    if (completed.length === 0) return "No scans completed successfully.";

    const text = await this.callClaude({
      system: `You are a privacy compliance analyst inside Custodia, an AI-native privacy platform. Summarize scan results in 2-3 sentences. Be specific about what changed and what needs attention. Do not use markdown.`,
      prompt: `Summarize these scan results:\n${JSON.stringify(
        completed.map((r) => ({
          domain: r.domain,
          previousScore: r.previousScore,
          newScore: r.newScore,
          newTrackers: r.newTrackers,
          newFindings: r.newFindings,
        })),
        null,
        2,
      )}`,
      maxTokens: 300,
    });

    return text;
  }
}
