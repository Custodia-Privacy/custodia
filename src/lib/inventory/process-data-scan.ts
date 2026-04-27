import type { PrismaClient } from "@prisma/client";
import type { AssetNode } from "@/lib/connectors-v2/types";
import { getConnectorV2 } from "@/lib/connectors-v2";
import { persistAssetTree } from "@/lib/inventory/persist-asset-tree";
import { aggregateLabelsFromClassify, classifyTexts } from "@/lib/pii-client";

function collectTables(node: AssetNode, out: { ref: string; provider: string; name: string }[]) {
  if (node.kind === "table") {
    out.push({
      ref: node.externalRef ?? node.name,
      provider: node.provider,
      name: node.name,
    });
  }
  for (const c of node.children ?? []) {
    collectTables(c, out);
  }
}

/**
 * Full inventory scan: introspect → persist asset tree → sample → PII classify → findings.
 */
export async function processDataScanJob(
  db: PrismaClient,
  params: { scanRunId: string; orgId: string; integrationId: string; provider: string },
): Promise<void> {
  const { scanRunId, orgId, integrationId, provider } = params;

  const integ = await db.integration.findFirst({
    where: { id: integrationId, orgId },
  });
  if (!integ?.nangoConnectionId) {
    throw new Error("Integration is not connected (missing Nango connection id)");
  }

  await db.inventoryScanRun.update({
    where: { id: scanRunId },
    data: { status: "running", startedAt: new Date() },
  });

  try {
    const connector = getConnectorV2(provider);
    const ctx = { connectionId: integ.nangoConnectionId, orgId };
    const tree = await connector.introspect(ctx);
    const refToId = await persistAssetTree(db, orgId, integrationId, tree);

    const tables = [] as { ref: string; provider: string; name: string }[];
    collectTables(tree, tables);

    const findingsBatch: {
      orgId: string;
      scanRunId: string;
      assetId: string;
      label: string;
      avgScore: number;
      hitCount: number;
      evidence: object;
    }[] = [];

    for (const t of tables) {
      const tableAssetId = refToId.get(`table:${t.provider}:${t.name}`);
      if (!tableAssetId) continue;

      const texts: string[] = [];
      try {
        for await (const chunk of connector.sampleRows(ctx, t.ref, { maxRecords: 120 })) {
          for (const tx of chunk.texts) {
            if (tx.length > 0) texts.push(tx.slice(0, 8000));
          }
        }
      } catch {
        // sampling optional for scaffolds
      }

      if (texts.length === 0) continue;

      const batchSize = 6;
      const globalAgg = new Map<string, { hits: number; scoreSum: number }>();
      for (let i = 0; i < texts.length; i += batchSize) {
        const slice = texts.slice(i, i + batchSize);
        let items: { spans: { label: string; score: number; start: number; end: number }[] }[] = [];
        try {
          items = await classifyTexts(slice, "balanced");
        } catch {
          items = slice.map(() => ({ spans: [] }));
        }
        const part = aggregateLabelsFromClassify(items);
        for (const [label, v] of part) {
          const cur = globalAgg.get(label) ?? { hits: 0, scoreSum: 0 };
          cur.hits += v.hits;
          cur.scoreSum += v.scoreSum;
          globalAgg.set(label, cur);
        }
      }

      for (const [label, v] of globalAgg) {
        if (v.hits === 0) continue;
        findingsBatch.push({
          orgId,
          scanRunId,
          assetId: tableAssetId,
          label,
          avgScore: v.scoreSum / v.hits,
          hitCount: v.hits,
          evidence: { table: t.name, provider: t.provider },
        });
      }
    }

    if (findingsBatch.length > 0) {
      await db.piiFinding.createMany({ data: findingsBatch });
    }

    await db.inventoryScanRun.update({
      where: { id: scanRunId },
      data: {
        status: "completed",
        completedAt: new Date(),
        summary: {
          tables: tables.length,
          findings: findingsBatch.length,
        } as object,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.inventoryScanRun.update({
      where: { id: scanRunId },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: msg,
      },
    });
    throw e;
  }
}
