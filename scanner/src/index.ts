/**
 * Scanner Worker — BullMQ consumer for site scanning jobs.
 *
 * Runs as a separate process (deployed to Fly.io/Railway).
 * Connects to Redis for job queue, PostgreSQL for results.
 */
import { Worker } from "bullmq";
import type { ScanJobPayload } from "../../src/types";
import { crawlSite } from "./crawler";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const worker = new Worker<ScanJobPayload>(
  "scan",
  async (job) => {
    const { scanId, siteId, domain, scanType, maxPages } = job.data;

    console.log(`[scan:${scanId}] Starting ${scanType} scan of ${domain}`);

    try {
      // Update scan status to running
      // TODO: db.scan.update({ where: { id: scanId }, data: { status: "running", startedAt: new Date() } })

      const results = await crawlSite({
        domain,
        maxPages: scanType === "quick" ? 1 : maxPages,
      });

      console.log(
        `[scan:${scanId}] Crawled ${results.pages.length} pages, found ${results.totalCookies} cookies, ${results.totalTrackers} trackers`,
      );

      // TODO: Save results to database
      // TODO: Generate findings
      // TODO: Calculate compliance scores
      // TODO: Update scan status to completed
      // TODO: Trigger policy regeneration if needed
      // TODO: Check for alerts (new trackers, compliance drops)

      return results;
    } catch (error) {
      console.error(`[scan:${scanId}] Failed:`, error);
      // TODO: Update scan status to failed with error message
      throw error;
    }
  },
  {
    connection: { url: REDIS_URL },
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 60_000, // max 10 scans per minute
    },
  },
);

worker.on("completed", (job) => {
  console.log(`[scan:${job.data.scanId}] Completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[scan:${job?.data.scanId}] Failed:`, err.message);
});

console.log("Scanner worker started, waiting for jobs...");
