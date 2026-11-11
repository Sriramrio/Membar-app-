import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();let failures=0;let passes=0;
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const ok=(name,cond,detail='')=>{if(cond){passes++;console.log(`PASS: ${name}`)}else{failures++;console.error(`FAIL: ${name}${detail?` — ${detail}`:''}`)}};
const required=[
 'V6_PLATFORM_LEGACY_DEPENDENCY_GRAPH.md','V6_PLATFORM_STATE_OWNERSHIP_MATRIX.md','V6_PLATFORM_COMPONENT_OWNERSHIP_MATRIX.md','V6_PLATFORM_ROUTE_OWNERSHIP_MATRIX.md','V6_PLATFORM_COMPATIBILITY_CLASSIFICATION.md',
 'V6_PLATFORM_CANONICAL_ARCHITECTURE.md','V6_PLATFORM_CANONICAL_DOMAIN_ARCHITECTURE.md','V6_PLATFORM_CANONICAL_STATE_MODEL.md','V6_PLATFORM_CONTROL_PLANE_PROJECTION_MIGRATION.md','V6_PLATFORM_GOVERNANCE_MIGRATION.md','V6_PLATFORM_MANAGEMENT_MIGRATION.md','V6_PLATFORM_PLATFORM_ADMIN_MIGRATION.md','V6_PLATFORM_PERSISTENCE_MIGRATION_POLICY.md',
 'V6_PLATFORM_CANONICAL_CONTRACT_MATRIX.md','V6_PLATFORM_CANONICAL_JOURNEY_MATRIX.md','V6_PLATFORM_LEGACY_RETIREMENT_REPORT.md','V6_PLATFORM_CANONICAL_VALIDATION_REPORT.md','V6_PLATFORM_CANONICAL_VALIDATION_EVIDENCE.txt','V6_PLATFORM_CANONICAL_COMPLETION_MATRIX.md','V6_PLATFORM_CANONICAL_CHANGE_MANIFEST.txt','V6_PLATFORM_CANONICAL_CHECKPOINT_STATUS.md','V6_PLATFORM_CANONICAL_RELEASE_CHECKLIST.md','V6_PLATFORM_CANONICAL_RELEASE_LOCK.json','V6_PLATFORM_CANONICAL_SOURCE_MANIFEST_SHA256.txt'
];
for(const f of required)ok(`Required platform canonical artifact: ${f}`,exists(f));
if(failures)process.exit(1);
const pkg=JSON.parse(read('package.json'));const lock=JSON.parse(read('V6_PLATFORM_CANONICAL_RELEASE_LOCK.json'));
ok('Package version remains 6.1.0',pkg.version==='6.1.0',pkg.version);
ok('Platform canonical release script registered',pkg.scripts?.['validate:v6:platform-canonical:release']==='npm run validate:v6:platform-canonical:regression && node scripts/validate-v6-platform-canonical-release.mjs');
ok('Platform canonical regression script registered',Boolean(pkg.scripts?.['validate:v6:platform-canonical:regression']));
ok('Platform canonical journey script registered',Boolean(pkg.scripts?.['validate:v6:platform-canonical:journeys']));
ok('Release identity is canonical platform V6',lock.release==='SETHU Enterprise Platform V6 Canonical');
ok('Release status preserves runtime blocker',lock.release_status==='FINAL_SOURCE_VERIFIED_RUNTIME_BLOCKED_ENVIRONMENT');
ok('Dependency certification is not falsely claimed',lock.dependency_certification==='BLOCKED_ENVIRONMENT');
ok('Browser certification is not falsely claimed',lock.browser_certification==='NOT_CLAIMED_ENVIRONMENT_BLOCKED');

const routes=read('src/routes/routeConfig.tsx');const publicRoutes=read('src/routes/publicRouteConfig.tsx');
const authRoutes=[...routes.matchAll(/\{ id:\d+, path:/g)].length;const pubRoutes=[...publicRoutes.matchAll(/path:\s*'[^']+'/g)].length;
const counts={member:[...routes.matchAll(/workspace:"Member"/g)].length,management:[...routes.matchAll(/workspace:"Management"/g)].length,governance:[...routes.matchAll(/workspace:"Governance"/g)].length,platformAdmin:[...routes.matchAll(/workspace:"Platform Admin"/g)].length};
ok('Authenticated/workspace route count = 84',authRoutes===84,String(authRoutes));
ok('Public/Auth route count = 14',pubRoutes===14,String(pubRoutes));
ok('Member route count = 45',counts.member===45,String(counts.member));
ok('Management route count = 13',counts.management===13,String(counts.management));
ok('Governance route count = 8',counts.governance===8,String(counts.governance));
ok('Platform Admin route count = 17',counts.platformAdmin===17,String(counts.platformAdmin));

const rootReducer=read('src/app/rootReducer.ts');
ok('Canonical platformRuntime root registered',rootReducer.includes("import platformRuntime from '@/features/platform-runtime/platformRuntimeSlice'")&&rootReducer.includes('platformRuntime'));
ok('Canonical controlPlane root registered',rootReducer.includes("import controlPlane from '@/features/control-plane/controlPlaneSlice'")&&rootReducer.includes('controlPlane'));
ok('Retired enterprise root absent',!/\benterprise\s*:/.test(rootReducer));
ok('Retired enterprise feature directory absent',!exists('src/features/enterprise'));
ok('Legacy ControlPlanePages production file absent',!exists('src/features/enterprise/pages/ControlPlanePages.tsx'));

const src=[];function walkSource(d){for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const rel=path.join(d,e.name).replaceAll('\\','/');if(e.isDirectory())walkSource(rel);else if(/\.(ts|tsx)$/.test(e.name))src.push(rel)}}walkSource('src');
const prod=src.filter(f=>!f.startsWith('src/migrations/'));const legacy=prod.filter(f=>{const t=read(f);return t.includes('@/features/enterprise')||t.includes('features/enterprise/')||/\b(?:s|state)\.enterprise\b/.test(t)||t.includes('enterpriseSlice')});
ok('Production retired-enterprise dependency count = 0',legacy.length===0,legacy.join(', '));
ok('Migration boundary exists',exists('src/migrations'));
const middleware=read('src/app/controlPlaneRuntimeMiddleware.ts');
ok('Control Plane middleware does not mirror enterprise state',!middleware.includes('features/enterprise')&&!/\b(?:s|state)\.enterprise\b/.test(middleware)&&!middleware.includes('enterpriseSlice'));
ok('Control Plane middleware documents direct canonical consumption',middleware.includes('Canonical V6 configuration consumed directly; no enterprise configuration mirror is materialised'));

for(const d of ['node_modules','dist','.git','coverage','.vite'])ok(`Forbidden generated directory absent: ${d}`,!exists(d));
let tsbuild=[];function scanBuild(d='.'){for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){if(['node_modules','dist','.git','coverage','.vite'].includes(e.name))continue;const rel=(d==='.'?e.name:path.join(d,e.name)).replaceAll('\\','/');if(e.isDirectory())scanBuild(rel);else if(e.name.endsWith('.tsbuildinfo'))tsbuild.push(rel)}}scanBuild();ok('No tsbuildinfo packaged',tsbuild.length===0,tsbuild.join(', '));

const manifestName='V6_PLATFORM_CANONICAL_SOURCE_MANIFEST_SHA256.txt';const manifestLines=read(manifestName).trim().split(/\r?\n/).filter(Boolean);const manifest=new Map();
for(const line of manifestLines){const m=line.match(/^([a-f0-9]{64})  (.+)$/);if(!m){failures++;console.error(`FAIL: Invalid manifest line: ${line}`);continue;}if(manifest.has(m[2])){failures++;console.error(`FAIL: Duplicate manifest path: ${m[2]}`);continue;}manifest.set(m[2],m[1]);const f=path.join(root,m[2]);if(!fs.existsSync(f)){failures++;console.error(`FAIL: Manifest file missing: ${m[2]}`);continue;}const h=crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');if(h!==m[1]){failures++;console.error(`FAIL: Manifest mismatch: ${m[2]}`)}}
ok('Platform manifest count matches release lock',Number(lock.manifest_file_count)===manifest.size,`${lock.manifest_file_count}/${manifest.size}`);

const excluded=new Set([manifestName]);const actual=[];function walkAll(d='.'){for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){if(['node_modules','dist','.git','coverage','.vite'].includes(e.name))continue;const rel=(d==='.'?e.name:path.join(d,e.name)).replaceAll('\\','/');if(e.isDirectory())walkAll(rel);else if(!excluded.has(rel))actual.push(rel)}}walkAll();actual.sort();
const missingFromManifest=actual.filter(f=>!manifest.has(f));const staleManifest=[...manifest.keys()].filter(f=>!actual.includes(f));
ok('Every packaged project file is tracked by platform manifest',missingFromManifest.length===0,missingFromManifest.join(', '));
ok('Platform manifest has no stale paths',staleManifest.length===0,staleManifest.join(', '));

const matrix=read('V6_PLATFORM_CANONICAL_COMPLETION_MATRIX.md');
ok('Completion matrix states enterprise root/runtime retired',matrix.includes('enterprise root = 0')&&matrix.includes('active imports = 0'));
ok('Completion matrix exposes blocked runtime gates',matrix.includes('Dependency-backed typecheck')&&matrix.includes('BLOCKED')&&matrix.includes('Interactive browser certification'));
const checklist=read('V6_PLATFORM_CANONICAL_RELEASE_CHECKLIST.md');
ok('Release checklist records final architecture closure',checklist.includes('`src/features/enterprise` retired')&&checklist.includes('Control Plane configuration duplicate projection removed'));

if(failures){console.error(`\nSETHU V6 Platform canonical release validation: FAIL — ${passes} passed, ${failures} failed.`);process.exit(1)}
console.log(`\nSETHU V6 Platform canonical release validation: PASS — ${passes} release checks, ${manifest.size} manifest entries, zero active retired-enterprise production dependencies.`);
