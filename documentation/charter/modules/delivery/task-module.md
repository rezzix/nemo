---
type: Charter/Module
resource: backend/src/main/java/com/nemo/task
---

# Task module

`task/` is the task-tracking core.

## API

- `TaskController` at `/api/projects/{projectId}/tasks` — CRUD, position changes, comments.
- `MyTasksController` at `/api/tasks` — the assignee's personal view.

## Cross-references

- [Sprint module](/charter/modules/delivery/sprint-module.md) — tasks sit in sprints.
- [Config module](/charter/modules/cross-cutting/config-module.md) — defines `TaskType`/`TaskStatus`.
- [WebSockets](/charter/implementation/cross-cutting/websockets.md) — live board updates on task moves.
- [Delivery module entities](/charter/modules/delivery/module-entities.md) — `Task`, `Comment` entities.