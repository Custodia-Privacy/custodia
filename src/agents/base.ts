/**
 * Base Agent — abstract class all privacy agents extend.
 *
 * Manages run lifecycle (status, logs, completion/failure),
 * provides a lazy Anthropic client, and defines the execute() contract.
 */
import type OpenAI from "openai";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getAI, getAIModel } from "@/lib/ai";

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
  private _ai: OpenAI | null = null;
  private _logs: AgentLogEntry[] = [];
  private _tokensUsed = 0;

  constructor(orgId: string, runId: string, db: PrismaClient) {
    this.orgId = orgId;
    this.runId = runId;
    this.db = db;
  }

  protected getAI(): OpenAI {
    if (!this._ai) {
      this._ai = getAI();
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
   * Call the AI model with usage tracking. Wraps the OpenAI-compatible SDK
   * and accumulates token counts for cost calculation.
   */
  protected async callClaude(params: {
    system: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<string> {
    const ai = this.getAI();
    const response = await ai.chat.completions.create({
      model: getAIModel(),
      max_tokens: params.maxTokens ?? 4096,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.prompt },
      ],
    });

    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;
    this._tokensUsed += inputTokens + outputTokens;

    return response.choices[0]?.message?.content ?? "";
  }

  /** Extract JSON from a Claude response (handles markdown fences). */
  protected parseJSON<T = unknown>(text: string): T {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = match ? match[1].trim() : text.trim();
    return JSON.parse(raw);
  }

  /** Parse AI JSON response with Zod validation, returning a fallback on failure. */
  protected parseAIJson<T>(raw: string, schema: z.ZodType<T>, fallback: T): T {
    try {
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      const cleaned = match ? match[1].trim() : raw.trim();
      const parsed = JSON.parse(cleaned);
      const result = schema.safeParse(parsed);
      if (result.success) return result.data;
      this.log("warn", `AI output validation failed: ${result.error.message}`);
      return fallback;
    } catch {
      this.log("warn", "AI response is not valid JSON");
      return fallback;
    }
  }

  /** The agent's main execution logic — implemented by each subclass. */
  abstract execute(input: Record<string, unknown>): Promise<void>;
}
