#!/usr/bin/env node

/**
 * Custodia MCP Server
 *
 * Exposes every privacy compliance operation as an MCP tool that AI agents
 * can call. This IS the Custodia product interface for agents — scanning,
 * consent management, policy generation, DSARs, PIAs, data governance,
 * compliance monitoring, preference management, and autonomous privacy agents.
 *
 * Configuration:
 *   CUSTODIA_API_URL  — Base URL of the Custodia backend (default: http://localhost:3000)
 *   CUSTODIA_API_KEY  — API key for authentication (required)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CustodiaClient } from "./client.js";
import {
  registerSiteTools,
  registerScannerTools,
  registerConsentTools,
  registerPolicyTools,
  registerDsarTools,
  registerPiaTools,
  registerGovernanceTools,
  registerComplianceTools,
  registerPreferenceTools,
  registerAgentTools,
} from "./tools/index.js";

const CUSTODIA_API_URL = process.env.CUSTODIA_API_URL ?? "http://localhost:3000";
const CUSTODIA_API_KEY = process.env.CUSTODIA_API_KEY;

if (!CUSTODIA_API_KEY) {
  console.error(
    "CUSTODIA_API_KEY environment variable is required.\n" +
      "Generate an API key in your Custodia dashboard under Settings → API Keys.",
  );
  process.exit(1);
}

const client = new CustodiaClient({
  apiUrl: CUSTODIA_API_URL,
  apiKey: CUSTODIA_API_KEY,
});

const server = new McpServer({
  name: "custodia",
  version: "0.1.0",
  description:
    "Custodia privacy compliance platform — AI-powered website scanning, " +
    "cookie consent management, privacy policy generation, DSAR processing, " +
    "privacy impact assessments, data governance, and compliance monitoring.",
});

registerSiteTools(server, client);
registerScannerTools(server, client);
registerConsentTools(server, client);
registerPolicyTools(server, client);
registerDsarTools(server, client);
registerPiaTools(server, client);
registerGovernanceTools(server, client);
registerComplianceTools(server, client);
registerPreferenceTools(server, client);
registerAgentTools(server, client);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error starting Custodia MCP server:", err);
  process.exit(1);
});
