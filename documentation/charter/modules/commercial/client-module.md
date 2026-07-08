---
type: Charter/Module
resource: backend/src/main/java/com/nemo/client
---

# Client module

`client/` manages clients and their contact people.

## Entities

`Client`, `ClientContact` — see [Commercial module entities](/charter/modules/commercial/module-entities.md) for fields and ER diagram.

## API

`ClientController` at `/api/clients` for client + contact CRUD.

## Cross-references

- [Presale module](/charter/modules/commercial/presale-module.md) — opportunities are tied to clients.
- [Phase module](/charter/modules/delivery/phase-module.md) — `ClientPayment` references clients.
- [Project module](/charter/modules/delivery/project-module.md) — projects can be associated with clients.