/**
 * Connector registry — resolves provider name to connector implementation.
 */
import { salesforceConnector } from "./salesforce";
import { hubspotConnector } from "./hubspot";
import { shopifyConnector } from "./shopify";
import type { Connector } from "./types";

export type { Connector, NormalizedContact, ConnectorSyncResult, ConnectorSearchResult } from "./types";

const CONNECTORS: Record<string, Connector> = {
  salesforce: salesforceConnector,
  hubspot: hubspotConnector,
  shopify: shopifyConnector,
};

export function getConnector(provider: string): Connector {
  const c = CONNECTORS[provider];
  if (!c) throw new Error(`Unknown connector provider: ${provider}`);
  return c;
}

export function listProviders(): string[] {
  return Object.keys(CONNECTORS);
}
