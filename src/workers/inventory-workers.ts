/**
 * BullMQ workers: data-scan + deletion queues.
 * Run: `npm run inventory-worker` (requires Redis + DATABASE_URL + optional PII_ENGINE_URL).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { Worker } from "bullmq";
import { db } from "@/lib/db";
import { parseRedisConnection } from "@/lib/redis-connection";
import type { DataScanJobPayload, DeletionJobPayload } from "@/types";
import { processDataScanJob } from "@/lib/inventory/process-data-scan";
import { processDeletionRun } from "@/lib/deletion/process-deletion-run";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = parseRedisConnection(REDIS_URL);

// eslint-disable-next-line no-console
console.log("[inventory-workers] starting (queues: data-scan, deletion)");

new Worker<DataScanJobPayload>(
  "data-scan",
  async (job) => {
    const { scanRunId, orgId, integrationId, provider } = job.data;
    await processDataScanJob(db, { scanRunId, orgId, integrationId, provider });
  },
  { connection },
);

new Worker<DeletionJobPayload>(
  "deletion",
  async (job) => {
    await processDeletionRun(db, job.data.runId);
  },
  { connection },
);
