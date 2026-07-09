---
type: Charter/Module
resource: backend/src/main/java/com/nemo/timetracking
---

# Time log

`TimeLog` records effort against a task. It is the input that feeds timesheets and time reports.

## Entities

`TimeLog`.

## API

`TimeLogController` at `/api/time-logs`.

## Cross-references

- [Time tracking module](/charter/modules/timetracking/index.md) — parent module.
- [Timesheet](/charter/modules/timetracking/timesheet.md) — rolls time logs up.
- [Task module](/charter/modules/delivery/task-module.md) — time logs attach to tasks.
- [Audit logging](/state/audit-logging.md) — time logs are `@Audited`.