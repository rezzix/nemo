---
type: Playbook
resource: docs/test-plan.md
---

# Test plan

The authoritative source is the legacy `docs/test-plan.md`. The per-module detail has been split into one `module-testplan.md` per module group (below); this file holds the shared strategy, infrastructure, and test data they all reference.

Current state:

- **Backend unit/integration tests** — the `src/test/java/com/jari/` tree exists but contains no `.java` files; there are currently no backend tests.
- **API testing** — exercised via the [Postman/Newman collection](/testing/postman-collection.md).
- **Frontend** — ESLint (`npm run lint`) and `tsc -b` type-check during `npm run build`; component/unit tests are planned (Vitest), see the [cross-cutting module test plan](/modules/cross-cutting/module-testplan.md).

## Test strategy overview

Four levels, run at different frequencies:

| Level | Scope | Tooling | Run frequency |
|-------|-------|---------|---------------|
| Unit | Individual functions, mappers, services | JUnit 5 + Mockito (backend), Vitest (frontend) | Every commit |
| Integration | API endpoints with DB, security, validation | Spring Boot Test + `@WebMvcTest` | Every commit |
| API contract | Full HTTP request/response against running server | Newman / Postman collection | Pre-merge |
| Manual E2E | Browser-based flows | Human testing checklist | Pre-release |

## Backend test infrastructure

`spring-boot-starter-test` and `spring-security-test` are already in `build.gradle` with `useJUnitPlatform()`. Add Testcontainers for realistic DB integration tests:

```groovy
testImplementation 'org.testcontainers:testcontainers:1.21.0'
testImplementation 'org.testcontainers:postgresql:1.21.0'
testImplementation 'org.testcontainers:junit-jupiter:1.21.0'
```

Test profile `src/test/resources/application-test.yml`:

```yaml
nemo:
  mode: test
  version: 0.0.0-test
  build: test

spring:
  datasource.url: jdbc:h2:mem:testdb
  datasource.driver-class-name: org.h2.Driver
  datasource.username: sa
  datasource.password: ''
  jpa.hibernate.ddl-auto: create-drop
  h2.console.enabled: false
  sql.init.mode: never
  servlet.multipart.max-file-size: 10MB
  servlet.multipart.max-request-size: 10MB

storage.filesystem.base-path: ./test-attachments
```

A base test class seeds authenticated users (admin/manager/contributor/external) and exposes a `MockMvc` auth helper:

```java
@ActiveProfiles("test")
@AutoConfigureMockMvc
@SpringBootTest
public abstract class IntegrationTestBase {
    @Autowired protected MockMvc mockMvc;
    @Autowired protected UserRepository userRepository;
    @Autowired protected PasswordEncoder passwordEncoder;

    protected Long adminUserId, managerUserId, contributorUserId, externalUserId;

    @BeforeEach
    void seedUsers() {
        // admin (ADMIN, no company), manager (MANAGER, companyId=1),
        // contributor (CONTRIBUTOR, companyId=1), external (EXTERNAL, assigned to a project)
    }

    protected MockHttpServletRequestBuilder authenticated(Long userId, String username) {
        // set up session-based auth for MockMvc requests
    }
}
```

## Test data strategy

Use the existing `DataSeeder` for integration tests that need a populated database; create minimal data inline for isolated unit tests:

- **ADMIN** — `testadmin` / `password123`, no company.
- **MANAGER** — `testmanager` / `password123`, company=NTO.
- **CONTRIBUTOR** — `testcontrib` / `password123`, company=NTO.
- **EXTERNAL** — `testexternal` / `password123`, assigned to a test project.

Frontend tests mock API responses with consistent fixture objects (e.g. a `mockAdminUser` `UserDto`).

## Maintenance

- Run tests on every commit via CI.
- Fix broken tests immediately — never merge with failing tests.
- Update tests when API contracts change — keep the Newman collection and unit tests in sync.
- Review coverage weekly — identify untested code paths.
- Prune flaky tests — if a test fails intermittently, fix or remove it.

## Per-module test plans

Each module group folder holds a `module-testplan.md` with the unit, integration, frontend, and E2E cases for its submodules, compiled from the legacy plan:

* [Cross-cutting module test plan](/modules/cross-cutting/module-testplan.md) — auth, captcha, RBAC, org config, task types/statuses, audit, error handling, frontend infra.
* [Identity module test plan](/modules/identity/module-testplan.md) — user and company endpoints.
* [Delivery module test plan](/modules/delivery/module-testplan.md) — program, project, task, sprint, PMO/RAID.
* [Commercial module test plan](/modules/commercial/module-testplan.md) — *planned* (client, expense, payment).
* [Finance module test plan](/modules/finance/module-testplan.md) — *planned* (banks, reconciliation).
* [HR module test plan](/modules/hr/module-testplan.md) — *planned* (leave, evaluation).
* [Time tracking module test plan](/modules/timetracking/module-testplan.md) — time logs, timesheets, reports.
* [Content module test plan](/modules/content/module-testplan.md) — wiki, attachment.

## Cross-references

- [Postman collection](/testing/postman-collection.md) — the API test asset.
- [Tech stack](/overview/tech-stack.md) — lint/build tooling.
- [Backend layering](/overview/backend-layering.md) — the Controller/Service/Repository tiers under test.