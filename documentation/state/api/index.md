---
type: State/Section
title: API
description: The current REST API surface — conventions, endpoint groups, and error handling
tags: [state, api, rest, endpoints]
timestamp: 2026-07-09
---

# API

The REST API surface under `/api/**`, served by the Spring Boot JAR. These documents track the *current* implementation; the stable architectural decisions live in the [Charter overview](/charter/overview/index.md).

* [REST conventions](/state/api/rest-conventions.md) — path style, pagination, nesting, and the naming glossary.
* [Auth endpoints](/state/api/auth-endpoints.md) — login, logout, captcha, `/me`.
* [Project & task endpoints](/state/api/project-task-endpoints.md) — projects, tasks, sprints, phases, wiki.
* [Finance & bank endpoints](/state/api/finance-bank-endpoints.md) — finance dashboard, bank accounts, transactions, reconciliation.
* [Error handling](/state/api/error-handling.md) — `GlobalExceptionHandler` and the `ErrorResponse` envelope.