/**
 * DSAR Processor Agent — automates Data Subject Access Request fulfillment.
 *
 * Analyzes the request, discovers data across connected stores,
 * generates a response letter, and updates the DSAR record.
 */
import type { PrismaClient } from "@prisma/client";
import { BaseAgent } from "./base";

interface DsarInput {
  dsarId: string;
}

interface DataLocation {
  storeId: string;
  storeName: string;
  storeType: string;
  likelyDataTypes: string[];
  searchStrategy: string;
  confidence: "high" | "medium" | "low";
}

interface ResponsePackage {
  letter: string;
  jurisdiction: string;
  regulation: string;
  responseDeadline: string;
  dataCategories: string[];
  requiresRedaction: boolean;
  notes: string[];
}

const JURISDICTION_REGULATIONS: Record<string, { regulation: string; responseDays: number }> = {
  gdpr: { regulation: "GDPR (EU)", responseDays: 30 },
  ccpa: { regulation: "CCPA (California)", responseDays: 45 },
  cpra: { regulation: "CPRA (California)", responseDays: 45 },
  vcdpa: { regulation: "VCDPA (Virginia)", responseDays: 45 },
  ctdpa: { regulation: "CTDPA (Connecticut)", responseDays: 45 },
  cpa: { regulation: "CPA (Colorado)", responseDays: 45 },
  uk_gdpr: { regulation: "UK GDPR", responseDays: 30 },
  lgpd: { regulation: "LGPD (Brazil)", responseDays: 15 },
  pipeda: { regulation: "PIPEDA (Canada)", responseDays: 30 },
};

export class DsarAgent extends BaseAgent {
  constructor(orgId: string, runId: string, db: PrismaClient) {
    super(orgId, runId, db);
  }

  async execute(input: Record<string, unknown>): Promise<void> {
    const { dsarId } = input as unknown as DsarInput;
    if (!dsarId) {
      await this.fail("Missing required input: dsarId");
      return;
    }

    await this.updateStatus("running");
    await this.log("info", `DSAR processor started for request ${dsarId}`);

    const dsar = await this.db.dsarRequest.findFirst({
      where: { id: dsarId, orgId: this.orgId },
    });

    if (!dsar) {
      await this.fail(`DSAR request ${dsarId} not found for this organization`);
      return;
    }

    await this.log("info", `Processing ${dsar.requestType} request from ${dsar.requesterName} (${dsar.jurisdiction})`);

    await this.db.dsarRequest.update({
      where: { id: dsarId },
      data: { status: "processing" },
    });
    await this.createActivity(dsarId, "status_change", { from: dsar.status, to: "processing" });

    const analysis = await this.analyzeRequest(dsar);
    await this.log("info", `AI analysis complete: ${analysis.dataCategories.length} data categories identified`);

    const dataStores = await this.db.dataStore.findMany({
      where: { orgId: this.orgId, status: "active" },
    });
    await this.log("info", `Found ${dataStores.length} connected data store(s)`);

    const dataLocations = await this.generateQueryPlans(dsar, dataStores, analysis);
    await this.log("info", `Generated query plans for ${dataLocations.length} data store(s)`);
    await this.createActivity(dsarId, "data_discovery", {
      storesSearched: dataStores.length,
      locationsFound: dataLocations.length,
    });

    const responsePackage = await this.generateResponseLetter(dsar, analysis, dataLocations);
    await this.log("info", `Response letter generated for ${responsePackage.jurisdiction}`);

    await this.db.dsarRequest.update({
      where: { id: dsarId },
      data: {
        status: "data_collected",
        aiSummary: analysis.summary,
        dataLocations: dataLocations as any,
        responsePackage: responsePackage as any,
      },
    });

    await this.createActivity(dsarId, "ai_processing_complete", {
      dataLocations: dataLocations.length,
      responseGenerated: true,
    });

    await this.complete({
      dsarId,
      requestType: dsar.requestType,
      requester: dsar.requesterName,
      jurisdiction: dsar.jurisdiction,
      dataStoresSearched: dataStores.length,
      dataLocationsFound: dataLocations.length,
      responseGenerated: true,
      summary: analysis.summary,
    });
  }

  private async analyzeRequest(dsar: {
    requestType: string;
    requesterName: string;
    requesterEmail: string;
    requesterPhone: string | null;
    jurisdiction: string;
    notes: string | null;
  }): Promise<{
    summary: string;
    dataCategories: string[];
    identifiers: string[];
    specialConsiderations: string[];
  }> {
    const text = await this.callClaude({
      system: `You are a privacy compliance expert inside Custodia, an AI-native privacy platform. You analyze Data Subject Access Requests (DSARs) to determine what personal data needs to be found and returned. You understand GDPR, CCPA, VCDPA, CTDPA, CPA, and other privacy regulations deeply.

Respond with JSON only: {"summary":"string","dataCategories":["string"],"identifiers":["string"],"specialConsiderations":["string"]}`,
      prompt: `Analyze this DSAR and determine what data needs to be found:

Request Type: ${dsar.requestType}
Jurisdiction: ${dsar.jurisdiction}
Requester: [Requester]
Email: [requester-email-redacted]
Phone: ${dsar.requesterPhone ? "[phone-redacted]" : "Not provided"}
Additional Notes: ${dsar.notes ? "[user-provided notes redacted for privacy]" : "None"}

Based on the request type and jurisdiction:
1. Summarize what the requester is asking for
2. List all categories of personal data that should be searched for
3. List all identifiers that can be used to find the data (email, name, phone, etc.)
4. Note any special considerations for this jurisdiction/request type (deadlines, exceptions, required disclosures)`,
      maxTokens: 1500,
    });

    try {
      return this.parseJSON(text);
    } catch {
      return {
        summary: `${dsar.requestType} request under ${dsar.jurisdiction}`,
        dataCategories: ["contact_info", "account_data", "usage_data", "communications"],
        identifiers: ["[requester-email]", "[requester-name]", ...(dsar.requesterPhone ? ["[requester-phone]"] : [])],
        specialConsiderations: [`Review ${dsar.jurisdiction} requirements for response timeline`],
      };
    }
  }

  private async generateQueryPlans(
    dsar: { requesterName: string; requesterEmail: string; requestType: string },
    dataStores: Array<{
      id: string;
      name: string;
      type: string;
      provider: string | null;
      description: string | null;
      dataTypes: unknown;
      piiFields: unknown;
    }>,
    analysis: { dataCategories: string[]; identifiers: string[] },
  ): Promise<DataLocation[]> {
    if (dataStores.length === 0) return [];

    const storeDescriptions = dataStores.map((ds) => ({
      id: ds.id,
      name: ds.name,
      type: ds.type,
      provider: ds.provider,
      description: ds.description,
      dataTypes: ds.dataTypes,
      piiFields: ds.piiFields,
    }));

    const text = await this.callClaude({
      system: `You are a data discovery expert inside Custodia, an AI-native privacy platform. Given a DSAR and a list of connected data stores, determine which stores likely contain the subject's data and how to search for it.

Respond with JSON only: an array of objects with shape:
[{"storeId":"string","storeName":"string","storeType":"string","likelyDataTypes":["string"],"searchStrategy":"string","confidence":"high|medium|low"}]

Only include stores that are likely to contain relevant data. Be specific about search strategies.`,
      prompt: `DSAR Context:
- Request type: ${dsar.requestType}
- Subject: [Requester] ([requester-email-redacted])
- Data categories to find: ${analysis.dataCategories.join(", ")}
- Available identifiers: email, name, phone (if provided)

Connected Data Stores:
${JSON.stringify(storeDescriptions, null, 2)}

For each relevant store, explain what data is likely there and how to search for it.`,
      maxTokens: 2000,
    });

    try {
      return this.parseJSON<DataLocation[]>(text);
    } catch {
      return dataStores.map((ds) => ({
        storeId: ds.id,
        storeName: ds.name,
        storeType: ds.type,
        likelyDataTypes: ["unknown"],
        searchStrategy: "Search by email identifier",
        confidence: "low" as const,
      }));
    }
  }

  private async generateResponseLetter(
    dsar: {
      requestType: string;
      requesterName: string;
      requesterEmail: string;
      jurisdiction: string;
      receivedAt: Date;
      dueDate: Date;
      extensionDays: number;
    },
    analysis: { summary: string; dataCategories: string[]; specialConsiderations: string[] },
    dataLocations: DataLocation[],
  ): Promise<ResponsePackage> {
    const jurisdictionInfo = JURISDICTION_REGULATIONS[dsar.jurisdiction] ?? {
      regulation: dsar.jurisdiction.toUpperCase(),
      responseDays: 30,
    };

    const text = await this.callClaude({
      system: `You are a privacy compliance legal writer inside Custodia, an AI-native privacy platform. Generate a professional DSAR response letter template appropriate for the jurisdiction. The letter should be legally sound but written in clear language.

Respond with JSON only:
{"letter":"string (the complete letter template with [PLACEHOLDERS] for org-specific info)","jurisdiction":"string","regulation":"string","responseDeadline":"string","dataCategories":["string"],"requiresRedaction":boolean,"notes":["string"]}`,
      prompt: `Generate a DSAR response letter template:

Request Details:
- Type: ${dsar.requestType}
- Requester: [Requester] ([requester-email-redacted])
- Jurisdiction: ${dsar.jurisdiction} (${jurisdictionInfo.regulation})
- Received: ${dsar.receivedAt.toISOString().split("T")[0]}
- Due Date: ${dsar.dueDate.toISOString().split("T")[0]}
- Extension: ${dsar.extensionDays} days

Data Found In:
${dataLocations.map((dl) => `- ${dl.storeName} (${dl.storeType}): ${dl.likelyDataTypes.join(", ")}`).join("\n")}

Data Categories: ${analysis.dataCategories.join(", ")}
Special Considerations: ${analysis.specialConsiderations.join("; ")}

Requirements:
1. Address the specific request type (${dsar.requestType})
2. Reference the applicable regulation
3. Include all required disclosures for the jurisdiction
4. Use [PLACEHOLDERS] for organization name, DPO contact, etc.
5. Be professional and clear`,
      maxTokens: 3000,
    });

    try {
      return this.parseJSON<ResponsePackage>(text);
    } catch {
      return {
        letter: `Dear ${dsar.requesterName},\n\nWe acknowledge receipt of your ${dsar.requestType} request dated ${dsar.receivedAt.toISOString().split("T")[0]}. Under ${jurisdictionInfo.regulation}, we are processing your request and will respond by ${dsar.dueDate.toISOString().split("T")[0]}.\n\nWe have identified data related to your request in ${dataLocations.length} system(s). A full response with the requested information will follow.\n\nSincerely,\n[ORGANIZATION_NAME]\n[DPO_CONTACT]`,
        jurisdiction: dsar.jurisdiction,
        regulation: jurisdictionInfo.regulation,
        responseDeadline: dsar.dueDate.toISOString().split("T")[0],
        dataCategories: analysis.dataCategories,
        requiresRedaction: dsar.requestType === "access" || dsar.requestType === "portability",
        notes: ["Review letter before sending", "Verify all data locations manually"],
      };
    }
  }

  private async createActivity(
    requestId: string,
    action: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    await this.db.dsarActivity.create({
      data: {
        requestId,
        action,
        details: details as any,
        actor: "dsar_processor_agent",
      },
    });
  }
}
