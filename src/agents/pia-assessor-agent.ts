/**
 * PIA Assessor Agent — generates risk questionnaires for privacy impact
 * assessments and performs AI-driven risk analysis with mitigations.
 */
import type { PrismaClient } from "@prisma/client";
import { BaseAgent } from "./base";

interface PiaAssessorInput {
  assessmentId: string;
  action?: "generate_questions" | "analyze";
}

export class PiaAssessorAgent extends BaseAgent {
  constructor(orgId: string, runId: string, db: PrismaClient) {
    super(orgId, runId, db);
  }

  async execute(input: Record<string, unknown>): Promise<void> {
    const { assessmentId, action } = input as unknown as PiaAssessorInput;

    await this.updateStatus("running");

    if (!assessmentId) {
      await this.fail("assessmentId is required");
      return;
    }

    const assessment = await this.db.assessment.findFirst({
      where: { id: assessmentId, orgId: this.orgId },
    });

    if (!assessment) {
      await this.fail(`Assessment ${assessmentId} not found`);
      return;
    }

    await this.log("info", `PIA assessor started for "${assessment.title}" (action: ${action ?? "full"})`);

    if (action === "generate_questions" || !action) {
      await this.generateQuestions(assessment);
    }

    if (action === "analyze" || !action) {
      // Reload assessment to get any updated answers
      const refreshed = await this.db.assessment.findUnique({ where: { id: assessmentId } });
      if (refreshed) {
        await this.analyzeRisks(refreshed);
      }
    }

    const final = await this.db.assessment.findUnique({ where: { id: assessmentId } });

    await this.complete({
      assessmentId,
      title: assessment.title,
      status: final?.status,
      riskLevel: final?.riskLevel,
      questionsGenerated: Array.isArray(final?.questions) ? (final.questions as unknown[]).length : 0,
    });
  }

  private async generateQuestions(assessment: {
    id: string;
    title: string;
    description: string | null;
    projectType: string;
  }): Promise<void> {
    await this.log("info", "Generating risk assessment questionnaire");

    const text = await this.callClaude({
      system: `You are a privacy impact assessment expert. Generate a comprehensive questionnaire for a PIA.
Respond with JSON only:
{
  "questions": [
    {
      "id": "q1",
      "category": "data_collection" | "data_processing" | "data_sharing" | "data_retention" | "security" | "rights" | "cross_border" | "automated_decisions",
      "question": "string",
      "helpText": "string explaining why this matters",
      "inputType": "text" | "boolean" | "select" | "multiselect",
      "options": ["only for select/multiselect"],
      "required": true | false,
      "riskWeight": 1 to 5
    }
  ]
}
Generate 12-20 questions tailored to the project type. Cover all GDPR Article 35 requirements.`,
      prompt: `Generate PIA questions for:
Title: ${assessment.title}
Description: ${assessment.description ?? "none"}
Project Type: ${assessment.projectType}`,
      maxTokens: 3000,
    });

    try {
      const parsed = this.parseJSON<{ questions: unknown[] }>(text);

      await this.db.assessment.update({
        where: { id: assessment.id },
        data: {
          questions: parsed.questions as any,
          status: "ai_review",
        },
      });

      await this.logActivity(assessment.id, "questions_generated", {
        count: parsed.questions.length,
      });

      await this.log("info", `Generated ${parsed.questions.length} questions`);
    } catch (err) {
      await this.log("error", `Failed to parse questions: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  private async analyzeRisks(assessment: {
    id: string;
    title: string;
    description: string | null;
    projectType: string;
    questions: unknown;
    answers: unknown;
  }): Promise<void> {
    const answers = assessment.answers as Record<string, unknown> | null;
    if (!answers || Object.keys(answers).length === 0) {
      await this.log("warn", "No answers submitted yet — skipping risk analysis");
      return;
    }

    await this.log("info", "Performing AI risk analysis");

    const text = await this.callClaude({
      system: `You are a senior privacy officer performing a Privacy Impact Assessment risk analysis.
Respond with JSON only:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "overallScore": 0-100 (100 = highest risk),
  "riskAnalysis": {
    "summary": "2-3 sentence executive summary",
    "categories": [
      {
        "name": "category name",
        "riskLevel": "low|medium|high|critical",
        "findings": ["specific findings"],
        "regulations": ["affected regulations"]
      }
    ]
  },
  "mitigations": [
    {
      "priority": 1,
      "risk": "what risk this addresses",
      "mitigation": "recommended action",
      "effort": "low|medium|high",
      "impact": "low|medium|high"
    }
  ],
  "report": "Full markdown report suitable for stakeholders. Include: Executive Summary, Scope, Data Processing Activities, Risk Assessment, Recommended Mitigations, Compliance Requirements, Conclusion."
}`,
      prompt: `Analyze risks for this PIA:
Title: ${assessment.title}
Description: ${assessment.description ?? "none"}
Project Type: ${assessment.projectType}

Questions and Answers:
${JSON.stringify({ questions: assessment.questions, answers }, null, 2)}`,
      maxTokens: 4096,
    });

    try {
      const parsed = this.parseJSON<{
        riskLevel: string;
        riskAnalysis: Record<string, unknown>;
        mitigations: unknown[];
        report: string;
      }>(text);

      const validRiskLevels = ["low", "medium", "high", "critical"];
      const riskLevel = validRiskLevels.includes(parsed.riskLevel)
        ? (parsed.riskLevel as "low" | "medium" | "high" | "critical")
        : "medium";

      await this.db.assessment.update({
        where: { id: assessment.id },
        data: {
          riskLevel,
          riskAnalysis: parsed.riskAnalysis as any,
          mitigations: parsed.mitigations as any,
          aiReport: parsed.report,
          status: "ai_review",
        },
      });

      await this.logActivity(assessment.id, "risk_analysis_completed", {
        riskLevel,
        mitigationCount: parsed.mitigations.length,
      });

      await this.log("info", `Risk analysis complete: ${riskLevel} risk, ${parsed.mitigations.length} mitigations`);
    } catch (err) {
      await this.log("error", `Failed to parse risk analysis: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  private async logActivity(
    assessmentId: string,
    action: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.db.assessmentActivity.create({
        data: {
          assessmentId,
          action,
          details: details as any,
        },
      });
    } catch {
      // non-critical
    }
  }
}
