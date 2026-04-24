/**
 * BullMQ queue client for enqueuing scan and agent jobs from the Next.js app.
 *
 * Note: BullMQ's `connection: { url: ... }` pattern doesn't reliably propagate
 * auth from the URL in all ioredis versions, causing a flood of
 * `NOAUTH Authentication required` errors on internal INFO commands. Pass
 * explicit host/port/password extracted from REDIS_URL instead.
 */
import { Queue, type ConnectionOptions } from "bullmq";
import type { ScanJobPayload, AgentJobPayload } from "@/types";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

function parseRedisConnection(rawUrl: string): ConnectionOptions {
  const u = new URL(rawUrl);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 6379,
    // URL.password is URL-encoded; decode so special chars in the password work.
    password: u.password ? decodeURIComponent(u.password) : undefined,
    username: u.username ? decodeURIComponent(u.username) : undefined,
    // BullMQ requires this for its blocking clients.
    maxRetriesPerRequest: null,
  };
}

const connection = parseRedisConnection(REDIS_URL);

const globalForQueue = globalThis as unknown as {
  scanQueue: Queue<ScanJobPayload> | undefined;
  agentQueue: Queue<AgentJobPayload> | undefined;
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
