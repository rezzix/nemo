---
type: Pattern
resource: backend/src/main/java/com/nemo/common/audit
---

# Audit logging

- Mechanism: Spring AOP via `AuditAspect` + a custom `@Audited` annotation.
- Captures: who, what action, which entity, previous value (for updates), timestamp.
- Storage: dedicated `audit_log` table (`AuditLog` entity).
- Applied to create/update/delete on audited entities (tasks, time logs, etc.).
- Exposed via `/api/audit-logs` (admin-gated).

## Cross-references
- [Common module](/modules/cross-cutting/common-module.md) — owns the audit package.
- [Request data flow](/overview/request-data-flow.md) — the audit step.
- [Activity tracking](/implementation/cross-cutting/activity-tracking.md) — the sibling activity system.