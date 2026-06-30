---
type: Module
resource: backend/src/main/java/com/nemo/project
---

# Project module

`project/` is the central delivery unit. A `Project` carries membership, board configuration, and metadata, and is company-scoped (null company_id = global).

## API

`ProjectController` at `/api/projects` covers members, labels, board, instructions, notes, favorites, **EVM** (earned-value management), and activities. Nested resources live under `/api/projects/{projectId}/...` (tasks, sprints, phases).

## Cross-references

- [Task module](/modules/delivery/task-module.md) — tasks belong to a project.
- [Sprint module](/modules/delivery/sprint-module.md), [Phase module](/modules/delivery/phase-module.md) — planning sub-units.
- [PMO module](/modules/delivery/pmo-module.md) — RAID items per project.
- [Delivery module entities](/modules/delivery/module-entities.md) — `Project` and sub-entities.