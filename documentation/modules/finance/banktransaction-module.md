---
type: Module
resource: backend/src/main/java/com/nemo/banktransaction
---

# Bank transaction module

`banktransaction/` holds individual bank-account movements (issue #223/#224). Transactions are created from imported [statements](/modules/finance/bankstatement-module.md) and are the side that gets matched to [project payments](/modules/commercial/payment-module.md) during [reconciliation](/modules/finance/reconciliation-module.md).

## Cross-references

- [Reconciliation module](/modules/finance/reconciliation-module.md) — matching logic.
- [Payment module](/modules/commercial/payment-module.md) — the counterpart.
- [Bank account module](/modules/finance/bankaccount-module.md) — parent account.
- [Finance module entities](/modules/finance/module-entities.md) — `BankTransaction` entity.