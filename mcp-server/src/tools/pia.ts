import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CustodiaClient } from "../client.js";

export function registerPiaTools(server: McpServer, client: CustodiaClient) {
  server.tool(
    "create_pia",
    `Create a new PIA (Privacy Impact Assessment), also known as a DPIA (Data Protection Impact Assessment) under GDPR Art. 35. PIAs are required before processing that is "likely to result in a high risk" to individuals — this includes large-scale profiling, systematic monitoring of public areas, processing sensitive data at scale, or using new technologies. Provide a title, project type (e.g. 'new_feature', 'vendor_integration', 'data_migration', 'marketing_campaign'), and description of the planned processing activity.`,
    {
      title: z.string().min(1).max(500).describe("Title of the assessment, e.g. 'User Analytics Expansion PIA'"),
      projectType: z.string().min(1).max(100).describe("Type of project: new_feature, vendor_integration, data_migration, marketing_campaign, system_change, etc."),
      description: z.string().optional().describe("Detailed description of the planned data processing activity"),
    },
    async ({ title, projectType, description }) => {
      const result = await client.mutate("pia.create", { title, projectType, description });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "generate_pia_questions",
    `AI-generate tailored assessment questions for a PIA based on its project type and description. Questions cover data collection scope, processing purposes, legal basis, data sharing, retention, security measures, individual rights impact, and risk mitigation. The AI adapts questions to the specific type of project — a vendor integration gets different questions than a marketing campaign.`,
    {
      assessmentId: z.string().uuid().describe("The UUID of the assessment"),
    },
    async ({ assessmentId }) => {
      const result = await client.mutate("pia.generateQuestions", { id: assessmentId });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "submit_pia_answers",
    `Submit answers to a PIA's assessment questions. Answers should be provided as a JSON object mapping question IDs to answer strings. After submitting, use analyze_pia to get the AI risk analysis.`,
    {
      assessmentId: z.string().uuid().describe("The UUID of the assessment"),
      answers: z.record(z.string(), z.string()).describe("Object mapping question IDs to answer strings"),
    },
    async ({ assessmentId, answers }) => {
      const result = await client.mutate("pia.submitAnswers", { id: assessmentId, answers });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "analyze_pia",
    `AI-analyze a completed PIA assessment. Generates a comprehensive risk analysis including: overall risk level (low/medium/high/critical), identified risks with descriptions, recommended mitigations for each risk, a compliance assessment against GDPR Art. 35 requirements, and a full AI report. The assessment must have answers submitted before analysis. This is the key deliverable of the PIA process.`,
    {
      assessmentId: z.string().uuid().describe("The UUID of the assessment to analyze"),
    },
    async ({ assessmentId }) => {
      const result = await client.mutate("pia.analyze", { id: assessmentId });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "list_pias",
    `List all PIAs (Privacy Impact Assessments) for the organization. Returns each assessment's title, project type, status (draft, in_progress, ai_review, human_review, approved, rejected, archived), risk level, and timestamps. Use this to monitor the PIA pipeline and identify assessments needing attention.`,
    {
      status: z
        .enum(["draft", "in_progress", "ai_review", "human_review", "approved", "rejected", "archived"])
        .optional()
        .describe("Filter by assessment status"),
    },
    async ({ status }) => {
      const result = await client.query("pia.list", { status });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "get_pia",
    `Get full details of a specific PIA including title, description, project type, status, generated questions, submitted answers, AI risk analysis, mitigations, review notes, and audit timestamps. Use this to review a specific assessment in detail.`,
    {
      assessmentId: z.string().uuid().describe("The UUID of the assessment"),
    },
    async ({ assessmentId }) => {
      const result = await client.query("pia.get", { id: assessmentId });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}
