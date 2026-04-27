# Custodia Data Inventory — Competitive Teardown & Positioning

**Date:** 2026-04-26  
**Status:** Living document (Phase 0 deliverable)

---

## Positioning matrix

| Dimension | BigID | OneTrust DataDiscovery | Securiti | Transcend | DataGrail | Osano | **Custodia (target)** |
|-----------|-------|------------------------|----------|-------------|-----------|-------|------------------------|
| **ICP focus** | Enterprise | Enterprise + mid | Enterprise | Dev-first / PLG | Mid-market SaaS | SMB consent | **Mid-market privacy + web** |
| **Time to value** | Months | Months | Months | Days–weeks | Weeks | Days | **Days (guided SaaS v1)** |
| **Live connectors depth** | Very deep | Deep | Deep | Strong automation | SaaS DSAR | Light | **Deepening: SaaS → WH → Object** |
| **PII / discovery tech** | Proprietary + ML | Mixed | ML-heavy | Automation graph | Connector sync | Heuristic | **Open weights (Privacy Filter) + receipts** |
| **DSAR execution** | Strong | Strong | Strong | Strong | Core | Workflow | **Unified Deletion Executor** |
| **Price band** | $$$$$ | $$$$$ | $$$$$ | $$$ | $$$ | $ | **$$ (bundled ladder)** |
| **Audit / proof** | Enterprise GRC | Enterprise | Enterprise | Good | Good | Basic | **Hash-chained deletion receipts** |
| **Deploy model** | SaaS / on-prem | SaaS | SaaS | SaaS | SaaS | SaaS | **SaaS + self-host PII sidecar** |

Legend: $ = relative list-price perception (not exact quotes).

---

## Competitor snapshots

### BigID

- **How they solve it:** Deep discovery across data stores, ML classification, policy workflows, strong enterprise sales motion.  
- **Strengths:** Brand, scale, connector breadth, RAG for privacy programs.  
- **Weaknesses:** Cost, implementation time, heavy services.

### OneTrust (Data Discovery / Privacy)

- **How they solve it:** Suite play — privacy, consent, discovery tied to enterprise procurement.  
- **Strengths:** Suite stickiness, auditor recognition.  
- **Weaknesses:** Complexity, not developer-native, long cycles.

### Securiti

- **How they solve it:** Sensitive data intelligence + security-adjacent narrative, multi-cloud.  
- **Strengths:** Technical depth, automation.  
- **Weaknesses:** Enterprise-first pricing and deployment.

### Transcend

- **How they solve it:** Developer-centric privacy infrastructure, automated DSR across integrations.  
- **Strengths:** DX, automation story, modern API.  
- **Weaknesses:** Less “GRC document” breadth than suite vendors; niche positioning.

### DataGrail

- **How they solve it:** DSAR + live integrations for SaaS-heavy companies.  
- **Strengths:** Mid-market fit, integration marketplace narrative.  
- **Weaknesses:** Less emphasis on warehouse-native catalogue in core story.

### Osano

- **How they solve it:** Consent + lightweight compliance for SMB.  
- **Strengths:** Simplicity, price.  
- **Weaknesses:** Not a full data catalogue / warehouse scanner.

---

## Three differentiators (Custodia)

1. **Unified proof layer** — One **Deletion Executor** with **dry-run → approve → execute → verify** and **hash-chained receipts** for both **programmatic retention** and **DSAR deletion**, not a separate “DSAR tool” vs “governance tool.”

2. **Open, inspectable PII core** — **OpenAI Privacy Filter** (Apache-2.0) runs **in the customer deployment boundary** (sidecar), avoiding black-box-only APIs for classification evidence; tunable precision/recall operating points.

3. **Custodia-native journey** — Inventory sits beside **existing website compliance** (scans, banners, policies), so privacy teams get **external-facing** and **internal data** posture in one product without buying a second GRC suite.

---

## Win themes (sales / marketing)

- “**Evidence, not spreadsheets**” for Art. 30 and deletion.  
- “**Same engine** for retention and DSAR — one audit story.”  
- “**Mid-market timeline**, enterprise-grade receipts.”

---

## Risks to message honestly

- V1 connector breadth < incumbents until warehouse phase ships.  
- PII model English-biased; multilingual requires evaluation + optional fine-tune.  
- Automated deletion always needs **human approval** for high-risk tenants (product default).
