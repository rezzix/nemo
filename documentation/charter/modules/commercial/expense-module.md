---
type: Charter/Module
resource: backend/src/main/java/com/nemo/expense
---

# Expense module

`expense/` records project expenses (`ProjectExpense`) — cost items charged against a project, feeding profitability and finance views.

## Cross-references

- [Project module](/charter/modules/delivery/project-module.md) — expenses belong to a project.
- [Finance module](/charter/modules/finance/finance-module.md) — finance dashboard aggregates expenses.
- [Commercial module entities](/charter/modules/commercial/module-entities.md) — `ProjectExpense` entity.