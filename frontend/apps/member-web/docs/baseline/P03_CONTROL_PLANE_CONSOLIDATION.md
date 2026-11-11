# P03 Control Plane Consolidation

## Canonical authority

V6 `controlPlane` is the current runtime authority for role/permission policy, organisation scope, RACI, workflow definitions, dynamic forms, taxonomy/matching, notification templates/routing, promotion policy, import profiles, integration metadata and typed settings.

## Changes

- Fresh V6 now contains canonical workflows for membership onboarding, payment reconciliation, attendance correction, business-affiliation verification and data-quality remediation.
- Runtime workflow authorization fails closed when a current task has no canonical V6 workflow instead of silently falling back to a V4 engine.
- Directory taxonomy reads only the canonical V6 control-plane taxonomy; pre-V6 enterprise taxonomy is migrated at hydration.
- Runtime notifications read canonical control-plane templates first; historical enterprise notification templates are no longer an active runtime fallback.
- Canonical templates were added for affiliation decisions, waitlist promotion, certification review and role assignment changes.
- Control-plane runtime projection remains temporarily because some enterprise pages still consume retained enterprise-shaped contracts; it is explicitly a compatibility projection, not an independent authority.

## Not retired yet

`runtimeAdapters.ts` and enterprise compatibility projections remain until Phase 6 because Management/Governance operational screens still consume enterprise-shaped workflow/form/settings records. Removing them before domain/control-plane consumer proof would break the chain.
