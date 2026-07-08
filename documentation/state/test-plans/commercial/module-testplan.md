---
type: State/Playbook
resource: docs/test-plan.md
---

# Commercial module — test plan

> **Planned / not yet documented.** The legacy `docs/test-plan.md` predates the `commercial/` group (`client/`, `presale/`, `expense/`, `payment/`); it contains no test cases for clients, contacts, presale opportunities, project expenses, or project payments. This file is the placeholder until coverage is written.

## To cover

When tests are added, mirror the structure used by the other module test plans:

- **Unit — mappers**: `ClientMapper`, `ClientContactMapper`, `ProjectExpenseMapper`, `ProjectPaymentMapper` (entity→DTO field mapping; relation-derived fields).
- **Unit — services**: `ClientService` (client + contact CRUD), `ProjectExpenseService`, `ProjectPaymentService` (payment reconciliation with `BankTransaction` — see [reconciliation module](/charter/modules/finance/reconciliation-module.md)).
- **Integration — endpoints**: client/contact CRUD at `/api/clients`, expense/payment endpoints, plus RBAC variations (ADMIN/MANAGER/CONTRIBUTOR) and validation (duplicate, key length, missing required fields), following the pattern of the [identity](/state/test-plans/identity/module-testplan.md) and [delivery](/state/test-plans/delivery/module-testplan.md) plans.
- **Manual E2E**: create client, add contact, log expense, record payment and reconcile against a bank transaction.

## Cross-references

- [Commercial module entities](/charter/modules/commercial/module-entities.md) — entities to test.
- [Test plan](/charter/testing-strategy.md) — global strategy, infrastructure, and test data.
- [Postman collection](/state/postman-collection.md) — extend the collection with commercial endpoints.