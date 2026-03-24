import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CustodiaClient } from "../client.js";

export function registerGovernanceTools(server: McpServer, client: CustodiaClient) {
  // ─── Data Store Tools ─────────────────────────────────────────────────

  server.tool(
    "list_data_stores",
    `List all registered data stores in the organization's data map. Data stores are the systems where personal data lives — databases, SaaS apps, CRMs, analytics platforms, file storage, APIs, etc. Each store has a type, provider, data sensitivity classification, and PII field inventory. This is the foundation of your Records of Processing Activities (ROPA) required by GDPR Art. 30.`,
    {
      type: z
        .enum(["database", "api", "file_storage", "saas_app", "crm", "analytics", "email_platform", "cdn", "payment_processor", "other"])
        .optional()
        .describe("Filter by data store type"),
    },
    async ({ type }) => {
      const result = await client.query("dataStore.list", { type });
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
    "add_data_store",
    `Register a new data store in the organization's data map. A data store is any system that holds personal data — production databases, third-party SaaS tools (Hubspot, Mixpanel, Mailchimp), cloud storage (S3, GCS), payment processors (Stripe), etc. After adding, use classify_data to AI-detect what personal data it contains.`,
    {
      name: z.string().min(1).max(255).describe("Display name, e.g. 'Production PostgreSQL' or 'Hubspot CRM'"),
      type: z
        .enum(["database", "api", "file_storage", "saas_app", "crm", "analytics", "email_platform", "cdn", "payment_processor", "other"])
        .describe("Category of data store"),
      provider: z.string().max(100).optional().describe("Provider name, e.g. 'AWS RDS', 'Google Cloud', 'Hubspot'"),
      location: z.string().max(100).optional().describe("Geographic location or region, e.g. 'us-east-1', 'EU', 'Frankfurt'"),
      description: z.string().optional().describe("Description of what this store is used for"),
    },
    async ({ name, type, provider, location, description }) => {
      const result = await client.mutate("dataStore.create", {
        name,
        type,
        provider,
        location,
        description,
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
    "classify_data",
    `AI-classify the personal data in a data store. The AI analyzes the store's schema and sample data to identify PII fields (names, emails, phone numbers, IP addresses, etc.), assign a data sensitivity level (public, internal, confidential, restricted, pii, sensitive_pii), and inventory all data types present. This is essential for GDPR Art. 30 record-keeping and for DSAR fulfillment — you need to know where personal data lives before you can find, export, or delete it.`,
    {
      storeId: z.string().uuid().describe("The UUID of the data store to classify"),
    },
    async ({ storeId }) => {
      const result = await client.mutate("dataStore.classify", { storeId });
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
    "map_data_flows",
    `AI-discover data flows between registered data stores. Analyzes how personal data moves through the organization — from collection points (website forms, APIs) through processing systems (databases, analytics) to third parties (vendors, partners). Identifies cross-border transfers (critical for GDPR Chapter V compliance), purposes of each transfer, and legal basis. This builds the data flow map required for ROPA compliance.`,
    {},
    async () => {
      const result = await client.mutate("dataFlow.discover");
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

  // ─── Vendor Tools ─────────────────────────────────────────────────────

  server.tool(
    "list_vendors",
    `List all third-party vendors (data processors and sub-processors) registered in the organization. Under GDPR Art. 28, you must maintain a list of all processors who handle personal data on your behalf, with documented Data Processing Agreements (DPAs). Returns vendor details including category, DPA status, risk level, compliance status, and what data is shared with them.`,
    {
      category: z.string().optional().describe("Filter by vendor category, e.g. 'analytics', 'hosting', 'email', 'payment'"),
    },
    async ({ category }) => {
      const result = await client.query("vendor.list", { category });
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
    "add_vendor",
    `Register a new third-party vendor (data processor). Vendors are companies that process personal data on your behalf — analytics providers, email services, payment processors, hosting providers, etc. GDPR Art. 28 requires a Data Processing Agreement (DPA) with each processor. Include the vendor's DPA URL and privacy policy URL if available.`,
    {
      name: z.string().min(1).max(255).describe("Vendor company name, e.g. 'Google Analytics'"),
      category: z.string().min(1).max(100).describe("Vendor category: analytics, hosting, email, payment, advertising, crm, support, security, etc."),
      website: z.string().max(500).optional().describe("Vendor website URL"),
      dpaUrl: z.string().max(500).optional().describe("URL to the vendor's Data Processing Agreement"),
      privacyPolicyUrl: z.string().max(500).optional().describe("URL to the vendor's privacy policy"),
      dataShared: z.any().optional().describe("JSON describing what personal data is shared with this vendor"),
      purposes: z.any().optional().describe("JSON array of purposes for data sharing"),
      legalBasis: z.string().max(100).optional().describe("Legal basis for sharing: consent, legitimate_interest, contract, legal_obligation"),
    },
    async ({ name, category, website, dpaUrl, privacyPolicyUrl, dataShared, purposes, legalBasis }) => {
      const result = await client.mutate("vendor.create", {
        name,
        category,
        website,
        dpaUrl,
        privacyPolicyUrl,
        dataShared,
        purposes,
        legalBasis,
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
    "review_vendor",
    `AI-review a vendor's privacy and compliance posture. The AI analyzes the vendor's privacy policy and DPA (if URLs provided), checks for key GDPR Art. 28 requirements (data processing limitations, security measures, sub-processor disclosure, audit rights, data deletion), assesses risk level, and generates a compliance report with recommendations. Run this periodically — vendor compliance should be reviewed at least annually.`,
    {
      vendorId: z.string().uuid().describe("The UUID of the vendor to review"),
    },
    async ({ vendorId }) => {
      const result = await client.mutate("vendor.review", { vendorId });
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
