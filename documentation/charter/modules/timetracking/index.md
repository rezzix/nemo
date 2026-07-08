---
type: Charter/Module
resource: backend/src/main/java/com/nemo/timetracking
---

# Time tracking module

`timetracking/` captures effort and converts it into reporting. It is a single backend package split into the sub-concepts below.

## Submodules

- [Time log](/charter/modules/timetracking/time-log.md) — logged effort against tasks (`TimeLog`, `/api/time-logs`).
- [Timesheet](/charter/modules/timetracking/timesheet.md) — rolled-up timesheet views (`Timesheet`, `/api/timesheets`).
- [User rate](/charter/modules/timetracking/user-rate.md) — billable/cost rates per user (`UserRate`, `/api/user-rates`).
- [Time report](/charter/modules/timetracking/time-report.md) — usage/capacity reporting (`TimeReportController`, `/api/time-reports`).

## API

| Base path | Controller |
|-----------|-----------|
| `/api/time-logs` | `TimeLogController` |
| `/api/timesheets` | `TimesheetController` |
| `/api/time-reports` | `TimeReportController` |
| `/api/user-rates` | `UserRateController` |
| `/api/reports` | `ReportController` (note: two controllers share `/api/reports` — one here, one in `reports/`) |

## Cross-references

- [User module](/charter/modules/identity/user-module.md) — capacity and rates per user.
- [Reports module](/charter/modules/finance/reports-module.md) — aggregate reporting.
- [Audit logging](/charter/implementation/cross-cutting/audit-logging.md) — time logs are `@Audited`.
- [Time tracking module entities](/charter/modules/timetracking/module-entities.md) — `TimeLog`, `UserRate`, `Timesheet`.