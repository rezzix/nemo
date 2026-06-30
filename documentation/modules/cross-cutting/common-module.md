---
type: Module
resource: backend/src/main/java/com/nemo/common
---

# Common module

`common/` holds cross-cutting concerns reused across all domain modules.

## Sub-packages

| Sub-package | Contents |
|-------------|----------|
| `dto/` | `ApiResponse`, `Paginated`, `ErrorResponse` envelope shapes |
| `exception/` | `GlobalExceptionHandler` (`@RestControllerAdvice`) + typed exceptions (`EntityNotFoundException`, `AccessDeniedException`, …) |
| `audit/` | `AuditAspect`, `@Audited` annotation, `AuditLog` entity |
| `activity/` | `ActivityInterceptor`, `ActivityLog` entity |
| `storage/` | `StorageService` interface + `FilesystemStorageService` implementation |

This is where the standard [error response envelope](/overview/request-data-flow.md) is produced.

## Cross-references

- [Error handling](/implementation/api/error-handling.md) — the exception-to-status mapping.
- [Audit logging](/implementation/cross-cutting/audit-logging.md) and [activity tracking](/implementation/cross-cutting/activity-tracking.md).
- [File storage](/implementation/cross-cutting/file-storage.md) — the storage abstraction.
- [Cross-cutting module entities](/modules/cross-cutting/module-entities.md) — `AuditLog`, `ActivityLog`.