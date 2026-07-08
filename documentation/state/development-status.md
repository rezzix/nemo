---
type: State/Section
---

# Development status

Per-module-group implementation status, derived from the live backend source tree (`backend/src/main/java/com/nemo/`). **Done** = entity + service + controller present; **thin** = only part of the layering implemented; **absent** = no backend package.

## Identity — Done

`company/` (Company, CompanyService, CompanyController) and `user/` (User, UserService, UserController). Frontend: `PeoplePage`, `UserDetailPage`.

## Cross-cutting — Done

`common/` (activity, audit, dto, exception, storage subpackages), `config/` (OrganizationConfig, PublicHoliday, TaskStatus, TaskType, DataSeeder — 16 files), `security/` (AuthController, CaptchaService, AuthHelper, CustomUserDetails).

## Delivery — Done

`program/`, `project/` (20 files: BoardColumn, Label, ProjectFavorite, …), `task/` (Task, Comment), `sprint/` (Sprint, BacklogController), `phase/` (Phase, Deliverable, ClientPayment — 18 files), `pmo/` (RaidItem, PmoService, EVM metrics). `portfolio/` is **thin** — only `PortfolioController` (aggregation, no own entity or service).

## Commercial — Done

`client/` (Client, ClientContact), `presale/` (PreSale), `expense/` (ProjectExpense), `payment/` (ProjectPayment). Frontend: `ClientsPage`, `PreSalesPage`.

## Finance — Mostly done

`bankaccount/`, `bankstatement/`, `banktransaction/` (full CRUD), `finance/` (FinanceController + FinanceService — dashboard orchestration, no own entity), `reconciliation/` (ReconciliationController + Service). `reports/` is **thin** — only `ReportController`. Frontend: `BankAccountsPage`, `FinanceBankDashboardPage`, `ReconciliationPage`, `FinancePage`.

## HR — Partial

`leave/` (LeaveRequest, LeaveEntitlement — 12 files). `evaluation/` is **absent** — a planned stub documented in [HR module entities](/charter/modules/hr/module-entities.md); no backend package exists yet.

## Content — Done

`documentation/` (WikiPage), `attachment/` (Attachment), `asset/` (Asset), `location/` (Location). Frontend: `AssetsPage`.

## Time tracking — Done

Implemented as a single `timetracking/` package covering all four submodules: `TimeLog` (+ mapper/repository/service/controller), `UserRate` (+ mapper/repository/service), plus `TimesheetController`, `TimeReportController`, `ReportController`. There are no separate per-submodule packages. Frontend: `MyTimePage`, `TimesheetsPage`.

## Test coverage — Not started

`backend/src/test/java/` contains no `.java` files. Every per-module test plan under [test plans](/state/test-plans/index.md) describes *planned* coverage, not implemented tests. The shared strategy and infrastructure they cross-reference live in [testing strategy](/charter/testing-strategy.md).