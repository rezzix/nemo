---
type: State/Playbook
resource: docs/test-plan.md
---

# HR module — test plan

> **Planned / not yet documented.** The legacy `docs/test-plan.md` predates the `hr/` group (`leave/`, planned `evaluation/`); it contains no test cases for leave requests, entitlements/balances, or evaluations. This file is the placeholder until coverage is written.

## To cover

When tests are added, mirror the structure used by the other module test plans:

- **Unit — mappers**: `LeaveRequestMapper`, `LeaveEntitlementMapper` (entity→DTO field mapping; balance derivation).
- **Unit — services**: `LeaveRequestService` (request lifecycle: create → approve → reject; balance decrement/restore; date/overlap validation), `LeaveEntitlementService` (per-user annual entitlements).
- **Integration — endpoints**: leave request CRUD at `/api/leave-requests`, entitlement endpoints, plus RBAC variations (HR/MANAGER/ADMIN vs self) and validation, following the pattern of the [identity](/state/test-plans/identity/module-testplan.md) and [delivery](/state/test-plans/delivery/module-testplan.md) plans.
- **Manual E2E**: request leave, approve/reject as HR/MANAGER, verify balance updates; (planned) create an evaluation cycle.
- **Evaluation** is itself a [planned stub](/charter/modules/hr/evaluation-module.md) with no backend package yet.

## Cross-references

- [HR module entities](/charter/modules/hr/module-entities.md) — entities to test.
- [Test plan](/charter/testing-strategy.md) — global strategy, infrastructure, and test data.
- [Postman collection](/state/postman-collection.md) — extend the collection with leave endpoints.