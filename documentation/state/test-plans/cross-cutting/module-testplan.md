---
type: State/Playbook
resource: docs/test-plan.md
---

# Cross-cutting module — test plan

Backend unit, integration, and E2E tests for the `cross-cutting` group (`security/`, `common/`, `config/`), compiled from the legacy `docs/test-plan.md`. This group owns the security boundary (`AuthController`, `AuthHelper`, `CaptchaService`), the audit/activity machinery (`AuditAspect`, `AuditLog`), and configuration (`OrganizationConfig`, `TaskType`, `TaskStatus`, `PublicHoliday`). The backend currently ships **no** test files; this is the planned coverage. Shared infrastructure and the global strategy live in [the test plan](/charter/testing-strategy.md).

## Unit — CaptchaService

| ID | Test case | Input | Expected |
|----|-----------|-------|----------|
| CS-1 | Generate produces valid challenge | `generate(session)` | question matches `"\\d+ [+−×] \\d+"`, answer is correct |
| CS-2 | Verify correct answer | generate then `verify(session, "correctAnswer")` | returns true |
| CS-3 | Verify wrong answer | generate then `verify(session, "999")` | returns false |
| CS-4 | Verify clears session attribute | generate then verify | session attribute removed |
| CS-5 | Verify with no prior generate | `verify(session, "5")` with no prior generate | returns false |
| CS-6 | Verify with non-numeric input | generate then `verify(session, "abc")` | returns false |
| CS-7 | Verify is single-use | generate, verify correct, then verify again | second verify returns false |
| CS-8 | All three operators possible | call generate 100 times | each operator appears at least once |

## Unit — AuthHelper

| ID | Test case | Setup | Expected |
|----|-----------|-------|----------|
| AH-1 | getCurrentUserId from CustomUserDetails | Set CustomUserDetails in SecurityContext | Returns userId |
| AH-2 | getCurrentUserId fallback | Set generic UserDetails | Parses username as Long |
| AH-3 | isGlobalUser with null company | companyId = null | true |
| AH-4 | isGlobalUser with company | companyId = 1 | false |
| AH-5 | hasAnyRole matches | authorities include ROLE_ADMIN | true for hasAnyRole("ADMIN") |
| AH-6 | hasAnyRole no match | authorities include ROLE_CONTRIBUTOR | false for hasAnyRole("ADMIN", "MANAGER") |
| AH-7 | canAccessProject — ADMIN bypass | ADMIN user, any project | true |
| AH-8 | canAccessProject — company match | User company=1, project company=1 | true |
| AH-9 | canAccessProject — company mismatch | User company=1, project company=2 | false |
| AH-10 | canAccessProject — global project | User company=1, project company=null | true |
| AH-11 | canAccessProject — project member | User company=2, project company=1, user is member | true |
| AH-12 | canAccessProject — EXTERNAL assigned | EXTERNAL user, assignedProject matches | true |
| AH-13 | canAccessProject — EXTERNAL not assigned | EXTERNAL user, assignedProject different | false |
| AH-14 | requireProjectReadAccess — denied | User lacks access | throws ForbiddenException |
| AH-15 | requireSelfOrAdmin — self | userId matches | No exception |
| AH-16 | requireSelfOrAdmin — ADMIN | ADMIN, different userId | No exception |
| AH-17 | requireSelfOrAdmin — other | Non-admin, different userId | throws ForbiddenException |

## Unit — AuditAspect

| Service | ID | Test case | Expected behavior |
|---------|----|-----------|-------------------|
| AuditAspect | AA-1 | @Audited method creates audit log | AuditLog persisted with entityType, action, userId |

## Integration — authentication endpoints

| ID | Method | Endpoint | Request | Expected Status | Expected Body |
|----|--------|----------|---------|-----------------|---------------|
| AUTH-1 | POST | `/api/auth/login` | `{username:"admin", password:"password123", captcha:CORRECT}` | 200 | `ApiResponse<UserDto>` with admin user |
| AUTH-2 | POST | `/api/auth/login` | `{username:"admin", password:"wrong", captcha:CORRECT}` | 401 | Error response |
| AUTH-3 | POST | `/api/auth/login` | `{username:"nonexistent", password:"x", captcha:CORRECT}` | 401 | Error response |
| AUTH-4 | POST | `/api/auth/login` | `{username:"admin", password:"password123"}` (no captcha) | 400 | "Invalid captcha answer" |
| AUTH-5 | POST | `/api/auth/login` | `{username:"admin", password:"password123", captcha:"WRONG"}` | 400 | "Invalid captcha answer" |
| AUTH-6 | POST | `/api/auth/login` | `{username:"", password:"password123"}` | 422 | Validation error on username |
| AUTH-7 | POST | `/api/auth/login` | `{password:"password123"}` (missing username) | 422 | Validation error |
| AUTH-8 | GET | `/api/auth/captcha` | (no auth) | 200 | `{data: {question: "X op Y"}, timestamp: ...}` |
| AUTH-9 | GET | `/api/auth/captcha` | Call twice, compare | 200 | Different questions (random) |
| AUTH-10 | GET | `/api/auth/me` | Authenticated session | 200 | Current user DTO |
| AUTH-11 | GET | `/api/auth/me` | No session | 401 | Unauthorized |
| AUTH-12 | POST | `/api/auth/logout` | Authenticated session | 200 | "Logged out" |
| AUTH-13 | POST | `/api/auth/logout` | No session | 200 | "Logged out" (idempotent) |

## Integration — run-mode authentication

| ID | Method | Request | Mode | Expected |
|----|--------|---------|------|----------|
| DM-1 | POST `/api/auth/login` | `{username:"admin", password:"anything"}` | dev | 200, login succeeds without captcha |
| DM-2 | POST `/api/auth/login` | `{username:"admin"}` (missing password) | dev | 422, password is @NotBlank |
| DM-3 | GET `/api/organization/public` | — | dev | `{mode: "dev", ...}` |
| DM-4 | GET `/api/organization/public` | — | prod | `{mode: "prod", ...}` |
| DM-5 | POST `/api/auth/login` | `{username:"admin", password:"anything"}` | demo | 200, login succeeds without captcha |
| DM-6 | GET `/api/organization/public` | — | demo | `{mode: "demo", ...}` |

## Integration — organization config endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| ORG-1 | GET | `/api/organization/public` | None | 200 | Returns org config, mode, version, build |
| ORG-2 | GET | `/api/organization` | Authenticated | 200 | Returns config for user's company |
| ORG-3 | PUT | `/api/organization` | ADMIN | 200 | Updates org config |
| ORG-4 | PUT | `/api/organization` | MANAGER | 403 | Forbidden |
| ORG-5 | GET | `/api/organization` | None | 401 | Unauthorized |

## Integration — task types and statuses

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| CFG-1 | GET | `/api/task-types` | Any authenticated | 200 | Returns 6 default types |
| CFG-2 | GET | `/api/task-statuses` | Any authenticated | 200 | Returns 4 default statuses |
| CFG-3 | POST | `/api/task-types` | ADMIN | 200 | Type created |
| CFG-4 | POST | `/api/task-types` | MANAGER | 403 | Forbidden |
| CFG-5 | PUT | `/api/task-types/{id}` | ADMIN | 200 | Type updated |
| CFG-6 | DELETE | `/api/task-types/{id}` | ADMIN | 200 | Type deleted |
| CFG-7 | POST | `/api/task-statuses` | ADMIN | 200 | Status created |
| CFG-8 | DELETE | `/api/task-statuses/{id}` | ADMIN | 200 | Status deleted |

## Integration — audit log endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| AUD-1 | GET | `/api/audit-logs` | ADMIN | 200 | Returns audit entries |
| AUD-2 | GET | `/api/audit-logs` | MANAGER | 403 | Forbidden |
| AUD-3 | GET | `/api/audit-logs?entityType=Task` | ADMIN | 200 | Filtered by entity type |
| AUD-4 | GET | `/api/audit-logs?performedBy=1` | ADMIN | 200 | Filtered by user |

## Integration — error handling and edge cases

| ID | Scenario | Expected |
|----|----------|----------|
| ERR-1 | GET nonexistent entity `/api/projects/99999` | 404 ErrorResponse with "Not Found" |
| ERR-2 | PUT with invalid JSON body | 400 Bad Request |
| ERR-3 | POST with missing required fields | 422 ValidationError with field-level errors |
| ERR-4 | POST with field too long (name > 255 chars) | 422 ValidationError |
| ERR-5 | Request without authentication to protected endpoint | 401 |
| ERR-6 | Request with insufficient role | 403 ErrorResponse with "Access denied" |
| ERR-7 | Concurrent duplicate key creation | 409 Conflict |
| ERR-8 | Create user with existing email | 409 Conflict |
| ERR-9 | Get task from different project | 403 or 404 |
| ERR-10 | Pagination: GET `/api/audit-logs?page=0&size=5` | PaginatedResponse with correct pagination |

## Frontend — API client

| ID | Test case | Expected |
|----|-----------|----------|
| FC-1 | `apiGet` unwraps ApiResponse.data | Returns inner data |
| FC-2 | `apiGetPaginated` returns full PaginatedResponse | Returns data + pagination |
| FC-3 | 401 interceptor calls sessionExpired | authStore.sessionExpired called |
| FC-4 | `extractValidationErrors` parses 422 response | Returns field → message map |

## Frontend — auth store

| ID | Test case | Setup | Expected |
|----|-----------|-------|----------|
| FS-1 | `login` success | Mock API to return UserDto | user set, isAuthenticated=true, isLoading=false |
| FS-2 | `login` failure | Mock API to throw | error set, isAuthenticated=false |
| FS-3 | `logout` clears state | Authenticated state | user=null, isAuthenticated=false |
| FS-4 | `checkSession` valid | Mock API to return UserDto | user set, isAuthenticated=true |
| FS-5 | `checkSession` expired | Mock API to throw | user=null, isAuthenticated=false |
| FS-6 | `clearError` clears error | error="Some error" | error=null |
| FS-7 | `updateUser` merges partial | user={firstName:"A"} | user.firstName="B" after update |
| FS-8 | `sessionExpired` resets auth | Authenticated state | user=null, isAuthenticated=false |

## Frontend — hooks

| ID | Test case | Expected |
|----|-----------|----------|
| FH-1 | `useVersion` fetches on first call, returns version+mode | version = "0.9.0+build", mode = "dev"/"demo"/"prod" |
| FH-2 | `useVersion` caches result, no duplicate fetch | API called once on second render |

## Frontend — guards

| ID | Test case | Expected |
|----|-----------|----------|
| FG-1 | AuthGuard renders children when authenticated | Children visible |
| FG-2 | AuthGuard redirects when not authenticated | Navigate to /login |
| FG-3 | GuestGuard renders children when not authenticated | Children visible |
| FG-4 | GuestGuard redirects when authenticated | Navigate to / |
| FG-5 | AdminGuard renders for ADMIN | Children visible |
| FG-6 | AdminGuard redirects for MANAGER | Navigate to / |
| FG-7 | RoleGuard renders when role matches | Children visible |
| FG-8 | RoleGuard redirects when role doesn't match | Navigate to / |

## Frontend — LoginPage

| ID | Test case | Setup | Expected |
|----|-----------|-------|----------|
| FL-1 | Renders username and password fields | — | Both fields visible |
| FL-2 | Renders captcha in prod mode | mode="prod" | Question + answer input visible |
| FL-3 | Hides captcha in dev/demo mode | mode="dev" | No captcha field, mode hint shown |
| FL-4 | Shows error on failed login | Mock API to throw | Error banner visible |
| FL-5 | Calls login with captcha in prod mode | Fill form, submit | login(username, password, captchaAnswer) called |
| FL-6 | Calls login without captcha in dev/demo mode | Fill form, submit | login(username, password, undefined) called |
| FL-7 | Refreshes captcha after failed login | Mock API to throw | getCaptcha called again |
| FL-8 | Shows version in header | version="0.9.0", build="26050316" | "v0.9.0+26050316" visible |
| FL-9 | Shows mode badge | mode="dev" | Amber badge with pulsing dot visible |

## Frontend — Sidebar

| ID | Test case | User role | Expected visible |
|----|-----------|-----------|------------------|
| FSB-1 | ADMIN menu items | ADMIN | Dashboard, Admin, Programs |
| FSB-2 | MANAGER menu items | MANAGER | Dashboard, Projects, Programs, My Time, Timesheets, Reports, PMO |
| FSB-3 | EXECUTIVE menu items | EXECUTIVE | Dashboard, Programs, Reports, PMO |
| FSB-4 | CONTRIBUTOR menu items | CONTRIBUTOR | Dashboard, Projects, My Time |
| FSB-5 | EXTERNAL menu items | EXTERNAL | Dashboard only |
| FSB-6 | Collapsed state | — | Only icons, no labels |
| FSB-7 | Expanded state | — | Icons + labels visible |
| FSB-8 | Version display | — | Version string shown next to "Nemo" |

## Frontend — TopBar

| ID | Test case | Expected |
|----|-----------|----------|
| FTB-1 | Shows title with version | "Nemo 0.9.0+26050316" visible |
| FTB-2 | Shows mode badge when mode="dev" | Amber badge visible |
| FTB-3 | Hides mode badge when mode="prod" | No badge |
| FTB-4 | Shows company badge for company user | Blue badge with company name |
| FTB-5 | Shows Global badge for admin without company | Purple "Global" badge |

## Manual E2E — authentication

| ID | Flow | Steps | Pass criteria |
|----|------|-------|---------------|
| E2E-1 | Normal login | 1. Load login page 2. Verify captcha appears 3. Enter correct answer 4. Enter credentials 5. Submit | Logged in, redirected to dashboard |
| E2E-2 | Login with wrong captcha | 1. Enter wrong captcha answer 2. Submit | Error shown, new captcha generated |
| E2E-3 | Dev/demo mode login | 1. Start with nemo.mode=dev or demo 2. Verify no captcha shown 3. Enter any password 4. Submit | Logged in, mode badge visible |
| E2E-4 | Session persistence | 1. Login 2. Close tab 3. Reopen app | Still logged in |
| E2E-5 | Session expiry | 1. Login 2. Wait for session timeout 3. Navigate | Redirected to login page |
| E2E-6 | Logout | 1. Login 2. Click logout | Redirected to login page |
| E2E-7 | Tab re-validation | 1. Login 2. Switch browser tabs 3. Switch back | Session re-checked, still authenticated |

## Manual E2E — role-based access

| ID | Flow | Steps | Pass criteria |
|----|------|-------|---------------|
| E2E-16 | ADMIN sees Admin menu | Login as admin | Admin menu item visible in sidebar |
| E2E-17 | CONTRIBUTOR no Admin menu | Login as contributor | No Admin menu item |
| E2E-18 | CONTRIBUTOR limited project tabs | Login as contributor, open project | Only Tasks, Board, Docs tabs visible |
| E2E-19 | EXECUTIVE sees PMO | Login as executive | PMO menu item visible |
| E2E-20 | EXTERNAL limited access | Login as external user | Only Dashboard visible, limited task access |

## Manual E2E — edge cases and error handling

| ID | Flow | Steps | Pass criteria |
|----|------|-------|---------------|
| E2E-24 | Duplicate key | 1. Create project with existing key | Error message displayed |
| E2E-25 | Invalid form data | 1. Submit form with blank required fields | Validation errors shown inline |
| E2E-26 | Network error | 1. Stop backend 2. Try to navigate | Error handled gracefully |
| E2E-27 | Large file upload | 1. Upload > 10MB attachment | Rejected with clear error |
| E2E-28 | Concurrent edits | 1. Two users edit same task 2. Both save | Last write wins, no crash |
| E2E-29 | Deleted entity reference | 1. Open task detail 2. Delete project in another tab 3. Navigate back | 404 or redirect handled gracefully |
| E2E-30 | Browser back button | 1. Navigate through several pages 2. Press back | Correct page shown |

## Newman contract extensions

Scenarios to add to `postman/nemo-api-collection.json` (see [Postman collection](/state/postman-collection.md)):

- Auth — captcha flow: GET captcha → login with correct answer → login with wrong answer → login without captcha.
- Auth — dev/demo mode: login with any password, no captcha.
- Auth — session expiry: login → wait → request → 401.
- RBAC — CONTRIBUTOR tries admin endpoints → 403.
- RBAC — EXTERNAL tries to view non-external task → 403.
- RBAC — EXECUTIVE tries to create RAID item → 403.
- Validation — create user with short password → 422.
- Validation — create company with long key → 422.

## Cross-references

- [Cross-cutting module entities](/charter/modules/cross-cutting/module-entities.md) — entities under test.
- [Test plan](/charter/testing-strategy.md) — global strategy, infrastructure, and test data.
- [Postman collection](/state/postman-collection.md) — the API test asset.
- [Authentication](/charter/security/authentication.md), [Authorization (RBAC)](/charter/security/authorization-rbac.md) — the security behavior these tests assert.