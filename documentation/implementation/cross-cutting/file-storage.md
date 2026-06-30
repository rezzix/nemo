---
type: Pattern
resource: backend/src/main/java/com/nemo/common/storage
---

# File storage

`StorageService` (interface in `common/storage`) abstracts file `store`/`load`/`delete`. The default `FilesystemStorageService` writes to a configurable local directory; swapping to S3 later means implementing the same interface — no business-logic changes. Attachments reference stored files via the `Attachment` entity.

## Cross-references
- [Common module](/modules/cross-cutting/common-module.md) — owns the storage package.
- [Attachment module](/modules/content/attachment-module.md) — the consumer of storage.