/**
 * Data Mapper Agent — discovers data flows between registered data stores,
 * classifies data sensitivity, and identifies cross-border transfers.
 */
import type { PrismaClient } from "@prisma/client";
import { BaseAgent } from "./base";

interface DataMapperInput {
  storeId?: string;
}

export class DataMapperAgent extends BaseAgent {
  constructor(orgId: string, runId: string, db: PrismaClient) {
    super(orgId, runId, db);
  }

  async execute(input: Record<string, unknown>): Promise<void> {
    const { storeId } = input as DataMapperInput;

    await this.updateStatus("running");
    await this.log("info", `Data mapper started${storeId ? ` for store ${storeId}` : " for all stores"}`);

    const stores = await this.getStores(storeId);
    if (stores.length === 0) {
      await this.log("warn", "No data stores found");
      await this.complete({ message: "No data stores to map", flowsCreated: 0, classificationsUpdated: 0 });
      return;
    }

    await this.log("info", `Found ${stores.length} data store(s) to analyze`);

    // Step 1: Classify each store's data sensitivity
    let classificationsUpdated = 0;
    for (const store of stores) {
      const updated = await this.classifyStore(store);
      if (updated) classificationsUpdated++;
    }
    await this.log("info", `Updated classifications for ${classificationsUpdated} store(s)`);

    // Step 2: Discover data flows between stores
    const flowsCreated = await this.discoverFlows(stores);
    await this.log("info", `Discovered ${flowsCreated} new data flow(s)`);

    // Step 3: Generate summary report
    const report = await this.generateReport(stores, flowsCreated, classificationsUpdated);

    await this.complete({
      flowsCreated,
      classificationsUpdated,
      storesAnalyzed: stores.length,
      report,
    });
  }

  private async getStores(storeId?: string) {
    const where: Record<string, unknown> = {
      orgId: this.orgId,
      status: "active",
    };
    if (storeId) where.id = storeId;

    return this.db.dataStore.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        provider: true,
        location: true,
        description: true,
        dataTypes: true,
        sensitivity: true,
        piiFields: true,
      },
    });
  }

  private async classifyStore(store: {
    id: string;
    name: string;
    type: string;
    provider: string | null;
    location: string | null;
    description: string | null;
    dataTypes: unknown;
    sensitivity: string;
    piiFields: unknown;
  }): Promise<boolean> {
    try {
      const text = await this.callClaude({
        system: `You are a data privacy classifier. Analyze a data store and classify its contents.
Respond with JSON only:
{
  "sensitivity": "public" | "internal" | "confidential" | "restricted",
  "dataTypes": ["string array of data types stored, e.g. email, name, IP address, payment info"],
  "piiFields": ["string array of specific PII fields"],
  "crossBorderRisk": true | false,
  "reasoning": "brief explanation"
}`,
        prompt: `Classify this data store:
Name: ${store.name}
Type: ${store.type}
Provider: ${store.provider ?? "unknown"}
Location: ${store.location ?? "unknown"}
Description: ${store.description ?? "none"}
Current data types: ${JSON.stringify(store.dataTypes) ?? "unknown"}
Current PII fields: ${JSON.stringify(store.piiFields) ?? "unknown"}`,
        maxTokens: 1000,
      });

      const classification = this.parseJSON<{
        sensitivity: string;
        dataTypes: string[];
        piiFields: string[];
      }>(text);

      const validSensitivities = ["public", "internal", "confidential", "restricted"] as const;
      type Sensitivity = (typeof validSensitivities)[number];
      const sensitivity: Sensitivity = (validSensitivities as readonly string[]).includes(classification.sensitivity)
        ? (classification.sensitivity as Sensitivity)
        : (store.sensitivity as Sensitivity);

      await this.db.dataStore.update({
        where: { id: store.id },
        data: {
          sensitivity,
          dataTypes: classification.dataTypes as any,
          piiFields: classification.piiFields as any,
        },
      });

      return true;
    } catch (err) {
      await this.log("warn", `Failed to classify store ${store.name}: ${err instanceof Error ? err.message : "unknown"}`);
      return false;
    }
  }

  private async discoverFlows(
    stores: Array<{ id: string; name: string; type: string; provider: string | null; description: string | null; dataTypes: unknown }>,
  ): Promise<number> {
    if (stores.length < 2) return 0;

    // Get existing flows to avoid duplicates
    const existingFlows = await this.db.dataFlow.findMany({
      where: { orgId: this.orgId },
      select: { sourceId: true, targetId: true },
    });
    const existingPairs = new Set(existingFlows.map((f) => `${f.sourceId}:${f.targetId}`));

    const storesSummary = stores.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      provider: s.provider,
      description: s.description,
      dataTypes: s.dataTypes,
    }));

    const text = await this.callClaude({
      system: `You are a data flow discovery engine. Given a list of data stores, infer likely data flows between them.
Respond with JSON only:
{
  "flows": [
    {
      "sourceId": "store UUID",
      "targetId": "store UUID",
      "dataTypes": ["what data flows"],
      "purpose": "why this flow exists",
      "legalBasis": "consent" | "contract" | "legitimate_interest" | "legal_obligation",
      "crossBorder": true | false,
      "confidence": 0.0 to 1.0
    }
  ]
}
Only include flows with confidence >= 0.5. Do not create self-referencing flows.`,
      prompt: `Discover data flows between these stores:\n${JSON.stringify(storesSummary, null, 2)}`,
      maxTokens: 2000,
    });

    let flows: Array<{
      sourceId: string;
      targetId: string;
      dataTypes: string[];
      purpose: string;
      legalBasis: string;
      crossBorder: boolean;
      confidence: number;
    }>;

    try {
      const parsed = this.parseJSON<{ flows: typeof flows }>(text);
      flows = parsed.flows ?? [];
    } catch {
      await this.log("warn", "Could not parse flow discovery results");
      return 0;
    }

    const storeIds = new Set(stores.map((s) => s.id));
    let created = 0;

    for (const flow of flows) {
      if (
        !storeIds.has(flow.sourceId) ||
        !storeIds.has(flow.targetId) ||
        flow.sourceId === flow.targetId ||
        existingPairs.has(`${flow.sourceId}:${flow.targetId}`)
      ) {
        continue;
      }

      try {
        await this.db.dataFlow.create({
          data: {
            orgId: this.orgId,
            sourceId: flow.sourceId,
            targetId: flow.targetId,
            dataTypes: flow.dataTypes as any,
            purpose: flow.purpose,
            legalBasis: flow.legalBasis,
            crossBorder: flow.crossBorder,
            discoveredBy: "data_mapper_agent",
            confidence: flow.confidence,
            verified: false,
          },
        });
        created++;
        existingPairs.add(`${flow.sourceId}:${flow.targetId}`);
      } catch {
        // unique constraint violation — flow already exists
      }
    }

    return created;
  }

  private async generateReport(
    stores: Array<{ id: string; name: string; type: string; sensitivity: string }>,
    flowsCreated: number,
    classificationsUpdated: number,
  ): Promise<Record<string, unknown>> {
    const totalFlows = await this.db.dataFlow.count({ where: { orgId: this.orgId } });
    const crossBorderFlows = await this.db.dataFlow.count({ where: { orgId: this.orgId, crossBorder: true } });
    const unverifiedFlows = await this.db.dataFlow.count({ where: { orgId: this.orgId, verified: false } });

    const sensitivityBreakdown: Record<string, number> = {};
    for (const s of stores) {
      sensitivityBreakdown[s.sensitivity] = (sensitivityBreakdown[s.sensitivity] ?? 0) + 1;
    }

    return {
      generatedAt: new Date().toISOString(),
      storesAnalyzed: stores.length,
      classificationsUpdated,
      newFlowsDiscovered: flowsCreated,
      totalFlows,
      crossBorderFlows,
      unverifiedFlows,
      sensitivityBreakdown,
    };
  }
}
