---
type: Module
resource: backend/src/main/java/com/nemo/attachment
---

# Attachment module

`attachment/` manages file attachments; actual bytes go through the [pluggable storage service](/implementation/cross-cutting/file-storage.md) (`FilesystemStorageService` by default, S3-swappable).

## Cross-references

- [File storage](/implementation/cross-cutting/file-storage.md) — the storage abstraction.
- [Task module](/modules/delivery/task-module.md), [Documentation module](/modules/content/documentation-module.md) — attachable entities.
- [Content module entities](/modules/content/module-entities.md) — `Attachment` entity.