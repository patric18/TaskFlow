# TaskFlow Deployment Guide

Deploy TaskFlow as a split stack: **Vercel** for the React frontend and **Railway** (or similar) for the Express API, PostgreSQL, and Redis.

## Architecture in production

```
Users → Vercel (static SPA + CDN)
          │
          └── API calls → Railway (Express)
                              ├── PostgreSQL (Railway plugin)
                              ├── Redis (Railway plugin)
                              └── Stripe / Resend / Cloudinary webhooks
```

## 1. Prerequisites

- GitHub repository with TaskFlow code
- [Vercel](https://vercel.com) account
- [Railway](https://railway.app) account (or Render/Fly.io)
- [Stripe](https://stripe.com) account (live keys for production billing)
- [Resend](https://resend.com) account (transactional email)
- Domain name (optional but recommended)

## 2. Deploy backend (Railway)

### Create project

1. New Railway project → **Deploy from GitHub repo**
2. Set root directory to `server` (or deploy from monorepo with custom start command)
3. Add **PostgreSQL** and **Redis** plugins

### Environment variables

Set these in Railway service variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` (or Railway's assigned `PORT`) |
| `CLIENT_URL` | `https://your-app.vercel.app` |
| `DATABASE_URL` | From Railway PostgreSQL plugin |
| `REDIS_URL` | From Railway Redis plugin |
| `JWT_ACCESS_SECRET` | Random 32+ char string |
| `JWT_REFRESH_SECRET` | Different random 32+ char string |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook config |
| `STRIPE_PRO_PRICE_ID` | Live Price ID |
| `RESEND_API_KEY` | `re_...` |
| `EMAIL_FROM` | `TaskFlow <noreply@yourdomain.com>` |
| `LOG_LEVEL` | `info` |

**Do not set** `BILLING_DEV_MODE` in production.

### Build and start commands

```bash
# Build (install + Prisma generate)
npm ci && npx prisma generate

# Start
npx prisma migrate deploy && node src/server.js
```

Or add a `railway.toml` / use Railway's Nixpacks with `server/package.json` scripts:

```json
"start": "node src/server.js"
```

Run migrations on deploy:

```bash
npx prisma migrate deploy
```

### Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint  
2. URL: `https://your-api.railway.app/api/billing/webhook`  
3. Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`  
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

### Health check

Configure Railway health check path: `GET /api/health`

## 3. Deploy frontend (Vercel)

### Import project

1. Vercel → New Project → Import GitHub repo  
2. **Root directory:** `client`  
3. Framework preset: **Vite**

### Environment variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-api.railway.app/api` |

### Build settings

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm ci` (from monorepo root, use `cd .. && npm ci` if needed) |

For npm workspaces monorepo, set Vercel root to `client` and ensure dependencies install from workspace root, or use:

```bash
cd .. && npm ci && cd client && npm run build
```

### SPA routing

Add `client/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## 4. CORS and cookies

Ensure `CLIENT_URL` on the server exactly matches the Vercel URL (including `https`).

Refresh token cookies use:
- `httpOnly: true`
- `secure: true` in production
- `sameSite: 'lax'`
- `path: '/api/auth'`

Frontend Axios must use `withCredentials: true` (already configured in `client/src/api/client.js`).

## 5. GitHub Actions CI/CD

CI runs automatically on push/PR to `main` and `develop` (`.github/workflows/ci.yml`):

| Job | What it does |
|-----|--------------|
| `lint` | ESLint both packages |
| `test-server` | Jest with Postgres + Redis service containers |
| `test-client` | Vitest with coverage threshold |
| `build` | Vite build + Prisma generate |

### Optional: deploy on merge

Add deploy steps after CI passes:

**Vercel:** Connect repo in Vercel dashboard — auto-deploys on push to main.

**Railway:** Enable auto-deploy from main branch, or add GitHub Action:

```yaml
# Example — requires RAILWAY_TOKEN secret
- name: Deploy to Railway
  run: railway up --service api
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 6. Production checklist

- [ ] Strong JWT secrets (never reuse dev values)
- [ ] `NODE_ENV=production`
- [ ] Database migrations applied (`prisma migrate deploy`)
- [ ] Stripe live keys + webhook configured
- [ ] Resend domain verified
- [ ] `CLIENT_URL` matches frontend domain
- [ ] HTTPS everywhere
- [ ] Rate limits appropriate for traffic
- [ ] Error logging/monitoring (e.g. Railway logs, Sentry)
- [ ] Database backups enabled (Railway Postgres)

## 7. Post-deploy verification

```bash
curl https://your-api.railway.app/api/health
# → { "status": "ok", "database": { "status": "ok" } }

curl https://your-app.vercel.app
# → TaskFlow login page
```

Register a test user, complete onboarding, create a project, and run a test Stripe checkout in live mode with a test card before going public.

## 8. Scaling notes

| Component | Scale approach |
|-----------|----------------|
| Frontend | Vercel CDN — automatic |
| API | Railway horizontal scaling or multiple instances behind load balancer |
| PostgreSQL | Railway plan upgrade; connection pooling (PgBouncer) at scale |
| Redis | Required for distributed rate limiting if running multiple API instances |

## 9. Rollback

- **Vercel:** Redeploy previous deployment from dashboard  
- **Railway:** Roll back to previous deployment  
- **Database:** Restore from backup; avoid destructive migrations without backup
