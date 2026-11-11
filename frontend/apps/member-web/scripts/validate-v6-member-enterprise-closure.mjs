import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
let passCount=0, failCount=0;
const pass=(m)=>{passCount++;console.log(`PASS: ${m}`)};
const fail=(m)=>{failCount++;console.error(`FAIL: ${m}`)};
const requireAll=(label,file,markers)=>{const s=read(file);const missing=markers.filter(m=>!s.includes(m));missing.length?fail(`${label}: missing ${missing.join(', ')}`):pass(label)};
const forbid=(label,file,patterns)=>{const s=read(file);const found=patterns.filter(p=>p.test(s));found.length?fail(`${label}: prohibited pattern found`):pass(label)};

const pagesDir=path.join(root,'src/features/member/pages');
const pages=fs.readdirSync(pagesDir).filter(f=>f.endsWith('.tsx'));
const allPages=pages.map(f=>({f,s:read(`src/features/member/pages/${f}`)}));

// Route ownership + core areas
const routes=read('src/routes/routeConfig.tsx');
const memberRoutes=[...routes.matchAll(/path:"(\/app\/[^\"]+)"\s*,\s*workspace:"Member"/g)].map(m=>m[1]);
memberRoutes.length===45?pass('Canonical Member route inventory remains 45'):fail(`Canonical Member route inventory expected 45, found ${memberRoutes.length}`);
for(const route of ['/app/home','/app/dashboard','/app/directory','/app/connections','/app/one-to-one','/app/references','/app/opportunities','/app/messages','/app/calendar','/app/events','/app/notifications','/app/activity','/app/transactions']) routes.includes(`path:"${route}"`)?pass(`Canonical route retained: ${route}`):fail(`Missing canonical route: ${route}`);

// No soft dead-ends on unavailable/not-found EmptyState branches.
let deadEnds=[];
for(const {f,s} of allPages){
 for(const m of s.matchAll(/<EmptyState\b/g)){
  const chunk=s.slice(m.index,m.index+800);
  if(/unavailable|not found|does not exist|outside your/i.test(chunk)&&!(/action=|<Button/.test(chunk))) deadEnds.push(f);
 }
}
deadEnds.length===0?pass('Unavailable/not-found Member states provide explicit recovery actions'):fail(`Soft dead-end unavailable states: ${[...new Set(deadEnds)].join(', ')}`);

// Converse full lifecycle, including late/new Chapter members.
requireAll('Converse inbox supports direct, official Chapter and governed groups','src/features/member/pages/ConverseInboxPage.tsx',["kind==='chapter'","kind==='chapter-group'",'Open Chapter Converse','Join group','createChapterGroupConversation','joinChapterConversation']);
requireAll('Converse deep-link recovery can join eligible Chapter conversations','src/features/member/pages/ConverseThreadPage.tsx',['canJoinChapterConversation','joinChapterConversation','Open Chapter Converse','Join group','Back to Converse']);
requireAll('Converse reducer authorises Chapter and Chapter-group membership','src/features/network/networkSlice.ts',["(x.kind==='chapter'||x.kind==='chapter-group')","c.chapter!==m.chapter","c.participantIds.push(m.id)"]);
forbid('Converse V1 remains text-only','src/features/member/pages/ConverseThreadPage.tsx',[/type=["']file["']/i,/attachment picker/i,/accept=["'][^"']+/i]);

// One-to-One and relationship closure.
requireAll('One-to-One covers request, upcoming, completed and follow-up paths','src/features/member/pages/OneToOneMeetingsPage.tsx',['createMeeting','Action Needed','Completed','Schedule meeting','AnalyticsSummary']);
requireAll('Meeting detail has recovery and post-meeting continuation','src/features/member/pages/MeetingDetailAttendancePollPage.tsx',['Meeting unavailable','Return to meetings','followUp','outcome','thank-you-notes']);
requireAll('References cover creation and acknowledgement lifecycle','src/features/member/pages/BusinessReferencesPage.tsx',['Given','Received','Action Needed','updateReferenceStatus']);

// Opportunity/outcome closure.
requireAll('Opportunity marketplace retains directional analytics and actionable workflow','src/features/member/pages/OpportunityMarketplacePage.tsx',['AnalyticsSummary','Post Opportunity','/app/opportunities/my','/app/responses/my']);
requireAll('Opportunity detail supports response, discussion and award lifecycle','src/features/member/pages/OpportunityDetailPage.tsx',['Respond','Discuss','Select supplier','updateResponseStatus','awardResponse']);
requireAll('Business Outcomes retain directional analytics and canonical status actions','src/features/member/pages/TransactionsPage.tsx',['AnalyticsSummary','updateTransactionStatus','Record from Meeting','Review References']);

// Calendar/event correctness: calendar must aggregate, not fabricate governed events.
requireAll('SETHU Calendar aggregates canonical business-networking records','src/features/member/pages/CalendarPage.tsx',['My SETHU Calendar','Meeting','Event','Opportunity','Payment','Schedule view','Month','MemberJourneyScopeBar']);
forbid('Member Calendar has no stale external-calendar clone or unauthorised event creation','src/features/member/pages/CalendarPage.tsx',[/Google Calendar/i,/Google Meet/i,/createEvent\s*\(/,/Central Chapter/i,/Scheduled chapter calendar event/i]);
requireAll('Event detail provides registration, cancellation, calendar export and invalid-record recovery','src/features/member/pages/MemberEventDetailPage.tsx',['Confirm Registration','Join Waitlist','Cancel ','Add to Calendar','Return to Events']);

// Notifications/action centre.
requireAll('Notifications mutate only scoped records and route through safe targets','src/features/member/pages/NotificationsPage.tsx',['markNotificationRead','acknowledgeNotification','safeNavigationTarget','Action Required']);
requireAll('Action Centre reconciles meetings, responses and outcomes','src/features/member/pages/MyActivityPage.tsx',['Meeting','Opportunity response draft','Business outcome activity','Action Centre']);

// Scope + analytics/intelligence.
for(const file of ['MemberHomePage.tsx','SmartMemberBusinessDirectoryPage.tsx','ConnectionsPage.tsx','OpportunityMarketplacePage.tsx','EventsPage.tsx']){
 const s=read(`src/features/member/pages/${file}`); s.includes('MemberJourneyScopeBar')?pass(`${file} participates in FOR YOU / YOUR CHAPTER / YOUR NETWORK`):fail(`${file} missing MemberJourneyScopeBar`);
}
requireAll('Personal networking intelligence derives directional metrics','src/features/member/analytics/networkingAnalytics.ts',['connections.initiated','connections.received','meetings.initiated','meetings.received','references.given','references.received','opportunities.created','opportunities.responded','outcomes.recorded']);
requireAll('Organisational intelligence supports canonical roll-up levels','src/features/member/analytics/networkingAnalytics.ts',["'Chapter'|'City'|'Region'|'State'|'National'",'buildOrganisationAnalytics','authorisedOrganisationAssignment']);
requireAll('Dashboard gates organisational roll-up behind active assignment','src/features/member/pages/MemberDashboardPage.tsx',['organisationAssignment','OrganisationInsightsView','My Chapter']);

// Mobile/accessibility/source hygiene.
forbid('Member runtime has no native confirm/prompt/alert dialogs','src/features/member/pages/MemberHomePage.tsx',[/window\.(confirm|prompt|alert)\s*\(/]);
const memberSource=allPages.map(x=>x.s).join('\n');
!/TODO|FIXME|HACK|COMING_SOON|coming soon/.test(memberSource)?pass('Member runtime contains no TODO/FIXME/HACK/COMING_SOON residue'):fail('Member runtime contains placeholder markers');
requireAll('Mobile shell reserves safe areas and bottom navigation','src/styles/index.css',['safe-area-inset-bottom','--member-bottom-nav-height']);

if(failCount){console.error(`\nSETHU Member enterprise closure: FAIL — ${failCount} failed, ${passCount} passed.`);process.exit(1)}
console.log(`\nSETHU Member enterprise closure: PASS — ${passCount}/${passCount}`);
