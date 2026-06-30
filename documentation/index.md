---
okf_version: "0.1"
---
folder
# Nemo Knowledge Base

An [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) (OKF v0.1) bundle documenting Nemo — a multi-company project-management system combining task tracking, time tracking, project documentation, and PMO/finance capabilities, shipped as a single Spring Boot JAR serving a REST API and a React SPA.

See [log.md](/log.md) for the change history of this bundle.

---

## Overview

High-level concepts describing Nemo as a whole: system shape, tech stack, layering, request flow, and how to run it.

* [Nemo system](/overview/nemo-system.md) — deployment model and high-level shape.
* [Monorepo structure](/overview/monorepo-structure.md) — repository layout and package-by-feature rationale.
* [Backend layering](/overview/backend-layering.md) — the Controller/Service/Repository/Entity/Dto/Mapper pattern every module follows.
* [Tech stack](/overview/tech-stack.md) — backend and frontend technologies with versions.
* [Request data flow](/overview/request-data-flow.md) — request lifecycle and error response format.
* [Database schema](/overview/database-schema.md) — schema overview, naming conventions, and per-module entity cross-references.
* [Getting started](/overview/getting-started.md) — running the backend/frontend, run modes, seed data, H2 console, production profile.

## Backend modules

One concept per backend domain package, grouped into folders by domain. Each group folder also contains a `module-entities.md` (entity tables + ER diagram) and a `module-testplan.md` (test coverage).

* [Modules index](/modules/index.md) — full listing of all module concepts, grouped by domain.

## Security

Session-based authentication, role-based authorization with company-scoped visibility, and a role × feature access matrix.

* [Authentication](/security/authentication.md) — form login, JSESSIONID session, BCrypt.
* [Authorization (RBAC)](/security/authorization-rbac.md) — roles, method security, and `AuthHelper`.
* [Multi-tenancy](/security/multi-tenancy.md) — `companyId` scoping with `null` = global.
* [Features and access](/security/features-and-access.md) — role × feature access matrix.

## Implementation

How the system is built: architecture, frontend structure, API contracts, and cross-cutting concerns.

* [Architecture](/implementation/architecture/index.md) — system architecture, frontend architecture, and UML diagrams.
* [API](/implementation/api/index.md) — REST conventions, endpoint groups, and error handling.
* [Cross-cutting](/implementation/cross-cutting/index.md) — audit logging, activity tracking, file storage, WebSockets.

## Testing

Per-module test plans hold the detailed test cases; the global test plan defines shared infrastructure and strategy.

* [Testing index](/testing/index.md) — per-module test plans, global strategy, and Postman collection.

## References

* [OKF spec](/references/okf-spec.md) — the Open Knowledge Format v0.1 specification this bundle conforms to.