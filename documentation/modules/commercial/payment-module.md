---
type: Module
resource: backend/src/main/java/com/nemo/payment
---

# Payment module

`payment/` records project payments (`ProjectPayment`) — incoming money against a project. These are the counterpart that [bank transactions](/modules/finance/banktransaction-module.md) get [reconciled](/modules/finance/reconciliation-module.md) to.

## Cross-references

- [Reconciliation module](/modules/finance/reconciliation-module.md) — matches payments to bank transactions.
- [Bank transaction module](/modules/finance/banktransaction-module.md) — the other side of reconciliation.
- [Phase module](/modules/delivery/phase-module.md) — `ClientPayment` is a distinct concept (client-facing, phase-tied).
- [Commercial module entities](/modules/commercial/module-entities.md) — `ProjectPayment` entity.