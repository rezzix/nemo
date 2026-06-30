---
type: API Endpoint
resource: backend/src/main/java/com/nemo/finance/FinanceController.java
---

# Finance & bank endpoints

| Base path | Controller | Purpose |
|-----------|-----------|---------|
| `/api/finance` | `FinanceController` | finance dashboard KPIs, bank accounts widget |
| `/api/bank-accounts` | `BankAccountController` | bank account CRUD |
| `/api/reconciliation` | `ReconciliationController` | match transactions to payments |
| (project-scoped) | expense/payment controllers | project expenses and payments |

Bank statements are imported (see [bank statement module](/modules/finance/bankstatement-module.md)); bank transactions are created from imports and reconciled.

## Cross-references
- [Finance module](/modules/finance/finance-module.md), [Bank account module](/modules/finance/bankaccount-module.md), [Bank transaction module](/modules/finance/banktransaction-module.md), [Reconciliation module](/modules/finance/reconciliation-module.md), [Expense module](/modules/commercial/expense-module.md), [Payment module](/modules/commercial/payment-module.md).