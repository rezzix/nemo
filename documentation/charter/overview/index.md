---
type: Charter/Section
---

# Overview

High-level concepts describing Nemo as a whole before drilling into individual modules.

* [Nemo system](/charter/overview/nemo-system.md) — Nemo is a multi-company project-management system shipped as one Spring Boot JAR serving API + SPA.
* [System architecture](/charter/overview/system-architecture.md) — integrated structural view: backend, security, real-time, storage, deployment, API design principles.
* [Frontend architecture](/charter/overview/frontend-architecture.md) — SPA layer diagram, tech stack, routing/guards, API client, state management, dashboards.
* [UML diagrams](/charter/overview/uml-diagrams.md) — domain model class diagram, per-role use cases, task lifecycle, auth/Kanban/time-tracking sequences, component diagram.
* [Monorepo structure](/charter/overview/monorepo-structure.md) — backend + frontend monorepo organized package-by-feature.
* [Backend layering](/charter/overview/backend-layering.md) — every module follows the same Controller/Service/Repository/Entity/Dto/Mapper layers.
* [Tech stack](/charter/overview/tech-stack.md) — Spring Boot 3 / Java 21 backend, React 19 / TypeScript / Vite frontend.
* [Request data flow](/charter/overview/request-data-flow.md) — request lifecycle from browser through the security filter chain to the database, plus error format.
* [Database schema](/charter/overview/database-schema.md) — schema overview and naming conventions.