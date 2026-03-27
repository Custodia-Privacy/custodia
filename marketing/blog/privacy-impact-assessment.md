# Privacy Impact Assessment (PIA): When You Need One and How to Do It

You're about to launch a new feature. It processes user health data. It uses an algorithm to generate personalised recommendations. It tracks behaviour over time. Your legal counsel asks: "Have you done a DPIA?"

You've heard the term. You're not entirely sure what it involves. And you definitely don't know whether you're legally required to do one.

This guide answers all three questions — when a privacy impact assessment is legally mandatory under GDPR, what the process actually involves, and what the resulting document must contain. If you're building anything that processes sensitive or large-scale personal data, read this before you ship.

---

## PIA vs DPIA: Why Both Terms Exist

You'll see both "Privacy Impact Assessment" (PIA) and "Data Protection Impact Assessment" (DPIA) used throughout the privacy industry. They refer to essentially the same thing.

PIA is the broader, internationally-used term — used in frameworks from ISO 29134, the NIST Privacy Framework, and various national guidance documents. DPIA is the specific term GDPR uses. In practice, if you're doing one for GDPR compliance purposes, you're conducting a DPIA. If you're doing one for a non-GDPR context (a US federal agency, an ISO 27001 audit), you might call it a PIA.

For the rest of this guide, we'll use DPIA — because if you're reading this, GDPR compliance is probably your primary concern.

---

## When a DPIA Is Legally Required: Article 35

GDPR Article 35 requires a DPIA before you begin any processing that is "likely to result in a high risk to the rights and freedoms of natural persons." This is the trigger — not the type of data you process, but the risk level of the processing activity.

Article 35(3) identifies three categories that always require a DPIA:

**1. Systematic and extensive evaluation of personal aspects based on automated processing, including profiling, where decisions produce legal or similarly significant effects.**

This covers credit scoring, insurance underwriting, recruitment screening, loan decisions, and similar processes where an algorithm makes or substantially influences a significant decision about an individual.

**2. Processing on a large scale of special categories of data (Article 9) or personal data relating to criminal convictions and offences (Article 10).**

Special categories include health data, genetic data, biometric data (where used to uniquely identify a person), racial or ethnic origin, political opinions, religious beliefs, trade union membership, and sex life or sexual orientation. If you're processing any of these at scale — even if your users have consented — a DPIA is required before you start.

**3. Systematic monitoring of a publicly accessible area on a large scale.**

CCTV networks, mass tracking of movement through mobile apps, and retail analytics systems that track individuals through public spaces all fall into this category.

---

## The ICO and EDPB Lists: Processing That Always Requires a DPIA

The European Data Protection Board (EDPB) and the UK's Information Commissioner's Office (ICO) have both published lists of processing types that always require a DPIA — going beyond Article 35(3).

**The EDPB list includes:**

- Tracking individuals' location or behaviour (including online behavioural advertising)
- Processing personal data of children for profiling or marketing
- Processing biometric data to uniquely identify a person
- Processing genetic data
- Combining datasets from different sources where the combination exceeds reasonable expectations
- Processing data that could result in denial of service
- Innovative use of new technological or organisational solutions

**The ICO's UK list adds:**

- Matching or combining personal data for a purpose that data subjects would not reasonably expect
- Processing that involves profiling or predicting criminal behaviour
- Processing that could result in financial exclusion

If your processing activity appears on either list, a DPIA is not optional — it's a legal requirement, regardless of the actual risk level.

---

## When a DPIA Is Recommended But Not Required

Even when a DPIA isn't legally mandated, it's often good practice. The EDPB recommends considering one whenever:

- You're processing personal data in a way that's new to your organisation
- You're uncertain whether the processing triggers Article 35 requirements
- The processing involves personal data of vulnerable individuals (employees, children, patients)
- You're processing data about a large number of individuals even if the data isn't sensitive
- You're transferring personal data outside the EEA/UK in a novel way

A voluntary privacy impact assessment also demonstrates good faith to regulators — relevant if you're ever subject to an investigation.

---

## The 7-Step DPIA Process

A DPIA is not a form you fill in — it's a documented assessment process. The EDPB's guidelines identify seven key steps:

### Step 1: Describe the Processing

Document what personal data you're collecting, from whom, and how. Include: the purpose of the processing, the legal basis under Article 6 (and Article 9 for special categories), the categories of data subjects, the categories of personal data, the retention periods, the processors and third parties involved, and any cross-border transfers.

This is essentially a data flow description. If you've completed a Records of Processing Activities (RoPA) under Article 30, much of this information already exists.

### Step 2: Assess Necessity and Proportionality

Could you achieve the same purpose with less data or less invasive methods? GDPR requires that processing be necessary for a legitimate purpose — not merely useful or convenient. At this step, document why you need each data element, why your chosen approach is appropriate, and what alternatives you considered and rejected.

### Step 3: Identify the Risks

List all potential risks to data subjects. These include physical, material, and non-material risks — discrimination, identity theft, financial loss, reputational damage, loss of confidentiality, unauthorised reversal of pseudonymisation. Consider risks arising from the processing itself, from potential security incidents, and from the outputs of the processing.

### Step 4: Assess the Risks

For each identified risk, assess the likelihood that it will materialise and the severity of harm if it does. Many DPIAs use a 3×3 or 4×4 risk matrix for this. The combination of likelihood and severity gives you a risk level (low, medium, high, very high). This quantification is important — it's the basis for your mitigation decisions.

### Step 5: Identify Measures to Address the Risks

For each medium, high, or very high risk, identify a technical or organisational measure that reduces it. Technical measures include encryption, pseudonymisation, access controls, minimisation, and differential privacy. Organisational measures include staff training, data retention schedules, contractual controls on processors, and incident response procedures.

Document the residual risk remaining after measures are applied. If residual risk remains very high, you may need to consult your supervisory authority before proceeding (see below).

### Step 6: Consult Your DPO (If Applicable)

If your organisation is required to appoint a Data Protection Officer under Article 37, you must consult them during the DPIA process. The DPO's role is advisory — they review the assessment and provide recommendations, but accountability remains with the data controller.

If you don't have a DPO, this step doesn't apply — but consider whether the complexity of the processing warrants seeking external privacy expertise.

### Step 7: Document, Approve, and Review

The DPIA must be documented in writing. It must be signed off by the controller (or a senior accountable person). It should be dated, version-controlled, and stored with your other compliance documentation. Set a review date — DPIAs should be revisited whenever the processing changes significantly, or at a defined interval (annually is common for high-risk processing).

---

## What the DPIA Document Must Contain

GDPR Article 35(7) specifies minimum required contents:

1. **A systematic description of the envisaged processing operations and the purposes** — including the legitimate interest pursued by the controller where applicable
2. **An assessment of the necessity and proportionality of the processing** in relation to the purposes
3. **An assessment of the risks** to the rights and freedoms of data subjects
4. **The measures envisaged to address the risks** — including safeguards, security measures, and mechanisms to ensure protection of personal data

In practice, most DPIAs also include: the legal basis for processing, retention schedules, processor details and DPA references, the consultation record (DPO, if applicable), and a sign-off section.

---

## Common Mistakes

**Doing the DPIA too late.** Article 35 requires a DPIA to be carried out "prior to the processing." That means before you collect the first data point — not before you go live, not during beta. If risks are identified that require design changes, you want to find them before building, not after. A DPIA conducted after the fact is better than nothing, but it's not compliant.

**Treating it as a checkbox exercise.** A DPIA that identifies no risks, recommends no mitigations, and is signed off in an afternoon is almost certainly insufficient. Regulators and DPOs are experienced at spotting template documents that have been minimally adapted. A DPIA should reflect genuine thought about the specific risks of the specific processing activity.

**Failing to update it.** A DPIA is a living document. If you add a new processor, change your retention period, expand to a new jurisdiction, or change the purpose of processing, the DPIA should be updated. The original sign-off date doesn't cover subsequent changes.

**Confusing risk to the organisation with risk to data subjects.** A DPIA assesses risk to individuals, not risk to the controller. Reputational risk or regulatory fine risk are not DPIA risks — harm to data subjects is.

---

## Prior Consultation: When to Involve the Supervisory Authority

If your DPIA concludes that residual risk remains high, and you cannot implement measures to reduce it to an acceptable level, Article 36 requires you to consult your supervisory authority before proceeding.

This is not a filing requirement for every DPIA — only for those where very high risk remains after mitigation. In practice, prior consultation is rare. But if you're there, the process involves submitting the DPIA to the relevant data protection authority and waiting up to eight weeks for a response (extendable to 14 weeks).

The supervisory authority may provide written advice, or it may exercise its powers under Article 58 — including prohibiting the processing.

---

## DPIA for AI Systems: Specific Considerations

AI and machine learning systems raise particular DPIA challenges that traditional frameworks don't fully address.

**Explainability.** GDPR Article 22 gives individuals the right not to be subject to solely automated decisions that produce legal or significant effects — and where such decisions are permitted, the right to obtain an explanation. Your DPIA should document how explainability is implemented, and what explanations data subjects will receive.

**Training data.** If your AI model was trained on personal data, the DPIA should cover the training phase, not just the inference phase. What data was used? On what legal basis? Has it been deleted, or retained for retraining?

**Bias and discrimination.** AI systems can produce discriminatory outcomes even without discriminatory intent. Risk identification should explicitly consider whether the system's outputs could disadvantage individuals based on protected characteristics.

**Model drift.** AI systems change over time as they learn. A DPIA conducted at launch may not reflect the system's behaviour six months later. Review schedules for AI DPIAs should be shorter than for static processing systems.

**The EDPB's Guidelines 02/2022 on AI** provide additional detail for AI-specific DPIA requirements.

---

## A Practical DPIA Template: The 5 Questions Every Assessment Must Answer

If you're conducting your first privacy impact assessment, structure it around these five core questions:

**1. What are we doing and why?**
Describe the processing activity in plain terms. What data? From whom? For what purpose? On what legal basis?

**2. Is this the minimum necessary to achieve the purpose?**
Have you considered less privacy-invasive alternatives? Can you achieve the same result with anonymised data, aggregated data, or less granular data?

**3. What could go wrong for individuals?**
List every realistic harm — not just data breaches, but discriminatory outputs, unwanted exposure, loss of access to services, reputational damage, and any specific risks arising from the data categories involved.

**4. How are we reducing those risks?**
For every risk identified, document the control. Technical or organisational. Pre-existing or newly implemented. Note the residual risk after each control.

**5. Who has reviewed and approved this?**
Document the assessment date, the reviewer, any DPO consultation, and the approving controller. Set a next review date.

This structure maps directly to Article 35(7) and provides a defensible baseline document if a supervisory authority ever asks to see your DPIA.

---

## Start With a Data Map

Before you can complete a DPIA, you need to know what personal data your systems actually process. Many organisations discover during the DPIA process that their records of processing activities are incomplete — that third-party scripts are collecting data they weren't aware of, that retention periods have never been defined, or that processors are being used without Data Processing Agreements.

Custodia can help. Our scanner identifies every tracker, cookie, and data collection point on your website in 60 seconds — giving you the foundation you need to map your data flows before beginning a privacy impact assessment. Run a free scan at [app.custodia-privacy.com](https://app.custodia-privacy.com/scan) — no signup required.

---

*Last updated: March 27, 2026. This guide reflects GDPR and UK GDPR requirements as currently enforced. Privacy law varies by jurisdiction — consult a qualified privacy professional for advice specific to your situation.*
