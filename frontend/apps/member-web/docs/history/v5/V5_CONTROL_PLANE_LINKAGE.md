# V5 Control-Plane Linkage Report

V5 implements Platform Administration as a runtime control plane rather than an isolated configuration catalogue.

## Linkage rule

`Configuration → Validation → Impact → Independent Approval → Activation → Runtime Resolver/Adapter → Functional Effect → Notification/Audit`

| Functional area | Platform Administration control | Runtime link |
|---|---|---|
| Identity | Permission catalogue, role/policy rules | Authorization middleware protects identity actions; denied sensitive actions create security events |
| Member / Business | Module/permission, forms, privacy settings, taxonomy | Existing V4 member/business domain remains source of business state; V5 selectors/configuration govern allowed/admin-configurable behavior |
| Directory | Module registry, taxonomy, matching policy, feature flags | Directory matching reads V5 matching/taxonomy policy |
| Affiliations / Certification | Workflow, RACI, moderation, taxonomy | V4 governed affiliation/certification workflows remain active and consume synced workflow/RACI/taxonomy state |
| Connections / References / Transactions / Meetings | Notification catalogue/routes/templates, action policy metadata | Domain events/notifications use configured V5 routing/templates while V4 lifecycle reducers remain compatible |
| Opportunities / Responses | Forms, taxonomy, workflow, notifications, matching | Opportunity runtime uses configurable requirement forms/Q&A and configured notification behavior |
| Messaging / Announcements | Notification policy/settings | Existing V4 communication domain retained; notification event routing is centralised |
| Events / Polls | Form Builder, taxonomy, notification routes | Event registration consumes governed form definitions/version metadata |
| Visitor / Due diligence / Activation | Forms, workflow, RACI, SLA, numbering | Workflow/Form adapters preserve V4 onboarding contracts while V5 definitions can govern new instances |
| Attendance | Workflow, imports, permissions | Profile-driven import and correction workflow remain linked to live attendance records |
| Payments | Permissions, maker-checker, imports | Approved import posting updates payment domain; high-risk controls remain policy-aware |
| Promotions | Promotion Policy | Runtime promotion caps/approval policy synchronise from active V5 policy |
| Organisational Management | Organisation hierarchy, scope, role assignments | Effective hierarchy/assignments feed policy and workflow context |
| Governance | Roles/policies/workflows/config releases | Configuration activation requires governed independent approval; V4 governance state remains intact |
| Imports | Import Profiles + maker/checker | Batch snapshots exact profile version; validated post/reconcile/reverse changes live domain records |
| Integrations | Integration/Webhook definitions | Active versions sync to V4-compatible connector runtime; health evidence recorded without exposing secrets |
| Moderation | Permissions/workflows/reason codes | Existing moderation decisions remain auditable; certification moderation updates live certification state |
| Data Quality | Data-quality rules/remediation workflow | Existing issue/remediation state retained; rules are now versioned configuration |
| Audit | Permission/audit metadata | Business/configuration denies and successes record audit/policy context |

## Backward-compatible runtime strategy

V5 does not require V4 feature modules to be rewritten. `compatibility.ts` hydrates V4 records into V5 where required, while `runtimeAdapters.ts` materialises active V5 configuration back into V4-compatible runtime contracts. This allows progressive control-plane authority without breaking the 98-route V4 surface.
