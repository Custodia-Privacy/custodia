# Stripe and GDPR: What Every Business Using Stripe Needs to Know

You process EU payments through Stripe. That makes Stripe a data processor — and you the controller. Under GDPR, that distinction carries real obligations, and most businesses using Stripe have only handled part of them.

This isn't theoretical. The European Data Protection Board has been explicit: any third-party service that handles personal data on your behalf is a data processor, and you are legally responsible for ensuring that processing is lawful, documented, and proportionate. Stripe processes payment card data, billing addresses, email addresses, IP addresses, device fingerprints, and in some cases biometric identity verification data — all on your behalf, for your customers.

If you haven't completed the full Stripe GDPR compliance picture, this guide covers exactly what you need to do.

---

## What Data Stripe Actually Processes

Before you can understand your obligations, you need to understand the scope of data Stripe handles. It's broader than most merchants realise.

**Payment and billing data**: Card numbers (stored in tokenised form), card expiry, billing name, billing address, and bank account details for direct debit. Stripe is PCI DSS Level 1 certified, which handles payment security — but PCI compliance and GDPR compliance are different frameworks with different requirements.

**Contact and identity data**: Email addresses, phone numbers, and in some checkout flows, shipping addresses. All of this is personal data under GDPR Article 4.

**Device and network data**: IP addresses, browser type, operating system, device identifiers, and timestamps. These are used by Stripe for fraud detection and are captured automatically during every checkout session.

**Behavioural data via Stripe Radar**: Stripe's fraud detection system collects behavioural signals — how a user moves their mouse, typing patterns, how they navigate your checkout page, and timing data between interactions. This is collected by default when you use Stripe.js or Stripe Elements.

**Identity verification data**: If you use Stripe Identity, this extends to government-issued ID documents, selfie images, and biometric data. This is special category data under GDPR Article 9, requiring explicit consent.

The takeaway: Stripe GDPR compliance isn't just about noting that you use Stripe for payments. It covers a substantial breadth of personal data across multiple categories.

---

## Stripe's Data Processing Agreement

Under GDPR Article 28, you are required to have a written Data Processing Agreement (DPA) with every data processor. Stripe provides a DPA — but you need to explicitly accept it.

**How to access Stripe's DPA**: Log in to your Stripe Dashboard, go to Settings > Legal, and locate the Data Processing Agreement. You'll need to review and accept it. Stripe's DPA covers:

- The subject matter and duration of processing
- The nature and purpose of processing
- The type of personal data and categories of data subjects
- Stripe's obligations and rights as a processor

Critically, Stripe's DPA includes the EU Standard Contractual Clauses (SCCs), which handle the international transfer question (more on that below). Once you've accepted Stripe's DPA, that transfer mechanism is in place.

**What the DPA doesn't do**: It doesn't make you compliant by itself. It establishes the legal framework for Stripe's processing, but you still need to ensure your own policies, notices, and practices meet GDPR requirements.

---

## Data Residency: Stripe Processes Data in the United States

Stripe is a US company. When an EU customer pays you through Stripe, their payment data is transferred to and processed in the United States. Under GDPR Chapter V, this cross-border transfer requires a legal mechanism.

Stripe uses **Standard Contractual Clauses (SCCs)** — the EU Commission-approved contract terms that establish equivalent data protection obligations for transfers to third countries. When you accept Stripe's DPA, you're accepting the SCCs as the transfer mechanism.

You need to document this in your privacy policy and, where required by your data protection authority, in your records of processing activities. Don't assume the SCCs cover everything silently — data subjects have a right to know their data is transferred internationally and why.

Stripe also offers some data localisation options for larger merchants (cards processed in Europe can be kept in EU Stripe infrastructure for certain products), but for most businesses using standard Stripe integration, the US transfer is the default.

---

## Privacy Policy Requirements: Name Stripe Explicitly

A generic "we use third-party payment processors" line in your privacy policy is no longer sufficient. GDPR's transparency requirements (Articles 13 and 14) require you to be specific about:

- **Who processes data**: Name Stripe explicitly, not just "payment processors"
- **What data is shared**: Payment details, billing address, device data
- **Why it's shared**: To process payment transactions
- **Where it goes**: Stripe, Inc., United States — transferred under Standard Contractual Clauses
- **How long it's retained**: Reference Stripe's retention practices alongside your own

A compliant privacy policy section on Stripe might read: *"Payments are processed by Stripe, Inc. (stripe.com). When you make a purchase, Stripe receives your payment card details, billing address, email address, and device information to process the transaction and detect fraud. This data is transferred to the United States under EU Standard Contractual Clauses. Stripe's privacy policy is available at stripe.com/privacy."*

This level of specificity is what Stripe GDPR compliance actually requires in terms of notice.

---

## The Checkout Form: Data Minimisation in Practice

GDPR Article 5(1)(c) requires data minimisation — you should only collect personal data that is adequate, relevant, and limited to what is necessary for the purpose.

At your Stripe checkout, this means:

**Only collect what Stripe needs**. For a card payment, Stripe requires: card number, expiry, CVV, and billing postcode (or full address for address verification). It does not require a phone number, date of birth, or "how did you hear about us" — unless those serve a documented, necessary purpose.

**Don't add unnecessary fields to the checkout form**. Every additional field increases the data you're collecting and the scope of your GDPR obligations. If your current checkout form asks for a phone number "just in case" or a shipping address for digital products, that's a data minimisation issue.

**Be careful with prefilled data**. If you're passing customer data to Stripe from your own database (to prefill checkout fields), you should document why that's necessary and ensure users know their data is being shared at that point.

Stripe's prebuilt Payment Element and Checkout are generally designed with minimisation in mind — but any customisation you add can introduce compliance issues.

---

## Stripe Radar: Behavioural Data Collection by Default

Stripe Radar is Stripe's machine learning-based fraud detection system. It's active by default when you use Stripe.js or Stripe Elements, and it collects significantly more than just payment data.

Radar captures behavioural signals during the checkout session: mouse movement patterns, keystroke timing, how the user interacts with form fields, how they navigate between your checkout steps. This data is combined with device fingerprinting and network signals to assess fraud risk.

From a Stripe GDPR perspective, this presents two considerations:

**Disclosure**: This behavioural data collection is legitimate and covered under Stripe's DPA (Stripe processes it as a processor for fraud prevention purposes). But it needs to be disclosed in your privacy policy. Most privacy policies don't mention it at all.

**Legitimate interest**: The legal basis for fraud prevention processing is typically legitimate interest — both yours (preventing fraudulent transactions) and Stripe's. This is a relatively solid basis for this type of processing, but you should document it in your legitimate interests assessment.

Radar cannot be disabled without significantly impacting fraud detection. It's best treated as a disclosed, documented component of your payment processing stack rather than something you can opt out of.

---

## Deletion Requests: What Stripe Retains vs. What Can Be Deleted

This is one of the most practically difficult areas of Stripe GDPR compliance. When a data subject submits an erasure request (under GDPR Article 17), you need to handle both your own data and data held by processors — but Stripe has legal obligations that constrain what can be deleted.

**What Stripe must retain**: Financial transaction records, including payment amounts, dates, and payment method details (tokenised), are subject to legal retention requirements. In most EU jurisdictions, financial records must be kept for 5-7 years for tax and accounting purposes. This falls under GDPR Article 17(3)(b) — the right to erasure does not apply where processing is necessary for compliance with a legal obligation.

**What can be deleted**: Contact details (email, phone), shipping addresses not tied to the transaction record, and certain metadata may be deletable. Stripe allows merchants to delete customer objects via the API, which removes some data while retaining what's legally required.

**Your response to erasure requests**: When a customer asks to be forgotten, you should:
1. Delete what you can from your own systems
2. Submit a deletion request to Stripe for the customer record (via API or Stripe Dashboard)
3. Inform the data subject that certain financial records are retained under legal obligation, with an explanation of the retention period
4. Document the request and your response

Template language for this response: *"We have deleted your personal data from our systems. Your payment transaction records are retained by our payment processor, Stripe, for [X] years as required by applicable financial record-keeping law. This retention is exempt from the right to erasure under GDPR Article 17(3)(b)."*

---

## Stripe Identity: Special Category Data and Separate Consent

If you use Stripe Identity for customer verification — for age verification, anti-fraud checks, or KYC compliance — the GDPR requirements escalate significantly.

Stripe Identity processes:
- Government-issued ID documents (passport, driving licence)
- Selfie images for liveness detection
- Biometric comparison data

Facial recognition and ID document data may constitute **biometric data** or **special category data** under GDPR Article 9, depending on how it's processed. Special category data requires either explicit consent (Article 9(2)(a)) or another specific exemption.

For Stripe Identity specifically:
- You need **explicit, granular consent** for the identity verification — separate from general terms acceptance
- Your privacy policy needs a dedicated section on identity verification data
- You need to document the specific legal basis (usually explicit consent or legal obligation for regulated businesses)
- The retention period for identity data needs to be specifically documented — Stripe Identity has its own data retention settings that you should review

If you're using Stripe Identity for a regulated purpose (financial services, age-restricted products), you may have legal obligation as an additional or primary basis — but explicit consent is still best practice.

---

## The Lawful Basis Question: Payment Processing and Legitimate Interest

Can you use legitimate interest as your lawful basis for payment processing? No — and you shouldn't need to.

For payment processing, the correct lawful basis is **Article 6(1)(b): processing necessary for the performance of a contract**. When a customer buys from you, processing their payment data is necessary to fulfil that contract. This is a clean, clear basis that doesn't require a legitimate interests assessment.

Where legitimate interest *does* apply in the Stripe context:
- **Fraud prevention** (Stripe Radar): Legitimate interest covers fraud detection because you and Stripe have a legitimate interest in preventing fraudulent transactions that outweighs the minimal privacy impact of the behavioural signals collected
- **Security monitoring**: Network and device data collected for security purposes can rely on legitimate interest
- **Analytics on transaction patterns**: Using aggregated transaction data for business analytics may rely on legitimate interest, provided individual-level profiling is not occurring

Document your lawful basis for each processing purpose. Don't use consent for payment processing — it creates a problem, because if the customer withdraws consent, you can't process their payment. Contract performance is the right basis.

---

## Practical Checklist: 8 Steps for Stripe GDPR Compliance

**1. Accept Stripe's Data Processing Agreement**
Log in to Stripe Dashboard > Settings > Legal. Review and accept the DPA. This activates the SCCs for international transfers and establishes the processor relationship formally.

**2. Update your privacy policy**
Name Stripe explicitly. Describe what data is shared, why, where it goes (US, under SCCs), and how long it's retained. Include a reference to Stripe's privacy policy.

**3. Document your lawful basis**
For payment processing: Article 6(1)(b) — contract performance. For fraud detection: legitimate interest. For Stripe Identity: explicit consent or legal obligation. Document these in your records of processing activities.

**4. Audit your checkout form**
Remove any fields that aren't necessary for payment processing. If you collect phone numbers, shipping addresses for digital products, or other non-essential data, document the necessity or remove the fields.

**5. Disclose Stripe Radar**
Add a note to your privacy policy that your payment processor uses fraud detection technology that may collect behavioural signals during checkout. Brief, accurate, and documented.

**6. Build a deletion request process**
Create a documented process for erasure requests. Know which data you can delete immediately, which Stripe can delete on request, and which must be retained under financial record-keeping obligations. Have a template response ready.

**7. Handle Stripe Identity separately (if you use it)**
If you use Stripe Identity, add a dedicated consent flow before the verification step. Update your privacy policy with a separate section on identity verification data. Review Stripe's Identity data retention settings.

**8. Update your records of processing activities (ROPA)**
GDPR Article 30 requires documentation of processing activities. Add Stripe as a processor, with processing purpose, data categories, legal basis, transfer mechanism, and retention periods documented.

---

## Run a Scan to See Your Full Compliance Picture

Stripe GDPR compliance is one piece of a broader picture. Your checkout might be clean, but what's happening on your marketing pages, your analytics setup, your cookie consent banner?

Custodia scans your website and identifies every tracker, third-party tool, and data collection point — then shows you exactly what's compliant and what isn't. If Stripe is loading before your checkout is initiated, if your cookie banner isn't blocking analytics correctly, or if your privacy policy is missing required disclosures, the scan will surface it.

[Run a free scan at app.custodia-privacy.com](https://app.custodia-privacy.com/scan) — no signup required, results in 60 seconds.

---

*Last updated: March 27, 2026. This post reflects GDPR requirements as currently enforced. It is not legal advice — consult a qualified privacy professional for advice specific to your situation.*
