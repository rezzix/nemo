---
type: Module
resource: backend/src/main/java/com/nemo/sprint
---

# Sprint module

`sprint/` manages sprints and the backlog within a project, plus sprint analytics.

## API

`SprintController` at `/api/projects/{projectId}/sprints` — sprint CRUD, start/complete, velocity, and burndown.

## Cross-references

- [Task module](/modules/delivery/task-module.md) — tasks are assigned to sprints.
- [Reports module](/modules/finance/reports-module.md) — velocity reporting.
- [Delivery module entities](/modules/delivery/module-entities.md) — `Sprint` entity.