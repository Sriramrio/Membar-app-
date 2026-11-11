import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const routeText = await readFile(join(root, 'src/routes/routeConfig.tsx'), 'utf8');
const navigationText = await readFile(join(root, 'src/config/navigation.ts'), 'utf8');
const publicRouteText = await readFile(join(root, 'src/routes/publicRouteConfig.tsx'), 'utf8');
const registryText = await readFile(join(root, 'src/features/operations/operationalRegistry.ts'), 'utf8');
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const errors = [];
const warnings = [];
const exists = async path => { try { await stat(path); return true; } catch { return false; } };

const routeRows = [...routeText.matchAll(/\{ id:(\d+), path:"([^"]+)", workspace:"([^"]+)" as Workspace, component:(Screen\d+) \}/g)]
  .map(m => ({ id:Number(m[1]), path:m[2], workspace:m[3], component:m[4] }));
const lazyImports = [...routeText.matchAll(/const (Screen\d+) = lazy\(\(\) => import\('@\/([^']+)'\)\);/g)]
  .map(m => ({ component:m[1], path:m[2] }));
const workspaceCounts = routeRows.reduce((acc,row)=>(acc[row.workspace]=(acc[row.workspace]??0)+1,acc),{});
const expected = { Workspace:1, Member:45, Management:13, Governance:8, 'Platform Admin':17 };

if (routeRows.length !== 84) errors.push(`Expected 84 authenticated/workspace route contracts, found ${routeRows.length}`);
if (new Set(routeRows.map(r=>r.id)).size !== routeRows.length) errors.push('Duplicate route IDs detected');
if (new Set(routeRows.map(r=>r.path)).size !== routeRows.length) errors.push('Duplicate route paths detected');
for (const [workspace,count] of Object.entries(expected)) if (workspaceCounts[workspace] !== count) errors.push(`${workspace}: expected ${count}, found ${workspaceCounts[workspace]??0}`);
if (lazyImports.length !== routeRows.length) errors.push(`Lazy import count ${lazyImports.length} does not match route count ${routeRows.length}`);
for (const imp of lazyImports) {
  const tsx=join(root,'src',`${imp.path}.tsx`), ts=join(root,'src',`${imp.path}.ts`);
  if (!(await exists(tsx)) && !(await exists(ts))) errors.push(`Missing routed module @/${imp.path}`);
}

const legacyRoutes = routeRows.filter(r=>r.id<=80);
if (legacyRoutes.length !== 80 || Math.min(...legacyRoutes.map(r=>r.id))!==1 || Math.max(...legacyRoutes.map(r=>r.id))!==80) errors.push('Legacy 1-80 route compatibility contract is incomplete');
for (const required of ['/app/home','/app/dashboard','/app/events','/app/notifications','/app/promotions/:id']) if (!routeRows.some(r=>r.path===required)) errors.push(`Required practical route missing: ${required}`);

const memberImports = lazyImports.filter(imp=>/features\/member\/pages\//.test(imp.path));
for (const imp of memberImports) {
  const text=await readFile(join(root,'src',`${imp.path}.tsx`),'utf8');
  if (/ScreenPrototypePage|OperationalPage|screenCatalog/.test(text)) errors.push(`Member route still delegates to a generic runtime renderer: ${imp.path}`);
}
const managementImports=lazyImports.filter(imp=>/features\/management\/pages\//.test(imp.path));
if(managementImports.length!==13)errors.push(`Expected 13 dedicated Management page imports, found ${managementImports.length}`);
for(const imp of managementImports){
  const text=await readFile(join(root,'src',`${imp.path}.tsx`),'utf8');
  if(/network\/pages\/managementPages|ScreenPrototypePage|OperationalPage|screenCatalog/.test(text))errors.push(`Management route still delegates to retired/generic runtime renderer: ${imp.path}`);
}
if(await exists(join(root,'src/features/network/pages/managementPages.tsx')))errors.push('Retired shared Management page monolith still exists');
for (const runtimeFile of ['src/features/operations/operationalRegistry.ts','src/features/member/pages/SmartMemberBusinessDirectoryPage.tsx']) if (!(await exists(join(root,runtimeFile)))) errors.push(`Missing runtime module ${runtimeFile}`);
const operationalIds=[...registryText.matchAll(/^\s*(\d+):\{/gm)].map(m=>Number(m[1]));
const expectedOperational=[44,45,46,47,48,49,50,51,52,53,55,57,58,59,60,61,62,63,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80];
for (const id of expectedOperational) if (!operationalIds.includes(id)) errors.push(`Operational definition missing for route ${id}`);
for (const id of operationalIds) if (!expectedOperational.includes(id)) warnings.push(`Unexpected operational registry id ${id}`);

const sourceFiles=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())await walk(path);else if(/\.(ts|tsx)$/.test(entry.name))sourceFiles.push(path)}}
await walk(join(root,'src'));
for (const path of sourceFiles) {
  const text=await readFile(path,'utf8');
  const relative=path.slice(root.length+1);
  if (/\b(TODO|FIXME)\b|lorem ipsum/i.test(text)) errors.push(`Placeholder marker found in ${relative}`);
  if (/ScreenPrototypePage|screenCatalog/.test(text)) errors.push(`Legacy screen-catalog runtime dependency found in ${relative}`);
  const imports=[...text.matchAll(/(?:from\s+|import\()(['"])(@\/[^'"]+|\.\.?\/[^'"]+)\1/g)].map(m=>m[2]);
  for (const specifier of imports) {
    let base;
    if (specifier.startsWith('@/')) base=join(root,'src',specifier.slice(2));
    else base=resolve(path,'..',specifier);
    const candidates=[base,`${base}.ts`,`${base}.tsx`,`${base}.js`,join(base,'index.ts'),join(base,'index.tsx')];
    if (!(await Promise.any(candidates.map(async c=>(await exists(c))?c:Promise.reject())).catch(()=>false))) errors.push(`Unresolved local import ${specifier} in ${relative}`);
  }
}

const forbiddenVisible=['Screen 02 / 80','Current URL','Prototype data','Synthetic and locally persisted','Policy context revalidated','Authorised Scope View','Deep-link safe','screen contract','route contract'];
for (const token of forbiddenVisible) {
  const hits=[];
  for (const path of sourceFiles.filter(file => !/\.test\.(ts|tsx)$/.test(file))) if ((await readFile(path,'utf8')).toLowerCase().includes(token.toLowerCase())) hits.push(path.slice(root.length+1));
  if (hits.length) errors.push(`Removed UI phrase still present (${token}): ${hits.join(', ')}`);
}
if (!navigationText.includes("Featured & Discover") || !navigationText.includes("Platform Overview")) errors.push('Progressive workspace navigation is incomplete');

const publicPaths=[...publicRouteText.matchAll(/path:\s*'([^']+)'/g)].map(m=>m[1]);
const allKnownPaths=[...routeRows.map(r=>r.path),...publicPaths,'/access-status','/unauthorized'];
const routePatterns=allKnownPaths.map(path=>({path,re:new RegExp('^'+path.replace(/:[^/]+/g,'[^/]+')+'$')}));
const literalLinks=[];
for (const path of sourceFiles) {
  const text=await readFile(path,'utf8');
  for (const match of text.matchAll(/(?:nav\(|to=|href=)\s*["'`]([^"'`]+)["'`]/g)) {
    const href=match[1].split('?')[0].split('#')[0];
    if (href.startsWith('/') && !href.includes('${')) literalLinks.push({href,file:path.slice(root.length+1)});
  }
}
for (const link of literalLinks) {
  if (['/'].includes(link.href)) continue;
  if (!routePatterns.some(route=>route.re.test(link.href))) errors.push(`Literal internal link has no route: ${link.href} in ${link.file}`);
}

const deps=['react','react-dom','react-router-dom','@reduxjs/toolkit','react-redux','typescript','vite'];
for (const dep of deps) if (!(packageJson.dependencies?.[dep]||packageJson.devDependencies?.[dep])) errors.push(`Required dependency missing: ${dep}`);

console.log('SETHU enterprise source validation');
console.log(`Authenticated/workspace routes: ${routeRows.length} | Public/auth routes: ${publicPaths.length} | Legacy compatible: ${legacyRoutes.length} | Lazy pages: ${lazyImports.length}`);
console.log('Workspace route counts:',workspaceCounts);
console.log(`Purpose-built member page modules: ${memberImports.length} | Dedicated Management page modules: ${managementImports.length}`);
console.log(`Legacy registry definitions retained for route-contract/reference coverage: ${operationalIds.length}`);
console.log(`TypeScript source files audited: ${sourceFiles.length}`);
if (warnings.length) warnings.forEach(w=>console.warn('WARN:',w));
if (errors.length){errors.forEach(e=>console.error('ERROR:',e));process.exit(1)}
console.log('PASS: route contracts, local imports, runtime architecture, progressive navigation and prohibited UI-copy checks are structurally clean.');
