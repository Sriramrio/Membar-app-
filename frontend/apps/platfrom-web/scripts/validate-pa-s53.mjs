import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root=resolve('.');
const src=join(root,'src');
const failures=[];
const forbiddenDirs=[
  'src/features/member','src/features/organisation-operations','src/features/governance','src/features/management','src/member','src/organisation','src/governance'
];
for(const d of forbiddenDirs) if(existsSync(join(root,d))) failures.push(`forbidden workspace implementation directory: ${d}`);
const files=[];
function walk(p){for(const n of readdirSync(p)){const x=join(p,n);if(statSync(x).isDirectory())walk(x);else if(/\.(ts|tsx|js|mjs|json)$/.test(n))files.push(x)}}
walk(src);
const forbiddenImports=[
  /from\s*['"][^'"]*member[^'"]*['"]/i,
  /from\s*['"][^'"]*organisation[^'"]*['"]/i,
  /from\s*['"][^'"]*governance[^'"]*['"]/i
];
for(const f of files){const t=readFileSync(f,'utf8');for(const r of forbiddenImports){if(r.test(t)&&!f.includes('consumer-capabilities'))failures.push(`${relative(root,f)} contains consumer-workspace implementation import`)}}
const routes=readFileSync(join(src,'routes/routeManifest.ts'),'utf8');
for(const m of routes.matchAll(/path:'([^']+)'/g)) if(!m[1].startsWith('/platform-admin/')) failures.push(`non-platform route owned: ${m[1]}`);
const app=readFileSync(join(src,'app/PlatformAdminApp.tsx'),'utf8');
if(/\/app\//.test(app)||/\/org\//.test(app)||/\/governance\//.test(app)) failures.push('consumer route namespace referenced by app router');
const packageJson=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
for(const dep of Object.keys({...packageJson.dependencies,...packageJson.devDependencies})) if(/member|organisation|governance/i.test(dep)) failures.push(`consumer-specific package dependency: ${dep}`);
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`PA-S53 PASS: standalone dependency isolation certified across ${files.length} source files; zero consumer implementation directories/imports/routes/packages.`);
