import fs from 'node:fs';import path from 'node:path';
const bad=[];const read=p=>fs.readFileSync(p,'utf8');
const routes=read('src/routes/routeRegistry.tsx');const app=read('src/routes/OrgApp.tsx');const css=read('src/styles/global.css');const budgets=read('src/config/performanceBudgets.ts');
if(/from ['"]@\/pages\//.test(routes))bad.push('routeRegistry eagerly imports page modules; route-level lazy loading required');
if(!routes.includes("lazy(()=>import('@/pages/"))bad.push('route-level lazy imports not found');
if(!app.includes('<Suspense'))bad.push('route Suspense fallback missing');
for(const token of ['uiFeedbackMs:100','cachedUsableMs:1000','readP95Ms:800','searchP95Ms:800','commandP95Ms:1000','maxPageSize:100'])if(!budgets.includes(token))bad.push(`performance budget missing ${token}`);
for(const token of [':focus-visible','min-height:44px','prefers-reduced-motion','.skip-link'])if(!css.includes(token))bad.push(`accessibility CSS control missing ${token}`);
const files=[];const walk=d=>{for(const n of fs.readdirSync(d)){const p=path.join(d,n),st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(n))files.push(p)}};walk('src');
for(const f of files){const t=read(f);for(const m of t.matchAll(/pageSize\s*:\s*(\d+)/g)){if(Number(m[1])>100)bad.push(`${f}: pageSize ${m[1]} exceeds hard maximum 100`)}if(/\.map\([^)]*=>[^\n]*<[^>]+>/.test(t)&&t.length>25000)bad.push(`${f}: unusually large mapped page module; review render windowing`)}
if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log(`PASS performance/accessibility static gates: lazy routes, Suspense, budgets, touch/focus/reduced-motion and bounded page sizes`);
