---
type: Charter/Module
resource: backend/src/main/java/com/nemo/bankaccount
---

# Bank account module

`bankaccount/` manages bank accounts (issue #222). Accounts are company-scoped and anchor the banking domain: [statements](/charter/modules/finance/bankstatement-module.md) and [transactions](/charter/modules/finance/banktransaction-module.md) hang off an account.

## API

`BankAccountController` at `/api/bank-accounts` for account CRUD.

## Cross-references

- [Bank statement module](/charter/modules/finance/bankstatement-module.md) — statements belong to an account.
- [Bank transaction module](/charter/modules/finance/banktransaction-module.md) — transactions belong to an account.
- [Finance module](/charter/modules/finance/finance-module.md) — bank KPIs per account.
- [Finance module entities](/charter/modules/finance/module-entities.md) — `BankAccount` entity.