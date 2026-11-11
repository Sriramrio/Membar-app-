# P06 — Legacy Runtime Retirement

## Objective

Isolate historical V3/V4/V5 compatibility at explicit migration/projection boundaries without changing the V6 functional route or state contract.

## Changes completed

- Historical V4 control-plane hydration now lives in `src/migrations/legacyV4ControlPlane.ts` and is consumed directly by `migrateToV6Baseline()`.
- `src/features/control-plane/compatibility.ts` is now only a temporary historical facade for pre-baseline source-contract compatibility; no current runtime imports it.
- Current control-plane → retained enterprise operational conversion now lives in `src/features/control-plane/runtimeProjection.ts`.
- `controlPlaneRuntimeMiddleware` consumes `runtimeProjection` directly.
- `runtimeAdapters.ts` is now only a temporary historical re-export pending Phase 7 validator cleanup.
- Added `src/features/network/compatibilityProjection.ts` so deprecated `Member.businessId`, `Business.ownerMemberIds`, `Business.primaryRepresentativeId`, and `Business.certifications` are one-way compatibility mirrors derived from canonical `MemberBusinessAffiliation` / `CertificationRecord` state.
- Affiliation and certification reducers no longer contain direct mirror-write logic.
- Added `validate:v6:retirement` to detect migration imports leaking into normal feature/UI code, direct deprecated mirror writes, and runtime imports of historical compatibility modules.

## Compatibility intentionally retained until P07

Two thin facades remain because the pre-baseline V5 validator checks implementation markers rather than behavior:

- `src/features/control-plane/compatibility.ts`
- `src/features/control-plane/runtimeAdapters.ts`

They contain no active duplicate engines. P07 will update compatibility validation to behavior/migration assertions before these facades are removed.

## Validation

- `npm run validate:v6:retirement`: PASS — 14/14 groups
- `npm run validate:v6:migration`: PASS
- `npm run validate:v6:routing`: PASS
- `npm run validate:v6:source`: PASS
- V3: 14/14 PASS
- V4: 35/35 PASS
- V5: 45/45 PASS
- V6: 29/29 PASS
- Authenticated/workspace routes: 84
- Public/auth routes: 14
- TypeScript/TSX source files audited: 223
- Parser diagnostics: 0

## Safety conclusion

No legacy implementation was deleted before an equivalent migration/runtime boundary existed. The compatibility chain remains green, while normal V6 runtime behavior is materially less dependent on legacy module names and direct legacy mirror writes.
