---
type: Playbook
resource: docs/test-plan.md
---

# Delivery module — test plan

Backend unit, integration, and E2E tests for the `delivery` group (`program/`, `portfolio/`, `project/`, `task/`, `sprint/`, `phase/`, `pmo/`), compiled from the legacy `docs/test-plan.md`. The backend currently ships **no** test files; this is the planned coverage. Shared infrastructure (base test class, `application-test.yml`, seed users) and the global strategy live in [the test plan](/testing/test-plan.md).

## Unit — mappers

Test each mapper in isolation with `@SpringBootTest` to inject the mapper bean.

| Mapper | Test cases |
|--------|------------|
| ProjectMapper | Entity→DTO maps all fields; programId/managerId from relations; `favorite` field ignored (set by controller) |
| TaskMapper | Entity→DTO maps all fields; assigneeName/reporterName as "firstName lastName"; labelIds/labelNames from ManyToMany |
| RaidItemMapper | Entity→DTO maps all fields; riskScore = probability * impact; null probability → 0 |
| ProgramMapper | Entity→DTO maps all fields; projectCount ignored (set by service) |

## Unit — service layer

| Service | ID | Test case | Expected behavior |
|---------|----|-----------|-------------------|
| ProjectService | PS-1 | Create project auto-generates board columns | Board columns created from default task statuses |
| ProjectService | PS-2 | Create project adds manager as member | ProjectMember entry exists for manager |
| ProjectService | PS-3 | Delete project removes all related data | Tasks, members, labels, board columns deleted |
| TaskService | IS-1 | Create task auto-generates task key | Format: `{project.key}-{sequence}` |
| TaskService | IS-2 | Create task sets reporter to current user | reporterId = authenticated userId |
| TaskService | IS-3 | Create task defaults position to max+1 | position = max(existing positions) + 1 |
| TaskService | IS-4 | EXTERNAL user creates task with external=true | external flag set |
| TaskService | IS-5 | EXTERNAL user cannot create non-external task | throws ForbiddenException |
| TaskService | IS-6 | Move task to different status | position updated, status changed |
| PmoService | PMO-1 | EVM calculation — all zeros | No tasks/time logs → PV=0, EV=0, AC=0 |
| PmoService | PMO-2 | EVM calculation — typical values | CPI = EV/AC, SPI = EV/PV computed correctly |

## Integration — program endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| PRG-1 | GET | `/api/programs` | Any authenticated | 200 | Returns programs (filtered by company) |
| PRG-2 | GET | `/api/programs/{id}` | Any authenticated | 200 | Returns program |
| PRG-3 | POST | `/api/programs` | ADMIN | 200 | Program created |
| PRG-4 | POST | `/api/programs` | MANAGER | 200 | Program created |
| PRG-5 | POST | `/api/programs` | CONTRIBUTOR | 403 | Forbidden |
| PRG-6 | POST | `/api/programs` | ADMIN | Duplicate key | 409 | Conflict |
| PRG-7 | PUT | `/api/programs/{id}` | ADMIN | 200 | Program updated |
| PRG-8 | PUT | `/api/programs/{id}` | CONTRIBUTOR | 403 | Forbidden |
| PRG-9 | DELETE | `/api/programs/{id}` | ADMIN | 200 | Program deleted |
| PRG-10 | DELETE | `/api/programs/{id}` | MANAGER | 403 | Forbidden |

## Integration — project endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| PRJ-1 | GET | `/api/projects` | ADMIN | 200 | Returns all projects |
| PRJ-2 | GET | `/api/projects` | MANAGER | 200 | Returns visible projects (company + member) |
| PRJ-3 | GET | `/api/projects/{id}` | Project member | 200 | Returns project |
| PRJ-4 | GET | `/api/projects/{id}` | Non-member | 403 | Forbidden |
| PRJ-5 | POST | `/api/projects` | ADMIN | 200 | Project created with board columns and manager as member |
| PRJ-6 | POST | `/api/projects` | MANAGER | 200 | Project created |
| PRJ-7 | POST | `/api/projects` | CONTRIBUTOR | 403 | Forbidden |
| PRJ-8 | POST | `/api/projects` | ADMIN | Blank name | 422 | Validation error |
| PRJ-9 | POST | `/api/projects` | ADMIN | key > 10 chars | 422 | Validation error |
| PRJ-10 | POST | `/api/projects` | ADMIN | null programId | 422 | Validation error |
| PRJ-11 | POST | `/api/projects/{id}/favorite` | Authenticated | 200 | Toggle favorite |
| PRJ-12 | GET | `/api/projects/{id}/board` | Member | 200 | Returns board config with columns |
| PRJ-13 | PUT | `/api/projects/{id}/board` | ADMIN | 200 | Board config updated |
| PRJ-14 | GET | `/api/projects/{id}/members` | Member | 200 | Returns member list |
| PRJ-15 | POST | `/api/projects/{id}/members` | ADMIN | 200 | Member added |
| PRJ-16 | DELETE | `/api/projects/{id}/members/{userId}` | ADMIN | 200 | Member removed |
| PRJ-17 | DELETE | `/api/projects/{id}` | ADMIN | 200 | Project deleted |

## Integration — task endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| ISS-1 | GET | `/api/projects/{id}/tasks` | Project member | 200 | Returns tasks |
| ISS-2 | GET | `/api/projects/{id}/tasks` | Non-member | 403 | Forbidden |
| ISS-3 | GET | `/api/projects/{id}/tasks/{taskId}` | Member | 200 | Returns task |
| ISS-4 | GET | `/api/projects/{id}/tasks/{taskId}` | EXTERNAL, own external task | 200 | Returns task |
| ISS-5 | GET | `/api/projects/{id}/tasks/{taskId}` | EXTERNAL, other task | 403 | Forbidden |
| ISS-6 | POST | `/api/projects/{id}/tasks` | Member | 200 | Task created, taskKey auto-generated |
| ISS-7 | POST | `/api/projects/{id}/tasks` | EXTERNAL | 200 | Task created with external=true |
| ISS-8 | POST | `/api/projects/{id}/tasks` | Non-member | 403 | Forbidden |
| ISS-9 | POST | `/api/projects/{id}/tasks` | Member | Blank title | 422 | Validation error |
| ISS-10 | PUT | `/api/projects/{id}/tasks/{taskId}` | Member | 200 | Task updated |
| ISS-11 | PUT | `/api/projects/{id}/tasks/{taskId}` | EXTERNAL, own task | 200 | Updated |
| ISS-12 | PUT | `/api/projects/{id}/tasks/{taskId}` | EXTERNAL, other task | 403 | Forbidden |
| ISS-13 | DELETE | `/api/projects/{id}/tasks/{taskId}` | ADMIN | 200 | Task deleted |
| ISS-14 | DELETE | `/api/projects/{id}/tasks/{taskId}` | CONTRIBUTOR | 403 | Forbidden |
| ISS-15 | PATCH | `/api/projects/{id}/tasks/{taskId}/position` | Member | 200 | Position updated |
| ISS-16 | GET | `/api/projects/{id}/tasks/{taskId}/comments` | Member | 200 | Returns comments |
| ISS-17 | POST | `/api/projects/{id}/tasks/{taskId}/comments` | Member | 200 | Comment created |
| ISS-18 | POST | `/api/projects/{id}/tasks/{taskId}/comments` | Non-member | 403 | Forbidden |
| ISS-19 | PUT | `/api/projects/{id}/tasks/{taskId}/comments/{cid}` | Author | 200 | Comment updated |
| ISS-20 | PUT | `/api/projects/{id}/tasks/{taskId}/comments/{cid}` | Other user | 403 | Forbidden |
| ISS-21 | DELETE | `/api/projects/{id}/tasks/{taskId}/comments/{cid}` | ADMIN | 200 | Comment deleted |

## Integration — sprint endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| SPR-1 | GET | `/api/projects/{id}/sprints` | Member | 200 | Returns sprints |
| SPR-2 | POST | `/api/projects/{id}/sprints` | ADMIN | 200 | Sprint created |
| SPR-3 | POST | `/api/projects/{id}/sprints` | CONTRIBUTOR | 403 | Forbidden |
| SPR-4 | PUT | `/api/projects/{id}/sprints/{sprintId}` | ADMIN | 200 | Sprint updated |
| SPR-5 | PATCH | `/api/projects/{id}/sprints/{sprintId}/status` | ADMIN | 200 | Sprint status changed (e.g., PLANNING → ACTIVE) |
| SPR-6 | GET | `/api/projects/{id}/backlog` | Member | 200 | Returns unassigned tasks |

## Integration — PMO / RAID endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| RAID-1 | GET | `/api/projects/{id}/raid` | ADMIN | 200 | Returns RAID items |
| RAID-2 | GET | `/api/projects/{id}/raid` | MANAGER | 200 | Returns RAID items |
| RAID-3 | GET | `/api/projects/{id}/raid` | EXECUTIVE | 200 | Returns RAID items |
| RAID-4 | GET | `/api/projects/{id}/raid` | CONTRIBUTOR | 403 | Forbidden |
| RAID-5 | POST | `/api/projects/{id}/raid` | ADMIN | 200 | RAID item created |
| RAID-6 | POST | `/api/projects/{id}/raid` | MANAGER | 200 | RAID item created |
| RAID-7 | POST | `/api/projects/{id}/raid` | EXECUTIVE | 403 | Forbidden (read-only for EXECUTIVE) |
| RAID-8 | PUT | `/api/projects/{id}/raid/{id2}` | ADMIN | 200 | RAID item updated |
| RAID-9 | DELETE | `/api/projects/{id}/raid/{id2}` | ADMIN | 200 | RAID item deleted |
| RAID-10 | GET | `/api/pmo/evm/{projectId}` | ADMIN | 200 | Returns EVM metrics |
| RAID-11 | GET | `/api/pmo/evm/{projectId}` | CONTRIBUTOR | 403 | Forbidden |
| RAID-12 | GET | `/api/pmo/portfolio` | EXECUTIVE | 200 | Returns portfolio summary |

## Frontend — ProjectDetailPage tab visibility

| ID | Role | Expected visible tabs |
|----|------|-----------------------|
| FPT-1 | EXECUTIVE | Summary, Board, RAID, Docs |
| FPT-2 | MANAGER | Summary, Tasks, Board, RAID, Docs, Phases, Members, Settings |
| FPT-3 | CONTRIBUTOR | Tasks, Board, Docs |
| FPT-4 | EXTERNAL | Tasks, Board |

## Manual E2E

| ID | Flow | Steps | Pass criteria |
|----|------|-------|---------------|
| E2E-8 | Create project | 1. Click create 2. Fill name, key, program, manager 3. Submit | Project created, board columns auto-generated |
| E2E-9 | Create task | 1. Go to project Tasks tab 2. Click create 3. Fill title, priority, type 4. Submit | Task created with auto-generated key |
| E2E-10 | Drag task on board | 1. Go to Board tab 2. Drag task from "To Do" to "In Progress" | Task status updated, stays in new column on refresh |
| E2E-11 | Create RAID item | 1. Go to RAID tab 2. Click Risk 3. Fill title, probability, impact 4. Submit | RAID item created, risk score computed |
| E2E-15 | Toggle favorite | 1. Go to Projects list 2. Click star on project | Star filled, project appears in favorites |

## Newman contract extensions

Domain-specific scenarios to add to `postman/nemo-api-collection.json` (see [Postman collection](/testing/postman-collection.md)):

- Create project with blank name → 422.
- Create task in nonexistent project → 404.
- Delete project with existing tasks → cascade or 409.
- Duplicate key on program/project → 409.

## Cross-references

- [Delivery module entities](/modules/delivery/module-entities.md) — entities under test.
- [Test plan](/testing/test-plan.md) — global strategy, infrastructure, and test data.
- [Postman collection](/testing/postman-collection.md) — the API test asset.