# Custodia — Email Sequences

---

## 1. Free Scan Results Email

**Subject line:** Your privacy scan results are ready

**Preview text:** We found {tracker_count} trackers on {domain}. Here's the full report.

---

Hi {first_name},

We just finished scanning **{domain}** and found a few things you should know about.

**Your scan summary:**
- **{tracker_count}** trackers and cookies detected
- **{third_party_count}** third-party services receiving visitor data
- **{compliance_issues_count}** compliance gaps identified

Here are the highlights:

{dynamic_summary — e.g., "Your site sends data to 4 advertising networks without a proper consent mechanism. You're using Google Analytics without a compliant cookie banner. Your privacy policy doesn't mention 3 of the data processors we found."}

**[View your full report →]**

---

The good news: most of these issues can be fixed in about 15 minutes.

Custodia can automatically generate a consent banner, privacy policy, and compliance dashboard based on these exact findings — no templates, no guesswork.

**[Fix these issues with Custodia →]**

Plans start at $29/month. Or just bookmark your report — it's yours to keep.

— The Custodia team

P.S. We re-scanned 1,400 sites this week. The average business has 14 compliance gaps they don't know about. Yours has {compliance_issues_count}.

---

## 2. Onboarding Welcome Email (New Paid User)

**Subject line:** You're all set. Here's what happens next.

**Preview text:** Your site is already being scanned. Compliance dashboard is live.

---

Hi {first_name},

Welcome to Custodia. You just made privacy compliance a lot less painful.

Here's what's already happening:

**1. Your scan is running**
We're crawling **{domain}** right now. In a few minutes, you'll have a complete map of every cookie, tracker, and third-party script on your site.

**2. Your dashboard is live**
Head to your **[compliance dashboard →]** to see your status across GDPR, CCPA, and applicable state laws. We'll flag exactly what needs attention.

**3. Next steps (takes ~15 minutes):**
- [ ] **Deploy your consent banner** — We've generated one based on your scan. Review it, customize the colors, and add the snippet to your site. [How to deploy →]
- [ ] **Review your privacy policy** — Auto-generated from your actual data practices. Read through it, make any edits, and publish. [Review your policy →]
- [ ] **Set up monitoring** — Weekly scans are on by default. Add your email to get instant alerts when something changes. [Configure alerts →]

That's it. Once those three are done, you're compliant — and Custodia keeps you that way.

**[Go to your dashboard →]**

Questions? Reply to this email. A real person will answer.

— The Custodia team

---

## 3. Weekly Compliance Report Email

**Subject line:** Weekly compliance report for {domain}

**Preview text:** {status_summary — e.g., "All green" or "2 new issues found"}

---

Hi {first_name},

Here's your weekly privacy compliance report for **{domain}**.

---

**Overall status: {status_emoji} {status_label}**

{if_all_green}
Everything looks good. No new trackers detected, consent banner is functioning correctly, and your policies are up to date. Nothing to do this week.
{/if_all_green}

{if_issues_found}
We found **{new_issue_count}** new issue(s) since your last scan:

{issue_list — e.g.:
- ⚠️ **New tracker detected:** A HubSpot tracking script was added to /pricing. It's not covered by your consent banner yet. [Fix this →]
- 🔴 **Policy out of date:** Your privacy policy doesn't mention Stripe as a payment processor, but we detected Stripe.js on your checkout page. [Update policy →]
}

**[View full report in dashboard →]**
{/if_issues_found}

---

**Scan details:**
- Pages crawled: {pages_crawled}
- Trackers detected: {tracker_count}
- Consent banner status: {banner_status}
- Privacy policy status: {policy_status}
- Next scan: {next_scan_date}

---

Compliance changes this week:
{regulatory_updates — e.g., "No new regulatory changes affecting your compliance posture." or "Texas Data Privacy and Security Act takes effect July 1. Custodia has updated your dashboard to include TDPSA requirements."}

— The Custodia team

You're receiving this because you have weekly reports enabled. [Manage email preferences →]

---

## 4. Trial Ending Email (3 days before)

**Subject line:** Your Custodia trial ends in 3 days

**Preview text:** Keep your compliance stack running. Here's what you'd lose.

---

Hi {first_name},

Your 14-day trial of Custodia **{plan_name}** ends on **{trial_end_date}**.

Here's what Custodia has done for **{domain}** so far:

- **{tracker_count}** trackers identified and classified
- **{consent_interactions}** consent interactions managed
- **{policy_views}** privacy policy page views served
- **{issues_caught}** compliance issues caught and resolved

If your trial expires without upgrading:
- Your consent banner will stop showing
- Your hosted privacy policy will go offline
- Compliance monitoring and alerts will pause
- Your dashboard data stays saved — you can pick up where you left off anytime

**[Keep your compliance active →]**

Plans start at $29/month for 1 site. Cancel anytime.

— The Custodia team
