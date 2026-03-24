# Custodia — SMB / small enterprise product roadmap

Goal: a **production-ready** privacy platform that **reduces manual work** via **scans, agents, and guided setup**—not a dashboard full of dead ends.

## Vision

- **Automatic where safe**: enqueue scans, classify findings, draft policies, suggest banner categories—always with **human review** for legal/sign-off.
- **One script + clear URLs** for consent; **hosted flows** for preferences and DSAR where regulations require it.
- **Org-wide truth**: sites, vendors, data map, and DSARs roll up to the **organization**; users are **invited** with roles.

## Pillar A — Wiring & honesty

| Area | Target state |
|------|----------------|
| Dashboard tiles | Every number traces to **Prisma + tRPC** (no orphan mock arrays). |
| Site subpages | Banner / policy / scans **persist** to DB; public DSAR intake **exists**. |
| Agents | Triggers create **agent_runs**; outcomes visible and idempotent where possible. |

## Pillar B — Org & account management

- **Organization**: name, plan, usage vs limits, **API keys** (already modeled).
- **Team**: invite, list, **remove member**, **role changes** (owner/admin/member) with guardrails (e.g. last owner).
- **Account**: profile, notifications JSON, billing portal (existing patterns).
- **Future**: multiple orgs per user (session **org switcher**) if product requires it—schema allows many memberships but current JWT picks **first** org.

## Pillar C — AI setup assistant (in-app)

**Phase 1:** chat with **read-only org context** (plan, sites, counts).

**Phase 2 (shipped):** Anthropic **tool proposals** (`propose_create_site`, `propose_trigger_scan`, `suggest_navigation`) — the UI shows **Confirm**; only then the client runs the real mutations / navigation.

**Phase 4:** **playbooks** (“GDPR starter”, “CCPA + 3 sites”) as structured checklists generated + tracked.

**Phase 3:** broader assistant tool allowlist + **audit log** row per confirmed action.

## Pillar D — ClawTeam for delivery

For large slices (e.g. “full DSAR public intake + email + SLA dashboard”), run a **ClawTeam** build swarm with tasks split by surface (API, UI, tests, docs). See `.cursor/rules/custodia-clawteam.mdc` and `swarm-company/scripts/`.

## Near-term acceptance criteria (production bar)

- [x] Public **DSAR submission** → `dsar_requests` + optional email to org owner (`RESEND_API_KEY`)
- [x] **Preference center** public page `/preference-center/<id>` (published config only; visitor id in `localStorage`)
- [ ] **E2E** with stored auth: login → add site → see dashboard update
- [x] **Rate limits** (assistant chat: per-user hourly) + **audit log** (`audit_logs` for assistant confirmations)
- [ ] Runbook: env vars, migrations, worker, Stripe webhooks

---

*Living doc — bump dates in git when priorities shift.*
