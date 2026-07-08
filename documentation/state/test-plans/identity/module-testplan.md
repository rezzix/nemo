---
type: State/Playbook
resource: docs/test-plan.md
---

# Identity module — test plan

Backend unit, integration, and E2E tests for the `identity` group (`company/`, `user/`), compiled from the legacy `docs/test-plan.md`. The backend currently ships **no** test files; this is the planned coverage. Shared infrastructure and the global strategy live in [the test plan](/charter/testing-strategy.md).

## Unit — mappers

Test each mapper in isolation with `@SpringBootTest` to inject the mapper bean.

| Mapper | Test cases |
|--------|------------|
| UserMapper | Entity→DTO maps all fields; companyId/companyName from company relation; null company → null companyId |

## Integration — user endpoints

| ID | Method | Endpoint | Auth | Request Body | Expected Status | Notes |
|----|--------|----------|------|--------------|-----------------|-------|
| USR-1 | GET | `/api/users` | ADMIN | — | 200 | Returns all users |
| USR-2 | GET | `/api/users` | MANAGER | — | 200 | Returns all users |
| USR-3 | GET | `/api/users` | CONTRIBUTOR | — | 403 | Forbidden |
| USR-4 | GET | `/api/users/{id}` | Self | — | 200 | User can get own profile |
| USR-5 | GET | `/api/users/{id}` | Other user | — | 403 | Cannot view other user |
| USR-6 | GET | `/api/users/{id}` | ADMIN | — | 200 | ADMIN can view any user |
| USR-7 | POST | `/api/users` | ADMIN | Valid CreateRequest | 200 | User created |
| USR-8 | POST | `/api/users` | ADMIN | Duplicate username | 409 | Conflict |
| USR-9 | POST | `/api/users` | ADMIN | Invalid email | 422 | Validation error |
| USR-10 | POST | `/api/users` | ADMIN | Password < 6 chars | 422 | Validation error |
| USR-11 | POST | `/api/users` | ADMIN | Blank firstName | 422 | Validation error |
| USR-12 | POST | `/api/users` | MANAGER | Valid | 403 | Forbidden |
| USR-13 | PUT | `/api/users/{id}` | ADMIN | Valid UpdateRequest | 200 | User updated |
| USR-14 | PUT | `/api/users/{id}/password` | Self | Valid PasswordChangeRequest | 200 | Password changed |
| USR-15 | PUT | `/api/users/{id}/password` | Self | Wrong currentPassword | 400 | Bad request |
| USR-16 | PUT | `/api/users/{id}/password` | Self | newPassword < 6 chars | 422 | Validation error |
| USR-17 | DELETE | `/api/users/{id}` | ADMIN | — | 200 | User deactivated (soft delete) |

## Integration — company endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| CMP-1 | GET | `/api/companies` | ADMIN | 200 | Returns all companies |
| CMP-2 | GET | `/api/companies` | MANAGER | 403 | Forbidden |
| CMP-3 | POST | `/api/companies` | ADMIN | 200 | Company created |
| CMP-4 | POST | `/api/companies` | ADMIN | Duplicate key | 409 | Conflict |
| CMP-5 | POST | `/api/companies` | ADMIN | key > 10 chars | 422 | Validation error |
| CMP-6 | PUT | `/api/companies/{id}` | ADMIN | 200 | Company updated |
| CMP-7 | DELETE | `/api/companies/{id}` | ADMIN | 200 | Company deactivated |

## Frontend — Admin Users tab sorting

| ID | Test case | Expected |
|----|-----------|----------|
| FAU-1 | Global users listed first | Global group appears before any company group |
| FAU-2 | Companies sorted by order field | Companies appear in order: NTO, HRM, MTM, MER |
| FAU-3 | Externals listed last | Externals group appears after all companies |
| FAU-4 | Users sorted by role priority | Within each group: EXECUTIVE → MANAGER → CONTRIBUTOR |

## Manual E2E — multi-tenancy

| ID | Flow | Steps | Pass criteria |
|----|------|-------|---------------|
| E2E-21 | Company user sees own projects | Login as company user | Only company + global projects visible |
| E2E-22 | Global user sees all | Login as admin | All projects across companies visible |
| E2E-23 | Admin Users tab grouping | Login as admin, go to Users tab | Global first, then companies by order, then externals |

## Newman contract extensions

Scenarios to add to `postman/nemo-api-collection.json` (see [Postman collection](/state/postman-collection.md)):

- Create user with existing email → 409.
- Create user with short password → 422.
- Create company with long key → 422.
- Duplicate key on company → 409.

## Cross-references

- [Identity module entities](/charter/modules/identity/module-entities.md) — entities under test.
- [Test plan](/charter/testing-strategy.md) — global strategy, infrastructure, and test data.
- [Postman collection](/state/postman-collection.md) — the API test asset.
- [Multi-tenancy](/charter/security/multi-tenancy.md) — the `company_id` scoping asserted by E2E-21..23.