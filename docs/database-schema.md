# Nemo — Database Schema Design

## Entity-Relationship Diagram (Textual)

```
Company ──1:N──► User (nullable — null = global user)
        ──1:N──► Program (nullable — null = global program)
        ──1:N──► Project (nullable — null = global project)
        ──1:N──► OrganizationConfig (nullable — null = global config)

OrganizationConfig (per-company + global fallback)
       │
       ├──1:N──► IssueType
       ├──1:N──► IssueStatus
       │
User ──1:N──► Program (as manager)
  │    1:N──► Project (as manager)
  │    1:N──► Issue (as assignee/reporter)
  │    1:N──► TimeLog
  │    1:N──► Comment
  │    1:N──► WikiPage (as author)
  │    1:N──► Attachment (as uploader)
  │    1:N──► UserRate
  │    1:N──► RaidItem (as owner)
  │    M:N──► Project (as member, via ProjectMember)
  │    M:N──► Project (as favorite, via ProjectFavorite)
  │
Program ──1:N──► Project
Project ──1:N──► Issue
         1:N──► Label
         1:N──► Sprint
         1:N──► BoardColumn
         1:N──► WikiPage
         1:N──► RaidItem
         M:N──► User (via ProjectMember)
Issue ──1:N──► Comment
      ──1:N──► Attachment
      ──1:N──► TimeLog
      ──1:N──► WikiPageIssueLink
      ──M:N──► Label (via IssueLabel)
      ──N:1──► Sprint (nullable)
WikiPage ──1:N──► WikiPage (self-referencing parent)
```

---

## Tables

### 1. company

Organizations (tenants) within the system. Users, projects, and programs can belong to a company or be "global" (company_id = null).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(255) | NOT NULL, UNIQUE | Company name |
| key | VARCHAR(10) | NOT NULL, UNIQUE | Short identifier (e.g. "ACME") |
| description | TEXT | | |
| active | BOOLEAN | NOT NULL, default true | Soft-disable instead of delete |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_company_key`

---

### 2. organization_config

Per-company settings (plus one global row where company_id = null). Managed by admin.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(255) | NOT NULL | Organization name |
| address | TEXT | | Organization address |
| company_id | BIGINT | FK → company(id), nullable | null = global config |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

---

### 3. user

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| username | VARCHAR(100) | NOT NULL, UNIQUE | Login identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | |
| password_hash | VARCHAR(255) | NOT NULL | BCrypt hash |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| role | VARCHAR(20) | NOT NULL, CHECK IN ('ADMIN','MANAGER','CONTRIBUTOR','EXECUTIVE') | |
| avatar_url | VARCHAR(500) | | Optional profile picture path |
| active | BOOLEAN | NOT NULL, default true | Soft-disable instead of delete |
| company_id | BIGINT | FK → company(id), nullable | null = global user |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_user_username`, `idx_user_email`, `idx_user_role`, `idx_user_company`

---

### 4. program

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(255) | NOT NULL | |
| key | VARCHAR(10) | NOT NULL, UNIQUE | Short identifier (e.g. "PROG1") |
| description | TEXT | | |
| manager_id | BIGINT | FK → user(id), NOT NULL | Program manager |
| company_id | BIGINT | FK → company(id), nullable | null = global program |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_program_key`, `idx_program_manager`, `idx_program_company`

---

### 5. project

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(255) | NOT NULL | |
| key | VARCHAR(10) | NOT NULL, UNIQUE | Short identifier (e.g. "NEMO") |
| description | TEXT | | |
| program_id | BIGINT | FK → program(id), NOT NULL | Parent program |
| manager_id | BIGINT | FK → user(id), NOT NULL | Project manager |
| company_id | BIGINT | FK → company(id), nullable | null = global project |
| stage | VARCHAR(20) | NOT NULL, default 'INITIATION', CHECK IN ('INITIATION','PLANNING','EXECUTION','CLOSING') | Stage-gate lifecycle |
| strategic_score | INTEGER | | 1-10 strategic alignment score |
| planned_value | DECIMAL(12,2) | | Total budget (PV baseline for EVM) |
| budget | DECIMAL(12,2) | | Approved budget allocation |
| budget_spent | DECIMAL(12,2) | | Direct non-labor expenses |
| target_start_date | DATE | | Planned start |
| target_end_date | DATE | | Planned end |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_project_key`, `idx_project_program`, `idx_project_manager`, `idx_project_company`

---

### 6. project_member

Join table for project ↔ user membership.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| project_id | BIGINT | FK → project(id), NOT NULL | |
| user_id | BIGINT | FK → user(id), NOT NULL | |
| created_at | TIMESTAMP | NOT NULL, default now() | |

**Unique constraint:** `(project_id, user_id)`

**Indexes:** `idx_project_member_user`, `idx_project_member_project`

---

### 7. issue_type

Organization-level issue types, managed by admin.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(100) | NOT NULL | e.g. "Development", "Testing" |

Default seed data: Project Management, Tech Lead, Architecture, Development, Data Analysis, Testing

---

### 8. issue_status

Organization-level statuses, managed by admin.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(100) | NOT NULL | e.g. "To Do", "In Progress" |
| category | VARCHAR(20) | NOT NULL, CHECK IN ('TODO','IN_PROGRESS','DONE') | Groups statuses for board columns |
| is_default | BOOLEAN | NOT NULL, default false | The default status for new issues |

Default seed data: To Do (TODO), In Progress (IN_PROGRESS), Done (DONE)

---

### 9. label

Per-project labels for issue tagging.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(100) | NOT NULL | |
| color | VARCHAR(7) | NOT NULL | Hex color (e.g. "#FF5733") |
| project_id | BIGINT | FK → project(id), NOT NULL | |

**Unique constraint:** `(project_id, name)`

---

### 10. issue

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| title | VARCHAR(500) | NOT NULL | |
| description | TEXT | | Rich text (Markdown) |
| issue_key | VARCHAR(20) | NOT NULL, UNIQUE | Display key (e.g. "NEMO-42") |
| status_id | BIGINT | FK → issue_status(id), NOT NULL | |
| priority | VARCHAR(20) | NOT NULL, CHECK IN ('CRITICAL','HIGH','MEDIUM','LOW') | |
| type_id | BIGINT | FK → issue_type(id), NOT NULL | |
| project_id | BIGINT | FK → project(id), NOT NULL | |
| assignee_id | BIGINT | FK → user(id), nullable | Currently assigned user |
| reporter_id | BIGINT | FK → user(id), NOT NULL | Who created the issue |
| sprint_id | BIGINT | FK → sprint(id), nullable | null = in backlog |
| position | INTEGER | NOT NULL, default 0 | Ordering within backlog or sprint |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_issue_project`, `idx_issue_assignee`, `idx_issue_sprint`, `idx_issue_status`, `idx_issue_key`, `idx_issue_position`

---

### 11. issue_label

Join table for issue ↔ label (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| issue_id | BIGINT | FK → issue(id), NOT NULL | |
| label_id | BIGINT | FK → label(id), NOT NULL | |

**Primary key:** `(issue_id, label_id)`

---

### 12. comment

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| content | TEXT | NOT NULL | Rich text (Markdown) |
| issue_id | BIGINT | FK → issue(id), NOT NULL | |
| author_id | BIGINT | FK → user(id), NOT NULL | |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_comment_issue`

---

### 13. attachment

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| file_name | VARCHAR(500) | NOT NULL | Original filename |
| file_path | VARCHAR(1000) | NOT NULL | Storage path (filesystem or S3 key) |
| content_type | VARCHAR(100) | NOT NULL | MIME type |
| file_size | BIGINT | NOT NULL | Size in bytes |
| issue_id | BIGINT | FK → issue(id), NOT NULL | |
| uploaded_by | BIGINT | FK → user(id), NOT NULL | |
| created_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_attachment_issue`

---

### 14. sprint

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| name | VARCHAR(255) | NOT NULL | |
| goal | TEXT | | Sprint goal / objective |
| project_id | BIGINT | FK → project(id), NOT NULL | |
| status | VARCHAR(20) | NOT NULL, CHECK IN ('PLANNING','ACTIVE','CLOSED') | |
| start_date | DATE | | |
| end_date | DATE | | |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_sprint_project`, `idx_sprint_status`

---

### 15. board_column

Per-project Kanban board configuration. Maps which statuses appear as columns and their order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| project_id | BIGINT | FK → project(id), NOT NULL | |
| status_id | BIGINT | FK → issue_status(id), NOT NULL | |
| position | INTEGER | NOT NULL | Column order (0-based) |

**Unique constraint:** `(project_id, status_id)`

---

### 16. time_log

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| hours | DECIMAL(5,2) | NOT NULL | Hours logged (e.g. 2.50) |
| log_date | DATE | NOT NULL | Date the work was performed |
| description | TEXT | | Description of work done |
| issue_id | BIGINT | FK → issue(id), NOT NULL | |
| user_id | BIGINT | FK → user(id), NOT NULL | Who logged the time |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_timelog_issue`, `idx_timelog_user`, `idx_timelog_date`, `idx_timelog_user_date`

---

### 17. wiki_page

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| title | VARCHAR(500) | NOT NULL | |
| content | TEXT | | Markdown content |
| slug | VARCHAR(500) | NOT NULL | URL-friendly identifier |
| project_id | BIGINT | FK → project(id), NOT NULL | |
| parent_id | BIGINT | FK → wiki_page(id), nullable | Self-referencing for tree structure |
| author_id | BIGINT | FK → user(id), NOT NULL | Last editor |
| position | INTEGER | NOT NULL, default 0 | Order among siblings |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Unique constraint:** `(project_id, slug)`

**Indexes:** `idx_wikipage_project`, `idx_wikipage_parent`, `idx_wikipage_author`

---

### 18. wiki_page_issue_link

Join table linking wiki pages to issues.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| wiki_page_id | BIGINT | FK → wiki_page(id), NOT NULL | |
| issue_id | BIGINT | FK → issue(id), NOT NULL | |

**Unique constraint:** `(wiki_page_id, issue_id)`

---

### 19. audit_log

Tracks changes on issues and time logs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| entity_type | VARCHAR(50) | NOT NULL | e.g. "ISSUE", "TIME_LOG" |
| entity_id | BIGINT | NOT NULL | ID of the changed entity |
| action | VARCHAR(20) | NOT NULL | CREATE, UPDATE, DELETE |
| old_value | TEXT | | JSON snapshot before change (null for CREATE) |
| new_value | TEXT | | JSON snapshot after change (null for DELETE) |
| performed_by | BIGINT | FK → user(id), NOT NULL | Who made the change |
| created_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_audit_entity`, `idx_audit_performed_by`, `idx_audit_created_at`

---

### 20. raid_item

Risks, Assumptions, Issues, and Dependencies (RAID log) per project. Uses a 5x5 risk matrix for RISK type items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| project_id | BIGINT | FK → project(id), NOT NULL | |
| type | VARCHAR(20) | NOT NULL, CHECK IN ('RISK','ASSUMPTION','ISSUE','DEPENDENCY') | RAID type |
| title | VARCHAR(255) | NOT NULL | |
| description | TEXT | | |
| status | VARCHAR(20) | NOT NULL, default 'OPEN', CHECK IN ('OPEN','MITIGATING','RESOLVED','CLOSED') | |
| probability | INTEGER | | 1-5 (only for RISK type) |
| impact | INTEGER | | 1-5 (only for RISK type) |
| mitigation_plan | TEXT | | |
| depends_on_project_id | BIGINT | | For DEPENDENCY type |
| owner_id | BIGINT | FK → user(id), nullable | Responsible person |
| due_date | DATE | | |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_raid_project`, `idx_raid_type`, `idx_raid_status`, `idx_raid_owner`

**Risk score** = `probability * impact` (computed, not stored). Levels: Low (1-4), Medium (5-9), High (10-15), Critical (16-25).

---

### 21. user_rate

Hourly rates per user for time-and-material cost calculation (EVM Actual Cost). Rates can change over time via effective_from.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| user_id | BIGINT | FK → user(id), NOT NULL | |
| hourly_rate | DECIMAL(10,2) | NOT NULL | Rate per hour |
| effective_from | DATE | NOT NULL | Date this rate takes effect |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, default now() | |

**Indexes:** `idx_user_rate_user`, `idx_user_rate_effective_from`

---

### 22. project_favorite

Join table for user ↔ project favorites (starred projects in sidebar).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, auto-increment | |
| user_id | BIGINT | FK → user(id), NOT NULL | |
| project_id | BIGINT | FK → project(id), NOT NULL | |

**Unique constraint:** `(user_id, project_id)`

**Indexes:** `idx_project_favorite_user`, `idx_project_favorite_project`

---

## Design Decisions

### Why `issue_key` instead of auto-generated ID only?
Issues get human-readable keys like `NEMO-42` (project key + sequential number). This is how users reference issues in conversations and time logs. The key is generated on creation: `{project.key}-{next_sequence}`.

### Why `position` on `issue` instead of a separate ordering table?
Keeps the schema simple. The `position` field determines ordering within the backlog (when `sprint_id` is null) or within a sprint (when `sprint_id` is set). When dragging issues on the board or backlog, the client sends updated position values.

### Why `board_column` as a separate table?
Allows each project to configure which statuses appear on its Kanban board and in what order. A project might only show "To Do → In Progress → Done" while another adds a "Review" column.

### Why `category` on `issue_status`?
Groups statuses into three buckets (TODO, IN_PROGRESS, DONE) so the system knows the semantic meaning regardless of custom names. Useful for reporting and sprint metrics (e.g., counting "done" issues).

### Why `priority` as an enum and not a table?
Priorities are stable and universal (Critical/High/Medium/Low). Unlike statuses and types, they don't need admin customization. A CHECK constraint is sufficient.

### Why `DECIMAL(5,2)` for `time_log.hours`?
Allows values like `2.50` (two and a half hours) with a max of `999.99`. More precise than integer hours, avoids floating-point rounding issues.

### Why `slug` on `wiki_page`?
URL-friendly identifiers for wiki pages (e.g., `/projects/NEMO/wiki/getting-started`). Better than exposing internal IDs in URLs and enables search-friendly page addressing.

### Why `is_default` on `issue_status`?
When creating a new issue, the system needs to know which status to assign by default. Exactly one status should have `is_default = true`.

### Why nullable `company_id` for multi-tenancy?
A "shared database, shared schema" approach with application-level filtering. When `company_id` is null, the entity is "global" — visible to all users. When set, only users in the same company (or global users) can see it. This avoids Hibernate filters or thread-local tenant context — service/query layers explicitly apply the visibility rules.

### Why a single `raid_item` table instead of separate Risk/Assumption/Issue/Dependency tables?
Risks, assumptions, issues, and dependencies share nearly identical structure (title, description, owner, status, dates). The `type` enum distinguishes them, while `probability`/`impact`/`mitigation_plan` are only meaningful for RISK type. This reduces schema complexity and allows a single CRUD API and UI for the RAID log.

---

## Default Seed Data

On first startup, the DataSeeder creates:

| Table | Default Rows |
|-------|-------------|
| company | "Acme Corp" (ACME), "Global Corp" (GCORP) |
| organization_config | "Nemo Global" (company_id=null), "Acme Corp" (ACME), "Global Corp" (GCORP) |
| issue_type | Project Management, Tech Lead, Architecture, Development, Data Analysis, Testing |
| issue_status | To Do (TODO, is_default), In Progress (IN_PROGRESS), Done (DONE) |
| user | admin (ADMIN, global), cto (EXECUTIVE, global), sarah (MANAGER, ACME), alex (CONTRIBUTOR, ACME), maria (CONTRIBUTOR, ACME), diana (MANAGER, GCORP), james (CONTRIBUTOR, GCORP), lee (CONTRIBUTOR, GCORP) |

All user passwords are `password123`.

---

## Cascade Delete Rules

| Parent | Child | Rule | Reason |
|--------|-------|------|--------|
| user | project (as manager) | RESTRICT | Can't delete a user who manages a project |
| user | issue (as reporter) | RESTRICT | Can't delete a user who reported issues |
| company | user | RESTRICT | Can't delete a company that has users (deactivate instead) |
| company | project | RESTRICT | Can't delete a company that has projects (deactivate instead) |
| company | program | RESTRICT | Can't delete a company that has programs (deactivate instead) |
| project | issue | CASCADE | Deleting a project deletes all its issues |
| project | label | CASCADE | Deleting a project deletes its labels |
| project | sprint | CASCADE | Deleting a project deletes its sprints |
| project | wiki_page | CASCADE | Deleting a project deletes its wiki |
| project | board_column | CASCADE | Deleting a project deletes its board config |
| project | raid_item | CASCADE | Deleting a project deletes its RAID log |
| project | project_favorite | CASCADE | Deleting a project removes favorites |
| issue | comment | CASCADE | Deleting an issue deletes its comments |
| issue | attachment | CASCADE | Deleting an issue deletes its attachment records (files cleaned up by service) |
| issue | time_log | CASCADE | Deleting an issue deletes its time logs |
| wiki_page | wiki_page (children) | CASCADE | Deleting a parent page deletes all children |
| sprint | issue (sprint_id) | SET NULL | Closing/deleting a sprint moves issues back to backlog |

---

## Indexing Strategy

Indexes are chosen based on the most common query patterns:

- **Issues by project + status** → `idx_issue_project`, `idx_issue_status`
- **Issues by assignee** → `idx_issue_assignee`
- **Issues in a sprint** → `idx_issue_sprint`
- **Time logs by date range** → `idx_timelog_date`, `idx_timelog_user_date`
- **Time logs by user** → `idx_timelog_user`
- **Audit log lookups** → `idx_audit_entity`, `idx_audit_created_at`
- **Wiki pages by project** → `idx_wikipage_project`
- **Comments by issue** → `idx_comment_issue`

Full-text search for wiki pages and issue descriptions will be handled at the application/query level (not via DB full-text indexes), keeping the schema portable between H2 and Postgres.