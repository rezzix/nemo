---
type: Charter/API Endpoint
resource: backend/src/main/java/com/nemo/charter/security/AuthController.java
---

# Auth endpoints

`AuthController` at `/api/auth`:

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/login` | form login, returns user DTO + JSESSIONID cookie |
| POST | `/logout` | invalidate session |
| GET | `/me` | current authenticated user |
| GET | `/captcha` | captcha challenge |
| GET | `/dev-users` | dev-only user listing |

## Cross-references
- [Authentication](/charter/security/authentication.md) — session flow.
- [Security module](/charter/modules/cross-cutting/security-module.md) — `CustomUserDetails` principal.