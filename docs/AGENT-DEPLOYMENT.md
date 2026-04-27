# Custodia — deployment runbook (for agents & operators)

This document is the **canonical procedure** for shipping changes to production. Follow it end-to-end before pushing to `main` and after any deploy.

---

## 1. What “production” actually is

| Topic | Fact |
|--------|------|
| **Cloudflare Workers** | The main Next.js app is **not** deployed to Workers Builds / Workers scripts in this repo. |
| **Public HTTPS** | Traffic goes **Internet → Cloudflare → Cloudflare Tunnel (`cloudflared`) → host loopback** where Docker publishes the app. |
| **Runtime** | **Docker Compose** on a **long-lived host** (see `docker-compose.yml`). The GitHub Actions **self-hosted** runner runs on **that same host** so it can `docker compose` and hit local health checks. |
| **Canonical URL** | `https://app.custodia-privacy.com` (see `README.md`). |

Tunnel ingress on the host must target the **same TCP port** Docker binds for the `app` service (currently **`127.0.0.1:3000`** — see `docker-compose.yml` `ports:`). If you change compose ports, update tunnel config accordingly.

---

## 2. Automatic deploy (primary path)

**Trigger:** push to branch **`main`** on `github.com:Custodia-Privacy/custodia`.

**Workflow:** `.github/workflows/deploy.yml`

**High-level sequence**

1. **Job `test`** (must pass or deploy does not run):
   - Checkout repo on the **self-hosted** runner.
   - **Node.js 22** (`actions/setup-node`) — match this locally when debugging test failures.
   - `npm ci` → `npm run lint` → `npm run type-check` → `npm run test:ci`
2. **Job `deploy`** (only if `test` succeeded):
   - `git pull origin main` in the workspace the runner uses.
   - Copy **host-only** secrets into the workspace (never from git):
     - `~/.custodia/.env` → workspace `.env` (Compose **interpolation**: DB/redis passwords, etc.)
     - `~/.custodia/.env.docker` → workspace `.env.docker` (**runtime** env for app/scanner containers: `DATABASE_URL`, API keys, `NEXTAUTH_URL`, …)
   - Tag current images as `custodia-app:rollback` / `custodia-scanner:rollback` (best-effort).
   - `docker compose -f …/docker-compose.yml up -d --build --wait`
   - Health: `curl -sf http://localhost:3000/api/health` — on failure, workflow attempts rollback images and `compose up` again, then fails the job.

**Database migrations:** applied **inside the app container** on startup via `docker-entrypoint.sh` (`prisma migrate deploy`). Failed migrations abort container start unless `SKIP_MIGRATION_CHECK=true` (documented in entrypoint; use only in emergencies).

---

## 3. Agent checklist (before every push to `main`)

Run from repository root (`swarm-company/custodia` — the directory that contains `package.json` and `prisma/schema.prisma`).

```bash
# Match CI (see .github/workflows/deploy.yml)
node -v   # expect v22.x

npm ci
npm run lint
npm run type-check
npm run test:ci
npm run build    # recommended when changing Next.js, Docker, or Prisma client usage
```

### 3.1 Secret & hygiene review (mandatory)

Do **not** rely on “I didn’t mean to commit it.” Verify:

- `git status` / `git diff` contain **no** real secrets: `.env`, `.env.local`, `.env.docker`, `*.pem`, private URLs with embedded tokens, production API keys, live Stripe keys, etc.
- **Never** commit `~/.custodia/` — those files are the **canonical** production secrets on the host; the workflow copies them at deploy time.
- **`.env.example`** may contain only placeholders (`your-key`, `generate-with-openssl-…`, `postgresql://user:password@…`). Never paste real keys there.
- **Tests** should use obvious fakes (`whsec_test…`, `sk_test_…`, `securepassword123`-style strings that are not real accounts).
- **Docs & comments**: no “here’s my key” strings, no screenshots of cookies/session storage, no customer PII.

`.gitignore` ignores `.env` and `.env.*` except `.env.example` — do not weaken that pattern.

### 3.2 Push

```bash
git push origin main
```

Then open **GitHub → Actions → “Deploy to Production”** and confirm the run is **green**. If the self-hosted runner is **offline**, the workflow will not execute on the host — fix the runner or perform **manual deploy** (below).

---

## 4. Manual deploy (runner offline or hotfix on host)

On the **production host**, using the **same clone path** the runner uses (see runner config / `GITHUB_WORKSPACE`):

```bash
cd /path/to/custodia
git pull origin main
cp ~/.custodia/.env ./.env
cp ~/.custodia/.env.docker ./.env.docker
docker compose up -d --build --wait
curl -sf http://127.0.0.1:3000/api/health && echo OK
```

Public smoke (from anywhere):

```bash
curl -sf https://app.custodia-privacy.com/api/health && echo OK
```

---

## 5. Rollback

- The workflow tags **`custodia-app:rollback`** / **`custodia-scanner:rollback`** before rebuilding. If automated rollback runs, it retags and restarts compose.
- **Manual:** identify last good image tags or git SHA, `git checkout <sha>`, rebuild, or `docker tag …:rollback …:latest` and `docker compose up -d` per your ops policy.

---

## 6. Troubleshooting

| Symptom | Likely cause | Action |
|---------|----------------|--------|
| Workflow queued forever | Self-hosted runner stopped | Restart runner service on host; or manual deploy |
| `test` job fails on `test:ci` | Node version ≠ 22, stale `node_modules`, or real test failure | Use Node 22, `rm -rf node_modules && npm ci`, read Vitest output |
| `test:ci` fails loading Vitest config | Wrong Node or missing `vitest.config.mts` | Use Node 22; config must be `vitest.config.mts` (ESM) in this repo |
| Health check fails after deploy | DB down, Redis auth mismatch, migration failure | `docker compose logs app`, `docker compose ps`, verify `~/.custodia` files match compose |
| Login broken after deploy | `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` not matching public origin | Fix `.env.docker` on host (canonical copy under `~/.custodia/`), redeploy |

---

## 7. Optional services (inventory / PII)

`docker-compose.yml` may define **`pii-engine`** and **`inventory-worker`**. They depend on env vars in `.env.docker` (e.g. `PII_ENGINE_URL`, `DELETION_RECEIPT_HMAC_SECRET`). If those services are disabled or misconfigured, the core app may still run; inventory queues may fail until fixed.

---

## 8. Related docs

- `README.md` — architecture, tunnel setup, human-oriented setup.
- `docs/DEPLOYMENT.md` — release gates, audits, readiness notes.
- `.github/workflows/deploy.yml` — exact CI/CD commands (source of truth for automation).

---

## 9. Summary for agents

1. **Not Workers** — Docker + tunnel + self-hosted GHA.
2. **Always** run lint, type-check, tests on **Node 22** before pushing `main`.
3. **Never** commit secrets; verify diffs.
4. **After push**, confirm Actions green and `/api/health` OK.
5. **Secrets live** under `~/.custodia/` on the host — not in git.
