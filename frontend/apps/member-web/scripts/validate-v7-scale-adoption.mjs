import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const checks=[];const check=(label,ok)=>checks.push({label,ok});
const expected={
 'src/features/member/pages/SmartMemberBusinessDirectoryPage.tsx':['member.directory.businesses','member.directory.people','useRealtimeRefresh'],
 'src/features/member/pages/OpportunityMarketplacePage.tsx':['member.opportunities.marketplace','useRealtimeRefresh'],
 'src/features/member/pages/NotificationsPage.tsx':['member.notifications.list','useRealtimeRefresh'],
 'src/features/member/pages/ConverseInboxPage.tsx':['member.converse.inbox','useRealtimeRefresh'],
 'src/features/member/pages/ConverseThreadPage.tsx':['member.converse.messages','useRealtimeRefresh'],
 'src/features/member/pages/MyAttendancePage.tsx':['member.attendance.list','useRealtimeRefresh'],
 'src/features/member/pages/BusinessReferencesPage.tsx':['member.references.list','useRealtimeRefresh','useDomainCursorPage'],
 'src/features/member/pages/TransactionsPage.tsx':['member.transactions.list','useRealtimeRefresh','useDomainCursorPage'],
 'src/features/member/pages/OneToOneMeetingsPage.tsx':['member.meetings.list','useRealtimeRefresh','useDomainCursorPage'],
};
for(const [file,markers] of Object.entries(expected)){const s=read(file);check(`${file} server/realtime adoption`,markers.every(m=>s.includes(m)));}
const hook=read('src/hooks/useRealtimeRefresh.ts');check('Realtime refresh is wildcard-subscribed and burst-debounced',hook.includes("subscribe('*'")&&hook.includes('setTimeout(refresh,150)')&&hook.includes('clearTimeout'));
const cursor=read('src/hooks/useDomainCursorPage.ts');check('Cursor seam preserves preview/local and authoritative-server execution',cursor.includes('env.useMocks')&&cursor.includes('executeServerPage')&&cursor.includes('AbortController')&&cursor.includes('seq.current'));
let fail=0;for(const c of checks){console.log(`${c.ok?'PASS':'FAIL'}: ${c.label}`);if(!c.ok)fail++;}console.log(`\nSETHU V7 scale/realtime adoption: ${checks.length-fail}/${checks.length} PASS`);if(fail)process.exit(1);
