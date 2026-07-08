---
type: State/Playbook
resource: docs/test-plan.md
---

# Time tracking module — test plan

Backend unit, integration, and E2E tests for the `timetracking` group (`time-log`, `timesheet`, `user-rate`, `time-report`), compiled from the legacy `docs/test-plan.md`. The backend currently ships **no** test files; this is the planned coverage. Shared infrastructure and the global strategy live in [the test plan](/charter/testing-strategy.md).

## Unit — mappers

Test each mapper in isolation with `@SpringBootTest` to inject the mapper bean.

| Mapper | Test cases |
|--------|------------|
| TimeLogMapper | Entity→DTO maps all fields; userName as "firstName lastName"; taskKey from task relation |

## Unit — service layer

| Service | ID | Test case | Expected behavior |
|---------|----|-----------|-------------------|
| TimeLogService | TS-1 | User can log time for themselves | Succeeds |
| TimeLogService | TS-2 | User cannot log time for another user | throws ForbiddenException |
| TimeLogService | TS-3 | ADMIN can log time for any user | Succeeds |

## Integration — time tracking endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| TIM-1 | POST | `/api/time-logs` | Self | 200 | Time log created for self |
| TIM-2 | POST | `/api/time-logs` | Self, different userId | 403 | Cannot log for others |
| TIM-3 | POST | `/api/time-logs` | ADMIN | 200 | Can log for any user |
| TIM-4 | GET | `/api/time-logs` | Self | 200 | Returns own time logs |
| TIM-5 | GET | `/api/time-logs` | ADMIN | 200 | Returns all time logs |
| TIM-6 | PUT | `/api/time-logs/{id}` | Self, own log | 200 | Updated |
| TIM-7 | PUT | `/api/time-logs/{id}` | Self, other's log | 403 | Forbidden |
| TIM-8 | PUT | `/api/time-logs/{id}` | ADMIN | 200 | Updated |
| TIM-9 | DELETE | `/api/time-logs/{id}` | Self | 403 | Cannot delete own (only ADMIN/MANAGER) |
| TIM-10 | DELETE | `/api/time-logs/{id}` | ADMIN | 200 | Deleted |
| TIM-11 | GET | `/api/timesheets/weekly` | ADMIN | 200 | Returns weekly timesheet |
| TIM-12 | GET | `/api/timesheets/weekly` | CONTRIBUTOR | 403 | Forbidden |
| TIM-13 | GET | `/api/timesheets/daily` | MANAGER | 200 | Returns daily timesheet |
| TIM-14 | GET | `/api/reports/time-by-project` | ADMIN | 200 | Returns project time report |
| TIM-15 | GET | `/api/reports/time-by-project` | CONTRIBUTOR | 403 | Forbidden |

## Manual E2E

| ID | Flow | Steps | Pass criteria |
|----|------|-------|---------------|
| E2E-12 | Log time | 1. Go to My Time 2. Click + on a day 3. Select task, enter hours 4. Save | Time log appears in weekly grid, total hours updated |

## Cross-references

- [Time tracking module entities](/charter/modules/timetracking/module-entities.md) — entities under test.
- [Test plan](/charter/testing-strategy.md) — global strategy, infrastructure, and test data.
- [Postman collection](/state/postman-collection.md) — the API test asset.