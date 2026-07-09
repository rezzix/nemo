---
type: State/System
resource: docs/getting-started.md
---

# Getting started

How to run Nemo locally, distilled from the legacy `docs/getting-started.md`. The repository layout is in [monorepo structure](/charter/overview/monorepo-structure.md); the [tech stack](/charter/overview/tech-stack.md) lists versions.

## Prerequisites

- **Java 21+** (tested with Java 25)
- **Gradle 9+** (or the included wrapper)
- **Node.js 18+** (only if running Newman / the frontend dev server)

## Running the backend

```bash
./gradlew :backend:bootRun
```

The application starts on **http://localhost:8080**.

### Run modes (`nemo.mode`)

| Mode | Seeded data | Auth | Use case |
|------|------------|------|----------|
| `dev` | Dev company names (SIGroup, Sione, Partion, Sportfull, Medocode) | Relaxed (any password, no captcha) | Local development |
| `demo` | Prod company names (Netopia, Harmony, MyTeam, medERP) | Relaxed (any password, no captcha) | Demonstrations |
| `prod` | No seed data | Strict (password + captcha required) | Production |

```bash
# Development mode (default)
./gradlew :backend:bootRun

# Demo mode
./gradlew :backend:bootRun --args='--nemo.mode=demo'

# Production mode
./gradlew :backend:bootRun --args='--nemo.mode=prod'
```

In `dev`/`demo` mode the login page shows a **DevMode**/**DemoMode** badge, the password field accepts any input, `AuthController` authenticates by username only, the top bar shows the mode badge, and `/api/organization/public` returns `"mode": "dev"`/`"demo"`. In `prod` mode no seed data is created and strict authentication is enforced. See [authentication](/charter/security/authentication.md).

### Version and build timestamp

The version is `nemo.version` in `application.yml` (currently `0.9.0`). Each build generates a timestamp in `yyMMddHH` format (e.g. `26050315`) passed as `-Dnemo.build`; the UI shows both together — e.g. `v0.9.0+26050315` — on the login header, sidebar, and top bar. To change the version, update `nemo.version` in `backend/src/main/resources/application.yml` and `version` in `backend/build.gradle`.

### Default seed data

On startup (empty DB, `dev`/`demo` mode) `DataSeeder` populates:

| Resource | Defaults |
|----------|----------|
| Companies | Netopia (NTO, order 1), Harmony (HRM, order 2), MyTeam (MTM, order 3), medERP (MER, order 4) |
| Organization config | "Netopia Group" (global) |
| Task types | Project Management, Tech Lead, Architecture, Development, Data Analysis, Testing |
| Task statuses | To Do (default), In Progress, Done, Closed |
| Admin user | `admin` / `password123` |
| Other users | `ismail` (Manager), `hanane` (Contributor), `wadii` (Executive), `ahmed` (Contributor), `karima` (Manager), `salim` (Executive), `younes` (Contributor) |

All seeded users have password `password123`.

### H2 console

Access the H2 console at **http://localhost:8080/h2-console**:

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

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173** and proxies API requests to the backend on port 8080. See [frontend architecture](/charter/overview/frontend-architecture.md).

## Production profile (PostgreSQL)

```bash
export NEMO_DB_URL=jdbc:postgresql://localhost:5432/nemo
export NEMO_DB_USERNAME=nemo_user
export NEMO_DB_PASSWORD=your_password
./gradlew :backend:bootRun --args='--spring.profiles.active=prod'
```

The prod profile disables the H2 console, enforces strict authentication, skips seed data, switches to PostgreSQL, and uses `ddl-auto=validate` (no auto-schema creation — use a migration tool like Flyway). See [database schema](/charter/overview/database-schema.md).

## Cross-references

- [Nemo system](/charter/overview/nemo-system.md) — deployment model and run modes.
- [Monorepo structure](/charter/overview/monorepo-structure.md) — repository layout.
- [API index](/state/api/index.md) — endpoint groups and REST conventions.
- [Testing index](/state/index.md) — Postman/Newman collection.
- [Database schema](/charter/overview/database-schema.md) — schema, profiles, naming, portability.