---
type: Module
resource: backend/src/main/java/com/nemo/bankaccount
---

# Bank account module

`bankaccount/` manages bank accounts (issue #222). Accounts are company-scoped and anchor the banking domain: [statements](/modules/finance/bankstatement-module.md) and [transactions](/modules/finance/banktransaction-module.md) hang off an account.

## API

`BankAccountController` at `/api/bank-accounts` for account CRUD.

## Cross-references

- [Bank statement module](/modules/finance/bankstatement-module.md) — statements belong to an account.
- [Bank transaction module](/modules/finance/banktransaction-module.md) — transactions belong to an account.
- [Finance module](/modules/finance/finance-module.md) — bank KPIs per account.
- [Finance module entities](/modules/finance/module-entities.md) — `BankAccount` entity.