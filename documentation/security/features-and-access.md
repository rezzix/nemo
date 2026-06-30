---
type: Reference
resource: docs/features-and-access.md
---

# Features and access matrix

A role × feature access matrix governs what each role can do. Roles: ADMIN, MANAGER, EXECUTIVE, HR, CONTRIBUTOR, EXTERNAL (frontend also uses FINANCE).

Indicative permissions (the authoritative matrix lives in the legacy `docs/features-and-access.md`):

| Action | Admin | Executive | Manager | Contributor |
|--------|-------|-----------|---------|-------------|
| Manage users & org config | Yes | No | No | No |
| Manage companies | Yes | No | No | No |
| Manage programs/projects | Yes | Own company | Assigned | No |
| Create/edit tasks | Yes | Own | Assigned | Assigned |
| Log time | Yes | No | Assigned | Assigned |
| View timesheets | All | Own company | Own project members | Own only |
| Reports | All | Own company | Own projects | Own projects |
| Audit logs | Yes | No | No | No |

## Cross-references
- [Authorization (RBAC)](/security/authorization-rbac.md) — enforcement.
- [Frontend architecture](/implementation/architecture/frontend-architecture.md) — routing guards and `RoleGuard`.