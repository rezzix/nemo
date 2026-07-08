---
type: Charter/Pattern
resource: backend/src/main/java/com/nemo/charter/security/AuthHelper.java
---

# Authorization (RBAC)

- **Roles** — `ADMIN`, `MANAGER`, `CONTRIBUTOR`, `EXECUTIVE`, `HR`, `EXTERNAL` (backend `User` enum); the frontend `RoleGuard` also uses `FINANCE`.
- **Method security** — `@EnableMethodSecurity` enables `@PreAuthorize` on endpoints.
- **Service-level checks** — `AuthHelper` enforces company-scoped visibility (`canAccessProject`, `canAccessUser`, etc.).

## Cross-references
- [Authentication](/charter/security/authentication.md) — the principal the roles attach to.
- [Multi-tenancy](/charter/security/multi-tenancy.md) — company scoping the helper enforces.
- [Features and access](/charter/security/features-and-access.md) — the role × feature matrix.