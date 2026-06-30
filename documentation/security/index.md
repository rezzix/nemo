# Security

The application's security model: session-based authentication, role-based authorization with company-scoped visibility, and a role × feature access matrix.

* [Authentication](/security/authentication.md) — form login, JSESSIONID session, BCrypt.
* [Authorization (RBAC)](/security/authorization-rbac.md) — roles, method security, and `AuthHelper`.
* [Multi-tenancy](/security/multi-tenancy.md) — `companyId` scoping with `null` = global.
* [Features and access](/security/features-and-access.md) — role × feature access matrix.