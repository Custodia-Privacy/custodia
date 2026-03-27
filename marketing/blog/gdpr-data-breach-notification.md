# GDPR Data Breach Notification: What to Do in the First 72 Hours

*GDPR gives you 72 hours to notify your supervisory authority after discovering a data breach. Here's exactly what to do, what to report, and how to avoid the most common mistakes.*

---

## What Counts as a "Data Breach" Under GDPR?

Under GDPR, a personal data breach is any security incident that results in the accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to personal data.

That definition is broader than most people expect. It's not just hackers. Common examples:

- A hacked or compromised database exposing customer records
- Accidentally emailing one customer's data to another customer
- A lost or stolen laptop containing unencrypted customer files
- A third-party SaaS vendor you use suffers a breach that exposes your users' data
- An employee accidentally deletes records that can't be recovered
- A phishing attack leads to unauthorized account access

If any of those resulted in someone accessing — or potentially accessing — personal data they shouldn't have, you have a breach under GDPR.

---

## The 72-Hour Rule Explained

Article 33 of GDPR requires you to notify your supervisory authority within 72 hours of "becoming aware" of a breach — unless the breach is "unlikely to result in a risk to the rights and freedoms of natural persons."

A few things to understand about how this works in practice:

**The clock starts when you know, not when you're done investigating.** "Becoming aware" means when you have reasonable certainty that a breach has occurred. You don't need a complete picture of what happened. The moment you know something went wrong with personal data, the 72-hour window opens.

**"Unlikely to result in a risk" is a narrow exception.** If an employee accidentally sent a non-sensitive internal document to the wrong internal email address, you might have grounds to skip notification. But most breaches involving external parties or customer data will meet the risk threshold.

**You can file a phased report.** If you can't gather all the required information within 72 hours — because you're still investigating — you can submit an initial "phase 1" notification with what you know, and follow up with additional details as your investigation progresses. Regulators explicitly allow this. A partial report filed on time is far better than a complete report filed late.

---

## Do You Have to Notify Affected Individuals?

Article 33 covers notification to your supervisory authority. Article 34 is separate — it covers whether you must notify the individuals whose data was affected.

The threshold is higher for individual notification. You only have to notify affected individuals if the breach "is likely to result in a high risk to the rights and freedoms of natural persons."

Factors that push a breach toward high risk:

- Financial data was exposed (bank account numbers, payment card data)
- Health or medical data was involved
- Identity documents (passport, national ID) were compromised
- A large volume of records was affected
- The individuals affected are vulnerable (children, patients, at-risk populations)
- The data could enable identity theft or fraud

Factors that lower the risk threshold:

- The exposed data was encrypted and the attacker cannot decrypt it
- The breach was contained quickly and access was limited
- The data exposed was low-sensitivity and not linkable to individuals

If encryption means an attacker obtained the data but can't read it, notification obligations — both to the authority and to individuals — may not apply. Document this reasoning carefully.

---

## The First 72 Hours — Step by Step

### Hour 0–4: Contain the Breach

Your first priority is stopping the damage from getting worse.

- Isolate affected systems — take them offline if necessary
- Change compromised credentials immediately
- Revoke API keys or access tokens that may have been exposed
- Preserve logs — do not delete or modify anything that could serve as evidence
- Alert your security lead, legal counsel, or DPO if you have one

Do not try to fully understand what happened before you contain it. Containment comes first.

### Hour 4–24: Assess What Happened

Once the breach is contained, begin your investigation.

- What data was accessed or exposed? What categories (emails, passwords, financial data, health records)?
- How many individuals are affected, approximately?
- How did the breach occur — what was the attack vector or failure point?
- What time period does the exposure cover?
- Is the breach ongoing, or has it been fully contained?

Document everything in real time. Your investigation notes become your audit trail.

### Hour 24–48: Decide Your Notification Threshold

With your initial assessment in hand, make the notification determination.

- Does this breach meet the "risk to individuals" threshold under Article 33?
- If yes, you must notify your supervisory authority.
- Does it meet the "high risk" threshold under Article 34?
- If yes, you must also notify affected individuals.

If you're uncertain, notify. The cost of an unnecessary notification is minimal. The cost of a missed mandatory notification is not.

### Hour 48–72: File the Report

Submit your notification to the relevant supervisory authority. Most authorities have online notification portals. You'll need specific information (detailed in the next section).

If you're not ready with a complete report, file with what you have and mark it as a preliminary notification with follow-up pending.

### Ongoing: Document Everything

After the notification window, your obligations don't end.

- Continue your investigation and document findings
- Submit follow-up notifications to the supervisory authority as required
- Implement remediation measures
- Update affected individuals if the breach turns out to be higher risk than initially assessed
- Maintain a complete breach record — GDPR requires this even for breaches you determine don't require notification

---

## What to Include in the Supervisory Authority Report

GDPR Article 33(3) specifies exactly what your breach notification must contain:

**Nature of the breach.** What happened? How did it happen? What type of breach is it — confidentiality breach, integrity breach, availability breach?

**Categories and approximate number of data subjects affected.** You don't need an exact count, but you need a reasonable estimate. "Approximately 500 customers" is acceptable.

**Categories and approximate number of records affected.** What types of data — email addresses, passwords, payment data, health information?

**Likely consequences of the breach.** What risks does this create for the affected individuals? Be honest and thorough.

**Measures taken or proposed.** What have you done to contain the breach? What are you doing to prevent recurrence? What support are you offering affected individuals?

**Contact details for your DPO or responsible person.** Who should the authority contact for follow-up?

If you don't have all this information at the time of your initial notification, Article 33(4) explicitly allows you to provide it in phases. State clearly what's missing and when you expect to be able to provide it.

---

## How to Find Your Supervisory Authority

Every EU member state has a designated supervisory authority. For companies with operations in multiple EU countries, the "lead supervisory authority" is typically the authority in the country where your main EU establishment is located.

Key authorities:

- **ICO** (United Kingdom) — ico.org.uk
- **BfDI** (Germany) — bfdi.bund.de
- **CNIL** (France) — cnil.fr
- **DPC** (Ireland) — dataprotection.ie — this is the relevant authority for most US companies with EU users, since many large US tech companies have their EU headquarters in Ireland
- **AEPD** (Spain) — aepd.es
- **Garante** (Italy) — garanteprivacy.it
- **AP** (Netherlands) — autoriteitpersoonsgegevens.nl

**For companies with EU users but no EU establishment:** The general rule is that the supervisory authority of the country most affected by the breach is competent to receive your notification. If the majority of affected users are in Germany, notify the BfDI. If spread across multiple countries, you may need to notify more than one authority — or check with a privacy lawyer about the right approach for your specific situation.

---

## What Happens If You Miss the 72-Hour Window?

Missing the deadline is itself a GDPR violation. Article 33(1) is explicit: notification must happen "without undue delay and, where feasible, not later than 72 hours."

If you miss it, here's what to do:

**Notify anyway, as soon as possible.** The requirement doesn't disappear after 72 hours. "Without undue delay" means you still need to report — late is better than never.

**Document why you were late.** Supervisory authorities consider mitigating factors. If the breach was unusually complex to detect, if it was discovered late due to a third-party vendor, or if your investigation required time that genuinely couldn't be compressed, document this thoroughly. Unavoidable investigation delays are treated differently than straightforward negligence.

**Expect scrutiny.** Late notifications attract more attention from supervisory authorities. Your delay will likely be examined as part of any follow-up investigation.

On penalties: violations of Article 33 fall into the lower tier of GDPR fines — up to €10 million or 2% of global annual turnover, whichever is higher. That's the lower tier. It's still significant. The higher-tier fines (up to €20M / 4% of turnover) apply to violations of fundamental principles, which a breach itself may trigger if it resulted from inadequate security under Article 32.

---

## Breach Prevention Is Cheaper Than Breach Response

The cost of a data breach — investigation, legal advice, notification, remediation, potential fines, reputational damage — is significant. The cost of knowing what data your site collects and keeping it minimal is much lower.

The first step in understanding your breach exposure is knowing what you actually collect. Run a scan to see every cookie, tracker, and third-party script loading on your site — including what fires before consent is given:

[app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan)

Knowing what you collect answers a critical question in the first hour of any incident: what was potentially exposed? If you haven't audited your data collection recently, you won't be able to answer that question when it matters most.

---

*Last updated: March 2026*
