# SETHU Historical Member Migration

A controlled historical member migration module for the **SETHU platform**, built using ASP.NET Core and PostgreSQL.

This module is designed to migrate legacy member records into the SETHU platform through a structured process involving data staging, validation, reconciliation, dual-authority approval, member activation, and migration auditing.

The implementation preserves the existing SETHU application architecture instead of introducing a completely new architecture.

---

## Project Overview

Historical Member Migration helps administrators migrate existing member records from legacy systems into the SETHU platform while maintaining data integrity, authorization, and auditability.

The migration process is designed to prevent duplicate member creation, unauthorized activation, incorrect identity mapping, and unsupported payment records.

Each migration batch follows a controlled workflow before historical members can become active platform members.

## Key Features

- **Legacy Data Staging** – Import historical member records into a staging table before migration.
- **Data Validation** – Validate source records and migration readiness.
- **Roster Integrity** – Verify the source CSV digest and roster checksum.
- **Duplicate Detection** – Identify existing member and user identity conflicts.
- **Identity Reconciliation** – Hold existing identity matches for administrator-assisted review.
- **Dual Authority Approval** – Require separate chapter and finance attestations.
- **Controlled Activation** – Activate members only after the required approvals.
- **Finance Reconciliation** – Maintain editable historical payment reconciliation mappings.
- **Migration Auditing** – Track migration operations and approval activities.
- **Post-Migration Verification** – Verify migrated records and related platform data.

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | C# |
| Framework | ASP.NET Core |
| API Architecture | REST API |
| Database | PostgreSQL |
| ORM | Entity Framework Core |
| API Documentation | Swagger / OpenAPI |
| Frontend | React.js, TypeScript |
| State Management | Redux |
| UI | Tailwind CSS, Shadcn UI |
| Version Control | Git and GitHub |

> The exact framework and package versions should be confirmed from the project files before deployment.

## Existing Application Architecture

The migration module follows the existing SETHU backend structure.

```text
SETHU
│
├── backend
│   └── src
│       ├── Sethu.Api
│       ├── Sethu.Service
│       ├── Sethu.Domain
│       ├── Sethu.Contracts
│       └── Sethu.Infrastructure
│
├── frontend
│   └── Existing SETHU frontend applications
│
└── database
    └── historical
        ├── 00_source_20_members.sql
        ├── 01_legacy_schema.sql
        ├── 03_ratification_upgrade.sql
        ├── 04_preflight.sql
        └── 05_postflight.sql
```

The migration module uses the existing SETHU application layers and database rather than replacing the existing backend architecture.

## Migration Workflow

The migration follows a controlled sequence.

```text
Legacy Member Data
        |
        v
Data Staging
        |
        v
Source Validation
        |
        v
Migration Preparation
        |
        v
Chapter Attestation
        |
        v
Finance Attestation
        |
        v
Reconciliation Review
        |
        v
Member Activation
        |
        v
Post-Migration Verification
```

### 1. Data Staging

Legacy member records are imported into the staging table.

Before proceeding, the migration process verifies:

- Source records are available.
- Expected records are present.
- Duplicate source records are identified.
- Source data integrity is maintained.

### 2. Migration Preparation

The preparation process validates the migration batch and its source data.

The server checks the expected CSV digest and staged records before allowing the batch to proceed.

### 3. Chapter Attestation

An authorized chapter officer reviews and attests to the chapter-related migration information.

### 4. Finance Attestation

A separate authorized finance officer reviews the financial and historical membership information.

Chapter and finance attestations must be performed by different authorized officers.

### 5. Reconciliation Review

The migration process identifies possible conflicts, including:

- Existing member records.
- Existing user identities.
- Duplicate membership information.
- Historical payment reconciliation issues.

Conflicting identities must be reviewed instead of automatically merging accounts.

### 6. Member Activation

Member activation is allowed only after the required validation, authorization, and approval conditions are satisfied.

### 7. Post-Migration Verification

After activation, the migration results must be checked using the postflight verification process.

The verification includes checking for duplicate records and confirming that member and chapter information is available through the relevant platform APIs.

---

## Authorization and Approval Model

The migration workflow uses six effective permission types:

| Permission | Purpose |
|---|---|
| `read` | View migration information |
| `prepare` | Prepare a migration batch |
| `chapter_attest` | Approve chapter-related information |
| `finance_attest` | Approve finance-related information |
| `activate` | Authorize member activation |
| `finance_reconcile` | Perform finance reconciliation |

These permissions must be assigned through the trusted institutional authority workflow.

Incoming claims alone must not be treated as sufficient authorization.

The implementation must also validate tenant scope, officer authority, and separation of duties.

## Historical Payment Handling

Historical payment information requires special care.

The provisional payment UUID assigned to a legacy record is a reconciliation reference. It is not automatically a verified bank receipt or a canonical payment record.

The migration process must:

- Preserve the original provisional payment reference.
- Allow authorized reconciliation of actual payment evidence.
- Maintain versioned reconciliation changes.
- Avoid creating fabricated payment records.
- Avoid generating unsupported membership periods.

Historical membership eligibility and actual bank payment verification are separate concepts.

## Database Migration Scripts

The historical migration database scripts are organized under:

`database/historical/`

| Script | Purpose |
|---|---|
| `00_source_20_members.sql` | Stage the historical source member records |
| `01_legacy_schema.sql` | Review the required legacy schema |
| `03_ratification_upgrade.sql` | Apply the ratification-related schema upgrade |
| `04_preflight.sql` | Check migration readiness and possible conflicts |
| `05_postflight.sql` | Verify migration results |

### Important Database Notes

- Always take a database backup before applying changes.
- Test against an isolated database copy first.
- Run the source staging script only once for the relevant batch.
- Do not run `00_existing_stage.sql` if the staging data already exists.
- Review schema changes before applying them.
- Apply schema changes through the approved database migration process.
- Do not overwrite an existing production database.

## Getting Started

### Prerequisites

Install the following tools before running the application:

- .NET SDK matching the backend target framework.
- PostgreSQL.
- Node.js and npm.
- Visual Studio Code or Visual Studio.
- Git.
- Postman or Swagger for API testing.

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Navigate into the project:

```bash
cd SETHU-Historical-Member-Migration
```

### 2. Configure the Backend

Navigate to the backend API project:

```bash
cd backend/src/Sethu.Api
```

Configure the PostgreSQL connection string using the configuration key expected by the application.

Keep database credentials and other sensitive values outside the source-controlled repository.

### 3. Restore Backend Dependencies

```bash
dotnet restore
```

### 4. Build the Backend

```bash
dotnet build
```

Resolve any build errors before starting the application.

### 5. Run the Backend

```bash
dotnet run
```

Use the API URL printed by the application.

If Swagger is enabled in the current environment, use its configured URL to inspect and test the available API endpoints.

### 6. Configure the Frontend

Navigate to the relevant frontend application directory.

Install its dependencies:

```bash
npm install
```

Run the development script defined in that application's `package.json`.

> Frontend commands and environment variable names should be taken from the respective application's configuration.

## Database Setup and Safety

For local testing, use a separate PostgreSQL database.

Recommended process:

1. Back up the existing database.
2. Restore the backup into an isolated test database.
3. Verify the existing SETHU tables and relationships.
4. Check whether the historical staging table already exists.
5. Review the historical migration scripts.
6. Apply approved schema changes.
7. Run preflight checks.
8. Execute the migration workflow.
9. Run postflight verification.

Never run an unverified migration directly against the production database.

## Testing

The migration workflow should be tested against an isolated PostgreSQL database.

Important test scenarios include:

- Valid historical member records.
- Missing or invalid source records.
- Duplicate member records.
- Existing user identity conflicts.
- Invalid tenant or chapter references.
- Unauthorized migration requests.
- Missing chapter attestation.
- Missing finance attestation.
- Same officer attempting both attestations.
- Invalid source digest.
- Repeated activation requests.
- Duplicate activation prevention.
- Historical payment reconciliation.
- Post-migration API verification.

Testing should cover both successful and failed migration scenarios.

## Security Considerations

Security and data integrity are important parts of historical migration.

- Use authenticated and authorized API access.
- Validate permissions on the server.
- Do not trust frontend-only authorization checks.
- Do not grant migration permissions based only on incoming claims.
- Enforce tenant-level data isolation.
- Keep chapter and finance approval responsibilities separate.
- Do not automatically merge existing user accounts by email.
- Maintain audit information for important migration operations.
- Never commit production credentials, API secrets, or database connection strings.
- Never publish real member personal information or production database backups.

## Current Development Status

<details>
<summary>Development status and pending work</summary>

This project is under development and requires additional validation before production deployment.

The following areas require further implementation or verification:

- Refactor activation logic to use canonical domain methods and the shared outbox pattern instead of direct SQL inserts.
- Complete chapter-level authorization and delegation checks.
- Implement separation-of-duties and approval conflict checks.
- Reconcile the historical SQL schema with the Entity Framework Core migration lifecycle.
- Complete administrator-assisted identity reconciliation.
- Integrate the historical migration page into the existing Platform Admin navigation and permission system.
- Complete real PostgreSQL transaction and integration testing.
- Verify session, CSRF, and API security integration.
- Complete regression testing for existing member and platform workflows.

The migration must not be considered production-ready until these release blockers are resolved and validated.

</details>

## Future Improvements

- Complete the historical migration administration interface.
- Improve migration batch monitoring.
- Add detailed reconciliation reports.
- Improve migration audit reporting.
- Complete automated integration tests.
- Improve error reporting and recovery workflows.
- Complete production authorization and transaction safeguards.

## Contribution

Contributions and improvements are welcome.

Before submitting changes:

1. Understand the existing SETHU architecture.
2. Avoid unnecessary changes to existing application layers.
3. Follow the existing coding conventions.
4. Test database changes against an isolated database.
5. Validate authorization and data integrity.
6. Provide a clear description of the changes in the pull request.

## License

No open-source license has been specified for this repository. Add an appropriate license before distributing or reusing the project.

---

**SETHU Historical Member Migration**

<<<<<<< HEAD
A controlled approach to migrating historical member data with validation, authorization, reconciliation, and auditability.
=======
A controlled approach to migrating historical member data with validation, authorization, reconciliation, and auditability.
>>>>>>> b971da12e0e1c1b337756378ab46e3d5bffcc539
