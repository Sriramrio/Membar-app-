import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), src=path.join(root,'src');
const exts=['.ts','.tsx','.js','.jsx'];
const files=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(exts.includes(path.extname(p)))files.push(path.resolve(p));}}
walk(src);
const set=new Set(files);
const importRe=/(?:import\s+(?:[^'\"]+?\s+from\s+)?|export\s+[^'\"]*?\s+from\s+|import\s*\()\s*['\"]([^'\"]+)['\"]/g;
function resolve(from,spec){let base;if(spec.startsWith('@/'))base=path.join(src,spec.slice(2));else if(spec.startsWith('.'))base=path.resolve(path.dirname(from),spec);else return null;const candidates=path.extname(base)?[base]:exts.map(e=>base+e).concat(exts.map(e=>path.join(base,'index'+e)));for(const c of candidates){const p=path.resolve(c);if(set.has(p))return p}return null}
const edges=new Map(files.map(f=>[f,new Set()]));
for(const f of files){const text=fs.readFileSync(f,'utf8');for(const m of text.matchAll(importRe)){const r=resolve(f,m[1]);if(r)edges.get(f).add(r)}}
const entry=['main.tsx','main.ts','index.tsx','index.ts'].map(n=>path.resolve(src,n)).find(p=>set.has(p));
if(!entry){console.error('FAIL: no application entry found');process.exit(1)}
const reachable=new Set([entry]), stack=[entry];while(stack.length){const f=stack.pop();for(const n of edges.get(f)||[]){if(!reachable.has(n)){reachable.add(n);stack.push(n)}}}
const allowed=p=>{const rel=path.relative(root,p).replaceAll('\\','/');return /\.test\.(ts|tsx)$/.test(rel)||rel.startsWith('src/migrations/')||rel==='src/vite-env.d.ts'};
const orphan=files.filter(f=>!reachable.has(f)&&!allowed(f)).map(f=>path.relative(root,f).replaceAll('\\','/')).sort();
if(orphan.length){console.error('FAIL: runtime-unreachable production modules remain:\n'+orphan.join('\n'));process.exit(1)}
console.log(`PASS: application import graph reaches ${reachable.size}/${files.length} source modules; all remaining unreachable modules are tests, migration-only compatibility, or vite-env declarations.`);
