import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(); const src=path.join(root,'src');
const files=[]; const walk=d=>{for(const n of fs.readdirSync(d)){const p=path.join(d,n),s=fs.statSync(p);if(s.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(n))files.push(p)}};walk(src);
const bad=[]; const resolveLocal=(from,spec)=>{let base;if(spec.startsWith('@/'))base=path.join(src,spec.slice(2));else if(spec.startsWith('.'))base=path.resolve(path.dirname(from),spec);else return true;for(const c of [base,base+'.ts',base+'.tsx',base+'.js',base+'.jsx',path.join(base,'index.ts'),path.join(base,'index.tsx')])if(fs.existsSync(c))return true;return false};
for(const f of files){const t=fs.readFileSync(f,'utf8');for(const m of t.matchAll(/from\s+['"]([^'"]+)['"]/g)){if(!resolveLocal(f,m[1]))bad.push(`unresolved import ${m[1]} in ${path.relative(root,f)}`)}for(const m of t.matchAll(/import\(['"]([^'"]+)['"]\)/g)){if(!resolveLocal(f,m[1]))bad.push(`unresolved dynamic import ${m[1]} in ${path.relative(root,f)}`)}}
const routeText=fs.readFileSync(path.join(src,'routes','routeRegistry.tsx'),'utf8');const routes=[...routeText.matchAll(/path:'([^']+)'/g)].map(m=>m[1]);const dup=routes.filter((r,i)=>routes.indexOf(r)!==i);for(const r of new Set(dup))bad.push(`duplicate route ${r}`);
const normalize=p=>p.replace(/:[^/]+/g,':param');const routePatterns=routes.map(r=>new RegExp('^'+r.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/:[^/]+/g,'[^/]+')+'$'));
for(const f of files){const t=fs.readFileSync(f,'utf8');for(const m of t.matchAll(/(?:to|href)=['"](\/org\/[^'"]+)['"]/g)){const target=m[1];if(!routePatterns.some(rx=>rx.test(target)))bad.push(`broken internal link ${target} in ${path.relative(root,f)}`)}}

for(const f of files){const t=fs.readFileSync(f,'utf8');const rel=path.relative(root,f);if(/\|\|\s*s\.[A-Za-z]+\[0\]/.test(t))bad.push(`unsafe fallback to first record in ${rel}`);if(/['"]\/org\/hierarchy['"]/.test(t))bad.push(`stale hierarchy route in ${rel}`)}

const forbidden=routes.filter(r=>r.startsWith('/governance')||r.startsWith('/platform-admin')||r.startsWith('/app/'));if(forbidden.length)bad.push(`workspace boundary violation: ${forbidden.join(', ')}`);
if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log(`PASS integrity: ${files.length} files, ${routes.length} routes, imports and static links valid`);
