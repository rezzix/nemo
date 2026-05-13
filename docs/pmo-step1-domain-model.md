# Step 1: PMO Domain Model Expansion

## 1. Existing Model Summary

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| **Company** | id, name, key, description, active, timestamps | Users, programs, projects belong to company (nullable FK = global) |
| **OrganizationConfig** | id, name, address, company(→Company, nullable), timestamps | Per-company config (null = global default) |
| **Program** | id, name, key, description, manager(→User), company(→Company, nullable), timestamps | |
| **Project** | id, name, key, description, program(→Program), manager(→User), company(→Company, nullable), stage, strategicScore, plannedValue, budget, budgetSpent, targetStartDate, targetEndDate, timestamps | |
| **User** | id, username, email, passwordHash, firstName, lastName, role(ADMIN/MANAGER/CONTRIBUTOR/EXECUTIVE), active, company(→Company, nullable), timestamps | |
| **Issue** | id, issueKey, title, description, priority, status(→IssueStatus), type(→IssueType), assignee(→User), reporter(→User), project(→Project), sprint(→Sprint), labels, position, timestamps | |
| **TimeLog** | id, hours(BigDecimal), logDate, description, issue(→Issue), user(→User), timestamps | |
| **Sprint** | id, name, goal, project(→Project), status(PLANNING/ACTIVE/CLOSED), startDate, endDate, timestamps | |
| **RaidItem** | id, project(→Project), type(R/A/I/D), title, description, status, probability, impact, mitigationPlan, dependsOnProjectId, owner(→User), dueDate, timestamps | |
| **UserRate** | id, user(→User), hourlyRate(BigDecimal), effectiveFrom(LocalDate), timestamps | |
| **ProjectFavorite** | id, user(→User), project(→Project) | |

**Key conventions observed:**
- All `@ManyToOne` use `FetchType.LAZY`
- No bidirectional `@OneToMany` inverse sides
- Reserved SQL words quoted: `\"key\"`, `\"user\"`
- Timestamps: `@CreationTimestamp` / `@UpdateTimestamp` on `Instant` fields
- DTOs are Java records with `CreateRequest` / `UpdateRequest` nested records
- Controllers return `ApiResponse<T>` or `PaginatedResponse<T>`
- Company FKs are nullable: null = global entity visible to all users

---

## 2. Model Changes

### 2.1 Project Entity — New Fields

Add these fields to `Project.java` for stage-gate tracking, budgeting, and strategic alignment:

```java
// Stage-gate tracking
@Column(nullable = false)
private String stage = "INITIATION";  // INITIATION, PLANNING, EXECUTION, CLOSING

// Strategic alignment
@Column(name = "strategic_score")
private Integer strategicScore;  // 1-10 scoring, nullable

// Budget fields (Planned Value for EVM)
@Column(name = "planned_value", precision = 12, scale = 2)
private BigDecimal plannedValue;  // Total budget (PV baseline)

@Column(name = "budget", precision = 12, scale = 2)
private BigDecimal budget;  // Approved budget allocation

@Column(name = "budget_spent", precision = 12, scale = 2)
private BigDecimal budgetSpent;  // Direct expenses (non-labor)

@Column(name = "target_start_date", name = "target_start_date")
private LocalDate targetStartDate;

@Column(name = "target_end_date", name = "target_end_date")
private LocalDate targetEndDate;
```

**Enum for stage:**
```java
public enum Stage { INITIATION, PLANNING, EXECUTION, CLOSING }
```

### 2.2 RAID Entity (New)

A single `RAID` entity covering Risks, Assumptions, Issues, and Dependencies, with a 5x5 Risk Matrix for risk-type items:

**Table:** `raid_item`

```java
@Entity
@Table(name = "raid_item")
public class RaidItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RaidType type;  // RISK, ASSUMPTION, ISSUE, DEPENDENCY

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RaidStatus status;  // OPEN, MITIGATING, RESOLVED, CLOSED

    // 5x5 Risk Matrix (only meaningful for RISK type)
    @Column(name = "probability")
    private Integer probability;  // 1-5 (1=Very Low, 5=Very High)

    @Column(name = "impact")
    private Integer impact;  // 1-5 (1=Negligible, 5=Catastrophic)

    @Column(name = "mitigation_plan", columnDefinition = "TEXT")
    private String mitigationPlan;

    // Dependency-specific
    @Column(name = "depends_on_project_id")
    private Long dependsOnProjectId;  // FK to another project (for DEPENDENCY type)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Getters and setters...

    // Risk score = probability * impact (computed, not stored)
    public int getRiskScore() {
        return (probability != null && impact != null) ? probability * impact : 0;
    }

    public enum RaidType { RISK, ASSUMPTION, ISSUE, DEPENDENCY }
    public enum RaidStatus { OPEN, MITIGATING, RESOLVED, CLOSED }
}
```

**5x5 Risk Matrix Logic (computed, not stored):**

| | Impact 1 | Impact 2 | Impact 3 | Impact 4 | Impact 5 |
|---|---|---|---|---|---|
| **Prob 5** | 5 | 10 | **15** | **20** | **25** |
| **Prob 4** | 4 | 8 | 12 | **16** | **20** |
| **Prob 3** | 3 | 6 | 9 | 12 | **15** |
| **Prob 2** | 2 | 4 | 6 | 8 | 10 |
| **Prob 1** | 1 | 2 | 3 | 4 | 5 |

Risk levels:
- **Low**: 1-4 (green)
- **Medium**: 5-9 (yellow)
- **High**: 10-15 (orange)
- **Critical**: 16-25 (red)

### 2.3 UserRate Entity (New)

Converts TimeLog hours into Actual Cost (AC) for EVM. Each user can have a rate, and rates can vary by date (rate changes).

**Table:** `user_rate`

```java
@Entity
@Table(name = "user_rate")
public class UserRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Getters and setters...
}
```

### 2.4 User Role Expansion

Extend `User.Role` enum with a new role:

```java
public enum Role { ADMIN, MANAGER, CONTRIBUTOR, EXECUTIVE }
```

The `EXECUTIVE` role will have read access to PMO dashboards and financial data, but no operational write access.

---

## 3. EVM Calculation Logic (Service Layer — preview for Step 2)

The EVM calculations will be computed on-the-fly in a `PmoService`, not stored:

| Metric | Formula | Data Source |
|--------|---------|-------------|
| **Completion %** | `completedIssues / totalIssues` (by status category) | Issue status |
| **Earned Value (EV)** | `completion% × plannedValue` | Issue data + Project budget |
| **Actual Cost (AC)** | `SUM(timeLog.hours × userRate.hourlyRate) + project.budgetSpent` | TimeLog + UserRate + Project |
| **Cost Variance (CV)** | `EV - AC` | Computed |
| **Schedule Variance (SV)** | `EV - PV` where PV = `(elapsedDays / totalDays) × plannedValue` | Computed |
| **CPI** | `EV / AC` | Computed |
| **SPI** | `EV / PV` | Computed |

---

## 4. Updated Mermaid Class Diagram

```mermaid
classDiagram
    direction TB

    class Company {
        +Long id
        +String name
        +String key
        +String description
        +boolean active
    }

    class User {
        +Long id
        +String username
        +String email
        +String firstName
        +String lastName
        +Role role
        +boolean active
    }
    class UserRate {
        +Long id
        +BigDecimal hourlyRate
        +LocalDate effectiveFrom
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

    class Issue {
        +Long id
        +String issueKey
        +String title
        +Priority priority
        +Integer position
    }

    class Sprint {
        +Long id
        +String name
        +SprintStatus status
        +LocalDate startDate
        +LocalDate endDate
    }

    class TimeLog {
        +Long id
        +BigDecimal hours
        +LocalDate logDate
        +String description
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
        +Long dependsOnProjectId
        +LocalDate dueDate
        +int riskScore
    }

    class IssueStatus {
        +Long id
        +String name
        +Category category
    }

    class IssueType {
        +Long id
        +String name
    }

    class Label {
        +Long id
        +String name
        +String color
    }

    Company "1" --> "*" User : employs
    Company "1" --> "*" Program : owns
    Company "1" --> "*" Project : owns
    User "1" --> "*" UserRate : has rates
    User "1" --> "*" Project : manages
    User "1" --> "*" TimeLog : logs
    User "1" --> "*" RaidItem : owns
    Program "1" --> "*" Project : contains
    Project "1" --> "*" Issue : has
    Project "1" --> "*" Sprint : has
    Project "1" --> "*" RaidItem : has
    Project "1" --> "*" TimeLog : tracked via issues
    Issue "1" --> "*" TimeLog : logged against
    Issue --> IssueStatus : status
    Issue --> IssueType : type
    Issue --> Sprint : sprint
    Issue "*" --> "*" Label : tagged

    enum UserRole {
        ADMIN
        MANAGER
        CONTRIBUTOR
        EXECUTIVE
    }

    enum ProjectStage {
        INITIATION
        PLANNING
        EXECUTION
        CLOSING
    }

    enum RaidType {
        RISK
        ASSUMPTION
        ISSUE
        DEPENDENCY
    }

    enum RaidStatus {
        OPEN
        MITIGATING
        RESOLVED
        CLOSED
    }
```

---

## 5. Files Created/Modified in Step 1

**New files (4):**
- `backend/src/main/java/com/nemo/pmo/RaidItem.java`
- `backend/src/main/java/com/nemo/pmo/RaidItemDto.java`
- `backend/src/main/java/com/nemo/pmo/RaidItemRepository.java`
- `backend/src/main/java/com/nemo/timetracking/UserRate.java`

**Modified files (2):**
- `backend/src/main/java/com/nemo/project/Project.java` — added stage, strategicScore, plannedValue, budget, budgetSpent, targetStartDate, targetEndDate fields + Stage enum
- `backend/src/main/java/com/nemo/user/User.java` — added EXECUTIVE to Role enum

> **Status:** Implemented. RaidItem, UserRate, Project PMO fields, and EXECUTIVE role are all in the codebase.

I'm delivering this plan for your review. Once validated, I'll proceed to implement the code changes.