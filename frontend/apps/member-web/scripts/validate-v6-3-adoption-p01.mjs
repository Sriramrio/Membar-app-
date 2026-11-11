import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const checks=[
 ['granular read-model sources',read('src/features/network/readModel.ts').includes('export const selectMembers=')&&!read('src/features/network/readModel.ts').includes('const network=(s:RootState)=>s.network')],
 ['dual-mode cursor hook',read('src/hooks/useDomainCursorPage.ts').includes('executeServerPage')&&read('src/hooks/useDomainCursorPage.ts').includes('env.useMocks')],
 ['query-state primitives',read('src/components/data/QueryState.tsx').includes('QueryLoading')&&read('src/components/data/QueryState.tsx').includes('QueryError')],
 ['conflict-resolution primitive',read('src/components/concurrency/ConflictResolutionPanel.tsx').includes('Current server version')],
 ['command execution seam',read('src/services/commands/commandExecutor.ts').includes('executeCommandWithPolicy')],
 ['notifications migrated to cursor seam',read('src/features/member/pages/NotificationsPage.tsx').includes('useDomainCursorPage')],
 ['attendance migrated to cursor seam',read('src/features/member/pages/MyAttendancePage.tsx').includes('useDomainCursorPage')],
];
let pass=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}: ${name}`);if(ok)pass++;}
console.log(`\nV6.3 adoption P01: ${pass===checks.length?'PASS':'FAIL'} — ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
