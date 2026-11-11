# V6 Release Checklist

- [x] V5 FINAL used as immutable baseline.
- [x] P01 Navigation Foundation checkpoint packaged.
- [x] P02 Dashboard Projection checkpoint packaged.
- [x] P03 Member Dashboard checkpoint packaged.
- [x] P04 Chapter Performance checkpoint packaged.
- [x] P05 Cross-Linking checkpoint packaged.
- [x] P06 Member UX Simplification checkpoint packaged.
- [x] P07 Control-Plane Linkage checkpoint packaged.
- [x] P08 Hardening checkpoint packaged.
- [x] P09 Regression Validated checkpoint packaged.
- [x] Exact V5 route contract retained.
- [x] V3/V4/V5 compatibility gates retained.
- [x] V6 29/29 source-contract groups pass before release freeze.
- [x] Package and lock version set to 6.0.0.
- [x] Required V6 evidence set generated.
- [x] Candidate source manifest verified after clean extraction.
- [x] Candidate ZIP compressed-data integrity verified.
- [x] Candidate re-extracted `npm run validate:v6:release` PASS.
- [x] Final archive checksum is produced as an external release artifact after this frozen source tree is packaged.

Dependency-backed typecheck/test/build and rendered-browser/accessibility certification remain explicitly outside the certified sandbox gate because required npm/type packages are incomplete.
