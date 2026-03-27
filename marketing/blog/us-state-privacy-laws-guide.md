# US State Privacy Laws: What Small Businesses Need to Know in 2026

*GDPR and CCPA were just the beginning. Here's how to navigate 15+ state privacy laws without building 15 separate compliance programs.*

---

## The Patchwork Problem

If you've already wrapped your head around GDPR and CCPA, congratulations — you're ahead of most small businesses. But there's a new challenge: since Virginia passed the Consumer Data Protection Act in 2021, a wave of state privacy legislation has swept the US. By 2026, over 15 states have enacted comprehensive consumer privacy laws, with more working their way through legislatures.

**Why so many laws?** The US has no federal privacy law. Congress has repeatedly failed to pass comprehensive privacy legislation, leaving states to act on their own. Consumers and advocacy groups pushed hard after high-profile data scandals, and once Virginia showed it was politically viable to pass a strong privacy law, other states followed quickly.

**The good news: there's a pattern.** These laws didn't emerge from nothing — nearly all of them drew from one of two blueprints. Once you understand the two models, the patchwork becomes much more manageable.

---

## The Two Main Models: CCPA-Style vs. CDPA-Style

### The CCPA Model (California-Style)

California's CCPA (now strengthened by CPRA) is the original and most ambitious US privacy law. Its key characteristics:

- **Opt-out for data selling and sharing** — Consumers must be given a clear way to opt out of the sale or sharing of their personal data, including for targeted advertising. You don't need consent before collecting.
- **Revenue-based threshold** — Applies to businesses with $25M+ in annual revenue, OR 100,000+ consumers' data processed, OR 50%+ of revenue from selling data.
- **Broad sensitive data categories** — Precise geolocation, health data, financial data, race, sexual orientation, and more get extra protections.
- **Dedicated enforcement agency** — The California Privacy Protection Agency (CPPA) actively audits and fines.
- **No private right of action** for most violations (except data breaches).

### The CDPA Model (Virginia-Style)

Virginia's Consumer Data Protection Act became the template most other states followed. It's somewhat narrower than CCPA but covers the same core principles:

- **Opt-in for sensitive data** — Unlike CCPA, CDPA-model laws typically require affirmative opt-in consent before processing sensitive personal data (health, biometric, children's data, etc.). Everything else is opt-out.
- **Consumer-count threshold** — Most CDPA-model laws apply when you process data of 100,000+ state residents per year, or 25,000+ residents if 50%+ of revenue comes from selling data. No standalone revenue threshold.
- **Controller/processor framework** — Mirrors GDPR's language around who controls data vs. who processes it on your behalf.
- **Attorney general enforcement** — Most CDPA-model states rely on the state AG to enforce, without a dedicated privacy agency.
- **Cure periods** — Many give businesses 30–60 days to fix violations before formal enforcement action.

**The practical difference:** Under CCPA, a business could technically process most personal data without consent as long as it offers an opt-out. Under the CDPA model, processing sensitive data requires opt-in — a materially higher bar.

---

## State-by-State Reference Table

| State | Law | Effective Date | Model | Consumer Threshold | Opt-In for Sensitive Data |
|-------|-----|---------------|-------|-------------------|--------------------------|
| Virginia | VCDPA | Jan 2023 | CDPA | 100k consumers OR 25k + 50% revenue from data | Yes |
| Colorado | CPA | Jul 2023 | CDPA | 100k consumers OR 25k + 50% revenue from data | Yes |
| Connecticut | CTDPA | Jul 2023 | CDPA | 100k consumers OR 25k + 25% revenue from data | Yes |
| Utah | UCPA | Dec 2023 | CCPA-lite | 100k consumers OR $25M revenue + 50% revenue from data | No (opt-out only) |
| Texas | TDPSA | Jul 2024 | CDPA | No threshold — applies to all businesses not exempted | Yes |
| Florida | FDBR | Jul 2024 | CDPA | $1B+ revenue OR specific data volume (large biz only) | Yes |
| Montana | MCDPA | Oct 2024 | CDPA | 50k consumers OR 25k + 25% revenue from data | Yes |
| Oregon | OCPA | Jul 2024 | CDPA | 100k consumers OR 25k + 25% revenue from data | Yes |
| New Hampshire | NHPA | Jan 2025 | CDPA | 35k consumers OR 10k + 25% revenue from data | Yes |
| New Jersey | NJDPA | Jan 2025 | CDPA | 100k consumers OR 25k + 50% revenue from data | Yes |
| Nebraska | NDPA | Jan 2025 | CDPA | 100k consumers OR 25k + 50% revenue from data | Yes |
| Iowa | ICDPA | Jan 2025 | CDPA-lite | 100k consumers OR 25k + 50% revenue from data | No (opt-out only) |
| Delaware | DPDPA | Jan 2025 | CDPA | 35k consumers OR 10k + 20% revenue from data | Yes |
| Indiana | ICDPA | Jan 2026 | CDPA | 100k consumers OR 25k + 50% revenue from data | Yes |
| Tennessee | TIPA | Jul 2026 | CDPA | 100k consumers OR 25k + 50% revenue from data | Yes |

*Note: Florida's FDBR applies primarily to very large businesses ($1B+ revenue). Most small businesses are not subject to it.*

---

## Do I Need to Comply? The Practical Threshold Guide

Here's the honest answer: most small businesses are not technically subject to most of these laws — yet. But "yet" is doing a lot of work in that sentence.

**The standard threshold pattern** across the majority of CDPA-model states is:

- **100,000 consumers** processed per year, OR
- **25,000 consumers** processed per year AND 50%+ of revenue from selling personal data

The key word is "consumers," which means state residents — not just customers. **Website visitors count.** If your site uses Google Analytics, Meta Pixel, or any advertising technology, every tracked visitor to your site is being "processed." A business with 10,000 monthly visitors from a covered state crosses the 100,000-consumer threshold in less than a year.

**Texas is the exception that matters.** The TDPSA has no consumer volume threshold — it applies to any business that conducts business in Texas or targets Texas residents with products or services, unless you fall under a specific exemption (small businesses as defined by the Texas Business & Commerce Code are exempt, but verify this carefully).

**Practical rule of thumb:** If you have meaningful US web traffic and use any third-party advertising or analytics tools, assume multiple state laws apply to you. The compliance cost of building a reasonable privacy program is far lower than the cost of a single enforcement action.

---

## The Good News: What All These Laws Have in Common

The patchwork looks intimidating from the outside, but the core requirements are remarkably consistent across states. Get these fundamentals right, and you've satisfied the majority of obligations in every covered jurisdiction:

**Consumer rights you must support:**
- Right to know — what data you collect and why
- Right to access — a copy of their personal data
- Right to delete — erasure of their data on request
- Right to correct — fixing inaccurate data
- Right to portability — receiving data in a usable format
- Right to opt out — of targeted advertising, data sales, and certain profiling

**Privacy notice requirements:** Every state requires a clear, accessible privacy notice disclosing what you collect, why, how long you keep it, who you share it with, and how consumers can exercise their rights.

**Opt-out mechanisms:** All laws require a way for consumers to opt out of targeted advertising and data sales. Most now also recognize or require honoring of the Global Privacy Control (GPC) browser signal — meaning if a visitor's browser sends a GPC signal, you must treat it as an opt-out automatically.

**DSAR handling:** Data Subject Access Requests must be fulfilled within 45 days in most states (some allow a 45-day extension). You need an intake process, identity verification, and a way to search and retrieve data across all your systems.

**Data minimization:** Collect only what you need, retain it only as long as necessary. This principle appears in every major state law.

---

## What's Different State to State

Getting the core framework right covers 80% of your obligations. The remaining 20% is where state-specific details matter:

**Sensitive data definitions vary.** Most states agree on health data, biometrics, precise geolocation, children's data, and financial data as sensitive. But some states add additional categories — Oregon includes union membership and immigration status; Connecticut adds mental health data explicitly. Review the sensitive data definition in each state where you have meaningful consumer exposure.

**Children's data rules are getting stricter.** Several newer laws layer on additional protections for minors beyond the federal COPPA standard. Some require opt-in for all data processing of consumers under 18, not just under 13. If any portion of your audience is or could be minors, this requires specific attention.

**Enforcement agency and teeth differ significantly.** California has a dedicated agency (the CPPA) that actively investigates and has issued significant fines. Most other states rely on the state attorney general, which typically means enforcement is complaint-driven rather than proactive. Texas and Colorado have shown early willingness to investigate. The practical risk profile varies — but all these laws have penalties ranging from $7,500 to $20,000 per violation, and "per violation" can mean per consumer per incident.

**Cure periods are shrinking.** Many early CDPA-model laws gave businesses 30–60 days to fix violations after receiving notice. Several newer laws have eliminated the cure period entirely or made it discretionary. Do not build your compliance strategy around assuming you'll get a warning first.

---

## Don't Build 15 Separate Compliance Programs

This is the mistake most businesses make when they first confront the state law patchwork: they treat each law as a separate compliance project. That path leads to an unmaintainable mess and an enormous ongoing cost.

**The right approach is a layered compliance model:**

**Layer 1 — Build a solid foundation.** Implement the core framework that satisfies all laws: data mapping, consumer rights processes, privacy notice, opt-out mechanism, DSAR handling, and GPC signal recognition. Do this once, do it well. This single foundation covers the majority of your obligations in every state.

**Layer 2 — Add jurisdiction-specific adjustments.** On top of the foundation, layer the state-specific requirements: opt-in consent flows for sensitive data (for CDPA-model states), state-specific disclosures in your privacy notice, and any additional consumer rights unique to a jurisdiction.

**Layer 3 — Monitor and adapt.** Laws change. States pass new laws. Enforcement guidance evolves. Build a quarterly review cadence and use tools that update automatically when regulations shift.

**The practical implication for your tech stack:** Your consent management platform needs to be jurisdiction-aware — showing the right consent flow to the right visitor based on their location. Your privacy policy needs to cover multi-state requirements in a single coherent document. Your DSAR process needs to apply consistent handling regardless of which state the consumer is in.

---

## How Custodia Handles Multi-State Compliance

Custodia was built for exactly this challenge — privacy compliance for small businesses navigating a fragmented regulatory landscape without enterprise-sized legal teams.

**Jurisdiction-aware consent management:** Custodia detects where each visitor is located and presents the appropriate consent experience. California visitors see a CCPA opt-out flow. Visitors from CDPA-model states see an opt-in flow for sensitive data processing. EU visitors see a GDPR consent banner. GPC browser signals are automatically honored across all jurisdictions — no configuration required.

**Multi-state privacy policy generation:** Custodia's AI-generated privacy policy is built from your actual data practices and covers the disclosure requirements for every major US state law in a single readable document. It updates automatically when your data practices change or when regulations are updated.

**DSAR management across all jurisdictions:** One intake form, one workflow, consistent response timelines. Custodia tracks the applicable deadline based on the consumer's jurisdiction (45 days for most US states, 30 days for GDPR) and surfaces the relevant data across connected systems so no request falls through the cracks.

**Continuous compliance monitoring:** Weekly re-scans catch new trackers, changed data practices, or broken consent flows before they create violations. As new state laws take effect, Custodia updates its compliance checks automatically.

**Plans start at $29/month.** Most businesses complete their initial compliance setup the same day.

**[Scan your website free →](https://app.custodia-privacy.com)**

No signup required. See exactly what personal information your website is collecting, which state laws apply to your business, and what you need to fix — in 60 seconds.

---

*Last updated: March 2026*
