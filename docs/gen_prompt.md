# Nemo — Super Prompt for Step-by-Step Generation

> This prompt is designed to recreate the Nemo project management application from scratch. Follow the steps in order. Each step builds on the previous one. Run the backend (`./gradlew :backend:bootRun`) and frontend (`npm run dev`) frequently to verify progress.

---

## 1. Project Overview

**Nemo** is a multi-company project management platform with issue tracking, time tracking, PMO capabilities (RAID logs, EVM), sprint management, Kanban boards, wiki documentation, and role-based access control.

The application is a monorepo with a Spring Boot backend and a React + TypeScript frontend. In production, the React build is bundled into the Spring Boot JAR and served from the same port. In development, the Vite dev server proxies API requests to the backend.

---

## 2. Tech Stack

### Backend
- **Spring Boot 3.4.5** on Java 21
- **Spring Security** — session-based auth (JSESSIONID cookie, not JWT)
- **Spring Data JPA / Hibernate** — H2 for dev, PostgreSQL for prod
- **MapStruct 1.6.3** — entity-to-DTO mapping
- **Lombok** — boilerplate reduction (bound to MapStruct via lombok-mapstruct-binding)
- **Spring WebSocket + STOMP** — real-time updates (backend configured; frontend not yet wired)
- **Spring Validation** — request validation with Hibernate Validator
- **Gradle** — build tool, version 0.9.0

### Frontend
- **React 19** + TypeScript 6
- **Zustand 5** — state management
- **React Router 7** — client-side routing with guard components
- **Tailwind CSS v4** — utility-first styling, configured via CSS `@theme` block (no tailwind.config.ts)
- **Axios** — HTTP client with 401 interceptor for session expiry
- **react-markdown + remark-gfm + rehype-raw** — Markdown rendering
- **mermaid** — Mermaid diagram rendering inside Markdown
- **Vite 8** — build tool with `@` path alias and API proxy

---

## 3. Project Structure

```
nemo/
├── backend/
│   ├── src/main/java/com/nemo/
│   │   ├── config/            # SecurityConfig, WebSocketConfig, DataSeeder, IssueConfig, OrganizationConfig
│   │   ├── security/          # AuthController, CaptchaService, CustomUserDetails, CustomUserDetailsService, AuthHelper
│   │   ├── common/            # DTOs (ApiResponse, PaginatedResponse, ErrorResponse, ValidationError)
│   │   │                       # Exceptions (EntityNotFound, Forbidden, BadRequest, DuplicateKey)
│   │   │                       # Audit (@Audited annotation, AuditAspect, AuditLog entity/controller)
│   │   │                       # Storage (StorageService interface, FilesystemStorageService)
│   │   ├── company/           # Company CRUD
│   │   ├── user/              # User CRUD + password change
│   │   ├── program/           # Program CRUD
│   │   ├── project/           # Project, members, favorites, labels, board config
│   │   ├── issue/             # Issues, comments, attachments
│   │   ├── sprint/            # Sprints, backlog
│   │   ├── phase/             # Phases, deliverables
│   │   ├── timetracking/      # Time logs, timesheets, reports, user rates
│   │   ├── documentation/     # Wiki pages (tree structure, search)
│   │   ├── pmo/               # RAID items, EVM metrics, portfolio summary
│   │   └── attachment/        # File uploads
│   └── src/main/resources/
│       ├── application.yml        # H2 dev config, nemo.devmode/version/build
│       ├── application-prod.yml   # PostgreSQL config, devmode forced false
│       └── data.sql               # Seed issue types and statuses
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client + per-domain API modules
│   │   ├── components/
│   │   │   ├── common/        # Modal, Field, Spinner, LoadingScreen, MarkdownRenderer
│   │   │   ├── guards/        # AuthGuard, GuestGuard, AdminGuard, RoleGuard
│   │   │   └── layout/       # AppLayout, Sidebar, TopBar
│   │   ├── hooks/             # useAuth, useMyIssues, useVersion
│   │   ├── pages/             # All page components organized by feature
│   │   ├── stores/            # Zustand stores (authStore, uiStore)
│   │   ├── types/             # TypeScript interfaces and types
│   │   └── utils/             # format.ts (getInitials, etc.)
│   ├── index.css              # Tailwind v4 @theme configuration
│   └── vite.config.ts         # @ alias, API proxy
└── docs/                      # Design documents
```

---

## 4. Step-by-Step Generation Guide

### Step 1: Project Skeleton and Configuration

Create the monorepo structure with Gradle multi-project build.

**Backend `settings.gradle`:**
```groovy
rootProject.name = 'nemo'
include 'backend'
```

**Backend `build.gradle`** — Spring Boot 3.4.5, Java 21, dependencies: spring-boot-starter-web, data-jpa, security, validation, websocket, H2 runtime, PostgreSQL runtime, MapStruct 1.6.3, Lombok. Generate a build timestamp in `yyMMddHH` format and pass it as `-Dnemo.build=<timestamp>` JVM arg to bootRun.

**Backend `application.yml`:**
```yaml
nemo:
  devmode: false
  version: 0.9.0
  build: ''
spring:
  application.name: nemo
  datasource.url: jdbc:h2:file:./data/nemo-db
  datasource.driver-class-name: org.h2.Driver
  datasource.username: sa
  datasource.password: ''
  jpa.hibernate.ddl-auto: update
  jpa.show-sql: false
  jpa.defer-datasource-initialization: true
  jpa.properties.hibernate.format_sql: true
  h2.console.enabled: true
  h2.console.path: /h2-console
  servlet.multipart.max-file-size: 10MB
  servlet.multipart.max-request-size: 10MB
  sql.init.mode: always
server.port: 8080
storage.filesystem.base-path: ./data/attachments
logging.level.com.nemo: DEBUG
```

**Backend `application-prod.yml`:**
```yaml
nemo:
  devmode: false
spring:
  datasource.url: ${NEMO_DB_URL}
  datasource.driver-class-name: org.postgresql.Driver
  datasource.username: ${NEMO_DB_USERNAME}
  datasource.password: ${NEMO_DB_PASSWORD}
  jpa.hibernate.ddl-auto: validate
  jpa.properties.hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect
  h2.console.enabled: false
  sql.init.mode: never
```

**Frontend:** Initialize with Vite + React + TypeScript. Install: react-router-dom, zustand, axios, tailwindcss v4, @tailwindcss/vite, @tailwindcss/typography, react-markdown, remark-gfm, rehype-raw, mermaid. Configure `vite.config.ts` with `@` alias and proxy `/api` and `/ws` to `http://localhost:8080`.

**Tailwind v4 in `src/index.css`:**
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-primary-50: #eef2ff;
  --color-primary-100: #e0e7ff;
  --color-primary-200: #c7d2fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #6366f1;
  --color-primary-600: #4f46e5;
  --color-primary-700: #4338ca;
  --color-primary-800: #3730a3;
  --color-primary-900: #312e81;
  --color-surface: #f8fafc;
  --color-surface-dark: #1e293b;
  --color-sidebar: #0f172a;
  --color-sidebar-hover: #1e293b;
  --font-sans: Inter, system-ui, -apple-system, sans-serif;
}
```

### Step 2: Common Infrastructure

**Package: `com.nemo.common.dto`**

- `ApiResponse<T>` — wrapper with `data` and `timestamp` fields. Static factory `ApiResponse.of(data)`.
- `PaginatedResponse<T>` — extends ApiResponse, adds `pagination` with page, size, totalElements, totalPages.
- `ErrorResponse` — status, error, message, timestamp.
- `ValidationError` — status=422, error, message, list of FieldError(field, message), timestamp.

**Package: `com.nemo.common.exception`**

- `EntityNotFoundException` — 404
- `ForbiddenException` — 403
- `BadRequestException` — 400
- `DuplicateKeyException` — 409
- `GlobalExceptionHandler` (@RestControllerAdvice) — maps each exception to its HTTP status, handles MethodArgumentNotValidException as 422 with field errors.

**Package: `com.nemo.common.storage`**

- `StorageService` interface — store(MultipartFile, String subdir), load(String filename, String subdir), delete(String filename, String subdir). Returns paths/streams.
- `FilesystemStorageService` — stores to `./data/attachments`, UUID-prefixed filenames, path traversal protection, configurable base-path from `storage.filesystem.base-path`.

### Step 3: Entities and Database Schema

**IMPORTANT: Reserved word handling.** The following column names use a trailing underscore `_` suffix because they conflict with SQL reserved words: `key` → `key_`, `order` → `order_`, `role` → `role_`, `type` → `type_`, `action` → `action_`. Table names `user` → `app_user`, `comment` → `issue_comment`. All relationships use `FetchType.LAZY`.

Create these entities in order (each in its own package under `com.nemo`):

1. **Company** — `@Table(name = "company")`, fields: id, name (unique), key (`@Column(name = "key_")`, unique, length=10), description (TEXT), address (length=500), website (length=500), logo (length=500), order (`@Column(name = "order_")`), active (default true), timestamps. `@UniqueConstraint(columnNames = {"key_"})`.

2. **OrganizationConfig** — `@Table(name = "organization_config")`, fields: id, name, address, website, logo, timestamps. `@ManyToOne Company` (LAZY, `@JsonIgnore`).

3. **User** — `@Table(name = "app_user")`, fields: username (unique, not blank), email (unique, not blank), passwordHash (`@Column(name = "password_hash")`), firstName (`@Column(name = "first_name")`), lastName (`@Column(name = "last_name")`), role (`@Column(name = "role_")`), avatarUrl, active (default true), timestamps. `@ManyToOne Company` (LAZY), `@ManyToOne Project` as assignedProject (LAZY). Role enum: ADMIN, MANAGER, CONTRIBUTOR, EXECUTIVE, EXTERNAL.

4. **IssueType** — id, name. No timestamps.

5. **IssueStatus** — id, name, category (enum: TODO, IN_PROGRESS, DONE, CLOSED), isDefault (`@Column(name = "is_default")`). No timestamps.

6. **Program** — id, name, key (`@Column(name = "key_")`, unique), description (TEXT), timestamps. `@ManyToOne User` as manager (LAZY), `@ManyToOne Company` (LAZY).

7. **Project** — id, name, key (`@Column(name = "key_")`, unique), description (TEXT), stage (enum: INITIATION, PLANNING, EXECUTION, CLOSING), strategicScore, plannedValue (BigDecimal 12,2), budget (BigDecimal 12,2), budgetSpent (BigDecimal 12,2), targetStartDate, targetEndDate, timestamps. `@ManyToOne Program`, `@ManyToOne User` as manager, `@ManyToOne Company`. Many-to-Many members via ProjectMember, Many-to-Many favorites via ProjectFavorite.

8. **Issue** — id, title, description (TEXT), issueKey (unique), priority (enum: CRITICAL, HIGH, MEDIUM, LOW), position (default 0), external (Boolean, default false), timestamps. `@ManyToOne IssueStatus`, `@ManyToOne IssueType`, `@ManyToOne Project`, `@ManyToOne User` as assignee, `@ManyToOne User` as reporter, `@ManyToOne Sprint`. Many-to-Many Label via join table `issue_label`.

9. **Comment** — `@Table(name = "issue_comment")`, fields: id, content (TEXT, not null), timestamps. `@ManyToOne Issue`, `@ManyToOne User` as author.

10. **Sprint** — id, name, goal (TEXT), status (enum: PLANNING, ACTIVE, CLOSED), startDate, endDate, timestamps. `@ManyToOne Project`.

11. **Phase** — id, name, description (TEXT), position (default 0), startDate, endDate, timestamps. `@ManyToOne Project`.

12. **Deliverable** — id, name, description (TEXT), state (enum: DRAFT, DELIVERED, VALIDATED), dueDate, timestamps. `@ManyToOne Phase`.

13. **RaidItem** — id, type (`@Column(name = "type_")`), title, description (TEXT), status (enum: OPEN, MITIGATING, RESOLVED, CLOSED), probability (Integer), impact (Integer), mitigationPlan (TEXT), dependsOnProjectId, dueDate, timestamps. `@ManyToOne Project`, `@ManyToOne User` as owner. Computed `getRiskScore()` returns probability * impact (or 0).

14. **TimeLog** — id, hours (BigDecimal 5,2), logDate, description (TEXT), timestamps. `@ManyToOne Issue`, `@ManyToOne User`.

15. **UserRate** — id, hourlyRate (BigDecimal 10,2), effectiveFrom, timestamps. `@ManyToOne User`.

16. **WikiPage** — id, title, content (TEXT), slug, position (default 0), timestamps. `@ManyToOne Project`, `@ManyToOne WikiPage` as parent (self-referencing), `@ManyToOne User` as author. Many-to-Many Issue via `wiki_page_issue_link`. `@UniqueConstraint(columnNames = {"project_id", "slug"})`.

17. **Label** — id, name, color. `@ManyToOne Project`. `@UniqueConstraint(columnNames = {"project_id", "name"})`.

18. **BoardColumn** — id, position. `@ManyToOne Project`, `@ManyToOne IssueStatus` as status. `@UniqueConstraint(columnNames = {"project_id", "status_id"})`.

19. **ProjectMember** — id, timestamps. `@ManyToOne Project`, `@ManyToOne User`. `@UniqueConstraint(columnNames = {"project_id", "user_id"})`.

20. **ProjectFavorite** — id. `@ManyToOne User`, `@ManyToOne Project`. `@UniqueConstraint(columnNames = {"user_id", "project_id"})`.

21. **Attachment** — id, fileName, filePath, contentType, fileSize (long), uploadedBy (Long), timestamps. `@ManyToOne Issue`.

22. **AuditLog** — `@Table(name = "audit_log")`, fields: id, entityType (`@Column(name = "entity_type")`), entityId (`@Column(name = "entity_id")`), action (`@Column(name = "action_")`), oldValue (TEXT), newValue (TEXT), performedBy, createdAt (no @CreationTimestamp, set manually).

### Step 4: MapStruct Mappers and DTOs

For each entity, create:

- A **DTO record** with all fields needed by the API (including related entity names/IDs, not navigation objects). Include inner records for CreateRequest and UpdateRequest.
- A **MapStruct mapper** (componentModel = "spring") that maps between Entity and DTO. Handle relationship fields with `@Mapping` expressions (e.g., `company.getId() → companyId`, `user.getFirstName() + " " + user.getLastName() → userName`). Fields that require service-layer computation (like `projectCount`, `favorite`, `deliverableCount`) should be `@Mapping(ignore = true)` and set in the service or controller.

Key DTO patterns:
- `UserDto` includes `companyId`, `companyName`, `assignedProjectId`, `assignedProjectName`
- `ProjectDto` includes `programId`, `programName`, `managerId`, `managerName`, `companyId`, `companyName`, `favorite` (set per-request based on current user)
- `IssueDto` includes `statusId`, `statusName`, `typeId`, `typeName`, `projectKey`, `assigneeName`, `reporterName`, `labelIds`, `labelNames`
- `RaidItemDto` includes `riskScore` (computed), `ownerName`, `projectName`

### Step 5: Repositories

Create Spring Data JPA Repository interfaces for each entity. Key custom queries:

- `UserRepository`: `findByUsername`, `findByCompanyId`, `findByRole`, `countByCompanyId`
- `ProjectRepository`: `findByCompanyIdIn` (for visibility filtering)
- `IssueRepository`: `findByProjectId`, `findByProjectIdAndAssigneeId`, `findByProjectIdAndStatusId`, `findByProjectIdAndPriority`, `findBySprintId`
- `TimeLogRepository`: `findByUserIdAndLogDateBetween`, `findByIssueId`, `findByIssueProjectIdAndLogDateBetween`
- `WikiPageRepository`: `findByProjectIdAndParentIdIsNull` (root pages), `findByProjectIdAndParentId` (children), `findByProjectIdAndSlug`
- `AuditLogRepository`: `findByEntityType`, `findByPerformedBy`, `findByEntityId`, `findByCreatedAtBetween`

### Step 6: Security

**SecurityConfig** — CSRF disabled, CORS disabled, session management IF_REQUIRED, permitAll for `/api/auth/login`, `/api/auth/logout`, `/api/auth/captcha`, `/api/organization/public`, `/h2-console/**`, `/ws/**`. All other requests require authentication. Form login and HTTP Basic disabled. Logout at `/api/auth/logout` with session invalidation and JSESSIONID cookie deletion. PasswordEncoder bean returns BCryptPasswordEncoder. Headers frameOptions sameOrigin (for H2 console).

**CustomUserDetails** extends Spring Security's `User` class. Adds `userId` (Long) and `companyId` (Long). `isGlobal()` returns true when companyId is null.

**CustomUserDetailsService** implements `UserDetailsService`. Loads by username, throws `UsernameNotFoundException` if inactive. Grants authority `ROLE_<roleName>`. Extracts companyId from user.getCompany().

**AuthHelper** — utility component with methods:
- `getCurrentUserId()` — from SecurityContext
- `getCurrentCompanyId()` — from SecurityContext
- `isGlobalUser()` — companyId == null
- `hasAnyRole(String... roles)` — checks authorities
- `canAccessProject(Project)` — ADMIN always yes; project with null company = global (accessible to all); otherwise company match or project membership
- `requireProjectReadAccess(projectId)` — checks access, throws ForbiddenException if denied
- `requireProjectMemberOrAdminManager(projectId)` — checks membership or ADMIN/MANAGER role
- `canAccessUser(targetUser)` — ADMIN always yes; global user can see all; otherwise company match
- `requireSelfOrAdmin(userId)` — only ADMIN or same userId

**AuthController** — `POST /api/auth/login` with `LoginRequest(username, password, captcha)`. If devMode (injected via `@Value("${nemo.devmode:false}")`), bypass password check and authenticate by username only. If NOT devMode, verify captcha answer from session first, then authenticate via AuthenticationManager. `GET /api/auth/captcha` generates a math challenge stored in session. `POST /api/auth/logout` clears SecurityContext. `GET /api/auth/me` returns current user DTO.

**CaptchaService** — generates random math challenges (operands 1-20, operators +/−/×), stores answer in HTTP session under key `CAPTCHA_ANSWER`, verifies and clears after use (single-use).

### Step 7: Services

Create a Service class for each entity module. Key service patterns:

- **Authorization checks**: Use `AuthHelper` for role and access checks at the service level.
- **Audit**: Use `@Audited(entityType = "Issue", action = "CREATE")` annotation on create/update/delete methods for Issue and TimeLog.
- **Company visibility**: ADMIN sees all; other users see entities within their company or global entities (company=null).
- **External user restrictions**: EXTERNAL role users can only see issues where `external=true`, limited to their assigned project.

Key service behaviors:
- **ProjectService.createProject**: Auto-generates board columns from default issue statuses, adds the manager as a project member.
- **IssueService.createIssue**: Auto-generates issueKey as `{project.key}-{sequence}`, sets reporter to current user, defaults position to max+1.
- **PmoService.getEvmMetrics**: Computes PV, EV, AC, CV, SV, CPI, SPI from issues, time logs, and user rates.
- **TimeLogService**: Users can only create logs for themselves (unless ADMIN/MANAGER), can edit their own logs or ADMIN/MANAGER can edit any.
- **WikiPageService**: Tree structure via parentId, slug generation from title, position management for reordering.

### Step 8: Controllers

Create REST controllers for each module. All controllers return DTOs wrapped in `ApiResponse<T>` (or `PaginatedResponse<T>` for lists). Use `@PreAuthorize` for role-based access and `AuthHelper` for fine-grained access control.

**Key endpoint patterns:**

| Module | Base Path | Key Access Rules |
|--------|-----------|------------------|
| Auth | `/api/auth` | login/logout/captcha: permitAll; me: authenticated |
| Users | `/api/users` | ADMIN for all; self for GET/PUT own profile |
| Companies | `/api/companies` | ADMIN only |
| Programs | `/api/programs` | Read: authenticated; Write: ADMIN/MANAGER; Delete: ADMIN |
| Projects | `/api/projects` | Read: filtered by role; Write: ADMIN/MANAGER |
| Issues | `/api/projects/{id}/issues` | Read: project member; Write: project member or ADMIN/MANAGER; EXTERNAL: own external issues only |
| Sprints | `/api/projects/{id}/sprints` | Read: project member; Write: ADMIN/MANAGER |
| Time Logs | `/api/time-logs` | Create: authenticated (self); Read: own or ADMIN/MANAGER/EXECUTIVE |
| Timesheets | `/api/timesheets` | ADMIN/MANAGER/EXECUTIVE |
| RAID | `/api/projects/{id}/raid` | Read: ADMIN/MANAGER/EXECUTIVE; Write: ADMIN/MANAGER |
| PMO | `/api/pmo` | ADMIN/MANAGER/EXECUTIVE |
| Wiki | `/api/projects/{id}/wiki` | Read: project member; Write: project member or ADMIN/MANAGER |
| Organization | `/api/organization` | Public: permitAll; Read: authenticated; Write: ADMIN |
| Issue Types/Statuses | `/api/issue-types`, `/api/issue-statuses` | Read: authenticated; Write: ADMIN |
| Audit Logs | `/api/audit-logs` | ADMIN only |

### Step 9: Data Seeder and SQL Init

**DataSeeder** — `@Component @Order(1) CommandLineRunner`. Only runs if `userRepository.count() > 1` (skips if already populated).

Seed data:
- **Companies**: Netopia (NTO, order 1), Harmony (HRM, order 2), MyTeam (MTM, order 3), medERP (MER, order 4)
- **OrganizationConfig**: "Netopia Group" (global, company=null), address "Av Annakhil, Rabat"
- **Users** (all passwords: `password123`): admin (ADMIN, global), majid (MANAGER, Netopia), ismail (CONTRIBUTOR, Netopia), hanane (CONTRIBUTOR, Netopia), wadii (EXECUTIVE, Harmony), ahmed (CONTRIBUTOR, Harmony), karima (MANAGER, Harmony), salim (EXECUTIVE, global), bassamat (EXTERNAL, assigned to project), younes (CONTRIBUTOR, medERP)
- **UserRates**: rates $55-90/hr, effective 2025-01-01
- **Programs**: eHealth (EH), Mobile Platform (MOB), Global Initiative (GI), medERP (MER)
- **Projects** (8 total): with budgets, PV, stage, dates, members, favorites, board columns
- **Issues** (20+): with statuses, types, priorities, assignees, labels, positions, sprint assignments
- **Sprints**, **RAID items**, **Time Logs**, **Wiki pages**

**data.sql** — seeds Issue Types (Project Management, Tech Lead, Architecture, Development, Data Analysis, Testing) and Issue Statuses (To Do/TODO, In Progress/IN_PROGRESS, Done/DONE, Closed/CLOSED) using H2 MERGE INTO for idempotency.

### Step 10: Frontend — Foundation

**Types** (`src/types/`): Define all TypeScript interfaces matching the backend DTOs. Key types: `UserDto`, `UserRole`, `LoginRequest` (username, password, optional captcha), `ProjectDto`, `IssueDto`, `CompanyDto`, `ProgramDto`, `OrganizationConfig`, `PublicConfigResponse` (organization, devmode, version, build), `ApiResponse<T>`, `PaginatedResponse<T>`, plus all Create/Update request types.

**API Client** (`src/api/client.ts`): Axios instance with `baseURL: '/api'`, `withCredentials: true`. 401 interceptor calls `useAuthStore.getState().sessionExpired()`. Helper functions: `apiGet<T>`, `apiGetPaginated<T>`, `apiPost<T>`, `apiPut<T>`, `apiDelete`, `extractValidationErrors`.

**API Modules** (`src/api/`): One file per domain — auth, users, projects, issues, programs, companies, pmo, timeLogs, phases, sprints, wiki, organization, userRates, admin. Each exports typed async functions that call the client helpers.

**Zustand Stores**:
- `authStore`: user, isLoading, error, isAuthenticated, login(username, password, captcha?), logout(), checkSession(), clearError(), sessionExpired(), updateUser(partial)
- `uiStore`: sidebarCollapsed, toggleSidebar()

**Hooks**:
- `useAuth`: Thin wrapper around authStore selectors
- `useVersion`: Fetches `getPublicOrganization()` once, caches version (version+build) and devmode flag in module-level variables
- `useMyIssues`: Fetches all projects and issues for the current user

### Step 11: Frontend — Layout and Navigation

**AppLayout**: Flex layout with Sidebar + main area. Uses `useVersion()` to get version and devmode, passes to TopBar as `title={`Nemo ${version}`}` and `devmode={devmode}`.

**Sidebar**: Dark sidebar (`bg-sidebar`), collapsible (w-16 collapsed, w-60 expanded). Role-based navigation:
- ADMIN: Dashboard, Admin, Programs
- MANAGER: Dashboard, Projects, Programs, My Time, Timesheets, Reports, PMO
- EXECUTIVE: Dashboard, Programs, Reports, PMO
- CONTRIBUTOR: Dashboard, Projects, My Time
- EXTERNAL: Dashboard only

Shows user avatar (initials), name, role, profile link, logout button. "Nemo" logo + version number in header.

**TopBar**: Hamburger toggle, title with version, DevMode badge (amber, pulsing dot), user info on right (company badge or "Global" for admins, name, avatar).

### Step 12: Frontend — Guards and Routing

**Guard Components**:
- `AuthGuard`: Redirects to `/login` if not authenticated. Shows LoadingScreen while checking.
- `GuestGuard`: Redirects to `/` if already authenticated (for login page).
- `AdminGuard`: Redirects to `/` if role !== 'ADMIN'.
- `RoleGuard`: Takes `roles` array prop, redirects to `/` if role not in list.

**Route Structure** (`App.tsx`):
- `/login` → LoginPage (GuestGuard)
- All authenticated routes inside AuthGuard + AppLayout:
  - `/` → DashboardPage
  - `/admin` → AdminPage (AdminGuard)
  - `/programs` → ProgramsPage (RoleGuard: ADMIN, MANAGER, EXECUTIVE)
  - `/programs/:id` → ProgramDetailPage (RoleGuard)
  - `/projects` → ProjectsPage (not ADMIN)
  - `/projects/:id` → ProjectDetailPage
  - `/projects/:projectId/issues/:issueId` → IssueDetailPage
  - `/my-time` → MyTimePage (not EXTERNAL)
  - `/timesheets` → TimesheetsPage (ADMIN, MANAGER)
  - `/reports` → TimeReportsPage (ADMIN, MANAGER, EXECUTIVE)
  - `/pmo` → PmoDashboardPage (ADMIN, MANAGER, EXECUTIVE)
  - `/profile` → ProfilePage
  - `*` → redirect to `/`

Session check on mount + re-check on browser `visibilitychange` (tab focus).

### Step 13: Frontend — Login Page

Split layout: left branded panel (org logo, name, feature list), right form panel.

- Fetches `getPublicOrganization()` on mount to get org config, devmode flag, version, build
- If NOT devMode: fetches captcha via `getCaptcha()`, shows math question + answer input between password and submit button
- If devMode: hides captcha, shows amber hint "DevMode active — any password is accepted"
- After failed login: re-fetches captcha
- Header shows "Nemo" + version (e.g., `v0.9.0+26050315`) + DevMode badge if applicable
- Footer shows org name, address, website

### Step 14: Frontend — Dashboard

Stat cards (assigned issues, in-progress, to-do, projects count), "My Issues" table, "My Projects" cards grid with favorites toggle.

### Step 15: Frontend — Admin Page

Three tabs: Companies, Users, Settings.

- **CompaniesTab**: Org config card with logo/address/website edit, company cards grid with CRUD
- **UsersTab**: Grouped by company tabs (Global first, then companies by order, then Externals). Within each group, users sorted by role priority (ADMIN → EXECUTIVE → MANAGER → CONTRIBUTOR). Active/inactive toggle, create/edit modals, expandable hourly rates per user
- **SettingsTab**: Renamed from "Issues" tab. Issue types CRUD, Issue statuses CRUD with name, category (TODO/IN_PROGRESS/DONE/CLOSED), default flag

### Step 16: Frontend — Projects and Project Detail

**ProjectsPage**: Grid of project cards with favorites toggle, create project modal (with program, manager, company, PMO details, members selection).

**ProjectDetailPage**: Tabbed view. Role-based tab visibility:
- EXECUTIVE: Summary, Board, RAID, Docs
- MANAGER: Summary, Issues, Board, RAID, Docs, Phases, Members, Settings
- CONTRIBUTOR: Issues, Board, Docs
- EXTERNAL: Issues, Board

Tabs:
- **SummaryTab**: EVM card, phases overview with deliverables, members list
- **IssuesTab**: Issue table with search/status/priority filters, create issue modal
- **BoardTab**: Kanban board with HTML5 drag-and-drop, status columns from board config, optimistic updates
- **RaidTab**: RAID log with type filters (Risks, Assumptions, Issues, Dependencies), inline create/edit, probability × impact scoring
- **PhasesTab**: Phase CRUD with expandable deliverables, state progression (DRAFT → DELIVERED → VALIDATED)
- **MembersTab**: Member listing, add members modal, remove members (cannot remove manager)
- **SettingsTab**: Project settings form + labels management section
- **DocsTab** (inline, not a separate component file): Wiki page tree, create/edit wiki pages, Markdown rendering with Mermaid diagram support, wiki search

### Step 17: Frontend — Time Tracking Pages

- **MyTimePage**: Weekly time grid (7-day cards), week navigation, time log form with issue search, edit/delete logs, total hours display
- **TimesheetsPage**: Admin/manager view rendering TimesheetTab — user selector, week navigation, weekly grid, expandable daily detail, delete entries

### Step 18: Frontend — Reports and PMO

- **TimeReportsPage**: Six sections (overview, aging, velocity, workload, time, trends) with project selector
- **PmoDashboardPage**: Portfolio KPIs (total projects, budget, open risks, completion %), project stage distribution, EVM table per project, top risks table

### Step 19: Frontend — Profile Page

Personal info edit form (first/last name, email), password change form (current password, new password).

### Step 20: Frontend — Common Components

- **Modal**: Overlay with title, close button, backdrop click, max-w-lg
- **Field**: Reusable form field wrapper (label + input/textarea), supports error state, required, maxLength, minLength
- **Spinner**: SVG spinner with className prop for sizing
- **LoadingScreen**: Full-screen centered spinner
- **MarkdownRenderer**: Renders markdown using react-markdown + remark-gfm + rehype-raw. Supports Mermaid diagrams via `mermaid.render()`. Uses `@tailwindcss/typography` prose classes.

---

## 5. Key Design Decisions

1. **Session-based auth, not JWT** — simpler, more secure for server-rendered SPA, Spring Security handles it natively
2. **Package-by-feature** — each domain module groups its own Controller/Service/Repository/Entity/DTO/Mapper
3. **DTO boundary enforcement** — entities never leak through the API; MapStruct handles conversion
4. **Multi-tenancy via nullable company_id** — global entities (company=null) visible to all; company-scoped entities visible only to matching users
5. **Soft deletes for users/companies** — `active` flag instead of hard delete, preserving referential integrity
6. **Audit via AOP** — `@Audited` annotation captures who/what/action/values
7. **Reserved word escaping** — explicit `@Column(name = "xxx_")` for key, order, role, type, action; table overrides for user→app_user, comment→issue_comment
8. **DevMode** — activated by `--nemo.devmode=true` flag, bypasses password and captcha on login
9. **Math captcha on login** — simple arithmetic challenge stored in HTTP session, single-use, skipped in DevMode
10. **Version + build timestamp** — `nemo.version` from application.yml, `nemo.build` from JVM system property generated at build time, displayed as `v0.9.0+26050315`
11. **Role-based frontend navigation** — Sidebar items and project detail tabs change based on user role
12. **Role-based project detail tabs** — different tabs visible per role (ADMIN, MANAGER, EXECUTIVE, CONTRIBUTOR, EXTERNAL)
13. **Admin Users tab sorting** — Global users first, then companies by order, then externals. Within each group, sorted by role priority (EXECUTIVE → MANAGER → CONTRIBUTOR)

---

## 6. Verification Checklist

After generating the full application, verify:

1. **Backend compiles**: `./gradlew :backend:compileJava` succeeds
2. **Backend starts**: `./gradlew :backend:bootRun` starts on port 8080
3. **Frontend compiles**: `npx tsc --noEmit` succeeds
4. **Frontend starts**: `npm run dev` starts on port 5173
5. **Login works**: Login with `admin`/`password123` succeeds
6. **DevMode works**: Login with `--nemo.devmode=true`, any password accepted, captcha skipped
7. **Captcha works**: Normal mode shows captcha, wrong answer rejected, correct answer allows login
8. **RBAC works**: ADMIN sees Admin tab, MANAGER sees all project tabs, EXTERNAL sees limited tabs
9. **CRUD works**: Create/update/delete for projects, issues, sprints, RAID items, wiki pages
10. **Kanban board**: Drag-and-drop between status columns
11. **Time tracking**: My Time page shows weekly grid, timesheets page shows all users
12. **Wiki**: Create/edit pages, Markdown rendering, Mermaid diagrams
13. **EVM/PMO**: Dashboard shows portfolio KPIs and EVM metrics
14. **Audit trail**: `@Audited` methods produce entries in audit log
15. **Database portability**: Reserved-word columns use underscore suffix, tables use overridden names