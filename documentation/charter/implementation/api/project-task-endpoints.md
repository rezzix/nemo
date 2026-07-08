---
type: Charter/API Endpoint
resource: backend/src/main/java/com/nemo/project/ProjectController.java
---

# Project & task endpoints

`ProjectController` at `/api/projects` plus nested resource controllers:

| Base path | Covers |
|-----------|--------|
| `/api/projects` | project CRUD, members, favorites, labels, board, notes, instructions, EVM, activities |
| `/api/projects/{projectId}/tasks` | task CRUD, position, comments (`TaskController`) |
| `/api/tasks` | my-tasks view (`MyTasksController`) |
| `/api/projects/{projectId}/sprints` | sprint CRUD, start/complete, velocity, burndown |
| `/api/projects/{projectId}/...` | phases, deliverables, client payments, backlog |
| `/api/projects/{projectId}/.../wiki` | wiki pages |

## Cross-references
- [Project module](/charter/modules/delivery/project-module.md), [Task module](/charter/modules/delivery/task-module.md), [Sprint module](/charter/modules/delivery/sprint-module.md), [Phase module](/charter/modules/delivery/phase-module.md), [Documentation module](/charter/modules/content/documentation-module.md).