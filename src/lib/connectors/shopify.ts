/**
 * Shopify connector — syncs Customers for DSAR fulfillment.
 *
 * Uses Nango for OAuth token management. Queries Shopify Admin REST API.
 * The store domain is stored in the integration config.
 */
import { getNango } from "@/lib/nango";
import { createLogger } from "@/lib/logger";
import type { Connector, NormalizedContact } from "./types";

const log = createLogger("connector:shopify");

async function shopifyGet(
  connectionId: string,
  storeDomain: string,
  path: string,
): Promise<unknown> {
  const nango = getNango();
  const connection = await nango.getConnection("shopify", connectionId);
  const token = connection.credentials as { access_token: string } | undefined;
  if (!token?.access_token) throw new Error("No Shopify access token");

  const res = await fetch(`https://${storeDomain}/admin/api/2024-01${path}`, {
    headers: { "X-Shopify-Access-Token": token.access_token },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function normalizeCustomer(record: Record<string, unknown>): NormalizedContact {
  return {
    externalId: String(record.id ?? ""),
    email: typeof record.email === "string" ? record.email : null,
    firstName: typeof record.first_name === "string" ? record.first_name : null,
    lastName: typeof record.last_name === "string" ? record.last_name : null,
    phone: typeof record.phone === "string" ? record.phone : null,
    company: typeof record.company === "string" ? record.company : null,
    metadata: { source: "shopify", ordersCount: record.orders_count },
  };
}

function getStoreDomain(config: unknown): string {
  if (config && typeof config === "object" && "storeDomain" in config) {
    return String((config as Record<string, unknown>).storeDomain);
  }
  throw new Error("Shopify integration missing storeDomain in config");
}

export const shopifyConnector: Connector = {
  provider: "shopify",

  async fetchContacts(connectionId: string, since?: Date): Promise<NormalizedContact[]> {
    const customers: NormalizedContact[] = [];
    let sinceId: string | undefined;
    const params = new URLSearchParams({ limit: "250" });
    if (since) params.set("updated_at_min", since.toISOString());

    for (let page = 0; page < 10; page++) {
      const path = `/customers.json?${params.toString()}${sinceId ? `&since_id=${sinceId}` : ""}`;

      const result = (await shopifyGet(connectionId, "", path)) as {
        customers?: Record<string, unknown>[];
      };
      const batch = result.customers ?? [];
      for (const c of batch) {
        customers.push(normalizeCustomer(c));
      }

      if (batch.length < 250) break;
      sinceId = String(batch[batch.length - 1].id);
    }

    return customers;
  },

  async searchByEmail(connectionId: string, email: string): Promise<NormalizedContact[]> {
    const nango = getNango();
    const connection = await nango.getConnection("shopify", connectionId);
    const token = connection.credentials as { access_token: string } | undefined;
    if (!token?.access_token) return [];

    const storeDomain = "";
    const path = `/customers/search.json?query=email:${encodeURIComponent(email)}&limit=10`;

    try {
      const result = (await shopifyGet(connectionId, storeDomain, path)) as {
        customers?: Record<string, unknown>[];
      };
      return (result.customers ?? []).map(normalizeCustomer);
    } catch (e) {
      log.error("Shopify search failed", e);
      return [];
    }
  },

  async deleteContact(connectionId: string, externalId: string): Promise<boolean> {
    const nango = getNango();
    const connection = await nango.getConnection("shopify", connectionId);
    const token = connection.credentials as { access_token: string } | undefined;
    if (!token?.access_token) return false;

    const storeDomain = "";
    const res = await fetch(
      `https://${storeDomain}/admin/api/2024-01/customers/${externalId}.json`,
      {
        method: "DELETE",
        headers: { "X-Shopify-Access-Token": token.access_token },
      },
    );

    return res.ok;
  },
};
