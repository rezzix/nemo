---
type: State/Implementation
resource: backend/src/main/java/com/nemo/config/WebSocketConfig.java
---

# WebSockets (STOMP)

`WebSocketConfig` sets up a STOMP broker (endpoint `/ws/**`). When a task moves (status change), the backend publishes to a project topic and all subscribed clients update their local board state. The Kanban board component subscribes to the relevant project topic for real-time updates.

## Cross-references
- [Config module](/charter/modules/cross-cutting/config-module.md) — owns `WebSocketConfig`.
- [Task module](/charter/modules/delivery/task-module.md) — moves trigger updates.
- [Project module](/charter/modules/delivery/project-module.md) — the board.