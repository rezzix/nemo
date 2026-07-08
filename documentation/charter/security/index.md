---
type: Charter/Section
---

# Security

The application's security model: session-based authentication, role-based authorization with company-scoped visibility, and a role × feature access matrix.

* [Authentication](/charter/security/authentication.md) — form login, JSESSIONID session, BCrypt.
* [Authorization (RBAC)](/charter/security/authorization-rbac.md) — roles, method security, and `AuthHelper`.
* [Multi-tenancy](/charter/security/multi-tenancy.md) — `companyId` scoping with `null` = global.
* [Features and access](/charter/security/features-and-access.md) — role × feature access matrix.