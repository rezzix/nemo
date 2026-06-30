# Testing

Per-module test plans hold the unit, integration, frontend, and E2E cases for each backend domain group. The global test plan defines shared infrastructure and strategy.

## Per-module test plans

* [Cross-cutting](/modules/cross-cutting/module-testplan.md) — auth, captcha, RBAC, org config, task types/statuses, audit, error handling, frontend infra.
* [Identity](/modules/identity/module-testplan.md) — user and company endpoints.
* [Delivery](/modules/delivery/module-testplan.md) — program, project, task, sprint, PMO/RAID.
* [Commercial](/modules/commercial/module-testplan.md) — *planned* (client, expense, payment).
* [Finance](/modules/finance/module-testplan.md) — *planned* (banks, reconciliation).
* [HR](/modules/hr/module-testplan.md) — *planned* (leave, evaluation).
* [Time tracking](/modules/timetracking/module-testplan.md) — time logs, timesheets, reports.
* [Content](/modules/content/module-testplan.md) — wiki, attachment.

## Global strategy and assets

* [Test plan](/testing/test-plan.md) — test strategy levels, backend infrastructure, test data, and maintenance.
* [Postman collection](/testing/postman-collection.md) — the `postman/nemo-api-collection.json` API test collection.