---
type: Module
resource: backend/src/main/java/com/nemo/timetracking
---

# User rate

`UserRate` holds billable/cost rates per user, used to value time logs and feed billing-aware reporting.

## Entities

`UserRate`.

## API

`UserRateController` at `/api/user-rates`.

## Cross-references

- [Time tracking module](/modules/timetracking/index.md) — parent module.
- [User module](/modules/identity/user-module.md) — rates belong to users.