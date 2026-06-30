---
type: Playbook
resource: backend/src/main/java/com/nemo/security
---

# Authentication

- **Login** — form-based at `POST /api/auth/login`; `CustomUserDetailsService` loads the user (with company) and authenticates; on success a `JSESSIONID` session cookie is issued alongside the user DTO.
- **Passwords** — BCrypt-hashed.
- **CSRF** — enabled for browser clients, disabled for API-only clients.
- **CORS** — not required (same-origin; Spring Boot serves the SPA).
- **Principal** — `CustomUserDetails` carries `userId`, `companyId`, and authorities.

## Cross-references
- [Authorization (RBAC)](/security/authorization-rbac.md) — what the principal can do.
- [Multi-tenancy](/security/multi-tenancy.md) — `companyId` on the principal.
- [Security module](/modules/cross-cutting/security-module.md) — components.