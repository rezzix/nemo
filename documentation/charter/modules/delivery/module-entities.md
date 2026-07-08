---
type: Charter/Schema
resource: backend/src/main/java/com/nemo/project
---

# Delivery module entities

The project-delivery domain: programs, projects (with membership, board, labels, notes), tasks (with comments), sprints, phases (with deliverables and client payments), and PMO RAID items.

## Entities

| Entity | Notes |
|--------|-------|
| `Program` | groups projects |
| `Project` | company-scoped core unit; `null` company_id = global |
| `ProjectMember`, `ProjectFavorite`, `Label`, `BoardColumn`, `ProjectNote`, `ProjectInstruction`, `ProjectActivity` | project sub-entities |
| `Task` (table `task`) | title, description, `taskKey` (unique), status→`TaskStatus`, type→`TaskType`, project, assignee, reporter, sprint, phase, position, external flag, labels M:N, `Priority` enum |
| `Comment` | task comments |
| `Sprint` | sprint container within a project |
| `Phase`, `Deliverable`, `ClientPayment` | phase-level planning and client billing |
| `RaidItem` | PMO risks/assumptions/issues/dependencies (custom `RiskScaleDeserializer`) |

## Diagram

```mermaid
erDiagram
  PROGRAM ||--o{ PROJECT : contains
  PROJECT ||--o{ TASK : has
  PROJECT ||--o{ SPRINT : contains
  PROJECT ||--o{ PHASE : has
  PROJECT ||--o{ RAID_ITEM : tracks
  PROJECT ||--o{ PROJECT_MEMBER : has
  TASK }o--o{ LABEL : tagged
  TASK }o--o| SPRINT : "assigned to"
  TASK }o--o| PHASE : "assigned to"
  TASK ||--o{ COMMENT : has
  PHASE ||--o{ DELIVERABLE : has
  PHASE ||--o{ CLIENT_PAYMENT : has
```

## Cross-references

- [Program module](/charter/modules/delivery/program-module.md), [Project module](/charter/modules/delivery/project-module.md), [Task module](/charter/modules/delivery/task-module.md), [Sprint module](/charter/modules/delivery/sprint-module.md), [Phase module](/charter/modules/delivery/phase-module.md), [PMO module](/charter/modules/delivery/pmo-module.md) — the owning modules.
- [Cross-cutting module entities](/charter/modules/cross-cutting/module-entities.md) — `TaskType`/`TaskStatus` taxonomy.
- [Commercial module entities](/charter/modules/commercial/module-entities.md) — `ClientPayment` (phase-tied) vs `ProjectPayment` (commercial).