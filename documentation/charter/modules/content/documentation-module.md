---
type: Charter/Module
resource: backend/src/main/java/com/nemo/documentation
---

# Documentation (wiki) module

`documentation/` implements project wiki pages via `WikiPage`, a self-referencing (parent → children) entity forming a nested tree. The frontend renders pages as Markdown with Mermaid diagrams (react-markdown + Mermaid 11).

## API

Wiki endpoints live under `/api/projects/{projectId}/.../wiki` (see [project-task endpoints](/state/api/project-task-endpoints.md)).

## Cross-references

- [Project module](/charter/modules/delivery/project-module.md) — wiki pages attach to a project.
- [Attachment module](/charter/modules/content/attachment-module.md) — files can attach to wiki content.
- [Frontend architecture](/charter/overview/frontend-architecture.md) — Markdown rendering.
- [Content module entities](/charter/modules/content/module-entities.md) — `WikiPage` entity.