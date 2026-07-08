---
type: Charter/Module
resource: backend/src/main/java/com/nemo/banktransaction
---

# Bank transaction module

`banktransaction/` holds individual bank-account movements (issue #223/#224). Transactions are created from imported [statements](/charter/modules/finance/bankstatement-module.md) and are the side that gets matched to [project payments](/charter/modules/commercial/payment-module.md) during [reconciliation](/charter/modules/finance/reconciliation-module.md).

## Cross-references

- [Reconciliation module](/charter/modules/finance/reconciliation-module.md) — matching logic.
- [Payment module](/charter/modules/commercial/payment-module.md) — the counterpart.
- [Bank account module](/charter/modules/finance/bankaccount-module.md) — parent account.
- [Finance module entities](/charter/modules/finance/module-entities.md) — `BankTransaction` entity.