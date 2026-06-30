---
type: Module
resource: backend/src/main/java/com/nemo/portfolio
---

# Portfolio module

`portfolio/` provides a read-side roll-up across programs and projects, used by executive/portfolio dashboards. It currently exposes a controller (`PortfolioController` at `/api/portfolio`) rather than its own entity table.

## Cross-references

- [Program module](/modules/delivery/program-module.md) — source grouping.
- [Project module](/modules/delivery/project-module.md) — source projects.
- [Reports module](/modules/finance/reports-module.md) — broader reporting.