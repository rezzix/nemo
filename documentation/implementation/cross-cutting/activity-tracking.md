---
type: Pattern
resource: backend/src/main/java/com/nemo/common/activity
---

# Activity tracking

`ActivityInterceptor` records user activity into the `activity_log` table (`ActivityLog` entity), surfaced via `/api/activity-logs`. This complements the more targeted [audit logging](/implementation/cross-cutting/audit-logging.md) with a broader activity stream.

## Cross-references
- [Common module](/modules/cross-cutting/common-module.md) — owns the activity package.
- [Audit logging](/implementation/cross-cutting/audit-logging.md) — the AOP audit system.