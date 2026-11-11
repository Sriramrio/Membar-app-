import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();const src=path.join(root,'src');
const files=[];const walk=d=>{for(const n of fs.readdirSync(d)){const p=path.join(d,n),st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(n)&&!n.endsWith('.d.ts'))files.push(path.normalize(p))}};walk(src);
const candidates=base=>[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')];
function resolve(from,spec){if(!spec.startsWith('.')&&!spec.startsWith('@/'))return undefined;const base=spec.startsWith('@/')?path.join(src,spec.slice(2)):path.resolve(path.dirname(from),spec);return candidates(base).map(path.normalize).find(x=>fs.existsSync(x));}
const graph=new Map();for(const f of files){const t=fs.readFileSync(f,'utf8');const deps=[];for(const m of t.matchAll(/(?:import\s+(?:[^'\"]+?\s+from\s+)?|export\s+[^'\"]+?\s+from\s+)['\"]([^'\"]+)['\"]/g)){const r=resolve(f,m[1]);if(r)deps.push(r)}for(const m of t.matchAll(/import\(['\"]([^'\"]+)['\"]\)/g)){const r=resolve(f,m[1]);if(r)deps.push(r)}graph.set(f,deps)}
const entry=path.normalize(path.join(src,'main.tsx'));const seen=new Set();const stack=[entry];while(stack.length){const f=stack.pop();if(!f||seen.has(f))continue;seen.add(f);for(const d of graph.get(f)??[])stack.push(d)}
const unreachable=files.filter(f=>!seen.has(f));if(unreachable.length){console.error('Unreachable production TS/TSX modules:\n'+unreachable.map(x=>path.relative(root,x)).join('\n'));process.exit(1)}
const reachable=files.filter(f=>seen.has(f)).length;console.log(`PASS source reachability: ${reachable}/${files.length} production TS/TSX modules reachable from src/main.tsx`);
