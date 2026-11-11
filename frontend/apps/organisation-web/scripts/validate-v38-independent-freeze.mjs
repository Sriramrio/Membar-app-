import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const failures=[];const check=(ok,msg)=>{if(!ok)failures.push(msg)};

// V3.5 H19 functional truth anchors that must remain byte-identical.
check(hash('src/contracts/catalog.ts')==='f42a3eed49387e74170f990a466d884fc28bc11aca0799e52b5da780da18192f','V3.5 query/command catalogue truth drifted.');
check(hash('src/domain/stateMachines.ts')==='325837e1af405c73976984f336e56fe7548aa7948bddde1a2c44f3211b1044de','V3.5 lifecycle/state-machine truth drifted.');

const access=read('src/security/access.ts');
const policy=read('src/config/routeAccessPolicy.ts');
const roles=read('src/domain/roles.ts');
const types=read('src/domain/types.ts');
const store=read('src/state/OrgStore.tsx');
const nav=read('src/config/navigation.ts');
const css=read('src/styles/global.css');
const semantic=read('scripts/validate-semantic-links-actions.mjs');

check(!/if\s*\(!permissions\.length\)\s*return\s+true/.test(access),'Fail-open empty-permission behavior returned.');
check(!/Treasurer\|Management/.test(access),'Title-based authorization returned.');
check(policy.includes("requiredPermission:'org:read'")&&policy.includes('capability:'),'Route access metadata lost permission/capability governance.');
check(!roles.includes('workflowRaci')&&!roles.includes('sodRules')&&!roles.includes('rolePermissions'),'Organisation regained Platform Administration policy authority.');
check(types.includes('OperationalResponsibilityType')&&types.includes('ResponsibilityAssignment'),'Operational responsibility model missing.');
check(!/OrgRoleType[^;]*COMMITTEE_(CONVENER|MEMBER)/s.test(types),'Committee responsibility leaked back into formal organisational offices.');
check(store.includes("lazy(()=>import('./PreviewOrgProvider'))")&&!store.includes('previewFixtures')&&!store.includes('previewReducer'),'Preview runtime is no longer isolated from production authority.');
check(nav.includes('rolePriority')||nav.includes('ROLE_PRIORITY'),'Role-aware navigation priority missing.');
check(semantic.includes('exact record')||semantic.includes('Region search resolves exact record'),'Semantic cross-link certification missing.');
check(css.includes('#0f2747')&&css.includes('#1b5fa7')&&css.includes('#f2b84b'),'Platform-aligned SETHU design tokens drifted.');
check(css.includes('@media(prefers-reduced-motion:reduce)')&&css.includes('min-height:44px'),'Accessibility/touch baseline drifted.');

let aggregate='';
for(const dir of ['src']){
 const walk=d=>{for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const rel=path.join(d,e.name);if(e.isDirectory())walk(rel);else if(/\.(ts|tsx|css|mjs)$/.test(e.name))aggregate+=read(rel)+'\n'}};walk(dir);
}
check(!/platform-admin-api-simulator|PAF43/i.test(aggregate),'Stale Platform Admin simulator reference entered the frozen source.');
check(!/style=\{\{/.test(aggregate),'Static inline layout style returned.');
check(!/type:'LOG_ACTION'|a\.type==='LOG_ACTION'/.test(aggregate),'Fake durable LOG_ACTION returned.');

for(const p of ['node_modules','.vite','dist','coverage','.git','tsconfig.tsbuildinfo'])check(!fs.existsSync(path.join(root,p)),`Generated artifact present in frozen source: ${p}`);

if(failures.length){console.error('V3.8 independent freeze review FAILED');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('PASS V3.8 independent freeze review: V3.5 functional anchors preserved; access/policy/responsibility/navigation/theme/semantic-link/preview/source boundaries intact.');
