# SETHU V7.1 R17 — Data Integrity & Sanity Report

## Result

**PASS — deployment seed validation 333/333.**

## Verified invariants

- 13 generated Chapters with at least 10 Members each.
- Chennai has 3 generated Chapters and 32 generated Members.
- Exactly 5 direct Chennai Member preview logins.
- Coimbatore, Hosur, Tiruchirappalli, Madurai, Mysuru, Bengaluru, Hyderabad and Mumbai are represented.
- Bengaluru has 2 generated Chapters; Hyderabad has 2 generated Chapters.
- Every non-Chennai generated Chapter has at least 2 direct Member logins.
- 132 generated Member IDs are unique.
- 132 generated Business IDs are unique.
- Every generated login maps to an existing generated Member.
- Every generated Member has exactly one generated Business and exactly one active/verified affiliation.
- 12 unique Business Sectors, 18 Business Segments and 18 Business Specialisations are governed through Control Plane taxonomy.
- Every generated Business carries Sector + Segment + Specialisation taxonomy references.
- Generated Members are active/verified; generated Businesses are verified/network-visible.
- Deployment relationships, Opportunities, Meetings, Events, Business Outcomes and Notes are wired into canonical network state.
- Deployment Member accounts are wired into canonical preview authentication.
- Deployment taxonomy and organisation hierarchy are wired into canonical Control Plane state.

## Regression validation retained

- Runtime stability: 10/10 PASS.
- Single-current-Business cardinality: 7/7 PASS.
- Relationship workspace: 8/8 PASS.
- Notes security: 5/5 PASS.
- Internal links: 3/3 PASS, 592 targets / 100 route patterns.
- Static quality: 11/11 PASS.
- Forms/actions: 15/15 PASS, 621 buttons / 26 router links inspected.
- V7 backend contract sync: 11/11 PASS.
- V7 final readiness: 39/39 PASS.
- V7.1 final readiness: 23/23 PASS.
- Member Business functional validation: 42/42 PASS.
- Member Network functional validation: 24/24 PASS.
- V7 scale/realtime adoption: 11/11 PASS.
- V7 production-readiness hardening: 17/17 PASS.
- Canonical platform operational-state validator: PASS.
- Canonical Control Plane configuration validator: PASS.
- TypeScript syntax parser: 296 TS/TSX files, 0 syntax diagnostics.
- Isolated semantic typecheck of `deploymentTestSeed.ts`: PASS using TypeScript strict mode.

## Environment-bound gates

Full dependency-backed `npm ci`, project-wide typecheck/build/Vitest/Playwright remain environment-bound because the package registry dependency cache is incomplete in this execution environment (`zod-4.6.5.tgz` was not cached). This checkpoint does not claim those unavailable gates as PASS.

## Historical evidence boundary

The legacy umbrella platform-canonical meta-suite expects `V6_MEMBER_CONTRACT_MIGRATION_MATRIX.md`, which was not present in the authoritative R16 archive. This is treated as a missing historical evidence artifact, not a runtime/code failure. R17 does not invent the missing historical catalogue.
