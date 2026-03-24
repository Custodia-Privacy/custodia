/**
 * Agent Registry & Runner — maps AgentType to agent classes,
 * creates instances, and manages the execute lifecycle.
 *
 * Called from the agents tRPC router to run any agent type.
 */
import type { PrismaClient } from "@prisma/client";
import { BaseAgent } from "./base";
import { ScannerAgent } from "./scanner-agent";
import { DsarAgent } from "./dsar-agent";
import { PolicyAgent } from "./policy-agent";
import { ComplianceAgent } from "./compliance-agent";

type AgentType =
  | "scanner"
  | "dsar_processor"
  | "policy_generator"
  | "compliance_monitor"
  | "data_mapper"
  | "pia_assessor"
  | "vendor_reviewer";

type AgentConstructor = new (
  orgId: string,
  runId: string,
  db: PrismaClient,
) => BaseAgent;

const AGENT_REGISTRY: Partial<Record<AgentType, AgentConstructor>> = {
  scanner: ScannerAgent,
  dsar_processor: DsarAgent,
  policy_generator: PolicyAgent,
  compliance_monitor: ComplianceAgent,
};

/**
 * Run an agent by type. Creates the agent instance, executes it,
 * and handles top-level errors (marking the run as failed).
 *
 * Returns the completed AgentRun record.
 */
export async function runAgent(
  agentType: AgentType,
  orgId: string,
  runId: string,
  input: Record<string, unknown>,
  db: PrismaClient,
) {
  const AgentClass = AGENT_REGISTRY[agentType];
  if (!AgentClass) {
    await db.agentRun.update({
      where: { id: runId },
      data: {
        status: "failed",
        completedAt: new Date(),
        output: { error: `Agent type "${agentType}" is not yet implemented` } as any,
        logs: [
          { ts: new Date().toISOString(), level: "error", message: `No implementation for agent type: ${agentType}` },
        ] as any,
      },
    });
    return db.agentRun.findUnique({ where: { id: runId } });
  }

  const agent = new AgentClass(orgId, runId, db);

  try {
    await agent.execute(input);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const stack = err instanceof Error ? err.stack : undefined;

    try {
      const current = await db.agentRun.findUnique({
        where: { id: runId },
        select: { logs: true },
      });
      const existingLogs = Array.isArray(current?.logs) ? (current.logs as any[]) : [];

      await db.agentRun.update({
        where: { id: runId },
        data: {
          status: "failed",
          completedAt: new Date(),
          output: { error: message } as any,
          logs: [
            ...existingLogs,
            {
              ts: new Date().toISOString(),
              level: "error",
              message: `Unhandled error: ${message}${stack ? `\n${stack}` : ""}`,
            },
          ] as any,
        },
      });
    } catch {
      console.error(`[agent:${runId}] Failed to update run status after error:`, message);
    }
  }

  return db.agentRun.findUnique({ where: { id: runId } });
}

export { BaseAgent } from "./base";
export { ScannerAgent } from "./scanner-agent";
export { DsarAgent } from "./dsar-agent";
export { PolicyAgent } from "./policy-agent";
export { ComplianceAgent } from "./compliance-agent";
