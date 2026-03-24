import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CustodiaClient } from "../client.js";

export function registerScannerTools(server: McpServer, client: CustodiaClient) {
  server.tool(
    "scan_site",
    `Trigger a privacy compliance scan on a website. The scan uses a headless browser to crawl the site (up to 50 pages), detecting cookies, trackers, third-party scripts, data collection forms, and consent mechanisms. Results are analyzed against GDPR, CCPA, and other privacy regulations. A 'full' scan crawls multiple pages; 'quick' scans the homepage only; 'monitoring' checks the top 10 pages for changes since the last scan.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site to scan"),
      type: z
        .enum(["full", "quick", "monitoring"])
        .default("full")
        .describe("Scan depth: 'full' (up to 50 pages), 'quick' (homepage only), or 'monitoring' (top 10 pages, change detection)"),
    },
    async ({ siteId, type }) => {
      const result = await client.mutate("scan.trigger", { siteId, type });
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
    "get_scan_results",
    `Retrieve the full results of a completed privacy scan, including all findings (cookies, trackers, scripts, data collection issues), compliance scores per regulation, AI-generated summary, and the number of pages crawled. If the scan is still running, the status field will indicate 'queued' or 'running'.`,
    {
      scanId: z.string().uuid().describe("The UUID of the scan to retrieve"),
    },
    async ({ scanId }) => {
      const result = await client.query("scan.get", { scanId });
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
    "list_scans",
    `List all privacy scans for a specific site, ordered by most recent first. Returns scan status, type, page count, compliance scores, and finding counts. Supports cursor-based pagination.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site"),
      limit: z.number().min(1).max(50).default(20).describe("Number of scans to return (1-50, default 20)"),
      cursor: z.string().uuid().optional().describe("Pagination cursor — the ID of the last scan from the previous page"),
    },
    async ({ siteId, limit, cursor }) => {
      const result = await client.query("scan.list", { siteId, limit, cursor });
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
    "compare_scans",
    `Compare two privacy scans side by side to see what changed. Returns findings that were added (new issues), removed (resolved issues), and unchanged between the two scans. Useful for tracking compliance improvements or detecting regressions after site changes.`,
    {
      scanId1: z.string().uuid().describe("UUID of the earlier/baseline scan"),
      scanId2: z.string().uuid().describe("UUID of the later/comparison scan"),
    },
    async ({ scanId1, scanId2 }) => {
      const result = await client.query("scan.compare", { scanId1, scanId2 });
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
