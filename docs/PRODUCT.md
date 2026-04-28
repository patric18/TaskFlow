# TaskFlow — Product Overview

TaskFlow helps small teams plan work with kanban boards, assign tasks, collaborate via comments, and manage workspace billing — without the complexity of enterprise PM tools.

## Core features

| Feature | Description |
|---------|-------------|
| **Authentication** | Register, login, JWT access + refresh tokens, forgot/reset password |
| **Workspaces** | Organizations with OWNER / ADMIN / MEMBER roles |
| **Projects** | Color-coded project boards per workspace |
| **Kanban** | Drag-and-drop tasks across To Do → In Progress → Review → Done |
| **Task details** | Rich text descriptions (TipTap), assignee, due date, priority, comments |
| **Team** | Invite existing users by email, change roles, remove members |
| **Billing** | Free vs Pro plans; Stripe checkout in production; dev billing without Stripe |
| **Notifications** | Bell icon with unread count, mark-as-read, deep links to tasks |
| **Dark mode** | Light/dark theme toggle, persisted in localStorage |
| **Onboarding** | 3-step wizard for new users: workspace → project → invite teammate |

## Plans and limits

| Plan | Projects | Members | File uploads |
|------|----------|---------|--------------|
| **Free** | 3 max | 5 max | No |
| **Pro** | Unlimited | Unlimited | Yes (10 MB, Cloudinary) |

Limits are enforced server-side in `planService.js`.

## User roles

| Role | Permissions |
|------|-------------|
| **OWNER** | Full control including billing and ownership transfer |
| **ADMIN** | Manage projects, tasks, invite/remove members (not owner) |
| **MEMBER** | Create and update assigned tasks, comment |

## Application routes (frontend)

| Path | Description |
|------|-------------|
| `/login`, `/register` | Auth pages |
| `/onboarding` | New-user setup wizard |
| `/dashboard` | Overview (placeholder stats) |
| `/projects` | Project list |
| `/projects/:id` | Kanban board + task modal |
| `/settings/profile` | Profile + appearance |
| `/settings/team` | Team management |
| `/settings/billing` | Plan comparison and upgrade |

## Tech stack summary

- **Frontend:** React 18, Vite, React Router, Tailwind, Zustand, React Query, Motion, Axios  
- **Backend:** Node.js, Express, Prisma, PostgreSQL, Redis, JWT, Zod  
- **Integrations:** Stripe, Resend, Cloudinary (optional)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system diagrams and data flows.
