import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CustodiaClient } from "../client.js";

export function registerComplianceTools(server: McpServer, client: CustodiaClient) {
  server.tool(
    "get_compliance_scores",
    `Get compliance scores across all applicable privacy regulations for the organization. Returns a 0-100 score for each regulation (GDPR, CCPA, and any applicable state laws) based on the latest scan findings, policy status, consent banner configuration, DSAR response times, and data governance completeness. Scores below 70 indicate significant compliance gaps. This is the primary health metric for privacy compliance.`,
    {
      siteId: z.string().uuid().optional().describe("Optional: get scores for a specific site. Omit for org-wide scores."),
    },
    async ({ siteId }) => {
      const result = await client.query("compliance.scores", { siteId });
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
    "get_alerts",
    `Get compliance alerts for the organization. Alerts are generated automatically when: new trackers are detected on a site, compliance scores drop, scans fail, privacy policies become outdated, DSAR deadlines approach, PIAs are required for new processing, or vendor risk levels change. Each alert has a severity (critical, warning, info) and a read/unread status.`,
    {
      severity: z
        .enum(["critical", "warning", "info"])
        .optional()
        .describe("Filter by alert severity"),
      unreadOnly: z.boolean().default(false).describe("Only return unread alerts"),
      limit: z.number().min(1).max(100).default(20).describe("Number of alerts to return"),
    },
    async ({ severity, unreadOnly, limit }) => {
      const result = await client.query("alert.list", { severity, unreadOnly, limit });
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
    "get_recommendations",
    `AI-generate privacy compliance recommendations for the organization. Analyzes the current state across all domains — scan findings, banner configuration, policy status, DSAR processing, PIA coverage, data governance, and vendor management — to produce prioritized, actionable recommendations. Each recommendation includes severity, effort estimate, and which regulation(s) it addresses. Use this as a roadmap for improving compliance posture.`,
    {
      focus: z
        .enum(["all", "scanning", "consent", "policy", "dsar", "pia", "governance", "vendors"])
        .default("all")
        .describe("Focus area for recommendations — 'all' gives a holistic view"),
    },
    async ({ focus }) => {
      const result = await client.query("compliance.recommendations", { focus });
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
