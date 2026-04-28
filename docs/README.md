# TaskFlow Documentation

TaskFlow is a project and task management SaaS for small teams — kanban boards, team collaboration, billing, and in-app notifications.

## Documents

| Document | Description |
|----------|-------------|
| [PRODUCT.md](./PRODUCT.md) | Features, user roles, demo accounts |
| [API.md](./API.md) | REST API reference (all endpoints) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, auth flow, frontend architecture |
| [SETUP.md](./SETUP.md) | Local development setup and troubleshooting |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment (Vercel + Railway) |

## Quick links

```bash
cd taskflow
npm install
npm run docker:up
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run db:migrate
npm run db:seed          # optional demo data
npm run dev
```

- Frontend: http://localhost:5173  
- API health: http://localhost:3001/api/health  
- API reference: [API.md](./API.md)

## Demo accounts

After running `npm run db:seed`:

| Email | Password | Role |
|-------|----------|------|
| `demo@taskflow.app` | `password123` | Workspace owner |
| `bob@taskflow.app` | `password123` | Admin |
| `carol@taskflow.app` | `password123` | Member |

Workspace **Acme Team** includes two projects, kanban tasks, comments, labels, and sample notifications.
