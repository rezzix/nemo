---
type: System
resource: docs/uml-diagrams.md
---

# UML diagrams

Structural and behavioral diagrams for Nemo, compiled from the legacy `docs/uml-diagrams.md`. All diagrams use [Mermaid](https://mermaid.js.org/) syntax. Per-entity field tables and ER diagrams live as `module-entities.md` under each module group; this page holds the cross-module class diagram and the use-case/state/sequence/component views.

## 1. Domain model (class diagram)

Core entities and their relationships.

```mermaid
classDiagram
    direction LR

    class Company {
        +Long id
        +String name
        +String key
        +String description
        +boolean active
    }

    class OrganizationConfig {
        +Long id
        +String name
        +String address
    }

    class User {
        +Long id
        +String username
        +String email
        +String passwordHash
        +String firstName
        +String lastName
        +Role role
        +String avatarUrl
        +boolean active
    }

    class Program {
        +Long id
        +String name
        +String key
        +String description
    }

    class Project {
        +Long id
        +String name
        +String key
        +String description
        +Stage stage
        +Integer strategicScore
        +BigDecimal plannedValue
        +BigDecimal budget
        +BigDecimal budgetSpent
        +LocalDate targetStartDate
        +LocalDate targetEndDate
    }

    class ProjectMember {
        +Long id
    }

    class Task {
        +Long id
        +String title
        +String description
        +String taskKey
        +Priority priority
        +int position
    }

    class TaskStatus {
        +Long id
        +String name
        +Category category
        +boolean isDefault
    }

    class TaskType {
        +Long id
        +String name
    }

    class Label {
        +Long id
        +String name
        +String color
    }

    class Comment {
        +Long id
        +String content
    }

    class Attachment {
        +Long id
        +String fileName
        +String filePath
        +String contentType
        +long fileSize
    }

    class Sprint {
        +Long id
        +String name
        +String goal
        +SprintStatus status
        +LocalDate startDate
        +LocalDate endDate
    }

    class BoardColumn {
        +Long id
        +int position
    }

    class TimeLog {
        +Long id
        +BigDecimal hours
        +LocalDate logDate
        +String description
    }

    class WikiPage {
        +Long id
        +String title
        +String content
        +String slug
        +int position
    }

    class AuditLog {
        +Long id
        +String entityType
        +Long entityId
        +Action action
        +String oldValue
        +String newValue
    }

    class RaidItem {
        +Long id
        +RaidType type
        +String title
        +String description
        +RaidStatus status
        +Integer probability
        +Integer impact
        +String mitigationPlan
        +LocalDate dueDate
    }

    class UserRate {
        +Long id
        +BigDecimal hourlyRate
        +LocalDate effectiveFrom
    }

    class ProjectFavorite {
        +Long id
    }

    class Phase {
        +Long id
        +String name
        +int position
        +BigDecimal plannedAmount
        +LocalDate startDate
        +LocalDate endDate
    }

    class Deliverable {
        +Long id
        +String name
        +DeliverableState state
    }

    class PhasePayment {
        +Long id
        +BigDecimal amount
        +LocalDate paymentDate
        +boolean paid
    }

    class Client {
        +Long id
        +String name
        +String industry
        +String website
    }

    class ClientContact {
        +Long id
        +String name
        +String email
        +String phone
        +String role
    }

    class PreSale {
        +Long id
        +String title
        +PreSaleStatus status
    }

    class LeaveRequest {
        +Long id
        +LocalDate startDate
        +LocalDate endDate
        +LeaveType leaveType
        +LeaveStatus status
    }

    class Asset {
        +Long id
        +String name
        +String serialNumber
    }

    class Location {
        +Long id
        +String name
        +String address
    }

    Company "1" --> "*" User : employs
    Company "1" --> "*" Program : owns
    Company "1" --> "*" Project : owns
    Company "1" --> "0..1" OrganizationConfig : configures
    OrganizationConfig "1" --> "*" TaskType : defines
    OrganizationConfig "1" --> "*" TaskStatus : defines
    User "1" --> "*" Program : manages
    User "1" --> "*" Project : manages
    User "1" --> "*" Task : reports
    User "1" --> "*" Task : assigned to
    User "1" --> "*" TimeLog : logs
    User "1" --> "*" Comment : writes
    User "1" --> "*" WikiPage : authors
    User "1" --> "*" Attachment : uploads
    User "1" --> "*" UserRate : has rates
    User "1" --> "*" RaidItem : owns
    User "*" --> "*" Project : member of
    User "*" --> "*" Project : favorite of
    Program "1" --> "*" Project : contains
    Project "1" --> "*" Task : contains
    Project "1" --> "*" Label : defines
    Project "1" --> "*" Sprint : has
    Project "1" --> "*" BoardColumn : configures
    Project "1" --> "*" WikiPage : contains
    Project "1" --> "*" RaidItem : has
    Project "1" --> "*" Phase : has
    Project "1" --> "0..1" Client : for
    Task --> TaskStatus : has
    Task --> TaskType : has
    Task --> Sprint : belongs to
    Task "*" --> "*" Label : tagged with
    Task "1" --> "*" Comment : has
    Task "1" --> "*" Attachment : has
    Task "1" --> "*" TimeLog : tracked by
    WikiPage "1" --> "*" WikiPage : parent of
    WikiPage "*" --> "*" Task : linked to
    Phase "1" --> "*" Deliverable : has
    Phase "1" --> "*" PhasePayment : has
    Client "1" --> "*" ClientContact : has
    Client "1" --> "*" PreSale : for
    User "1" --> "*" LeaveRequest : requests
    Location "1" --> "*" Asset : contains
```

Field-level detail per group: [identity](/modules/identity/module-entities.md), [cross-cutting](/modules/cross-cutting/module-entities.md), [delivery](/modules/delivery/module-entities.md), [commercial](/modules/commercial/module-entities.md), [finance](/modules/finance/module-entities.md), [hr](/modules/hr/module-entities.md), [timetracking](/modules/timetracking/module-entities.md), [content](/modules/content/module-entities.md).

## 2. Use case diagrams

### 2.1 Admin

```mermaid
flowchart LR
    subgraph Admin
        direction TB
        A1[Manage users<br/>CRUD / deactivate]
        A2[Manage companies<br/>CRUD / delete]
        A3[Manage organization<br/>config & branding]
        A4[Manage task types<br/>& statuses]
        A5[View audit &<br/>activity logs]
        A6[Manage user rates<br/>& billing]
        A7[Delete projects,<br/>tasks, sprints]
        A8[All Manager &<br/>Contributor actions]
    end
```

### 2.2 Manager

```mermaid
flowchart LR
    subgraph Manager
        direction TB
        M1[Create & edit projects]
        M2[Assign members<br/>to projects]
        M3[Create & edit tasks]
        M4[Manage sprints<br/>& backlog]
        M5[Configure Kanban<br/>board columns]
        M6[View team<br/>timesheets]
        M7[Manage wiki pages<br/>& notes]
        M8[Manage RAID items]
        M9[View PMO &<br/>portfolio data]
        M10[Manage phases,<br/>deliverables & payments]
        M11[Approve / reject<br/>leave requests]
        M12[Manage clients<br/>& contacts]
        M13[Manage pre-sales]
        M14[Manage programs]
        M15[Manage project<br/>instructions & labels]
        M16[Log time &<br/>edit own time logs]
        M17[Delete tasks &<br/>comments]
    end
```

### 2.3 Executive

```mermaid
flowchart LR
    subgraph Executive
        direction TB
        E1[View company projects<br/>& programs]
        E2[View portfolio KPIs,<br/>EVM & budget]
        E3[Read Kanban boards]
        E4[View reports &<br/>timesheets]
        E5[View & edit RAID items]
        E6[View & manage<br/>project instructions]
        E7[View & edit<br/>clients & pre-sales]
        E8[Create & cancel<br/>leave requests]
    end
```

### 2.4 HR

```mermaid
flowchart LR
    subgraph HR
        direction TB
        H1[View people<br/>directory]
        H2[View user<br/>detail pages]
        H3[Approve / reject<br/>leave requests]
        H4[Manage public<br/>holidays]
        H5[View & assign<br/>assets]
        H6[View reports<br/>& timesheets]
        H7[Manage companies<br/>CRUD]
        H8[Create & cancel<br/>leave requests]
    end
```

### 2.5 Contributor

```mermaid
flowchart LR
    subgraph Contributor
        direction TB
        C1[Create & edit<br/>assigned tasks]
        C2[Log time on<br/>assigned tasks]
        C3[View own timesheet<br/>& time logs]
        C4[Add comments<br/>on tasks]
        C5[Edit wiki pages]
        C6[Upload attachments]
        C7[Move tasks on<br/>Kanban board]
        C8[Create & cancel<br/>leave requests]
    end
```

### 2.6 External user

```mermaid
flowchart LR
    subgraph External
        direction TB
        X1[View assigned<br/>project only]
        X2[View & edit<br/>external tasks only]
        X3[Add comments on<br/>external tasks]
        X4[View project wiki]
        X5[Create & cancel<br/>leave requests]
    end
```

### 2.7 Common (all authenticated roles)

```mermaid
flowchart LR
    subgraph AllRoles
        direction TB
        S1[Login / Logout]
        S2[View Kanban board]
        S3[Search & filter tasks]
        S4[View project documentation]
        S5[Edit own profile]
        S6[Toggle project<br/>favorites]
    end
```

Role meanings and the full access matrix: [authorization (RBAC)](/security/authorization-rbac.md), [features and access](/security/features-and-access.md).

## 3. Task lifecycle (state diagram)

How a task moves through statuses.

```mermaid
stateDiagram-v2
    direction LR

    [*] --> ToDo : Task created

    ToDo --> InProgress : Assign & start
    InProgress --> ToDo : Reopen / send back

    InProgress --> Review : Submit for review
    Review --> InProgress : Changes requested

    InProgress --> Done : Mark complete
    Review --> Done : Approve

    ToDo --> Done : Quick close
    Done --> Closed : Close permanently
    Done --> InProgress : Reopen

    state ToDo {
        [*] --> Backlog
        Backlog --> SprintAssigned : Added to sprint
        SprintAssigned --> Backlog : Removed from sprint
    }

    note right of Review : Optional status\nadded by admin
    note right of Done : Only status in\nDONE category
```

See the [task module](/modules/delivery/task-module.md).

## 4. Authentication flow (sequence diagram)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant SecurityFilter
    participant AuthController
    participant CustomUserDetailsService
    participant SessionManager

    User->>Browser: Enter credentials
    Browser->>AuthController: POST /api/auth/login {username, password}
    AuthController->>CustomUserDetailsService: authenticate(username, password)
    CustomUserDetailsService->>CustomUserDetailsService: Load user + companyId
    alt Invalid credentials
        CustomUserDetailsService-->>AuthController: throw AuthenticationException
        AuthController-->>Browser: 401 Unauthorized
        Browser-->>User: Show error message
    else Valid credentials
        CustomUserDetailsService-->>AuthController: CustomUserDetails (userId, companyId, authorities)
        AuthController->>SessionManager: createSession(user)
        SessionManager-->>AuthController: JSESSIONID cookie
        AuthController-->>Browser: 200 OK + user DTO (with companyId, companyName) + Set-Cookie
        Browser-->>User: Redirect to dashboard
    end

    Note over Browser,SecurityFilter: Subsequent requests

    Browser->>SecurityFilter: GET /api/projects/1/tasks (with JSESSIONID)
    SecurityFilter->>SessionManager: validateSession(JSESSIONID)
    SessionManager-->>SecurityFilter: CustomUserDetails (with companyId)
    SecurityFilter->>SecurityFilter: Check role + company visibility
    SecurityFilter-->>AuthController: Authorized request
    AuthController-->>Browser: 200 OK + data
```

See [authentication](/security/authentication.md).

## 5. Kanban real-time update (sequence diagram)

How WebSocket keeps boards in sync across clients.

```mermaid
sequenceDiagram
    actor UserA
    actor UserB
    participant Server
    participant DB

    Note over UserA,UserB: Both viewing Kanban for Project X

    UserA->>Server: Drag task NEMO-42 from "To Do" to "In Progress"
    Server->>DB: UPDATE task SET status_id=? WHERE id=42
    DB-->>Server: OK
    Server->>Server: Publish to /topic/kanban/{projectId}
    Server-->>UserA: STOMP message: {taskId:42, newStatus:"IN_PROGRESS"}
    Server-->>UserB: STOMP message: {taskId:42, newStatus:"IN_PROGRESS"}
    UserB->>UserB: Board updates instantly

    UserB->>Server: Drag task NEMO-15 from "In Progress" to "Done"
    Server->>DB: UPDATE task SET status_id=? WHERE id=15
    DB-->>Server: OK
    Server->>Server: Publish to /topic/kanban/{projectId}
    Server-->>UserA: STOMP message: {taskId:15, newStatus:"DONE"}
    Server-->>UserB: STOMP message: {taskId:15, newStatus:"DONE"}
    UserA->>UserA: Board updates instantly
```

See [WebSockets](/implementation/cross-cutting/websockets.md).

## 6. Backend package structure (component diagram)

```mermaid
flowchart TB
    subgraph nemo-backend
        direction TB

        subgraph common
            STORAGE[StorageService<br/>FilesystemStorage]
            AUDIT[Audited<br/>annotation]
            EXC[GlobalExceptionHandler]
            DTO[DTOs & Mappers]
        end

        subgraph config
            SECURITY[SecurityConfig]
            WEBSOCKET[WebSocketConfig]
            CORS[CORS Config]
            SEEDER[DataSeeder]
            TASK_CFG[TaskConfigController<br/>TaskStatus / TaskType]
        end

        subgraph security
            AUTH_FILTER[AuthFilter]
            CUSTOM_DETAILS[CustomUserDetails]
            AUTH_HELPER[AuthHelper<br/>company visibility]
        end

        subgraph company
            CC[CompanyController]
            CS[CompanyService]
            CR[CompanyRepository]
        end

        subgraph user
            UC[UserController]
            US[UserService]
            UR[UserRepository]
        end

        subgraph program
            PC[ProgramController]
            PS[ProgramService]
            PR[ProgramRepository]
        end

        subgraph project
            PJC[ProjectController]
            PJS[ProjectService]
            PJR[ProjectRepository]
        end

        subgraph task
            TC[TaskController]
            TS[TaskService]
            TR[TaskRepository]
        end

        subgraph sprint
            SC[SprintController]
            SS[SprintService]
            SR[SprintRepository]
        end

        subgraph timetracking
            TLC[TimeLogController]
            TLS[TimeLogService]
            TLR[TimeLogRepository]
        end

        subgraph documentation
            WC[WikiPageController]
            WS[WikiPageService]
            WR[WikiPageRepository]
        end

        subgraph pmo
            RC[RaidItemController]
            RS[RaidItemService]
            RR[RaidItemRepository]
        end

        subgraph attachment
            AC[AttachmentController]
            AS[AttachmentService]
            AR[AttachmentRepository]
        end

        subgraph client
            CLC[ClientController]
            CLS[ClientService]
            CLR[ClientRepository]
        end

        subgraph presale
            PSC[PreSaleController]
            PSS[PreSaleService]
            PSR[PreSaleRepository]
        end

        subgraph phase
            PHC[PhaseController]
            PHS[PhaseService]
            PHR[PhaseRepository]
        end

        subgraph leave
            LC[LeaveRequestController]
            LS[LeaveRequestService]
            LR[LeaveRequestRepository]
        end

        subgraph asset
            ALC[AssetController]
            ALS[AssetService]
            ALR[AssetRepository]
            LOCLC[LocationController]
            LOCS[LocationService]
        end
    end

    STORAGE -.-> AS
    AUDIT -.-> TS
    AUDIT -.-> TLS
    EXC -.-> TC & TLC & WC
    AUTH_HELPER -.-> PJS & PS & US
```

See the [modules index](/modules/index.md) and [monorepo structure](/overview/monorepo-structure.md).

## 7. Time tracking flow (sequence diagram)

```mermaid
sequenceDiagram
    actor Contributor
    participant API
    participant TimeLogService
    participant TaskService
    participant DB

    Contributor->>API: POST /api/time-logs<br/>{taskId: 42, hours: 3.5, date: "2026-04-24", description: "Fixed login bug"}
    API->>API: Validate input
    API->>TimeLogService: createTimeLog(userId, dto)
    TimeLogService->>TaskService: verifyTaskAccessible(userId, 42)
    TaskService-->>TimeLogService: Task found & user has access
    TimeLogService->>DB: INSERT time_log
    DB-->>TimeLogService: Saved
    TimeLogService-->>API: TimeLogDTO
    API-->>Contributor: 201 Created

    Note over Contributor,DB: Reporting

    Contributor->>API: GET /api/time-logs/weekly?userId=1&weekStart=2026-04-20
    API->>TimeLogService: getWeeklyTimesheet(userId, weekStart)
    TimeLogService->>DB: SELECT time_logs WHERE user_id=? AND log_date BETWEEN ? AND ?
    DB-->>TimeLogService: List of time logs
    TimeLogService-->>API: WeeklyTimesheetDTO
    API-->>Contributor: 200 OK + timesheet data
```

See the [time tracking module](/modules/timetracking/index.md).

## 8. Role-based access overview

Summary of which roles can access which modules.

```mermaid
flowchart TB
    subgraph Roles
        ADMIN[ADMIN]
        MANAGER[MANAGER]
        EXECUTIVE[EXECUTIVE]
        HR[HR]
        CONTRIBUTOR[CONTRIBUTOR]
        EXTERNAL[EXTERNAL]
    end

    subgraph Modules
        direction TB
        AUTH[Authentication]
        DASH[Dashboards]
        PROJ[Projects & Tasks]
        SPRINT[Sprints]
        PHASE[Phases & Payments]
        RAID[RAID Items]
        PMO[PMO / Portfolio]
        CLIENTS[Clients]
        PRESALE[Pre-Sales]
        PROGS[Programs]
        PEOPLE[People]
        TIME[Time Tracking]
        TSHEETS[Timesheets]
        REPORTS[Reports]
        LEAVE[Leave]
        HOLIDAYS[Holidays]
        ASSETS[Assets]
        WIKI[Wiki Pages]
        ADMIN_CFG[Admin Config]
    end

    ADMIN --> AUTH & DASH & PROJ & SPRINT & PHASE & RAID & PMO & CLIENTS & PRESALE & PROGS & PEOPLE & TIME & TSHEETS & REPORTS & LEAVE & HOLIDAYS & ASSETS & WIKI & ADMIN_CFG
    MANAGER --> AUTH & DASH & PROJ & SPRINT & PHASE & RAID & PMO & CLIENTS & PRESALE & PROGS & PEOPLE & TIME & TSHEETS & REPORTS & LEAVE & WIKI
    EXECUTIVE --> AUTH & DASH & PROJ & RAID & PMO & CLIENTS & PRESALE & TIME & REPORTS & LEAVE & WIKI
    HR --> AUTH & DASH & PROJ & PEOPLE & TSHEETS & REPORTS & LEAVE & HOLIDAYS & ASSETS & CLIENTS & PRESALE & WIKI
    CONTRIBUTOR --> AUTH & DASH & PROJ & TIME & LEAVE & WIKI
    EXTERNAL --> AUTH & DASH & PROJ & LEAVE & WIKI
```

See [features and access](/security/features-and-access.md) for the detailed matrix.

## Cross-references

- [System architecture](/implementation/architecture/system-architecture.md) — the integrated structural view these diagrams illustrate.
- [Database schema](/overview/database-schema.md) — schema overview and naming conventions.
- [Security index](/security/index.md) — authentication, RBAC, multi-tenancy.
- [Modules index](/modules/index.md) — the domain packages in the component diagram.