# Cross-cutting concerns

Concerns that touch many modules.

* [Audit logging](/implementation/cross-cutting/audit-logging.md) — AOP `AuditAspect` + `@Audited`, writing `AuditLog`.
* [Activity tracking](/implementation/cross-cutting/activity-tracking.md) — `ActivityInterceptor` writing `ActivityLog`.
* [File storage](/implementation/cross-cutting/file-storage.md) — pluggable `StorageService` (filesystem default, S3-swappable).
* [WebSockets](/implementation/cross-cutting/websockets.md) — STOMP broker for live Kanban updates.