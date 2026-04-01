/**
 * GET /api/v1/openapi.json — OpenAPI 3.1 specification
 */
import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Custodia API",
    version: "1.0.0",
    description:
      "Privacy compliance API for managing DSARs, consent records, preference centers, and webhook subscriptions. Authenticate with a Bearer token using your API key (cust_*).",
    contact: { email: "api@custodia-privacy.com" },
  },
  servers: [
    {
      url: "{baseUrl}/api/v1",
      variables: { baseUrl: { default: "https://app.custodia-privacy.com" } },
    },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "API key (cust_*) from the Custodia dashboard",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: {},
            },
            required: ["code", "message"],
          },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer" },
          per_page: { type: "integer" },
          total: { type: "integer" },
          total_pages: { type: "integer" },
        },
      },
      Dsar: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          request_type: { type: "string", enum: ["access", "deletion", "rectification", "portability", "opt_out", "restrict_processing"] },
          status: { type: "string", enum: ["received", "identity_verified", "processing", "data_collected", "review", "fulfilled", "rejected", "appealed"] },
          jurisdiction: { type: "string" },
          requester_name: { type: "string" },
          requester_email: { type: "string", format: "email" },
          requester_phone: { type: "string", nullable: true },
          received_at: { type: "string", format: "date-time" },
          due_date: { type: "string", format: "date-time" },
          extension_days: { type: "integer" },
          fulfilled_at: { type: "string", format: "date-time", nullable: true },
          notes: { type: "string", nullable: true },
          ai_summary: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      ConsentLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          site_id: { type: "string", format: "uuid" },
          visitor_id: { type: "string" },
          ip_country: { type: "string", nullable: true },
          jurisdiction: { type: "string", nullable: true },
          consent_given: { type: "object" },
          action: { type: "string", enum: ["accept_all", "reject_all", "customize", "dismiss"] },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Site: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          domain: { type: "string" },
          name: { type: "string" },
          verified: { type: "boolean" },
          monitoring_enabled: { type: "boolean" },
          compliance_score: { type: "integer", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      PreferenceCenter: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          site_id: { type: "string", format: "uuid", nullable: true },
          subscriber_count: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Subscriber: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", nullable: true },
          external_id: { type: "string", nullable: true },
          preferences: { type: "object" },
          source: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      WebhookSubscription: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          url: { type: "string", format: "uri" },
          events: { type: "array", items: { type: "string" } },
          active: { type: "boolean" },
          secret: { type: "string", description: "Only returned on creation" },
          created_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/dsars": {
      get: {
        summary: "List DSARs",
        tags: ["DSARs"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "per_page", in: "query", schema: { type: "integer", default: 25 } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "request_type", in: "query", schema: { type: "string" } },
          { name: "site_id", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Paginated list of DSARs" },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        summary: "Create a DSAR",
        tags: ["DSARs"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["request_type", "jurisdiction", "requester_name", "requester_email"],
                properties: {
                  site_id: { type: "string", format: "uuid" },
                  request_type: { type: "string", enum: ["access", "deletion", "rectification", "portability", "opt_out", "restrict_processing"] },
                  jurisdiction: { type: "string" },
                  requester_name: { type: "string" },
                  requester_email: { type: "string", format: "email" },
                  requester_phone: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "DSAR created" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/dsars/{id}": {
      get: {
        summary: "Get a DSAR",
        tags: ["DSARs"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "DSAR details with activity log" }, "404": { description: "Not found" } },
      },
      patch: {
        summary: "Update a DSAR",
        tags: ["DSARs"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string" },
                  notes: { type: "string" },
                  rejected_reason: { type: "string" },
                  extension_days: { type: "integer" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "DSAR updated" }, "404": { description: "Not found" } },
      },
    },
    "/consent": {
      get: {
        summary: "List consent logs",
        tags: ["Consent"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "per_page", in: "query", schema: { type: "integer" } },
          { name: "site_id", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "action", in: "query", schema: { type: "string" } },
          { name: "jurisdiction", in: "query", schema: { type: "string" } },
          { name: "date_from", in: "query", schema: { type: "string", format: "date" } },
          { name: "date_to", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: { "200": { description: "Paginated consent logs" } },
      },
    },
    "/sites": {
      get: {
        summary: "List sites",
        tags: ["Sites"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "per_page", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Paginated site list" } },
      },
    },
    "/preferences": {
      get: {
        summary: "List preference centers",
        tags: ["Preferences"],
        responses: { "200": { description: "Paginated preference centers" } },
      },
    },
    "/preferences/{centerId}/subscribers": {
      get: {
        summary: "List subscribers in a preference center",
        tags: ["Preferences"],
        parameters: [
          { name: "centerId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "email", in: "query", schema: { type: "string" } },
          { name: "external_id", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Paginated subscribers" } },
      },
      post: {
        summary: "Create or update subscriber preferences",
        tags: ["Preferences"],
        parameters: [{ name: "centerId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["preferences"],
                properties: {
                  email: { type: "string", format: "email" },
                  external_id: { type: "string" },
                  preferences: { type: "object" },
                  source: { type: "string", default: "api" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Subscriber updated" }, "201": { description: "Subscriber created" } },
      },
    },
    "/webhooks": {
      get: {
        summary: "List webhook subscriptions",
        tags: ["Webhooks"],
        responses: { "200": { description: "Paginated webhook list" } },
      },
      post: {
        summary: "Create a webhook subscription",
        tags: ["Webhooks"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url", "events"],
                properties: {
                  url: { type: "string", format: "uri" },
                  events: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["dsar.created", "dsar.status_changed", "dsar.fulfilled", "consent.recorded", "preferences.created", "preferences.updated"],
                    },
                  },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Webhook created (secret returned once)" } },
      },
    },
    "/webhooks/{id}": {
      get: { summary: "Get a webhook", tags: ["Webhooks"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Webhook details" } } },
      patch: {
        summary: "Update a webhook",
        tags: ["Webhooks"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { url: { type: "string" }, events: { type: "array", items: { type: "string" } }, active: { type: "boolean" } } } } } },
        responses: { "200": { description: "Webhook updated" } },
      },
      delete: { summary: "Delete a webhook", tags: ["Webhooks"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Webhook deleted" } } },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
