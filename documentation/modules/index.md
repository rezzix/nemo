# Backend modules

One concept per backend domain package under `backend/src/main/java/com/nemo/`. Each module follows the [backend layering](/overview/backend-layering.md) pattern. Concepts are grouped into folders by domain; cross-cutting concerns shared by all modules live in `common/` and `config/`. Each group folder also holds a `module-entities.md` (entity tables + ER diagram) and a `module-testplan.md` (test coverage) covering all its submodules.

## Cross-cutting
* [Security module](/modules/cross-cutting/security-module.md) — authentication, session, RBAC, captcha, `CustomUserDetails`.
* [Common module](/modules/cross-cutting/common-module.md) — shared DTOs, exceptions, audit, activity, storage.
* [Config module](/modules/cross-cutting/config-module.md) — organization config, task types/statuses, holidays, websockets.

## Identity
* [Company module](/modules/identity/company-module.md) — tenant/company CRUD.
* [User module](/modules/identity/user-module.md) — users, roles, allocation summaries.

## Delivery
* [Program module](/modules/delivery/program-module.md) — programs (portfolio grouping).
* [Portfolio module](/modules/delivery/portfolio-module.md) — portfolio roll-up.
* [Project module](/modules/delivery/project-module.md) — projects, members, labels, board, notes, instructions.
* [Task module](/modules/delivery/task-module.md) — tasks, comments, my-tasks.
* [Sprint module](/modules/delivery/sprint-module.md) — sprints, backlog, velocity, burndown.
* [Phase module](/modules/delivery/phase-module.md) — phases, deliverables, client payments.
* [PMO module](/modules/delivery/pmo-module.md) — RAID items, dashboard.

## Commercial
* [Client module](/modules/commercial/client-module.md) — clients and contacts.
* [Presale module](/modules/commercial/presale-module.md) — pre-sale opportunities.
* [Expense module](/modules/commercial/expense-module.md) — project expenses.
* [Payment module](/modules/commercial/payment-module.md) — project payments.

## Finance / banking
* [Finance module](/modules/finance/finance-module.md) — finance dashboard KPIs.
* [Bank account module](/modules/finance/bankaccount-module.md) — bank accounts CRUD.
* [Bank statement module](/modules/finance/bankstatement-module.md) — bank statements and PDF import.
* [Bank transaction module](/modules/finance/banktransaction-module.md) — bank transactions.
* [Reconciliation module](/modules/finance/reconciliation-module.md) — matching transactions to payments.
* [Reports module](/modules/finance/reports-module.md) — cross-domain reporting.

## HR
* [Leave management](/modules/hr/leave-module.md) — leave requests, entitlements, balances.
* [Evaluation module](/modules/hr/evaluation-module.md) — *planned* performance evaluations and review cycles.

## Time tracking
* [Time tracking module](/modules/timetracking/index.md) — time logs, timesheets, user rates, reports (split into submodules: [time log](/modules/timetracking/time-log.md), [timesheet](/modules/timetracking/timesheet.md), [user rate](/modules/timetracking/user-rate.md), [time report](/modules/timetracking/time-report.md)).

## Content & operations
* [Documentation module](/modules/content/documentation-module.md) — nested wiki pages.
* [Attachment module](/modules/content/attachment-module.md) — file attachments.
* [Asset module](/modules/content/asset-module.md) — asset management.
* [Location module](/modules/content/location-module.md) — locations.