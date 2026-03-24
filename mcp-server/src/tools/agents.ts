import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CustodiaClient } from "../client.js";

export function registerAgentTools(server: McpServer, client: CustodiaClient) {
  server.tool(
    "trigger_agent",
    `Trigger an autonomous privacy agent to perform a specialized task. Available agent types:
- 'scanner': Run a comprehensive privacy scan and analysis
- 'dsar_processor': Process a DSAR request end-to-end (search data stores, compile response)
- 'policy_generator': Generate or update a privacy policy from scan data
- 'compliance_monitor': Check compliance status and generate alerts
- 'data_mapper': Discover and map data flows between registered stores
- 'pia_assessor': Conduct a full privacy impact assessment
- 'vendor_reviewer': Review vendor privacy compliance

Each agent runs asynchronously and can take seconds to minutes depending on complexity. Use get_agent_status to poll for completion.`,
    {
      agentType: z
        .enum(["scanner", "dsar_processor", "policy_generator", "compliance_monitor", "data_mapper", "pia_assessor", "vendor_reviewer"])
        .describe("The type of privacy agent to trigger"),
      input: z.record(z.string(), z.any()).optional().describe("Agent-specific input parameters (e.g. { siteId: '...' } for scanner, { dsarId: '...' } for dsar_processor)"),
    },
    async ({ agentType, input }) => {
      const result = await client.mutate("agent.trigger", { agentType, input });
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
    "get_agent_status",
    `Check the status and output of an autonomous agent run. Returns the current status (queued, running, completed, failed, cancelled), agent type, input/output data, execution logs, tokens used, cost, and timing. Poll this after triggering an agent to wait for completion.`,
    {
      runId: z.string().uuid().describe("The UUID of the agent run"),
    },
    async ({ runId }) => {
      const result = await client.query("agent.getStatus", { runId });
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
    "list_agent_runs",
    `List recent autonomous agent runs for the organization. Returns run history with agent type, status, trigger source, token usage, cost, and timing. Use this to monitor agent activity, track costs, and review past results.`,
    {
      agentType: z
        .enum(["scanner", "dsar_processor", "policy_generator", "compliance_monitor", "data_mapper", "pia_assessor", "vendor_reviewer"])
        .optional()
        .describe("Filter by agent type"),
      status: z
        .enum(["queued", "running", "completed", "failed", "cancelled"])
        .optional()
        .describe("Filter by run status"),
      limit: z.number().min(1).max(100).default(20).describe("Number of runs to return"),
    },
    async ({ agentType, status, limit }) => {
      const result = await client.query("agent.listRuns", { agentType, status, limit });
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
