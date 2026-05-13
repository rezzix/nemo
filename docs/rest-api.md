# Nemo — REST API Design

Base path: `/api`

All endpoints return JSON. Authentication is via session cookie (JSESSIONID).

---

## Response Envelope

### Single resource

```json
{
  "data": { ... },
  "timestamp": "2026-04-24T10:30:00Z"
}
```

### Collection (with pagination)

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 142,
    "totalPages": 8
  },
  "timestamp": "2026-04-24T10:30:00Z"
}
```

### Error response

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Issue title must not be blank",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

### Validation error (multiple fields)

```json
{
  "status": 422,
  "error": "Validation Failed",
  "message": "Input validation failed",
  "errors": [
    { "field": "title", "message": "must not be blank" },
    { "field": "priority", "message": "must be one of: CRITICAL, HIGH, MEDIUM, LOW" }
  ],
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

## Common Query Parameters

| Parameter | Used on | Description |
|-----------|---------|-------------|
| `page` | All list endpoints | Page number (0-based), default 0 |
| `size` | All list endpoints | Page size, default 20 |
| `sort` | All list endpoints | Sort as `field,direction` (e.g. `createdAt,desc`), default varies |
| `search` | Issues, Wiki pages | Full-text search keyword |

---

## 1. Authentication

### POST /api/auth/login

Log in and create a session.

**Request:**
```json
{
  "username": "jdoe",
  "password": "plain-text-password"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": 1,
    "username": "jdoe",
    "email": "jdoe@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "MANAGER",
    "avatarUrl": null
  },
  "timestamp": "2026-04-24T10:30:00Z"
}
```
> Sets `JSESSIONID` cookie.

### POST /api/auth/logout

Invalidate the current session.

**Response:** `200 OK`
```json
{
  "data": { "message": "Logged out" },
  "timestamp": "2026-04-24T10:30:00Z"
}
```

### GET /api/auth/me

Get the currently authenticated user.

**Response:** `200 OK` — same shape as login response.

---

## 2. Companies

> Admin-only for all operations.

### GET /api/companies

List all companies. **Admin only.**

**Query params:** `page`, `size`, `sort`, `search`, `active`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Acme Corp",
      "key": "ACME",
      "description": "A technology company",
      "active": true,
      "createdAt": "2026-04-24T10:30:00Z",
      "updatedAt": "2026-04-24T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

### GET /api/companies/{id}

Get a single company. **Admin only.**

### POST /api/companies

Create a company. **Admin only.**

**Request:**
```json
{
  "name": "Acme Corp",
  "key": "ACME",
  "description": "A technology company"
}
```

### PUT /api/companies/{id}

Update a company. **Admin only.**

**Request:**
```json
{
  "name": "Acme Corp Updated",
  "description": "Updated description",
  "active": true
}
```

> Companies are soft-deleted by setting `active = false`. Hard delete is not supported.

---

## 3. Users

> Admin-only for create/update/delete. Users can edit their own profile (see `/api/auth/me`).

### GET /api/users

List users. **Admin** sees all. **Manager** sees users in their company + global users.

**Query params:** `page`, `size`, `sort`, `search`, `role`, `active`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "username": "jdoe",
      "email": "jdoe@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "MANAGER",
      "companyId": 1,
      "companyName": "Acme Corp",
      "active": true,
      "avatarUrl": null,
      "createdAt": "2026-01-15T08:00:00Z",
      "updatedAt": "2026-01-15T08:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### GET /api/users/{id}

Get a single user. **Admin or self.**

### POST /api/users

Create a user. **Admin only.**

**Request:**
```json
{
  "username": "jdoe",
  "email": "jdoe@company.com",
  "password": "initial-password",
  "firstName": "John",
  "lastName": "Doe",
  "role": "MANAGER",
  "companyId": 1
}
```

> `companyId` is optional. null = global user. Only Admin can set any company; others default to their own company.

### PUT /api/users/{id}

Update user details. **Admin only.**

**Request:**
```json
{
  "email": "new-email@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CONTRIBUTOR",
  "companyId": 2,
  "active": true
}
```

### PUT /api/users/{id}/password

Change a user's password. **Admin or self.**

**Request:**
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

> If admin changes another user's password, `currentPassword` is not required.

### DELETE /api/users/{id}

Deactivate a user (sets `active = false`). **Admin only.**

> Users are never hard-deleted because they may be referenced by issues, time logs, and audit records.

---

## 4. Organization Config

> Returns the config for the user's company (or global config if the user is global). Admin-only for updates.

### GET /api/organization

Get organization config for the current user's company. Falls back to the global config if no company-specific config exists.

### PUT /api/organization

Update organization config. **Admin only.** Creates a company-specific config if none exists.

**Request:**
```json
{
  "name": "Acme Corp",
  "address": "123 Main St, Springfield"
}
```

---

## 5. Issue Types & Statuses

> Admin-only for create/update/delete. All authenticated users can read.

### GET /api/issue-types

List all issue types.

### POST /api/issue-types

Create an issue type. **Admin only.**

**Request:**
```json
{
  "name": "Development"
}
```

### PUT /api/issue-types/{id}

Update an issue type. **Admin only.**

### DELETE /api/issue-types/{id}

Delete an issue type. **Admin only.** Fails if issues reference this type.

### GET /api/issue-statuses

List all issue statuses.

### POST /api/issue-statuses

Create an issue status. **Admin only.**

**Request:**
```json
{
  "name": "In Review",
  "category": "IN_PROGRESS",
  "isDefault": false
}
```

### PUT /api/issue-statuses/{id}

Update an issue status. **Admin only.**

### DELETE /api/issue-statuses/{id}

Delete an issue status. **Admin only.** Fails if issues reference this status.

---

## 6. Programs

> Admin and Manager can create/update. All authenticated users can read.

### GET /api/programs

List programs. **Admin** sees all. **Manager/Executive** sees programs in their company + global programs. **Contributor** sees programs they belong to via projects.

**Query params:** `page`, `size`, `sort`, `search`

### GET /api/programs/{id}

Get a program with its projects summary.

### POST /api/programs

Create a program. **Admin, Manager.**

**Request:**
```json
{
  "name": "Platform Engineering",
  "key": "PLAT",
  "description": "Platform infrastructure and tooling",
  "managerId": 2,
  "companyId": 1
}
```

> `companyId` is optional. null = global program. Admin can set any company; others default to their own company.

### PUT /api/programs/{id}

Update a program. **Admin, Manager.**

### DELETE /api/programs/{id}

Delete a program. **Admin only.** Fails if projects exist under it.

---

## 7. Projects

> Admin and Manager can create/update. Users see projects they are members of (or all if Admin/Manager). Company-scoped visibility: company users see projects in their company + global projects they're members of; global users see all.

### GET /api/projects

List projects. Filtered by company scope and membership.

**Query params:** `page`, `size`, `sort`, `search`, `programId`, `managerId`

### GET /api/projects/{id}

Get a project with member count and issue count.

### POST /api/projects

Create a project. **Admin, Manager.**

**Request:**
```json
{
  "name": "Nemo",
  "key": "NEMO",
  "description": "Internal project management system",
  "programId": 1,
  "managerId": 2,
  "companyId": 1,
  "memberIds": [2, 3, 5]
}
```

> `companyId` is optional. null = global project. Admin can set any company; others default to their own company. On creation, the manager and listed members are added as project members. A default Kanban board configuration is created using all organization statuses.

### PUT /api/projects/{id}

Update a project. **Admin, Manager (if project manager).**

### DELETE /api/projects/{id}

Delete a project and all its data (issues, sprints, wiki, etc.). **Admin only.**

### GET /api/projects/{id}/members

List project members.

### POST /api/projects/{id}/members

Add members to a project. **Admin, Manager (if project manager).**

**Request:**
```json
{
  "userIds": [4, 7]
}
```

### DELETE /api/projects/{id}/members/{userId}

Remove a member from a project. **Admin, Manager (if project manager).** Cannot remove the project manager.

---

## 8. Labels

> Scoped to a project. Admin, Manager, and project members can manage.

### GET /api/projects/{projectId}/labels

List labels for a project.

### POST /api/projects/{projectId}/labels

Create a label.

**Request:**
```json
{
  "name": "bug",
  "color": "#FF5733"
}
```

### PUT /api/projects/{projectId}/labels/{id}

Update a label.

### DELETE /api/projects/{projectId}/labels/{id}

Delete a label. Removed from all issues that had it.

---

## 9. Issues

> Project members can create. Assignee/reporter/managers can edit.

### GET /api/projects/{projectId}/issues

List issues for a project.

**Query params:** `page`, `size`, `sort`, `search`, `statusId`, `assigneeId`, `typeId`, `priority`, `sprintId`, `labelId`, `createdAfter`, `createdBefore`

> `createdAfter` and `createdBefore` accept ISO dates (e.g. `2026-04-01`) and filter by the issue's `created_at` field.

### GET /api/projects/{projectId}/issues/{issueId}

Get a single issue with comments, labels, and assignee details.

### POST /api/projects/{projectId}/issues

Create an issue. **Project members.**

**Request:**
```json
{
  "title": "Fix login redirect",
  "description": "## Steps to reproduce\n1. Go to login page\n2. Enter credentials\n3. Redirect fails",
  "priority": "HIGH",
  "typeId": 1,
  "assigneeId": 3,
  "labelIds": [1, 4]
}
```

> `issueKey` is auto-generated as `{projectKey}-{sequence}`. `statusId` defaults to the organization's default status. `reporterId` is set from the session.

### PUT /api/projects/{projectId}/issues/{issueId}

Update issue fields (title, description, priority, type, assignee, status, labels, sprint).

**Request (partial update):**
```json
{
  "statusId": 2,
  "assigneeId": 5
}
```

> Status changes and field updates trigger audit log entries and WebSocket broadcasts (for Kanban).

### DELETE /api/projects/{projectId}/issues/{issueId}

Delete an issue. **Admin, Manager, or reporter.**

### PATCH /api/projects/{projectId}/issues/{issueId}/position

Reorder an issue within a sprint or backlog. Used by Kanban drag-and-drop.

**Request:**
```json
{
  "position": 3,
  "sprintId": 5
}
```

---

## 10. Comments

> Scoped to an issue. Project members can create.

### GET /api/projects/{projectId}/issues/{issueId}/comments

List comments for an issue, sorted by `createdAt` ascending.

### POST /api/projects/{projectId}/issues/{issueId}/comments

Add a comment. **Project members.**

**Request:**
```json
{
  "content": "This is also happening on the registration page."
}
```

### PUT /api/projects/{projectId}/issues/{issueId}/comments/{commentId}

Update a comment. **Author or Admin.**

### DELETE /api/projects/{projectId}/issues/{issueId}/comments/{commentId}

Delete a comment. **Author, Admin, or Manager.**

---

## 11. Attachments

### POST /api/projects/{projectId}/issues/{issueId}/attachments

Upload a file attachment. **Project members.**

**Request:** `multipart/form-data`
- `file` — the file

**Response:** `201 Created`
```json
{
  "data": {
    "id": 12,
    "fileName": "screenshot.png",
    "contentType": "image/png",
    "fileSize": 45020,
    "uploadedBy": 3,
    "createdAt": "2026-04-24T10:30:00Z"
  }
}
```

### GET /api/projects/{projectId}/issues/{issueId}/attachments

List attachments for an issue.

### DELETE /api/projects/{projectId}/issues/{issueId}/attachments/{attachmentId}

Delete an attachment (removes file from storage). **Uploader, Admin, or Manager.**

### GET /api/attachments/{id}/download

Download an attachment file by ID.

---

## 12. Sprints & Backlog

### GET /api/projects/{projectId}/sprints

List sprints for a project.

**Query params:** `status` (PLANNING, ACTIVE, CLOSED)

### GET /api/projects/{projectId}/sprints/{sprintId}

Get sprint details with issue summary (count by status category).

### POST /api/projects/{projectId}/sprints

Create a sprint. **Admin, Manager.**

**Request:**
```json
{
  "name": "Sprint 3",
  "goal": "Complete user authentication module",
  "startDate": "2026-05-05",
  "endDate": "2026-05-19"
}
```

### PUT /api/projects/{projectId}/sprints/{sprintId}

Update a sprint. **Admin, Manager.**

### PATCH /api/projects/{projectId}/sprints/{sprintId}/status

Change sprint status (PLANNING → ACTIVE → CLOSED).

**Request:**
```json
{
  "status": "ACTIVE"
}
```

### GET /api/projects/{projectId}/backlog

Get all issues not assigned to any sprint (sprintId = null).

**Query params:** `page`, `size`, `sort`

---

## 13. Board Configuration

### GET /api/projects/{projectId}/board

Get Kanban board configuration (columns and their statuses with position).

> **Note:** `name` and `issueCount` are derived fields. `name` is joined from the `issue_status` table. `issueCount` is a runtime count of issues in that status for the project — neither is stored on the `board_column` table.

**Response:**
```json
{
  "data": {
    "projectId": 1,
    "columns": [
      { "id": 1, "statusId": 1, "name": "To Do", "position": 0, "issueCount": 5 },
      { "id": 2, "statusId": 2, "name": "In Progress", "position": 1, "issueCount": 3 },
      { "id": 3, "statusId": 4, "name": "In Review", "position": 2, "issueCount": 1 },
      { "id": 4, "statusId": 3, "name": "Done", "position": 3, "issueCount": 12 }
    ]
  }
}
```

### PUT /api/projects/{projectId}/board

Replace board column configuration. **Admin, Manager.**

**Request:**
```json
{
  "columns": [
    { "statusId": 1, "position": 0 },
    { "statusId": 2, "position": 1 },
    { "statusId": 4, "position": 2 },
    { "statusId": 3, "position": 3 }
  ]
}
```

---

## 14. Time Tracking

### POST /api/time-logs

Log time on an issue. **Project members.**

**Request:**
```json
{
  "issueId": 42,
  "hours": 3.5,
  "logDate": "2026-04-24",
  "description": "Fixed login redirect bug"
}
```

### GET /api/time-logs

List time logs. Filtered by role:
- **Admin**: can see all
- **Manager**: can see logs for their projects
- **Contributor**: can see own logs only

**Query params:** `userId`, `issueId`, `projectId`, `startDate`, `endDate`, `page`, `size`, `sort`

### GET /api/time-logs/{id}

Get a single time log entry.

### PUT /api/time-logs/{id}

Update a time log. **Author, Admin, or Manager.**

### DELETE /api/time-logs/{id}

Delete a time log. **Author, Admin, or Manager.**

---

## 15. Timesheets

### GET /api/timesheets/weekly

Get a weekly timesheet view.

**Query params:** `userId` (required), `weekStart` (required, ISO date)

**Response:**
```json
{
  "data": {
    "userId": 3,
    "weekStart": "2026-04-20",
    "weekEnd": "2026-04-26",
    "totalHours": 38.5,
    "days": [
      {
        "date": "2026-04-20",
        "totalHours": 8.0,
        "entries": [
          {
            "id": 101,
            "issueId": 42,
            "issueKey": "NEMO-42",
            "issueTitle": "Fix login redirect",
            "hours": 5.0,
            "description": "Fixed login redirect bug"
          },
          {
            "id": 102,
            "issueId": 45,
            "issueKey": "NEMO-45",
            "issueTitle": "Add search filters",
            "hours": 3.0,
            "description": "Implemented filter dropdowns"
          }
        ]
      },
      {
        "date": "2026-04-21",
        "totalHours": 7.5,
        "entries": [ ... ]
      }
    ]
  }
}
```

> Contributors can only request their own timesheet. Managers can request timesheets for their project members. Admins can request any.

### GET /api/timesheets/daily

Get a daily timesheet view.

**Query params:** `userId` (required), `date` (required, ISO date)

---

## 16. Wiki / Documentation

> All endpoints scoped to a project. Project members can read. Project members can create/edit.

### GET /api/projects/{projectId}/wiki/pages

Get the page tree for a project (sidebar navigation).

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Getting Started",
      "slug": "getting-started",
      "parentId": null,
      "position": 0,
      "children": [
        {
          "id": 2,
          "title": "Architecture",
          "slug": "architecture",
          "parentId": 1,
          "position": 0,
          "children": []
        }
      ]
    }
  ]
}
```

### GET /api/projects/{projectId}/wiki/pages/{pageId}

Get a single page with content.

**Response:**
```json
{
  "data": {
    "id": 1,
    "title": "Getting Started",
    "slug": "getting-started",
    "content": "# Getting Started\n\nWelcome to the project wiki...",
    "parentId": null,
    "position": 0,
    "authorId": 2,
    "authorName": "John Doe",
    "updatedAt": "2026-04-24T10:30:00Z",
    "linkedIssueIds": [42, 55]
  }
}
```

### POST /api/projects/{projectId}/wiki/pages

Create a page. **Project members.**

**Request:**
```json
{
  "title": "Getting Started",
  "content": "# Getting Started\n\nWelcome to the project wiki...",
  "parentId": null,
  "linkedIssueIds": [42]
}
```

### PUT /api/projects/{projectId}/wiki/pages/{pageId}

Update a page (title, content, parent). Overwrites previous content (no versioning).

### DELETE /api/projects/{projectId}/wiki/pages/{pageId}

Delete a page and all its children. **Admin, Manager, or author.**

### PATCH /api/projects/{projectId}/wiki/pages/{pageId}/position

Reorder a page among siblings.

**Request:**
```json
{
  "parentId": 3,
  "position": 1
}
```

### GET /api/projects/{projectId}/wiki/search

Search wiki pages by title and content.

**Query params:** `q` (search term)

---

## 17. Reporting

### GET /api/reports/time-by-project

Time spent per project in a date range.

**Query params:** `startDate`, `endDate`, `projectId` (optional)

**Response:**
```json
{
  "data": [
    { "projectId": 1, "projectName": "Nemo", "projectKey": "NEMO", "totalHours": 120.5 },
    { "projectId": 2, "projectName": "Platform", "projectKey": "PLAT", "totalHours": 85.0 }
  ]
}
```

### GET /api/reports/time-by-user

Time spent per user in a date range.

**Query params:** `startDate`, `endDate`, `projectId` (optional), `userId` (optional)

**Response:**
```json
{
  "data": [
    { "userId": 3, "userName": "John Doe", "totalHours": 40.0 },
    { "userId": 5, "userName": "Jane Smith", "totalHours": 35.5 }
  ]
}
```

### GET /api/reports/time-by-issue

Time spent per issue in a date range.

**Query params:** `startDate`, `endDate`, `projectId` (required), `assigneeId` (optional)

**Response:**
```json
{
  "data": [
    { "issueId": 42, "issueKey": "NEMO-42", "issueTitle": "Fix login redirect", "totalHours": 12.5 },
    { "issueId": 45, "issueKey": "NEMO-45", "issueTitle": "Add search filters", "totalHours": 8.0 }
  ]
}
```

---

## 18. Audit Log

> Admin-only read access.

### GET /api/audit-logs

List audit log entries.

**Query params:** `entityType`, `entityId`, `performedBy`, `startDate`, `endDate`, `page`, `size`, `sort`

---

## 19. WebSocket (STOMP)

### Connection

Connect to `/ws` with SockJS fallback.

### Subscribe

| Destination | Purpose |
|-------------|---------|
| `/topic/kanban/{projectId}` | Real-time board updates for a project |

### Receive messages

When an issue's status, assignee, or position changes:

```json
{
  "type": "ISSUE_UPDATED",
  "issueId": 42,
  "issueKey": "NEMO-42",
  "field": "statusId",
  "oldValue": 1,
  "newValue": 2,
  "performedBy": 3,
  "timestamp": "2026-04-24T10:30:00Z"
}
```

When an issue is created or deleted:

```json
{
  "type": "ISSUE_CREATED",
  "issue": { ... },
  "performedBy": 3,
  "timestamp": "2026-04-24T10:30:00Z"
}
```

```json
{
  "type": "ISSUE_DELETED",
  "issueId": 42,
  "performedBy": 3,
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

## HTTP Status Codes

| Status | Usage |
|--------|-------|
| 200 | Successful GET, PUT |
| 201 | Successful POST (creation) |
| 204 | Successful DELETE |
| 400 | Validation error, bad request |
| 401 | Not authenticated |
| 403 | Not authorized (wrong role or not a project member) |
| 404 | Resource not found |
| 409 | Conflict (duplicate key, e.g. username already exists) |
| 422 | Validation failed (multiple field errors) |

---

## Authorization Summary

| Endpoint Group | Admin | Executive | Manager | Contributor |
|---------------|-------|----------|---------|-------------|
| Auth (login/logout/me) | Yes | Yes | Yes | Yes |
| Companies | Full | — | — | — |
| Users CRUD | Full | — | Company scope | Own profile only |
| Organization config | Full | Read own company | — | — |
| Issue types & statuses | Full | Read only | — | Read only |
| Programs | Full | Read own company | Create/Edit own company | Read (own) |
| Projects | Full | Read own company | Create/Edit own | Read (own) |
| Issues | Full | Own projects | Own projects | Own projects |
| Comments & Attachments | Full | Own projects | Own projects | Own projects |
| Sprints & Backlog | Full | Read | Own projects | Read (own) |
| Board config | Full | Read | Own projects | Read only |
| Time logs | Full | Own projects | Own projects | Own logs only |
| Timesheets | All | Own company | Own project members | Own only |
| Wiki pages | Full | Own projects | Own projects | Own projects |
| Reports | Full | Own company | Own projects | Own projects |
| Audit logs | Full | — | — | — |

> "Own company" = resources in the same company + global resources. "Own projects" = projects the user is a member of.