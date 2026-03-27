# Custodia Email Nurture Sequence

Triggered from Resend on blog subscribe.
Welcome email fires immediately on signup (already implemented via `/api/public/blog-subscribe`).

---

## Email 1 — Welcome (already live)
- Fires: immediately on subscribe
- From: hello@custodia-privacy.com
- Subject: "Welcome to Custodia — here's where to start"

---

## Email 2 — Day 3: Education + Re-engagement

**Subject:** The 3 things most websites get wrong about privacy compliance

**Preview text:** And how to check if you have any of them.

---

If you haven't had a chance to run a scan on your site yet, here's what the tool typically finds — and why each one matters.

**1. Third-party scripts loading before consent**

Most websites load Google Analytics, Meta Pixel, or similar tools before the user has agreed to anything. Under GDPR, that's a violation — consent must come *before* data collection, not after. We see this on roughly 70% of the sites we scan.

**2. A cookie banner that doesn't actually block cookies**

A surprising number of consent banners are decorative. The banner appears, the user clicks "Decline," but the cookies are already set. The banner is UI, not enforcement. Real consent management actually prevents scripts from firing.

**3. A privacy policy that doesn't match the actual tech stack**

If you installed a plugin six months ago and never updated your policy, you have undisclosed processors. That's a compliance gap — and it's the kind of thing that's embarrassing to explain to a regulator.

The good news: all three are fixable in an afternoon with the right tools.

→ **[Scan your website free — no signup required](https://app.custodia-privacy.com)**

The scan runs in under 60 seconds and shows exactly what's on your site.

— The Custodia team

---

## Email 3 — Day 7: Conversion

**Subject:** Your 5-step compliance checklist (steal this)

**Preview text:** Takes about an afternoon. Covers 90% of what a privacy audit would catch.

---

If you've been putting off privacy compliance because it feels overwhelming, here's the shortest path through it.

**The 5-step checklist:**

☐ **1. Know what's on your site.**
Run a scan. You can't fix what you don't know about. Most businesses find 3–8 trackers they forgot were there.

☐ **2. Get a consent banner that actually works.**
Not a decorative one — one that blocks scripts before consent and logs timestamped records. If a regulator asks for proof of consent, you need records.

☐ **3. Update your privacy policy.**
It should reflect your actual tech stack: your payment processor, email tool, analytics provider, and any tracking pixels. Generic templates fail here.

☐ **4. Set up a way to handle data requests (DSARs).**
Under GDPR you have 30 days to respond. Under CCPA it's 45. You need: an intake form, a process, and documentation. Even one missed request can trigger a complaint.

☐ **5. Schedule a re-audit.**
Your tech stack changes. New plugins, new ad tools, new integrations — all of them affect your compliance posture. Set a quarterly reminder.

Custodia automates steps 1–4 and reminds you about step 5.

Plans start at $29/month. Most businesses are fully set up in under an hour.

→ **[Start your free trial](https://app.custodia-privacy.com/signup)**

— The Custodia team

---

## Implementation Notes

**How to implement in Resend:**
1. Create a new Broadcast or use Resend's scheduled contact emails
2. Currently Resend doesn't natively support drip sequences — need to either:
   a. Use Resend webhooks + cron to fire emails at day 3 and day 7 after contact creation
   b. Use a third-party automation tool (Loops, Customer.io)
   c. Implement a cron job in the app that queries Resend contacts by creation date and sends via Resend API

**Recommended approach (app-side cron):**
- Add a `POST /api/cron/nurture-emails` route (protected by cron secret)
- Query Resend audience for contacts created 3 days ago → send Email 2
- Query Resend audience for contacts created 7 days ago → send Email 3
- Set up a daily cron in Vercel or PM2

**Sender:** hello@custodia-privacy.com
**From name:** The Custodia team
**Reply-to:** hello@custodia-privacy.com
