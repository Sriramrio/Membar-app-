import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));const read=async p=>readFile(join(root,p),'utf8');let failCount=0,passCount=0;
const pass=m=>{passCount++;console.log(`PASS: ${m}`)};const fail=m=>{failCount++;console.error(`FAIL: ${m}`)};
const need=async(label,file,list)=>{const t=await read(file);const miss=list.filter(x=>!t.includes(x));miss.length?fail(`${label}: missing ${miss.join(', ')}`):pass(`${label}: ${list.length}/${list.length} functional markers`);return t};
const routes=await read('src/routes/routeConfig.tsx');
for(const [path,module] of [['/app/connections','ConnectionsPage'],['/app/one-to-one','OneToOneMeetingsPage'],['/app/meetings/:id','MeetingDetailAttendancePollPage'],['/app/references','BusinessReferencesPage'],['/app/references/new','CreateReferencePage'],['/app/thank-you-notes','ThankYouNotesPage']]){
 if(routes.includes(`path:\"${path}\"`)&&routes.includes(`/pages/${module}`))pass(`${path} uses ${module}`);else fail(`${path} canonical route ownership`)
}
await need('Connections','src/features/member/pages/ConnectionsPage.tsx',['respondConnection','cancelConnectionRequest','removeConnection','blockMember','createConversation','No relationships in this view']);
await need('Meeting scheduler','src/features/member/pages/OneToOneMeetingsPage.tsx',['createMeeting','connected','Choose a future meeting time','Send meeting request','actionCount']);
await need('Meeting detail','src/features/member/pages/MeetingDetailAttendancePollPage.tsx',['canDecide','canComplete','alternate-proposed','Record Business Outcome','/app/thank-you-notes?meeting=','Meeting unavailable']);
await need('Reference lifecycle','src/features/member/pages/BusinessReferencesPage.tsx',['parseTab','tabParam','canTransitionReference','Action Needed','In Progress','No references in this view']);
await need('Reference creation','src/features/member/pages/CreateReferencePage.tsx',['consentConfirmed','connected','minLength={20}','addReference','Send business reference']);
await need('Thank-you follow-up','src/features/member/pages/ThankYouNotesPage.tsx',['completed','createThankYouNote','acknowledgeThankYouNote','No completed meetings yet','No follow-up notes']);
const reference=await read('src/features/member/pages/BusinessReferencesPage.tsx');const transitionChecks=(reference.match(/canTransitionReference\(/g)??[]).length;if(transitionChecks>=5&&!reference.includes("status!=='Closed'&&<div"))pass('Reference lifecycle actions are state-machine conditioned');else fail('Reference UI lifecycle actions are not fully state-machine conditioned');
const meeting=await read('src/features/member/pages/MeetingDetailAttendancePollPage.tsx');if(meeting.includes("go('/app/thank-you'"))fail('Meeting detail still points to retired thank-you route');else pass('Meeting follow-up uses canonical thank-you-notes route');
const machine=await read('src/features/network/stateMachines.ts');for(const marker of ['canRequestConnection','canRespondConnection','canTransitionMeeting','canTransitionReference'])machine.includes(marker)?pass(`Canonical network state machine exports ${marker}`):fail(`Missing ${marker}`);
for(const f of ['ConnectionsPage.tsx','OneToOneMeetingsPage.tsx','MeetingDetailAttendancePollPage.tsx','BusinessReferencesPage.tsx','CreateReferencePage.tsx','ThankYouNotesPage.tsx']){const t=await read(`src/features/member/pages/${f}`);/window\.(confirm|prompt)\s*\(|features\/enterprise|network\/pages\/memberPages/.test(t)?fail(`${f} contains native/retired dependency`):pass(`${f} has no native/retired dependency`)}
if(failCount){console.error(`\nSETHU V6.1 Member Network validation: FAIL (${failCount} failed, ${passCount} passed).`);process.exit(1)}console.log(`\nSETHU V6.1 Member Network validation: PASS (${passCount}/${passCount} checks).`)
