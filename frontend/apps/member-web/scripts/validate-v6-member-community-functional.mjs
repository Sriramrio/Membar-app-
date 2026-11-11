import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root=fileURLToPath(new URL('..',import.meta.url));
const read=async p=>readFile(join(root,p),'utf8');
let failures=0,passes=0;
const pass=m=>{passes++;console.log(`PASS: ${m}`)};
const fail=m=>{failures++;console.error(`FAIL: ${m}`)};
const need=async(label,file,required)=>{const text=await read(file);const missing=required.filter(x=>!text.includes(x));missing.length?fail(`${label}: missing ${missing.join(', ')}`):pass(`${label}: ${required.length}/${required.length} functional markers`);return text};

const routes=await read('src/routes/routeConfig.tsx');
const routeModules=[
  ['/app/messages','ConverseInboxPage'],
  ['/app/messages/:conversationId','ConverseThreadPage'],
  ['/app/announcements','AnnouncementsPage'],
  ['/app/events','EventsPage'],
  ['/app/events/:id','MemberEventDetailPage'],
  ['/app/calendar','CalendarPage'],
  ['/app/gallery','PhotoGalleryPage'],
  ['/app/news','NewsPage'],
  ['/app/partners','PartnersPage'],
  ['/app/resources','ResourcesPage'],
  ['/app/notifications','NotificationsPage'],
  ['/app/promotions/:id','PromotionDetailPage'],
];
for(const [path,module] of routeModules){
  routes.includes(`path:"${path}"`)&&routes.includes(`/pages/${module}`)?pass(`${path} uses ${module}`):fail(`${path} canonical route ownership`);
}

await need('Converse inbox','src/features/member/pages/ConverseInboxPage.tsx',['createChapterGroupConversation','joinChapterConversation','canManageChapterGroups','Chapter group','Unread','Archived','toggleConversationFlag']);
await need('Converse thread','src/features/member/pages/ConverseThreadPage.tsx',['participantIds.includes(memberId)','markConversationRead','sendMessage','replyToId','Text only in this version','Schedule meeting']);
await need('Announcements','src/features/member/pages/AnnouncementsPage.tsx',['acknowledgeAnnouncement','acknowledgementRequired','Requires Action','Archived','No announcements in this view']);
await need('Events','src/features/member/pages/EventsPage.tsx',['Upcoming','Registered','Attended','Past','View & register','waitlist']);
await need('Event detail','src/features/member/pages/MemberEventDetailPage.tsx',['registrationOpen','requiredComplete','acceptedTerms','Join Waitlist','Confirm Registration','addCalendar','attendeeVisibility']);
await need('Calendar','src/features/member/pages/CalendarPage.tsx',['Meeting','Event','Opportunity','Payment','agenda','month','Schedule view']);
await need('Gallery','src/features/member/pages/PhotoGalleryPage.tsx',['galleryItems','published','No published gallery items','eventId']);
await need('News','src/features/member/pages/NewsPage.tsx',['published network announcements','real upcoming events','Network Updates','Event Briefing','View event']);
await need('Partners','src/features/member/pages/PartnersPage.tsx',['Partner Ecosystem','/app/directory?q=${encodeURIComponent(query)}','Discover in network','normal member/business visibility']);
await need('Resources','src/features/member/pages/ResourcesPage.tsx',['Opportunity Response Checklist','URL.createObjectURL','a.download','No resources found']);
await need('Notifications','src/features/member/pages/NotificationsPage.tsx',['markAllNotificationsRead','notification.mark-read','notification.acknowledge','executeCommand','Action Required','Acknowledged']);
await need('Promotion detail','src/features/member/pages/PromotionDetailPage.tsx',['promotionEligibleForMember','recordPromotionEvent','useConnectionCommands','connectionCommands.request','connectionCommands.createDirectConversation','Business Saved','Promotion unavailable']);

const slice=await read('src/features/network/networkSlice.ts');
for(const marker of [
  "a.payload.authorised||!creator||groupName.length<3",
  "x.kind==='chapter-group'",
  "participantIds.includes(a.payload.senderMemberId)",
  "replyToId&&!state.messages.some",
  "participantIds.includes(a.payload.memberId)",
  "e.registrationOpenAt&&new Date(e.registrationOpenAt)>now",
  "e.registrationCloseAt&&new Date(e.registrationCloseAt)<now",
  "e.terms&&!a.payload.acceptedTerms",
  "notificationId:string;memberId:string",
  "x.id===a.payload.notificationId&&x.memberId===a.payload.memberId",
  "n&&n.acknowledgementRequired",
  "p.status!=='active'||p.startDate>today||p.endDate<today",
]) slice.includes(marker)?pass(`Community reducer guard: ${marker}`):fail(`Missing community reducer guard: ${marker}`);

const home=await read('src/features/member/pages/MemberHomePage.tsx');
!home.includes('rsvpEvent({eventId:e.id')&&home.includes("go(`/app/events/${e.id}`")?pass('Home event CTA routes through governed event detail registration'):fail('Home event CTA still bypasses governed event detail registration');
const header=await read('src/components/layout/Header.tsx');
header.includes('markNotificationRead({ notificationId: n.id, memberId })')?pass('Header notification mutation is Member-scoped'):fail('Header notification mutation is not Member-scoped');

for(const [,module] of routeModules){
  const file=`src/features/member/pages/${module}.tsx`;
  const text=await read(file);
  /features\/enterprise|network\/pages\/memberPages|window\.confirm\s*\(|window\.prompt\s*\(|TODO|COMING_SOON|coming soon/i.test(text)?fail(`${file} contains retired/native/placeholder dependency`):pass(`${file} has no retired/native/placeholder dependency`);
}

if(failures){console.error(`\nSETHU V6.1 Member Community validation: FAIL (${failures} failed, ${passes} passed).`);process.exit(1)}
console.log(`\nSETHU V6.1 Member Community validation: PASS (${passes}/${passes} checks).`);
