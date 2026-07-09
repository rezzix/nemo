---
type: Charter
---

# Nemo — charter

The stable description of what Nemo is and is meant to be. This is the plan of record; progress against it is tracked in [State](/state/index.md).

## Vision & goals

Nemo is a multi-company (multi-tenant) project-management system shipped as a single Spring Boot JAR serving a REST API and a React SPA. It combines:

- **Task & project tracking** — projects, programs/portfolios, tasks, sprints, phases, Kanban boards, labels.
- **Time tracking** — time logs, timesheets, user rates, reports.
- **Project documentation** — a nested wiki.
- **PMO capabilities** — RAID logs (risks, assumptions, issues, dependencies), earned-value management, deliverables, client payments.
- **Finance** — finance dashboard, expenses, payments, bank accounts, bank statements, bank transactions, reconciliation.
- **Operations** — clients, pre-sales opportunities, leave, assets, locations, holidays, audit and activity logs.

The system is multi-tenant by company scoping (`companyId`, with `null` = global), session-based authentication, and role-based authorization. See [Nemo system](/charter/overview/nemo-system.md) for the full shape and deployment model.

## Contents

* [Overview](/charter/overview/index.md) — system shape, architecture, monorepo layout, backend layering, tech stack, request flow, database schema, UML diagrams.
* [Backend modules](/charter/modules/index.md) — one concept per backend domain package, grouped by domain, each with a `module-entities.md` schema.
* [Security](/charter/security/index.md) — authentication, RBAC, multi-tenancy, and the role × feature access matrix.
* [Testing strategy](/charter/testing-strategy.md) — the shared four-level strategy, infrastructure, and test-data conventions referenced by the per-module test plans in State.
* [References](/charter/references/index.md) — external material mirrored as OKF `Reference` concepts (incl. the OKF spec).