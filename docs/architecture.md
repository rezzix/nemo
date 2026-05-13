# Nemo — High-Level System Architecture

## 1. Overview

Nemo is a multi-company project management system combining issue tracking, time tracking, project documentation, and PMO capabilities (RAID logs, EVM). It is deployed as a single Spring Boot JAR serving both the REST API and the React SPA.

---

## 2. Monorepo Structure

```
nemo/
├── backend/                    # Spring Boot application
│   └── src/
│       ├── main/java/com/nemo/
│       │   ├── config/             # Spring configuration (Security, WebSocket, CORS, DataSeeder)
│       │   ├── security/           # Auth filters, session management, RBAC, CustomUserDetails, AuthHelper
│       │   ├── common/             # Shared: DTOs, exceptions, audit, storage
│       │   ├── company/            # Company/tenant management module
│       │   ├── user/               # User management module
│       │   ├── program/            # Programs module
│       │   ├── project/            # Projects module
│       │   ├── issue/              # Issues/Tickets module
│       │   ├── sprint/             # Sprint & Backlog module
│       │   ├── timetracking/       # Time tracking module (includes UserRate)
│       │   ├── documentation/      # Wiki module
│       │   ├── pmo/                # PMO module (RAID items)
│       │   └── attachment/         # File attachment module
│       └── main/resources/
│           ├── application.yml         # H2 dev config
│           ├── application-prod.yml    # Postgres prod config
│           └── data.sql                # Schema seed data
├── frontend/                   # React + TypeScript SPA
│   └── src/
│       ├── api/                # Axios/fetch wrappers per domain
│       ├── components/         # Reusable UI components
│       ├── pages/              # Route-level pages
│       ├── stores/             # Zustand stores per domain
│       ├── hooks/              # Custom React hooks
│       ├── types/              # TypeScript interfaces
│       ├── utils/              # Helpers, formatters
│       └── App.tsx
├── postman/                    # Newman test collections
├── build.gradle                # Root Gradle build
└── settings.gradle
```

### Why package-by-feature (not package-by-layer)?

Each module (user, issue, timetracking...) groups its own controller, service, repository, entity, DTO, and mapper. This keeps related code together, makes it easy to navigate, and aligns with the "modular architecture" requirement. Cross-cutting concerns (security, audit, storage) live in `common` or `config`.

---

## 3. Backend Architecture

```
┌──────────────────────────────────────────────────────┐
│                     Controller                        │
│  REST endpoints, request validation, response DTOs   │
├──────────────────────────────────────────────────────┤
│                      Service                          │
│  Business logic, authorization checks, orchestration │
├──────────────────────────────────────────────────────┤
│                    Repository                         │
│  Spring Data JPA interfaces, DB access                │
├──────────────────────────────────────────────────────┤
│                  Database (H2 / Postgres)             │
└──────────────────────────────────────────────────────┘
```

Each module follows this layered pattern internally. Controllers receive and return DTOs only — entities never leak through the API boundary.

### Key Backend Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Web framework | Spring Boot 3 (Java 21) | REST API + static SPA hosting |
| Auth | Spring Security | Session-based authentication |
| Real-time | Spring WebSocket (STOMP) | Kanban board live updates |
| ORM | Spring Data JPA / Hibernate | Database access |
| DB (dev) | H2 file-based | Rapid prototyping |
| DB (prod) | PostgreSQL | Production database |
| DTO mapping | MapStruct | Entity ↔ DTO conversion |
| Validation | Spring Validation (Hibernate Validator) | Input validation |
| Audit | Spring AOP + custom listener | Auto-audit on create/update/delete |
| Storage | Filesystem (abstracted) | Attachments, swappable to S3 |

---

## 4. Frontend Architecture

```
┌──────────────────────────────────────────────────┐
│                    Pages                         │
│  Route-level components (Dashboard, Kanban,     │
│  Timesheet, WikiEditor...)                      │
├──────────────────────────────────────────────────┤
│                  Components                      │
│  Reusable UI: IssueCard, TimeLogForm, PageTree  │
├──────────────────────────────────────────────────┤
│                   Stores (Zustand)               │
│  Domain state: authStore, issueStore,           │
│  timeTrackingStore, wikiStore...                 │
├──────────────────────────────────────────────────┤
│                    API Layer                     │
│  Axios instances per domain with auth headers    │
├──────────────────────────────────────────────────┤
│                  WebSocket Hook                  │
│  STOMP client for Kanban real-time updates       │
└──────────────────────────────────────────────────┘
```

### Frontend Stack

| Concern | Choice |
|---------|--------|
| Framework | React 18+ with TypeScript |
| State | Zustand (one store per domain) |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Rich text | TipTap (Markdown editor) |
| Kanban DnD | @hello-pangea/dnd |
| HTTP client | Axios |
| WebSocket | SockJS + STOMP over WebSocket |

### Zustand Store Slices

```
authStore        → user session, login/logout, role
projectStore     → programs, projects, memberships
issueStore       → issues, filters, pagination
sprintStore      → sprints, backlog ordering
kanbanStore      → board columns, WebSocket updates
timeStore        → time logs, timesheets
wikiStore        → pages, page tree, search
uiStore          → sidebar state, modals, toasts
```

---

## 5. Security Architecture

```
┌────────────┐     ┌──────────────────┐     ┌───────────┐
│  Browser    │────▶│  Spring Security  │────▶│  Session  │
│  (React)   │◀────│  Filter Chain     │◀────│  Store    │
└────────────┘     └──────────────────┘     └───────────┘
                         │
                    ┌────▼────┐
                    │  RBAC   │
                    │ Admin   │
                    │ Manager │
                    │Contrib. │
                    └─────────┘
```

- **Authentication**: Form-based login (`POST /api/auth/login`), session cookie (JSESSIONID).
- **Authorization**: Role-based access at the endpoint level (`@PreAuthorize`) and service level via `AuthHelper`.
- **Multi-tenancy**: `CustomUserDetails` carries `companyId` (null = global user). `AuthHelper` provides company-scoped visibility checks (`canAccessProject`, `canAccessUser`).
- **CSRF**: Enabled for browser clients, disabled for API-only clients.
- **CORS**: Not needed (same-origin — Spring Boot serves the SPA).

### Role Permissions Matrix

| Action | Admin | Executive | Manager | Contributor |
|--------|-------|----------|---------|-------------|
| Manage users & organization config | Yes | No | No | No |
| Manage companies | Yes | No | No | No |
| Manage issue types & statuses | Yes | Read only | No | Read only |
| Manage programs/projects | Yes | Read own company | Yes (assigned) | No |
| Manage sprints & backlog | Yes | Read | Yes (assigned) | Read (assigned) |
| Configure Kanban board | Yes | Read | Yes (assigned) | Read only |
| Create/edit issues | Yes | Own projects | Yes (assigned) | Yes (assigned) |
| Delete issues | Yes | No | Yes (assigned) | Reporter only |
| Log time on issues | Yes | No | Yes (assigned) | Yes (assigned) |
| View timesheets | All | Own company | Own project members | Own only |
| Manage wiki pages | Yes | Own projects | Yes (assigned) | Yes (assigned) |
| View Kanban board | Yes | Own projects | Yes (assigned) | Yes (assigned) |
| Reports | All | Own company | Own projects | Own projects |
| Audit logs | Yes | No | No | No |

---

## 6. Real-Time Architecture (Kanban)

```
┌──────────┐    STOMP     ┌──────────────┐    JPA     ┌──────┐
│  Client A │◄────────────▶│  Spring       │◄─────────▶│  DB  │
└──────────┘              │  WebSocket    │            └──────┘
┌──────────┐    STOMP     │  Broker       │
│  Client B │◄────────────▶│               │
└──────────┘              └──────────────┘
```

- When an issue is moved (status change), the backend publishes a message to `/topic/kanban/{projectId}`.
- All connected clients subscribed to that project receive the update and update their local board state.
- The Kanban board component uses a custom `useKanbanWebSocket` hook to manage the STOMP connection.

---

## 7. File Storage Architecture

```
                      ┌─────────────────────┐
                      │  StorageService      │  ← Interface
                      │  (store, load, delete)│
                      └─────────┬───────────┘
                                │
                 ┌──────────────┴───────────────┐
                 │                                │
      ┌──────────▼──────────┐     ┌───────────────▼──────────┐
      │  FilesystemStorage  │     │  S3Storage               │
      │  (default)          │     │  (future implementation) │
      └─────────────────────┘     └──────────────────────────┘
```

- `StorageService` interface abstracts file operations.
- Default implementation writes to a configurable local directory.
- Swapping to S3 later means implementing the same interface — no changes to business logic.
- Attachments are linked to issues via the `Attachment` entity (stores filename, path, content type, size).

---

## 8. Data Flow — Typical Request

```
Browser (React)
    │
    │  POST /api/projects/1/issues  (JSON body)
    ▼
Spring Security Filter Chain
    │  (authenticate session, check role)
    ▼
IssueController
    │  (validate input DTO, delegate to service)
    ▼
IssueService
    │  (business logic, authorization check, audit log)
    ▼
IssueRepository
    │  (persist entity)
    ▼
H2 / PostgreSQL
    │
    ▼
Response DTO returned → 201 Created
```

---

## 9. Deployment

```
┌───────────────────────────────────────────────┐
│            Single Spring Boot JAR             │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │         REST API (/api/**)              │  │
│  │         WebSocket (/ws/**)              │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │    Static Resources (React SPA build)   │  │
│  │    served from / (classpath:/static/)   │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │    File Storage (local directory)       │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │    Database (H2 file / Postgres)        │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

- **Development**: Backend runs on port 8080, frontend dev server on port 5173 (Vite). API requests proxied via Vite config.
- **Production**: `gradle build` builds the React app and bundles it into the Spring Boot JAR under `classpath:/static/`. Single process, single port.

---

## 10. Audit Logging

- Uses Spring AOP with a custom `@Audited` annotation.
- Captures: who, what action, which entity, previous value (for updates), timestamp.
- Stored in a dedicated `audit_log` table.
- Applied to: Issue create/update/delete, TimeTracking create/update/delete.

---

## 11. Error Handling

- Global `@RestControllerAdvice` catches all exceptions.
- Consistent error response format:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Issue title must not be blank",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

- Validation errors use Spring Validator annotations on DTOs.
- Business exceptions throw custom exceptions (`EntityNotFoundException`, `AccessDeniedException`, etc.) mapped to appropriate HTTP status codes.

---

## 12. API Design Principles

- Top-level resources: `/api/auth`, `/api/users`, `/api/companies`, `/api/organization`, `/api/issue-types`, `/api/issue-statuses`, `/api/programs`, `/api/projects`, `/api/time-logs`, `/api/timesheets`, `/api/reports`, `/api/audit-logs`, `/api/attachments`
- Nested resources under projects: `/api/projects/{id}/issues`, `/api/projects/{id}/labels`, `/api/projects/{id}/sprints`, `/api/projects/{id}/backlog`, `/api/projects/{id}/board`, `/api/projects/{id}/wiki/pages`
- Nested resources under issues: `/api/projects/{projectId}/issues/{issueId}/comments`, `/api/projects/{projectId}/issues/{issueId}/attachments`
- Pagination on list endpoints: `?page=0&size=20&sort=createdAt,desc`
- Consistent response wrapping for lists (to include total count for pagination).

### Naming Conventions Glossary

The same domain concept uses different naming conventions depending on context:

| Context | Convention | Example |
|---------|-----------|---------|
| Java module/package | camelCase | `timetracking/` |
| Java entity/class | PascalCase | `TimeLog` |
| Database table/column | snake_case | `time_log` |
| REST API path | kebab-case, plural | `/api/time-logs` |
| Audit entity_type | UPPER_SNAKE | `TIME_LOG` |
| Frontend store | camelCase | `timeStore` |