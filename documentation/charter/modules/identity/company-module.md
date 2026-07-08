---
type: Charter/Module
resource: backend/src/main/java/com/nemo/company
---

# Company module

`company/` manages companies, which act as tenants. A nullable `company_id` foreign key on many entities (User, Program, Project, OrganizationConfig) scopes visibility; `null` denotes a global entity visible across companies.

## API

`CompanyController` exposes `/api/companies` for company CRUD (admin-gated).

## Cross-references

- [Multi-tenancy](/charter/security/multi-tenancy.md) — the scoping model.
- [User module](/charter/modules/identity/user-module.md) — users belong to a company.
- [Identity module entities](/charter/modules/identity/module-entities.md) — `Company` entity details.