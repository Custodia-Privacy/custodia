# GDPR vs CCPA: Key Differences Every Business Needs to Know

*GDPR and CCPA both protect consumer privacy — but they work differently. If you have EU visitors and California customers, you need to understand both. Here's a clear comparison of what each law requires and where they overlap.*

---

## Who Each Law Applies To

The scope of each law differs significantly — and understanding whether you're covered is the first step.

**GDPR** applies to any organization that processes personal data of EU or EEA residents, regardless of where the business is located. You don't need an office in Europe. If your website is accessible to EU residents and you collect any personal data — email addresses, IP addresses, behavioral analytics — GDPR applies to you.

**CCPA/CPRA** applies narrowly to for-profit businesses that meet at least one of these thresholds:

- Annual gross revenue of $25 million or more
- Buy, sell, receive, or share the personal information of 100,000 or more consumers or households annually
- Derive 50% or more of annual revenue from selling or sharing consumers' personal information

The 100,000 consumer threshold catches more SaaS companies than founders realize. Web analytics counts. If you run Google Analytics on a site that gets modest traffic, you may cross 100,000 consumers processed in a year without any active data sales. Check your numbers before assuming CCPA doesn't apply.

---

## Opt-In vs Opt-Out: The Core Difference

This is the most operationally significant difference between the two laws, and it drives most of the implementation divergence.

**GDPR requires opt-in.** Before you process personal data for marketing or non-essential tracking, you need explicit, active consent from the user. A cookie banner that says "by continuing to browse, you agree" is not valid consent. Users must affirmatively agree before any non-essential cookies or trackers fire.

**CCPA operates on an opt-out model.** You can process data unless the user says no. However, California residents have the right to opt out of the "sale" or "sharing" of their personal data at any time. The CPRA expanded the definition of "sharing" to include sharing for cross-context behavioral advertising — even if no money changes hands.

The practical implication: if you have EU visitors, your consent banner must default to opt-in (block non-essential scripts until consent is granted). That same opt-in mechanism satisfies CCPA too, since it goes beyond what CCPA requires. Building for GDPR typically covers California.

---

## Side-by-Side Comparison Table

| | **GDPR** | **CCPA/CPRA** |
|---|---|---|
| **Applies to** | EU/EEA residents globally | California residents (qualifying businesses) |
| **Consent model** | Opt-in | Opt-out |
| **Right to access** | Yes | Yes |
| **Right to delete** | Yes (right to erasure) | Yes |
| **Right to portability** | Yes | Yes |
| **Opt-out of sale/sharing** | N/A (opt-in by default) | Yes (right to opt out of sale/sharing) |
| **Response time for requests** | 30 days | 45 days |
| **Fines for violations** | Up to €20M or 4% of global annual revenue | Up to $7,500 per intentional violation |
| **Enforced by** | Supervisory authorities (Data Protection Authorities) | California AG + California Privacy Protection Agency |

---

## Where They Overlap

Despite the implementation differences, GDPR and CCPA share a common foundation of individual rights. Both laws give consumers:

- The right to know what personal data is being collected about them
- The right to delete their personal data
- The right to data portability — receiving their data in a usable format
- The right to non-discrimination for exercising their privacy rights (businesses cannot penalize you for opting out or making a request)

This overlap matters for compliance planning. If you build one solid privacy compliance program — proper consent management, a functioning DSAR workflow, a comprehensive privacy policy — most of it covers obligations under both laws. You're not building two separate programs; you're building one that satisfies the stricter standard.

---

## What CCPA Added in 2023 (CPRA)

The California Privacy Rights Act, effective January 2023, meaningfully upgraded CCPA. Businesses that thought they were CCPA-compliant in 2022 may have gaps.

**New sensitive personal information category.** CPRA created a new class of "sensitive personal information" — including social security numbers, financial account details, health data, precise geolocation, racial or ethnic origin, religious beliefs, and union membership — with special handling rules and the right to limit use.

**Right to correct inaccurate data.** California residents can now request correction of inaccurate personal information, not just deletion. Businesses need a workflow to handle correction requests, not just deletion.

**Right to opt out of automated decision-making.** Consumers can opt out of automated decision-making that significantly affects them, including profiling.

**Stronger enforcement.** The California Privacy Protection Agency took over enforcement, operating independently from the AG's office. The CPPA has rulemaking authority and investigative powers.

**Data minimization.** CPRA introduced a data minimization principle explicitly into California law — businesses can only collect personal information that is reasonably necessary for the disclosed purposes.

---

## Practical Implications for Your Business

If you have both EU visitors and California customers, here's the prioritized checklist:

1. **Your consent banner must default to opt-in.** GDPR wins on consent — it's the stricter standard. An opt-in banner satisfies both laws simultaneously.
2. **Honor deletion requests from both populations.** Your DSAR workflow needs to handle both the 30-day GDPR deadline and the 45-day CCPA deadline. Build for 30 days.
3. **Your privacy policy must cover both sets of rights.** GDPR rights (access, erasure, portability, restriction, objection) and CCPA/CPRA rights (know, delete, correct, portability, opt-out of sale/sharing, limit sensitive data use) need to be disclosed.
4. **You need a DSAR intake process.** One form or email address, a designated owner, and a deadline tracker. Handle requests from both EU and California residents through the same workflow.
5. **Don't sell or share California data without an opt-out mechanism.** If you run targeted advertising or share data with analytics platforms for behavioral advertising purposes, you're likely "sharing" under CPRA. Provide a "Do Not Sell or Share My Personal Information" link.

In practice, building for GDPR typically satisfies CCPA too — GDPR is the stricter standard on consent, response timelines, and overall governance.

---

## Common Mistakes When Trying to Comply With Both

**Maintaining separate privacy policies for EU and US users.** Some companies try to carve out a "California Privacy Notice" and an "EU Privacy Notice" as entirely separate documents. This creates maintenance complexity without much benefit. A single comprehensive policy that covers all required disclosures under both laws is cleaner and easier to keep current.

**Missing the CPRA's sensitive data categories.** CCPA compliance work from 2020–2022 didn't account for the CPRA sensitive personal information category. If you handle geolocation data, health information, or financial account data, review whether you've addressed the CPRA's special handling requirements.

**Treating "sharing for advertising" as not a "sale."** CPRA explicitly expanded coverage to include sharing personal data for cross-context behavioral advertising — even without compensation. If your site loads ad pixels or shares data with advertising networks, that's sharing under CPRA. The opt-out mechanism is required.

**Ignoring that the 100K threshold counts consumers, not customers.** CCPA/CPRA thresholds are based on consumers — including website visitors — not just paying customers. A B2B SaaS company with 500 customers can still cross the 100K consumer threshold through website traffic alone if they're tracking visitors with analytics.

---

## Start With a Scan

The fastest way to understand your compliance posture is to see exactly what your website is collecting, what's firing before consent, and where your gaps are.

Custodia's compliance dashboard shows your status against both GDPR and CCPA requirements — so you don't have to track them separately.

**[Run a free scan at app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan)**

See every tracker, cookie, and third-party script on your site — with and without consent — in 60 seconds.

---

*Last updated: March 2026*
