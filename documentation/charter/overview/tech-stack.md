---
type: Charter/Reference
resource: backend/build.gradle
---

# Tech stack

## Backend (`backend/build.gradle`)

| Concern | Choice |
|---------|--------|
| Language | Java 21 |
| Framework | Spring Boot 3.4.5 |
| Web | spring-boot-starter-web |
| Persistence | spring-boot-starter-data-jpa (Hibernate) |
| Security | spring-boot-starter-security |
| Validation | spring-boot-starter-validation (Hibernate Validator) |
| Real-time | spring-boot-starter-websocket (STOMP) |
| DB (dev) | H2 file-based (`./data/nemo-db`, console at `/h2-console`) |
| DB (prod) | PostgreSQL via `NEMO_DB_URL`/`NEMO_DB_USERNAME`/`NEMO_DB_PASSWORD` |
| DTO mapping | MapStruct 1.6.3 + lombok-mapstruct-binding |
| PDF | Apache PDFBox 3.0.4 (bank statement text extraction) |
| Build | Gradle wrapper, group `com.nemo`, version `0.9.0` |

DDL is entity-driven (`ddl-auto: update` dev / `validate` prod) with idempotent seed data in `data.sql`.

## Frontend (`frontend/package.json`)

| Concern | Choice |
|---------|--------|
| Framework | React 19.2 |
| Language | TypeScript ~6.0 |
| Build | Vite 8 + @vitejs/plugin-react 6 |
| Styling | Tailwind CSS v4 (@tailwindcss/vite, @tailwindcss/typography) |
| Routing | react-router-dom 7.14 |
| State | Zustand 5 |
| HTTP | Axios |
| Markdown/diagrams | Mermaid 11, react-markdown 10, remark-gfm, rehype-sanitize, dompurify |
| Lint | ESLint + typescript-eslint, react-hooks, react-refresh plugins |

## Cross-references

- [Frontend architecture](/charter/overview/frontend-architecture.md) — how these are arranged.
- [Monorepo structure](/charter/overview/monorepo-structure.md) — repo layout.