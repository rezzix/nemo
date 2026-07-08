---
type: Charter/Module
resource: /home/ossama/projects/nemo
---

# Monorepo structure

```
nemo/
├── backend/        # Spring Boot application (Gradle subproject; the only settings.gradle include)
│   └── src/main/java/com/nemo/<module>/   # one package per domain module
├── frontend/       # React + TypeScript SPA (standalone npm project)
│   └── src/{api,components,pages,stores,hooks,types,utils}
├── docs/           # legacy human-authored markdown vault (source for this bundle)
├── documentation/  # this OKF knowledge base
├── postman/        # nemo-api-collection.json API test collection
├── site/           # marketing/landing static site
├── build.gradle    # root Gradle build (Java 21, group com.nemo)
└── settings.gradle # includes 'backend' only
```

## Package-by-feature

Each backend domain module (e.g. `project`, `task`, `sprint`, `finance`) groups its own `Controller`, `Service`, `Repository`, `Entity`, `Dto`, and `Mapper` together in one package. This keeps related code co-located, makes navigation easy, and aligns with the modular-architecture requirement. Cross-cutting concerns (security, audit, storage, DTOs, exceptions) live in `common/` and `config/`.

## Notes on drift from legacy docs

The legacy `docs/` directory (now removed) referenced React 18 / TipTap / `@hello-pangea/dnd`; the current codebase uses React 19, Zustand 5, and Mermaid + react-markdown. This bundle reflects the current state.

## Cross-references

- [Backend layering](/charter/overview/backend-layering.md) — what's inside each package.
- [Modules index](/charter/modules/index.md) — the individual domain modules.