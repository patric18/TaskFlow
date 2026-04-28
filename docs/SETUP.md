# TaskFlow Setup Guide

Step-by-step instructions for running TaskFlow locally.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20 LTS | `nvm use` reads `.nvmrc` |
| npm | 9+ | Included with Node |
| Docker | Latest | For PostgreSQL + Redis (recommended) |
| PostgreSQL | 16+ | Only if not using Docker |
| Redis | 7+ | Only if not using Docker |

## 1. Clone and install

```bash
cd taskflow
npm install
```

## 2. Start infrastructure (Docker — recommended)

```bash
npm run docker:up
```

This starts:
- **PostgreSQL 16** on `localhost:5432` (user/pass/db: `postgres`/`postgres`/`taskflow`)
- **Redis 7** on `localhost:6379`

Verify containers are healthy:

```bash
docker compose ps
```

## 3. Configure environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Server environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `PORT` | Yes | API port (default `3001`) |
| `CLIENT_URL` | Yes | Frontend URL for CORS (default `http://localhost:5173`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DATABASE_TEST_URL` | Tests | Separate DB for Jest (default `taskflow_test`) |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_ACCESS_SECRET` | Step 3+ | Min 32 chars — access token signing key |
| `JWT_REFRESH_SECRET` | Step 3+ | Min 32 chars — refresh token signing key |
| `JWT_ACCESS_EXPIRES_IN` | No | Default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | No | Default `7d` |
| `STRIPE_SECRET_KEY` | Step 9 | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Step 9 | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | Step 9 | Stripe Price ID for Pro plan |
| `BILLING_DEV_MODE` | No | `true` = allow dev billing without Stripe (never in production) |
| `RESEND_API_KEY` | Step 3 | Resend email API key |
| `EMAIL_FROM` | Step 3 | Sender address for transactional email |
| `CLOUDINARY_*` | Step 8+ | Cloudinary credentials for avatar uploads |

### Client environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL (default `http://localhost:3001/api`) |

## 4. Run database migrations

```bash
npm run db:migrate
```

This applies all Prisma migrations to your local PostgreSQL database.

Create the test database (for Step 15 tests):

```bash
docker exec taskflow-postgres psql -U postgres -c "CREATE DATABASE taskflow_test;"
```

## 5. Start development servers

```bash
# Both client + server
npm run dev

# Or separately:
npm run dev:server   # http://localhost:3001
npm run dev:client   # http://localhost:5173
```

## 6. Verify setup

| Check | Expected result |
|-------|-----------------|
| `GET http://localhost:3001/api/health` | `{ "status": "ok", "database": { "status": "ok" } }` |
| `http://localhost:5173` | TaskFlow welcome page |

## Database schema

Models defined in `server/prisma/schema.prisma`:

| Model | Purpose |
|-------|---------|
| `User` | Accounts, auth, billing, onboarding completion |
| `Organization` | Team workspace with plan limits |
| `OrganizationMember` | User ↔ org membership with roles |
| `Project` | Project boards within an org |
| `Task` | Kanban tasks with status, priority, position |
| `Comment` | Task comments |
| `Label` / `TaskLabel` | Project labels on tasks |
| `Notification` | In-app notifications |
| `RefreshToken` | JWT refresh token rotation (Step 3) |
| `PasswordResetToken` | Password reset flow (Step 3) |
| `StripeWebhookEvent` | Webhook idempotency (Step 9) |

### Plan limits (enforced server-side in Step 9)

| Plan | Organizations | Projects | Members | File uploads |
|------|--------------|----------|---------|--------------|
| Free | 1 | 3 max | 5 max | No |
| Pro | Unlimited | Unlimited | Unlimited | Yes (10MB) |

## Useful commands

```bash
npm run db:studio      # Prisma Studio GUI
npm run db:seed        # Seed demo data (Step 14)
npm run docker:down    # Stop PostgreSQL + Redis
npm run docker:logs    # View container logs
npm run lint             # ESLint both packages
npm run test             # Run all tests (server + client)
npm run test:coverage    # Coverage report (80% threshold)
```

## Troubleshooting

**Database connection failed**

```bash
npm run docker:up
docker compose ps   # both should show "healthy"
```

**Port 3001 in use**

```bash
lsof -ti:3001 | xargs kill -9
```

**429 Too many authentication attempts**

Auth routes are limited to **5 requests per 15 minutes per IP** in production. During local testing, earlier requests (register, login, refresh) share one counter and can exhaust the limit quickly.

Clear rate-limit keys in Redis:

```bash
npm run rate-limit:reset
```

In development, the limit is relaxed to 100 requests per 15 minutes (production uses 5). Restart the server after pulling the latest code.

**Migration drift**

```bash
cd server && npx prisma migrate reset   # WARNING: deletes all data
```

## Database seeding

Load realistic demo data (workspace, projects, tasks, comments, notifications):

```bash
npm run db:seed
```

**Demo logins** (password: `password123`):

| Email | Role |
|-------|------|
| `demo@taskflow.app` | Owner (Pro workspace) |
| `bob@taskflow.app` | Admin |
| `carol@taskflow.app` | Member |

Re-running the seed removes and recreates demo users (emails above only). Your personal accounts are untouched.

To reset everything including your data:

```bash
cd server && npx prisma migrate reset
# WARNING: deletes all database rows, re-runs migrations + seed
```
