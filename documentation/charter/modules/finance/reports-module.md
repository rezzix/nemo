---
type: Charter/Module
resource: backend/src/main/java/com/nemo/reports
---

# Reports module

`reports/` exposes cross-domain reporting via `ReportController` at `/api/reports`. (Note: `timetracking/` also has a `ReportController` on the same base — both feed the frontend reports pages.)

## Cross-references

- [Time tracking module](/charter/modules/timetracking/index.md) — time/workload data.
- [Sprint module](/charter/modules/delivery/sprint-module.md) — velocity data.
- [User module](/charter/modules/identity/user-module.md) — headcount data.
- [Frontend architecture](/charter/overview/frontend-architecture.md) — dashboards and reports UI.