# SETHU Enterprise Platform V6.1 — Current Canonical Source

**Technical release:** `6.1.0`  
**Current engineering line:** V6.1 Runtime / Production Remediation  
**Authoritative recovery rule:** use the latest verified R-series checkpoint identified in `V6_RUNTIME_REMEDIATION_CHECKPOINT_STATUS.md`; never restart from an older V3/V4/V5, baseline, Member, Platform or Functional checkpoint unless intentionally rolling back.

SETHU V6 is the single canonical runtime. V3/V4/V5 and earlier V6 structures survive only as migration fixtures, historical evidence or explicit route/data compatibility boundaries. They are not parallel production engines.

## Current canonical ownership

- **Member:** 45 canonical routes and dedicated Member pages.
- **Management:** 13 dedicated Management routes/pages with responsibility-aware permissions and RACI/state enforcement.
- **Governance:** 8 canonical routes/pages with separated vote/review/finalisation authority.
- **Platform Administration:** 17 canonical routes backed by Control Plane configuration plus platform-runtime operational domains.
- **Operational state:** `platformRuntime`.
- **Configuration source of truth:** `controlPlane`.
- **Historical persisted-data migration:** `src/migrations` only.
- **Retired enterprise runtime:** absent from production source.

## Current validation entry points

```bash
npm run validate:v6:runtime-remediation:source-clean
npm run validate:v6:pure-contracts
npm run validate:v6:static-quality
npm run validate:v6:security-trust-boundary
npm run validate:v6:performance-resilience
npm run validate:v6:management:functional
npm run validate:v6:governance-public:functional
npm run validate:v6:role-journeys
npm run validate:v6:platform-canonical:release
npm run validate:v6:runtime-remediation:release
```

See `V6_CURRENT_RELEASE_INDEX.md` for the authoritative current-vs-historical document map.

## Runtime certification boundary

The current source has extensive dependency-independent validation, but dependency-backed TypeScript semantic compilation, Vitest, Vite production build, rendered-browser E2E, Lighthouse/Core Web Vitals and deployed security/load testing are **not PASS unless they actually execute in an environment where the locked npm dependency tree and production services are available**.

Production authentication, server-side authorization, durable persistence, immutable audit, real OTP/MFA delivery, secrets management, CSP/HSTS/WAF, concurrency control and live integrations belong to the deployed backend/IdP/infrastructure boundary. The front-end never treats preview/local behavior as evidence those external services exist.


## R17 multi-chapter deployment test data

The R17 checkpoint adds a production-like synthetic Member/Business dataset for deployment testing across multiple Chapters and States. See `SETHU_V7_1_R17_DEPLOYMENT_TEST_DATA_GUIDE.md` and `SETHU_V7_1_R17_MEMBER_LOGIN_MATRIX.csv`. All synthetic preview accounts use the standard preview password and remain preview-only; production authentication continues to require the authoritative backend/IdP.

## R18 realistic deployment-test dataset
The current continuation checkpoint expands the synthetic deployment seed to 50 Members per configured Chapter, broadens Business Sector → Segment → Specialisation coverage, and adds dense within-Chapter, cross-Chapter, cross-city and cross-state relationship/activity fixtures. See `SETHU_V7_1_R18_REALISTIC_DATASET_GUIDE.md` and `fixtures/r18_reference_csv/`.
