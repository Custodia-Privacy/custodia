import type { PrismaClient } from "@prisma/client";
import type { DataAssetKind } from "@prisma/client";
import type { AssetNode } from "@/lib/connectors-v2/types";

function mapKind(k: AssetNode["kind"]): DataAssetKind {
  const allowed: DataAssetKind[] = [
    "source",
    "data_system",
    "database",
    "schema",
    "table",
    "collection",
    "bucket",
    "folder",
    "file",
    "field",
  ];
  if (allowed.includes(k as DataAssetKind)) return k as DataAssetKind;
  return "source";
}

/**
 * Replace prior catalogue rows for this integration, then insert tree + field rows.
 * Returns map of `externalRef` → DataAsset.id for tables (and root nodes).
 */
export async function persistAssetTree(
  db: PrismaClient,
  orgId: string,
  integrationId: string,
  root: AssetNode,
): Promise<Map<string, string>> {
  const refToId = new Map<string, string>();

  await db.dataAsset.deleteMany({
    where: { orgId, integrationId },
  });

  async function insertNode(parentId: string | null, node: AssetNode): Promise<string> {
    const row = await db.dataAsset.create({
      data: {
        orgId,
        parentId,
        kind: mapKind(node.kind),
        provider: node.provider,
        name: node.name,
        externalRef: node.externalRef ?? null,
        config: (node.config ?? {}) as object,
        integrationId,
        status: "active",
      },
    });
    if (node.externalRef) {
      refToId.set(node.externalRef, row.id);
    }
    if (node.kind === "table") {
      refToId.set(`table:${node.provider}:${node.name}`, row.id);
    }

    const childAssets = (node.children ?? []).filter((c) => c.kind !== "field");
    for (const child of childAssets) {
      await insertNode(row.id, child);
    }

    if (node.kind === "table") {
      for (const child of node.children ?? []) {
        if (child.kind === "field") {
          await db.dataAssetField.create({
            data: {
              tableAssetId: row.id,
              name: child.name,
              externalRef: child.externalRef ?? null,
            },
          });
        }
      }
    }

    return row.id;
  }

  await insertNode(null, root);
  return refToId;
}
