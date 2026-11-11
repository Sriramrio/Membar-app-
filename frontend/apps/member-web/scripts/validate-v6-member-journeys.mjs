import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = file => readFile(path.join(root, file), 'utf8');
let failures = 0;

function pass(message){ console.log(`PASS: ${message}`); }
function fail(message){ failures += 1; console.error(`FAIL: ${message}`); }
async function markers(label,file,required){
  const text=await read(file);
  const missing=required.filter(marker=>!text.includes(marker));
  if(missing.length) fail(`${label}: missing ${missing.join(' | ')}`);
  else pass(`${label}: ${required.length} source handoffs present`);
}

const routeSource=await read('src/routes/routeConfig.tsx');
const requiredRoutes=[
  '/app/dashboard','/app/directory','/app/members/:id','/app/businesses/:id','/app/connections',
  '/app/one-to-one','/app/meetings/:id','/app/references','/app/references/new','/app/transactions',
  '/app/opportunities','/app/opportunities/:id','/app/opportunities/:id/respond','/app/opportunities/my','/app/responses/my',
  '/app/events','/app/events/:id','/app/profile','/app/businesses','/app/membership','/app/payments',
];
const missingRoutes=requiredRoutes.filter(route=>!routeSource.includes(`path:"${route}"`)&&!routeSource.includes(`path:'${route}'`));
if(missingRoutes.length) fail(`Canonical journey routes missing: ${missingRoutes.join(', ')}`); else pass(`Canonical journey route inventory: ${requiredRoutes.length}/${requiredRoutes.length}`);

await markers('Journey A1 — discovery cards preserve Member navigation origin','src/features/network/components/NetworkUI.tsx',[
  'useMemberNavigation','go(`/app/businesses/${business.id}`','go(`/app/members/${member.id}`',
]);
await markers('Journey A2 — business to representative/network actions','src/features/member/pages/BusinessDetailPage.tsx',[
  'go(`/app/members/${primary.id}`','requestConnection','go(`/app/one-to-one?member=${primary.id}&business=${b.id}`','go(`/app/references?business=${b.id}`',
]);
await markers('Journey A3 — member relationship actions','src/features/member/pages/MemberDetailPage.tsx',[
  'requestConnection','respondConnection','createConversation','Schedule meeting','Give reference','Connected activity',
]);
await markers('Journey A4 — meeting context and completion','src/features/member/pages/OneToOneMeetingsPage.tsx',[
  'createMeeting','businessId: businessId || undefined','opportunityId: requestedOpportunity || undefined','referenceId: requestedReference || undefined',
]);
await markers('Journey A5 — completed meeting to reference/outcome','src/features/member/pages/MeetingDetailAttendancePollPage.tsx',[
  "status: 'completed'",'Give Business Reference','Record Business Outcome','createTransaction','/app/transactions?business=',
]);
await markers('Journey A6 — reference lifecycle to outcome','src/features/member/pages/BusinessReferencesPage.tsx',[
  'Acknowledged','Accepted','In Progress','Closed','/app/transactions?reference=',
]);

await markers('Journey B1 — opportunity discovery and context','src/features/network/components/NetworkUI.tsx',[
  'go(`/app/opportunities/${opportunity.id}`','useMemberNavigation',
]);
await markers('Journey B2 — opportunity buyer/save/question/respond/award','src/features/member/pages/OpportunityDetailPage.tsx',[
  'toggleSavedOpportunity','askOpportunityQuestion','/respond','createConversation','awardResponse','/app/transactions?opportunity=',
]);
await markers('Journey B3 — guided response persistence/submission','src/features/member/pages/OpportunityResponsePage.tsx',[
  'saveResponseDraft','submitResponse','Review before submitting','setDirtyGuard',
]);
await markers('Journey B4 — response tracking to business outcome','src/features/member/pages/MyResponsesPage.tsx',[
  'Continue Draft','Open Opportunity','Withdraw','Business Outcome','/app/transactions?opportunity=',
]);
await markers('Journey B5 — award creates measurable outcome','src/features/network/networkSlice.ts',[
  'awardResponse','Opportunity award: ${o.title}',"status:'proposed'",'businessRelationships.unshift',
]);

await markers('Journey C1 — event registration lifecycle','src/features/member/pages/MemberEventDetailPage.tsx',[
  'rsvpEvent','Join Waitlist','Confirm Registration','event.attendeeIds.map','go(`/app/members/${m.id}`',
]);
await markers('Journey C2 — attendee can continue relationship journey','src/features/member/pages/MemberDetailPage.tsx',[
  'View business','Connect with a business purpose','Schedule meeting','createConversation',
]);

await markers('Journey D1 — dashboard drives profile/business completion','src/features/member/dashboard/projections.ts',[
  "route:'/app/profile'","route:'/app/businesses'",'member.profileCompleteness','completeness(primaryBusiness)',
]);
await markers('Journey D2 — profile persistence updates completeness','src/features/member/pages/MyProfilePage.tsx',[
  'profileCompleteness:completion','updateMember','Save profile','setDirtyGuard',
]);
await markers('Journey D3 — business persistence and certification path','src/features/member/pages/MyBusinessesPage.tsx',[
  'updateBusiness','profileCompleteness:Math.max','upsertCertificationRecord','Save business','Estimated completeness',
]);

await markers('Journey E1 — dashboard payment action is source-backed','src/features/member/dashboard/projections.ts',[
  "p.status==='due'","route:'/app/payments'",'Payment due',
]);
await markers('Journey E2 — payment state and membership history','src/features/member/pages/MyPaymentsPage.tsx',[
  'payMembership','Amount Due','Payment History','Receipts are not fabricated',
]);
await markers('Journey E3 — membership reflects payment state without fabricated validity','src/features/member/pages/MembershipPage.tsx',[
  'payMembership','No payment currently due','Membership payment history','authoritative membership data',
]);

const stateMachines=await import(pathToFileURL(path.join(root,'src/features/network/stateMachines.ts')).href);
const transitionTests=[
  ['connection request from none',stateMachines.canRequestConnection('none')===true],
  ['connection request from declined',stateMachines.canRequestConnection('declined')===true],
  ['connection cannot regress from connected',stateMachines.canRequestConnection('connected')===false],
  ['connection cannot duplicate sent',stateMachines.canRequestConnection('sent')===false],
  ['connection response allowed from received',stateMachines.canRespondConnection('received')===true],
  ['connection response blocked from connected',stateMachines.canRespondConnection('connected')===false],
  ['meeting proposed → confirmed',stateMachines.canTransitionMeeting('proposed','confirmed')===true],
  ['meeting confirmed → completed',stateMachines.canTransitionMeeting('confirmed','completed')===true],
  ['meeting completed cannot regress',stateMachines.canTransitionMeeting('completed','confirmed')===false],
  ['response draft → submitted',stateMachines.canTransitionResponse('draft','submitted')===true],
  ['response submitted → discussion',stateMachines.canTransitionResponse('submitted','discussion')===true],
  ['response discussion → accepted',stateMachines.canTransitionResponse('discussion','accepted')===true],
  ['response accepted → won',stateMachines.canTransitionResponse('accepted','won')===true],
  ['response won cannot regress',stateMachines.canTransitionResponse('won','submitted')===false],
  ['reference Draft → Sent',stateMachines.canTransitionReference('Draft','Sent')===true],
  ['reference Sent → Acknowledged',stateMachines.canTransitionReference('Sent','Acknowledged')===true],
  ['reference Acknowledged → Accepted',stateMachines.canTransitionReference('Acknowledged','Accepted')===true],
  ['reference Accepted → In Progress',stateMachines.canTransitionReference('Accepted','In Progress')===true],
  ['reference In Progress → Closed',stateMachines.canTransitionReference('In Progress','Closed')===true],
  ['transaction proposed → contacted',stateMachines.canTransitionTransaction('proposed','contacted')===true],
  ['transaction contacted → discussion',stateMachines.canTransitionTransaction('contacted','discussion')===true],
  ['transaction discussion → proposal',stateMachines.canTransitionTransaction('discussion','proposal')===true],
  ['transaction proposal → negotiation',stateMachines.canTransitionTransaction('proposal','negotiation')===true],
  ['transaction negotiation → confirmed',stateMachines.canTransitionTransaction('negotiation','confirmed')===true],
  ['transaction confirmed → won',stateMachines.canTransitionTransaction('confirmed','won')===true],
  ['transaction won → closed',stateMachines.canTransitionTransaction('won','closed')===true],
  ['opportunity draft → open',stateMachines.canTransitionOpportunity('draft','open')===true],
  ['opportunity open → closed',stateMachines.canTransitionOpportunity('open','closed')===true],
  ['opportunity closed cannot reopen',stateMachines.canTransitionOpportunity('closed','open')===false],
];
for(const [label,ok] of transitionTests){ if(ok) pass(`Actual state machine — ${label}`); else fail(`Actual state machine — ${label}`); }

if(failures){
  console.error(`\nSETHU V6 Member journey validation: FAIL (${failures} group${failures===1?'':'s'}).`);
  process.exit(1);
}
console.log('\nSETHU V6 Member journey validation: PASS — five cross-functional journeys are route/action/state-machine linked at source level.');
console.log('NOTE: This M13 validator executes canonical state-machine functions directly and validates UI/reducer handoffs structurally. Dependency-backed component/browser execution remains an M14 release gate.');
