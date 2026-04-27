import type { DataConnectorV2 } from "./types";
import { createScaffoldAdapter } from "./scaffold-adapter";
import { salesforceConnectorV2 } from "./salesforce";
import { hubspotConnectorV2 } from "./hubspot";
import { shopifyConnectorV2 } from "./shopify";

const V2_REGISTRY: Record<string, DataConnectorV2> = {
  salesforce: salesforceConnectorV2,
  hubspot: hubspotConnectorV2,
  shopify: shopifyConnectorV2,
};

const WAREHOUSE_SCAFFOLDS = [
  "postgres",
  "mysql",
  "mssql",
  "snowflake",
  "bigquery",
  "redshift",
  "databricks",
] as const;

const OBJECT_SCAFFOLDS = ["s3", "gcs", "azure_blob"] as const;

for (const p of WAREHOUSE_SCAFFOLDS) {
  V2_REGISTRY[p] = createScaffoldAdapter(
    p,
    "Warehouse adapter ships in Data Inventory v2 (column scan + SQL delete).",
  );
}
for (const p of OBJECT_SCAFFOLDS) {
  V2_REGISTRY[p] = createScaffoldAdapter(
    p,
    "Object store adapter ships in Data Inventory v3 (S3/GCS/Azure lifecycle + extractors).",
  );
}

export type { DataConnectorV2, AssetNode, ConnContext, RowChunk, SubjectKey, SubjectMatch, RecordRef } from "./types";
export { createScaffoldAdapter } from "./scaffold-adapter";
export { salesforceConnectorV2 } from "./salesforce";
export { hubspotConnectorV2 } from "./hubspot";
export { shopifyConnectorV2 } from "./shopify";

export function getConnectorV2(provider: string): DataConnectorV2 {
  const key = provider.toLowerCase();
  const c = V2_REGISTRY[key];
  if (!c) {
    return createScaffoldAdapter(provider, `Unknown provider: ${provider}`);
  }
  return c;
}

export function listConnectorV2Providers(): string[] {
  return Object.keys(V2_REGISTRY);
}
