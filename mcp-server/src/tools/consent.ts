import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CustodiaClient } from "../client.js";

export function registerConsentTools(server: McpServer, client: CustodiaClient) {
  server.tool(
    "get_banner_config",
    `Get the cookie consent banner configuration for a site. Returns the full banner setup including position, theme, colors, text content, cookie categories (necessary, analytics, marketing, etc.), and per-regulation settings (GDPR opt-in, CCPA opt-out). If no banner exists yet, one is auto-created with sensible defaults.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site"),
    },
    async ({ siteId }) => {
      const result = await client.query("banner.get", { siteId });
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
    "update_banner",
    `Update the cookie consent banner configuration for a site. This saves a draft — call publish_banner to deploy it live. Configuration includes banner position (bottom, bottom-left, bottom-right, center), visual theme, text content, cookie categories with their descriptions, and regulation-specific behavior (GDPR requires opt-in consent before tracking; CCPA allows opt-out).`,
    {
      siteId: z.string().uuid().describe("The UUID of the site"),
      config: z
        .object({
          position: z.enum(["bottom", "bottom-left", "bottom-right", "center"]).optional(),
          theme: z.enum(["light", "dark", "auto"]).optional(),
          primaryColor: z.string().optional().describe("Hex color code, e.g. '#4F46E5'"),
          showLogo: z.boolean().optional(),
          customCss: z.string().optional(),
          content: z
            .object({
              title: z.string().optional(),
              description: z.string().optional(),
              acceptAllText: z.string().optional(),
              rejectAllText: z.string().optional(),
              customizeText: z.string().optional(),
              privacyPolicyUrl: z.string().optional(),
            })
            .optional(),
          categories: z
            .array(
              z.object({
                key: z.string(),
                name: z.string(),
                description: z.string(),
                required: z.boolean(),
                cookies: z.array(z.string()),
              }),
            )
            .optional(),
          regulations: z
            .object({
              gdpr: z.object({ enabled: z.boolean(), mode: z.literal("opt-in") }).optional(),
              ccpa: z.object({ enabled: z.boolean(), mode: z.literal("opt-out") }).optional(),
            })
            .optional(),
        })
        .describe("Banner configuration object — all fields optional for partial updates"),
    },
    async ({ siteId, config }) => {
      const result = await client.mutate("banner.update", { siteId, config });
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
    "publish_banner",
    `Publish the cookie consent banner to production. This copies the current draft configuration to the live published config, enables the banner, and makes it available via the site's script tag. Requires Starter or Pro plan.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site"),
    },
    async ({ siteId }) => {
      const result = await client.mutate("banner.publish", { siteId });
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
    "get_consent_stats",
    `Get consent log statistics for a site. Returns aggregated data about how visitors interact with the cookie consent banner — acceptance rates, rejection rates, customization rates, and jurisdiction breakdown (GDPR vs CCPA regions). Useful for understanding consent rates and optimizing banner UX.`,
    {
      siteId: z.string().uuid().describe("The UUID of the site"),
    },
    async ({ siteId }) => {
      const result = await client.query("banner.preview", { siteId });
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
