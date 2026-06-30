# Overview

High-level concepts describing Nemo as a whole before drilling into individual modules.

* [Nemo system](/overview/nemo-system.md) — Nemo is a multi-company project-management system shipped as one Spring Boot JAR serving API + SPA.
* [Monorepo structure](/overview/monorepo-structure.md) — backend + frontend monorepo organized package-by-feature.
* [Backend layering](/overview/backend-layering.md) — every module follows the same Controller/Service/Repository/Entity/Dto/Mapper layers.
* [Tech stack](/overview/tech-stack.md) — Spring Boot 3 / Java 21 backend, React 19 / TypeScript / Vite frontend.
* [Request data flow](/overview/request-data-flow.md) — request lifecycle from browser through the security filter chain to the database, plus error format.
* [Getting started](/overview/getting-started.md) — running the backend/frontend, run modes, seed data, H2 console, and production profile.