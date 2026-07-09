---
type: Charter/Module
resource: backend/src/main/java/com/nemo/pmo
---

# PMO module

`pmo/` provides the PMO dashboard, the RAID log, and Earned Value Management (EVM) metrics.

## Components

| Component | Purpose |
|-----------|---------|
| `RaidItem` | risks, assumptions, issues, dependencies (see [delivery module entities](/charter/modules/delivery/module-entities.md) for fields) |
| `RiskScaleDeserializer` | custom JSON deserialization for risk scales |
| `PmoController` | `/api/pmo` dashboard + a separate RAID-items controller |

## RAID risk matrix

For `RISK`-type items, severity is the product of probability (1–5) and impact (1–5); it is computed, not stored (`getRiskScore()` = `probability * impact`, 0 if either is null).

| | Impact 1 | Impact 2 | Impact 3 | Impact 4 | Impact 5 |
|---|---|---|---|---|---|
| **Prob 5** | 5 | 10 | **15** | **20** | **25** |
| **Prob 4** | 4 | 8 | 12 | **16** | **20** |
| **Prob 3** | 3 | 6 | 9 | 12 | **15** |
| **Prob 2** | 2 | 4 | 6 | 8 | 10 |
| **Prob 1** | 1 | 2 | 3 | 4 | 5 |

Risk levels: **Low** 1–4 (green), **Medium** 5–9 (yellow), **High** 10–15 (orange), **Critical** 16–25 (red). `RaidType` = RISK/ASSUMPTION/ISSUE/DEPENDENCY; `RaidStatus` = OPEN/MITIGATING/RESOLVED/CLOSED.

## EVM metrics

EVM is computed on the fly in `PmoService` (nothing stored) from task status, `Project.plannedValue`/`budgetSpent`, time logs, and user rates:

| Metric | Formula |
|--------|---------|
| Completion % | `completedTasks / totalTasks` (by status category) |
| Earned Value (EV) | `completion% × plannedValue` |
| Planned Value (PV) | `(elapsedDays / totalDays) × plannedValue` |
| Actual Cost (AC) | `SUM(timeLog.hours × userRate.hourlyRate) + project.budgetSpent` |
| Cost Variance (CV) | `EV − AC` |
| Schedule Variance (SV) | `EV − PV` |
| CPI | `EV / AC` |
| SPI | `EV / PV` |

`UserRate` (in the [time tracking module](/charter/modules/timetracking/index.md)) converts logged hours into actual cost; rates vary by `effectiveFrom` date.

## Cross-references

- [Project module](/charter/modules/delivery/project-module.md) — RAID items attach to projects; EVM reads project budget fields.
- [Delivery module entities](/charter/modules/delivery/module-entities.md) — `RaidItem` entity.
- [UML diagrams](/charter/overview/uml-diagrams.md) — domain class diagram including `RaidItem`/`UserRate`.
- [Delivery module test plan](/state/test-plans/delivery/module-testplan.md) — PMO/RAID endpoint and EVM service tests.