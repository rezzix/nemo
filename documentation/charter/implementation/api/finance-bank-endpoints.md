---
type: Charter/API Endpoint
resource: backend/src/main/java/com/nemo/finance/FinanceController.java
---

# Finance & bank endpoints

| Base path | Controller | Purpose |
|-----------|-----------|---------|
| `/api/finance` | `FinanceController` | finance dashboard KPIs, bank accounts widget |
| `/api/bank-accounts` | `BankAccountController` | bank account CRUD |
| `/api/reconciliation` | `ReconciliationController` | match transactions to payments |
| (project-scoped) | expense/payment controllers | project expenses and payments |

Bank statements are imported (see [bank statement module](/charter/modules/finance/bankstatement-module.md)); bank transactions are created from imports and reconciled.

## Cross-references
- [Finance module](/charter/modules/finance/finance-module.md), [Bank account module](/charter/modules/finance/bankaccount-module.md), [Bank transaction module](/charter/modules/finance/banktransaction-module.md), [Reconciliation module](/charter/modules/finance/reconciliation-module.md), [Expense module](/charter/modules/commercial/expense-module.md), [Payment module](/charter/modules/commercial/payment-module.md).