/**
 * Base Agent — abstract class all privacy agents extend.
 *
 * Manages run lifecycle (status, logs, completion/failure),
 * provides a lazy Anthropic client, and defines the execute() contract.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { PrismaClient } from "@prisma/client";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface AgentLogEntry {
  ts: string;
  level: LogLevel;
  message: string;
}

export abstract class BaseAgent {
  protected orgId: string;
  protected runId: string;
  protected db: PrismaClient;
  private _ai: Anthropic | null = null;
  private _logs: AgentLogEntry[] = [];
  private _tokensUsed = 0;

  constructor(orgId: string, runId: string, db: PrismaClient) {
    this.orgId = orgId;
    this.runId = runId;
    this.db = db;
  }

  /** Lazy-initialize the Anthropic client (shares one per agent run). */
  protected getAI(): Anthropic {
    if (!this._ai) {
      this._ai = new Anthropic();
    }
    return this._ai;
  }

  /** Append a structured log entry and persist it to the DB. */
  protected async log(level: LogLevel, message: string): Promise<void> {
    const entry: AgentLogEntry = {
      ts: new Date().toISOString(),
      level,
      message,
    };
    this._logs.push(entry);

    await this.db.agentRun.update({
      where: { id: this.runId },
      data: { logs: this._logs as any },
    });
  }

  /** Update the agent run status in the DB. */
  protected async updateStatus(status: "queued" | "running" | "completed" | "failed" | "cancelled"): Promise<void> {
    const data: Record<string, unknown> = { status };
    if (status === "running") {
      data.startedAt = new Date();
    }
    await this.db.agentRun.update({
      where: { id: this.runId },
      data,
    });
  }

  /** Mark the run as completed with output. */
  protected async complete(output: Record<string, unknown>): Promise<void> {
    await this.db.agentRun.update({
      where: { id: this.runId },
      data: {
        status: "completed",
        completedAt: new Date(),
        output: output as any,
        logs: this._logs as any,
        tokensUsed: this._tokensUsed,
        costCents: Math.ceil(this._tokensUsed * 0.003),
      },
    });
  }

  /** Mark the run as failed with an error message. */
  protected async fail(error: string): Promise<void> {
    await this.log("error", error);
    await this.db.agentRun.update({
      where: { id: this.runId },
      data: {
        status: "failed",
        completedAt: new Date(),
        output: { error } as any,
        logs: this._logs as any,
        tokensUsed: this._tokensUsed,
        costCents: Math.ceil(this._tokensUsed * 0.003),
      },
    });
  }

  /**
   * Call Claude with usage tracking. Wraps the Anthropic SDK
   * and accumulates token counts for cost calculation.
   */
  protected async callClaude(params: {
    system: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<string> {
    const ai = this.getAI();
    const response = await ai.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: params.maxTokens ?? 4096,
      system: params.system,
      messages: [{ role: "user", content: params.prompt }],
    });

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;
    this._tokensUsed += inputTokens + outputTokens;

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    return text;
  }

  /** Extract JSON from a Claude response (handles markdown fences). */
  protected parseJSON<T = unknown>(text: string): T {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = match ? match[1].trim() : text.trim();
    return JSON.parse(raw);
  }

  /** The agent's main execution logic — implemented by each subclass. */
  abstract execute(input: Record<string, unknown>): Promise<void>;
}
