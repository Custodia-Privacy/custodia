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

export function createScaffoldAdapter(
  provider: string,
  reason = "Connector not yet implemented",
): DataConnectorV2 {
  const emptyTree = (): AssetNode => ({
    kind: "source",
    provider,
    name: provider,
    externalRef: `${provider}:unimplemented`,
    config: { supported: false, reason },
    children: [],
  });

  return {
    provider,
    capabilities: {
      introspect: false,
      sampleRows: false,
      searchSubject: false,
      deleteRecord: false,
      verifyDeletion: false,
    },
    async introspect(_ctx: ConnContext) {
      return emptyTree();
    },
    async *sampleRows(_ctx: ConnContext, _tableExternalRef: string, _opts?: SampleOpts): AsyncIterable<RowChunk> {
      // no-op
    },
    async searchSubject(_ctx: ConnContext, _subject: SubjectKey): Promise<SubjectMatch[]> {
      return [];
    },
    async deleteRecord(_ctx: ConnContext, _ref: RecordRef, _mode: "delete" | "anonymize"): Promise<DeletionResult> {
      return { ok: false, dryRun: true, message: reason };
    },
    async verifyDeletion(_ctx: ConnContext, _ref: RecordRef): Promise<VerificationResult> {
      return { exists: false, message: reason };
    },
  };
}
