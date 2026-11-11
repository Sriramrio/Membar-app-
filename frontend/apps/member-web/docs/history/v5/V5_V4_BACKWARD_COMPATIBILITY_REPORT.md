# V5 ↔ V4 Backward Compatibility Report

## Baseline preserved

V5 is an additive control-plane enhancement over V4 FINAL. It does not replace the V4 application architecture.

### Route compatibility
- 84 authenticated/workspace routes preserved.
- 14 public/authentication routes preserved.
- 80 original authenticated route contracts retained.
- Workspace split remains: Workspace, Member, Management, Governance, Platform Admin.

### State/data compatibility
`hydrateV4PlatformState()` maps existing V4 organisation units, RACI, workflows, forms, notification templates, promotion policies, taxonomy, settings and integrations into V5-compatible configuration without discarding existing V5 definitions.

### Runtime compatibility
`runtimeAdapters.ts` materialises active V5 organisation, RACI, workflow, form, notification, promotion, taxonomy, integration and setting configuration back into V4-compatible runtime contracts.

### Existing domain behavior retained
V4 Member/Business graph, affiliations, certification moderation, opportunity Q&A, configurable event registration, imports, governance, privacy and session-storage hardening remain present. V5 adds control-plane authority rather than rewriting these domains.

## Regression evidence
`npm run validate:v4:source` passes in the V5 source tree, proving structural route compatibility and all V3/V4 source-contract gates after V5 changes.

## Explicit boundary
A full dependency-backed TypeScript/test/build/browser regression cannot be certified in the current sandbox because the installed npm dependency tree is incomplete. This is reported, not hidden.
