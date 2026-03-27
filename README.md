# Custodia

AI-powered privacy & compliance SaaS. Website scanner, cookie consent banners, privacy policy generation, DSAR automation.

**Production:** https://app.custodia-privacy.com

---

## Development

```bash
npm install
cp .env.example .env.local   # fill in secrets
npm run dev                  # http://localhost:3000
```

Requires: Node 22+, PostgreSQL 16, Redis 7

---

## Production Deployment

Custodia runs on the founder's local machine and is reachable via **Cloudflare Tunnel** — no port forwarding, no dynamic IP issues, free SSL.

### Architecture

```
Internet → Cloudflare → cloudflared tunnel → localhost:3100 (Next.js app)
                                           → postgres:5432 (internal only)
                                           → redis:6379    (internal only)
```

All services run via Docker Compose. Deploys trigger automatically on push to `main` via a self-hosted GitHub Actions runner on the same machine.

---

### One-time setup

#### 1. Install Docker

https://docs.docker.com/engine/install/

#### 2. Clone the repo

```bash
git clone https://github.com/Custodia-Privacy/custodia.git ~/custodia
cd ~/custodia
```

#### 3. Create `.env`

```bash
cp .env.example .env
# Edit .env — key production values:
#
#   DATABASE_URL=postgresql://custodia:YOURPASSWORD@postgres:5432/custodia
#   REDIS_URL=redis://redis:6379
#   NEXTAUTH_URL=https://app.custodia-privacy.com
#   NEXT_PUBLIC_APP_URL=https://app.custodia-privacy.com
#   POSTGRES_USER=custodia
#   POSTGRES_PASSWORD=YOURPASSWORD
#   POSTGRES_DB=custodia
#   CLOUDFLARE_TUNNEL_TOKEN=<from step 4>
#   ... plus Stripe, Anthropic, Resend, OAuth keys
```

#### 4. Set up Cloudflare Tunnel

```bash
# Install cloudflared
brew install cloudflared          # macOS
# or: https://pkg.cloudflare.com/index.html (Linux/Windows)

# Log in (opens browser)
cloudflared tunnel login

# Create the tunnel and point your subdomain at it
cloudflared tunnel create custodia
cloudflared tunnel route dns custodia app.custodia-privacy.com
```

Then go to [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com/) → Networks → Tunnels → `custodia` → Configure → copy the **Tunnel Token**.

Add it to `.env`:
```
CLOUDFLARE_TUNNEL_TOKEN=eyJ...
```

The tunnel config (`~/.cloudflared/config.yml`) should point to the app:
```yaml
tunnel: custodia
credentials-file: ~/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: app.custodia-privacy.com
    service: http://localhost:3100
  - service: http_status:404
```

#### 5. Start everything

```bash
docker compose up -d --build
```

Starts: Next.js app (port 3100), scanner worker, Postgres, Redis, and cloudflared tunnel.

Verify:
```bash
docker compose ps
curl https://app.custodia-privacy.com/api/health
```

#### 6. Set up the self-hosted GitHub Actions runner

Lets every push to `main` auto-deploy without SSH or dynamic IP issues.

In the GitHub repo: **Settings → Actions → Runners → New self-hosted runner**

Follow the on-screen instructions (~2 min). The runner polls GitHub for jobs. Once active, every push to `main` runs `docker compose up -d --build` on your machine automatically.

---

### Manual deploy

```bash
cd ~/custodia
git pull origin main
docker compose up -d --build --wait
```

### Logs

```bash
docker compose logs -f app         # Next.js
docker compose logs -f scanner     # BullMQ worker
docker compose logs -f cloudflared # Tunnel status
```

### Database migrations

Run automatically at container startup. To run manually:

```bash
docker compose exec app npx prisma migrate deploy
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL 16 + Prisma 6 |
| Queue | Redis 7 + BullMQ |
| Auth | NextAuth v5 |
| Payments | Stripe |
| Email | Resend |
| AI | Anthropic Claude |
| Tunnel | Cloudflare Tunnel (cloudflared) |
