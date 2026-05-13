# Nemo — Getting Started

## Prerequisites

- **Java 21+** (tested with Java 25)
- **Gradle 9+** (or use the included wrapper)
- **Node.js 18+** (for Newman, optional)

## Project Structure

```
nemo/
├── backend/                  # Spring Boot application
│   ├── src/main/java/com/nemo/
│   │   ├── config/            # Security, WebSocket, Organization, IssueConfig, DataSeeder
│   │   ├── company/           # Company CRUD (multi-tenant)
│   │   ├── security/          # AuthController, CustomUserDetailsService, SecurityConfig, DevModeAuthenticationProvider
│   │   ├── common/            # DTOs, exceptions, audit, storage
│   │   ├── user/              # User CRUD
│   │   ├── program/           # Program CRUD
│   │   ├── project/           # Project, members, labels, board config
│   │   ├── issue/             # Issues, comments
│   │   ├── sprint/            # Sprints, backlog
│   │   ├── timetracking/      # Time logs, timesheets, reports
│   │   ├── documentation/     # Wiki pages
│   │   ├── pmo/               # RAID logs, EVM metrics
│   │   └── attachment/        # File uploads
│   └── src/main/resources/
│       ├── application.yml        # H2 dev config
│       ├── application-prod.yml   # Postgres prod config
│       └── data.sql               # Seed data
├── frontend/                 # React + TypeScript + Tailwind CSS v4
├── postman/                  # API test collection
│   └── nemo-api-collection.json
├── docs/                      # Design documents
│   ├── architecture.md
│   ├── database-schema.md
│   ├── rest-api.md
│   └── uml-diagrams.md
├── build.gradle
├── settings.gradle
└── README.md
```

## Running the Backend

### Start the application

```bash
./gradlew :backend:bootRun
```

The application starts on **http://localhost:8080**.

### Development mode (DevMode)

DevMode allows you to log in with **any password** for existing users. This is useful for local development when you don't want to remember seed passwords.

```bash
./gradlew :backend:bootRun --args='--nemo.devmode=true'
```

When DevMode is active:
- The login page displays a **DEVMODE** badge and the password field accepts any input
- The `AuthController` bypasses password verification, authenticating by username only
- The main app top bar also shows a **DEVMODE** badge
- The public config endpoint (`/api/organization/public`) returns `devmode: true`

**Important:** DevMode is always `false` in the production profile (`application-prod.yml`). Never use DevMode in production.

### Version and Build Timestamp

The application version is defined in `application.yml` under `nemo.version` (currently `0.9.0`). Each build automatically generates a timestamp in `yyMMddHH` format (e.g., `26050315`) and passes it as a JVM system property (`-Dnemo.build`). The UI displays both together — e.g., `v0.9.0+26050315`.

The version is visible in:
- **Login page** — header bar
- **App sidebar** — next to the Nemo logo
- **App top bar** — page title

To change the version, update `nemo.version` in `backend/src/main/resources/application.yml` and `version` in `backend/build.gradle`.

### Default seed data

On startup (when the database is empty), the `DataSeeder` populates:

| Resource | Defaults |
|----------|----------|
| Companies | Netopia (NTO, order 1), Harmony (HRM, order 2), MyTeam (MTM, order 3), medERP (MER, order 4) |
| Organization Config | "Netopia Group" (global) |
| Issue Types | Project Management, Tech Lead, Architecture, Development, Data Analysis, Testing |
| Issue Statuses | To Do (default), In Progress, Done, Closed |
| Admin User | username: `admin`, password: `password123` |
| Other Users | `ismail` (Manager), `hanane` (Contributor), `wadii` (Executive), `ahmed` (Contributor), `karima` (Manager), `salim` (Executive), `younes` (Contributor) |

All seeded users have password `password123`.

### H2 Console

Access the H2 database console at **http://localhost:8080/h2-console**:

| Field | Value |
|-------|-------|
| JDBC URL | `jdbc:h2:file:./data/nemo-db` |
| Username | `sa` |
| Password | _(leave empty)_ |

### Resetting the database

Delete the H2 file to force a clean rebuild on next startup:

```bash
rm -f backend/data/nemo-db.mv.db
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173** and proxies API requests to the backend on port 8080.

## API Quick Reference

### Authentication

All endpoints except `/api/auth/login` and `/api/organization/public` require a valid session cookie (`JSESSIONID`).

```bash
# Login and save session cookie
curl -s -c cookies.txt http://localhost:8080/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Use -b cookies.txt for subsequent requests
curl -s -b cookies.txt http://localhost:8080/api/auth/me
```

### Key endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| GET | `/api/organization/public` | Public config (version, devmode, org info) — no auth required |
| GET/PUT | `/api/organization` | Organization config (Admin) |
| GET/POST | `/api/users` | User management (Admin) |
| GET/POST | `/api/companies` | Company management (Admin) |
| GET/POST/PUT/DELETE | `/api/issue-types` | Issue types (Admin write, all read) |
| GET/POST/PUT/DELETE | `/api/issue-statuses` | Issue statuses (Admin write, all read) |
| GET/POST | `/api/programs` | Program CRUD |
| GET/POST | `/api/projects` | Project CRUD + members + board + labels |
| GET/POST | `/api/projects/{id}/issues` | Issue CRUD + comments |
| GET/POST | `/api/projects/{id}/sprints` | Sprint management |
| GET | `/api/projects/{id}/backlog` | Backlog issues |
| GET/PUT | `/api/projects/{id}/board` | Kanban board config |
| GET/POST/PUT/DELETE | `/api/projects/{id}/raid` | RAID log items |
| GET | `/api/projects/{id}/evm` | Earned Value Management metrics |
| GET/POST | `/api/projects/{id}/phases` | Phase + deliverable management |
| POST | `/api/time-logs` | Log time |
| GET | `/api/timesheets/weekly` | Weekly timesheet |
| GET | `/api/reports/time-by-project` | Time reports |
| GET/POST | `/api/projects/{id}/wiki/pages` | Wiki CRUD |
| GET | `/api/projects/{id}/wiki/search` | Search wiki |
| GET | `/api/audit-logs` | Audit log (Admin) |

### Typical workflow

```bash
# 1. Login
curl -s -c cookies.txt localhost:8080/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# 2. Create a program
curl -s -b cookies.txt localhost:8080/api/programs \
  -X POST -H "Content-Type: application/json" \
  -d '{"name":"Engineering","key":"ENG","description":"Engineering program","managerId":1,"companyId":null}'

# 3. Create a project
curl -s -b cookies.txt localhost:8080/api/projects \
  -X POST -H "Content-Type: application/json" \
  -d '{"name":"Nemo","key":"NEMO","description":"Project management","programId":1,"managerId":1,"companyId":null,"memberIds":[1]}'

# 4. Create an issue
curl -s -b cookies.txt localhost:8080/api/projects/1/issues \
  -X POST -H "Content-Type: application/json" \
  -d '{"title":"Fix login bug","description":"Login fails on redirect","priority":"HIGH","typeId":4}'

# 5. Log time
curl -s -b cookies.txt localhost:8080/api/time-logs \
  -X POST -H "Content-Type: application/json" \
  -d '{"issueId":1,"hours":3.5,"logDate":"2026-04-24","description":"Fixed the bug"}'

# 6. View board
curl -s -b cookies.txt localhost:8080/api/projects/1/board
```

## Testing with Postman

### Import the collection

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `postman/nemo-api-collection.json`
4. The collection **Nemo API** appears in your collections

### Run the collection

In Postman, click **Run** on the collection. Requests must run in order because each request saves response data into collection variables used by subsequent requests.

**Variables set automatically during the run:**

| Variable | Set by | Used by |
|----------|--------|---------|
| `sessionId` | Login | All authenticated requests |
| `managerId` | Create Manager User | Project/Issue creation |
| `contributorId` | Create Contributor User | Issue assignment, timesheets |
| `programId` | Create Program | Project creation |
| `projectId` | Create Project | Issues, sprints, labels, wiki |
| `sprintId` | Create Sprint | Issue assignment |
| `issueId1`, `issueId2` | Create Issues | Comments, time logs |
| `bugLabelId`, `featureLabelId` | Create Labels | Issue creation |
| `reviewStatusId` | Create Custom Status | Board config update |
| `wikiPageId` | Create Wiki Page | Child page creation |

### What's tested

| Group | Tests |
|-------|-------|
| Auth | Login returns user + session, get current user, logout |
| Organization | Get/update config |
| Issue Types & Statuses | List defaults (6 types, 4 statuses), create custom type and status |
| Users | Create manager and contributor, list all users |
| Programs | Create program, list programs, get by ID |
| Projects | Create project with members, verify board auto-generated, add custom board column |
| Labels | Create bug and feature labels |
| Sprints | Create sprint, activate it, list sprints |
| Issues | Create 2 issues with labels, list, get by ID, update status, add comment, list comments, filter by priority |
| Time Tracking | Log time on 2 issues, list time logs, weekly timesheet, project report |
| Wiki | Create root page, child page, get tree, search |
| Audit Logs | List entries |
| Error Handling | 401 (no auth), 403 (wrong role), 404 (not found), 409 (duplicate key) |

## Testing with Newman (CLI)

If you prefer automated CLI testing:

```bash
# Install Newman
npm install -g newman

# Start the backend first
./gradlew :backend:bootRun &

# Wait for startup, then run the collection
sleep 15
newman run postman/nemo-api-collection.json

# Stop the backend when done
kill %1
```

Newman outputs a summary with pass/fail counts for each request and assertion.

## Database Portability

Column names that conflict with SQL reserved words use an underscore suffix (`key_`, `order_`, `role_`, `type_`, `action_`). The `user` table is named `app_user` and the `comment` table is `issue_comment`. This makes the schema portable across H2, PostgreSQL, MySQL, and SQL Server.

## Production Profile

To run with PostgreSQL instead of H2:

```bash
# Set environment variables
export NEMO_DB_URL=jdbc:postgresql://localhost:5432/nemo
export NEMO_DB_USERNAME=nemo_user
export NEMO_DB_PASSWORD=your_password

# Run with prod profile
./gradlew :backend:bootRun --args='--spring.profiles.active=prod'
```

The prod profile disables H2 console, DevMode, and SQL seed data; switches to PostgreSQL; and uses `ddl-auto=validate` (no auto-schema creation — use migration tools like Flyway).

## Design Documents

| Document | Description |
|----------|-------------|
| [docs/architecture.md](architecture.md) | High-level system architecture, monorepo structure, security, real-time, storage |
| [docs/database-schema.md](database-schema.md) | Full database schema with 18+ tables, relationships, indexes, cascade rules |
| [docs/rest-api.md](rest-api.md) | Complete REST API design with 18+ endpoint groups, request/response examples |
| [docs/uml-diagrams.md](uml-diagrams.md) | 7 Mermaid UML diagrams (class, use case, state, sequence, component) |