# GTM: Custodia Data Inventory

**Positioning (for / against):**  
**For** mid-market privacy + web teams who need **evidence-grade** data maps and **automated** DSAR deletion without buying a second enterprise GRC suite.  
**Unlike** legacy discovery suites, **Custodia** ships **open-weight PII classification** (Privacy Filter) in-cluster and **one deletion engine** for retention + DSAR with **hash-chained receipts**.

## Launch phases

| Phase | Audience | Goal |
|-------|-----------|------|
| **Private beta** | 5 design partners (privacy lead + data eng) | Validate connector depth + receipt audit narrative |
| **GA v1** | Growth plan customers + outbound | SaaS connectors + PII scan + DSAR deletion path |
| **GA v2** | Sales-led + cloud partners | Warehouse adapters + column-level scans |

## Channels

- **Product Hunt** — “Data inventory that actually deletes” angle.  
- **Privacy Engineering Slack / communities** — technical teardown post + sample receipt export.  
- **Nango / integration marketplaces** — co-marketing with OAuth connector story.  
- **SEO** — long-tail: “GDPR Article 30 template”, “DSAR deletion Salesforce”, “retention policy automation mid-market”.

## Pricing (hypothesis)

- **Bundled** with Growth+ as included “Inventory Lite” (1 connector class, capped scans).  
- **Add-on** for Business: per-asset + per-million-tokens-scanned meter (warehouse phase).

## Success metrics (90 days post GA v1)

- 10+ orgs with ≥1 successful **dry-run** deletion receipt chain.  
- 3+ **live** deletion runs with zero critical incidents.  
- Pipeline: 20 qualified demos from privacy-led outbound.

## Assets to produce

- One-pager PDF (problem → receipt screenshot → integrations).  
- 3-minute Loom: connect HubSpot → scan → findings → DSAR dry-run.  
- Security FAQ: data residency, HMAC secret rotation, model limitations (English bias).
