import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
let passed=0;const failures=[];
const ok=(name,value,detail='')=>{if(value){passed++;console.log(`PASS: ${name}`)}else{failures.push(`${name}${detail?`: ${detail}`:''}`);console.error(`FAIL: ${name}${detail?`: ${detail}`:''}`)}};
const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const requiredDocs=[
 'V6_LEGACY_INVENTORY.md','V6_BASELINE_MIGRATION_GUIDE.md','V6_LEGACY_RETIREMENT_REPORT.md','V6_CANONICAL_DOMAIN_MODEL.md',
 'V6_CANONICAL_ROUTE_CATALOGUE.md','V6_CANONICAL_CONFIGURATION_CATALOGUE.md','V6_CANONICAL_PERMISSION_CATALOGUE.md',
 'V6_CANONICAL_WORKFLOW_CATALOGUE.md','V6_CANONICAL_DOMAIN_EVENT_CATALOGUE.md','V6_CANONICAL_METRIC_CATALOGUE.md',
 'V6_BASELINE_BACKWARD_COMPATIBILITY_REPORT.md','V6_BASELINE_VALIDATION_REPORT.md','V6_BASELINE_COMPLETION_MATRIX.md',
 'V6_BASELINE_RELEASE_NOTES.md','V6_BASELINE_RELEASE_CHECKLIST.md','V6_BASELINE_VALIDATION_EVIDENCE.txt','V6_BASELINE_CHECKPOINT_STATUS.md'
];

ok('Canonical schema version is 6',read('src/features/control-plane/data.ts').includes('schemaVersion:6')&&/CURRENT_SCHEMA_VERSION\s*=\s*6/.test(read('src/migrations/v6BaselineCore.ts')));
ok('Baseline technical target is 6.1.0',read('src/migrations/v6BaselineCore.ts').includes("V6_BASELINE_RELEASE_VERSION='6.1.0'"));
ok('Single migration entry point exists',read('src/migrations/v6Baseline.ts').includes('migrateToV6Baseline'));
ok('Historical V4 control-plane migration isolated',exists('src/migrations/legacyV4ControlPlane.ts')&&!exists('src/features/control-plane/compatibility.ts'));
ok('Runtime configuration projection is retired and legacy shape conversion is migration-only',!exists('src/features/control-plane/runtimeProjection.ts')&&!exists('src/features/control-plane/runtimeAdapters.ts')&&exists('src/migrations/controlPlaneLegacyProjection.ts'));
ok('Current Platform Admin implementation is V6 named',exists('src/features/control-plane/pages/PlatformAdminV6Pages.tsx')&&!exists('src/features/control-plane/pages/PlatformAdminV5Pages.tsx'));
ok('All representative historical/current migration fixtures exist',['v3','v4','v5'].every(v=>exists(`src/migrations/fixtures/legacy/${v}/state.json`))&&exists('src/migrations/fixtures/v6/state.json'));
ok('Canonical Member relationship/certification mirrors are retired',!exists('src/features/network/compatibilityProjection.ts')&&!read('src/features/network/types.ts').includes('ownerMemberIds')&&!read('src/features/network/types.ts').includes('primaryRepresentativeId'));
ok('Canonical route alias boundary is explicit',exists('src/routes/routeAliases.ts')&&read('src/routes/routeAliases.ts').includes('resolveRouteAlias'));
ok('Canonical navigation uses route resolver',read('src/navigation/useAppNavigation.ts').includes('resolveRouteAlias'));
ok('Member navigation delegates to canonical coordinator',read('src/features/member/navigation/useMemberNavigation.ts').includes('useAppNavigation as useMemberNavigation'));
ok('Canonical Member dashboard projection exists',exists('src/features/member/dashboard/projections.ts')&&read('src/features/member/dashboard/projections.ts').includes('MemberDashboardProjection'));
ok('Chapter Member-view privacy projection exists',exists('src/features/member/dashboard/chapterMetrics.ts')&&read('src/features/member/dashboard/chapterMetrics.ts').includes('buildChapterMemberViewProjection'));
ok('Authorization remains fail-closed',read('src/features/control-plane/policyEngine.ts').includes('Fail closed: permission missing')&&read('src/app/authorizationMiddleware.ts').includes('V6 RACI denies'));
ok('All canonical baseline documents present',requiredDocs.every(exists),requiredDocs.filter(x=>!exists(x)).join(', '));
ok('Historical lineage folders present',['v3','v4','v5','v6-member-experience'].every(v=>exists(`docs/history/${v}`)));
const rootFiles=fs.readdirSync(root);
ok('No V3/V4/V5 release artefacts remain at root',!rootFiles.some(f=>/^V[345]_/.test(f)),rootFiles.filter(f=>/^V[345]_/.test(f)).join(', '));
const currentDocs=['README.md','ARCHITECTURE.md','RUNBOOK.md','SOURCE_ALIGNMENT.md','TRACEABILITY.md','COMPLETION_MATRIX.md','VALIDATION_REPORT.md'].map(read).join('\n');
ok('Current root documentation identifies V6.1 canonical remediation',currentDocs.includes('V6.1')&&currentDocs.includes('Runtime / Production Remediation'));
ok('Historical V6 Baseline lineage remains documented',read('V6_BASELINE_CHECKPOINT_STATUS.md').includes('V6 Baseline')&&read('V6_CURRENT_RELEASE_INDEX.md').includes('Historical evidence'));
ok('Current root documentation does not claim Current V4/V5',!currentDocs.includes('Current V4')&&!currentDocs.includes('Current V5'));
ok('No stale V5 Platform Admin source name remains',!read('src/features/control-plane/pages/PlatformAdminV6Pages.tsx').includes('PlatformAdminV5Pages'));
const sourceFiles=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(e.name))sourceFiles.push(p)}};walk(path.join(root,'src'));
const all=sourceFiles.map(p=>fs.readFileSync(p,'utf8')).join('\n');
ok('No native business prompt/confirm regression',!all.includes('window.prompt(')&&!all.includes('window.confirm('));
ok('No static preview OTP/password regression',!all.includes('246810')&&!all.includes('Password@123'));
ok('Canonical persistence boundary is wired',read('src/app/store.ts').includes('readRuntimeState')&&read('src/app/store.ts').includes('readSafePreferences')&&read('src/app/store.ts').includes('writeRuntimeState')&&read('src/app/store.ts').includes('writeSafePreferences')&&read('src/migrations/storageMigration.ts').includes('createPersistenceEnvelope')&&read('src/migrations/storageMigration.ts').includes('sessionStorageService')&&read('src/migrations/storageMigration.ts').includes('localStorageService'));
ok('Store no longer bypasses persistence boundary',!read('src/app/store.ts').includes('sessionStorageService')&&!read('src/app/store.ts').includes('localStorageService')&&!read('src/app/store.ts').includes('STORAGE_KEYS.'));
ok('Baseline checkpoint sequence through P08 documented',read('V6_BASELINE_CHECKPOINT_STATUS.md').includes('P08: baseline certification, persistence-boundary repair'));

console.log(`\nSETHU V6 Baseline validation: ${passed} groups passed.`);
if(failures.length){console.error(`\n${failures.length} baseline failure(s):`);failures.forEach(f=>console.error(`- ${f}`));process.exit(1)}
console.log('PASS: V6 Baseline canonicalisation, migration boundaries, documentation and compatibility contracts are internally consistent.');
