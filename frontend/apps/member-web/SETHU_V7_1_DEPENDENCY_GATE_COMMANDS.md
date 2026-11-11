# SETHU V7.1 Dependency-backed Final Gate Commands

Run from the clean source root after restoring the exact lockfile-compatible dependency tree:

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run validate:v71:runtime-enhancement
npm run validate:v71:source
npm run validate:v71:final
node e2e/run-browser-e2e.mjs
node e2e/run-navigation-e2e.mjs
```

Then execute `SETHU_V7_1_INTEGRATION_TEST_MATRIX.md` against the deployed server/database, including concurrent second-affiliation requests and note privacy/author spoof tests.
