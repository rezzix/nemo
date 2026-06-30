---
type: Module
resource: backend/src/main/java/com/nemo/security
---

# Security module

The `security/` package implements the application's security boundary.

## Components

| Component | Purpose |
|-----------|---------|
| `SecurityConfig` | Spring Security filter chain, session/CSRF/CORS config |
| `CustomUserDetails` | authenticated principal carrying `userId`, `companyId`, authorities |
| `CustomUserDetailsService` | loads the user (with company) for authentication |
| `AuthHelper` | service-level authorization checks (`canAccessProject`, `canAccessUser`, role/company scoping) |
| `AuthController` | `/api/auth` — login, logout, captcha, `/me`, `/dev-users` |

Authentication is form-based with a JSESSIONID session cookie; passwords are BCrypt-hashed. Method-level security is enabled (`@EnableMethodSecurity`) and combined with `AuthHelper` for company-scoped visibility. See the dedicated [security concepts](/security/index.md).

## Cross-references

- [Authentication](/security/authentication.md) — login/session flow.
- [Authorization (RBAC)](/security/authorization-rbac.md) — roles and `AuthHelper`.
- [Multi-tenancy](/security/multi-tenancy.md) — `companyId` scoping.
- [User module](/modules/identity/user-module.md) — the user entity backing the principal.