---
type: Charter/Module
resource: backend/src/main/java/com/nemo/program
---

# Program module

`program/` manages Programs, which group related projects (often within a company). Programs feed the portfolio roll-up.

## API

`ProgramController` exposes `/api/programs` for program CRUD.

## Cross-references

- [Portfolio module](/charter/modules/delivery/portfolio-module.md) — roll-up across programs/projects.
- [Project module](/charter/modules/delivery/project-module.md) — projects can be grouped under a program.
- [Delivery module entities](/charter/modules/delivery/module-entities.md) — `Program` entity.