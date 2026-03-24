# @custodia/mcp-server

MCP (Model Context Protocol) server for the Custodia privacy compliance platform. This server **is** the product interface for AI agents — every privacy operation is exposed as a callable tool.

## What It Does

AI agents interact with Custodia through this MCP server to:

- **Scan websites** for privacy compliance issues (cookies, trackers, scripts, data collection)
- **Manage consent banners** (configure, preview, publish cookie consent banners)
- **Generate privacy policies** from actual scan data using AI
- **Process DSARs** (Data Subject Access Requests) with legal deadline tracking
- **Conduct PIAs** (Privacy Impact Assessments) with AI-generated questions and risk analysis
- **Map data governance** — register data stores, classify PII, discover data flows
- **Monitor compliance** scores across GDPR, CCPA, and other regulations
- **Manage user preferences** via preference centers
- **Trigger autonomous agents** for end-to-end privacy tasks

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

The server requires two environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CUSTODIA_API_URL` | No | `http://localhost:3000` | Base URL of the Custodia backend |
| `CUSTODIA_API_KEY` | **Yes** | — | API key from Settings → API Keys |

## Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "custodia": {
      "command": "node",
      "args": ["/path/to/custodia/mcp-server/dist/index.js"],
      "env": {
        "CUSTODIA_API_URL": "https://app.custodia-privacy.com",
        "CUSTODIA_API_KEY": "cust_your_api_key_here"
      }
    }
  }
}
```

### With Cursor

Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "custodia": {
      "command": "node",
      "args": ["/path/to/custodia/mcp-server/dist/index.js"],
      "env": {
        "CUSTODIA_API_URL": "https://app.custodia-privacy.com",
        "CUSTODIA_API_KEY": "cust_your_api_key_here"
      }
    }
  }
}
```

### Development

```bash
CUSTODIA_API_KEY=your_key npm run dev
```

## Available Tools (35 tools)

### Site Management

| Tool | Description |
|------|-------------|
| `list_sites` | List all websites registered for privacy monitoring |
| `get_site` | Get detailed site info with latest scan, banner, and policy status |
| `add_site` | Register a new website (triggers initial scan) |
| `update_site` | Update site settings (name, monitoring, scan frequency) |
| `delete_site` | Remove a site from monitoring (soft delete) |
| `verify_site` | Verify domain ownership via DNS TXT record |

### Scanner

| Tool | Description |
|------|-------------|
| `scan_site` | Trigger a privacy scan (full/quick/monitoring) |
| `get_scan_results` | Get scan results with findings and compliance scores |
| `list_scans` | List all scans for a site (paginated) |
| `compare_scans` | Compare two scans to see what changed |

### Consent Banner

| Tool | Description |
|------|-------------|
| `get_banner_config` | Get cookie consent banner configuration |
| `update_banner` | Update banner settings (position, theme, categories, etc.) |
| `publish_banner` | Deploy banner to production |
| `get_consent_stats` | Get consent interaction statistics |

### Privacy Policy

| Tool | Description |
|------|-------------|
| `generate_policy` | AI-generate a privacy policy from scan data |
| `get_policy` | Get current policy (Markdown + HTML) |
| `update_policy` | Manually edit policy content |
| `publish_policy` | Publish policy to production |
| `get_policy_versions` | Get policy version history |

### DSAR Management

| Tool | Description |
|------|-------------|
| `list_dsars` | List all DSAR requests (with status filter) |
| `get_dsar` | Get full DSAR details and audit trail |
| `process_dsar` | AI-process a DSAR (search data stores, compile response) |
| `fulfill_dsar` | Mark a DSAR as fulfilled |
| `get_dsar_stats` | Get DSAR statistics and deadline tracking |

### Privacy Impact Assessments

| Tool | Description |
|------|-------------|
| `create_pia` | Create a new PIA for a project |
| `generate_pia_questions` | AI-generate assessment questions |
| `submit_pia_answers` | Submit answers to assessment questions |
| `analyze_pia` | AI-analyze assessment and generate risk report |
| `list_pias` | List all assessments |
| `get_pia` | Get full assessment details |

### Data Governance

| Tool | Description |
|------|-------------|
| `list_data_stores` | List all registered data stores |
| `add_data_store` | Register a data store (database, SaaS app, etc.) |
| `classify_data` | AI-classify PII in a data store |
| `map_data_flows` | AI-discover data flows between stores |
| `list_vendors` | List third-party vendors |
| `add_vendor` | Register a vendor (data processor) |
| `review_vendor` | AI-review vendor compliance |

### Compliance

| Tool | Description |
|------|-------------|
| `get_compliance_scores` | Get compliance scores across regulations |
| `get_alerts` | Get compliance alerts |
| `get_recommendations` | AI-generate compliance recommendations |

### Preference Management

| Tool | Description |
|------|-------------|
| `get_preference_center` | Get preference center configuration |
| `update_user_preferences` | Update an end-user's privacy preferences |

### Autonomous Agents

| Tool | Description |
|------|-------------|
| `trigger_agent` | Trigger an autonomous privacy agent |
| `get_agent_status` | Check agent run status and output |
| `list_agent_runs` | List recent agent runs |

## Agent Workflow Examples

### Full compliance setup for a new site

```
1. add_site(domain: "example.com", name: "Example")
2. [wait for scan to complete]
3. get_scan_results(scanId: "...")
4. generate_policy(siteId: "...")
5. update_banner(siteId: "...", config: { ... })
6. publish_banner(siteId: "...")
7. publish_policy(siteId: "...")
8. get_compliance_scores(siteId: "...")
```

### Process a DSAR request

```
1. list_dsars(status: "received")
2. get_dsar(dsarId: "...")
3. process_dsar(dsarId: "...")  — AI searches data stores
4. get_dsar(dsarId: "...")      — review AI findings
5. fulfill_dsar(dsarId: "...")  — after sending response to requester
```

### Conduct a Privacy Impact Assessment

```
1. create_pia(title: "New Analytics Integration", projectType: "vendor_integration", description: "...")
2. generate_pia_questions(assessmentId: "...")
3. submit_pia_answers(assessmentId: "...", answers: { ... })
4. analyze_pia(assessmentId: "...")  — AI risk analysis
5. get_pia(assessmentId: "...")      — review full report
```

## Architecture

```
AI Agent (Claude, GPT, etc.)
    ↓ MCP Protocol (stdio)
[@custodia/mcp-server]
    ↓ REST/tRPC HTTP calls
[Custodia Backend (Next.js)]
    ↓
[PostgreSQL + Redis + Scanner Worker]
```

The MCP server is a thin translation layer — it converts MCP tool calls into authenticated tRPC API calls to the Custodia backend. No business logic lives in the MCP server; it only handles:

1. Tool registration with schemas and descriptions
2. API client authentication (Bearer token)
3. Request/response marshaling between MCP and tRPC formats
