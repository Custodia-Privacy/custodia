/**
 * HubSpot connector — syncs Contacts for DSAR fulfillment.
 *
 * Uses Nango for OAuth token management. Queries the HubSpot CRM v3 API.
 */
import { getNango } from "@/lib/nango";
import { createLogger } from "@/lib/logger";
import type { Connector, NormalizedContact } from "./types";

const log = createLogger("connector:hubspot");
const HUBSPOT_API = "https://api.hubapi.com";

async function hsGet(connectionId: string, path: string): Promise<unknown> {
  const nango = getNango();
  const connection = await nango.getConnection("hubspot", connectionId);
  const token = connection.credentials as { access_token: string } | undefined;
  if (!token?.access_token) throw new Error("No HubSpot access token");

  const res = await fetch(`${HUBSPOT_API}${path}`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HubSpot API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function normalizeContact(record: Record<string, unknown>): NormalizedContact {
  const props = (record.properties ?? {}) as Record<string, string | null>;
  return {
    externalId: String(record.id ?? ""),
    email: props.email ?? null,
    firstName: props.firstname ?? null,
    lastName: props.lastname ?? null,
    phone: props.phone ?? null,
    company: props.company ?? null,
    metadata: { source: "hubspot", ...props },
  };
}

export const hubspotConnector: Connector = {
  provider: "hubspot",

  async fetchContacts(connectionId: string, since?: Date): Promise<NormalizedContact[]> {
    const contacts: NormalizedContact[] = [];
    let after: string | undefined;
    const limit = 100;

    for (let page = 0; page < 20; page++) {
      let path = `/crm/v3/objects/contacts?limit=${limit}&properties=email,firstname,lastname,phone,company`;
      if (after) path += `&after=${after}`;

      const result = (await hsGet(connectionId, path)) as {
        results?: Record<string, unknown>[];
        paging?: { next?: { after?: string } };
      };

      for (const r of result.results ?? []) {
        const c = normalizeContact(r);
        if (since) {
          const updated = (r as Record<string, unknown>).updatedAt as string | undefined;
          if (updated && new Date(updated) < since) continue;
        }
        contacts.push(c);
      }

      after = result.paging?.next?.after;
      if (!after) break;
    }

    return contacts;
  },

  async searchByEmail(connectionId: string, email: string): Promise<NormalizedContact[]> {
    const nango = getNango();
    const connection = await nango.getConnection("hubspot", connectionId);
    const token = connection.credentials as { access_token: string } | undefined;
    if (!token?.access_token) throw new Error("No HubSpot access token");

    const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filterGroups: [
          { filters: [{ propertyName: "email", operator: "EQ", value: email }] },
        ],
        properties: ["email", "firstname", "lastname", "phone", "company"],
        limit: 10,
      }),
    });

    if (!res.ok) {
      log.error(`HubSpot search failed: ${res.status}`);
      return [];
    }

    const data = (await res.json()) as { results?: Record<string, unknown>[] };
    return (data.results ?? []).map(normalizeContact);
  },

  async deleteContact(connectionId: string, externalId: string): Promise<boolean> {
    const nango = getNango();
    const connection = await nango.getConnection("hubspot", connectionId);
    const token = connection.credentials as { access_token: string } | undefined;
    if (!token?.access_token) return false;

    const res = await fetch(
      `${HUBSPOT_API}/crm/v3/objects/contacts/${externalId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token.access_token}` },
      },
    );

    return res.status === 204;
  },
};
