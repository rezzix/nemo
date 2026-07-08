---
type: Charter/Pattern
resource: backend/src/main/java/com/nemo/common/exception
---

# Error handling

`GlobalExceptionHandler` (`@RestControllerAdvice` in `common/exception`) catches all exceptions and returns:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Task title must not be blank",
  "timestamp": "2026-06-27T10:30:00Z"
}
```

Typed business exceptions map to status codes: `EntityNotFoundException` → 404, `AccessDeniedException` → 403, validation failures → 400, etc. DTO validation uses Spring Validator annotations.

## Cross-references
- [Request data flow](/charter/overview/request-data-flow.md) — where errors surface in the lifecycle.
- [Common module](/charter/modules/cross-cutting/common-module.md) — owns the exception package.