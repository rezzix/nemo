# API

The REST API surface under `/api/**`, served by the Spring Boot JAR.

* [REST conventions](/implementation/api/rest-conventions.md) — path style, pagination, nesting, and the naming glossary.
* [Auth endpoints](/implementation/api/auth-endpoints.md) — login, logout, captcha, `/me`.
* [Project & task endpoints](/implementation/api/project-task-endpoints.md) — projects, tasks, sprints, phases, wiki.
* [Finance & bank endpoints](/implementation/api/finance-bank-endpoints.md) — finance dashboard, bank accounts, transactions, reconciliation.
* [Error handling](/implementation/api/error-handling.md) — `GlobalExceptionHandler` and the `ErrorResponse` envelope.