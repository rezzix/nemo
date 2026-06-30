---
type: Module
resource: backend/src/main/java/com/nemo/phase
---

# Phase module

`phase/` models project phases, their deliverables, and client payments tied to phases, plus per-project backlog controllers.

## API

Controllers under `/api/projects/{projectId}/...` for phases, deliverables, client payments, and backlog.

## Cross-references

- [Project module](/modules/delivery/project-module.md) — phases belong to a project.
- [Payment module](/modules/commercial/payment-module.md) — `ClientPayment` vs project payments.
- [Delivery module entities](/modules/delivery/module-entities.md) — `Phase`, `Deliverable`, `ClientPayment`.