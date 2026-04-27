# Custodia Data Inventory — Buyer Research Pack

**Date:** 2026-04-26  
**Status:** Phase 0 deliverable (includes interview kit + synthesized ranking)

---

## 1. Research objectives

- Validate **jobs-to-be-done**: ROPA maintenance, DSAR deletion proof, retention operationalization.  
- Rank **connectors** for build order.  
- Capture **pricing intent** signals (placeholder until live interviews complete).

---

## 2. Interview kit (5 calls — script)

**Target roles:** Head of Privacy / DPO, Security Engineer supporting privacy, Data Engineer owning warehouses, IT Manager for SaaS stack.

### Opening (5 min)

- “Walk me through the last time you answered **where is customer X’s data**?”  
- “What tools or spreadsheets did you use?”

### Core (20 min)

1. Systems of record for customer PII today (CRM, support, billing, warehouse, files).  
2. DSAR deletion: manual vs automated; what proof did legal ask for?  
3. Retention: who owns rules; how are they enforced today?  
4. Blockers to adopting a new inventory product (price, trust, IT review, SOC2).  
5. **Willingness to pay** bracket: \<$500/mo, $500–2k, $2k–10k, \>$10k (non-binding).

### Close (5 min)

- Rank top **3 connectors** we must support first.  
- Referral to colleague for second interview.

### Consent

- Note-taking, anonymized synthesis, optional recording policy per company rules.

---

## 3. Ranked connector wishlist (synthesized default)

Pending real interviews, use this **hypothesis ranking** for engineering prioritization:

| Rank | System | Rationale |
|------|--------|-----------|
| 1 | **Salesforce** | Ubiquitous CRM; DSAR deletion high frequency. |
| 2 | **HubSpot** | Mid-market density; marketing + CRM PII. |
| 3 | **Shopify** | E-commerce PII; merchant workflows. |
| 4 | **Zendesk / Intercom** | Support ticket content = rich PII. |
| 5 | **Stripe** | Billing identifiers; regulated narratives. |
| 6 | **Postgres** (managed) | System of record for product DB; warehouse path starts here. |
| 7 | **Snowflake** | Analytics consolidation. |
| 8 | **BigQuery** | GCP-native analytics. |
| 9 | **S3** | Attachment / export sprawl. |
| 10 | **Google Workspace / M365** | Email + drive (later phase; heavy auth scope). |

---

## 4. Pricing-intent hypothesis (to validate)

| Segment | Motion | Hypothesis ARPU add-on for Inventory |
|---------|--------|--------------------------------------|
| **Starter** | Self-serve | Bundled cap: 1 scan run / week, 1 connector class |
| **Growth** | Inside sales | +$200–500/mo for multi-connector + receipts |
| **Business** | Sales-led | +$1–3k/mo for warehouse connectors + SLA |

**Signals to capture in interviews:** budget holder vs influencer; need for **on-prem** PII engine; requirement for **DPAs** with subprocessors.

---

## 5. Interview log template

| # | Date | Role | Company size | Top 3 connectors | Price bracket | Notes |
|---|------|------|----------------|------------------|---------------|-------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |

---

## 6. Decisions for product/engineering (from research pack)

- **V1 build order:** Salesforce → HubSpot → Shopify (matches existing Custodia integrations).  
- **V2 priority:** Postgres before Snowflake/BigQuery (lower integration friction in mid-market).  
- **V3 priority:** S3 before SMB file shares (clear data gravity).  
- **Approval:** default **two-step** deletion (dry-run then execute) for all orgs; optional stricter **dual control** later (second admin approver).
