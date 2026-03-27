# Website Privacy Audit Checklist: 30 Things to Verify Before Your Next Compliance Review

*A practical, do-it-yourself checklist for business owners who want to know exactly where their site stands on privacy — before hiring a consultant or paying for a tool.*

---

Most privacy problems aren't discovered by regulators first. They're discovered by a developer who quietly added a third-party script, or by a customer who noticed a tracker firing before they clicked "Accept."

A privacy audit doesn't require a law degree. It requires going through your site systematically and verifying — not assuming — that the basics are in place. This checklist gives you 30 specific things to check, organized into six areas. Work through it and you'll know exactly where you stand.

---

## Section 1: Data Collection Inventory

Before you can comply with any privacy law, you need to know what your website collects. Most business owners think they know — most are wrong. Plugins, widgets, and third-party scripts collect data without the site owner's knowledge.

- [ ] **Know every cookie set on your site (first- and third-party).** Open DevTools (Application > Cookies), load your site without consenting, and list every cookie already set. Note the name, domain, and purpose for each. First-party cookies are set by your domain; third-party by external services.

- [ ] **Know every tracking pixel and script loading on your pages.** In DevTools, open the Network tab, filter by "Script," and reload. Every external script URL is a potential data collection point. Check your homepage, a product page, and checkout — they often differ.

- [ ] **Know every third party receiving visitor data.** In the Network tab, look for requests to external domains. Every domain that receives a request gets some data (at minimum, the visitor's IP). Common examples: Google, Meta, HubSpot, Hotjar, Intercom, Stripe.

- [ ] **Know what data your forms collect and where it goes.** Audit every form — contact, newsletter, checkout, login. For each: what fields are collected, what service receives it, and where is it stored?

- [ ] **Know what data is stored in local/session storage.** In DevTools (Application > Local Storage / Session Storage), check what your site stores. Some tools store identifiers here to track users across sessions or bypass cookie consent.

---

## Section 2: Consent & Cookie Banner

The most common failure: the banner is visible but the cookies are already firing. Here's how to verify yours actually works.

- [ ] **Non-essential cookies are blocked until consent is given — not just hidden.** Before clicking anything, open DevTools > Network and reload. You should see zero requests to analytics or advertising domains. If Google Analytics fires before you click Accept, your banner is cosmetic, not functional.

- [ ] **Accept and Reject buttons are equally prominent.** The Reject button must be as visible as Accept — same size, same contrast, not buried in a submenu. Pre-ticked boxes and misleadingly colored buttons are dark patterns regulators are actively enforcing against.

- [ ] **Consent records are stored with timestamp and choices made.** Test your consent flow, then check your backend or consent provider's dashboard. Each record should show: when they consented, which categories they accepted, and what banner version they saw.

- [ ] **Visitors can change consent preferences at any time.** Look for a consent preferences link in your site footer. It should reopen the banner and allow visitors to modify or withdraw their choices. Withdrawal must be as easy as giving consent.

- [ ] **Google Consent Mode v2 signals are sent correctly (if using Google Ads/Analytics).** Open Tag Assistant or check GTM — you should see `gtag('consent', 'default', {...})` firing on page load before any other Google tags, with `ad_storage`, `analytics_storage`, and `ad_user_data` updating based on visitor choice.

- [ ] **EU visitors get GDPR opt-in; California visitors get CCPA opt-out.** Use a VPN to simulate an EU IP — your banner should require opt-in before cookies fire. Simulate a California IP — visitors should get an opt-out option. These are different legal frameworks requiring different flows.

---

## Section 3: Privacy Policy

Your privacy policy is a legal disclosure, not a formality — and regulators cite incomplete policies in enforcement actions.

- [ ] **Privacy policy exists and is accessible from every page.** A link should appear in the footer of every page — not just the homepage. Click through five pages and verify the link is present and functional on each one.

- [ ] **Policy names specific third-party services — not just "analytics providers."** If it says "we use analytics providers" without naming Google Analytics or Hotjar, it's incomplete. List every third-party service by name.

- [ ] **Policy covers all jurisdictions you serve.** EU customers require GDPR disclosures; California customers require CCPA disclosures. Check whether your policy addresses each law's requirements, not just privacy in the abstract.

- [ ] **Policy includes retention periods, legal bases (GDPR), and data rights.** For each data category, state how long you keep it, your GDPR legal basis (consent, legitimate interest, contract, etc.), and what rights users have.

- [ ] **Policy is current — updated when your data practices last changed.** Check the "last updated" date. If HubSpot was added six months ago and your policy predates it, your policy is out of date.

---

## Section 4: Data Subject Rights

Having data subject rights in your policy means nothing if you can't actually fulfill them. GDPR gives EU residents 30 days; CCPA gives California residents 45 days.

- [ ] **There is a way for visitors to submit access and deletion requests.** Your site needs a visible mechanism — a dedicated form, a labeled email address, or a self-service portal. Test it: can you submit a request in under two minutes?

- [ ] **You know where personal data lives across all your systems.** List every system holding personal data: CRM, email platform, analytics, payment processor, support desk, databases. When a deletion request arrives, you need to fulfill it across all of them.

- [ ] **You have a process to respond within 30 days (GDPR) / 45 days (CCPA).** Someone must be notified when a request arrives, a deadline tracked, and a workflow defined for verifying identity, gathering data, and responding. A shared inbox with no owner is not a process.

- [ ] **Deletion requests are fulfilled across all systems — not just the main database.** When you delete a user from your app, do you also remove them from your email list, analytics platform, and support history? Test this end-to-end. Most companies find at least one system they missed.

---

## Section 5: Security Basics

Privacy compliance and data security overlap in ways that matter. A breach caused by a preventable vulnerability is also a compliance failure.

- [ ] **HTTPS is enforced across the entire site — no mixed content.** Navigate to your site using `http://` — you should be automatically redirected. Open DevTools > Console and look for "mixed content" warnings indicating resources still loading over HTTP.

- [ ] **CMS and plugins are updated.** Log into your CMS and check for pending updates. Outdated plugins are the most common vector for website compromises. If you're on WordPress, check core, all active plugins, and your theme.

- [ ] **Third-party scripts are loaded only from trusted CDNs.** Review the external script URLs from Section 1. Each should load from a domain you recognize. Scripts from unfamiliar domains are a red flag — script injection via compromised plugins is a real attack vector.

- [ ] **Payment pages don't capture card data before Stripe or PayPal processes it.** Card data should never touch your server. In DevTools, verify that card field input does not appear in any form submission sent to your own domain.

---

## Section 6: Ongoing Monitoring

Privacy compliance has no completion date. Your website changes, and without ongoing monitoring a site that passes this audit today can drift out of compliance within weeks.

- [ ] **New trackers are detected when developers add tools or plugins.** Use a tool that alerts you when a new tracker appears, or run a scan after every significant deployment.

- [ ] **Privacy policy is reviewed and updated at least annually.** Schedule a recurring event: once a year, compare your policy against your actual data practices. New integrations, new jurisdictions, or changed data flows mean the policy needs updating.

- [ ] **There is a process for handling new DSARs when they arrive.** If a request arrived tomorrow, does someone know they own it and know the deadline? A process that exists only in someone's head will break the first time that person is unavailable.

---

## How to Use This Checklist

**Most items require loading your site in a browser.** Open DevTools (F12) and verify each item directly — don't trust that something is configured correctly. Items involving consent records or DSAR intake require logging into your backend or third-party dashboards.

**One-time fixes vs. ongoing monitoring:** Sections 1–5 are primarily one-time fixes. Section 6 items — monitoring, policy reviews, DSAR readiness — are ongoing and need a named owner.

**Prioritize by risk.** Start with Section 2 (consent) and Section 3 (privacy policy) — these are what regulators check first. Section 1 (data inventory) is the foundation everything else builds on.

---

## How Custodia Automates the Hard Parts

Sections 1, 2, and 6 — inventory, consent verification, and ongoing monitoring — are the most technically demanding to maintain manually. Custodia automates all three.

A single scan crawls your site like a real visitor, detects every cookie, tracker, pixel, and third-party script, and maps what fires before and after consent. Weekly re-scans catch new trackers the moment they appear. If your banner has a gap — a cookie firing before opt-in, a missing Consent Mode v2 signal — Custodia flags it with specific remediation steps.

Sections 3, 4, and 5 still require human decisions. But if you're spending hours running scanner tools manually, there's a better use of your time.

**[Run a free privacy scan →](https://app.custodia-privacy.com)**

See every tracker on your site and get a plain-English compliance report in 60 seconds.

---

*Last updated: March 2026*
