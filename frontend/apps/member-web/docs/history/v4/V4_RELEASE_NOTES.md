# SETHU Enterprise Platform V4 — Release Notes

**Release:** V4 Architecture & Integration Hardening  
**Package version:** `4.0.0`  
**Release label:** `SETHU_Enterprise_Platform_V4_FINAL`  
**Date:** 24 September 2026

## Release intent

V4 does not expand route count for its own sake. It hardens V3 around domain depth, cross-module effects, runtime governance, security boundaries, exception handling and task completion UX.

## Major changes

### Member and Business network
- Added many-to-many `MemberBusinessAffiliation` with role, designation, authority, primary/authorised representative flags, effective dates, verification and historical ending.
- Added governed affiliation approval through Workflow + RACI.
- Added contextual `BusinessRelationship` graph.
- Added structured `CertificationRecord` with issuer/number/dates/evidence/verification.
- Pending certifications enter Moderation automatically and are excluded from verified Directory filtering until approved.
- Added governed business taxonomy references and synonym-aware Directory matching while retaining descriptive profile text.
- Removed seed-member fallback from active identity selectors.

### Opportunities and commercial outcomes
- Added configurable Opportunity form version/answers.
- Added clarification Q&A.
- Added discussion linkage to messaging.
- Supplier selection now updates response outcome, closes the opportunity, creates a Transaction and creates a Supplier business relationship.
- Invalid opportunity/response/transaction transitions are denied and audited.

### Events and configurable forms
- Event registration consumes the active Form Builder definition.
- Registration stores form version, answers, terms acceptance and waitlist/registration metadata.
- Capacity/waitlist behavior and promotion notification are connected to shared runtime state.

### Management and control plane
- Import Centre posting now materially applies validated Attendance/Payment/Member/Visitor rows and records applied IDs; reversal materially reverts imported effects.
- Effective role assignments now feed live workspace/permission resolution.
- Workflow actions are enforced by active workflow definition, legal task state, RACI, maker/checker and conflict rules.
- Data Quality remediation requires workflow approval before an issue becomes Resolved.
- Role tenure enforces exclusive-office overlap rules and governed handover transitions.

### Governance
- Decision flow supports quorum, vote records, recusal/conflict controls and final rationale.
- Approved decisions can apply Policy, Policy Exception, Role Assignment and Platform Setting effects.
- Board Pack acknowledgement, Policy Register/Exceptions, Strategy and Governance History have domain-specific pages.

### Platform Administration
- Replaced routed generic OperationalPage implementations with domain-specific control-plane screens for Identity, Organisation Hierarchy, RACI, Workflow Designer, Lookups/Taxonomy, Form Builder, Integrations, Moderation, Notification Administration, Promotion Policy and Platform Settings.
- Notification templates drive supported runtime events.
- Active Promotion Policy is consumed by runtime promotion behavior.

### Security and exception hardening
- No universal static preview password; preview credential is generated per browser session.
- OTP is random, expiring, attempt-limited and target/purpose-bound.
- Protected runtime state is session-scoped; durable browser storage is restricted to low-risk preferences/configuration.
- Native business `window.prompt`/`window.confirm` interactions were replaced by application dialogs.
- Illegal lifecycle actions now emit Denied audit events with reason/correlation instead of false-success audit entries.
- API boundary carries standardized error envelopes, correlation IDs and idempotency keys.

### UX hardening
- Added accessible ActionDialog focus trap, Escape handling and focus return.
- Added breadcrumb/back/workspace navigation context.
- Added global operation feedback for denied/failed governed operations.
- Configurable form answers retain definition versions for historical interpretation.

## Compatibility

- 84 authenticated/workspace routes retained.
- 80 original authenticated route contracts retained.
- 14 public/authentication routes retained.
- Workspace distribution remains: 1 Workspace, 45 Member, 13 Management, 8 Governance, 17 Platform Administration.

## Certification boundary

V4 source validation passes. Dependency-backed `tsc`, Vitest, Vite build and rendered-browser certification are not claimed in this execution sandbox because the available dependency tree is incomplete and the missing packages are not available in the offline npm cache. Production identity, database, immutable audit and external connectors remain deployment integrations.
