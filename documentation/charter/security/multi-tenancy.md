---
type: Charter/Pattern
resource: backend/src/main/java/com/nemo/security
---

# Multi-tenancy

Nemo is multi-company. A nullable `company_id` foreign key on `User`, `Program`, `Project`, `OrganizationConfig` (and others) scopes entities; `null` denotes a **global** entity visible across companies.

`CustomUserDetails` carries the caller's `companyId` (null = global user), and `AuthHelper` applies company-scoped visibility on reads and writes.

## Cross-references
- [Authorization (RBAC)](/charter/security/authorization-rbac.md) — where scoping is enforced.
- [Company module](/charter/modules/identity/company-module.md) — the tenant entity.
- [Identity module entities](/charter/modules/identity/module-entities.md) — which entities carry `company_id`.