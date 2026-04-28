# TaskFlow API Reference

## Authentication

All protected routes require:

```
Authorization: Bearer <accessToken>
```

Access tokens expire in **15 minutes**. Refresh tokens are stored in an **httpOnly cookie** (`refreshToken`, path `/api/auth`, 7-day expiry).

## Rate limiting

| Scope | Limit | Window |
|-------|-------|--------|
| General API | 100 requests | 15 minutes |
| `/api/auth/*` | 5 requests | 15 minutes |

Exceeded limits return `429 Too Many Requests` with `Retry-After` header (auth routes).

---

## Auth

### POST /api/auth/register

Create a new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Jane Doe"
}
```

**Validation:**
- `email` — valid email format
- `password` — min 8 characters
- `name` — required, max 100 characters

**Response `201`:**
```json
{
  "accessToken": "eyJ...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "Jane Doe",
    "avatar": null,
    "role": "USER",
    "plan": "FREE",
    "onboardingCompleted": false,
    "createdAt": "2026-05-31T19:00:00.000Z"
  }
}
```

Sets `refreshToken` httpOnly cookie.

**Errors:**
| Status | Message |
|--------|---------|
| 400 | Validation error (invalid email, short password, missing name) |
| 409 | Email already exists |
| 429 | Too many authentication attempts |

---

### POST /api/auth/login

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response `200`:**
```json
{
  "accessToken": "eyJ...",
  "user": { "...": "..." }
}
```

Sets `refreshToken` httpOnly cookie.

**Errors:**
| Status | Message |
|--------|---------|
| 400 | Validation error |
| 401 | Invalid credentials |
| 429 | Too many authentication attempts |

---

### POST /api/auth/logout

Requires `refreshToken` cookie (no body).

**Response `200`:**
```json
{ "message": "Logged out successfully" }
```

Clears refresh cookie and invalidates the token.

---

### POST /api/auth/refresh

Requires `refreshToken` cookie (no body). Implements **token rotation** — old refresh token is marked used, new one issued.

**Response `200`:**
```json
{ "accessToken": "eyJ..." }
```

**Errors:**
| Status | Message |
|--------|---------|
| 401 | Refresh token required / expired / already used / invalid |

---

### POST /api/auth/forgot-password

Always returns `200` to prevent email enumeration.

**Body:**
```json
{ "email": "user@example.com" }
```

**Response `200`:**
```json
{
  "message": "If an account exists with that email, a reset link has been sent"
}
```

Reset token stored in DB with **1-hour expiry**. Email sent via Resend (logged to console in dev if not configured).

---

### POST /api/auth/reset-password

**Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "newpassword123"
}
```

**Response `200`:**
```json
{ "message": "Password reset successfully" }
```

Invalidates all refresh tokens for the user.

**Errors:**
| Status | Message |
|--------|---------|
| 400 | Reset token expired / already used / invalid |
| 400 | Password validation failed |

---

## Health

### GET /api/health

**Response `200`:**
```json
{
  "status": "ok",
  "service": "taskflow-api",
  "version": "1.0.0",
  "timestamp": "2026-05-31T19:00:00.000Z",
  "database": { "status": "ok" }
}
```

Returns `503` if database is unreachable.

---

## Users

### GET /api/users/me

Requires Bearer token.

**Response `200`:**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "Jane Doe",
    "avatar": null,
    "role": "USER",
    "plan": "FREE",
    "onboardingCompleted": true,
    "createdAt": "2026-05-31T19:00:00.000Z"
  }
}
```

New registrations return `"onboardingCompleted": false` until setup is finished.

### PATCH /api/users/me

**Body:** `{ "name": "New Name" }`

### POST /api/users/me/complete-onboarding

Marks the user's onboarding wizard as complete. Called after the 3-step setup (workspace, project, optional invite).

**Response `200`:** `{ "user": { ..., "onboardingCompleted": true } }`

---

## Organizations

### GET /api/organizations

List organizations the user belongs to. Auto-creates a default workspace if none exists.

**Response `200`:**
```json
{
  "organizations": [
    {
      "id": "clx...",
      "name": "Jane's Workspace",
      "slug": "jane-workspace",
      "plan": "FREE",
      "role": "OWNER",
      "projectCount": 2,
      "memberCount": 1,
      "createdAt": "..."
    }
  ]
}
```

### GET /api/organizations/:id

**Response `200`:** `{ "organization": { ... } }`

**Errors:** `403` if not a member

---

## Projects

All project routes require Bearer token.

### GET /api/projects?organizationId=

**Response `200`:**
```json
{
  "projects": [
    {
      "id": "clx...",
      "name": "Marketing",
      "description": "...",
      "organizationId": "clx...",
      "color": "#3b82f6",
      "taskCount": 0,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### POST /api/projects

**Body:**
```json
{
  "name": "Marketing",
  "description": "Optional",
  "organizationId": "clx...",
  "color": "#3b82f6"
}
```

**Response `201`:** `{ "project": { ... } }`

**Errors:**
| Status | Message |
|--------|---------|
| 403 | Not a member / insufficient permissions |
| 403 | Project limit reached (Free plan: 3 max) |

### GET /api/projects/:id

### PATCH /api/projects/:id

**Body:** `{ "name", "description", "color" }` (at least one field)

### DELETE /api/projects/:id

**Response `200`:** `{ "message": "Project deleted successfully" }`

---

## Tasks

All task routes require Bearer token.

### GET /api/tasks?projectId=&status=&assigneeId=

**Response `200`:** `{ "tasks": [ ... ] }`

### POST /api/tasks

**Body:**
```json
{
  "title": "Design homepage",
  "projectId": "clx...",
  "status": "TODO",
  "priority": "HIGH",
  "assigneeId": null,
  "description": "Optional"
}
```

**Response `201`:** `{ "task": { ... } }`

Creates notification when `assigneeId` is set.

### GET /api/tasks/:id

### PATCH /api/tasks/:id

### PATCH /api/tasks/:id/position

Drag-and-drop reorder. Renumbers all tasks in affected columns to sequential positions (0, 1, 2…).

**Body:**
```json
{
  "status": "IN_PROGRESS",
  "position": 1
}
```

### DELETE /api/tasks/:id

Requires ADMIN or OWNER role.

---

## Comments

### GET /api/tasks/:taskId/comments

**Response `200`:** `{ "comments": [ ... ] }`

### POST /api/tasks/:taskId/comments

**Body:** `{ "content": "Looks good!" }`

**Response `201`:** `{ "comment": { ... } }`

Notifies task assignee (if not the author).

### DELETE /api/comments/:id

Author or org ADMIN/OWNER only.

---

## Organization members

### GET /api/organizations/:id/members

**Response `200`:** `{ "members": [ { "userId", "name", "email", "avatar", "role" } ] }`

### POST /api/organizations/:id/members/invite

Requires ADMIN or OWNER.

**Body:** `{ "email": "user@example.com", "role": "MEMBER" }`

**Response `201`:** `{ "member": { ... } }`

**Errors:** `403` member limit (Free: 5 max) · `404` user not registered · `409` already a member

### PATCH /api/organizations/:id/members/:userId

**Body:** `{ "role": "ADMIN" }`

### DELETE /api/organizations/:id/members/:userId

ADMIN can remove MEMBERs. OWNER can remove ADMINs. Cannot remove OWNER or yourself.

### PATCH /api/organizations/:id

**Body:** `{ "name": "New Workspace Name" }`

---

## Billing

### GET /api/billing/plans

Public. Returns Free and Pro plan comparison plus flags:

- `stripeConfigured` — real Stripe keys are set
- `devBillingAvailable` — dev-only upgrade without Stripe (never `true` in production)

### POST /api/billing/checkout

Requires Bearer token + organization OWNER.

**Body:** `{ "organizationId": "clx..." }`

**Response `200`:** `{ "url": "https://checkout.stripe.com/...", "sessionId": "..." }`

### POST /api/billing/portal

Requires active Pro subscription. Opens Stripe Customer Portal.

**Body:** `{ "organizationId": "clx..." }`

### POST /api/billing/dev-upgrade

Development only (when `devBillingAvailable` is true). OWNER activates Pro without payment.

**Body:** `{ "organizationId": "clx..." }`

**Response `200`:** `{ "plan": "PRO", "mode": "dev" }`

### POST /api/billing/dev-downgrade

Development only. OWNER downgrades to Free without Stripe.

**Body:** `{ "organizationId": "clx..." }`

**Response `200`:** `{ "plan": "FREE", "mode": "dev" }`

### POST /api/billing/webhook

Stripe webhook (raw body + `Stripe-Signature` header). Handles subscription create/update/delete with idempotency.

---

## Notifications

All routes require Bearer token.

### GET /api/notifications?limit=20&unreadOnly=true

**Response `200`:** `{ "notifications": [ ... ] }`

Each notification: `{ id, type, message, read, metadata, createdAt }`

Types: `TASK_ASSIGNED`, `TASK_COMMENT`, `TASK_STATUS_CHANGED`, `MEMBER_INVITED`, `MEMBER_REMOVED`, `PLAN_UPGRADED`, `GENERAL`

### GET /api/notifications/unread-count

**Response `200`:** `{ "count": 3 }`

### PATCH /api/notifications/:id/read

**Response `200`:** `{ "notification": { ... } }`

### POST /api/notifications/read-all

**Response `200`:** `{ "updated": 5 }`

---
