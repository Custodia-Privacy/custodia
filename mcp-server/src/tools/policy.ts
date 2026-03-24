import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CustodiaClient } from "../client.js";

export function registerPolicyTools(server: McpServer, client: CustodiaClient) {
  server.tool(
    "generate_policy",
    `AI-generate a comprehensive privacy policy from the latest scan data for a site. The policy is based on actual cookies, trackers, and data collection detected by the scanner. It covers GDPR requirements (data controller, legal basis, data subject rights, retention), CCPA requirements (categories of PI, right to know/delete/opt-out), and includes sections for data collection, cookies & tracking, third-party services, and user rights. A completed scan must exist first. Requires Starter or Pro plan.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site to generate a policy for"),
    },
    async ({ siteId }) => {
      const result = await client.mutate("policy.generate", { siteId });
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
    "get_policy",
    `Get the current privacy policy for a site. Returns the policy content in both Markdown and HTML formats, the version number, which scan it was generated from, and publication status. Returns null if no policy has been generated yet.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site"),
    },
    async ({ siteId }) => {
      const result = await client.query("policy.get", { siteId });
      return {
        content: [
          {
            type: "text" as const,
            text: result
              ? JSON.stringify(result, null, 2)
              : "No privacy policy exists for this site yet. Use generate_policy to create one from scan data.",
          },
        ],
      };
    },
  );

  server.tool(
    "update_policy",
    `Manually update the privacy policy content. Use this to make edits to an AI-generated policy or to write a policy from scratch. Content should be in Markdown format — it will be automatically converted to HTML. Each update increments the version number.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site"),
      contentMarkdown: z.string().min(1).describe("The full privacy policy content in Markdown format"),
    },
    async ({ siteId, contentMarkdown }) => {
      const result = await client.mutate("policy.update", { siteId, contentMarkdown });
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
    "publish_policy",
    `Publish the privacy policy to production for a site. This sets the publishedAt timestamp, making the policy available at the site's public privacy policy URL. Make sure the policy content is reviewed and accurate before publishing — published policies are legal documents.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site"),
    },
    async ({ siteId }) => {
      const result = await client.mutate("policy.publish", { siteId });
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
    "get_policy_versions",
    `Get the version history for a site's privacy policy. Returns version numbers, generation timestamps, publication timestamps, and which scan each version was based on. Useful for audit trails showing when policies were updated.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site"),
    },
    async ({ siteId }) => {
      const result = await client.query("policy.versions", { siteId });
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
