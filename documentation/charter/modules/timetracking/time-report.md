---
type: Charter/Module
resource: backend/src/main/java/com/nemo/timetracking
---

# Time report

`TimeReportController` exposes usage/capacity views derived from time logs and user rates.

## API

`TimeReportController` at `/api/time-reports`. Note: a second `ReportController` (also at `/api/reports`) lives in the separate `reports/` package — the two `/api/reports` controllers overlap by path but belong to different packages.

## Cross-references

- [Time tracking module](/charter/modules/timetracking/index.md) — parent module.
- [Time log](/charter/modules/timetracking/time-log.md) — source data.
- [Reports module](/charter/modules/finance/reports-module.md) — the sibling `reports/` package.