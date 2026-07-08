---
type: Charter/System
resource: https://github.com/rezzix/nemo
---

# Nemo system

Nemo is a multi-company (multi-tenant) project-management system. It combines:

- **Task & project tracking** — projects, programs/portfolios, tasks, sprints, phases, Kanban boards, labels.
- **Time tracking** — time logs, timesheets, user rates, reports.
- **Project documentation** — a nested wiki.
- **PMO capabilities** — RAID logs (risks, assumptions, issues, dependencies), earned-value management, deliverables, client payments.
- **Finance** — finance dashboard, expenses, payments, bank accounts, bank statements, bank transactions, reconciliation.
- **Operations** — clients, pre-sales opportunities, leave, assets, locations, holidays, audit and activity logs.

## Deployment model

A single Spring Boot JAR serves both the REST API (`/api/**`), the WebSocket endpoint (`/ws/**`), and the React SPA build (from `classpath:/static/`). In development the backend runs on port 8080 (H2 file DB) and the Vite dev server on 5173, proxying API calls. In production the React build is bundled into the JAR and `ddl-auto: validate` runs against PostgreSQL.

## Cross-references

- [Monorepo structure](/charter/overview/monorepo-structure.md) — how the code is laid out.
- [Backend layering](/charter/overview/backend-layering.md) — the internal pattern of every module.
- [Tech stack](/charter/overview/tech-stack.md) — concrete technologies and versions.
- [Security: multi-tenancy](/charter/security/multi-tenancy.md) — the company-scoping model.