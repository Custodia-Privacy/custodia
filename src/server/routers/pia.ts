import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { createRouter, orgProcedure } from "../trpc";
import Anthropic from "@anthropic-ai/sdk";

function getAI() {
  return new Anthropic();
}

async function logAssessmentActivity(
  db: PrismaClient,
  params: {
    assessmentId: string;
    action: string;
    actorUserId: string | null;
    details?: Prisma.InputJsonValue;
  },
) {
  await db.assessmentActivity.create({
    data: {
      assessmentId: params.assessmentId,
      action: params.action,
      actorUserId: params.actorUserId,
      details: params.details ?? Prisma.DbNull,
    },
  });
}

const PROJECT_TYPES = [
  "new_product",
  "new_vendor",
  "data_migration",
  "marketing_campaign",
  "feature_change",
  "other",
] as const;

export const piaRouter = createRouter({
  /** List all PIAs for the org, with optional status filter */
  list: orgProcedure
    .input(
      z.object({
        status: z
          .enum([
            "draft",
            "in_progress",
            "ai_review",
            "human_review",
            "approved",
            "rejected",
            "archived",
          ])
          .optional(),
      }).default({}),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.assessment.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input.status ? { status: input.status } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: { select: { id: true, email: true, name: true } },
        },
      });
    }),

  /** Get a single assessment by ID */
  get: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: {
          assignedTo: { select: { id: true, email: true, name: true } },
          activities: {
            orderBy: { createdAt: "desc" },
            take: 100,
            include: { actor: { select: { id: true, email: true, name: true } } },
          },
        },
      });

      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });
      }

      return assessment;
    }),

  /** Create a new Privacy Impact Assessment */
  create: orgProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().optional(),
        projectType: z.enum(PROJECT_TYPES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.db.assessment.create({
        data: {
          orgId: ctx.orgId,
          title: input.title,
          description: input.description ?? null,
          projectType: input.projectType,
          status: "draft",
        },
      });
      await logAssessmentActivity(ctx.db, {
        assessmentId: created.id,
        action: "created",
        actorUserId: ctx.userId,
        details: { title: input.title, projectType: input.projectType },
      });
      return created;
    }),

  /** Assign or unassign a team member (must be in the same org). */
  assign: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        assignedToUserId: z.string().uuid().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });
      }

      if (input.assignedToUserId) {
        const member = await ctx.db.orgMember.findUnique({
          where: {
            orgId_userId: { orgId: ctx.orgId, userId: input.assignedToUserId },
          },
        });
        if (!member) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "That user is not a member of this organization.",
          });
        }
      }

      const previous = assessment.assignedToUserId;
      const updated = await ctx.db.assessment.update({
        where: { id: input.id },
        data: { assignedToUserId: input.assignedToUserId },
        include: {
          assignedTo: { select: { id: true, email: true, name: true } },
        },
      });

      await logAssessmentActivity(ctx.db, {
        assessmentId: input.id,
        action: input.assignedToUserId ? "assigned" : "unassigned",
        actorUserId: ctx.userId,
        details: {
          previousAssigneeUserId: previous,
          assigneeUserId: input.assignedToUserId,
        },
      });

      return updated;
    }),

  /** Activity trail for one assessment (newest first). */
  listActivities: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });
      }

      return ctx.db.assessmentActivity.findMany({
        where: { assessmentId: input.id },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { actor: { select: { id: true, email: true, name: true } } },
      });
    }),

  /** Generate PIA questions using AI based on project type and description */
  generateQuestions: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });
      }

      const client = getAI();
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `You are a privacy compliance AI agent generating Privacy Impact Assessment (PIA) questions.

PROJECT DETAILS:
- Title: ${assessment.title}
- Type: ${assessment.projectType}
- Description: ${assessment.description ?? "No description provided"}

Generate comprehensive PIA questions covering ALL of these categories:
1. DATA COLLECTION — What personal data is collected, from whom, how, and why
2. DATA PROCESSING — How data is processed, stored, and transformed
3. DATA SHARING — Who data is shared with (third parties, subprocessors, cross-border)
4. SECURITY MEASURES — Technical and organizational measures protecting the data
5. INDIVIDUAL RIGHTS — How data subject rights (access, deletion, portability) are supported
6. LEGAL BASIS — Consent, legitimate interest, contractual necessity, etc.
7. RETENTION — How long data is kept and how it is disposed of

For each question, include:
- A unique id (e.g. "dc_1", "dp_1", "ds_1", "sm_1", "ir_1", "lb_1", "rt_1")
- The category
- The question text
- The type: "text", "yes_no", "multi_select", or "single_select"
- For select types, include "options" array

Tailor the questions to a "${assessment.projectType}" project. Be specific, not generic.

Respond ONLY with a JSON array of question objects:
[{ "id": "...", "category": "...", "question": "...", "type": "...", "options": [...] }]`,
          },
        ],
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      let questions: unknown[];
      try {
        questions = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to parse AI-generated questions",
          });
        }
      }

      const updated = await ctx.db.assessment.update({
        where: { id: input.id },
        data: {
          questions: questions as Prisma.InputJsonValue,
          status: "in_progress",
        },
      });

      await logAssessmentActivity(ctx.db, {
        assessmentId: input.id,
        action: "questions_generated",
        actorUserId: ctx.userId,
        details: { questionCount: Array.isArray(questions) ? questions.length : 0 },
      });

      return updated;
    }),

  /** Save answers to the assessment */
  submitAnswers: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        answers: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });
      }

      const updated = await ctx.db.assessment.update({
        where: { id: input.id },
        data: { answers: input.answers as Prisma.InputJsonValue },
      });
      await logAssessmentActivity(ctx.db, {
        assessmentId: input.id,
        action: "answers_submitted",
        actorUserId: ctx.userId,
        details: { answerKeys: Object.keys(input.answers) },
      });
      return updated;
    }),

  /** AI-analyze the completed assessment: risk analysis, report generation */
  analyze: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });
      }
      if (!assessment.questions || !assessment.answers) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Questions and answers must be completed before analysis",
        });
      }

      await ctx.db.assessment.update({
        where: { id: input.id },
        data: { status: "ai_review" },
      });

      const client = getAI();
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 6000,
        messages: [
          {
            role: "user",
            content: `You are a senior privacy compliance AI analyst performing a Privacy Impact Assessment (PIA) review.

PROJECT:
- Title: ${assessment.title}
- Type: ${assessment.projectType}
- Description: ${assessment.description ?? "N/A"}

QUESTIONS AND ANSWERS:
${JSON.stringify(assessment.questions, null, 2)}

ANSWERS PROVIDED:
${JSON.stringify(assessment.answers, null, 2)}

TASK:
1. Analyze all questions and answers for privacy risks.
2. Generate a comprehensive risk analysis.
3. Determine the overall risk level (low, medium, high, critical).
4. Write a full PIA report in markdown.

Respond in JSON format:
{
  "riskLevel": "low|medium|high|critical",
  "risks": [
    {
      "id": "risk_1",
      "category": "data_collection|data_processing|data_sharing|security|individual_rights|legal_basis|retention",
      "title": "...",
      "description": "...",
      "severity": "low|medium|high|critical",
      "likelihood": "unlikely|possible|likely|almost_certain",
      "impact": "...",
      "mitigation": "..."
    }
  ],
  "mitigations": [
    {
      "riskId": "risk_1",
      "recommendation": "...",
      "priority": "high|medium|low",
      "effort": "low|medium|high"
    }
  ],
  "report": "# Privacy Impact Assessment Report\\n\\n..."
}`,
          },
        ],
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      let parsed: {
        riskLevel?: string;
        risks?: unknown;
        mitigations?: unknown;
        report?: string;
      } = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = { report: responseText, riskLevel: "medium" };
        }
      }

      const validRiskLevels = ["low", "medium", "high", "critical"] as const;
      const riskLevel = validRiskLevels.includes(
        parsed.riskLevel as (typeof validRiskLevels)[number],
      )
        ? (parsed.riskLevel as (typeof validRiskLevels)[number])
        : "medium";

      const updated = await ctx.db.assessment.update({
        where: { id: input.id },
        data: {
          status: "human_review",
          riskLevel,
          riskAnalysis: parsed.risks
            ? (parsed.risks as Prisma.InputJsonValue)
            : Prisma.DbNull,
          mitigations: parsed.mitigations
            ? (parsed.mitigations as Prisma.InputJsonValue)
            : Prisma.DbNull,
          aiReport: parsed.report ?? responseText,
        },
      });

      await logAssessmentActivity(ctx.db, {
        assessmentId: input.id,
        action: "analyzed",
        actorUserId: ctx.userId,
        details: { riskLevel },
      });

      return updated;
    }),

  /** Approve the assessment */
  approve: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reviewNotes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });
      }

      const updated = await ctx.db.assessment.update({
        where: { id: input.id },
        data: {
          status: "approved",
          reviewedBy: ctx.userId,
          reviewNotes: input.reviewNotes ?? null,
          approvedAt: new Date(),
        },
      });
      await logAssessmentActivity(ctx.db, {
        assessmentId: input.id,
        action: "approved",
        actorUserId: ctx.userId,
        details: { reviewNotes: input.reviewNotes ?? null },
      });
      return updated;
    }),

  /** Reject the assessment with review notes */
  reject: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reviewNotes: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.db.assessment.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });
      }

      const updated = await ctx.db.assessment.update({
        where: { id: input.id },
        data: {
          status: "rejected",
          reviewedBy: ctx.userId,
          reviewNotes: input.reviewNotes,
        },
      });
      await logAssessmentActivity(ctx.db, {
        assessmentId: input.id,
        action: "rejected",
        actorUserId: ctx.userId,
        details: { reviewNotes: input.reviewNotes },
      });
      return updated;
    }),

  /** Stats: counts by status and risk level distribution */
  stats: orgProcedure.query(async ({ ctx }) => {
    const all = await ctx.db.assessment.findMany({
      where: { orgId: ctx.orgId },
      select: { status: true, riskLevel: true },
    });

    const byStatus: Record<string, number> = {};
    const byRiskLevel: Record<string, number> = {};

    for (const a of all) {
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
      if (a.riskLevel) {
        byRiskLevel[a.riskLevel] = (byRiskLevel[a.riskLevel] ?? 0) + 1;
      }
    }

    return {
      total: all.length,
      byStatus,
      byRiskLevel,
    };
  }),
});
