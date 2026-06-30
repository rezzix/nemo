---
type: System
resource: frontend/src
---

# Frontend architecture

Integrated structural view of the React SPA, compiled from the frontend concept documents. Each subsection summarizes a concern; click through to the dedicated concept for full detail.

## Layer diagram

```
┌──────────────────────────────────────────────────────┐
│                    Pages                              │
│  Route-level components (Dashboard, Kanban,           │
│  Timesheet, WikiEditor…)                            │
├──────────────────────────────────────────────────────┤
│                  Components                           │
│  Reusable UI: TaskCard, TimeLogForm, PageTree        │
├──────────────────────────────────────────────────────┤
│                   Stores (Zustand)                    │
│  Domain state: authStore, taskStore,                  │
│  timeTrackingStore, wikiStore…                      │
├──────────────────────────────────────────────────────┤
│                    API Layer                          │
│  Axios instances per domain with auth headers         │
├──────────────────────────────────────────────────────┤
│                  WebSocket Hook                       │
│  STOMP client for Kanban real-time updates            │
└──────────────────────────────────────────────────────┘
```

## Tech stack

| Concern | Choice |
|---------|--------|
| Framework | React 19 + TypeScript |
| State | Zustand 5 (one store per domain) |
| Styling | Tailwind CSS v4 |
| Routing | React Router 7 |
| Rich text | TipTap (Markdown editor) |
| Kanban DnD | @hello-pangea/dnd |
| HTTP client | Axios |
| WebSocket | SockJS + STOMP over WebSocket |

## Directory layout

| Directory | Responsibility |
|-----------|----------------|
| `main.tsx` / `App.tsx` | entry + router (`BrowserRouter`) |
| `api/` | ~27 per-domain Axios client modules |
| `types/` | TypeScript interfaces mirroring backend DTOs |
| `stores/` | Zustand stores (`authStore`, `uiStore`) |
| `hooks/` | custom hooks (`useAuth`, `useHolidays`, `useMyTasks`, `useVersion`) |
| `components/` | `guards/`, `layout/`, `common/` |
| `pages/` | route-level pages, including role dashboards and reports |
| `utils/` | helpers (`availability`, `format`) |

The built bundle is served from the Spring Boot JAR (`classpath:/static/`) in production; Vite proxies `/api` to the backend in dev.

## Routing and guards

`App.tsx` wires a `BrowserRouter` and protects routes with guard components:

| Guard | Purpose |
|-------|---------|
| `GuestGuard` | wraps `/login` — redirects authenticated users away |
| `AuthGuard` + `AppLayout` | wraps all authenticated app routes |
| `RoleGuard` | gates routes by role (e.g. `/finance` → FINANCE, `/people` → HR/EXECUTIVE) |
| `AdminGuard` | gates admin-only routes |

A catch-all redirects unknown routes to `/`. Role gating aligns with the backend [RBAC model](/security/authorization-rbac.md).

Role gating aligns with the backend [RBAC model](/security/authorization-rbac.md); the guard hierarchy (GuestGuard → AuthGuard → RoleGuard/AdminGuard) is described in the Routing and guards section above.

## API client layer

Each backend domain has a matching Axios client in `api/` (e.g. `auth.ts`, `projects.ts`, `tasks.ts`, `sprints.ts`, `bankAccounts.ts`, `pmo.ts`, `wiki.ts`) and a matching TypeScript interface in `types/`. The Axios instance carries the session cookie automatically (same-origin).

The per-domain client list mirrors the backend module structure; see [REST conventions](/implementation/api/rest-conventions.md) for the API patterns they call.

## State management

Global client state lives in two Zustand 5 stores:

- **`authStore.ts`** — session, login/logout, role, `checkSession`, `sessionExpired`.
- **`uiStore.ts`** — sidebar state, modals, toasts.

Domain/server state is composed through custom hooks (`useAuth`, `useHolidays`, `useMyTasks`, `useVersion`) that call the API layer. The legacy docs describe more per-domain stores; the current codebase favors hooks + a few stores.

```
authStore        → user session, login/logout, role
projectStore     → programs, projects, memberships
taskStore        → tasks, filters, pagination
sprintStore      → sprints, backlog ordering
kanbanStore      → board columns, WebSocket updates
timeStore        → time logs, timesheets
wikiStore        → pages, page tree, search
uiStore          → sidebar state, modals, toasts
```

The store/hook breakdown is summarized in the table above.

## Dashboards and reports

`DashboardPage` delegates to role-specific dashboards under `pages/dashboard/` (Admin, Manager, Executive, HR, Finance, Contributor). A dedicated reports suite under `pages/reports/` renders Overview, Time, Velocity, Workload, Headcount, Aging, Attendance, Trends, and Portfolio views, with shared chart components (`BarChart`, `ReportStatCard`, `ProjectSelector`).

The role-to-dashboard mapping follows the [features and access](/security/features-and-access.md) matrix.

## Cross-references

- [System architecture](/implementation/architecture/system-architecture.md) — the overall system picture (backend, security, real-time, deployment).
- [UML diagrams](/implementation/architecture/uml-diagrams.md) — auth flow, Kanban real-time, and time-tracking sequences.
- [Tech stack](/overview/tech-stack.md) — version numbers.
- [Getting started](/overview/getting-started.md) — running the frontend dev server.