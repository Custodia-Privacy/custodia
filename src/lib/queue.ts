/**
 * BullMQ queue client for enqueuing scan and agent jobs from the Next.js app.
 */
import { Queue } from "bullmq";
import type { ScanJobPayload, AgentJobPayload } from "@/types";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const globalForQueue = globalThis as unknown as {
  scanQueue: Queue<ScanJobPayload> | undefined;
  agentQueue: Queue<AgentJobPayload> | undefined;
};

export const scanQueue =
  globalForQueue.scanQueue ??
  new Queue<ScanJobPayload>("scan", {
    connection: { url: REDIS_URL },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    },
  });

export const agentQueue =
  globalForQueue.agentQueue ??
  new Queue<AgentJobPayload>("agent", {
    connection: { url: REDIS_URL },
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 10000 },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.scanQueue = scanQueue;
  globalForQueue.agentQueue = agentQueue;
}

export async function enqueueScan(payload: ScanJobPayload): Promise<string> {
  const job = await scanQueue.add(`scan:${payload.scanType}:${payload.domain}`, payload, {
    priority: payload.scanType === "quick" ? 1 : 2,
  });
  return job.id!;
}

export async function enqueueAgent(payload: AgentJobPayload): Promise<string> {
  const job = await agentQueue.add(`agent:${payload.agentType}`, payload);
  return job.id!;
}
