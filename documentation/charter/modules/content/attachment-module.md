---
type: Charter/Module
resource: backend/src/main/java/com/nemo/attachment
---

# Attachment module

`attachment/` manages file attachments; actual bytes go through the [pluggable storage service](/charter/implementation/cross-cutting/file-storage.md) (`FilesystemStorageService` by default, S3-swappable).

## Cross-references

- [File storage](/charter/implementation/cross-cutting/file-storage.md) — the storage abstraction.
- [Task module](/charter/modules/delivery/task-module.md), [Documentation module](/charter/modules/content/documentation-module.md) — attachable entities.
- [Content module entities](/charter/modules/content/module-entities.md) — `Attachment` entity.