---
type: Charter/Module
resource: backend/src/main/java/com/nemo/leave
---

# Leave module

`leave/` manages time-off: leave requests, entitlements, and balances.

## API

`LeaveRequestController` at `/api/leave-requests`.

## Cross-references

- [User module](/charter/modules/identity/user-module.md) — leave belongs to users.
- [HR module entities](/charter/modules/hr/module-entities.md) — `LeaveRequest`, `LeaveEntitlement`.