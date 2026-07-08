---
type: Charter/Module
resource: backend/src/main/java/com/nemo/reconciliation
---

# Reconciliation module

`reconciliation/` matches [bank transactions](/charter/modules/finance/banktransaction-module.md) to [project payments](/charter/modules/commercial/payment-module.md), marking pairs as cleared/matched (issue #223/#224).

## API

`ReconciliationController` at `/api/reconciliation` drives the matching operations.

## Cross-references

- [Bank transaction module](/charter/modules/finance/banktransaction-module.md) — one side.
- [Payment module](/charter/modules/commercial/payment-module.md) — the other side.
- [Finance endpoints](/charter/implementation/api/finance-bank-endpoints.md) — endpoint detail.