# Nemo

A project management system with PMO capabilities, time tracking, and built-in project documentation.

## Features

- **Program & Portfolio Management** — Organize projects into programs with portfolio-level visibility
- **Project Phases & Deliverables** — Track project phases, milestones, and deliverables
- **EVM & Budget Tracking** — Earned Value Management with budget and cost tracking
- **RAID Logs & Risk Management** — Risks, assumptions, issues, and dependencies per project
- **Task Tracking & Kanban Boards** — Create, assign, and manage tasks with priorities, labels, types, and statuses
- **Sprint Management** — Backlog view, sprint creation, task assignment to sprints
- **Time Tracking & Timesheets** — Log hours against tasks, weekly timesheet view, time reports
- **Wiki Docs & Mermaid Diagrams** — Wiki-style pages with nested tree structure, search, and Mermaid diagram support
- **Reports & Dashboards** — PMO dashboard, cross-project reports, and personal dashboard
- **Multi-Company Support** — Projects and users belong to companies or are global; company-scoped visibility
- **External Users** — Restricted access for external stakeholders with project-scoped visibility
- **Role-Based Access** — Admin, Manager, Executive, Contributor, and External roles with appropriate permissions

## Tech Stack

**Backend:** Java 21, Spring Boot 3, Spring Security (session-based auth), JPA/Hibernate, H2 Database

**Frontend:** React 18, TypeScript, Zustand, Tailwind CSS v4, Vite, React Router v6

**Build:** Gradle (monorepo)

## Project Structure

```
nemo/
├── backend/                   # Spring Boot application
│   └── src/main/java/com/nemo/
│       ├── attachment/         # File attachments
│       ├── common/             # Audit, DTOs, exceptions, storage
│       ├── config/             # Task types/statuses, org config, data seeder
│       ├── documentation/      # Wiki pages
│       ├── task/               # Tasks, comments
│       ├── phase/              # Phases, deliverables
│       ├── pmo/                # RAID items, PMO dashboard
│       ├── program/            # Programs (portfolios)
│       ├── project/            # Projects, members, labels, board columns
│       ├── security/           # Auth, Spring Security config
│       ├── sprint/             # Sprints, backlog
│       ├── timetracking/       # Time logs, timesheets, reports
│       └── user/               # Users
├── frontend/                  # React application
│   └── src/
│       ├── api/                # API client modules
│       ├── components/         # Layout, guards, common components
│       ├── hooks/              # Custom React hooks
│       ├── pages/              # Page components
│       ├── stores/             # Zustand stores
│       ├── types/              # TypeScript type definitions
│       └── utils/              # Formatting utilities
├── documentation/             # OKF knowledge base (charter + state)
└── postman/                   # API test collection
```

## Getting Started

### Prerequisites

- Java 21+
- Node.js 18+
- Gradle (via wrapper)

### Backend

```bash
./gradlew :backend:bootRun
```

The backend starts at `http://localhost:8080` with an H2 console at `/h2-console`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:5173` and proxies API calls to the backend.


## API Overview

| Resource | Base Path |
|----------|-----------|
| Auth | `/api/auth/*` |
| Users | `/api/users` |
| Companies | `/api/companies` |
| Programs | `/api/programs` |
| Projects | `/api/projects` |
| Tasks | `/api/projects/{projectId}/tasks` |
| Comments | `/api/projects/{projectId}/tasks/{taskId}/comments` |
| Wiki Pages | `/api/projects/{projectId}/wiki/pages` |
| Time Logs | `/api/time-logs` |
| Timesheets | `/api/timesheets` |
| Sprints | `/api/projects/{projectId}/sprints` |
| Phases | `/api/projects/{projectId}/phases` |
| Admin | `/api/admin/*` |

Full API documentation is available in `documentation/charter/implementation/api/index.md` and the Postman collection in `postman/`.
