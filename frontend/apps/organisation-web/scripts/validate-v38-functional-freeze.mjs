import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const failures=[];const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const pkg=JSON.parse(read('package.json'));
const catalog=read('src/contracts/catalog.ts');
const runtime=read('src/contracts/runtimeContracts.ts');
const routes=read('src/routes/routeRegistry.tsx');
const access=read('src/config/routeAccessPolicy.ts');
const roles=read('src/domain/roles.ts');
const types=read('src/domain/types.ts');
const nav=read('src/config/navigation.ts');
const css=read('src/styles/global.css');

check(pkg.version==='3.8.0','Frontend functional-freeze version must be 3.8.0.');
check(/ORGANISATIONAL_CONTRACT_VERSION='3\.5\.0'/.test(runtime),'Wire contract must remain frozen at 3.5.0 for V3.7 backend compatibility.');
const qBody=catalog.match(/export const queryIds=\[([\s\S]*?)\] as const;/)?.[1]??'';
const cBody=catalog.match(/export const commandIds=\[([\s\S]*?)\] as const;/)?.[1]??'';
const qSet=new Set(qBody.match(/'org\.[^']+'/g)??[]);
const cSet=new Set(cBody.match(/'org\.[^']+'/g)??[]);
check(qSet.size===59,`Frozen query catalogue must contain 59 IDs; found ${qSet.size}.`);
check(cSet.size===50,`Frozen command catalogue must contain 50 IDs; found ${cSet.size}.`);
check((routes.match(/path:/g)??[]).length>=90,'Canonical route registry must retain the frozen 90-route surface.');
check(access.includes("requiredPermission:'org:read'")&&access.includes('capability:'),'Route access policy must remain permission/capability governed.');
check(!roles.includes('workflowRaci')&&!roles.includes('sodRules'),'Organisation must not regain Platform Admin policy authority.');
check(!/OrgRoleType[^;]*COMMITTEE_(CONVENER|MEMBER)/s.test(types),'Committee responsibility must not return to the formal role type.');
check(types.includes('OperationalResponsibilityType')&&types.includes('ResponsibilityAssignment'),'Operational responsibility separation must remain frozen.');
check(nav.includes('ROLE_PRIORITY')||nav.includes('rolePriority'),'Role-aware navigation priority must remain present.');
for(const token of ['#f7f9fc','#0f2747','#1d3d69','#1b5fa7','#174f89','#dbe4ef','#59687f','#932727','#f2b84b'])check(css.includes(token),`Platform-aligned theme token missing: ${token}`);
check(!fs.existsSync(path.join(root,'node_modules'))&&!fs.existsSync(path.join(root,'.vite'))&&!fs.existsSync(path.join(root,'dist')),'Frozen source must remain dependency/build clean.');

if(failures.length){console.error('V3.8 functional freeze FAILED');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('PASS V3.8 functional freeze: version, 3.5.0 wire contract, 59/50 catalogues, route/access/role-responsibility/navigation/theme boundaries preserved.');
