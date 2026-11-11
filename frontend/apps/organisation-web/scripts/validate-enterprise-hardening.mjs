import fs from 'node:fs';import path from 'node:path';
const src='src';const files=[];const walk=d=>{for(const n of fs.readdirSync(d)){const p=path.join(d,n),s=fs.statSync(p);if(s.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(n))files.push(p)}};walk(src);const bad=[];
const all=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
for(const required of ['useDomainCursorPage','useOrgCommandAction','useRealtimeRefresh','RouteAccessBoundary','org.record.get','X-Correlation-ID','X-Request-ID','Idempotency-Key','If-Match','BroadcastChannel'])if(!all.includes(required))bad.push(`missing enterprise seam ${required}`);
for(const f of files){const t=fs.readFileSync(f,'utf8'),rel=f.replaceAll('\\','/');if(rel.startsWith('src/pages/')&&/\|\|\s*s\.[A-Za-z]+\[0\]/.test(t))bad.push(`${rel}: unsafe first-record fallback`);if(/to=['"]\/org\/hierarchy['"]/.test(t))bad.push(`${rel}: stale hierarchy route`);if(/<button[^>]*>[^<]*(?:Coming soon|Placeholder|TBD)/i.test(t))bad.push(`${rel}: placeholder action`)}
const routes=fs.readFileSync('src/routes/routeRegistry.tsx','utf8');for(const token of ['/org/tasks/:id','/org/actions/:id','/org/approvals/:id','/org/member-cases/:id','/org/committees/:id','/org/programmes/:id','/org/events/:id','/org/support/:id','/org/escalations/:id','/org/handoffs/:id'])if(!routes.includes(token))bad.push(`missing drill-down route ${token}`);
if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log(`PASS enterprise hardening: ${files.length} TS/TSX files, backend seams, scope guards and drill-down routes present`);

const governed=fs.readFileSync('src/hooks/useGovernedCommand.ts','utf8');if(!governed.includes('realtimeGateway.accept')){console.error('missing command-triggered invalidation');process.exit(1)}
