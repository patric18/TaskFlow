# TaskFlow Architecture

## System overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                           │
│  React 18 + Vite │ React Router │ Zustand │ React Query        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST
                             │ Authorization: Bearer <JWT>
                             │ Cookie: refreshToken (httpOnly)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express API (Node.js)                        │
│  Routes → Controllers → Services → Prisma                       │
│  Middleware: auth, rate limit, validation, error handler        │
└──────┬──────────────────┬──────────────────┬────────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
  PostgreSQL           Redis            External APIs
  (Prisma ORM)    (rate limits)     Stripe, Resend, Cloudinary
```

## Database schema

```
User ──────────────┬── Organization (owner)
  │                │
  ├── OrgMember ───┘
  ├── Task (assignee)
  ├── Comment (author)
  ├── Notification
  ├── RefreshToken
  └── PasswordResetToken

Organization ── Project ── Task ── Comment
                    │
                    └── Label ── TaskLabel
```

### Key models

| Model | Purpose |
|-------|---------|
| `User` | Auth, profile, plan, Stripe customer ID, onboarding completion |
| `Organization` | Workspace with slug, plan, subscription ID |
| `OrganizationMember` | Membership + role (OWNER, ADMIN, MEMBER) |
| `Project` | Board container within an org |
| `Task` | Kanban card: status, priority, position, assignee |
| `Comment` | Thread on a task |
| `Notification` | In-app alerts with JSON metadata |
| `RefreshToken` | Rotating refresh token store |
| `StripeWebhookEvent` | Webhook idempotency |

Full schema: `server/prisma/schema.prisma`

## Authentication flow

```
Register/Login
     │
     ▼
issueAuthSession()
     ├── signAccessToken (15 min) → returned in JSON body
     └── createRefreshToken (7 days) → httpOnly cookie on /api/auth
              │
              ▼
Client stores accessToken in Zustand (persisted)
              │
              ▼
API requests: Authorization: Bearer <accessToken>
              │
              ▼ (401)
Axios interceptor → POST /api/auth/refresh (cookie sent automatically)
              │
              ├── success → retry original request with new token
              └── failure → logout, redirect to /login
```

**Security notes:**
- Passwords hashed with bcrypt (12 rounds)
- Refresh tokens stored hashed in DB; rotated on each refresh
- Auth routes rate-limited (5 req / 15 min in production)
- Production errors never expose stack traces

## Authorization (RBAC)

Every resource access goes through service-layer checks:

1. `requireOrgMembership(userId, organizationId)` — user belongs to org  
2. `requireOrgAdmin(...)` — role is ADMIN or OWNER  
3. Owner-only actions — billing, ownership transfer  

Plan limits (`assertCanCreateProject`, `assertCanAddMember`) run before create operations.

## Billing flow

```
Production (Stripe configured):
  OWNER → POST /billing/checkout → Stripe Checkout
       → webhook → upgrade org + owner to PRO

Development (no Stripe keys):
  OWNER → POST /billing/dev-upgrade → direct DB upgrade (blocked in production)
```

Webhook handler is idempotent via `StripeWebhookEvent` table.

## Kanban position logic

`PATCH /api/tasks/:id/position` renumbers tasks sequentially (0, 1, 2…) in affected columns after every drag — no gaps or duplicates.

## Frontend architecture

```
App.jsx
├── ThemeProvider          (dark class on <html>)
├── QueryClientProvider    (React Query cache)
└── BrowserRouter
    ├── GuestRoute         (login/register)
    └── ProtectedRoute     (sync /users/me if needed)
        ├── /onboarding    (OnboardingPage)
        └── OnboardingGuard
            └── AppLayout
                ├── NotificationBell  (poll unread count)
                ├── ThemeToggle
                ├── Sidebar           (org switcher, projects)
                └── Outlet            (pages)
```

### State management

| Layer | Tool | Used for |
|-------|------|----------|
| Auth session | Zustand + persist | `accessToken`, `user` |
| Current org | Zustand + persist | `currentOrganizationId` |
| Theme | Zustand + persist | `light` / `dark` |
| Server data | React Query | Projects, tasks, members, notifications, billing |

### Key hooks

| Hook | Responsibility |
|------|----------------|
| `useAuth` | Login, register, logout |
| `useOrganizations` | List orgs, current org selection |
| `useProjects` / `useTasks` | CRUD + kanban mutations |
| `useTeam` | Invite, roles, remove |
| `useBilling` | Plans, checkout, dev upgrade |
| `useNotifications` | List, unread count, mark read |
| `useTheme` | Theme toggle |

## Notification pipeline

Events that create notifications (server-side in transactions):

| Event | Type | Recipient |
|-------|------|-----------|
| Task assigned | `TASK_ASSIGNED` | Assignee |
| Comment on assigned task | `TASK_COMMENT` | Assignee |
| Member invited | `MEMBER_INVITED` | Invited user |
| Member removed | `MEMBER_REMOVED` | Removed user |
| Plan upgraded | `PLAN_UPGRADED` | Org owner |

Client polls unread count every 30s; clicking a notification navigates via `metadata` (project/task IDs).

## Onboarding flow

New registrations get `onboardingCompleted: false`:

1. Rename default workspace  
2. Create first project  
3. Invite teammate (optional skip)  
4. `POST /users/me/complete-onboarding`  

`OnboardingGuard` blocks main app routes until complete.

## Error handling

```
Request → validate (Zod) → service (AppError) → errorHandler middleware
```

`AppError` carries HTTP status + message. Unknown errors return generic 500 in production.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):

1. **Lint** — ESLint client + server  
2. **test-server** — Jest + PostgreSQL + Redis services  
3. **test-client** — Vitest + coverage  
4. **build** — Vite build + Prisma generate  

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production hosting.
