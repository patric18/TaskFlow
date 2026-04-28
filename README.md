# TaskFlow

Project and task management for small teams — a simplified Trello/Asana alternative built as a production-ready SaaS.

## Monorepo Structure

```
taskflow/
├── client/          # React 18 + Vite frontend
├── server/          # Node.js + Express backend
├── docs/            # Documentation
└── .github/         # CI/CD workflows
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, React Router, Tailwind CSS, Zustand, React Query, Motion, Axios |
| Backend | Node.js, Express, Prisma, PostgreSQL, Redis, JWT, Zod |
| Integrations | Stripe, Resend, Cloudinary |

## Quick Start (Steps 1–2)

### Prerequisites

- **Node.js 20 LTS** (recommended — `nvm use` reads `.nvmrc`)
- **Docker** (recommended — runs PostgreSQL + Redis)
- npm 9+

> Node 18 may work for the running app, but several dev dependencies (MSW, Prisma CLI) expect Node 20+. Upgrade with `nvm install 20 && nvm use`.

### Install

```bash
cd taskflow
npm install
```

### Start database + Redis

```bash
npm run docker:up
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run db:migrate
```

### Run locally

```bash
# Terminal 1 — API server (port 3001)
npm run dev:server

# Terminal 2 — React app (port 5173)
npm run dev:client

# Or both concurrently
npm run dev
```

### Verify

- Frontend: http://localhost:5173 — TaskFlow welcome page
- API health: http://localhost:3001/api/health — `{ "status": "ok", "database": { "status": "ok" } }`

### Troubleshooting

**`EADDRINUSE: address already in use :::3001`** — a previous server process is still running:

```bash
lsof -ti:3001 | xargs kill -9
npm run dev:server
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client + server concurrently |
| `npm run dev:client` | Start Vite dev server |
| `npm run dev:server` | Start Express API with hot reload |
| `npm run build` | Build client and generate Prisma client |
| `npm run lint` | Lint client and server |
| `npm run test` | Run all tests (Step 15+) |

## Environment Variables

Copy example files before running full app (Step 2+):

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

See `docs/SETUP.md` for the complete variable reference.

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/SETUP.md](docs/SETUP.md) | Local setup and troubleshooting |
| [docs/API.md](docs/API.md) | REST API reference |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment |
| [docs/PRODUCT.md](docs/PRODUCT.md) | Features and roles |

### Demo data

```bash
npm run db:seed
# Login: demo@taskflow.app / password123
```

## Development Roadmap

| Step | Status | Description |
|------|--------|-------------|
| 1 | ✅ | Monorepo structure + package.json files |
| 2 | ✅ | Prisma schema + first migration |
| 3 | ✅ | Express auth routes |
| 4 | ✅ | React auth pages + protected routes |
| 5 | ✅ | Projects CRUD (backend + frontend) |
| 6 | ✅ | Kanban board with drag-and-drop |
| 7 | ✅ | Task detail modal with comments |
| 8 | ✅ | Team/member management |
| 9 | ✅ | Stripe billing integration |
| 10 | ✅ | In-app notifications (bell + dropdown) |
| 11 | ✅ | Dark mode toggle (localStorage) |
| 12 | ✅ | Onboarding flow (workspace → project → invite) |
| 13 | ✅ | Full documentation |
| 14 | ✅ | Database seed with demo data |
| 15 | ✅ | Test suite (Jest + Vitest, 80% coverage) |

## License

Proprietary — TaskFlow SaaS application.
