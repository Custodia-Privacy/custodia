import { getConnector } from "@/lib/connectors";
import type {
  AssetNode,
  ConnContext,
  DataConnectorV2,
  DeletionResult,
  RecordRef,
  RowChunk,
  SampleOpts,
  SubjectKey,
  SubjectMatch,
  VerificationResult,
} from "./types";

export const shopifyConnectorV2: DataConnectorV2 = {
  provider: "shopify",
  capabilities: {
    introspect: true,
    sampleRows: true,
    searchSubject: true,
    deleteRecord: true,
    verifyDeletion: false,
  },

  async introspect(): Promise<AssetNode> {
    return {
      kind: "source",
      provider: "shopify",
      name: "shopify",
      externalRef: "shopify:root",
      children: [
        {
          kind: "data_system",
          provider: "shopify",
          name: "Store",
          externalRef: "shopify:store",
          children: [
            {
              kind: "table",
              provider: "shopify",
              name: "Customer",
              externalRef: "Customer",
              children: [
                { kind: "field", provider: "shopify", name: "id", externalRef: "id" },
                { kind: "field", provider: "shopify", name: "email", externalRef: "email" },
                { kind: "field", provider: "shopify", name: "first_name", externalRef: "first_name" },
                { kind: "field", provider: "shopify", name: "last_name", externalRef: "last_name" },
                { kind: "field", provider: "shopify", name: "phone", externalRef: "phone" },
              ],
            },
          ],
        },
      ],
    };
  },

  async *sampleRows(ctx: ConnContext, tableExternalRef: string, opts?: SampleOpts): AsyncIterable<RowChunk> {
    const c = getConnector("shopify");
    const max = Math.min(opts?.maxRecords ?? 200, 2500);
    const rows = await c.fetchContacts(ctx.connectionId);
    let n = 0;
    for (const row of rows) {
      if (n >= max) break;
      if (tableExternalRef.toLowerCase() === "customer" || tableExternalRef.toLowerCase() === "all") {
        yield {
          externalRecordId: row.externalId,
          texts: [
            JSON.stringify({
              id: row.externalId,
              email: row.email,
              firstName: row.firstName,
              lastName: row.lastName,
              phone: row.phone,
              company: row.company,
            }),
          ],
          metadata: { provider: "shopify" },
        };
        n++;
      }
    }
  },

  async searchSubject(ctx: ConnContext, subject: SubjectKey): Promise<SubjectMatch[]> {
    if (!subject.email) return [];
    const c = getConnector("shopify");
    const hits = await c.searchByEmail(ctx.connectionId, subject.email);
    return hits.map((h) => ({
      provider: "shopify",
      externalRecordId: h.externalId,
      label: "Customer",
      metadata: { email: h.email },
    }));
  },

  async deleteRecord(ctx: ConnContext, ref: RecordRef, mode: "delete" | "anonymize"): Promise<DeletionResult> {
    if (ref.provider !== "shopify") return { ok: false, dryRun: false, message: "Provider mismatch" };
    if (mode === "anonymize") return { ok: false, dryRun: false, message: "Anonymize not implemented" };
    const c = getConnector("shopify");
    const ok = await c.deleteContact(ctx.connectionId, ref.externalRecordId);
    return { ok, dryRun: false, message: ok ? undefined : "Shopify delete failed" };
  },

  async verifyDeletion(): Promise<VerificationResult> {
    return { exists: false, message: "Shopify verification not implemented" };
  },
};
