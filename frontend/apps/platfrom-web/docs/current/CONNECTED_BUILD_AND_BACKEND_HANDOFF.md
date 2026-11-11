# Connected Build and Backend Handoff

## Connected UI build gate

When npm registry access is available, perform the following without changing public component APIs:

1. `npm ci`
2. add approved locked versions of `lucide-react`, `tabulator-tables`, and the chosen Tailwind build integration;
3. replace the internal Lucide adapter implementation while preserving `LucideIcon` call sites;
4. replace the Tabulator host bridge with the package import while preserving semantic fallback;
5. run `npm run typecheck`;
6. run `npm run build`;
7. run browser tests across 320/375/430/768/1024/1440 widths;
8. run keyboard/focus/dialog/accessibility checks;
9. promote the 14 `IMPLEMENTED_PENDING_RUNTIME_TEST` routes only after actual browser evidence.

## Backend handoff order

1. Identity/session.
2. Organisation hierarchy and temporal assignments.
3. Permissions/RBAC and Effective Access.
4. RACI/SoD.
5. Configuration/inheritance/releases.
6. Taxonomy/master/reference.
7. Form/workflow definitions.
8. Workflow runtime/SLA/calendar.
9. Audit/idempotency/outbox.
10. Notifications/integrations/jobs/data quality/corrections.
11. Security/privacy/handoffs.
12. Member/Organisation/Governance consumer integrations.

## Non-negotiable ownership boundary

Platform Administration owns technical definitions/control rules. Member, Organisation and Governance own their respective business records and transactional state. Cross-workspace communication uses identifiers, events, governed handoffs and versioned contracts; it must not duplicate canonical business records into Platform Administration.
