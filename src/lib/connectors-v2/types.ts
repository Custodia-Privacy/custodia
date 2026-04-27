/**
 * Data connector v2 — introspection, sampling, subject search, delete, verify.
 * Used by inventory scans, retention enforcement, and DSAR deletion executor.
 */

export type OperatingPoint = "balanced" | "high_recall" | "high_precision";

export interface ConnContext {
  connectionId: string;
  orgId?: string;
}

export interface SampleOpts {
  maxRecords?: number;
  operatingPoint?: OperatingPoint;
}

/** Flattened tree node for persistence as DataAsset rows */
export interface AssetNode {
  kind:
    | "source"
    | "data_system"
    | "database"
    | "schema"
    | "table"
    | "collection"
    | "bucket"
    | "folder"
    | "file"
    | "field";
  provider: string;
  name: string;
  externalRef?: string;
  config?: Record<string, unknown>;
  children?: AssetNode[];
}

export interface RowChunk {
  externalRecordId: string;
  /** Text sent to PII classifier (never log raw in application logs) */
  texts: string[];
  metadata?: Record<string, unknown>;
}

export interface SubjectKey {
  email?: string;
  phone?: string;
  externalId?: string;
}

export interface SubjectMatch {
  provider: string;
  externalRecordId: string;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface RecordRef {
  provider: string;
  externalRecordId: string;
}

export interface DeletionResult {
  ok: boolean;
  dryRun: boolean;
  message?: string;
}

export interface VerificationResult {
  exists: boolean;
  message?: string;
}

export interface DataConnectorV2 {
  readonly provider: string;
  /** Whether this adapter is production-ready for the given capability */
  readonly capabilities: {
    introspect: boolean;
    sampleRows: boolean;
    searchSubject: boolean;
    deleteRecord: boolean;
    verifyDeletion: boolean;
  };

  introspect(ctx: ConnContext): Promise<AssetNode>;

  sampleRows(ctx: ConnContext, tableExternalRef: string, opts?: SampleOpts): AsyncIterable<RowChunk>;

  searchSubject(ctx: ConnContext, subject: SubjectKey): Promise<SubjectMatch[]>;

  deleteRecord(ctx: ConnContext, ref: RecordRef, mode: "delete" | "anonymize"): Promise<DeletionResult>;

  verifyDeletion(ctx: ConnContext, ref: RecordRef): Promise<VerificationResult>;
}
