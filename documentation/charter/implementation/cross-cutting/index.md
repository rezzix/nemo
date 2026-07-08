---
type: Charter/Section
---

# Cross-cutting concerns

Concerns that touch many modules.

* [Audit logging](/charter/implementation/cross-cutting/audit-logging.md) — AOP `AuditAspect` + `@Audited`, writing `AuditLog`.
* [Activity tracking](/charter/implementation/cross-cutting/activity-tracking.md) — `ActivityInterceptor` writing `ActivityLog`.
* [File storage](/charter/implementation/cross-cutting/file-storage.md) — pluggable `StorageService` (filesystem default, S3-swappable).
* [WebSockets](/charter/implementation/cross-cutting/websockets.md) — STOMP broker for live Kanban updates.