# Custodia — Agent-First Privacy Platform

## Architecture

Custodia is an **agent-first** privacy compliance platform. AI agents are the primary users.
The web dashboard exists only for human monitoring and configuration.

```
┌──────────────────────────────────────────────────────────┐
│                    AI AGENTS (Users)                      │
│  Claude, GPT, custom agents, scheduled jobs, webhooks    │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│              MCP SERVER (@custodia/mcp-server)            │
│  40+ tools across 10 categories                          │
│  Scanner · Consent · Policy · DSAR · PIA · Governance    │
│  Compliance · Preferences · Agents · Sites               │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│                CUSTODIA API (tRPC + REST)                 │
│  11 routers: site, scan, banner, policy, billing, user,  │
│  dsar, pia, governance, preferences, agents              │
└───────────────────────┬──────────────────────────────────┘
                        │
                ┌───────┼───────┐
                ▼       ▼       ▼
           PostgreSQL  Redis   Claude API
```

## MCP Server

The MCP server at `mcp-server/` exposes every Custodia operation as a tool.

### Installation

```bash
cd mcp-server && npm install && npm run build
```

### Configuration (claude_desktop_config.json or .claude.json)

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

### Tool Categories

| Category | Tools | Description |
|----------|-------|-------------|
| Scanner | `scan_site`, `get_scan_results`, `list_findings` | Crawl sites, detect trackers/cookies |
| Consent | `get_banner_config`, `update_banner`, `get_consent_stats` | Consent banner management |
| Policy | `generate_policy`, `get_policy`, `publish_policy` | AI privacy policy generation |
| DSAR | `list_dsars`, `get_dsar`, `process_dsar`, `fulfill_dsar` | Data subject request management |
| PIA | `create_pia`, `generate_pia_questions`, `analyze_pia` | Privacy impact assessments |
| Governance | `list_data_stores`, `classify_data`, `map_data_flows`, `review_vendor` | Data mapping & vendor management |
| Compliance | `get_compliance_scores`, `get_alerts`, `get_recommendations` | Compliance monitoring |
| Preferences | `get_preference_center`, `update_user_preferences` | Preference management |
| Agents | `trigger_agent`, `get_agent_status`, `list_agent_runs` | Agent orchestration |
| Sites | `list_sites`, `add_site`, `get_site` | Site management |

## Built-in Privacy Agents

Located at `src/agents/`, these are autonomous agents that can be triggered via the API or MCP server.

### Scanner Agent (`scanner`)
Crawls all sites for the org, detects new trackers/cookies, compares with previous scans,
creates alerts for compliance changes.

### DSAR Processor (`dsar_processor`)
Takes a DSAR request, uses Claude to analyze what data needs to be found, queries all registered
data stores, generates a response package, and drafts a jurisdiction-appropriate reply letter.

### Policy Generator (`policy_generator`)
Analyzes scan results for a site, generates or updates the privacy policy using Claude,
checks against applicable regulations, and flags gaps.

### Compliance Monitor (`compliance_monitor`)
Reviews all sites' compliance posture, checks for overdue DSARs, declining scores,
generates a comprehensive compliance report with prioritized recommendations.

## API Routes

All API routes are served via tRPC at `/api/trpc/[procedure]`.

### DSAR Management (`dsar.*`)
- `dsar.list` — List DSARs with status filter
- `dsar.get` — Get DSAR details + activity log
- `dsar.create` — Create new DSAR (auto-calculates deadline by jurisdiction)
- `dsar.process` — AI-process DSAR (find data, generate response)
- `dsar.fulfill` / `dsar.reject` — Complete DSAR handling
- `dsar.submitPortal` — Public intake endpoint

### Privacy Impact Assessments (`pia.*`)
- `pia.create` — Create new assessment
- `pia.generateQuestions` — AI-generate questions for project type
- `pia.submitAnswers` — Record answers
- `pia.analyze` — AI risk analysis + report generation
- `pia.approve` / `pia.reject` — Review workflow

### Data Governance (`governance.*`)
- `governance.createStore` / `governance.classifyStore` — Register and AI-classify data stores
- `governance.mapFlows` — AI-discover data flows between stores
- `governance.createVendor` / `governance.reviewVendor` — Vendor management with AI review

### Preference Management (`preferences.*`)
- `preferences.createCenter` — Create preference center with categories
- `preferences.getPreferences` / `preferences.updatePreferences` — Public preference API

### Agent Orchestration (`agents.*`)
- `agents.trigger` — Trigger any agent by type
- `agents.listRuns` — View agent run history with logs
- `agents.stats` — Agent usage statistics

## Database Schema

13 original models + 9 new models = 22 total:

**Auth**: User, Account, Session, VerificationToken
**Org**: Organization, OrgMember, ApiKey
**Scanning**: Site, Scan, Finding
**Consent**: Banner, ConsentLog
**Policy**: Policy
**Alerts**: Alert
**DSAR**: DsarRequest, DsarActivity
**PIA**: Assessment
**Governance**: DataStore, DataFlow, Vendor
**Preferences**: PreferenceCenter, UserPreference
**Agents**: AgentRun

## Running Locally

```bash
# Start infrastructure
docker compose up -d  # PostgreSQL + Redis

# Setup
cp .env.example .env.local
npx prisma db push
npm run dev

# MCP server (separate terminal)
cd mcp-server && npx tsx src/index.ts
```
