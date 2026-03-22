/**
 * BullMQ queue client for enqueuing scan jobs from the Next.js app.
 */
import { Queue } from "bullmq";
import type { ScanJobPayload } from "@/types";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const globalForQueue = globalThis as unknown as { scanQueue: Queue<ScanJobPayload> | undefined };

export const scanQueue =
  globalForQueue.scanQueue ??
  new Queue<ScanJobPayload>("scan", {
    connection: { url: REDIS_URL },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 86400 }, // 24 hours
      removeOnFail: { age: 604800 }, // 7 days
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.scanQueue = scanQueue;
}

export async function enqueueScan(payload: ScanJobPayload): Promise<string> {
  const job = await scanQueue.add(`scan:${payload.scanType}:${payload.domain}`, payload, {
    priority: payload.scanType === "quick" ? 1 : 2,
  });
  return job.id!;
}
