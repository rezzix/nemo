---
type: Charter/Section
---

# Backend modules

One concept per backend domain package under `backend/src/main/java/com/nemo/`. Each module follows the [backend layering](/charter/overview/backend-layering.md) pattern. Concepts are grouped into folders by domain; cross-cutting concerns shared by all modules live in `common/` and `config/`. Each group folder also holds a `module-entities.md` (entity tables + ER diagram) covering all its submodules; the per-group test coverage plans live in [State](/state/test-plans/index.md).

## Cross-cutting
* [Security module](/charter/modules/cross-cutting/security-module.md) — authentication, session, RBAC, captcha, `CustomUserDetails`.
* [Common module](/charter/modules/cross-cutting/common-module.md) — shared DTOs, exceptions, audit, activity, storage.
* [Config module](/charter/modules/cross-cutting/config-module.md) — organization config, task types/statuses, holidays, websockets.

## Identity
* [Company module](/charter/modules/identity/company-module.md) — tenant/company CRUD.
* [User module](/charter/modules/identity/user-module.md) — users, roles, allocation summaries.

## Delivery
* [Program module](/charter/modules/delivery/program-module.md) — programs (portfolio grouping).
* [Portfolio module](/charter/modules/delivery/portfolio-module.md) — portfolio roll-up.
* [Project module](/charter/modules/delivery/project-module.md) — projects, members, labels, board, notes, instructions.
* [Task module](/charter/modules/delivery/task-module.md) — tasks, comments, my-tasks.
* [Sprint module](/charter/modules/delivery/sprint-module.md) — sprints, backlog, velocity, burndown.
* [Phase module](/charter/modules/delivery/phase-module.md) — phases, deliverables, client payments.
* [PMO module](/charter/modules/delivery/pmo-module.md) — RAID items, dashboard.

## Commercial
* [Client module](/charter/modules/commercial/client-module.md) — clients and contacts.
* [Presale module](/charter/modules/commercial/presale-module.md) — pre-sale opportunities.
* [Expense module](/charter/modules/commercial/expense-module.md) — project expenses.
* [Payment module](/charter/modules/commercial/payment-module.md) — project payments.

## Finance / banking
* [Finance module](/charter/modules/finance/finance-module.md) — finance dashboard KPIs.
* [Bank account module](/charter/modules/finance/bankaccount-module.md) — bank accounts CRUD.
* [Bank statement module](/charter/modules/finance/bankstatement-module.md) — bank statements and PDF import.
* [Bank transaction module](/charter/modules/finance/banktransaction-module.md) — bank transactions.
* [Reconciliation module](/charter/modules/finance/reconciliation-module.md) — matching transactions to payments.
* [Reports module](/charter/modules/finance/reports-module.md) — cross-domain reporting.

## HR
* [Leave management](/charter/modules/hr/leave-module.md) — leave requests, entitlements, balances.
* [Evaluation module](/charter/modules/hr/evaluation-module.md) — *planned* performance evaluations and review cycles.

## Time tracking
* [Time tracking module](/charter/modules/timetracking/index.md) — time logs, timesheets, user rates, reports (split into submodules: [time log](/charter/modules/timetracking/time-log.md), [timesheet](/charter/modules/timetracking/timesheet.md), [user rate](/charter/modules/timetracking/user-rate.md), [time report](/charter/modules/timetracking/time-report.md)).

## Content & operations
* [Documentation module](/charter/modules/content/documentation-module.md) — nested wiki pages.
* [Attachment module](/charter/modules/content/attachment-module.md) — file attachments.
* [Asset module](/charter/modules/content/asset-module.md) — asset management.
* [Location module](/charter/modules/content/location-module.md) — locations.