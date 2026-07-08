---
type: Charter/System
resource: docs/architecture.md
---

# System architecture

Integrated structural view of Nemo, compiled from the legacy `docs/architecture.md`. Nemo is a multi-company project management system (task tracking, time tracking, project documentation, PMO/RAID/EVM) deployed as a single Spring Boot JAR serving both the REST API and the React SPA. This page gives the cross-cutting picture; each area is detailed in its own concept and linked below.

## Backend architecture

Each domain package groups its own Controller, Service, Repository, Entity, DTO, and Mapper — package-by-feature, not package-by-layer. Controllers receive and return DTOs only; entities never leak through the API boundary.

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

Key backend components:

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

See [backend layering](/charter/overview/backend-layering.md) for the per-module pattern, [monorepo structure](/charter/overview/monorepo-structure.md) for the package layout, and the [modules index](/charter/modules/index.md) for each domain package.

## Frontend architecture

The SPA follows a layered architecture (Pages → Components → Stores → API Layer → WebSocket Hook) built with React 19, Zustand 5, Tailwind CSS v4, and React Router 7. The full structural view, tech stack, routing/guards, API client layer, state management, and dashboard details live in [frontend architecture](/charter/implementation/architecture/frontend-architecture.md).

## Security architecture

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

- **Authentication** — form-based login (`POST /api/auth/login`), JSESSIONID session cookie.
- **Authorization** — role-based at the endpoint level (`@PreAuthorize`) and service level via `AuthHelper`.
- **Multi-tenancy** — `CustomUserDetails` carries `companyId` (null = global user); `AuthHelper` provides company-scoped visibility (`canAccessProject`, `canAccessUser`).
- **CSRF** — enabled for browser clients, disabled for API-only clients.
- **CORS** — not needed (same-origin; Spring Boot serves the SPA).

The full role × action permissions matrix lives in [features and access](/charter/security/features-and-access.md); role meanings and `AuthHelper` checks are in [authorization (RBAC)](/charter/security/authorization-rbac.md). The login/session sequence diagram is in [UML diagrams](/charter/implementation/architecture/uml-diagrams.md).

## Real-time architecture (Kanban)

```
┌──────────┐    STOMP     ┌──────────────┐    JPA     ┌──────┐
│  Client A │◄────────────▶│  Spring       │◄─────────▶│  DB  │
└──────────┘              │  WebSocket    │            └──────┘
┌──────────┐    STOMP     │  Broker       │
│  Client B │◄────────────▶│               │
└──────────┘              └──────────────┘
```

When a task moves (status change), the backend publishes to `/topic/kanban/{projectId}`; all subscribed clients update their local board. The board component uses a `useKanbanWebSocket` hook for the STOMP connection. See [WebSockets](/charter/implementation/cross-cutting/websockets.md) and the Kanban sequence in [UML diagrams](/charter/implementation/architecture/uml-diagrams.md).

## File storage architecture

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

`StorageService` abstracts file operations; the default writes to a configurable local directory, swappable to S3 by implementing the same interface. Attachments link to tasks/wiki via the `Attachment` entity. See [file storage](/charter/implementation/cross-cutting/file-storage.md).

## Data flow — typical request

```
Browser (React)
    │
    │  POST /api/projects/1/tasks  (JSON body)
    ▼
Spring Security Filter Chain
    │  (authenticate session, check role)
    ▼
TaskController
    │  (validate input DTO, delegate to service)
    ▼
TaskService
    │  (business logic, authorization check, audit log)
    ▼
TaskRepository
    │  (persist entity)
    ▼
H2 / PostgreSQL
    │
    ▼
Response DTO returned → 201 Created
```

See [request data flow](/charter/overview/request-data-flow.md) for the full lifecycle and error response format.

## Deployment

```
┌───────────────────────────────────────────────┐
│            Single Spring Boot JAR             │
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

- **Development** — backend on 8080, Vite dev server on 5173, API proxied via Vite config.
- **Production** — `gradle build` bundles the React build into the JAR under `classpath:/static/`; single process, single port.

See [Nemo system](/charter/overview/nemo-system.md) for the deployment model and run modes.

## API design principles

- Top-level resources: `/api/auth`, `/api/users`, `/api/companies`, `/api/organization`, `/api/task-types`, `/api/task-statuses`, `/api/programs`, `/api/projects`, `/api/time-logs`, `/api/timesheets`, `/api/reports`, `/api/audit-logs`, `/api/attachments`.
- Nested under projects: `/api/projects/{id}/tasks`, `/api/projects/{id}/labels`, `/api/projects/{id}/sprints`, `/api/projects/{id}/backlog`, `/api/projects/{id}/board`, `/api/projects/{id}/wiki/pages`.
- Nested under tasks: `/api/projects/{projectId}/tasks/{taskId}/comments`, `/api/projects/{projectId}/tasks/{taskId}/attachments`.
- Pagination on list endpoints: `?page=0&size=20&sort=createdAt,desc`; consistent response wrapping for lists (total count for pagination).

See [REST conventions](/charter/implementation/api/rest-conventions.md) and [error handling](/charter/implementation/api/error-handling.md).

### Naming conventions glossary

The same domain concept uses different naming conventions by context:

| Context | Convention | Example |
|---------|-----------|---------|
| Java module/package | camelCase | `timetracking/` |
| Java entity/class | PascalCase | `TimeLog` |
| Database table/column | snake_case | `time_log` |
| REST API path | kebab-case, plural | `/api/time-logs` |
| Audit entity_type | UPPER_SNAKE | `TIME_LOG` |
| Frontend store | camelCase | `timeStore` |

See [database schema](/charter/overview/database-schema.md) for the full naming table.

## Cross-references

- [UML diagrams](/charter/implementation/architecture/uml-diagrams.md) — the diagrammatic views (class, use-case, state, sequence, component).
- [Overview](/charter/overview/index.md) — system shape, layering, request flow, tech stack.
- [Modules index](/charter/modules/index.md) — the domain packages this architecture is built from.
- [Security index](/charter/security/index.md) — authentication, RBAC, multi-tenancy, access matrix.