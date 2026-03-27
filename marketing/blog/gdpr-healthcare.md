# GDPR in Healthcare: What Medical Practices and Health Tech Companies Must Do

Health data is the most sensitive category of personal data under GDPR. When a medical practice, health tech startup, or wellness app gets GDPR wrong, the consequences go beyond regulatory fines — it is a direct breach of patient trust. Supervisory authorities treat health data breaches with the strictest scrutiny, and the fines reflect it. The largest GDPR healthcare fine to date exceeded €1.2 billion (Meta's cross-border transfer case), but sector-specific health data violations routinely attract eight-figure penalties.

This guide covers everything medical organisations and health tech companies need to know: the legal bases for processing, DPO requirements, security standards, patient rights, and what to do when things go wrong.

---

## Why Health Data Is Special Category Data Under Article 9

GDPR Article 9 identifies health data as "special category" data — a tier of personal information requiring a higher level of protection because of the particular risks it creates for individuals. Health data is defined broadly: any information relating to the physical or mental health of a natural person, including the provision of health care services, that reveals information about their health status.

This covers medical records, prescriptions, lab results, diagnoses, mental health notes, therapy records, and — critically — inferred health information. If your wellness app tracks sleep patterns that reveal a mental health condition, or your fitness platform infers that a user is pregnant, that is health data under GDPR healthcare rules.

Processing special category data is prohibited by default unless a specific condition under Article 9(2) applies. Standard lawful bases under Article 6 (legitimate interest, contract performance, consent) are not sufficient on their own. You need both an Article 6 basis and an Article 9(2) condition.

---

## Article 9(2) Legal Bases That Apply in Healthcare

**Explicit consent — Article 9(2)(a).** The most common basis for health tech and wellness apps. Consent must be freely given, specific, informed, and unambiguous — and for health data, it must be *explicit* (a clear affirmative act, not a pre-ticked box). Patients must be told exactly what health data you will process, why, and who will see it. Withdrawing consent must be as easy as giving it.

**Vital interests — Article 9(2)(c).** Processing is lawful when necessary to protect the vital interests of the data subject or another person, and the data subject is physically or legally incapable of giving consent. This applies in genuine emergency situations — a patient brought in unconscious, for example.

**Health and social care purposes — Article 9(2)(h).** This is the primary basis for most clinical processing by medical professionals. It covers processing necessary for the purposes of preventive or occupational medicine, medical diagnosis, the provision of health care or treatment, management of health or social care systems, and under a contract with a health professional. This basis is subject to professional secrecy obligations under Member State law.

**Public health — Article 9(2)(i).** Processing for reasons of public interest in the area of public health: protecting against cross-border health threats, ensuring high standards of quality and safety of health care. This basis is typically available to public health authorities, not private medical businesses.

**Research, archiving, and statistics — Article 9(2)(j).** Clinical research, medical registries, and public health surveillance can process health data under this basis subject to appropriate safeguards: pseudonymisation, purpose limitation, ethics oversight, and minimum data collection.

**Understanding which basis applies to each processing activity** is the foundation of GDPR healthcare compliance. Medical practices running clinical operations rely primarily on Article 9(2)(h). Health apps typically rely on Article 9(2)(a) explicit consent. Using the wrong basis — or processing health data without any valid basis — is the most common failure point.

---

## Medical Records: Purpose Limitation, Access Controls, and Retention

Medical records must be collected for specified, explicit, and legitimate purposes, and not processed further in ways incompatible with those purposes. Collecting comprehensive patient histories for diagnostic purposes does not authorise using that data for marketing wellness products — even with the same healthcare provider.

**Access controls** are not optional. Article 25 (privacy by design) requires that access to health records be limited to those with a legitimate clinical need. Role-based access controls, audit logging, and the principle of minimum necessary access should be implemented at the system level, not managed through organisational policies alone.

**Retention periods** must be defined and enforced. GDPR's storage limitation principle requires that health data be kept only as long as necessary for the purpose. In practice, this intersects with sector-specific legal obligations — most EU member states specify minimum retention periods for medical records (commonly 10 years from last contact in clinical settings, longer for children's records). You must comply with the longer of the regulatory minimum and the GDPR-compliant retention period, then delete or anonymise records systematically.

---

## Telemedicine and Health Apps: Consent, Profiling, and Data Sharing

The GDPR healthcare landscape for telemedicine and health apps is particularly complex because these organisations often:

- Collect health data directly from patients (symptom checkers, mental health apps, period trackers)
- Profile users to personalise health recommendations
- Share data with third-party services (analytics, cloud infrastructure, insurance partners)

**Consent must be granular.** A telemedicine platform should not bundle consent to clinical data processing with consent to health analytics or marketing. Each materially different purpose needs separate, explicit consent that patients can grant or withdraw independently.

**Profiling with health data triggers Article 22.** If your health app makes automated decisions about users — determining health risk scores, insurance eligibility, or treatment pathways — without meaningful human review, this constitutes automated decision-making with legal or similarly significant effects. This requires either explicit consent, contract necessity, or EU law authorisation, along with the right to obtain human intervention and contest the decision.

**Sharing health data with insurers** deserves specific attention. Sharing patient health data with insurance companies without explicit consent from the patient is almost certainly unlawful under GDPR healthcare rules. Even where some form of consent exists, it must be freely given — which is questionable if patients face coverage consequences for withholding it. Legal advice specific to your jurisdiction is essential before structuring any insurer data-sharing arrangement.

---

## Genetic Data: Extra Protections and Research Exemptions

Genetic data is a distinct category within Article 9 special category data. Unlike general health data, genetic information is immutable — a breach cannot be undone by issuing a new password. It reveals information about family members who have given no consent. It can enable identification across datasets where conventional anonymisation fails.

Most private medical practices have limited interaction with genetic data. But health tech companies building genomic services, ancestry platforms with health features, or pharmacogenomics tools face the full weight of GDPR genetic data obligations:

- Explicit consent is typically the only viable basis for consumer genomic processing
- Data minimisation is critical — collect only the specific genetic markers required
- Robust pseudonymisation and encryption are expected as baseline
- Secondary research use requires separate ethics oversight and, in most jurisdictions, additional regulatory authorisation

---

## Children's Health Data: Additional Consent Requirements

Processing health data relating to children under 16 (or the lower age set by Member State law — 13 in the UK, Ireland, and several other countries) requires parental or guardian consent. This applies whether you are a paediatric clinic, a children's fitness app, or a school health programme.

The practical complications are significant:

- You must have a reasonable mechanism to verify the child's age and that consent is genuinely parental
- Children who reach the consent age threshold should be given the opportunity to confirm or withdraw consent themselves
- Data collected under parental consent for a minor should not be retained beyond the period appropriate for the original purpose — which often ends when the child reaches adulthood

Health apps with no age verification that collect health data are in a precarious position if their user base includes children.

---

## The DPO Requirement: Who in Healthcare Must Appoint a Data Protection Officer

GDPR Article 37 mandates appointment of a Data Protection Officer for any organisation that processes special category data on a large scale. In the healthcare context, this captures:

- Hospitals and large clinic networks processing health records for hundreds or thousands of patients
- Health tech companies whose core product is processing health data (mental health apps, chronic disease management platforms, diagnostic tools)
- Insurers processing health claims data
- Pharmaceutical companies processing clinical trial data

**What is "large scale"?** There is no bright-line threshold. The Article 29 Working Party guidance suggests considering the number of data subjects, the volume of data, the geographic scope, and the duration. A solo GP practice processing a small patient list would not typically require a DPO. A telehealth platform with 10,000 registered patients almost certainly would.

The DPO must have expert knowledge of data protection law, be adequately resourced, and be given independence to perform their tasks. They cannot be dismissed or penalised for performing their DPO role. The DPO's contact details must be published and reported to the supervisory authority.

---

## Security Requirements for Health Data

GDPR Article 32 requires appropriate technical and organisational measures to protect personal data. For GDPR healthcare, "appropriate" means substantially more than for ordinary personal data.

**Encryption** should be implemented at rest and in transit for all health records. TLS 1.2 or higher for data in transit. AES-256 or equivalent for data at rest. Encryption keys should be managed separately from the encrypted data.

**Access logging and audit trails** are essential. Who accessed which patient record, when, and from where should be logged and those logs retained for an appropriate period. Anomalous access patterns — one clinician accessing thousands of records outside their normal patient cohort — should trigger automated alerts.

**Pseudonymisation** separates identifying information from health data, reducing the risk that a breach of one dataset exposes the other. Clinical records can be pseudonymised for analytics, research, and secondary uses while preserving the link for clinical care.

**Penetration testing and security assessments** should be conducted regularly. Healthcare organisations are among the most targeted by ransomware and data theft attacks. Third-party security assessment is increasingly expected as a baseline by supervisory authorities investigating breaches.

**Access control** should implement least-privilege principles. Clinical staff should access only the records relevant to their patient cohort. Administrative staff should have no access to clinical notes. Privileged access should require multi-factor authentication.

---

## Data Breaches Involving Health Data: Notification Obligations and Risk Assessment

A personal data breach involving health data almost always meets the threshold for regulatory notification. GDPR Article 33 requires notification to the supervisory authority within 72 hours of becoming aware of a breach — not 72 hours after completing an investigation, but 72 hours after awareness. If notification is delayed, you must explain why.

**The risk assessment** is the critical first step. Not every breach requires notification to patients, but breaches involving health data almost always will meet the "high risk" threshold that triggers Article 34 individual notification. High-risk factors for GDPR healthcare breaches include: the sensitivity of health data by definition, the likely impact on patients (discrimination, professional harm, emotional distress), and the scale of exposure.

**Individual notification** must be in plain language, explain what happened, describe the likely consequences, and tell patients what steps they can take to protect themselves and what you are doing to address the breach.

**Documentation** is mandatory regardless of whether regulatory notification is required. You must maintain records of all breaches — including those that did not meet the notification threshold — with information about the breach, its effects, and remedial action.

---

## Sharing Data with Other Healthcare Providers

Patient data frequently needs to move between healthcare providers — between a GP and a specialist, between a hospital and a rehabilitation facility, between a primary care provider and a mental health service. GDPR healthcare rules do not prohibit this, but they require a clear legal basis and adherence to the minimum necessary principle.

For clinical handovers, Article 9(2)(h) — health and social care purposes — is typically the appropriate basis in the EU. In the UK, similar provisions exist under UK GDPR and NHS data-sharing frameworks.

The minimum necessary principle means sharing the specific information the receiving provider needs for the care episode, not the entire patient record. A referral to a cardiologist does not require sharing the patient's complete psychiatric history.

Data-sharing agreements between providers should document the legal basis, purpose, data categories, and security obligations of each party.

---

## NHS Data Sharing Frameworks (UK) and the EU Health Data Space

**In the UK,** NHS data governance sits alongside UK GDPR. The NHS Data Security and Protection Toolkit sets information governance standards for organisations accessing NHS data. The National Data Guardian's framework governs opt-outs from NHS data sharing for research and planning purposes. Health tech companies integrating with NHS systems or accessing NHS patient data must comply with both UK GDPR and NHS-specific requirements.

**The EU Health Data Space (EHDS)** is a major regulatory development in GDPR healthcare. The EHDS Regulation, which entered force in 2024 with phased implementation through 2029, creates a framework for patients to access their own health data across EU borders, and for secondary use of health data (research, policy, innovation) under a centralised governance structure. Health tech companies building cross-border health data products need to monitor EHDS implementation closely as it creates both new opportunities and new obligations.

---

## Patient Rights in Healthcare

Standard GDPR rights apply to health data — but with healthcare-specific nuances:

**Right of access** — Patients have a right to access their medical records. This is one of the most exercised rights in the healthcare context. Organisations must respond within one month, provide data in a readily accessible form, and cannot charge for reasonable access requests.

**Right to rectification** — Patients can request correction of inaccurate health data. Clinical disagreements (a patient disputes a diagnosis) require careful handling — the data controller cannot simply overwrite clinical notes, but may need to annotate records with the patient's view.

**Right to restriction** — In certain circumstances, patients can request that you stop actively processing their data while keeping it stored (e.g., while accuracy is contested). This can create operational complexity for electronic health record systems.

**Right to erasure** — This right is significantly limited in the clinical context. Article 17(3)(c) exempts processing necessary for archiving purposes in the public interest, scientific research, or historical research, to the extent that erasure would make the research impossible or seriously impair it. Many clinical records meet this threshold. Legal retention obligations may also override erasure requests.

**Right to object** — Where processing relies on Article 9(2)(j) (research), patients have the right to object, subject to safeguards.

---

## Practical Checklist: 8 Steps for Healthcare GDPR Compliance

**1. Map your health data.** Identify every category of health data you process, where it comes from, what systems hold it, who can access it, and where it goes. This is your Record of Processing Activities (RoPA) — mandatory under Article 30 for most healthcare organisations.

**2. Establish the correct legal basis for each processing activity.** Clinical care: Article 9(2)(h). Research: Article 9(2)(j). Consumer health apps: Article 9(2)(a) explicit consent. Document your reasoning in your RoPA.

**3. Conduct a DPIA for high-risk processing.** Any large-scale processing of health data, systematic health profiling, or genetic data processing requires a Data Protection Impact Assessment before processing begins.

**4. Appoint a DPO if required.** If your organisation processes health data on a large scale, appoint a qualified DPO, register their details with your supervisory authority, and ensure they have the independence and resources to operate effectively.

**5. Implement appropriate security measures.** Encryption at rest and in transit. Role-based access controls. Audit logging. Multi-factor authentication for privileged access. Regular security testing.

**6. Build a breach response plan.** You have 72 hours to notify the supervisory authority. That timeline requires a documented internal escalation process, clear ownership, and pre-drafted notification templates. Test it before you need it.

**7. Establish retention schedules and enforce them.** Define the retention period for each category of health data, accounting for legal minimums. Implement automated deletion or anonymisation at the end of the retention period.

**8. Train all staff who handle health data.** GDPR healthcare compliance failures are frequently caused by human error: wrong-recipient emails, unsecured devices, inappropriate record access. Regular training is not optional.

---

## Scan Your Patient-Facing Website for Compliance Gaps

Before a patient contacts you or uses your health app, they visit your website. That website may be setting cookies, loading third-party tracking scripts, or collecting form data without a valid legal basis or adequate disclosure — and you may not know it.

[Custodia](https://app.custodia-privacy.com) scans your patient-facing website in 60 seconds and identifies compliance gaps: trackers firing without consent, missing cookie notices, privacy policy issues, and data transfers to third countries. Free scan, no sign-up required.

Fix your public-facing compliance before a supervisory authority or a patient complaint does it for you.

---

*Last updated: March 27, 2026. This post provides general information about GDPR healthcare compliance. It does not constitute legal advice. Privacy and health data law is complex and jurisdiction-specific — consult a qualified privacy or healthcare legal professional for advice tailored to your situation.*
