---
type: Charter/Module
resource: backend/src/main/java/com/nemo/finance
---

# Finance module

`finance/` is the read-side aggregation service behind the finance dashboard, combining bank KPIs, expenses, and payments into executive financial views (see issue #225).

## API

`FinanceController` at `/api/finance` serves dashboard KPIs and the bank accounts widget data.

## Cross-references

- [Bank account module](/charter/modules/finance/bankaccount-module.md), [Bank transaction module](/charter/modules/finance/banktransaction-module.md) — bank KPI sources.
- [Expense module](/charter/modules/commercial/expense-module.md), [Payment module](/charter/modules/commercial/payment-module.md) — cost/revenue sources.
- [Finance endpoints](/state/api/finance-bank-endpoints.md) — endpoint detail.