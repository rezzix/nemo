---
type: Charter/Module
resource: backend/src/main/java/com/nemo/user
---

# User module

`user/` manages users.

Roles: `ADMIN`, `MANAGER`, `CONTRIBUTOR`, `EXECUTIVE`, `HR`, `EXTERNAL` (the frontend `RoleGuard` also references `FINANCE`).

## API

`UserController` exposes `/api/users` for user CRUD and allocation summaries used by capacity/headcount reporting.

## Cross-references

- [Authorization (RBAC)](/charter/security/authorization-rbac.md) — role meanings.
- [Security module](/charter/modules/cross-cutting/security-module.md) — `CustomUserDetails` wraps the user.
- [Time tracking module](/charter/modules/timetracking/index.md) — user rates and capacity feed reporting.
- [Identity module entities](/charter/modules/identity/module-entities.md) — `User` entity.