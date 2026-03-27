# GDPR Data Retention: How Long Can You Keep Personal Data?

Storage limitation is one of GDPR's core principles — and one of its most commonly violated. Most businesses collect personal data, then simply never delete it. Customer records from five years ago, lead lists from a campaign that ran once in 2019, employee files from people who left the company years ago. It all accumulates, and nobody ever asks the question that GDPR demands you ask: do we still need this?

This guide covers what GDPR's storage limitation principle actually requires, how to set GDPR data retention periods by data category, and how to enforce them in practice — including the technical implementation most businesses skip.

---

## The Storage Limitation Principle: Article 5(1)(e)

GDPR Article 5(1)(e) states that personal data must be:

> "kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which the personal data are processed."

This is the **storage limitation principle** — one of seven core data protection principles. It sits alongside lawfulness, fairness, transparency, purpose limitation, data minimisation, accuracy, integrity, and confidentiality. Violating any of them is a GDPR violation, not a technicality.

The same Article allows two exceptions:

- Data stored **solely for archiving in the public interest**, scientific or historical research, or statistical purposes — provided appropriate safeguards are in place
- Data retained for **legal or regulatory obligations**

For most businesses, neither exception applies to the bulk of their data. What applies is the core rule: delete it when you no longer need it.

The UK GDPR contains identical language, so post-Brexit UK businesses face the same obligations.

---

## What "No Longer Than Necessary" Actually Means

The phrase is deliberately vague, because necessity depends on purpose. This is where the connection to **purpose limitation** becomes critical.

Under GDPR, you must collect personal data for a specific, explicit, and legitimate purpose. Once that purpose is fulfilled — or no longer applies — the legal basis for keeping the data disappears. Continuing to hold it is holding it without a lawful basis, which is itself a violation.

In practice, "no longer than necessary" means you need to:

1. Know what purpose each category of data serves
2. Define when that purpose ends (a customer relationship ends, a lead goes cold, an employee leaves)
3. Set a retention period tied to that end point — not an arbitrary number, but one you can justify
4. Actually delete or anonymise the data when the period expires

The key word is "justify." Supervisory authorities expect you to be able to articulate why you chose a specific retention period. "We've always kept it" is not a justification. "We're required to retain financial records for seven years under the Companies Act" is.

---

## GDPR Data Retention Periods by Data Category

There is no single GDPR data retention schedule. Different categories of data have different justifications for different periods. Here is a practical guide by category:

### Customer Records

**Typical retention:** Duration of the contract + legal obligation period (usually 6–7 years)

Customer personal data — names, email addresses, purchase history, correspondence — may be retained for the duration of the commercial relationship. Once a customer relationship ends, you need a separate justification to keep the data.

The most common justification is legal obligation: tax law, contract law, and accounting regulations typically require you to retain records related to transactions for **6 years in the UK** (7 in many EU jurisdictions). This covers invoices, payment records, and the associated identifying information.

**Example:** A customer cancels their subscription in March 2026. You can retain their billing records and account information until March 2033 (7 years), then delete. You should delete behavioural data — session recordings, in-app activity — sooner, since there's no legal basis for retaining that after the relationship ends.

### Prospect and Lead Data

**Typical retention:** 12–24 months from last interaction

This is one of the most commonly violated categories. Marketing databases accumulate for years: trade show scans, content download forms, free trial signups who never converted. Every one of those records is personal data under GDPR — and unless the person has recently engaged, the basis for keeping it weakens over time.

Under GDPR's legitimate interests basis (the most common lawful basis for B2B marketing), retention beyond 24 months without re-consent is hard to justify. At that point, the individual has demonstrated, by their absence, that they're not interested.

**Practical rule:** Set leads to auto-expire 12 months after last meaningful interaction. Run a re-engagement campaign at 11 months. If they don't respond, delete.

### Employee Records

**Typical retention:** Varies by jurisdiction; generally 6 years after employment ends (UK)

Employee data covers a wide range: payroll records, performance reviews, disciplinary files, sick leave records, DBS checks, references, and more. Retention requirements vary significantly by jurisdiction and by data category within employment.

In the **UK**, the ICO and ACAS guidance suggests:

- Payroll records: 6 years after employment ends (HMRC requirement)
- Personnel files and training records: 6 years after employment ends
- Disciplinary records: 6 years after employment ends (though sensitive cases may warrant longer)
- Recruitment records (unsuccessful candidates): 6–12 months after the recruitment process ends

In **Germany**, employment records must generally be kept for 10 years due to the statute of limitations on employment claims. In **France**, different rules apply by category.

The key mistake businesses make: they keep everything indefinitely because "HR might need it." GDPR data retention rules apply to employee data as much as to customer data.

### Financial Records

**Typical retention:** 6–7 years (legal requirement in most EU jurisdictions)

This is one area where retention is usually mandated by law, not choice. Tax authorities across the EU require records of financial transactions — invoices, receipts, payroll, VAT records — to be retained for:

- **UK:** 6 years (HMRC)
- **Germany:** 10 years
- **France:** 10 years
- **Ireland:** 6 years
- **Netherlands:** 7 years

These obligations override GDPR's storage limitation principle — this is the "legal obligation" exception in Article 6(1)(c). But the exemption is narrow: it covers the financial records themselves, not all data about the customer or transaction. Behavioural data, support tickets, and marketing preferences from the same customer are not covered by the financial record retention obligation.

### Website Analytics Data

**Typical retention:** Raw data up to 26 months; raw IP data shorter

This is nuanced territory. **Google Analytics 4's default** data retention setting is 14 months for user-level and event-level data. Google sets 26 months as the maximum. Many businesses accept GA4's defaults without realising they're making an active GDPR data retention decision.

IP addresses are personal data under GDPR — they can identify individuals. Raw IP logs should typically be anonymised or deleted within 3–6 months unless there's a specific security or fraud justification. Several EU supervisory authorities (notably Austria's DSB and France's CNIL) have ruled that transfers of IP addresses to Google's US servers via standard Google Analytics violate GDPR, regardless of retention period.

**Practical approach:**

- Enable IP anonymisation in GA4 (anonymize_ip)
- Set data retention to the shortest period that meets your analytical needs
- Consider privacy-respecting alternatives (Plausible, Fathom) that collect no personal data at all
- Delete raw access logs after 90 days unless a specific security purpose requires longer

### CCTV Footage

**Typical retention:** 30 days

Most CCTV footage — in offices, retail premises, warehouses — has no ongoing investigative value after a short period. The ICO (UK) and EDPB guidance consistently points to **30 days** as the standard retention period for routine CCTV footage.

Exceptions exist: if footage captured an incident under investigation, it may be preserved as evidence (legal hold). But the default auto-delete should be 30 days.

### Email Correspondence

**Typical retention:** 1–3 years typically; longer if subject to legal or contractual obligations

Email is tricky because it contains personal data in an unstructured form, and most email systems don't support automated deletion by retention schedule. The practical approach is to set organisational email retention policies:

- **General correspondence:** 2–3 years
- **Contract-related correspondence:** Match the contract retention period (typically 6–7 years)
- **HR correspondence:** Match the employee record retention period

Many businesses simply retain all email forever because it's technically easy to do so. GDPR makes this a compliance problem, not just an information management preference.

---

## Legal Hold: When Litigation Overrides Retention Limits

GDPR data retention periods can be suspended by a **legal hold** — when you have reasonable anticipation of litigation, regulatory investigation, or a legal claim. In those circumstances, deleting data that may be relevant to the dispute creates legal exposure.

Legal hold suspends your normal retention and deletion schedule for the specific data involved. It does not justify retaining unrelated data longer than your policy requires.

Key points:

- Legal holds should be documented — who issued them, what data is covered, why
- Legal holds should be time-limited — they end when the dispute concludes
- They cover specific relevant data, not your entire dataset
- Once lifted, the normal retention clock applies (usually restarting from when the hold was lifted)

Build a legal hold process into your data retention policy so staff know how to pause deletion when notified.

---

## How to Build a GDPR Data Retention Policy

A GDPR data retention policy is a document that specifies, for each category of personal data your organisation holds:

1. **What the data is** — the category and a description
2. **Where it's held** — the system or systems containing it
3. **The retention period** — expressed as a fixed time from a trigger event
4. **The legal basis for the retention period** — the law, regulation, or legitimate interest
5. **The responsible party** — who owns deletion for this category
6. **The deletion method** — how data is deleted (secure deletion, anonymisation, archiving)

The trigger event matters more than the period. "3 years" is meaningless without knowing: 3 years from when? From collection? From last interaction? From contract end? Be specific.

**Example entry:**

| Data Category | System | Retention Period | Trigger | Legal Basis | Responsible Party | Deletion Method |
|---|---|---|---|---|---|---|
| Customer billing records | Stripe, accounting software | 7 years | Contract end date | Legal obligation (VAT Act) | Finance Director | Secure deletion |
| Marketing leads | HubSpot CRM | 24 months | Last email interaction | Legitimate interests | Marketing Manager | Automated workflow + manual review |
| Employee payroll records | Payroll system | 6 years | Employment end date | Legal obligation (HMRC) | HR Manager | Secure deletion |

---

## Technical Implementation: Deletion vs Anonymisation

GDPR data retention doesn't always require outright deletion. **Anonymisation** — removing all identifying information so that individuals can no longer be identified — is an alternative that allows you to retain aggregate data for statistical purposes.

The distinction matters:

- **Deletion** removes the data permanently (or should — see below on backups)
- **Anonymisation** removes the personal elements, leaving statistical or aggregate data that is no longer personal data under GDPR

Anonymisation is only valid if re-identification is not reasonably possible. Pseudonymisation — replacing identifiers with a code that can be reversed — is not anonymisation under GDPR; it's still personal data.

**Automated deletion** is the practical standard for compliance. Manual deletion processes fail because:
- People forget
- Staff change
- Data volumes make manual deletion impractical
- There's no audit trail

Most CRMs, marketing platforms, and databases support automated deletion by date or by trigger. HubSpot, Salesforce, and most modern platforms have retention automation. SQL databases can be scheduled to run deletion scripts. Build the automation; don't rely on manual processes.

**Backups:** Backups are a common blind spot. Your live database might be cleaned of expired records, but backups may still contain them. Your retention policy should address backup retention: how long are backups kept, and how are records purged from backup sets? For most organisations, backups are retained for 30–90 days and then deleted; data deleted from live systems should be purged from backups on the same schedule when backups roll over.

---

## Audit Trails: Records of Deletion

Here's a compliance irony: when you delete personal data, you should create a record of the deletion. Not a record of the data itself — that would defeat the purpose — but a log showing:

- What category of data was deleted
- When it was deleted
- The retention period applied
- Who or what system performed the deletion

This audit trail serves two purposes:

1. It demonstrates to supervisory authorities that you're operating your retention policy in practice, not just on paper
2. It helps you respond to data subject access requests — if someone asks what data you hold, you should be able to confirm that their expired data has been deleted

The deletion log itself is personal data-adjacent but can be kept in anonymised or aggregate form (e.g., "2,341 lead records deleted on 2026-03-01 per 24-month retention policy").

---

## A Practical GDPR Data Retention Checklist

Use this six-step checklist to implement GDPR data retention at your organisation:

**Step 1: Complete a data inventory**
Map every category of personal data you hold, where it's stored, and why you collected it. You cannot set retention periods for data you haven't identified.

**Step 2: Assign retention periods to each category**
Use the categories above as a starting point. For each category, identify the trigger event and the period. Document the legal basis for each period.

**Step 3: Document your retention policy**
Write the policy in a structured table format. Assign ownership for each category. Get sign-off from leadership.

**Step 4: Build deletion automation**
Configure automated deletion in your CRM, email platform, analytics tools, and any other system holding personal data. Test that it works.

**Step 5: Address backups and legacy data**
Audit your backup retention schedule. Identify any legacy systems holding data that predates your policy. Remediate — this often requires a one-time data purge.

**Step 6: Review annually**
Data collection practices change. New tools get added. Business purposes evolve. Review your GDPR data retention policy at least annually, and whenever you introduce a new data processing activity.

---

## See What Personal Data Your Site Is Collecting

You cannot set GDPR data retention periods for data you don't know you're collecting. Most websites collect more personal data than their operators realise — through analytics tools, advertising pixels, session recorders, chat widgets, and third-party scripts.

Custodia scans your website and identifies every tracker, cookie, and data collection point in 60 seconds. You'll see exactly what's running, what data it processes, and what it means for your GDPR compliance — including whether you have a lawful basis and a documented retention period.

[Scan your website free at app.custodia-privacy.com](https://app.custodia-privacy.com/scan) — no signup required, results in 60 seconds.

---

*Last updated: March 27, 2026. This post reflects GDPR and UK GDPR requirements as currently enforced. Privacy law varies by jurisdiction — consult a qualified privacy professional for advice specific to your situation.*
