import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CustodiaClient } from "../client.js";

export function registerSiteTools(server: McpServer, client: CustodiaClient) {
  server.tool(
    "list_sites",
    `List all websites registered in the organization. Each site represents a domain being monitored for privacy compliance. Returns the domain, display name, verification status, monitoring settings, scan frequency, latest compliance score, and counts of scans and active findings. This is typically the first tool to call — you need a siteId for most other operations.`,
    {},
    async () => {
      const result = await client.query("site.list");
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
    "get_site",
    `Get detailed information about a specific site including its latest scan results, banner configuration, privacy policy status, and count of unresolved findings. Use this for a complete overview of a site's privacy compliance posture.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site"),
    },
    async ({ siteId }) => {
      const result = await client.query("site.get", { siteId });
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
    "add_site",
    `Register a new website for privacy compliance monitoring. Provide the domain (e.g. 'example.com') and a display name. This automatically triggers an initial full privacy scan. The domain must not already be registered in the organization. Site limits depend on the plan: Free (1 site), Starter (1 site), Pro (5 sites).`,
    {
      domain: z
        .string()
        .min(1)
        .describe("The domain to monitor, e.g. 'example.com' (without protocol)"),
      name: z.string().min(1).max(255).describe("Display name for the site"),
    },
    async ({ domain, name }) => {
      const result = await client.mutate("site.create", { domain, name });
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
    "update_site",
    `Update settings for a registered site. Can change the display name, toggle automated monitoring on/off, and set the scan frequency (daily, weekly, monthly). Daily monitoring is only available on the Pro plan.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site to update"),
      name: z.string().min(1).max(255).optional().describe("New display name"),
      monitoringEnabled: z.boolean().optional().describe("Enable/disable automated monitoring scans"),
      scanFrequency: z
        .enum(["daily", "weekly", "monthly"])
        .optional()
        .describe("How often to run automated scans"),
    },
    async ({ siteId, name, monitoringEnabled, scanFrequency }) => {
      const result = await client.mutate("site.update", {
        siteId,
        name,
        monitoringEnabled,
        scanFrequency,
      });
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
    "delete_site",
    `Remove a site from privacy monitoring (soft delete). The site and its scan history are preserved but hidden. This does not delete the actual website — it only removes it from Custodia's monitoring. This action can be reversed by support.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site to remove"),
    },
    async ({ siteId }) => {
      await client.mutate("site.delete", { siteId });
      return {
        content: [
          {
            type: "text" as const,
            text: "Site successfully removed from monitoring.",
          },
        ],
      };
    },
  );

  server.tool(
    "verify_site",
    `Verify domain ownership for a site via DNS TXT record. The site owner must add a TXT record 'custodia-verify=<siteId>' to their domain's DNS. This tool checks for that record and marks the site as verified if found. Domain verification is recommended but not required — it proves you control the domain being scanned.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site to verify"),
    },
    async ({ siteId }) => {
      const result = await client.mutate("site.verify", { siteId });
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
