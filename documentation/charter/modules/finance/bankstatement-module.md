---
type: Charter/Module
resource: backend/src/main/java/com/nemo/bankstatement
---

# Bank statement module

`bankstatement/` manages bank statements and imports them. `StatementImportService` uses Apache PDFBox 3.0.4 to extract text from PDF statements and turn them into [bank transactions](/charter/modules/finance/banktransaction-module.md).

## Cross-references

- [Bank account module](/charter/modules/finance/bankaccount-module.md) — statements belong to an account.
- [Bank transaction module](/charter/modules/finance/banktransaction-module.md) — the import output.
- [Tech stack](/charter/overview/tech-stack.md) — PDFBox dependency.
- [Finance module entities](/charter/modules/finance/module-entities.md) — `BankStatement` entity.