# Nemo — Feature & Access Matrix

## User Roles

| Role | Description |
|------|-------------|
| **ADMIN** | System administrator with full access |
| **MANAGER** | Project manager — creates/manages projects, teams, and tasks |
| **EXECUTIVE** | Senior leadership — portfolio visibility and read access |
| **HR** | Human resources — people management, leave approvals, assets |
| **CONTRIBUTOR** | Regular team member — own work and project access |
| **EXTERNAL** | External stakeholder — restricted to one assigned project, external tasks only |

---

## Modules & Features

### Authentication

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| Login / Logout | /login | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| CAPTCHA challenge | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Current user profile | /api/auth/me | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

---

### Dashboards

Each role sees a different home dashboard.

| Dashboard | Route | Description |
|-----------|-------|-------------|
| Admin | / | Users, companies, projects, activity log, system config |
| Manager | / | My projects, EVM metrics, open risks, active sprints, team timesheet |
| Executive | / | Portfolio KPIs, company selector, risk matrix, budget vs spent, project health |
| HR | / | User counts, upcoming holidays, evaluation scores, companies |
| Contributor | / | Assigned tasks, task counts, time logging status, my projects |

---

### Administration

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| Companies CRUD | /admin | ✔ | — | — | — | — | — |
| Users CRUD | /admin | ✔ | — | — | — | — | — |
| Activity log | /admin | ✔ | — | — | — | — | — |
| Task types config | /admin | ✔ | — | — | — | — | — |
| Task statuses config | /admin | ✔ | — | — | — | — | — |
| Organization settings | /admin | ✔ | — | — | — | — | — |

---

### Projects

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| List projects | /projects | ✔ | ✔ (company) | ✔ (company) | ✔ (company) | ✔ (member) | ✔ (assigned) |
| View project detail | /projects/:id | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Create / update project | — | ✔ | ✔ | — | — | — | — |
| Delete project | — | ✔ | — | — | — | — | — |
| Toggle favorite | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Manage members | — | ✔ | ✔ | — | — | — | — |
| Manage labels | — | ✔ | ✔ | — | — | — | — |
| Manage board config | — | ✔ | ✔ | — | — | — | — |
| Manage instructions | — | ✔ | ✔ | ✔ | — | — | — |
| View notes | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Manage notes | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

---

### Tasks (formerly Issues)

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| List tasks | — | ✔ | ✔ (company) | ✔ (company) | ✔ (company) | ✔ (member) | ✔ (ext. only) |
| View task detail | /projects/:id/tasks/:id | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ (ext. only) |
| Create task | — | ✔ | ✔ | — | — | ✔ | ✔ (forced ext.) |
| Update task | — | ✔ | ✔ | — | — | ✔ | ✔ (own ext.) |
| Delete task | — | ✔ | ✔ | — | — | — | — |
| Move task (position) | — | ✔ | ✔ | — | — | ✔ | ✔ (own ext.) |
| View comments | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Add comment | — | ✔ | ✔ | — | — | ✔ | ✔ (ext. only) |
| Edit own comment | — | ✔ | ✔ | — | — | ✔ | ✔ |
| Delete comment | — | ✔ | ✔ | — | — | — | — |
| Attachments (view/upload) | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Delete attachment | — | ✔ | ✔ | — | — | — | — |

---

### Sprints

| Feature | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|---------|-----------|----|-------------|----------|
| View sprints | ✔ | ✔ | ✔ | ✔ | ✔ (member) | ✔ (assigned) |
| Create / update sprint | ✔ | ✔ | — | — | — | — |
| Change sprint status | ✔ | ✔ | — | — | — | — |

---

### Phases & Deliverables

| Feature | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|---------|-----------|----|-------------|----------|
| View phases & deliverables | ✔ | ✔ | ✔ | ✔ | ✔ (member) | ✔ (assigned) |
| CRUD phases | ✔ | ✔ | — | — | — | — |
| CRUD deliverables | ✔ | ✔ | — | — | — | — |
| CRUD phase payments | ✔ | ✔ | — | — | — | — |

---

### RAID (Risks, Assumptions, Tasks, Dependencies)

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| View RAID items | /pmo | ✔ | ✔ | ✔ | — | — | — |
| Create / update RAID | — | ✔ | ✔ | — | — | — | — |
| Delete RAID item | — | ✔ | ✔ | — | — | — | — |

---

### PMO / Portfolio

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| EVM metrics | /pmo | ✔ | ✔ | ✔ | — | — | — |
| Portfolio summary | /pmo | ✔ | ✔ | ✔ | — | — | — |
| Portfolio by company | /pmo | ✔ | ✔ | ✔ | — | — | — |
| Portfolio timeline | /pmo | ✔ | ✔ | ✔ | — | — | — |

---

### Clients

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| List / view clients | /clients | ✔ | ✔ | ✔ | — | — | — |
| Create client | — | ✔ | — | — | — | — | — |
| Update client | — | ✔ | ✔ | ✔ | — | — | — |
| Add / edit contacts | — | ✔ | ✔ | ✔ | — | — | — |
| Delete contact | — | ✔ | ✔ | ✔ | — | — | — |

---

### Pre-Sales (CRM Pipeline)

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| List / view pre-sales | /presales | ✔ | ✔ | ✔ | — | — | — |
| Create pre-sale | — | ✔ | — | — | — | — | — |
| Update pre-sale | — | ✔ | ✔ | ✔ | — | — | — |
| Delete pre-sale | — | ✔ | — | — | — | — | — |

---

### Programs

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| List / view programs | /programs | ✔ | ✔ | — | — | — | — |
| Create / update program | — | ✔ | ✔ | — | — | — | — |
| Delete program | — | ✔ | — | — | — | — | — |

---

### People (Users)

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| People directory | /people | ✔ | ✔ | — | ✔ | — | — |
| User detail page | /people/:id | ✔ | ✔ | ✔ | ✔ | Self only | — |
| Create / update / deactivate user | — | ✔ | — | — | — | — | — |

---

### Time Tracking

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| Log / view own time | /my-time | ✔ | ✔ | — | — | ✔ | — |
| View others' time | — | ✔ | ✔ | ✔ | ✔ | — | — |
| Edit own time log | — | ✔ | ✔ | — | — | ✔ | — |
| Delete any time log | — | ✔ | ✔ | — | — | — | — |

---

### Timesheets

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| Weekly timesheet | /timesheets | ✔ | ✔ | ✔ | ✔ | — | — |
| Daily timesheet | /timesheets | ✔ | ✔ | ✔ | ✔ | — | — |

---

### Reports

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| Portfolio report | /reports | ✔ | ✔ | ✔ | — | — | — |
| Project overview | /reports | ✔ | ✔ | ✔ | ✔ | — | — |
| Task aging | /reports | ✔ | ✔ | ✔ | — | — | — |
| Sprint velocity | /reports | ✔ | ✔ | ✔ | — | — | — |
| Workload report | /reports | ✔ | ✔ | ✔ | ✔ | — | — |
| Time reports | /reports | ✔ | ✔ | ✔ | ✔ | — | — |
| Time trends | /reports | ✔ | ✔ | ✔ | ✔ | — | — |
| Attendance report | /reports | ✔ | — | — | ✔ | — | — |
| Headcount report | /reports | ✔ | — | — | ✔ | — | — |

---

### Leave Management

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| View own leaves | /leave | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| View all leaves | /leave | ✔ | ✔ | ✔ | ✔ | — | — |
| Create / cancel leave | /leave | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Approve / reject leave | — | ✔ | ✔ | — | ✔ | — | — |

---

### Assets & Locations

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| View / manage assets | /assets | ✔ | — | — | ✔ | — | — |
| Create / delete asset | — | ✔ | — | — | — | — | — |
| Assign / unassign asset | — | ✔ | — | — | ✔ | — | — |
| View locations | — | ✔ | — | — | ✔ | — | — |
| Manage locations | — | ✔ | — | — | — | — | — |

---

### User Rates (Billing)

| Feature | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|---------|-----------|----|-------------|----------|
| View user rates | ✔ | ✔ | — | ✔ | — | — |
| Create / update / delete rates | ✔ | — | — | — | — | — |

---

### Companies

| Feature | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|---------|-----------|----|-------------|----------|
| List / view companies | ✔ | ✔ | ✔ | ✔ | — | — |
| Create / update company | ✔ | — | — | ✔ | — | — |
| Delete company | ✔ | — | — | — | — | — |

---

### Wiki (Project Documentation)

| Feature | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|---------|-----------|----|-------------|----------|
| View / search wiki | ✔ | ✔ | ✔ | ✔ | ✔ (member) | ✔ (assigned) |
| Create / edit wiki page | ✔ | ✔ | — | — | ✔ (member) | ✔ (member) |
| Delete wiki page | ✔ | ✔ | — | — | — | — |

---

### Public Holidays

| Feature | Route | ADMIN | MANAGER | EXECUTIVE | HR | CONTRIBUTOR | EXTERNAL |
|---------|-------|-------|---------|-----------|----|-------------|----------|
| Manage holidays | /holidays | ✔ | — | — | ✔ | — | — |

---

## Sidebar Navigation

| Nav Item | Visible To |
|----------|-----------|
| Dashboard | All authenticated users |
| Admin | ADMIN |
| Projects | All except ADMIN* |
| Programs | ADMIN, MANAGER, EXECUTIVE, HR |
| People | ADMIN, MANAGER, HR |
| Assets | ADMIN, HR |
| Clients | MANAGER, EXECUTIVE, HR |
| Pre-Sales | MANAGER, EXECUTIVE, HR |
| My Time | All except EXTERNAL, HR |
| Timesheets | ADMIN, MANAGER, HR |
| Leave | All except EXTERNAL |
| Holidays | HR |
| Reports | ADMIN, MANAGER, EXECUTIVE, HR |
| PMO | ADMIN, MANAGER, EXECUTIVE |

*ADMIN accesses projects via the admin dashboard instead of the projects list.

---

## Company Scoping

Users belong to a company or are global (no company). Company scoping affects visibility:

- **ADMIN**: Always sees everything (global)
- **MANAGER (company-scoped)**: Sees only data within their company
- **MANAGER (global)**: Sees all data
- **EXECUTIVE**: Company-scoped read access for projects; global for other data
- **HR**: Global access to people, leave, and asset data
- **CONTRIBUTOR**: Sees only projects they are members of
- **EXTERNAL**: Sees only their one assigned project, and only tasks flagged as external