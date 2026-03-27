# Intercom and GDPR: What You Must Configure Before Going Live

Intercom knows a lot about your users. It captures visitor identity, chat transcripts, email addresses, custom attributes, behavioral events, and IP addresses — often before a single message is sent. Does GDPR know you're using it?

Many teams deploy Intercom without touching a single privacy setting. They paste in the JavaScript snippet, ship it to production, and move on. The result: personal data flowing to Intercom's servers from EU visitors without a valid legal basis, without consent, and without a signed Data Processing Agreement. That's not a grey area — it's a clear GDPR violation.

This guide covers what Intercom GDPR compliance actually requires: the DPA, data residency options, conditional widget loading, the cookie problem, DSAR handling, and a practical checklist for technical founders.

---

## What Data Does Intercom Process?

Before you can configure Intercom for GDPR compliance, you need to understand what it collects. The list is longer than most teams expect.

**By default, Intercom collects:**

- **Visitor identity** — email address if provided, name, user ID
- **IP addresses** — used for geolocation and fraud prevention
- **Chat transcripts** — every message exchanged in the Messenger
- **Behavioral events** — page views, feature usage, custom events you track
- **Custom attributes** — any user properties you send via `window.Intercom('update', {...})`
- **Browser and device data** — user agent, screen resolution, timezone
- **Session data** — visit frequency, last seen, time on page
- **Company data** — if you pass company attributes, Intercom stores those too

For identified users (logged-in customers), Intercom links all of this to a persistent contact record. For unidentified visitors (anonymous site traffic), it still sets cookies and tracks behavioral data — just without a name or email attached.

All of this is personal data under GDPR. IP addresses alone are personal data. Behavioral tracking tied to a cookie is personal data. You cannot load Intercom without a lawful basis.

---

## Intercom as a Data Processor: The DPA You Need

Under GDPR, Intercom is a **data processor** — they process personal data on your behalf, according to your instructions. You are the **data controller** — you decide why and how data is processed.

This relationship must be formalised in a **Data Processing Agreement (DPA)**. Without a signed DPA, you have no legal basis to transfer personal data to Intercom, regardless of consent.

**How to sign Intercom's DPA:**

Intercom provides a standard DPA that covers their obligations under GDPR (and CCPA). You can access and sign it through your Intercom workspace:

1. Go to **Settings → Legal → Data Processing Agreement**
2. Review the agreement — it covers sub-processors, security measures, data subject rights, and breach notification
3. Click **Sign DPA** — this is binding and records the signatory's email and timestamp

Intercom's DPA includes a list of their sub-processors (AWS, Stripe, Twilio, and others). You should review this list and ensure your own privacy policy discloses Intercom's involvement and their sub-processors where relevant.

**One important note:** Intercom's standard DPA uses Standard Contractual Clauses (SCCs) for transfers outside the EEA. If you have specific requirements around international data transfers, check whether Intercom's current SCCs cover your jurisdiction.

---

## Data Residency: EU vs US Hosting

By default, Intercom stores data on US-based infrastructure (AWS US regions). For many EU businesses, this creates a problem: transferring personal data of EU residents to the United States requires a valid transfer mechanism under GDPR Chapter V.

Intercom offers **EU data hosting** as an option — data is stored in AWS EU regions (Ireland and Frankfurt). This significantly simplifies your Intercom GDPR compliance story: you're keeping EU user data within the EEA, avoiding the need to rely solely on SCCs for the storage layer.

**How to check or request EU data hosting:**

- EU data residency is available on Intercom's **Pro** and **Enterprise** plans
- If your workspace was created with EU residency selected, you can confirm under **Settings → General → Data Region**
- For existing workspaces on US hosting, migration to EU hosting requires contacting Intercom support

If you're in the process of setting up Intercom for the first time and your user base is primarily EU-based, select EU data hosting from the start. Migrating later is possible but adds friction.

Even with EU data hosting, the DPA is still required. Data residency and the DPA are separate obligations.

---

## Consent Before Widget Load: How to Do It Right

This is where most Intercom GDPR implementations fail. The Intercom Messenger JavaScript initialises immediately on page load, setting cookies and making network requests to Intercom's servers — all before the user has had any opportunity to consent.

Under GDPR, this is not permitted for visitors in the EU. You need valid, prior consent before loading Intercom for non-essential purposes (analytics, marketing, chat tracking).

**The correct approach:** conditionally load Intercom only after the user has accepted the relevant consent category.

Here's how to implement this with a consent management platform (CMP) or custom consent logic:

```javascript
// Only initialise Intercom after consent is granted
function initIntercom() {
  window.Intercom('boot', {
    api_base: 'https://api-iam.intercom.io',
    app_id: 'YOUR_APP_ID',
    // Pass user data for identified users
    user_id: currentUser.id,
    email: currentUser.email,
    name: currentUser.name,
    created_at: currentUser.createdAt,
  });
}

// Listen for consent — example using a generic consent event
document.addEventListener('consent:analytics', function(event) {
  if (event.detail.granted) {
    initIntercom();
  }
});

// If consent was previously given (returning visitor), load immediately
if (userHasConsentedToAnalytics()) {
  initIntercom();
}
```

If you're using a CMP like Cookiebot, OneTrust, or Custodia, the pattern looks like this:

```javascript
// Cookiebot example
window.addEventListener('CookiebotOnAccept', function() {
  if (Cookiebot.consent.statistics || Cookiebot.consent.marketing) {
    initIntercom();
  }
}, false);

// Handle consent already given on page load
window.addEventListener('CookiebotOnLoad', function() {
  if (Cookiebot.consent.statistics || Cookiebot.consent.marketing) {
    initIntercom();
  }
}, false);
```

**Important:** Do not include the Intercom script tag in your HTML `<head>`. Load it dynamically via JavaScript only after consent is confirmed.

```javascript
function loadIntercomScript(appId) {
  // Dynamic script injection — only runs after consent
  (function() {
    var w = window;
    var ic = w.Intercom;
    if (typeof ic === "function") {
      ic('reattach_activator');
      ic('update', w.intercomSettings);
    } else {
      var d = document;
      var i = function() { i.c(arguments); };
      i.q = [];
      i.c = function(args) { i.q.push(args); };
      w.Intercom = i;
      var l = function() {
        var s = d.createElement('script');
        s.type = 'text/javascript';
        s.async = true;
        s.src = 'https://widget.intercom.io/widget/' + appId;
        var x = d.getElementsByTagName('script')[0];
        x.parentNode.insertBefore(s, x);
      };
      l();
    }
  })();

  window.Intercom('boot', {
    app_id: appId,
  });
}
```

---

## The Cookie Problem: intercom-id-* and intercom-session-*

Intercom sets two persistent cookies that your cookie banner must account for:

- **`intercom-id-{app_id}`** — A persistent identifier, typically lasting 9 months. This links a visitor across sessions and is used to identify returning users even before they start a chat.
- **`intercom-session-{app_id}`** — A session cookie that stores session context.

Both cookies are set as soon as the Intercom script initialises. If your cookie banner loads Intercom in the background while displaying a consent prompt, these cookies are already being set — before consent is collected.

This is a common implementation mistake. The banner appears, the user reads it, decides whether to accept — but Intercom has already done its work.

**Your cookie policy must list both cookies explicitly**, including:
- Cookie name (with the `{app_id}` suffix — use your actual app ID)
- Provider: Intercom, Inc.
- Purpose: Live chat, visitor identification, session continuity
- Duration: `intercom-id` is persistent (~9 months); `intercom-session` is session-based
- Category: Analytics / Marketing (not strictly necessary)

If your cookie scanner hasn't picked up these cookies, it's likely because they only appear after Intercom initialises. Scan your site with Intercom loaded to capture them.

---

## Privacy Policy Requirements

Your privacy policy must disclose Intercom as a third-party data processor. Under GDPR Article 13, you must inform users at the time of data collection who receives their data.

**Your privacy policy should include:**

- Intercom, Inc. is used to provide live chat and customer messaging
- Data transferred to Intercom includes: email address, name, IP address, chat history, behavioral events, and any custom attributes passed to the widget
- Intercom processes data in the United States (or EU, if you've enabled EU data hosting)
- Intercom's processing is governed by a signed Data Processing Agreement
- Link to Intercom's own privacy policy: https://www.intercom.com/legal/privacy

If you're passing custom attributes to Intercom — company name, subscription tier, usage metrics, feature flags — these should also be mentioned. The principle of transparency requires users to understand what data you're sharing with third parties and why.

---

## DSAR Handling: Exporting and Deleting User Data from Intercom

Under GDPR, users have the right to:
- **Access** all personal data you hold about them (Article 15)
- **Erasure** — the right to be forgotten (Article 17)
- **Portability** — receive their data in a structured format (Article 20)

When you receive a Data Subject Access Request (DSAR) that includes data held in Intercom, you need to be able to respond within 30 days.

**Exporting user data from Intercom:**

1. Go to your Intercom workspace
2. Search for the user by email or user ID in the **Contacts** section
3. Open the contact record — this shows all attributes, conversation history, events, and notes
4. Use **Export** → **CSV** to download contact data, or use the Intercom API to pull a full data dump:

```bash
# Get a single contact by email via Intercom API
curl https://api.intercom.io/contacts/search \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "field": "email",
      "operator": "=",
      "value": "user@example.com"
    }
  }'
```

**Deleting user data from Intercom:**

For erasure requests, you can delete a contact and their associated data:

1. In the contact record, click the **...** menu → **Delete contact**
2. Confirm deletion — this removes the contact and their conversation history

Via the API:

```bash
# Delete a contact by ID
curl -X DELETE https://api.intercom.io/contacts/{contact_id} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Important caveats:**
- Deleting a contact removes their profile but conversation transcripts may be retained in your workspace's message archive
- Intercom's own backup and retention systems may hold data for additional periods — your DPA covers how they handle deletion requests
- If you've exported or synced Intercom data to other systems (CRM, data warehouse), those copies must also be addressed in your DSAR response

---

## Messenger Data Retention Settings

Intercom allows you to configure how long conversation data is retained. This is relevant both for compliance and for DSAR handling.

**Where to find retention settings:**

Go to **Settings → Security → Data Retention**. Here you can configure:

- **Conversation retention period** — how long closed conversations are retained before automatic deletion
- **Contact data retention** — how long inactive contact records are kept

Setting a defined retention period helps demonstrate compliance with GDPR's storage limitation principle (Article 5(1)(e)): personal data should not be kept longer than necessary.

A reasonable default for most SaaS companies: retain conversations for 24 months after closure, delete inactive contacts after 36 months of inactivity. Document your retention decisions in your Record of Processing Activities (RoPA).

---

## Identified vs Unidentified Visitors: The Privacy Distinction That Matters

Intercom distinguishes between two types of users, and this distinction has significant GDPR implications:

**Identified visitors** are users you've explicitly identified by passing data to Intercom — typically logged-in customers where you call `window.Intercom('update', { email: '...', user_id: '...' })`. Intercom creates a persistent contact record linking all their conversations, events, and attributes to their identity.

**Unidentified visitors** are anonymous — they haven't provided any identifying information. Intercom still tracks them via the `intercom-id-*` cookie, accumulating behavioral data (pages visited, time on site, events) that persists across sessions.

**Why this matters for GDPR:**

For identified users, you're likely processing data under a contract or legitimate interest basis (they're your customers). But you should still disclose Intercom's role in your privacy policy.

For unidentified visitors, the situation is more complex. Intercom is setting a persistent cookie and tracking behavior across sessions without the user providing any information. This requires:

1. Explicit consent before the Intercom script loads
2. Disclosure of the `intercom-id-*` cookie in your cookie policy
3. A mechanism for unidentified visitors to opt out

Consider whether you need Intercom to track anonymous visitors at all. If your main use case is customer support for logged-in users, you can restrict Intercom to authenticated pages only — avoiding the consent complexity for anonymous visitors entirely.

---

## Practical Checklist: 7 Things to Configure

Here's the Intercom GDPR compliance checklist for technical founders:

1. **Sign the DPA** — Go to Settings → Legal → Data Processing Agreement in your Intercom workspace and sign it. This is non-negotiable.

2. **Enable EU data hosting** (if applicable) — If your users are primarily EU-based, ensure you're on a plan that supports EU data residency and that your data region is set to EU.

3. **Conditional widget loading** — Do not load the Intercom script until the user has consented. Implement consent-gated initialisation as shown above.

4. **Update your cookie policy** — List `intercom-id-{app_id}` and `intercom-session-{app_id}` with accurate duration and purpose descriptions.

5. **Update your privacy policy** — Disclose Intercom as a data processor, what data you share, and link to their privacy policy.

6. **Configure data retention** — Set a defined retention period for conversations and inactive contacts under Settings → Security → Data Retention.

7. **Document your DSAR process** — Know how to export and delete user data from Intercom before you receive your first request, not after.

---

## Is Intercom Loading on Your Site Before Consent?

Most Intercom GDPR problems aren't intentional — teams just don't realise the widget is firing before consent. The Intercom snippet gets added to a tag manager or base template, and nobody checks whether it respects the consent state.

If you want to know whether Intercom (or other third-party tools) are loading before consent on your site, scan it with Custodia. The free scanner detects trackers that fire before consent, including Intercom, and flags them specifically.

Scan your site at [https://app.custodia-privacy.com](https://app.custodia-privacy.com) — no signup required, results in 60 seconds.

---

*Last updated: March 27, 2026*
