---
type: State
title: Nemo — project state
description: Live tracking of where the Nemo implementation stands — advancement summary, development status, API surface, cross-cutting implementations, test plans, quickstart
tags: [state, status, tracking]
timestamp: 2026-07-09
---

# Nemo — project state

Live tracking of where the Nemo implementation stands. The stable description of what Nemo *is* — its vision, architecture, modules, and security model — lives in the [Charter](/charter/index.md). This half records what is built, what is partial, and what is still planned, plus the dated [changelog](/state/log.md) of this knowledge base.

## Advancement summary

| Area | Status | Notes |
|---|---|---|
| Identity (company, user) | Done | Company + User entities, services, controllers; People/User frontend pages. |
| Cross-cutting (common, config, security) | Done | Auth, RBAC, audit, activity, file storage, org config, public holidays, seeder. |
| Delivery (program, portfolio, project, task, sprint, phase, PMO) | Done | All entities/services/controllers present; PMO RAID items + EVM. `portfolio` is a thin aggregation controller (no own entity/service). |
| Commercial (client, presale, expense, payment) | Done | Clients/PreSales frontend pages. |
| Finance (bank account, statement, transaction, reconciliation, reports) | Mostly done | Bank CRUD + reconciliation + finance dashboard implemented; `reports` is a thin controller (no service/entity). |
| HR (leave, evaluation) | Partial | Leave requests + entitlements implemented; `evaluation` is a planned stub (no backend package yet). |
| Content (wiki, attachment, asset, location) | Done | Wiki, attachments, assets, locations. |
| Time tracking (time log, timesheet, user rate, time report) | Done | Single `timetracking` backend package covering all four submodules; MyTime/Timesheets frontend pages. |
| Backend tests | Not started | `backend/src/test` has no `.java` files; all per-module [test plans](/state/test-plans/index.md) describe planned coverage. |
| CI / coverage gating | Not started | No pipeline configured. |

## State contents

* [Development status](/state/development-status.md) — per-module implementation status with the live backend package map.
* [API surface](/state/api/index.md) — the current REST API conventions, endpoint groups, and error handling.
* [Cross-cutting implementations](#) — audit logging, activity tracking, file storage, WebSockets:
  * [Audit logging](/state/audit-logging.md) — AOP `AuditAspect` + `@Audited`, writing `AuditLog`.
  * [Activity tracking](/state/activity-tracking.md) — `ActivityInterceptor` writing `ActivityLog`.
  * [File storage](/state/file-storage.md) — pluggable `StorageService` (filesystem default, S3-swappable).
  * [WebSockets](/state/websockets.md) — STOMP broker for live Kanban updates.
* [Test plans](/state/test-plans/index.md) — one `module-testplan.md` per module group (planned coverage; backend ships no tests yet).
* [Quickstart](/state/quickstart.md) — how to run Nemo locally right now.
* [Postman collection](/state/postman-collection.md) — the current executable API exercise collection.
* [Changelog](/state/log.md) — dated history of this knowledge base.