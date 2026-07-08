---
type: Charter/Section
---

# API

The REST API surface under `/api/**`, served by the Spring Boot JAR.

* [REST conventions](/charter/implementation/api/rest-conventions.md) — path style, pagination, nesting, and the naming glossary.
* [Auth endpoints](/charter/implementation/api/auth-endpoints.md) — login, logout, captcha, `/me`.
* [Project & task endpoints](/charter/implementation/api/project-task-endpoints.md) — projects, tasks, sprints, phases, wiki.
* [Finance & bank endpoints](/charter/implementation/api/finance-bank-endpoints.md) — finance dashboard, bank accounts, transactions, reconciliation.
* [Error handling](/charter/implementation/api/error-handling.md) — `GlobalExceptionHandler` and the `ErrorResponse` envelope.