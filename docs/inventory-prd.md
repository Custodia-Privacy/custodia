# PRD: Custodia Data Inventory & Automated Governance

**Author:** Custodia Product  
**Status:** Approved (implementation track)  
**Created:** 2026-04-26  
**Last Updated:** 2026-04-26  
**Target Release:** V1 SaaS (Q2 2026), V2 Warehouses (Q3), V3 Object stores (Q4+)

---

## 1. Problem Statement

### The Problem

Privacy and data teams cannot maintain an accurate **record of processing** (Art. 30 GDPR), **CCPA inventory**, or operational minimization without expensive enterprise tools or manual spreadsheets. When data subjects request **deletion**, organizations rarely have a single system that (1) knows where personal data lives, (2) classifies it consistently, and (3) **executes** deletion with audit-grade proof. The cost of not solving this is regulatory exposure, slow DSAR fulfilment, and inability to enforce retention programmatically.

### Current State

Teams use siloed vendor consoles, custom scripts, or legacy GRC platforms that are slow to deploy, weak on **live** connectors, and weak on **automated** fulfilment. Custodia today offers website scanning, lightweight `DataStore` registration, and DSAR **workflow** without cross-system deletion execution or field-level PII evidence.

### Evidence

- DSAR deadlines and breach response windows are shrinking expectations (regulators expect demonstrable control).
- Mid-market companies adopt 10+ SaaS tools + warehouses; manual ROPA cannot keep pace.
- Competitors charge enterprise prices for discovery + automation together.

---

## 2. Goals & Success Metrics

### Primary Goal

Ship a **unified data inventory** with **PII classification** (OpenAI Privacy Filter taxonomy) and a **Deletion Executor** shared by **retention/minimization policies** and **DSAR deletion** requests, with dry-run, approval gates, and hash-chained receipts.

### Success Metrics

| Metric | Current | Target (V1 GA) | Measurement |
|--------|---------|----------------|-------------|
| Time to first connected inventory (SaaS) | N/A | < 30 min guided | In-product funnel |
| DSAR deletion dry-run coverage | 0% | ≥ 90% of connected CRM contacts discoverable | Task completion rate |
| PII scan throughput | N/A | ≥ 1k text chunks/hour/org (baseline HW) | Worker metrics |
| Audit receipt completeness | N/A | 100% of destructive ops | `deletion_receipts` rows |
| NPS from design partners | — | ≥ 30 | Survey |

### Non-Goals (V1)

- Public Hugging Face Inference API for customer payload text (must stay in-cluster).
- Real-time streaming warehouse sync (batch scans only).
- Legal **document** policy automation (existing `Policy` router remains separate).

---

## 3. User Personas & Stories

### Persona A — **Privacy Lead (DPO office)**

- Context: Owns ROPA, DSAR SLAs, regulator responses.  
- Pain: No trusted map of systems → personal data.  
- Goal: Prove where data lives and that deletion ran.

### Persona B — **Data Engineer**

- Context: Operates warehouses and pipelines.  
- Pain: Cannot tag PII at rest without heavy MDM spend.  
- Goal: API-first inventory + sampled PII signals for tagging jobs.

### User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-1 | As a Privacy Lead, I want to connect Salesforce/HubSpot/Shopify and see an asset tree so that I can evidence processing activities. | P0 |
| US-2 | As a Privacy Lead, I want to run a PII scan on sampled record text so that fields are labeled with standard taxonomy. | P0 |
| US-3 | As a Privacy Lead, I want retention rules (e.g. delete after N days) with dry-run so that I can approve safe enforcement. | P0 |
| US-4 | As a Privacy Lead, I want DSAR deletion to enqueue the same executor as retention so that one audit story covers both. | P0 |
| US-5 | As a Data Engineer, I want warehouse connectors (Postgres/Snowflake/BigQuery) in a later phase so that column inventory is automated. | P1 |
| US-6 | As a Security Lead, I want hash-chained deletion receipts so that I can demonstrate integrity to auditors. | P0 |

---

## 4. Functional Requirements

### 4.1 Inventory & assets

**FR-1**: Org-scoped **DataAsset** tree (source → object → field) synced from connectors or migrated from legacy `DataStore`.  
- AC: Given an org with an integration, when introspection runs, then assets persist with stable `externalRef`.

**FR-2**: **InventoryScanRun** records each scan lifecycle (queued → completed/failed) with summary JSON.

### 4.2 PII classification

**FR-3**: PII engine classifies text into Privacy Filter labels: `account_number`, `private_address`, `private_email`, `private_person`, `private_phone`, `private_url`, `private_date`, `secret`.  
- AC: Given sampled text, when classify API is called, then `PiiFinding` rows aggregate scores per field.

**FR-4**: Operating points `balanced | high_recall | high_precision` are selectable per org or per scan.

### 4.3 Policies

**FR-5**: **RetentionPolicy** targets one or more `DataAsset` rows via **InventoryPolicyTarget**; supports enable/disable and rule JSON (e.g. max age days).

**FR-6**: **MinimizationPolicy** describes redaction/minimization intent; execution defers to connector capability matrix (V1: CRM contact field clearing where supported).

### 4.4 Deletion Executor

**FR-7**: All destructive operations create **DeletionTask** rows with unique idempotency keys.

**FR-8**: **DeletionReceipt** append-only chain: each receipt stores `prevHash`, `payloadHash`, HMAC `signature`.

**FR-9**: Default path is **dry-run**; production delete requires explicit approval flag on execution run.

### 4.5 DSAR integration

**FR-10**: For `requestType = deletion`, operator may call **`dsar.startDeletionExecution`** (dry-run or live after approval) which enqueues **Deletion** worker; on success worker sets DSAR `fulfilled` and merges `responsePackage`.

---

## 5. User Experience

### User flow (Privacy Lead)

1. Navigate **Inventory** (sidebar) → see asset tree and last scan.  
2. Click **Run PII scan** → progress → findings table (label, field, confidence).  
3. **Policies** → create retention rule → **Dry run** → review proposed tasks → **Approve** → **Execute**.  
4. **Audit ledger** → download receipt chain.  
5. Open **Data Requests** → deletion DSAR → **Preview deletion** → **Approve & execute** → same receipt stream.

### Key screens

- **Inventory home**: connectors status, CTA scan, asset table.  
- **Asset detail**: children, fields, linked findings, linked policies.  
- **Findings explorer**: filter by label, export CSV (redacted).  
- **Policy builder**: rule type, threshold, targets, schedule (P1 cron).  
- **Enforcement runs**: list `DeletionExecutionRun` with status.  
- **Audit ledger**: receipts with verify chain button.

### States

Empty (no integrations), loading, populated, scan failed, partial connector errors.

---

## 6. Non-Functional Requirements

### Performance

- Dashboard inventory list p95 < 500ms for < 5k assets.  
- PII batch classify p95 < 5s per 32 segments (CPU baseline).

### Security

- Org RBAC: only `owner|admin` may approve live deletion.  
- Secrets: `DELETION_RECEIPT_HMAC_SECRET`, `PII_ENGINE_URL` internal only.  
- No raw PII in logs; sample hashing optional.

### Compliance

- GDPR Art. 30 fields mappable from asset + flow + policy metadata.  
- SOC2-style change audit via receipts + `AuditLog` correlation (future).

### Accessibility

- WCAG AA on new Inventory UI (keyboard, labels).

---

## 7. Technical Considerations

### Dependencies

- `openai/privacy-filter` via **self-hosted** Python inference (transformers / ONNX path).  
- BullMQ queues: `data-scan`, `deletion`.  
- Nango for OAuth token retrieval (existing).

### API / tRPC

- New namespace `inventory.*` (list assets, trigger scan, list findings, policies CRUD, start enforcement, list receipts).  
- `dsar.startDeletionExecution`, `dsar.listDeletionRuns` (optional).

### Data model

See `prisma/schema.prisma` — `DataAsset`, `DataAssetField`, `InventoryScanRun`, `PiiFinding`, `RetentionPolicy`, `MinimizationPolicy`, `InventoryPolicyTarget`, `DeletionExecutionRun`, `DeletionTask`, `DeletionReceipt`.

### Integration points

- `pii-engine` HTTP service on internal Docker network.  
- Workers in `custodia-inventory-worker` container.

---

## 8. Edge Cases & Error Handling

| Scenario | Behavior |
|----------|----------|
| PII engine down | Scan run fails with retry; UI shows actionable error. |
| Connector token revoked | Task `failed` with reason; no partial deletes without idempotency pass. |
| Duplicate deletion request | Idempotency key dedupes second task. |
| Large tenant | Scan budgets (max records / max fields per run). |

---

## 9. Release Plan

### MVP (V1)

- SaaS connectors (Salesforce, HubSpot, Shopify), synthetic introspection, sampling, PII classify, retention dry-run + execute (CRM delete), DSAR deletion path, receipts.

### V2

- Postgres, MySQL, Snowflake, BigQuery, Redshift, Databricks adapters.

### V3

- S3, GCS, Azure Blob, file shares, unstructured extractors.

### Feature flags

- `inventory_enabled` (org plan gate, optional env).

### Rollback

- Disable worker deployment; inventory UI hidden via flag; DSAR manual fulfilment preserved.

---

## 10. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Single vs multi-region PII engine for EU tenants? | Eng + Legal | Open |
| 2 | Customer-managed keys for receipt signing? | Security | Open |
| 3 | Pricing meter: per scan vs per asset? | PM | Open |

---

## Appendix

### Regulatory mapping (summary)

| Regime | Inventory implication |
|--------|-------------------------|
| GDPR Art. 30 | Systems, purposes, categories, recipients → asset + flow + policy metadata |
| CCPA/CPRA | Categories of personal information collected → PiiFinding labels |
| HIPAA | Future: BAA-gated connectors; designated record set tagging |

### References

- [inventory-competitive-matrix.md](./inventory-competitive-matrix.md)  
- [inventory-buyer-research.md](./inventory-buyer-research.md)  
- [OpenAI Privacy Filter model card](https://huggingface.co/openai/privacy-filter)
