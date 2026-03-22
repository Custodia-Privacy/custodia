/**
 * Scanner Worker — BullMQ consumer for site scanning jobs.
 *
 * Runs as a separate process (deployed to Fly.io/Railway).
 * Connects to Redis for job queue, PostgreSQL for results.
 */
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import type { ScanJobPayload } from "../../src/types";
import { crawlSite, type CrawlResult } from "./crawler";
import { summarizeScan, type ScanSummary } from "./ai/summarizer";
import { calculateComplianceScores, generateRecommendations } from "./compliance";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const db = new PrismaClient();

const worker = new Worker<ScanJobPayload>(
  "scan",
  async (job) => {
    const { scanId, siteId, domain, scanType, maxPages } = job.data;

    console.log(`[scan:${scanId}] Starting ${scanType} scan of ${domain}`);

    try {
      // Update scan status to running
      await db.scan.update({
        where: { id: scanId },
        data: { status: "running", startedAt: new Date() },
      });

      const results = await crawlSite({
        domain,
        maxPages: scanType === "quick" ? 1 : maxPages,
      });

      console.log(
        `[scan:${scanId}] Crawled ${results.pages.length} pages, found ${results.totalCookies} cookies, ${results.totalTrackers} trackers`,
      );

      // Generate AI summary
      let summary: ScanSummary | null = null;
      try {
        summary = await summarizeScan({
          domain,
          pagesCrawled: results.pages.length,
          cookies: results.pages.flatMap((p) =>
            p.cookies.map((c) => ({
              name: c.name,
              category: c.category,
              service: c.knownService,
            })),
          ),
          trackers: results.pages.flatMap((p) =>
            p.trackers.map((t) => ({ name: t.name, category: t.category })),
          ),
          forms: results.pages.map((p) => ({
            url: p.url,
            collectsPersonalData: p.forms.some((f) => f.collectsPersonalData),
            fieldCount: p.forms.reduce((s, f) => s + f.fields.length, 0),
          })),
          scripts: results.pages.flatMap((p) => p.scripts),
        });
      } catch (err) {
        console.error(`[scan:${scanId}] AI summary failed:`, err);
      }

      // Calculate compliance scores
      const allFindings = generateFindings(results, domain);
      const complianceScores = calculateComplianceScores({
        findings: allFindings.map((f) => ({
          category: f.category,
          severity: f.severity,
          regulations: f.regulations,
        })),
        hasPrivacyPolicy: results.hasPrivacyPolicy,
        hasCookieConsent: results.hasCookieConsent,
        hasDoNotSellLink: results.hasDoNotSellLink,
        trackersWithoutConsent: results.hasCookieConsent
          ? 0
          : results.totalTrackers,
        thirdPartyCookiesWithoutConsent: results.hasCookieConsent
          ? 0
          : results.pages.flatMap((p) =>
              p.cookies.filter(
                (c) => c.category !== "necessary" && !c.domain.includes(domain),
              ),
            ).length,
        collectsPersonalData: results.personalDataTypes.length > 0,
        personalDataTypes: results.personalDataTypes,
      });

      // Save findings to DB
      if (siteId !== "quick") {
        await db.finding.createMany({
          data: allFindings.map((f) => ({
            scanId,
            siteId,
            category: f.category as any,
            severity: f.severity as any,
            title: f.title,
            description: f.description,
            recommendation: f.recommendation,
            details: f.details,
            regulations: f.regulations,
            pageUrl: f.pageUrl,
          })),
        });
      }

      // Update scan with results
      await db.scan.update({
        where: { id: scanId },
        data: {
          status: "completed",
          completedAt: new Date(),
          pagesCrawled: results.pages.length,
          summary: summary as any,
          rawData: {
            totalCookies: results.totalCookies,
            totalTrackers: results.totalTrackers,
            totalScripts: results.totalScripts,
            totalForms: results.totalForms,
            crawlDuration: results.crawlDuration,
            hasPrivacyPolicy: results.hasPrivacyPolicy,
            hasCookieConsent: results.hasCookieConsent,
            hasDoNotSellLink: results.hasDoNotSellLink,
            personalDataTypes: results.personalDataTypes,
          } as any,
          complianceScores: complianceScores as any,
        },
      });

      // Update site's compliance score and last scanned timestamp
      if (siteId !== "quick") {
        await db.site.update({
          where: { id: siteId },
          data: {
            complianceScore: complianceScores.overall,
            lastScannedAt: new Date(),
          },
        });

        // Check for alerts: compliance drop
        await checkForAlerts(db, scanId, siteId, complianceScores.overall, results);
      }

      return results;
    } catch (error) {
      console.error(`[scan:${scanId}] Failed:`, error);
      await db.scan.update({
        where: { id: scanId },
        data: {
          status: "failed",
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw error;
    }
  },
  {
    connection: { url: REDIS_URL },
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 60_000,
    },
  },
);

/** Generate structured findings from crawl results */
function generateFindings(results: CrawlResult, domain: string) {
  const findings: Array<{
    category: string;
    severity: string;
    title: string;
    description: string;
    recommendation: string | null;
    details: any;
    regulations: string[];
    pageUrl: string | null;
  }> = [];

  // Cookie findings
  const allCookies = results.pages.flatMap((p) =>
    p.cookies.map((c) => ({ ...c, pageUrl: p.url })),
  );
  const uniqueCookies = new Map<string, (typeof allCookies)[0]>();
  allCookies.forEach((c) => uniqueCookies.set(c.name, c));

  for (const cookie of uniqueCookies.values()) {
    if (cookie.category === "analytics" || cookie.category === "marketing") {
      findings.push({
        category: "cookie",
        severity: results.hasCookieConsent ? "info" : "warning",
        title: `${cookie.category === "analytics" ? "Analytics" : "Marketing"} cookie: ${cookie.name}`,
        description: cookie.description ??
          `${cookie.knownService ? `Set by ${cookie.knownService}. ` : ""}This ${cookie.category} cookie ${results.hasCookieConsent ? "is" : "may be"} loaded ${results.hasCookieConsent ? "after consent" : "without user consent"}.`,
        recommendation: results.hasCookieConsent
          ? null
          : "Implement a cookie consent mechanism that blocks this cookie until the user opts in.",
        details: {
          domain: cookie.domain,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          service: cookie.knownService,
        },
        regulations: ["gdpr", "ccpa"],
        pageUrl: cookie.pageUrl,
      });
    } else if (cookie.category === "unknown") {
      findings.push({
        category: "cookie",
        severity: "info",
        title: `Unclassified cookie: ${cookie.name}`,
        description: `Cookie "${cookie.name}" from ${cookie.domain} could not be automatically classified. Review its purpose and add it to the appropriate category in your consent banner.`,
        recommendation: "Identify and classify this cookie, then add it to your cookie consent categories.",
        details: { domain: cookie.domain, secure: cookie.secure, httpOnly: cookie.httpOnly },
        regulations: ["gdpr"],
        pageUrl: cookie.pageUrl,
      });
    }
  }

  // Tracker findings
  const allTrackers = results.pages.flatMap((p) =>
    p.trackers.map((t) => ({ ...t, pageUrl: p.url })),
  );
  const uniqueTrackers = new Map<string, (typeof allTrackers)[0]>();
  allTrackers.forEach((t) => uniqueTrackers.set(t.name, t));

  for (const tracker of uniqueTrackers.values()) {
    findings.push({
      category: "tracker",
      severity: results.hasCookieConsent ? "info" : "critical",
      title: `Third-party tracker: ${tracker.name}`,
      description: `${tracker.description} ${!results.hasCookieConsent ? "This tracker loads without user consent, which violates GDPR requirements." : ""}`,
      recommendation: !results.hasCookieConsent
        ? `Block ${tracker.name} until the user consents to ${tracker.category} tracking.`
        : null,
      details: {
        domain: tracker.domain,
        category: tracker.category,
      },
      regulations: tracker.regulations,
      pageUrl: tracker.pageUrl,
    });
  }

  // Script findings for third-party scripts
  const thirdPartyScripts = results.pages.flatMap((p) =>
    p.scripts.filter((s) => s.isThirdParty).map((s) => ({ ...s, pageUrl: p.url })),
  );
  const uniqueScripts = new Map<string, (typeof thirdPartyScripts)[0]>();
  thirdPartyScripts.forEach((s) => {
    const key = s.service ?? s.src;
    if (!uniqueScripts.has(key)) uniqueScripts.set(key, s);
  });

  for (const script of uniqueScripts.values()) {
    if (script.service && !uniqueTrackers.has(script.service)) {
      findings.push({
        category: "script",
        severity: "info",
        title: `Third-party script: ${script.service ?? new URL(script.src).hostname}`,
        description: `${script.service ?? "Unknown"} script loaded from external domain. Category: ${script.category ?? "unknown"}.`,
        recommendation: null,
        details: { src: script.src, category: script.category },
        regulations: ["gdpr"],
        pageUrl: script.pageUrl,
      });
    }
  }

  // Data collection findings
  const formsWithPII = results.pages.flatMap((p) =>
    p.forms
      .filter((f) => f.collectsPersonalData)
      .map((f) => ({ ...f, pageUrl: p.url })),
  );

  for (const form of formsWithPII) {
    const piiFieldNames = form.fields
      .filter((f) => ["email", "tel", "password"].includes(f.type) || f.name.match(/name|phone|address/i))
      .map((f) => f.name || f.type);

    findings.push({
      category: "data_collection",
      severity: "warning",
      title: `Form collecting personal data on ${new URL(form.pageUrl).pathname}`,
      description: `A form on this page collects personal data (${piiFieldNames.join(", ")}). Under GDPR, you must have a legal basis for processing this data and inform users in your privacy policy.`,
      recommendation:
        "Ensure your privacy policy documents this data collection, its purpose, and legal basis.",
      details: { fields: piiFieldNames, method: form.method },
      regulations: ["gdpr", "ccpa"],
      pageUrl: form.pageUrl,
    });
  }

  // Consent findings
  if (!results.hasCookieConsent && results.totalTrackers > 0) {
    findings.push({
      category: "consent",
      severity: "critical",
      title: "No cookie consent mechanism detected",
      description:
        "Your website loads tracking cookies and scripts without presenting a cookie consent banner. Under GDPR, you must obtain opt-in consent before setting non-essential cookies.",
      recommendation:
        "Implement a cookie consent banner that blocks trackers until the user consents. Custodia can generate one for you.",
      details: null,
      regulations: ["gdpr", "ccpa"],
      pageUrl: null,
    });
  }

  // Policy findings
  if (!results.hasPrivacyPolicy) {
    findings.push({
      category: "policy",
      severity: "critical",
      title: "No privacy policy found",
      description:
        "No privacy policy link was detected on your website. Both GDPR and CCPA require a clear, accessible privacy policy.",
      recommendation:
        "Add a privacy policy to your website. Custodia can generate one based on your scan results.",
      details: null,
      regulations: ["gdpr", "ccpa"],
      pageUrl: null,
    });
  }

  if (!results.hasDoNotSellLink && results.totalTrackers > 0) {
    findings.push({
      category: "consent",
      severity: "warning",
      title: '"Do Not Sell My Personal Information" link not found',
      description:
        'CCPA requires a "Do Not Sell My Personal Information" link when you share user data with third parties for targeted advertising.',
      recommendation:
        'Add a visible "Do Not Sell My Personal Information" link to your website footer.',
      details: null,
      regulations: ["ccpa"],
      pageUrl: null,
    });
  }

  return findings;
}

/** Check for alerts after scan completion */
async function checkForAlerts(
  db: PrismaClient,
  scanId: string,
  siteId: string,
  newScore: number,
  results: CrawlResult,
) {
  const site = await db.site.findUnique({
    where: { id: siteId },
    select: { orgId: true, complianceScore: true },
  });
  if (!site) return;

  // Previous scan for comparison
  const previousScan = await db.scan.findFirst({
    where: { siteId, id: { not: scanId }, status: "completed" },
    orderBy: { createdAt: "desc" },
    select: { complianceScores: true },
  });

  const oldScore = site.complianceScore ?? 100;

  // Alert on significant compliance drop
  if (oldScore - newScore >= 10 && previousScan) {
    await db.alert.create({
      data: {
        siteId,
        orgId: site.orgId,
        type: "compliance_drop",
        title: `Compliance score dropped from ${oldScore} to ${newScore}`,
        message: `Your compliance score has dropped by ${oldScore - newScore} points. Review the latest scan findings to identify and address new issues.`,
        severity: newScore < 50 ? "critical" : "warning",
      },
    });
  }

  // Alert on new trackers (compared to previous scan)
  if (previousScan) {
    const prevRawData = (previousScan.complianceScores as any) ?? {};
    const prevTrackerCount = prevRawData?.totalTrackers ?? 0;
    if (results.totalTrackers > prevTrackerCount) {
      await db.alert.create({
        data: {
          siteId,
          orgId: site.orgId,
          type: "new_tracker",
          title: `${results.totalTrackers - prevTrackerCount} new tracker(s) detected`,
          message: `New tracking scripts were found on your site since the last scan. Review the findings to ensure compliance.`,
          severity: "warning",
        },
      });
    }
  }
}

worker.on("completed", (job) => {
  console.log(`[scan:${job.data.scanId}] Completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`[scan:${job?.data.scanId}] Failed:`, err.message);
});

console.log("Scanner worker started, waiting for jobs...");
