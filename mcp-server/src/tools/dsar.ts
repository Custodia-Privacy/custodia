import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CustodiaClient } from "../client.js";

export function registerDsarTools(server: McpServer, client: CustodiaClient) {
  server.tool(
    "list_dsars",
    `List all DSAR (Data Subject Access Request) tickets for the organization. DSARs are formal requests from individuals exercising their privacy rights under GDPR (Art. 15-22), CCPA (Sec. 1798.100-135), or other regulations. Types include: access (right to know what data you hold), deletion (right to be forgotten), rectification (correct inaccurate data), portability (export in machine-readable format), opt_out (stop selling/sharing data), and restrict_processing. Each request has legal deadlines — GDPR: 30 days, CCPA: 45 days.`,
    {
      status: z
        .enum(["received", "identity_verified", "processing", "data_collected", "review", "fulfilled", "rejected", "appealed"])
        .optional()
        .describe("Filter by DSAR status"),
      limit: z.number().min(1).max(100).default(20).describe("Number of results to return"),
    },
    async ({ status, limit }) => {
      const result = await client.query("dsar.list", { status, limit });
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
    "get_dsar",
    `Get full details of a specific DSAR request including requester info, request type, jurisdiction, current status, legal deadline (due date), AI-generated summary of data locations, response package, and full activity audit trail. Use this to understand the complete state of a DSAR before processing or fulfilling it.`,
    {
      dsarId: z.string().uuid().describe("The UUID of the DSAR request"),
    },
    async ({ dsarId }) => {
      const result = await client.query("dsar.get", { dsarId });
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
    "process_dsar",
    `AI-process a DSAR request. This triggers the AI agent to automatically scan all registered data stores for the requester's personal data, generate a summary of where their data is located, create a response package, and update the DSAR status. The AI uses the requester's email and name to search across databases, SaaS apps, analytics platforms, and other registered data stores. This is the heavy-lifting step — run it after identity verification.`,
    {
      dsarId: z.string().uuid().describe("The UUID of the DSAR request to process"),
    },
    async ({ dsarId }) => {
      const result = await client.mutate("dsar.process", { dsarId });
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
    "fulfill_dsar",
    `Mark a DSAR request as fulfilled. This should only be called after the response has been sent to the requester. For access requests, ensure the data package has been delivered. For deletion requests, ensure all data has been removed from all registered stores. Sets the fulfilledAt timestamp for the audit trail. WARNING: Fulfillment is a legally significant action — ensure all required steps are complete.`,
    {
      dsarId: z.string().uuid().describe("The UUID of the DSAR request to fulfill"),
      notes: z.string().optional().describe("Optional notes about the fulfillment (for audit trail)"),
    },
    async ({ dsarId, notes }) => {
      const result = await client.mutate("dsar.fulfill", { dsarId, notes });
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
    "get_dsar_stats",
    `Get DSAR statistics for the organization — total requests, breakdown by status, breakdown by type (access, deletion, etc.), average processing time, requests approaching their legal deadlines, and overdue requests. Critical for compliance monitoring: GDPR allows 30 days, CCPA allows 45 days. Overdue requests are a regulatory violation.`,
    {},
    async () => {
      const result = await client.query("dsar.stats");
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
    "update_dsar_status",
    `Advance a DSAR through the pipeline. Status flow: received → identity_verified → processing → data_collected → review → fulfilled/rejected. Each transition is logged in the audit trail. Use 'rejected' only for requests that fail identity verification or are clearly frivolous. Moving to 'fulfilled' generates a response package if one doesn't exist. Regulatory deadlines run regardless of status — always check the due date.`,
    {
      dsarId: z.string().uuid().describe("The UUID of the DSAR request"),
      status: z
        .enum(["received", "identity_verified", "processing", "data_collected", "review", "fulfilled", "rejected"])
        .describe("The new status to set"),
      notes: z.string().optional().describe("Optional notes about why this status change was made — recorded in the audit trail"),
    },
    async ({ dsarId, status, notes }) => {
      const result = await client.mutate("dsar.updateStatus", { dsarId, status, notes });
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
    "create_dsar",
    `Create a new DSAR on behalf of a data subject. Required fields are the requester's name, email, and request type. This is used when a request comes in via email, phone, or another non-portal channel and needs to be logged in the system. The request is created in 'received' status and a legal deadline is automatically set based on the applicable regulation (GDPR: 30 days, CCPA: 45 days).`,
    {
      requesterName: z.string().describe("Full name of the data subject making the request"),
      requesterEmail: z.string().email().describe("Email address of the data subject"),
      type: z
        .enum(["access", "deletion", "rectification", "portability", "opt_out", "restrict_processing"])
        .describe("Type of data subject request"),
      details: z.string().optional().describe("Additional details or context from the requester"),
    },
    async ({ requesterName, requesterEmail, type, details }) => {
      const result = await client.mutate("dsar.create", { requesterName, requesterEmail, type, details });
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
