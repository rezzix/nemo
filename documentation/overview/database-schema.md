---
type: Schema
resource: backend/src/main/resources/application.yml
---

# Database schema

Nemo's schema is defined by JPA entities, not migration scripts:

- **Development** — H2 file DB at `./data/nemo-db`, console at `/h2-console`, `ddl-auto: update`.
- **Production** — PostgreSQL via `NEMO_DB_URL`/`NEMO_DB_USERNAME`/`NEMO_DB_PASSWORD`, `ddl-auto: validate`, `nemo.mode: prod`.
- **Seed data** — idempotent `MERGE` statements in `data.sql` (task types, task statuses, reference data).

## Naming conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Java package | camelCase | `timetracking` |
| Java entity | PascalCase | `TimeLog` |
| DB table/column | snake_case | `time_log` |
| REST path | kebab-case plural | `/api/time-logs` |
| Audit entity_type | UPPER_SNAKE | `TIME_LOG` |

## Portability

Column names that conflict with SQL reserved words use an underscore suffix (`key_`, `order_`, `role_`, `type_`, `action_`). The `User` table is named `app_user` and the `Comment` table is `task_comment`. This keeps the schema portable across H2, PostgreSQL, MySQL, and SQL Server.

## Entity model by module

The detailed per-table column/constraint/index specifications live in the legacy `docs/database-schema.md`. The entity groups, with field tables and ER diagrams, now live alongside their modules as `module-entities.md`:

- [Identity module entities](/modules/identity/module-entities.md) — `Company`, `User`.
- [Cross-cutting module entities](/modules/cross-cutting/module-entities.md) — `OrganizationConfig`, `TaskType`, `TaskStatus`, `PublicHoliday`, `AuditLog`, `ActivityLog`.
- [Delivery module entities](/modules/delivery/module-entities.md) — program/project/task/sprint/phase/PMO.
- [Commercial module entities](/modules/commercial/module-entities.md) — client, expense, payment.
- [Finance module entities](/modules/finance/module-entities.md) — banks and reconciliation.
- [HR module entities](/modules/hr/module-entities.md) — leave and (planned) evaluation.
- [Time tracking module entities](/modules/timetracking/module-entities.md) — time log, user rate, timesheet.
- [Content module entities](/modules/content/module-entities.md) — wiki, attachment, asset, location.

## Cross-references

- [Multi-tenancy](/security/multi-tenancy.md) — the `company_id` scoping convention.
- [Backend layering](/overview/backend-layering.md) — the Entity/Repository tier that owns this schema.