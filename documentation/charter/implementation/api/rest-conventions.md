---
type: Charter/Pattern
resource: backend/src/main/java/com/nemo
---

# REST conventions

## Path style

- Top-level resources: `/api/auth`, `/api/users`, `/api/companies`, `/api/organization`, `/api/programs`, `/api/projects`, `/api/finance`, `/api/bank-accounts`, `/api/reconciliation`, `/api/clients`, `/api/presales`, `/api/leave-requests`, `/api/assets`, `/api/locations`, `/api/audit-logs`, `/api/activity-logs`.
- Nested under projects: `/api/projects/{id}/tasks`, `/api/projects/{id}/sprints`, `/api/projects/{id}/phases`, `/api/projects/{id}/...`.
- Time tracking: `/api/time-logs`, `/api/timesheets`, `/api/time-reports`, `/api/user-rates`, `/api/reports`.

## Pagination

List endpoints use `?page=0&size=20&sort=createdAt,desc` and a consistent wrapped response including the total count.

## Naming glossary

| Context | Convention | Example |
|---------|-----------|---------|
| Java package | camelCase | `timetracking` |
| Java entity | PascalCase | `TimeLog` |
| DB table/column | snake_case | `time_log` |
| REST path | kebab-case plural | `/api/time-logs` |
| Audit entity_type | UPPER_SNAKE | `TIME_LOG` |

## Cross-references
- [Backend layering](/charter/overview/backend-layering.md) — controllers return DTOs only.
- [Frontend architecture](/charter/implementation/architecture/frontend-architecture.md) — API client layer that calls these paths.