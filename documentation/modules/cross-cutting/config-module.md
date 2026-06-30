---
type: Module
resource: backend/src/main/java/com/nemo/config
---

# Config module

`config/` holds application configuration entities, their controllers, and the WebSocket setup.

## Components

| Component | Purpose |
|-----------|---------|
| `OrganizationConfig` | per-company configuration with a global fallback (null company_id) |
| `TaskType`, `TaskStatus` | configurable task taxonomy (seeded via `data.sql`) |
| `PublicHoliday` | public holidays |
| `OrganizationConfigController` | `/api/organization` |
| `PublicHolidayController` | `/api/holidays` |
| `TaskConfigController` | `/api` — task types/statuses |
| `WebSocketConfig` | STOMP broker for live Kanban updates |
| `DataSeeder` | seeds initial configuration/reference data |

## Cross-references

- [WebSockets](/implementation/cross-cutting/websockets.md) — real-time board updates.
- [Task module](/modules/delivery/task-module.md) — uses `TaskType`/`TaskStatus`.
- [Multi-tenancy](/security/multi-tenancy.md) — null `company_id` = global.
- [Cross-cutting module entities](/modules/cross-cutting/module-entities.md) — `OrganizationConfig`, `TaskType`, `TaskStatus`, `PublicHoliday`.