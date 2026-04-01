/**
 * Salesforce connector — syncs Contacts & Leads for DSAR fulfillment.
 *
 * Uses Nango to manage OAuth tokens. Queries the Salesforce REST API
 * (SOQL) via the access token from Nango.
 */
import { getNango } from "@/lib/nango";
import { createLogger } from "@/lib/logger";
import type { Connector, NormalizedContact } from "./types";

const log = createLogger("connector:salesforce");

async function sfFetch(connectionId: string, path: string): Promise<unknown> {
  const nango = getNango();
  const connection = await nango.getConnection("salesforce", connectionId);
  const token = connection.credentials as { access_token: string; instance_url?: string } | undefined;
  if (!token?.access_token) throw new Error("No Salesforce access token");

  const instanceUrl =
    token.instance_url ??
    (connection as unknown as { connection_config?: { instance_url?: string } }).connection_config?.instance_url ??
    "https://login.salesforce.com";

  const res = await fetch(`${instanceUrl}${path}`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Salesforce API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function normalizeContact(record: Record<string, unknown>, source: string): NormalizedContact {
  return {
    externalId: String(record.Id ?? ""),
    email: typeof record.Email === "string" ? record.Email : null,
    firstName: typeof record.FirstName === "string" ? record.FirstName : null,
    lastName: typeof record.LastName === "string" ? record.LastName : null,
    phone: typeof record.Phone === "string" ? record.Phone : null,
    company:
      typeof record.Company === "string"
        ? record.Company
        : typeof record.Account === "object" && record.Account
          ? String((record.Account as Record<string, unknown>).Name ?? "")
          : null,
    metadata: { source, ...record },
  };
}

export const salesforceConnector: Connector = {
  provider: "salesforce",

  async fetchContacts(connectionId: string, since?: Date): Promise<NormalizedContact[]> {
    const contacts: NormalizedContact[] = [];

    const sinceClause = since
      ? ` WHERE LastModifiedDate >= ${since.toISOString()}`
      : "";

    const contactQuery = `SELECT Id, FirstName, LastName, Email, Phone, Account.Name FROM Contact${sinceClause} ORDER BY LastModifiedDate DESC LIMIT 2000`;
    const leadQuery = `SELECT Id, FirstName, LastName, Email, Phone, Company FROM Lead${sinceClause} ORDER BY LastModifiedDate DESC LIMIT 2000`;

    try {
      const contactResult = (await sfFetch(
        connectionId,
        `/services/data/v59.0/query?q=${encodeURIComponent(contactQuery)}`,
      )) as { records?: Record<string, unknown>[] };
      for (const r of contactResult.records ?? []) {
        contacts.push(normalizeContact(r, "contact"));
      }
    } catch (e) {
      log.error("Failed to fetch Salesforce contacts", e);
    }

    try {
      const leadResult = (await sfFetch(
        connectionId,
        `/services/data/v59.0/query?q=${encodeURIComponent(leadQuery)}`,
      )) as { records?: Record<string, unknown>[] };
      for (const r of leadResult.records ?? []) {
        contacts.push(normalizeContact(r, "lead"));
      }
    } catch (e) {
      log.error("Failed to fetch Salesforce leads", e);
    }

    return contacts;
  },

  async searchByEmail(connectionId: string, email: string): Promise<NormalizedContact[]> {
    const escaped = email.replace(/'/g, "\\'");
    const query = `SELECT Id, FirstName, LastName, Email, Phone, Account.Name FROM Contact WHERE Email = '${escaped}' LIMIT 10`;
    const result = (await sfFetch(
      connectionId,
      `/services/data/v59.0/query?q=${encodeURIComponent(query)}`,
    )) as { records?: Record<string, unknown>[] };

    return (result.records ?? []).map((r) => normalizeContact(r, "contact"));
  },

  async deleteContact(connectionId: string, externalId: string): Promise<boolean> {
    const nango = getNango();
    const connection = await nango.getConnection("salesforce", connectionId);
    const token = connection.credentials as { access_token: string; instance_url?: string } | undefined;
    if (!token?.access_token) return false;

    const instanceUrl =
      token.instance_url ??
      (connection as unknown as { connection_config?: { instance_url?: string } }).connection_config?.instance_url ??
      "https://login.salesforce.com";

    const res = await fetch(
      `${instanceUrl}/services/data/v59.0/sobjects/Contact/${externalId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token.access_token}` },
      },
    );

    return res.status === 204;
  },
};
