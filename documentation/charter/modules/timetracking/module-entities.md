---
type: Charter/Schema
resource: backend/src/main/java/com/nemo/timetracking
---

# Time tracking module entities

Effort captured as time logs and valued via user rates; timesheets are a derived roll-up of time logs.

## Entities

| Entity | Notes |
|--------|-------|
| `TimeLog` | logged effort against a task (audited — see [audit logging](/state/audit-logging.md)) |
| `UserRate` | billable/cost rate per user, used to value time logs |
| `Timesheet` | rolled-up weekly/per-user view, derived from `TimeLog` (not a typed FK relationship) |

## Diagram

```mermaid
erDiagram
  USER ||--o{ TIME_LOG : logs
  TASK ||--o{ TIME_LOG : "logged against"
  USER ||--o{ USER_RATE : "has rate"
```

`Timesheet` aggregates `TimeLog` rows at query time rather than storing a separate relationship.

## Cross-references

- [Time log](/charter/modules/timetracking/time-log.md), [Timesheet](/charter/modules/timetracking/timesheet.md), [User rate](/charter/modules/timetracking/user-rate.md), [Time report](/charter/modules/timetracking/time-report.md) — the submodules.
- [Identity module entities](/charter/modules/identity/module-entities.md) — `User` owns time logs and rates.
- [Delivery module entities](/charter/modules/delivery/module-entities.md) — `Task` is the target of a time log.