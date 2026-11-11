import fs from 'node:fs';import path from 'node:path';
const read=p=>fs.readFileSync(p,'utf8');const bad=[];const check=(name,ok)=>{if(ok)console.log('PASS',name);else bad.push(name)};
const types=read('src/domain/types.ts'),hier=read('src/domain/hierarchy.ts'),roles=read('src/domain/roles.ts'),routes=read('src/routes/routeRegistry.tsx'),catalog=read('src/contracts/catalog.ts'),continuity=read('src/pages/ContinuityPage.tsx'),member=read('src/pages/MemberDetailPage.tsx');
check('hierarchy levels Chapter Region City State National Management',types.includes("'CHAPTER'|'REGION'|'CITY'|'STATE'|'NATIONAL'|'MANAGEMENT'"));
for(const token of ["CHAPTER:'REGION'","REGION:'CITY'","CITY:'STATE'","STATE:'NATIONAL'","NATIONAL:'MANAGEMENT'"])check(`hierarchy parent ${token}`,hier.includes(token));
for(const route of ['/org/mc','/org/growth','/org/attendance','/org/kyt','/org/member-presentations','/org/chapter-coordinators','/org/roles-access','/org/handover'])check(`route ${route}`,routes.includes(route));
for(const role of ['CHAPTER_PRESIDENT','CHAPTER_SECRETARY','CHAPTER_TREASURER','CHAPTER_COORDINATOR','REGION_COORDINATOR','CITY_COORDINATOR','STATE_COORDINATOR','NATIONAL_PRESIDENT','NATIONAL_SECRETARY','NATIONAL_TREASURER','MANAGEMENT_REVIEWER'])check(`role ${role}`,roles.includes(role));
check('member transfer governed',catalog.includes("'org.member.transfer'")&&member.includes("commandType:'org.member.transfer'"));
check('continuity governed queries',continuity.includes("'org.delegations.list'")&&continuity.includes("'org.handovers.list'")&&continuity.includes("'org.availability.list'"));
check('continuity lifecycle commands',continuity.includes("'org.delegation.revoke'")&&continuity.includes("'org.handover.complete'"));
const src=[];const walk=d=>{for(const n of fs.readdirSync(d)){const p=path.join(d,n),st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(n))src.push(p)}};walk('src');for(const f of src){const t=read(f);if(/Chapter\s*(?:→|->)\s*City\s*(?:→|->)\s*Region/i.test(t))bad.push(`${f}: stale hierarchy order`);if(/(?:to|href)=["']#["']|javascript:/i.test(t))bad.push(`${f}: dummy link`)}
if(bad.length){bad.forEach(x=>console.error('FAIL',x));process.exit(1)}console.log('Hierarchy extension closure PASS');
