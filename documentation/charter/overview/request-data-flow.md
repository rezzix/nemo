---
type: Charter/Playbook
resource: backend/src/main/java/com/nemo
---

# Request data flow

A typical mutating request (e.g. creating a task):

```
Browser (React)
  →  POST /api/projects/{projectId}/tasks   (JSON body)
Spring Security filter chain
  →  authenticate JSESSIONID session, check role/company visibility
TaskController
  →  validate input DTO, delegate to service
TaskService
  →  business logic, AuthHelper authorization check, @Audited audit capture
TaskRepository
  →  persist entity
H2 / PostgreSQL
  →  response DTO returned → 201 Created
```

## Error format

A global `@RestControllerAdvice` (`GlobalExceptionHandler` in `common/exception`) catches all exceptions and returns a consistent envelope:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Task title must not be blank",
  "timestamp": "2026-06-27T10:30:00Z"
}
```

Business exceptions (`EntityNotFoundException`, `AccessDeniedException`, …) map to the appropriate HTTP status codes. Validation errors come from Spring Validator annotations on DTOs. See [error handling](/charter/implementation/api/error-handling.md).

## Cross-references

- [Backend layering](/charter/overview/backend-layering.md) — the layers the request crosses.
- [Security: authentication](/charter/security/authentication.md) — the session model.
- [Error handling](/charter/implementation/api/error-handling.md) — the exception-to-status mapping.
- [Cross-cutting: audit logging](/charter/implementation/cross-cutting/audit-logging.md) — the `@Audited` capture step.