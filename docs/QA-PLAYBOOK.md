# Custodia Autonomous QA Playbook

**Purpose:** This playbook defines how the AI QA agent evaluates Custodia as if it were the CEO, CTO, CMO, and head of product — all in one. The goal is not "does it return 200" but "would I be proud to show this to an investor, a customer, or put it on Product Hunt?"

**SOTA Benchmarks:** Evaluate every page against the best SaaS products in the world:
- **Design:** Stripe, Linear, Vercel, Notion, Raycast
- **UX:** Figma, Superhuman, Arc Browser
- **Landing pages:** Lemon Squeezy, Resend, Clerk
- **Compliance/Privacy:** OneTrust, Osano, CookieBot (competitive comparison)

---

## Part 1: Visual & Design Audit

For EVERY page, take a screenshot and evaluate:

### Pages to Test

**Public (no auth required):**
1. Landing page: `https://app.custodia-privacy.com/`
2. Pricing page: `https://app.custodia-privacy.com/pricing`
3. Login page: `https://app.custodia-privacy.com/login`
4. Signup page: `https://app.custodia-privacy.com/signup`
5. Forgot password: `https://app.custodia-privacy.com/forgot-password`

**Authenticated (login required — use test account):**
6. Dashboard: `/dashboard`
7. Sites list: `/sites`
8. Site detail + scans: `/sites/[siteId]`
9. Banner config: `/sites/[siteId]/banner`
10. Policy generator: `/sites/[siteId]/policy`
11. DSARs list: `/dsars`
12. DSAR detail: `/dsars/[requestId]`
13. Assessments: `/assessments`
14. Vendors: `/vendors`
15. Preferences: `/preferences`
16. Agents: `/agents`
17. Assistant: `/assistant`
18. Settings: `/settings`

### Evaluation Criteria Per Page

For each screenshot, evaluate on a 1-10 scale:

| Criterion | What to look for |
|-----------|-----------------|
| **Visual polish** | Does it look like a $50M Series B product or a weekend hackathon? |
| **Typography** | Font choices, hierarchy, weight contrast, line height, letter spacing |
| **Color & contrast** | Palette cohesion, WCAG compliance, dark mode quality |
| **Spacing & alignment** | Consistent grid, optical alignment, breathing room |
| **Component quality** | Buttons, inputs, cards, tables — do they feel crafted? |
| **Responsive** | Does it work at 375px, 768px, 1024px, 1440px? |
| **Information density** | Right amount of info? Too sparse? Too cramped? |
| **Empty states** | What does the page look like with no data? Is it helpful? |
| **Loading states** | Skeletons, spinners, or does content just pop in? |
| **Error states** | What happens when things go wrong? Graceful or confusing? |

### Design Red Flags (auto-fail)
- Generic placeholder text ("Lorem ipsum", default Next.js copy)
- Broken images or missing icons
- Text overflow or truncation
- Inconsistent spacing between similar elements
- Different button styles for the same action type
- Content touching edges (no padding)
- Unreadable text (contrast ratio < 4.5:1)

---

## Part 2: UX & Flow Testing

### Critical User Flows (test each end-to-end)

**Flow 1: First-time visitor → signup**
1. Land on homepage — is the value prop clear in 5 seconds?
2. Try the free scan — does it work? Is feedback immediate?
3. Click "Start Free Trial" — does it go to signup?
4. Complete signup — is it smooth? What happens after?
5. First dashboard view — is onboarding clear? What should I do first?

**Flow 2: Returning user → daily workflow**
1. Login — how fast? Any friction?
2. Dashboard — do I immediately see what matters?
3. Check latest scan results — easy to find?
4. Review compliance score — actionable insights?
5. Check for new DSARs — clear status?

**Flow 3: Free scan → conversion**
1. Enter URL on landing page
2. Watch scan progress — is the UX good during the wait?
3. View results — are they compelling enough to sign up?
4. CTA after results — is the upgrade path obvious and appealing?

**Flow 4: DSAR intake (external user submitting a request)**
1. Visit public DSAR form
2. Fill out the form — is it intuitive?
3. Submit — is there confirmation?

### UX Evaluation Criteria

| Criterion | What to look for |
|-----------|-----------------|
| **Intuitiveness** | Could my mom figure out what to do? |
| **Feedback** | Does every action have a visible result? |
| **Speed** | Does anything feel slow? Spinners > 2 seconds? |
| **Navigation** | Can I find everything in < 3 clicks? |
| **Consistency** | Same patterns for same actions everywhere? |
| **Delight** | Any moments of "oh, that's nice"? |
| **Confusion** | Any moment of "wait, what?" |
| **Dead ends** | Any page where I don't know what to do next? |

---

## Part 3: Marketing & Positioning Audit

### Landing Page Evaluation
- **Above the fold:** Does it pass the 5-second test? (stranger understands value in 5s)
- **Social proof:** Testimonials, logos, metrics? Or empty trust?
- **CTA clarity:** Is there one clear primary action?
- **Objection handling:** FAQ addresses real concerns?
- **Competitive differentiation:** Why Custodia over CookieBot/OneTrust?
- **Pricing psychology:** Anchored correctly? Value tiers clear?

### Copy Evaluation
- Is the voice consistent? (professional but approachable)
- Are benefits emphasized over features?
- Is there urgency without being sleazy?
- Does the copy match the sophistication of the design?

### SEO Basics
- Page titles unique and descriptive?
- Meta descriptions present?
- H1/H2 hierarchy correct?
- Alt text on images?
- Canonical URLs set?

---

## Part 4: Technical Quality

### Performance
- Time to first meaningful paint (should be < 1.5s)
- Largest contentful paint (should be < 2.5s)
- Any layout shifts? (CLS should be < 0.1)
- Bundle size reasonable?

### Errors
- Any console errors?
- Any failed network requests?
- Any unhandled exceptions?

### Security (surface-level)
- CSP headers present?
- HSTS enabled?
- No sensitive data in URLs?
- Forms have CSRF protection?

---

## Part 5: Report Format

Write the report to: `swarm-company/reports/qa/qa-audit-YYYY-MM-DD-{am|pm}.md`

### Report Structure

```markdown
# Custodia QA Audit — [Date] [AM/PM]

## Overall Grade: [A/B/C/D/F] — [one sentence summary]

## SOTA Gap Score: [X/10]
How close is Custodia to the quality bar of Stripe/Linear/Vercel?

## Top 3 Things That Are Great
1. [specific, with screenshot reference]
2. ...
3. ...

## Top 5 Things to Fix (Priority Order)
1. [specific issue] — [which page] — [suggested fix] — [effort: S/M/L]
2. ...

## Page-by-Page Scores
| Page | Visual | UX | Copy | Score |
|------|--------|-----|------|-------|
| Landing | 8/10 | 7/10 | 8/10 | 7.7 |
| ... | ... | ... | ... | ... |

## Flow Test Results
| Flow | Completed? | Friction Points | Notes |
|------|-----------|-----------------|-------|
| Signup | Yes/No | ... | ... |

## Competitive Gap
What are CookieBot/OneTrust doing that we're not?
What are we doing better?

## Improvement Tasks
[List specific, actionable tasks that should be filed as ClawTeam work]
```

---

## Part 6: After the Report

1. **File improvement tasks** as ClawTeam tasks if a team exists
2. **Update the QA state file:** `swarm-company/state/last_qa_audit`
3. **Compare with previous audit** — note what improved and what regressed
4. If critical issues found, notify via:
   `clawteam inbox broadcast custodia-v2 "QA ALERT: [critical issue found]"`

---

## Test Account

For authenticated testing, use whatever test account exists in the database.
If no test account exists, create one via signup and document the credentials
in `swarm-company/state/qa-test-account` (email/password only, no secrets).

## MCP Tools Available

- `mcp__pagebolt__take_screenshot` — styled screenshots of any URL
- `mcp__pagebolt__inspect_page` — get page elements and selectors
- `mcp__puppeteer__puppeteer_navigate` — navigate browser
- `mcp__puppeteer__puppeteer_screenshot` — capture current state
- `mcp__puppeteer__puppeteer_click` — interact with elements
- `mcp__puppeteer__puppeteer_fill` — fill forms
- `mcp__puppeteer__puppeteer_evaluate` — run JS in page
