# Nemo — Comprehensive Test Plan

## 1. Test Strategy Overview

The Nemo application has **zero existing tests**. Both backend (Spring Boot) and frontend (React) lack test infrastructure, test files, and test configurations. This plan establishes testing from the ground up across four levels:

| Level | Scope | Tooling | Run Frequency |
|-------|-------|---------|---------------|
| Unit | Individual functions, mappers, services | JUnit 5 + Mockito (backend), Vitest (frontend) | Every commit |
| Integration | API endpoints with DB, security, validation | Spring Boot Test + `@WebMvcTest` | Every commit |
| API Contract | Full HTTP request/response against running server | Newman / Postman Collection | Pre-merge |
| Manual E2E | Browser-based flows | Human testing checklist | Pre-release |

---

## 2. Backend Test Infrastructure

### 2.1 Setup

The backend already has `spring-boot-starter-test` and `spring-security-test` in `build.gradle` with `useJUnitPlatform()`. No additional dependencies are needed for unit and integration tests.

Add Testcontainers for realistic database integration tests:

```groovy
testImplementation 'org.testcontainers:testcontainers:1.21.0'
testImplementation 'org.testcontainers:postgresql:1.21.0'
testImplementation 'org.testcontainers:junit-jupiter:1.21.0'
```

### 2.2 Test Configuration

**`src/test/resources/application-test.yml`:**
```yaml
nemo:
  mode: test
  version: 0.0.0-test
  build: test

spring:
  datasource.url: jdbc:h2:mem:testdb
  datasource.driver-class-name: org.h2.Driver
  datasource.username: sa
  datasource.password: ''
  jpa.hibernate.ddl-auto: create-drop
  h2.console.enabled: false
  sql.init.mode: never
  servlet.multipart.max-file-size: 10MB
  servlet.multipart.max-request-size: 10MB

storage.filesystem.base-path: ./test-attachments
```

**Base test class for authenticated requests:**
```java
@ActiveProfiles("test")
@AutoConfigureMockMvc
@SpringBootTest
public abstract class IntegrationTestBase {
    @Autowired protected MockMvc mockMvc;
    @Autowired protected UserRepository userRepository;
    @Autowired protected PasswordEncoder passwordEncoder;

    protected Long adminUserId;
    protected Long managerUserId;
    protected Long contributorUserId;
    protected Long externalUserId;

    @BeforeEach
    void seedUsers() {
        // Create test users with BCrypt-encoded passwords
        // admin (ADMIN), manager (MANAGER, companyId=1), contributor (CONTRIBUTOR, companyId=1), external (EXTERNAL)
        // Store IDs for use in tests
    }

    protected MockHttpServletRequestBuilder authenticated(Long userId, String username) {
        // Helper to set up session-based auth for MockMvc requests
    }
}
```

---

## 3. Backend Unit Tests

### 3.1 CaptchaService

| ID | Test Case | Input | Expected |
|----|-----------|-------|----------|
| CS-1 | Generate produces valid challenge | `generate(session)` | question matches `"\\d+ [+−×] \\d+"`, answer is correct |
| CS-2 | Verify correct answer | generate then `verify(session, "correctAnswer")` | returns true |
| CS-3 | Verify wrong answer | generate then `verify(session, "999")` | returns false |
| CS-4 | Verify clears session attribute | generate then verify | session attribute removed |
| CS-5 | Verify with no prior generate | `verify(session, "5")` with no prior generate | returns false |
| CS-6 | Verify with non-numeric input | generate then `verify(session, "abc")` | returns false |
| CS-7 | Verify is single-use | generate, verify correct, then verify again | second verify returns false |
| CS-8 | All three operators possible | call generate 100 times | each operator appears at least once |

### 3.2 AuthHelper

| ID | Test Case | Setup | Expected |
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

### 3.3 MapStruct Mappers

Test each mapper in isolation with `@SpringBootTest` to inject the mapper bean.

| Mapper | Test Cases |
|--------|------------|
| UserMapper | Entity→DTO maps all fields; companyId/companyName from company relation; null company → null companyId |
| ProjectMapper | Entity→DTO maps all fields; programId/managerId from relations; `favorite` field ignored (set by controller) |
| IssueMapper | Entity→DTO maps all fields; assigneeName/reporterName as "firstName lastName"; labelIds/labelNames from ManyToMany |
| RaidItemMapper | Entity→DTO maps all fields; riskScore = probability * impact; null probability → 0 |
| TimeLogMapper | Entity→DTO maps all fields; userName as "firstName lastName"; issueKey from issue relation |
| ProgramMapper | Entity→DTO maps all fields; projectCount ignored (set by service) |

### 3.4 Service Layer — Business Logic

| Service | ID | Test Case | Expected Behavior |
|---------|----|-----------|-------------------|
| ProjectService | PS-1 | Create project auto-generates board columns | Board columns created from default issue statuses |
| ProjectService | PS-2 | Create project adds manager as member | ProjectMember entry exists for manager |
| ProjectService | PS-3 | Delete project removes all related data | Issues, members, labels, board columns deleted |
| IssueService | IS-1 | Create issue auto-generates issue key | Format: `{project.key}-{sequence}` |
| IssueService | IS-2 | Create issue sets reporter to current user | reporterId = authenticated userId |
| IssueService | IS-3 | Create issue defaults position to max+1 | position = max(existing positions) + 1 |
| IssueService | IS-4 | EXTERNAL user creates issue with external=true | external flag set |
| IssueService | IS-5 | EXTERNAL user cannot create non-external issue | throws ForbiddenException |
| IssueService | IS-6 | Move issue to different status | position updated, status changed |
| PmoService | PMO-1 | EVM calculation — all zeros | No issues/time logs → PV=0, EV=0, AC=0 |
| PmoService | PMO-2 | EVM calculation — typical values | CPI = EV/AC, SPI = EV/PV computed correctly |
| WikiPageService | WS-1 | Create page generates slug from title | "My Page Title" → slug "my-page-title" |
| WikiPageService | WS-2 | Duplicate slug within project rejected | throws DuplicateKeyException |
| WikiPageService | WS-3 | Tree structure via parentId | Root pages have null parentId; children reference parent |
| TimeLogService | TS-1 | User can log time for themselves | Succeeds |
| TimeLogService | TS-2 | User cannot log time for another user | throws ForbiddenException |
| TimeLogService | TS-3 | ADMIN can log time for any user | Succeeds |
| AuditAspect | AA-1 | @Audited method creates audit log | AuditLog persisted with entityType, action, userId |

---

## 4. Backend Integration Tests (API Endpoints)

### 4.1 Authentication Endpoints

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

### 4.2 Run Mode Authentication

| ID | Method | Request | Mode | Expected |
|----|--------|---------|------|----------|
| DM-1 | POST `/api/auth/login` | `{username:"admin", password:"anything"}` | dev | 200, login succeeds without captcha |
| DM-2 | POST `/api/auth/login` | `{username:"admin"}` (missing password) | dev | 422, password is @NotBlank |
| DM-3 | GET `/api/organization/public` | — | dev | `{mode: "dev", ...}` |
| DM-4 | GET `/api/organization/public` | — | prod | `{mode: "prod", ...}` |
| DM-5 | POST `/api/auth/login` | `{username:"admin", password:"anything"}` | demo | 200, login succeeds without captcha |
| DM-6 | GET `/api/organization/public` | — | demo | `{mode: "demo", ...}` |

### 4.3 Organization Config Endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| ORG-1 | GET | `/api/organization/public` | None | 200 | Returns org config, mode, version, build |
| ORG-2 | GET | `/api/organization` | Authenticated | 200 | Returns config for user's company |
| ORG-3 | PUT | `/api/organization` | ADMIN | 200 | Updates org config |
| ORG-4 | PUT | `/api/organization` | MANAGER | 403 | Forbidden |
| ORG-5 | GET | `/api/organization` | None | 401 | Unauthorized |

### 4.4 User Endpoints

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

### 4.5 Company Endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| CMP-1 | GET | `/api/companies` | ADMIN | 200 | Returns all companies |
| CMP-2 | GET | `/api/companies` | MANAGER | 403 | Forbidden |
| CMP-3 | POST | `/api/companies` | ADMIN | 200 | Company created |
| CMP-4 | POST | `/api/companies` | ADMIN | Duplicate key | 409 | Conflict |
| CMP-5 | POST | `/api/companies` | ADMIN | key > 10 chars | 422 | Validation error |
| CMP-6 | PUT | `/api/companies/{id}` | ADMIN | 200 | Company updated |
| CMP-7 | DELETE | `/api/companies/{id}` | ADMIN | 200 | Company deactivated |

### 4.6 Program Endpoints

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

### 4.7 Project Endpoints

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

### 4.8 Issue Endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| ISS-1 | GET | `/api/projects/{id}/issues` | Project member | 200 | Returns issues |
| ISS-2 | GET | `/api/projects/{id}/issues` | Non-member | 403 | Forbidden |
| ISS-3 | GET | `/api/projects/{id}/issues/{issueId}` | Member | 200 | Returns issue |
| ISS-4 | GET | `/api/projects/{id}/issues/{issueId}` | EXTERNAL, own external issue | 200 | Returns issue |
| ISS-5 | GET | `/api/projects/{id}/issues/{issueId}` | EXTERNAL, other issue | 403 | Forbidden |
| ISS-6 | POST | `/api/projects/{id}/issues` | Member | 200 | Issue created, issueKey auto-generated |
| ISS-7 | POST | `/api/projects/{id}/issues` | EXTERNAL | 200 | Issue created with external=true |
| ISS-8 | POST | `/api/projects/{id}/issues` | Non-member | 403 | Forbidden |
| ISS-9 | POST | `/api/projects/{id}/issues` | Member | Blank title | 422 | Validation error |
| ISS-10 | PUT | `/api/projects/{id}/issues/{issueId}` | Member | 200 | Issue updated |
| ISS-11 | PUT | `/api/projects/{id}/issues/{issueId}` | EXTERNAL, own issue | 200 | Updated |
| ISS-12 | PUT | `/api/projects/{id}/issues/{issueId}` | EXTERNAL, other issue | 403 | Forbidden |
| ISS-13 | DELETE | `/api/projects/{id}/issues/{issueId}` | ADMIN | 200 | Issue deleted |
| ISS-14 | DELETE | `/api/projects/{id}/issues/{issueId}` | CONTRIBUTOR | 403 | Forbidden |
| ISS-15 | PATCH | `/api/projects/{id}/issues/{issueId}/position` | Member | 200 | Position updated |
| ISS-16 | GET | `/api/projects/{id}/issues/{issueId}/comments` | Member | 200 | Returns comments |
| ISS-17 | POST | `/api/projects/{id}/issues/{issueId}/comments` | Member | 200 | Comment created |
| ISS-18 | POST | `/api/projects/{id}/issues/{issueId}/comments` | Non-member | 403 | Forbidden |
| ISS-19 | PUT | `/api/projects/{id}/issues/{issueId}/comments/{cid}` | Author | 200 | Comment updated |
| ISS-20 | PUT | `/api/projects/{id}/issues/{issueId}/comments/{cid}` | Other user | 403 | Forbidden |
| ISS-21 | DELETE | `/api/projects/{id}/issues/{issueId}/comments/{cid}` | ADMIN | 200 | Comment deleted |

### 4.9 Sprint Endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| SPR-1 | GET | `/api/projects/{id}/sprints` | Member | 200 | Returns sprints |
| SPR-2 | POST | `/api/projects/{id}/sprints` | ADMIN | 200 | Sprint created |
| SPR-3 | POST | `/api/projects/{id}/sprints` | CONTRIBUTOR | 403 | Forbidden |
| SPR-4 | PUT | `/api/projects/{id}/sprints/{sprintId}` | ADMIN | 200 | Sprint updated |
| SPR-5 | PATCH | `/api/projects/{id}/sprints/{sprintId}/status` | ADMIN | 200 | Sprint status changed (e.g., PLANNING → ACTIVE) |
| SPR-6 | GET | `/api/projects/{id}/backlog` | Member | 200 | Returns unassigned issues |

### 4.10 Time Tracking Endpoints

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

### 4.11 PMO / RAID Endpoints

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

### 4.12 Wiki Endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| WIK-1 | GET | `/api/projects/{id}/wiki/pages` | Member | 200 | Returns page tree |
| WIK-2 | GET | `/api/projects/{id}/wiki/pages` | Non-member | 403 | Forbidden |
| WIK-3 | POST | `/api/projects/{id}/wiki/pages` | Member | 200 | Wiki page created, slug auto-generated |
| WIK-4 | POST | `/api/projects/{id}/wiki/pages` | Member | Duplicate slug | 409 | Conflict |
| WIK-5 | PUT | `/api/projects/{id}/wiki/pages/{pageId}` | Member | 200 | Page updated |
| WIK-6 | DELETE | `/api/projects/{id}/wiki/pages/{pageId}` | ADMIN | 200 | Page deleted |
| WIK-7 | DELETE | `/api/projects/{id}/wiki/pages/{pageId}` | CONTRIBUTOR | 403 | Forbidden |
| WIK-8 | GET | `/api/projects/{id}/wiki/search?q=term` | Member | 200 | Returns search hits |

### 4.13 Issue Types and Statuses

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| CFG-1 | GET | `/api/issue-types` | Any authenticated | 200 | Returns 6 default types |
| CFG-2 | GET | `/api/issue-statuses` | Any authenticated | 200 | Returns 4 default statuses |
| CFG-3 | POST | `/api/issue-types` | ADMIN | 200 | Type created |
| CFG-4 | POST | `/api/issue-types` | MANAGER | 403 | Forbidden |
| CFG-5 | PUT | `/api/issue-types/{id}` | ADMIN | 200 | Type updated |
| CFG-6 | DELETE | `/api/issue-types/{id}` | ADMIN | 200 | Type deleted |
| CFG-7 | POST | `/api/issue-statuses` | ADMIN | 200 | Status created |
| CFG-8 | DELETE | `/api/issue-statuses/{id}` | ADMIN | 200 | Status deleted |

### 4.14 Audit Log Endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| AUD-1 | GET | `/api/audit-logs` | ADMIN | 200 | Returns audit entries |
| AUD-2 | GET | `/api/audit-logs` | MANAGER | 403 | Forbidden |
| AUD-3 | GET | `/api/audit-logs?entityType=Issue` | ADMIN | 200 | Filtered by entity type |
| AUD-4 | GET | `/api/audit-logs?performedBy=1` | ADMIN | 200 | Filtered by user |

### 4.15 Error Handling and Edge Cases

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
| ERR-9 | Get issue from different project | 403 or 404 |
| ERR-10 | Pagination: GET `/api/audit-logs?page=0&size=5` | PaginatedResponse with correct pagination |

---

## 5. API Contract Tests (Newman)

The existing Postman collection at `postman/nemo-api-collection.json` covers the happy path. Extend it with these additional scenarios:

| Area | Additional Tests |
|------|-----------------|
| Auth | Captcha flow: GET captcha → login with correct answer → login with wrong answer → login without captcha |
| Auth | Dev/demo mode: login with any password, no captcha |
| Auth | Session expiry: login → wait → request → 401 |
| RBAC | CONTRIBUTOR tries admin endpoints → 403 |
| RBAC | EXTERNAL tries to view non-external issue → 403 |
| RBAC | EXECUTIVE tries to create RAID item → 403 |
| Validation | Create project with blank name → 422 |
| Validation | Create user with short password → 422 |
| Validation | Create company with long key → 422 |
| Edge Cases | Create issue in nonexistent project → 404 |
| Edge Cases | Delete project with existing issues → cascade or 409 |
| Edge Cases | Duplicate key on company/program/project → 409 |

---

## 6. Frontend Test Infrastructure

### 6.1 Setup

Install test dependencies:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Add to `vite.config.ts`:
```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
}
```

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

Add script to `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

### 6.2 Frontend Unit Tests

#### API Client

| ID | Test Case | Expected |
|----|-----------|----------|
| FC-1 | `apiGet` unwraps ApiResponse.data | Returns inner data |
| FC-2 | `apiGetPaginated` returns full PaginatedResponse | Returns data + pagination |
| FC-3 | 401 interceptor calls sessionExpired | authStore.sessionExpired called |
| FC-4 | `extractValidationErrors` parses 422 response | Returns field → message map |

#### Stores

| ID | Test Case | Setup | Expected |
|----|-----------|-------|----------|
| FS-1 | `login` success | Mock API to return UserDto | user set, isAuthenticated=true, isLoading=false |
| FS-2 | `login` failure | Mock API to throw | error set, isAuthenticated=false |
| FS-3 | `logout` clears state | Authenticated state | user=null, isAuthenticated=false |
| FS-4 | `checkSession` valid | Mock API to return UserDto | user set, isAuthenticated=true |
| FS-5 | `checkSession` expired | Mock API to throw | user=null, isAuthenticated=false |
| FS-6 | `clearError` clears error | error="Some error" | error=null |
| FS-7 | `updateUser` merges partial | user={firstName:"A"} | user.firstName="B" after update |
| FS-8 | `sessionExpired` resets auth | Authenticated state | user=null, isAuthenticated=false |

#### Hooks

| ID | Test Case | Expected |
|----|-----------|----------|
| FH-1 | `useVersion` fetches on first call, returns version+mode | version = "0.9.0+build", mode = "dev"/"demo"/"prod" |
| FH-2 | `useVersion` caches result, no duplicate fetch | API called once on second render |

### 6.3 Frontend Component Tests

#### Guards

| ID | Test Case | Expected |
|----|-----------|----------|
| FG-1 | AuthGuard renders children when authenticated | Children visible |
| FG-2 | AuthGuard redirects when not authenticated | Navigate to /login |
| FG-3 | GuestGuard renders children when not authenticated | Children visible |
| FG-4 | GuestGuard redirects when authenticated | Navigate to / |
| FG-5 | AdminGuard renders for ADMIN | Children visible |
| FG-6 | AdminGuard redirects for MANAGER | Navigate to / |
| FG-7 | RoleGuard renders when role matches | Children visible |
| FG-8 | RoleGuard redirects when role doesn't match | Navigate to / |

#### LoginPage

| ID | Test Case | Setup | Expected |
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

#### Sidebar

| ID | Test Case | User Role | Expected Visible |
|----|-----------|-----------|------------------|
| FSB-1 | ADMIN menu items | ADMIN | Dashboard, Admin, Programs |
| FSB-2 | MANAGER menu items | MANAGER | Dashboard, Projects, Programs, My Time, Timesheets, Reports, PMO |
| FSB-3 | EXECUTIVE menu items | EXECUTIVE | Dashboard, Programs, Reports, PMO |
| FSB-4 | CONTRIBUTOR menu items | CONTRIBUTOR | Dashboard, Projects, My Time |
| FSB-5 | EXTERNAL menu items | EXTERNAL | Dashboard only |
| FSB-6 | Collapsed state | — | Only icons, no labels |
| FSB-7 | Expanded state | — | Icons + labels visible |
| FSB-8 | Version display | — | Version string shown next to "Nemo" |

#### TopBar

| ID | Test Case | Expected |
|----|-----------|----------|
| FTB-1 | Shows title with version | "Nemo 0.9.0+26050316" visible |
| FTB-2 | Shows mode badge when mode="dev" | Amber badge visible |
| FTB-3 | Hides mode badge when mode="prod" | No badge |
| FTB-4 | Shows company badge for company user | Blue badge with company name |
| FTB-5 | Shows Global badge for admin without company | Purple "Global" badge |

#### ProjectDetailPage — Tab Visibility

| ID | Role | Expected Visible Tabs |
|----|------|-----------------------|
| FPT-1 | EXECUTIVE | Summary, Board, RAID, Docs |
| FPT-2 | MANAGER | Summary, Issues, Board, RAID, Docs, Phases, Members, Settings |
| FPT-3 | CONTRIBUTOR | Issues, Board, Docs |
| FPT-4 | EXTERNAL | Issues, Board |

#### Admin Users Tab — Sorting

| ID | Test Case | Expected |
|----|-----------|----------|
| FAU-1 | Global users listed first | Global group appears before any company group |
| FAU-2 | Companies sorted by order field | Companies appear in order: NTO, HRM, MTM, MER |
| FAU-3 | Externals listed last | Externals group appears after all companies |
| FAU-4 | Users sorted by role priority | Within each group: EXECUTIVE → MANAGER → CONTRIBUTOR |

---

## 7. Manual E2E Test Checklist

### 7.1 Authentication Flows

| ID | Flow | Steps | Pass Criteria |
|----|------|-------|---------------|
| E2E-1 | Normal login | 1. Load login page 2. Verify captcha appears 3. Enter correct answer 4. Enter credentials 5. Submit | Logged in, redirected to dashboard |
| E2E-2 | Login with wrong captcha | 1. Enter wrong captcha answer 2. Submit | Error shown, new captcha generated |
| E2E-3 | Dev/demo mode login | 1. Start with nemo.mode=dev or demo 2. Verify no captcha shown 3. Enter any password 4. Submit | Logged in, mode badge visible |
| E2E-4 | Session persistence | 1. Login 2. Close tab 3. Reopen app | Still logged in |
| E2E-5 | Session expiry | 1. Login 2. Wait for session timeout 3. Navigate | Redirected to login page |
| E2E-6 | Logout | 1. Login 2. Click logout | Redirected to login page |
| E2E-7 | Tab re-validation | 1. Login 2. Switch browser tabs 3. Switch back | Session re-checked, still authenticated |

### 7.2 CRUD Flows

| ID | Flow | Steps | Pass Criteria |
|----|------|-------|---------------|
| E2E-8 | Create project | 1. Click create 2. Fill name, key, program, manager 3. Submit | Project created, board columns auto-generated |
| E2E-9 | Create issue | 1. Go to project Issues tab 2. Click create 3. Fill title, priority, type 4. Submit | Issue created with auto-generated key |
| E2E-10 | Drag issue on board | 1. Go to Board tab 2. Drag issue from "To Do" to "In Progress" | Issue status updated, stays in new column on refresh |
| E2E-11 | Create RAID item | 1. Go to RAID tab 2. Click Risk 3. Fill title, probability, impact 4. Submit | RAID item created, risk score computed |
| E2E-12 | Log time | 1. Go to My Time 2. Click + on a day 3. Select issue, enter hours 4. Save | Time log appears in weekly grid, total hours updated |
| E2E-13 | Create wiki page | 1. Go to Docs tab 2. Click + 3. Enter title/content with markdown 4. Save | Page appears in tree, markdown rendered correctly |
| E2E-14 | Mermaid diagram | 1. Create wiki page with mermaid code block 2. Save | Diagram rendered visually |
| E2E-15 | Toggle favorite | 1. Go to Projects list 2. Click star on project | Star filled, project appears in favorites |

### 7.3 Role-Based Access

| ID | Flow | Steps | Pass Criteria |
|----|------|-------|---------------|
| E2E-16 | ADMIN sees Admin menu | Login as admin | Admin menu item visible in sidebar |
| E2E-17 | CONTRIBUTOR no Admin menu | Login as contributor | No Admin menu item |
| E2E-18 | CONTRIBUTOR limited project tabs | Login as contributor, open project | Only Issues, Board, Docs tabs visible |
| E2E-19 | EXECUTIVE sees PMO | Login as executive | PMO menu item visible |
| E2E-20 | EXTERNAL limited access | Login as external user | Only Dashboard visible, limited issue access |

### 7.4 Multi-Tenancy

| ID | Flow | Steps | Pass Criteria |
|----|------|-------|---------------|
| E2E-21 | Company user sees own projects | Login as company user | Only company + global projects visible |
| E2E-22 | Global user sees all | Login as admin | All projects across companies visible |
| E2E-23 | Admin Users tab grouping | Login as admin, go to Users tab | Global first, then companies by order, then externals |

### 7.5 Edge Cases and Error Handling

| ID | Flow | Steps | Pass Criteria |
|----|------|-------|---------------|
| E2E-24 | Duplicate key | 1. Create project with existing key | Error message displayed |
| E2E-25 | Invalid form data | 1. Submit form with blank required fields | Validation errors shown inline |
| E2E-26 | Network error | 1. Stop backend 2. Try to navigate | Error handled gracefully |
| E2E-27 | Large file upload | 1. Upload > 10MB attachment | Rejected with clear error |
| E2E-28 | Concurrent edits | 1. Two users edit same issue 2. Both save | Last write wins, no crash |
| E2E-29 | Deleted entity reference | 1. Open issue detail 2. Delete project in another tab 3. Navigate back | 404 or redirect handled gracefully |
| E2E-30 | Browser back button | 1. Navigate through several pages 2. Press back | Correct page shown |

---

## 8. Test Execution Strategy

### 8.1 CI Pipeline Integration

```
┌─────────────┐   ┌──────────────────┐   ┌───────────────┐   ┌──────────────┐
│  git push   │──▶│  Backend Tests   │──▶│ Frontend Tests│──▶│ Newman Tests │
│             │   │  ./gradlew test │   │  npm test     │   │  newman run  │
└─────────────┘   └──────────────────┘   └───────────────┘   └──────────────┘
                         │                      │                    │
                    Unit + Integration     Unit + Component     API Contract
                    JUnit 5 + MockMvc      Vitest + RTL         Postman
```

### 8.2 Priority Order for Implementation

| Priority | Area | Effort | Impact |
|----------|------|--------|--------|
| P0 | Auth integration tests (AUTH-1 to AUTH-13, DM-1 to DM-4) | 2 days | Catches login/captcha/session bugs |
| P0 | RBAC integration tests (USR-1 to USR-3, ISS-4 to ISS-5, RAID-4) | 2 days | Catches authorization regressions |
| P1 | CaptchaService unit tests (CS-1 to CS-8) | 0.5 day | Catches captcha logic bugs |
| P1 | AuthHelper unit tests (AH-1 to AH-17) | 1 day | Catches access control logic bugs |
| P1 | Validation integration tests (USR-8 to USR-11, ERR-3 to ERR-4) | 1 day | Catches input validation gaps |
| P1 | Frontend store tests (FS-1 to FS-8) | 1 day | Catches state management bugs |
| P1 | Frontend guard tests (FG-1 to FG-8) | 0.5 day | Catches routing/auth bugs |
| P2 | Service layer unit tests (PS-1 to AA-1) | 2 days | Catches business logic bugs |
| P2 | Mapper unit tests | 1 day | Catches DTO mapping errors |
| P2 | LoginPage component tests (FL-1 to FL-9) | 1 day | Catches captcha/mode UI bugs |
| P2 | Sidebar component tests (FSB-1 to FSB-8) | 0.5 day | Catches role-based nav bugs |
| P3 | All remaining integration tests | 3 days | Full endpoint coverage |
| P3 | Newman collection extensions | 1 day | API contract coverage |
| P3 | Manual E2E checklist | 1 day | Human verification |

### 8.3 Coverage Targets

| Layer | Target Coverage |
|-------|----------------|
| Backend services | 80% line coverage |
| Backend controllers | 90% endpoint coverage (all methods + auth variations) |
| Frontend stores | 100% action coverage |
| Frontend components | 80% for pages, 100% for guards and common components |
| API contract | 100% endpoint coverage via Newman |

---

## 9. Test Data Strategy

### 9.1 Backend Test Data

Use the existing `DataSeeder` for integration tests that need a populated database. For isolated unit tests, create minimal test data inline:

- **ADMIN user**: username `testadmin`, password `password123`, no company
- **MANAGER user**: username `testmanager`, password `password123`, company=NTO
- **CONTRIBUTOR user**: username `testcontrib`, password `password123`, company=NTO
- **EXTERNAL user**: username `testexternal`, password `password123`, assigned to a test project

### 9.2 Frontend Test Data

Mock API responses using consistent fixture objects:

```typescript
const mockAdminUser: UserDto = {
  id: 1, username: 'admin', email: 'admin@test.com',
  firstName: 'Admin', lastName: 'User', role: 'ADMIN',
  companyId: null, companyName: null,
  assignedProjectId: null, assignedProjectName: null,
  avatarUrl: null, active: true,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z'
};
```

---

## 10. Test Maintenance

- **Run tests on every commit** via CI pipeline (GitHub Actions or similar)
- **Fix broken tests immediately** — never merge with failing tests
- **Update tests when API contracts change** — keep Newman collection and unit tests in sync
- **Review test coverage** weekly — identify untested code paths
- **Prune flaky tests** — if a test fails intermittently, fix or remove it