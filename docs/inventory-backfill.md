# Backfill: `DataStore` → `DataAsset`

Legacy governance rows live in `data_stores`. New inventory rows use `data_assets` with optional `legacy_data_store_id`.

## Recommended approach

1. After migrations are applied, for each `DataStore` without `inventoryMirror`:
   - Create a root `DataAsset` of kind `source` with `provider = data_store.provider ?? "unknown"`, `name = data_store.name`, `legacyDataStoreId = data_store.id`, `integrationId = null`.
2. Do **not** auto-link to `Integration` unless `connection_config` explicitly maps a provider id.

## SQL sketch (review before running)

```sql
-- Example only — adjust org filter and run in a transaction after backup.
INSERT INTO data_assets (
  id, org_id, parent_id, kind, provider, name, external_ref, config,
  legacy_data_store_id, integration_id, status, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  ds.org_id,
  NULL,
  'source'::"DataAssetKind",
  COALESCE(ds.provider, 'legacy'),
  ds.name,
  'legacy:data_store:' || ds.id::text,
  '{}'::jsonb,
  ds.id,
  NULL,
  'active'::"DataAssetStatus",
  NOW(),
  NOW()
FROM data_stores ds
WHERE NOT EXISTS (
  SELECT 1 FROM data_assets da WHERE da.legacy_data_store_id = ds.id
);
```

Run via a one-off `tsx` script or Prisma `$executeRaw` in a controlled migration job.
