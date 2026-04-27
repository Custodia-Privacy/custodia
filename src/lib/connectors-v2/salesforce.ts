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

function pickTextFromContact(row: {
  externalId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  company: string | null;
  metadata: Record<string, unknown>;
}): string {
  const meta = row.metadata ?? {};
  const source = typeof meta.source === "string" ? meta.source : "record";
  return JSON.stringify({
    source,
    id: row.externalId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    company: row.company,
  });
}

export const salesforceConnectorV2: DataConnectorV2 = {
  provider: "salesforce",
  capabilities: {
    introspect: true,
    sampleRows: true,
    searchSubject: true,
    deleteRecord: true,
    verifyDeletion: true,
  },

  async introspect(_ctx: ConnContext): Promise<AssetNode> {
    return crmContactLeadTree("salesforce");
  },

  async *sampleRows(ctx: ConnContext, tableExternalRef: string, opts?: SampleOpts): AsyncIterable<RowChunk> {
    const c = getConnector("salesforce");
    const max = Math.min(opts?.maxRecords ?? 200, 2000);
    const want = tableExternalRef.toLowerCase();
    const filterTable = want === "contact" || want === "lead";
    const rows = await c.fetchContacts(ctx.connectionId);
    let n = 0;
    for (const row of rows) {
      if (n >= max) break;
      const source = String((row.metadata as { source?: string }).source ?? "").toLowerCase();
      if (filterTable) {
        if (want === "contact" && source !== "contact") continue;
        if (want === "lead" && source !== "lead") continue;
      }
      yield {
        externalRecordId: row.externalId,
        texts: [pickTextFromContact(row)],
        metadata: { provider: "salesforce", source },
      };
      n++;
    }
  },

  async searchSubject(ctx: ConnContext, subject: SubjectKey): Promise<SubjectMatch[]> {
    if (!subject.email) return [];
    const c = getConnector("salesforce");
    const hits = await c.searchByEmail(ctx.connectionId, subject.email);
    return hits.map((h) => ({
      provider: "salesforce",
      externalRecordId: h.externalId,
      label: "Contact",
      metadata: { email: h.email },
    }));
  },

  async deleteRecord(ctx: ConnContext, ref: RecordRef, mode: "delete" | "anonymize"): Promise<DeletionResult> {
    if (ref.provider !== "salesforce") {
      return { ok: false, dryRun: false, message: "Provider mismatch" };
    }
    if (mode === "anonymize") {
      return { ok: false, dryRun: false, message: "Anonymize not implemented for Salesforce v1 API" };
    }
    const c = getConnector("salesforce");
    const ok = await c.deleteContact(ctx.connectionId, ref.externalRecordId);
    return { ok, dryRun: false, message: ok ? undefined : "Salesforce delete failed (Contact only in v1)" };
  },

  async verifyDeletion(_ctx: ConnContext, _ref: RecordRef): Promise<VerificationResult> {
    return { exists: false, message: "Verification requires provider-specific SOQL (TODO)" };
  },
};
