import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
let failures=0;let direct=0;
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const ok=(name,cond,detail='')=>{direct++;if(cond)console.log(`PASS: ${name}`);else{failures++;console.error(`FAIL: ${name}${detail?` — ${detail}`:''}`)}};

const routes=read('src/routes/routeConfig.tsx');
const publicRoutes=read('src/routes/publicRouteConfig.tsx');
const rootReducer=read('src/app/rootReducer.ts');
const packageJson=JSON.parse(read('package.json'));
const routeCount=[...routes.matchAll(/\{ id:\d+, path:/g)].length;
const publicCount=[...publicRoutes.matchAll(/path:\s*'[^']+'/g)].length;
const workspaceCounts={
 Member:[...routes.matchAll(/workspace:"Member"/g)].length,
 Management:[...routes.matchAll(/workspace:"Management"/g)].length,
 Governance:[...routes.matchAll(/workspace:"Governance"/g)].length,
 PlatformAdmin:[...routes.matchAll(/workspace:"Platform Admin"/g)].length,
};
ok('Authenticated/workspace route inventory remains 84',routeCount===84,String(routeCount));
ok('Public/Auth route inventory remains 14',publicCount===14,String(publicCount));
ok('Canonical Member route inventory remains 45',workspaceCounts.Member===45,String(workspaceCounts.Member));
ok('Management route inventory remains 13',workspaceCounts.Management===13,String(workspaceCounts.Management));
ok('Governance route inventory remains 8',workspaceCounts.Governance===8,String(workspaceCounts.Governance));
ok('Platform Admin route inventory remains 17',workspaceCounts.PlatformAdmin===17,String(workspaceCounts.PlatformAdmin));
ok('Root reducer owns canonical platformRuntime',rootReducer.includes("import platformRuntime from '@/features/platform-runtime/platformRuntimeSlice'")&&/combineReducers\(\{[^}]*\bplatformRuntime\b/.test(rootReducer));
ok('Root reducer owns canonical controlPlane',rootReducer.includes("import controlPlane from '@/features/control-plane/controlPlaneSlice'")&&/combineReducers\(\{[^}]*\bcontrolPlane\b/.test(rootReducer));
ok('Root reducer has no retired enterprise key',!/\benterprise\s*:/.test(rootReducer));
ok('Retired enterprise feature directory remains absent',!exists('src/features/enterprise'));

const source=[];
function walk(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,e.name).replaceAll('\\','/');if(e.isDirectory())walk(rel);else if(/\.(ts|tsx)$/.test(e.name))source.push(rel)}}
walk('src');
const production=source.filter(f=>!f.startsWith('src/migrations/'));
const legacyProduction=production.filter(f=>{const t=read(f);return t.includes('@/features/enterprise')||t.includes('features/enterprise/')||/\b(?:state|s)\.enterprise\b/.test(t)||t.includes('enterpriseSlice')});
ok('Production source has zero retired enterprise runtime dependencies',legacyProduction.length===0,legacyProduction.join(', '));
ok('Historical migration boundary exists',exists('src/migrations')&&source.some(f=>f.startsWith('src/migrations/')));
const outsideMigrationLegacyStorage=production.filter(f=>/sethu\.v[345]\.|V[345]_/.test(read(f))&&f!=='src/features/network/data.ts');
ok('Historical persisted-data compatibility is contained',outsideMigrationLegacyStorage.length===0,outsideMigrationLegacyStorage.join(', '));

for(const script of [
 'validate:v6:platform-canonical',
 'validate:v6:platform-canonical:ux',
 'validate:v6:platform-canonical:journeys',
 'validate:v6:member-canonical:release',
 'validate:v6:platform-admin:release',
 'validate:v6:canonical-regression',
])ok(`Required regression script registered: ${script}`,Boolean(packageJson.scripts?.[script]));

if(failures){console.error(`\nPlatform canonical regression direct preflight: FAIL (${failures}/${direct}).`);process.exit(1)}

const suites=[
 ['V6 syntax','validate:v6:syntax'],
 ['Platform canonical contract','validate:v6:platform-canonical'],
 ['Platform canonical UX','validate:v6:platform-canonical:ux'],
 ['Platform cross-workspace journeys','validate:v6:platform-canonical:journeys'],
 ['V6 baseline','validate:v6:baseline'],
 ['Platform Admin release integrity','validate:v6:platform-admin:release'],
 ['Member canonical release integrity','validate:v6:member-canonical:release'],
 ['Current V6 shared regression','validate:v6:canonical-regression'],
];
for(const [label,script] of suites){
 const r=spawnSync('npm',['run',script],{cwd:root,encoding:'utf8',shell:false});
 if(r.stdout)process.stdout.write(r.stdout);if(r.stderr)process.stderr.write(r.stderr);
 if(r.status!==0){console.error(`FAIL: P13 regression suite — ${label}`);process.exit(r.status||1)}
 console.log(`PASS: P13 regression suite — ${label}`);
}
console.log(`\nSETHU V6 Platform canonical complete regression: PASS — ${direct}/${direct} direct invariants plus ${suites.length} full canonical suites.`);
