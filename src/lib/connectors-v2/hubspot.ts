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
import { crmContactLeadTree } from "./crm-helpers";

function pickText(row: {
  externalId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  company: string | null;
}): string {
  return JSON.stringify({
    id: row.externalId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    company: row.company,
  });
}

export const hubspotConnectorV2: DataConnectorV2 = {
  provider: "hubspot",
  capabilities: {
    introspect: true,
    sampleRows: true,
    searchSubject: true,
    deleteRecord: true,
    verifyDeletion: false,
  },

  async introspect(): Promise<AssetNode> {
    return crmContactLeadTree("hubspot");
  },

  async *sampleRows(ctx: ConnContext, tableExternalRef: string, opts?: SampleOpts): AsyncIterable<RowChunk> {
    const c = getConnector("hubspot");
    const max = Math.min(opts?.maxRecords ?? 200, 2000);
    const rows = await c.fetchContacts(ctx.connectionId);
    let n = 0;
    for (const row of rows) {
      if (n >= max) break;
      if (tableExternalRef.toLowerCase() === "contact" || tableExternalRef.toLowerCase() === "all") {
        yield {
          externalRecordId: row.externalId,
          texts: [pickText(row)],
          metadata: { provider: "hubspot" },
        };
        n++;
      }
    }
  },

  async searchSubject(ctx: ConnContext, subject: SubjectKey): Promise<SubjectMatch[]> {
    if (!subject.email) return [];
    const c = getConnector("hubspot");
    const hits = await c.searchByEmail(ctx.connectionId, subject.email);
    return hits.map((h) => ({
      provider: "hubspot",
      externalRecordId: h.externalId,
      label: "Contact",
      metadata: { email: h.email },
    }));
  },

  async deleteRecord(ctx: ConnContext, ref: RecordRef, mode: "delete" | "anonymize"): Promise<DeletionResult> {
    if (ref.provider !== "hubspot") return { ok: false, dryRun: false, message: "Provider mismatch" };
    if (mode === "anonymize") return { ok: false, dryRun: false, message: "Anonymize not implemented" };
    const c = getConnector("hubspot");
    const ok = await c.deleteContact(ctx.connectionId, ref.externalRecordId);
    return { ok, dryRun: false, message: ok ? undefined : "HubSpot delete failed" };
  },

  async verifyDeletion(): Promise<VerificationResult> {
    return { exists: false, message: "HubSpot verification not implemented" };
  },
};
