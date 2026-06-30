---
type: Module
resource: backend/src/main/java/com/nemo/program
---

# Program module

`program/` manages Programs, which group related projects (often within a company). Programs feed the portfolio roll-up.

## API

`ProgramController` exposes `/api/programs` for program CRUD.

## Cross-references

- [Portfolio module](/modules/delivery/portfolio-module.md) — roll-up across programs/projects.
- [Project module](/modules/delivery/project-module.md) — projects can be grouped under a program.
- [Delivery module entities](/modules/delivery/module-entities.md) — `Program` entity.