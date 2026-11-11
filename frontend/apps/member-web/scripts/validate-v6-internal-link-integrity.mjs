import fs from 'node:fs';import path from 'node:path';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const read=f=>fs.readFileSync(f,'utf8');let pass=0,fail=0;const ok=(c,m)=>{console.log(`${c?'PASS':'FAIL'}: ${m}`);c?pass++:fail++};
const routeText=read('src/routes/routeConfig.tsx')+'\n'+read('src/routes/publicRouteConfig.tsx');
const patterns=[...routeText.matchAll(/path\s*:\s*["']([^"']+)["']/g)].map(m=>m[1]);
patterns.push('/access-status','/unauthorized');
const sourceFiles=walk('src').filter(f=>/\.(ts|tsx)$/.test(f));
const allowedSchemes=['http:','https:','mailto:','tel:'];const workspaceRoots=new Set(['/app','/manage','/governance','/platform-admin']);
function pathPart(raw){return raw.split('?')[0].split('#')[0]||'/'}
function matches(target){
 const targetPath=pathPart(target);
 if(targetPath==='/'||workspaceRoots.has(targetPath)||patterns.includes(targetPath))return true;
 for(const pattern of patterns){
   const prefix=pattern.split('/:')[0];
   if(pattern.includes('/:')&&(targetPath===`${prefix}/`||targetPath.startsWith(`${prefix}/`)))return true;
 }
 return false;
}
const broken=[];let inspected=0;
for(const file of sourceFiles){const source=read(file);for(const m of source.matchAll(/(["'`])((?:\/(?:app|manage|governance|platform-admin|login|workspace|access-status|unauthorized|visitor|events|news|privacy|terms|forgot-access|activation)[^"'`\s}]*)?)\1/g)){const raw=m[2];if(!raw||allowedSchemes.some(s=>raw.startsWith(s)))continue;const normal=raw.replace(/\$\{[^}]+\}/g,'').replace(/\/+$/,'/') ;inspected++;if(!matches(normal))broken.push(`${file}: ${raw}`)}}
ok(patterns.length>=98,`Canonical/public route registry loaded (${patterns.length} patterns)`);
ok(inspected>100,`Internal literal/deep-link scan inspected ${inspected} targets`);
ok(broken.length===0,`All scanned internal links resolve to a canonical/public route pattern${broken.length?` (${broken.slice(0,20).join(' | ')})`:''}`);
console.log(`\nSETHU V6 internal-link integrity: ${fail?'FAIL':'PASS'} — ${pass}/${pass+fail}`);process.exit(fail?1:0);
