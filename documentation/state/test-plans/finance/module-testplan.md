---
type: State/Playbook
resource: docs/test-plan.md
---

# Finance module — test plan

> **Planned / not yet documented.** The legacy `docs/test-plan.md` predates the `finance/` banking group (`finance/`, `bankaccount/`, `bankstatement/`, `banktransaction/`, `reconciliation/`, `reports/`); it contains no test cases for bank accounts, statements, transactions, reconciliation, or the finance dashboard. This file is the placeholder until coverage is written.

## To cover

When tests are added, mirror the structure used by the other module test plans:

- **Unit — mappers**: `BankAccountMapper`, `BankStatementMapper`, `BankTransactionMapper` (entity→DTO field mapping; derived/reconciled fields).
- **Unit — services**: `BankAccountService`, `BankStatementService`, `BankTransactionService`, `ReconciliationService` (match `BankTransaction` ↔ `ProjectPayment` via [payment module](/charter/modules/commercial/payment-module.md); idempotency; statement import/balance computation).
- **Integration — endpoints**: bank account CRUD, statement upload/parsing, transaction listing/CRUD, reconciliation trigger and dashboard KPIs at `/api/...`, plus RBAC variations (FINANCE/ADMIN vs others) and validation, following the pattern of the [identity](/state/test-plans/identity/module-testplan.md) and [delivery](/state/test-plans/delivery/module-testplan.md) plans.
- **Manual E2E**: create bank account, import statement, list transactions, reconcile a payment, verify dashboard KPIs update.

## Cross-references

- [Finance module entities](/charter/modules/finance/module-entities.md) — entities to test.
- [Test plan](/charter/testing-strategy.md) — global strategy, infrastructure, and test data.
- [Postman collection](/state/postman-collection.md) — extend the collection with finance/bank endpoints.