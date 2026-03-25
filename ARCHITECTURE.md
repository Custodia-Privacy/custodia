# Custodia — Architecture Document

**Version:** 2.0
**Date:** 2026-03-25
**Author:** Software Architect

---

## 1. Overview

Custodia is an **agent-first** privacy & compliance SaaS platform for solo founders and SMBs. AI agents are the primary users — the web dashboard exists for human monitoring and configuration.

The platform provides: AI-powered website scanning, smart cookie consent banners, privacy policy generation, DSAR automation, privacy impact assessments, data governance, vendor management, preference centers, and ongoing compliance monitoring.

**Production URL:** `https://app.custodia-privacy.com`
**Domain:** `custodia-privacy.com`

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    AI AGENTS (Users)                      │
│  Claude, GPT, custom agents, scheduled jobs, webhooks    │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│              MCP SERVER (mcp-server/)                     │
│  10 tool categories: Sites · Scanner · Consent · Policy  │
│  DSAR · PIA · Governance · Compliance · Preferences ·    │
│  Agents                                                  │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│             CUSTODIA API (tRPC + REST)                   │
│  14 routers: site, scan, banner, policy, billing, user,  │
│  dsar, pia, governance, preferences, agents, dashboard,  │
│  org, assistant                                          │
└───────────────────────┬──────────────────────────────────┘
                        │
                ┌───────┼───────┐
                ▼       ▼       ▼
           PostgreSQL  Redis   Claude API
           (Docker)    (Docker)  (Anthropic)
```

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 16 (Docker: `custodia-postgres`, port 5432) |
| ORM | Prisma 6 |
| Auth | NextAuth.js v5 (Auth.js) |
| Payments | Stripe Checkout + Webhooks |
| Scanner Engine | Playwright (headless Chromium) |
| AI | Anthropic Claude API |
| Queue/Jobs | BullMQ + Redis (Docker: `custodia-redis`, port 6380) |
| Email | Resend |
| Process Manager | PM2 (process name: `custodia`) |
| Deployment | PM2 + Cloudflare Tunnel → localhost:3200 |
| Agent Interface | MCP Server (Model Context Protocol) |

---

## 4. Project Structure

```
custodia/
├── ARCHITECTURE.md              # This file
├── AGENTS.md                    # Agent-first platform docs
├── CLAUDE.md                    # Claude Code agent instructions
├── package.json
├── .env.local                   # Environment (not committed)
│
├── prisma/
│   ├── schema.prisma            # 22 models across 10 domains
│   └── seed.ts                  # Database seeding
│
├── src/
│   ├── app/
│   │   ├── (marketing)/         # Public pages
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── pricing/         # Pricing page
│   │   │   ├── preference-center/[centerId]/  # Public preference center
│   │   │   └── request/[siteId]/              # Public DSAR request form
│   │   │
│   │   ├── (auth)/              # Login, signup
│   │   │   ├── login/
│   │   │   └── signup/
│   │   │
│   │   ├── (dashboard)/         # Authenticated app (14 pages)
│   │   │   ├── dashboard/       # Overview dashboard
│   │   │   ├── sites/           # Site management + [siteId]/{scans,banner,policy}
│   │   │   ├── dsars/           # DSAR list + [requestId] detail
│   │   │   ├── assessments/     # Privacy Impact Assessments
│   │   │   ├── data-map/        # Data governance visualization
│   │   │   ├── vendors/         # Vendor management
│   │   │   ├── preferences/     # Preference center management
│   │   │   ├── agents/          # Agent orchestration dashboard
│   │   │   ├── assistant/       # AI chat assistant
│   │   │   └── settings/        # User + organization settings
│   │   │
│   │   ├── embed/
│   │   │   └── dsar/[siteId]/   # Embeddable DSAR form
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts    # NextAuth
│   │       ├── auth/signup/route.ts           # Email/password signup
│   │       ├── banner/[siteId]/route.ts       # Public banner JS SDK
│   │       ├── banner/[siteId]/consent/route.ts # Consent logging
│   │       ├── health/route.ts                # Health check
│   │       ├── public/dsar/route.ts           # Public DSAR intake
│   │       ├── public/site/[siteId]/route.ts  # Public site info
│   │       ├── trpc/[trpc]/route.ts           # tRPC endpoint
│   │       └── webhooks/stripe/route.ts       # Stripe webhooks
│   │
│   ├── agents/                  # Built-in AI agents
│   │   ├── base.ts              # Base agent class
│   │   ├── index.ts             # Agent registry
│   │   ├── scanner-agent.ts     # Site scanning automation
│   │   ├── dsar-agent.ts        # DSAR processing automation
│   │   ├── policy-agent.ts      # Policy generation automation
│   │   └── compliance-agent.ts  # Compliance monitoring automation
│   │
│   ├── components/
│   │   ├── ui/                  # Shared UI primitives
│   │   ├── landing/             # Landing page sections
│   │   ├── marketing/           # Marketing components
│   │   ├── dashboard/           # Dashboard components
│   │   ├── banner/              # Banner preview/editor
│   │   ├── dsar-form.tsx        # DSAR intake form
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   └── providers.tsx        # React context providers
│   │
│   ├── lib/
│   │   ├── auth.ts              # NextAuth config
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── stripe.ts            # Stripe client + plan config
│   │   ├── queue.ts             # BullMQ queue setup
│   │   ├── compliance.ts        # Compliance scoring logic
│   │   ├── dsar-deadlines.ts    # Jurisdiction-aware deadline calc
│   │   ├── banner-defaults.ts   # Default banner configs
│   │   ├── privacy-webhook.ts   # HMAC-signed webhook dispatch
│   │   ├── public-rate-limit.ts # Rate limiting for public endpoints
│   │   ├── format-relative.ts   # Date formatting utilities
│   │   ├── trpc.ts              # Client-side tRPC setup
│   │   └── utils.ts             # cn(), helpers
│   │
│   ├── server/
│   │   ├── trpc.ts              # tRPC init, context, procedures
│   │   ├── root.ts              # Root tRPC router (14 routers)
│   │   └── routers/             # 14 tRPC routers
│   │       ├── site.ts
│   │       ├── scan.ts
│   │       ├── banner.ts
│   │       ├── policy.ts
│   │       ├── billing.ts
│   │       ├── user.ts
│   │       ├── dsar.ts
│   │       ├── pia.ts
│   │       ├── governance.ts
│   │       ├── preferences.ts
│   │       ├── agents.ts
│   │       ├── dashboard.ts
│   │       ├── org.ts
│   │       └── assistant.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── proxy.ts                 # Next.js 16 proxy (replaces middleware)
│
├── scanner/                     # Scanner worker (separate process)
│   └── src/
│       ├── index.ts             # BullMQ worker entry point
│       ├── crawler.ts           # Playwright site crawler
│       ├── analyzers/           # Cookie, tracker, script analysis
│       ├── ai/                  # AI summarization + policy gen
│       └── utils/               # Known trackers DB, cookie DB
│
├── mcp-server/                  # MCP Server for AI agent access
│   └── src/
│       ├── index.ts             # MCP server entry (stdio transport)
│       ├── client.ts            # HTTP client for Custodia API
│       └── tools/               # 10 tool categories
│           ├── index.ts
│           ├── sites.ts
│           ├── scanner.ts
│           ├── consent.ts
│           ├── policy.ts
│           ├── dsar.ts
│           ├── pia.ts
│           ├── governance.ts
│           ├── compliance.ts
│           ├── preferences.ts
│           └── agents.ts
│
├── e2e/                         # Playwright E2E tests
├── marketing/                   # Marketing content & blog
├── public/                      # Static assets
└── docs/                        # Documentation
```

---

## 5. Database Schema

### 22 Models across 10 Domains

```
Auth:        User, Account, Session, VerificationToken
Org:         Organization, OrgMember, ApiKey, AuditLog
Scanning:    Site, Scan, Finding
Consent:     Banner, ConsentLog
Policy:      Policy
Alerts:      Alert
DSAR:        DsarRequest, DsarActivity
PIA:         Assessment, AssessmentActivity
Governance:  DataStore, DataFlow, Vendor
Preferences: PreferenceCenter, UserPreference
Agents:      AgentRun
```

### Entity Relationships

```
User 1──* OrgMember *──1 Organization
Organization 1──* Site 1──* Scan 1──* Finding
                       1──1 Banner
                       1──1 Policy
                       1──* ConsentLog
                       1──* Alert
Organization 1──* DsarRequest 1──* DsarActivity
Organization 1──* Assessment 1──* AssessmentActivity
Organization 1──* DataStore
Organization 1──* DataFlow (source→target DataStores)
Organization 1──* Vendor
Organization 1──* PreferenceCenter 1──* UserPreference
Organization 1──* AgentRun
Organization 1──* ApiKey
Organization 1──* AuditLog
User 1──* Assessment (assignee)
```

### Key Enums

| Enum | Values |
|------|--------|
| Plan | `free`, `starter`, `growth`, `business` |
| OrgRole | `owner`, `admin`, `member` |
| ScanStatus | `queued`, `running`, `completed`, `failed` |
| ScanType | `full`, `quick`, `monitoring` |
| FindingCategory | `cookie`, `tracker`, `script`, `data_collection`, `consent`, `policy` |
| Severity | `critical`, `warning`, `info`, `ok` |
| DsarType | `access`, `deletion`, `rectification`, `portability`, `opt_out`, `restrict_processing` |
| DsarStatus | `received`, `identity_verified`, `processing`, `data_collected`, `review`, `fulfilled`, `rejected`, `appealed` |
| AssessmentStatus | `draft`, `in_progress`, `ai_review`, `human_review`, `approved`, `rejected`, `archived` |
| RiskLevel | `low`, `medium`, `high`, `critical` |
| DataStoreType | `database`, `api`, `file_storage`, `saas_app`, `crm`, `analytics`, `email_platform`, `cdn`, `payment_processor`, `other` |
| DataSensitivity | `public`, `internal`, `confidential`, `restricted`, `pii`, `sensitive_pii` |
| AgentType | `scanner`, `dsar_processor`, `policy_generator`, `compliance_monitor`, `data_mapper`, `pia_assessor`, `vendor_reviewer` |
| AlertType | `new_tracker`, `compliance_drop`, `scan_failed`, `policy_outdated`, `dsar_deadline`, `pia_required`, `vendor_risk` |

---

## 6. API Design (tRPC Routers)

All routes authenticated via NextAuth session unless marked **Public**.

### site router
| Procedure | Type | Description |
|-----------|------|-------------|
| `site.list` | query | All sites in user's org |
| `site.get` | query | Site with latest scan, banner, policy |
| `site.create` | mutation | Create site, triggers initial scan |
| `site.update` | mutation | Update name, monitoring, scan frequency |
| `site.delete` | mutation | Soft delete |
| `site.verify` | mutation | DNS/meta tag domain verification |

### scan router
| Procedure | Type | Description |
|-----------|------|-------------|
| `scan.list` | query | Paginated scans for a site |
| `scan.get` | query | Scan with findings |
| `scan.trigger` | mutation | Enqueue scan job |
| `scan.quick` | mutation | **Public** — free homepage scan for lead gen |
| `scan.compare` | query | Diff two scans |

### banner router
| Procedure | Type | Description |
|-----------|------|-------------|
| `banner.get` | query | Banner config for site |
| `banner.update` | mutation | Update banner config |
| `banner.publish` | mutation | Deploy banner |
| `banner.preview` | query | Preview HTML/CSS/JS |

### policy router
| Procedure | Type | Description |
|-----------|------|-------------|
| `policy.get` | query | Current policy |
| `policy.generate` | mutation | AI-generate from scan data |
| `policy.update` | mutation | Manual edits |
| `policy.publish` | mutation | Publish policy |
| `policy.versions` | query | Version history |

### billing router
| Procedure | Type | Description |
|-----------|------|-------------|
| `billing.getSubscription` | query | Current subscription |
| `billing.createCheckout` | mutation | Stripe Checkout URL |
| `billing.createPortal` | mutation | Stripe Customer Portal URL |
| `billing.usage` | query | Usage stats vs plan limits |

### user router
| Procedure | Type | Description |
|-----------|------|-------------|
| `user.me` | query | Current user + org |
| `user.update` | mutation | Update profile |
| `user.inviteTeamMember` | mutation | Send team invite |
| `user.listTeamMembers` | query | Org members |

### dsar router
| Procedure | Type | Description |
|-----------|------|-------------|
| `dsar.list` | query | DSARs with status filter |
| `dsar.get` | query | DSAR details + activity log |
| `dsar.create` | mutation | Create DSAR (auto-calculates deadline) |
| `dsar.process` | mutation | AI-process (find data, generate response) |
| `dsar.fulfill` | mutation | Mark fulfilled |
| `dsar.reject` | mutation | Reject with reason |
| `dsar.submitPortal` | mutation | **Public** intake endpoint |

### pia router
| Procedure | Type | Description |
|-----------|------|-------------|
| `pia.create` | mutation | New privacy impact assessment |
| `pia.generateQuestions` | mutation | AI-generate questions for project type |
| `pia.submitAnswers` | mutation | Record answers |
| `pia.analyze` | mutation | AI risk analysis + report |
| `pia.approve` / `pia.reject` | mutation | Review workflow |

### governance router
| Procedure | Type | Description |
|-----------|------|-------------|
| `governance.createStore` | mutation | Register data store |
| `governance.classifyStore` | mutation | AI-classify data |
| `governance.mapFlows` | mutation | AI-discover data flows |
| `governance.createVendor` | mutation | Add vendor |
| `governance.reviewVendor` | mutation | AI vendor review |

### preferences router
| Procedure | Type | Description |
|-----------|------|-------------|
| `preferences.createCenter` | mutation | Create preference center |
| `preferences.getPreferences` | query | User preferences |
| `preferences.updatePreferences` | mutation | **Public** preference update |

### agents router
| Procedure | Type | Description |
|-----------|------|-------------|
| `agents.trigger` | mutation | Trigger agent by type |
| `agents.listRuns` | query | Agent run history |
| `agents.stats` | query | Agent usage statistics |

### dashboard router
| Procedure | Type | Description |
|-----------|------|-------------|
| `dashboard.overview` | query | Aggregated dashboard stats |

### org router
| Procedure | Type | Description |
|-----------|------|-------------|
| `org.get` | query | Organization details |
| `org.update` | mutation | Update org settings |

### assistant router
| Procedure | Type | Description |
|-----------|------|-------------|
| `assistant.chat` | mutation | AI chat for compliance Q&A |

---

## 7. MCP Server

The MCP server at `mcp-server/` exposes every Custodia operation as a tool for AI agents.

### Configuration

```json
{
  "mcpServers": {
    "custodia": {
      "command": "npx",
      "args": ["tsx", "mcp-server/src/index.ts"],
      "env": {
        "CUSTODIA_API_URL": "http://localhost:3000",
        "CUSTODIA_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Tool Categories (10)

| Category | File | Description |
|----------|------|-------------|
| Sites | `sites.ts` | `list_sites`, `add_site`, `get_site` |
| Scanner | `scanner.ts` | `scan_site`, `get_scan_results`, `list_findings` |
| Consent | `consent.ts` | `get_banner_config`, `update_banner`, `get_consent_stats` |
| Policy | `policy.ts` | `generate_policy`, `get_policy`, `publish_policy` |
| DSAR | `dsar.ts` | `list_dsars`, `get_dsar`, `process_dsar`, `fulfill_dsar` |
| PIA | `pia.ts` | `create_pia`, `generate_pia_questions`, `analyze_pia` |
| Governance | `governance.ts` | `list_data_stores`, `classify_data`, `map_data_flows`, `review_vendor` |
| Compliance | `compliance.ts` | `get_compliance_scores`, `get_alerts`, `get_recommendations` |
| Preferences | `preferences.ts` | `get_preference_center`, `update_user_preferences` |
| Agents | `agents.ts` | `trigger_agent`, `get_agent_status`, `list_agent_runs` |

---

## 8. Built-in AI Agents

Located at `src/agents/`, these autonomous agents can be triggered via the API or MCP server.

| Agent | Type | Description |
|-------|------|-------------|
| Scanner | `scanner` | Crawls sites, detects trackers/cookies, creates alerts for changes |
| DSAR Processor | `dsar_processor` | Analyzes DSAR, finds data across stores, generates response package |
| Policy Generator | `policy_generator` | Analyzes scan results, generates/updates privacy policy, flags gaps |
| Compliance Monitor | `compliance_monitor` | Reviews compliance posture, checks overdue DSARs, generates report |

Each agent extends the base class at `src/agents/base.ts` and is registered in `src/agents/index.ts`.

---

## 9. Scanner Architecture

The scanner runs as a **separate worker process** because headless browser crawling is long-running.

```
[User triggers scan] → [tRPC mutation] → [BullMQ job enqueued (Redis)]
                                                  ↓
                                         [Scanner Worker]
                                                  ↓
                                    1. Launch Playwright
                                    2. Navigate to site
                                    3. Crawl pages (max 50)
                                    4. Per page: cookies, trackers, scripts, forms
                                    5. AI summarization (Claude)
                                    6. Compliance scoring
                                    7. Save results to PostgreSQL
                                    8. Generate findings + alerts
```

### Quick Scan (Public / Lead Gen)
- Crawls homepage only
- Identifies cookies and trackers
- Returns 3–5 key findings
- Requires email for full results → lead capture

---

## 10. Banner SDK Architecture

Lightweight JS bundle (~15KB gzipped) served from `/api/banner/[siteId]`:

```html
<script src="https://app.custodia-privacy.com/api/banner/SITE_ID" async></script>
```

1. Fetches banner config + cookie categories (edge-cached)
2. Detects jurisdiction via IP geolocation (Cloudflare headers)
3. Checks existing consent cookie
4. GDPR: opt-in (block until consent) / CCPA: opt-out (allow, show "Do Not Sell")
5. Logs consent event to `/api/banner/[siteId]/consent`

---

## 11. Authentication & Authorization

- **NextAuth.js v5** — email/password + Google OAuth + GitHub OAuth
- JWT sessions for edge compatibility
- Organization-based multi-tenancy: all resources scoped to org
- Role-based: `owner` > `admin` > `member`
- tRPC middleware checks org membership
- API keys for MCP server / agent auth (hashed, scoped, revocable)
- Audit log tracks all agent/assistant actions

---

## 12. Background Jobs (BullMQ)

| Queue | Job | Trigger |
|-------|-----|---------|
| `scan` | Full site scan | On-demand + scheduled |
| `scan` | Quick scan | On-demand (public) |
| `monitoring` | Monitoring scan | Cron: `0 3 * * 1` (weekly) |
| `policy` | Regenerate policy | After scan completion |
| `alerts` | Check compliance | After scan completion |
| `email` | Send notifications | After alert creation |

---

## 13. Pricing & Plan Limits

| Feature | Free | Starter ($29/mo) | Growth ($49/mo) | Business ($99/mo) |
|---------|------|-------------------|-----------------|-------------------|
| Sites | 1 | 3 | 10 | Unlimited |
| Scans/month | 1 (quick) | 10 full | 50 full | Unlimited |
| Cookie banner | No | Yes | Yes | Yes |
| Privacy policy | Preview | Yes | Yes | Yes |
| Monitoring | No | Weekly | Daily | Real-time |
| DSAR management | No | Basic | Full + AI | Full + AI |
| PIAs | No | No | Yes | Yes |
| Data governance | No | No | Basic | Full |
| Team members | 1 | 3 | 10 | Unlimited |
| MCP/API access | No | No | Yes | Yes |

---

## 14. Deployment Architecture

```
                    ┌──────────────────┐
                    │  Cloudflare      │
                    │  Tunnel          │
                    │  (custodia-      │
                    │   privacy.com)   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  PM2 (custodia)  │
                    │  Next.js 16      │
                    │  localhost:3200   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──┐  ┌───────▼────┐  ┌──────▼───────┐
     │ PostgreSQL │  │   Redis    │  │ Claude API   │
     │ Docker     │  │  Docker    │  │ (Anthropic)  │
     │ port 5432  │  │  port 6380 │  │              │
     └────────────┘  └────────────┘  └──────────────┘
```

---

## 15. Public Endpoints (No Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/banner/[siteId]` | GET | Consent banner JS |
| `/api/banner/[siteId]/consent` | POST | Log consent event |
| `/api/public/dsar` | POST | Public DSAR intake |
| `/api/public/site/[siteId]` | GET | Public site info |
| `/request/[siteId]` | GET | Public DSAR request form page |
| `/embed/dsar/[siteId]` | GET | Embeddable DSAR form |
| `/preference-center/[centerId]` | GET | Public preference center |

---

## 16. Environment Variables

See `.env.local` (not committed). Key variables:

```bash
# Database
DATABASE_URL=postgresql://custodia:password@localhost:5432/custodia

# Redis
REDIS_URL=redis://localhost:6380

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://app.custodia-privacy.com

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# AI
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=
```

---

## 17. Key Design Decisions

1. **Agent-first architecture**: AI agents are primary users. MCP server exposes all operations as tools. Dashboard is secondary.

2. **tRPC over REST**: Full type safety between frontend and backend. 14 routers cover all domains.

3. **Separate scanner worker**: Playwright requires persistent process with Chrome. BullMQ provides reliable job processing with retries.

4. **Organization-based multi-tenancy**: Every resource scoped to org. Supports team collaboration.

5. **Single Next.js app**: Web, API, and tRPC all in one deployment. Scanner and MCP server are co-located but separately runnable.

6. **JSONB for flexible data**: Scan results, banner config, AI analysis results use JSONB — schema evolves without migrations.

7. **Audit trail**: AuditLog model + DsarActivity + AssessmentActivity provide complete compliance audit trail.

8. **API keys for agents**: Hashed, scoped, revocable API keys for MCP server and external agent auth.

9. **Privacy webhooks**: Sites and preference centers can configure HMAC-signed webhook URLs for real-time event notification.

10. **Next.js 16 specifics**: `params` and `searchParams` are Promises (must `await`). Proxy replaces middleware (`src/proxy.ts`). Turbopack is default.
