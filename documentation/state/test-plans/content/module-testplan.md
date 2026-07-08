---
type: State/Playbook
resource: docs/test-plan.md
---

# Content module — test plan

Backend unit, integration, and E2E tests for the `content` group (`documentation/`, `attachment/`, `asset/`, `location/`), compiled from the legacy `docs/test-plan.md`. The backend currently ships **no** test files; this is the planned coverage. Shared infrastructure and the global strategy live in [the test plan](/charter/testing-strategy.md).

> **Coverage gap:** the legacy plan documents the wiki (`WikiPageService`, wiki endpoints) and attachment upload limits. The `asset/` and `location/` submodules have **no** test cases in the legacy plan — coverage to be added.

## Unit — service layer

| Service | ID | Test case | Expected behavior |
|---------|----|-----------|-------------------|
| WikiPageService | WS-1 | Create page generates slug from title | "My Page Title" → slug "my-page-title" |
| WikiPageService | WS-2 | Duplicate slug within project rejected | throws DuplicateKeyException |
| WikiPageService | WS-3 | Tree structure via parentId | Root pages have null parentId; children reference parent |

## Integration — wiki endpoints

| ID | Method | Endpoint | Auth | Expected Status | Notes |
|----|--------|----------|------|-----------------|-------|
| WIK-1 | GET | `/api/projects/{id}/wiki/pages` | Member | 200 | Returns page tree |
| WIK-2 | GET | `/api/projects/{id}/wiki/pages` | Non-member | 403 | Forbidden |
| WIK-3 | POST | `/api/projects/{id}/wiki/pages` | Member | 200 | Wiki page created, slug auto-generated |
| WIK-4 | POST | `/api/projects/{id}/wiki/pages` | Member | Duplicate slug | 409 | Conflict |
| WIK-5 | PUT | `/api/projects/{id}/wiki/pages/{pageId}` | Member | 200 | Page updated |
| WIK-6 | DELETE | `/api/projects/{id}/wiki/pages/{pageId}` | ADMIN | 200 | Page deleted |
| WIK-7 | DELETE | `/api/projects/{id}/wiki/pages/{pageId}` | CONTRIBUTOR | 403 | Forbidden |
| WIK-8 | GET | `/api/projects/{id}/wiki/search?q=term` | Member | 200 | Returns search hits |

## Manual E2E

| ID | Flow | Steps | Pass criteria |
|----|------|-------|---------------|
| E2E-13 | Create wiki page | 1. Go to Docs tab 2. Click + 3. Enter title/content with markdown 4. Save | Page appears in tree, markdown rendered correctly |
| E2E-14 | Mermaid diagram | 1. Create wiki page with mermaid code block 2. Save | Diagram rendered visually |
| E2E-27 | Large file upload | 1. Upload > 10MB attachment | Rejected with clear error |

## Cross-references

- [Content module entities](/charter/modules/content/module-entities.md) — entities under test.
- [Test plan](/charter/testing-strategy.md) — global strategy, infrastructure, and test data.
- [Postman collection](/state/postman-collection.md) — the API test asset.