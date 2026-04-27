# Warehouse adapters (Data Inventory v2)

Scaffold providers are registered in [`src/lib/connectors-v2/index.ts`](../src/lib/connectors-v2/index.ts) and return **unsupported** introspection until implemented.

| Provider   | Phase | Planned capabilities |
|-----------|-------|------------------------|
| `postgres` | v2   | Schema introspection, `TABLESAMPLE`, row text export, `DELETE` with idempotency keys |
| `mysql`    | v2   | Same as Postgres with engine-specific sampling |
| `mssql`    | v2   | T-SQL metadata + batch delete |
| `snowflake` | v2  | Information schema + warehouse role scoping |
| `bigquery` | v2   | Dataset/table discovery + dry-run DML |
| `redshift` | v2   | Spectrum + local tables |
| `databricks` | v2 | Unity Catalog + SQL warehouses |

Implementation checklist per adapter:

1. Read-only credential (separate from mutation role) for discovery.  
2. Sample job budget (rows / bytes) per org plan.  
3. Map Privacy Filter labels to governance categories for reporting.  
4. Pair with PII engine chunking for wide rows.
