---
type: Charter/Pattern
resource: backend/src/main/java/com/nemo
---

# Backend layering

Each module packages a vertical slice with these layers:

| Layer | Responsibility |
|-------|----------------|
| Controller | REST endpoints, request validation, returns DTOs only |
| Service | Business logic, authorization checks (via `AuthHelper`), orchestration, audit |
| Repository | Spring Data JPA interfaces, database access |
| Entity | JPA `@Entity` classes, the persistence model |
| Dto | Request/response shapes (MapStruct-mapped to/from entities) |
| Mapper | MapStruct entity↔DTO conversion |

The defining rule: **controllers receive and return DTOs only; entities never leak through the API boundary.** MapStruct (1.6.3) handles the conversion so the persistence model and the wire model can evolve independently.

## Cross-references

- [Monorepo structure](/charter/overview/monorepo-structure.md) — where these packages live.
- [Request data flow](/charter/overview/request-data-flow.md) — how a request traverses the layers.
- [Common module](/charter/modules/cross-cutting/common-module.md) — shared DTOs and the global exception handler.