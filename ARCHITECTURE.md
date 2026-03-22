# Custodia — Architecture Document

**Version:** 1.0
**Date:** 2026-03-22
**Author:** Software Architect

---

## 1. Overview

Custodia is a privacy & compliance SaaS for solo founders and SMBs (5–50 people). It provides AI-powered website scanning, smart cookie consent banners, privacy policy generation, a compliance dashboard, and ongoing monitoring — priced at $29–49/month.

**Domain:** `custodia-privacy.com`

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Auth | NextAuth.js v5 (Auth.js) |
| Payments | Stripe Checkout + Webhooks |
| Scanner Engine | Playwright (headless Chromium) |
| AI | Anthropic Claude API (claude-sonnet-4-6) |
| Queue/Jobs | BullMQ + Redis |
| Email | Resend |
| Hosting | Vercel (app) + Railway/Fly.io (scanner worker) |
| Email | Resend |
| Hosting | Vercel (app) + Fly.io (scanner worker) |

---

## 3. Project Structure

Single Next.js application with a co-located scanner worker:

```
custodia/
├── ARCHITECTURE.md              # This file
├── package.json                 # All dependencies
├── .env.example                 # Environment variable template
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── tsconfig.json
│
├── prisma/
│   └── schema.prisma            # Database schema (Prisma ORM)
│
├── src/
│   ├── app/
│   │   ├── page.tsx             # Landing page (root)
│   │   ├── layout.tsx           # Root layout
│   │   ├── globals.css          # Tailwind + brand colors
│   │   │
│   │   ├── (marketing)/         # Public marketing pages
│   │   │   ├── pricing/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (auth)/              # Login, signup
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/         # Authenticated app
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── sites/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [siteId]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── scans/page.tsx
│   │   │   │       ├── banner/page.tsx
│   │   │   │       └── policy/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── webhooks/stripe/route.ts
│   │       ├── trpc/[trpc]/route.ts
│   │       └── banner/[siteId]/route.ts   # Public banner script
│   │
│   ├── components/
│   │   ├── ui/                  # Shared UI primitives
│   │   ├── landing/             # Landing page sections
│   │   ├── dashboard/           # Dashboard components
│   │   ├── banner/              # Banner preview/editor
│   │   ├── navbar.tsx
│   │   └── footer.tsx
│   │
│   ├── lib/
│   │   ├── auth.ts              # NextAuth config
│   │   ├── stripe.ts            # Stripe client + plan config
│   │   └── utils.ts             # cn(), helpers
│   │
│   ├── server/
│   │   ├── trpc.ts              # tRPC init, context, procedures
│   │   ├── root.ts              # Root tRPC router
│   │   └── routers/
│   │       ├── site.ts
│   │       ├── scan.ts
│   │       ├── banner.ts
│   │       ├── policy.ts
│   │       ├── billing.ts
│   │       └── user.ts
│   │
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types
│   │
│   └── proxy.ts                 # Next.js 16 proxy (was middleware)
│
└── scanner/                     # Scanner worker (separate deploy)
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts             # BullMQ worker entry point
        ├── crawler.ts           # Playwright site crawler
        ├── analyzers/
        │   ├── cookies.ts       # Cookie classification
        │   ├── trackers.ts      # Tracker detection
        │   ├── scripts.ts       # Script analysis
        │   └── data-collection.ts
        ├── ai/
        │   ├── summarizer.ts    # AI scan summary
        │   └── policy-gen.ts    # AI privacy policy generator
        └── utils/
            ├── known-trackers.ts
            └── cookie-db.ts
```

---

## 4. Database Schema

### Entity Relationship Summary

```
User 1──* Organization *──* Site 1──* Scan 1──* Finding
                                   1──1 Banner
                                   1──1 Policy
Organization 1──1 Subscription
```

### Core Tables

#### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| email | varchar(255) | unique, not null |
| name | varchar(255) | |
| password_hash | varchar(255) | nullable (OAuth users) |
| email_verified_at | timestamp | |
| image | text | avatar URL |
| created_at | timestamp | default now() |
| updated_at | timestamp | |

#### organizations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | varchar(255) | |
| slug | varchar(100) | unique |
| plan | enum | free, starter, pro |
| stripe_customer_id | varchar(255) | nullable |
| stripe_subscription_id | varchar(255) | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

#### org_members
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK → organizations |
| user_id | uuid | FK → users |
| role | enum | owner, admin, member |
| created_at | timestamp | |

#### sites
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| org_id | uuid | FK → organizations |
| domain | varchar(255) | not null |
| name | varchar(255) | display name |
| verified | boolean | domain ownership verified |
| monitoring_enabled | boolean | default true |
| scan_frequency | enum | daily, weekly, monthly |
| last_scanned_at | timestamp | nullable |
| compliance_score | integer | 0–100, nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

#### scans
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| site_id | uuid | FK → sites |
| status | enum | queued, running, completed, failed |
| scan_type | enum | full, quick, monitoring |
| pages_crawled | integer | default 0 |
| started_at | timestamp | nullable |
| completed_at | timestamp | nullable |
| summary | jsonb | AI-generated summary |
| raw_data | jsonb | Full scan data |
| compliance_scores | jsonb | Per-regulation scores |
| created_at | timestamp | |

#### findings
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| scan_id | uuid | FK → scans |
| site_id | uuid | FK → sites |
| category | enum | cookie, tracker, script, data_collection, consent, policy |
| severity | enum | critical, warning, info, ok |
| title | varchar(500) | |
| description | text | Plain English explanation |
| recommendation | text | How to fix |
| details | jsonb | Category-specific data |
| regulation | varchar(50)[] | Affected regulations (GDPR, CCPA, etc.) |
| page_url | text | Where found |
| first_seen_at | timestamp | |
| last_seen_at | timestamp | |
| resolved_at | timestamp | nullable |
| created_at | timestamp | |

#### banners
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| site_id | uuid | FK → sites, unique |
| enabled | boolean | default false |
| config | jsonb | See Banner Config schema below |
| published_config | jsonb | Last deployed config |
| published_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

#### policies
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| site_id | uuid | FK → sites, unique |
| content_html | text | Rendered policy HTML |
| content_markdown | text | Policy in markdown |
| version | integer | Auto-incremented |
| based_on_scan_id | uuid | FK → scans |
| generated_at | timestamp | |
| published_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

#### consent_logs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| site_id | uuid | FK → sites |
| visitor_id | varchar(255) | Anonymous hash |
| ip_country | varchar(2) | ISO country code |
| jurisdiction | varchar(20) | GDPR, CCPA, etc. |
| consent_given | jsonb | { necessary: true, analytics: false, ... } |
| action | enum | accept_all, reject_all, customize, dismiss |
| user_agent | text | |
| created_at | timestamp | |

#### alerts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| site_id | uuid | FK → sites |
| org_id | uuid | FK → organizations |
| type | enum | new_tracker, compliance_drop, scan_failed, policy_outdated |
| title | varchar(500) | |
| message | text | |
| severity | enum | critical, warning, info |
| read_at | timestamp | nullable |
| created_at | timestamp | |

### Banner Config JSON Schema

```json
{
  "position": "bottom" | "bottom-left" | "bottom-right" | "center",
  "theme": "light" | "dark" | "auto",
  "primaryColor": "#4F46E5",
  "showLogo": true,
  "customCss": "",
  "content": {
    "title": "We value your privacy",
    "description": "We use cookies to enhance your browsing experience...",
    "acceptAllText": "Accept All",
    "rejectAllText": "Reject All",
    "customizeText": "Customize",
    "privacyPolicyUrl": "/privacy"
  },
  "categories": [
    {
      "key": "necessary",
      "name": "Necessary",
      "description": "Essential for the website to function",
      "required": true,
      "cookies": ["session_id", "csrf_token"]
    },
    {
      "key": "analytics",
      "name": "Analytics",
      "description": "Help us understand how visitors interact",
      "required": false,
      "cookies": ["_ga", "_gid"]
    }
  ],
  "regulations": {
    "gdpr": { "enabled": true, "mode": "opt-in" },
    "ccpa": { "enabled": true, "mode": "opt-out" }
  }
}
```

---

## 5. API Design (tRPC Routers)

We use tRPC for type-safe API communication. All routes are authenticated unless noted.

### site router

| Procedure | Type | Input | Output | Notes |
|-----------|------|-------|--------|-------|
| `site.list` | query | — | `Site[]` | All sites in user's org |
| `site.get` | query | `{ siteId }` | `Site & { latestScan, banner, policy }` | |
| `site.create` | mutation | `{ domain, name }` | `Site` | Triggers initial scan |
| `site.update` | mutation | `{ siteId, name?, monitoring?, scanFrequency? }` | `Site` | |
| `site.delete` | mutation | `{ siteId }` | `void` | Soft delete |
| `site.verify` | mutation | `{ siteId }` | `{ verified, method }` | DNS/meta tag verification |

### scan router

| Procedure | Type | Input | Output | Notes |
|-----------|------|-------|--------|-------|
| `scan.list` | query | `{ siteId, limit?, cursor? }` | `Scan[]` | Paginated |
| `scan.get` | query | `{ scanId }` | `Scan & { findings[] }` | |
| `scan.trigger` | mutation | `{ siteId, type? }` | `Scan` | Enqueues scan job |
| `scan.quick` | mutation | `{ url }` | `QuickScanResult` | **Public** — free scan for lead gen |
| `scan.compare` | query | `{ scanId1, scanId2 }` | `ScanDiff` | Compare two scans |

### banner router

| Procedure | Type | Input | Output | Notes |
|-----------|------|-------|--------|-------|
| `banner.get` | query | `{ siteId }` | `Banner` | |
| `banner.update` | mutation | `{ siteId, config }` | `Banner` | |
| `banner.publish` | mutation | `{ siteId }` | `Banner` | Deploys config |
| `banner.preview` | query | `{ siteId }` | `{ html, css, js }` | Preview snippet |

### policy router

| Procedure | Type | Input | Output | Notes |
|-----------|------|-------|--------|-------|
| `policy.get` | query | `{ siteId }` | `Policy` | |
| `policy.generate` | mutation | `{ siteId }` | `Policy` | AI generates from scan |
| `policy.update` | mutation | `{ siteId, contentMarkdown }` | `Policy` | Manual edits |
| `policy.publish` | mutation | `{ siteId }` | `Policy` | |
| `policy.versions` | query | `{ siteId }` | `PolicyVersion[]` | Version history |

### billing router

| Procedure | Type | Input | Output | Notes |
|-----------|------|-------|--------|-------|
| `billing.getSubscription` | query | — | `Subscription` | |
| `billing.createCheckout` | mutation | `{ plan }` | `{ url }` | Stripe Checkout URL |
| `billing.createPortal` | mutation | — | `{ url }` | Stripe Customer Portal |
| `billing.usage` | query | — | `{ sites, scans, limits }` | |

### user router

| Procedure | Type | Input | Output | Notes |
|-----------|------|-------|--------|-------|
| `user.me` | query | — | `User & { org }` | |
| `user.update` | mutation | `{ name?, email? }` | `User` | |
| `user.inviteTeamMember` | mutation | `{ email, role }` | `void` | |
| `user.listTeamMembers` | query | — | `OrgMember[]` | |

---

## 6. Scanner Architecture

The scanner runs as a **separate worker process** (not in Vercel) because headless browser crawling is long-running and resource-intensive.

### Flow

```
[User triggers scan] → [tRPC mutation] → [BullMQ job enqueued]
                                                  ↓
                                         [Scanner Worker]
                                                  ↓
                                    ┌─────────────────────────┐
                                    │  1. Launch Playwright    │
                                    │  2. Navigate to site     │
                                    │  3. Crawl pages (max 50) │
                                    │  4. For each page:       │
                                    │     - Capture cookies     │
                                    │     - Detect trackers     │
                                    │     - Analyze scripts     │
                                    │     - Find forms/inputs   │
                                    │  5. AI summarization      │
                                    │  6. Compliance scoring    │
                                    │  7. Save results to DB    │
                                    │  8. Generate findings     │
                                    └─────────────────────────┘
                                                  ↓
                                    [WebSocket/polling update to client]
```

### Compliance Scoring

Each regulation gets a 0–100 score based on weighted findings:

| Regulation | Key Checks |
|-----------|-----------|
| GDPR | Cookie consent before tracking, policy exists, legal basis documented, data processor list |
| CCPA | "Do not sell" link present, opt-out mechanism, policy includes CCPA disclosures |
| State Laws | Varies — mapped from a regulations database |

Overall score = weighted average across applicable regulations.

### Quick Scan (Public / Lead Gen)

A lightweight scan that:
- Crawls only the homepage
- Identifies cookies and trackers
- Returns a summary with 3–5 key findings
- Requires email to see full results → lead capture

---

## 7. Banner SDK Architecture

The consent banner is delivered as a lightweight JavaScript bundle (~15KB gzipped) loaded via a `<script>` tag.

```html
<script src="https://custodia-privacy.com/api/banner/SITE_ID" async></script>
```

### Behavior

1. Fetches banner config + cookie categories from API (cached at edge)
2. Detects visitor jurisdiction via IP geolocation (Cloudflare headers or MaxMind)
3. Checks existing consent cookie
4. If no consent: renders banner per jurisdiction rules
   - GDPR visitors: opt-in (block trackers until consent)
   - CCPA visitors: opt-out (allow tracking, show "Do Not Sell" link)
5. On user action: stores consent, fires callback to enable/disable cookie categories
6. Logs consent event to Custodia API

---

## 8. Authentication & Authorization

- **NextAuth.js v5** with email/password + Google OAuth + GitHub OAuth
- Sessions stored as JWTs (for Vercel edge compatibility)
- Organization-based access control: users belong to an org, sites belong to an org
- Role-based: `owner` > `admin` > `member`
- API routes check org membership via tRPC middleware

---

## 9. Background Jobs (BullMQ)

| Queue | Job | Schedule |
|-------|-----|----------|
| `scan` | Full site scan | On-demand + scheduled |
| `scan` | Quick scan | On-demand (public) |
| `monitoring` | Weekly monitoring scan | Cron: `0 3 * * 1` |
| `policy` | Regenerate policy after scan | After scan completion |
| `alerts` | Check compliance changes | After scan completion |
| `email` | Send alert emails | After alert creation |

---

## 10. Pricing & Plan Limits

| Feature | Free | Starter ($29/mo) | Pro ($49/mo) |
|---------|------|-------------------|--------------|
| Sites | 1 | 1 | 5 |
| Scans/month | 1 (quick only) | 10 full | 50 full |
| Cookie banner | No | Yes | Yes |
| Privacy policy | Preview only | Yes | Yes |
| Monitoring | No | Weekly | Daily |
| Team members | 1 | 3 | 10 |
| Consent log retention | — | 90 days | 1 year |
| Support | Community | Email | Priority |

---

## 11. Environment Variables

See `.env.example` for the full list. Key variables:

```
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=

# AI
ANTHROPIC_API_KEY=

# Scanner
REDIS_URL=redis://localhost:6379

# Email
RESEND_API_KEY=

# Geolocation
MAXMIND_LICENSE_KEY=
```

---

## 12. Deployment Architecture

```
                    ┌──────────────┐
                    │   Vercel     │
                    │  (Next.js)   │
                    │  Web + API   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼──┐  ┌──────▼───┐  ┌────▼─────┐
     │ PostgreSQL │  │  Redis   │  │ Scanner  │
     │ (Neon/     │  │ (Upstash │  │ Worker   │
     │  Supabase) │  │  /Redis) │  │ (Fly.io) │
     └────────────┘  └──────────┘  └──────────┘
```

- **Vercel**: Next.js app (web + API + tRPC + Stripe webhooks)
- **PostgreSQL**: Neon (serverless) or Supabase
- **Redis**: Upstash (serverless) for BullMQ job queue
- **Scanner Worker**: Fly.io or Railway (needs persistent process for Playwright)

---

## 13. Key Design Decisions

1. **tRPC over REST**: Full type safety between frontend and backend, auto-generated types, no OpenAPI spec maintenance needed.

2. **Separate scanner worker**: Playwright requires a real server with Chrome — can't run in Vercel serverless. BullMQ provides reliable job processing with retries.

3. **Organization-based multi-tenancy**: Supports team collaboration from day 1. Every resource is scoped to an org, not a user.

4. **Single app, co-located scanner**: MVP uses a single Next.js app with the scanner as a sibling directory (separate deploy). Types are shared via relative imports. Can evolve to a Turborepo monorepo if complexity warrants it.

5. **Banner served as API route**: The consent banner JS is served from `/api/banner/[siteId]` with edge caching. No React dependency — vanilla JS (~15KB) for minimal impact on customer sites.

6. **JSONB for flexible data**: Scan results, banner config, and finding details use JSONB columns — schema evolves without migrations for scanner output format changes.

7. **Next.js 16 specifics**: `params` and `searchParams` are Promises (must `await`). Proxy replaces middleware (`src/proxy.ts`). Turbopack is default. `next lint` removed — use ESLint directly.
