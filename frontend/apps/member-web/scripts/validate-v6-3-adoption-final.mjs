import fs from 'node:fs';
const r=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const pages=['SmartMemberBusinessDirectoryPage.tsx','OpportunityMarketplacePage.tsx','NotificationsPage.tsx','ConverseInboxPage.tsx','ConverseThreadPage.tsx','MyAttendancePage.tsx'].map(x=>r(`src/features/member/pages/${x}`)).join('\n');
const memberDir=new URL('../src/features/member/pages/',import.meta.url);const memberFiles=fs.readdirSync(memberDir).filter(x=>x.endsWith('.tsx')).map(x=>fs.readFileSync(new URL(x,memberDir),'utf8')).join('\n');
const checks=[
 ['directory server cursor adoption',pages.includes("member.directory.businesses")&&pages.includes("member.directory.people")],
 ['opportunity server cursor adoption',pages.includes("member.opportunities.marketplace")],
 ['notification server cursor adoption',pages.includes("member.notifications.list")],
 ['Converse inbox/message server cursor adoption',pages.includes("member.converse.inbox")&&pages.includes("member.converse.messages")],
 ['attendance server cursor adoption',pages.includes("member.attendance.list")],
 ['member business pages no raw Date.now',!memberFiles.includes('Date.now()')],
 ['stable client command IDs',r('src/hooks/useDomainCommandExecutor.ts').includes("stableClientId('cmd')")],
 ['conflict UX primitive present',r('src/components/concurrency/ConflictResolutionPanel.tsx').includes('Reload latest')],
 ['query state UX primitive present',r('src/components/data/QueryState.tsx').includes('Unable to load results')],
 ['read-model granularized',!r('src/features/network/readModel.ts').includes('const network=(s:RootState)=>s.network')],
];
let pass=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}: ${name}`);if(ok)pass++;}
console.log(`\nSETHU V6.3 frontend adoption final: ${pass===checks.length?'PASS':'FAIL'} — ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
