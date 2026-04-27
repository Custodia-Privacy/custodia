/**
 * BullMQ queue client for enqueuing scan and agent jobs from the Next.js app.
 *
 * Note: BullMQ's `connection: { url: ... }` pattern doesn't reliably propagate
 * auth from the URL in all ioredis versions, causing a flood of
 * `NOAUTH Authentication required` errors on internal INFO commands. Pass
 * explicit host/port/password extracted from REDIS_URL instead.
 */
import { Queue } from "bullmq";
import type { ScanJobPayload, AgentJobPayload, DataScanJobPayload, DeletionJobPayload } from "@/types";
import { parseRedisConnection } from "@/lib/redis-connection";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const connection = parseRedisConnection(REDIS_URL);

const globalForQueue = globalThis as unknown as {
  scanQueue: Queue<ScanJobPayload> | undefined;
  agentQueue: Queue<AgentJobPayload> | undefined;
  dataScanQueue: Queue<DataScanJobPayload> | undefined;
  deletionQueue: Queue<DeletionJobPayload> | undefined;
};

export const scanQueue =
  globalForQueue.scanQueue ??
  new Queue<ScanJobPayload>("scan", {
    connection,
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
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 10000 },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    },
  });

export const dataScanQueue =
  globalForQueue.dataScanQueue ??
  new Queue<DataScanJobPayload>("data-scan", {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 8000 },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    },
  });

export const deletionQueue =
  globalForQueue.deletionQueue ??
  new Queue<DeletionJobPayload>("deletion", {
    connection,
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
  globalForQueue.dataScanQueue = dataScanQueue;
  globalForQueue.deletionQueue = deletionQueue;
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

export async function enqueueDataScan(payload: DataScanJobPayload): Promise<string> {
  const job = await dataScanQueue.add(`data-scan:${payload.provider}:${payload.scanRunId}`, payload);
  return job.id!;
}

export async function enqueueDeletion(payload: DeletionJobPayload): Promise<string> {
  const job = await deletionQueue.add(`deletion:${payload.runId}`, payload);
  return job.id!;
}
