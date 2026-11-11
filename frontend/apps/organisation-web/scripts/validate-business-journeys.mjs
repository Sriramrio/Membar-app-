import fs from 'node:fs';
const routes=fs.readFileSync(new URL('../src/routes/routeRegistry.tsx',import.meta.url),'utf8');
const today=fs.readFileSync(new URL('../src/pages/TodayPage.tsx',import.meta.url),'utf8');
const focus=fs.readFileSync(new URL('../src/config/roleFocus.ts',import.meta.url),'utf8');
const required=['/org/mc','/org/growth','/org/kyt','/org/attendance','/org/member-presentations','/org/meetings','/org/member-cases','/org/committees','/org/events','/org/programmes','/org/chapter-coordinators','/org/regions','/org/cities','/org/states','/org/national','/org/management','/org/support','/org/escalations','/org/delegations','/org/handover'];
let failed=false;
for(const r of required){const ok=routes.includes(`path:'${r}'`);console.log(`${ok?'PASS':'FAIL'} journey route ${r}`);if(!ok)failed=true}
for(const role of ['CHAPTER_PRESIDENT','CHAPTER_SECRETARY','CHAPTER_TREASURER','REGION_COORDINATOR','CITY_COORDINATOR','STATE_COORDINATOR','NATIONAL_PRESIDENT','NATIONAL_SECRETARY','NATIONAL_TREASURER','MANAGEMENT_REVIEWER']){const ok=focus.includes(`${role}:`);console.log(`${ok?'PASS':'FAIL'} role focus ${role}`);if(!ok)failed=true}
const nextStep=today.includes('what you should do next')&&today.includes('roleFocus');console.log(`${nextStep?'PASS':'FAIL'} Today explains next action`);if(!nextStep)failed=true;
if(failed)process.exitCode=1;
