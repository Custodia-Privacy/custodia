/**
 * Agent Worker — BullMQ consumer for AI agent jobs.
 *
 * Runs as a separate process alongside the scanner worker.
 * Connects to Redis for job queue, PostgreSQL for data, Anthropic for AI.
 */
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import type { AgentJobPayload } from "../../src/types";
import { runAgent } from "../../src/agents";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const db = new PrismaClient();

const worker = new Worker<AgentJobPayload>(
  "agent",
  async (job) => {
    const { runId, orgId, agentType, input } = job.data;

    console.log(`[agent:${runId}] Starting ${agentType} agent`);

    const result = await runAgent(
      agentType as any,
      orgId,
      runId,
      input,
      db,
    );

    console.log(`[agent:${runId}] Completed with status: ${result?.status ?? "unknown"}`);
  },
  {
    connection: { url: REDIS_URL },
    concurrency: 3,
    limiter: { max: 5, duration: 60000 },
  },
);

worker.on("failed", (job, err) => {
  console.error(`[agent:${job?.id}] Job failed:`, err.message);
});

worker.on("completed", (job) => {
  console.log(`[agent:${job.id}] Job completed`);
});

console.log("Agent worker started, waiting for jobs…");

process.on("SIGTERM", async () => {
  console.log("Shutting down agent worker…");
  await worker.close();
  await db.$disconnect();
  process.exit(0);
});
