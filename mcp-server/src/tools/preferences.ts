import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CustodiaClient } from "../client.js";

export function registerPreferenceTools(server: McpServer, client: CustodiaClient) {
  server.tool(
    "get_preference_center",
    `Get the privacy preference center configuration. The preference center is a hosted page where end-users can manage their privacy choices — communication preferences (email, SMS, push), data processing preferences, and marketing consent. This goes beyond cookie consent to cover all channels of data processing. Returns the current config and publication status.`,
    {
      siteId: z.string().uuid().optional().describe("Optional site ID to scope the preference center"),
    },
    async ({ siteId }) => {
      const result = await client.query("preferences.getCenter", { siteId });
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
    "update_user_preferences",
    `Update privacy preferences for a specific end-user. This records their choices about data processing, communication channels, and marketing consent. Preferences are tied to a user by email or external ID. Sources can be 'manual' (admin update), 'user_portal' (self-service), 'api' (programmatic), or 'dsar' (from a DSAR request). All updates are logged for audit compliance.`,
    {
      centerId: z.string().uuid().describe("The UUID of the preference center"),
      email: z.string().email().optional().describe("The end-user's email address"),
      externalId: z.string().optional().describe("External identifier for the end-user"),
      preferences: z.record(z.string(), z.any()).describe("Preference key-value pairs, e.g. { marketing_email: false, analytics: true }"),
      source: z
        .enum(["manual", "user_portal", "api", "dsar"])
        .default("api")
        .describe("Source of the preference update"),
    },
    async ({ centerId, email, externalId, preferences, source }) => {
      const result = await client.mutate("preferences.updatePreferences", {
        centerId,
        email,
        externalId,
        preferences,
        source,
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
}
