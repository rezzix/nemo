---
type: Module
resource: backend/src/main/java/com/nemo/reports
---

# Reports module

`reports/` exposes cross-domain reporting via `ReportController` at `/api/reports`. (Note: `timetracking/` also has a `ReportController` on the same base — both feed the frontend reports pages.)

## Cross-references

- [Time tracking module](/modules/timetracking/index.md) — time/workload data.
- [Sprint module](/modules/delivery/sprint-module.md) — velocity data.
- [User module](/modules/identity/user-module.md) — headcount data.
- [Frontend architecture](/implementation/architecture/frontend-architecture.md) — dashboards and reports UI.