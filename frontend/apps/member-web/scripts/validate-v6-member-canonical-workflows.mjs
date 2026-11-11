import { readFile } from 'node:fs/promises';import { fileURLToPath } from 'node:url';import { join } from 'node:path';
import {canRequestConnection,canRespondConnection,canTransitionMeeting,canTransitionOpportunity,canTransitionReference,canTransitionResponse,canTransitionTransaction} from '../src/features/network/stateMachines.ts';
const root=fileURLToPath(new URL('..',import.meta.url));const read=async p=>readFile(join(root,p),'utf8');let failures=0;const pass=m=>console.log(`PASS: ${m}`);const fail=m=>{failures++;console.error(`FAIL: ${m}`)};
const checks=[
 ['connection request none',canRequestConnection('none')],['connection request connected denied',!canRequestConnection('connected')],['connection response received',canRespondConnection('received')],
 ['meeting proposed→confirmed',canTransitionMeeting('proposed','confirmed')],['meeting completed cannot regress',!canTransitionMeeting('completed','confirmed')],
 ['opportunity draft→open',canTransitionOpportunity('draft','open')],['opportunity closed cannot reopen',!canTransitionOpportunity('closed','open')],
 ['response draft→submitted',canTransitionResponse('draft','submitted')],['response submitted→discussion',canTransitionResponse('submitted','discussion')],['response won terminal',!canTransitionResponse('won','submitted')],
 ['reference Draft→Sent',canTransitionReference('Draft','Sent')],['reference In Progress→Closed',canTransitionReference('In Progress','Closed')],
 ['outcome proposed→contacted',canTransitionTransaction('proposed','contacted')],['outcome confirmed→won',canTransitionTransaction('confirmed','won')],['outcome closed terminal',!canTransitionTransaction('closed','confirmed')]
];for(const [n,ok] of checks)ok?pass(n):fail(n);
const sources={
 J01:['src/features/member/pages/SmartMemberBusinessDirectoryPage.tsx','src/features/member/pages/BusinessDetailPage.tsx','src/features/member/pages/MemberDetailPage.tsx','src/features/member/pages/OneToOneMeetingsPage.tsx','src/features/member/pages/BusinessReferencesPage.tsx','src/features/member/pages/TransactionsPage.tsx'],
 J02:['src/features/member/pages/OpportunityMarketplacePage.tsx','src/features/member/pages/OpportunityDetailPage.tsx','src/features/member/pages/OpportunityResponsePage.tsx','src/features/member/pages/MyResponsesPage.tsx','src/features/member/pages/TransactionsPage.tsx'],
 J03:['src/features/member/pages/EventsPage.tsx','src/features/member/pages/MemberEventDetailPage.tsx','src/features/member/pages/MemberDetailPage.tsx','src/features/member/pages/BusinessDetailPage.tsx'],
 J04:['src/features/member/pages/MemberDashboardPage.tsx','src/features/member/pages/MyProfilePage.tsx','src/features/member/pages/MyBusinessesPage.tsx'],
 J05:['src/features/member/pages/MemberDashboardPage.tsx','src/features/member/pages/MembershipPage.tsx','src/features/member/pages/MyPaymentsPage.tsx']
};
for(const [j,files] of Object.entries(sources)){for(const f of files){const t=await read(f);if(/network\/pages\/memberPages|LEGACY_MEMBER_NAV_STORAGE_KEYS|resolveLegacyRouteAlias/.test(t))fail(`${j} legacy handoff in ${f}`)}pass(`${j}: canonical source handoff set inspected (${files.length} modules)`)}
const slice=await read('src/features/network/networkSlice.ts');for(const marker of ['canRequestConnection(existing.status)','canRespondConnection(c.status)','canTransitionMeeting','canTransitionOpportunity','canTransitionResponse','canTransitionReference','canTransitionTransaction'])slice.includes(marker)?pass(`network reducer uses ${marker}`):fail(`network reducer missing ${marker}`);
if(failures)process.exit(1);console.log('\nSETHU V6 Member Canonical Workflow/Journey validation: PASS (C05).');
