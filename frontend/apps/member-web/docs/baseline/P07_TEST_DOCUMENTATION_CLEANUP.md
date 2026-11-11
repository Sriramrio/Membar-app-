# P07 — Tests / Documentation Cleanup

## Completed

- V5 compatibility validator now validates preserved behavior in canonical V6 files instead of obsolete V5/V4 feature filenames/phrases.
- Removed the temporary `control-plane/compatibility.ts` and `runtimeAdapters.ts` facades after validator modernization.
- Renamed current Platform Admin implementation to `PlatformAdminV6Pages.tsx` and route wrappers to `*V6` exports.
- Removed temporary V5 source-marker comments.
- Renamed active hardening tests from V4-labelled filenames/descriptions to canonical V6 hardening names.
- Moved historical V3/V4/V5 release artefacts into `docs/history/v3|v4|v5`.
- Moved the pre-baseline V6 Member Experience release evidence into `docs/history/v6-member-experience`.
- Rebuilt root README/architecture/runbook/source-alignment/traceability/current matrix/validation report around the V6 Baseline.
- Added canonical V6 domain, route, configuration, permission, workflow, domain-event and metric catalogues.
- Updated migration/legacy-retirement/backward-compatibility documentation.

## Validation

- `validate:v6:migration`: PASS
- `validate:v6:routing`: PASS
- `validate:v6:retirement`: PASS — 14/14
- `validate:v6:source`: PASS
- V3 14/14 · V4 35/35 · V5 45/45 · V6 29/29
- Routes: 84 authenticated/workspace + 14 public/auth
- TS/TSX parsed: 221
- Syntax diagnostics: 0

## P08 boundary

P08 adds a dedicated baseline validator and performs regression/certification across migration, route/deep-link, permission/privacy, reference integrity, control plane, Member Experience and package/document consistency. No new product feature is planned in P08.
