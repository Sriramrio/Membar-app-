import { readFile,readdir } from 'node:fs/promises';import { fileURLToPath } from 'node:url';import { join } from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));const read=async p=>readFile(join(root,p),'utf8');let failures=0;const pass=m=>console.log(`PASS: ${m}`);const fail=m=>{failures++;console.error(`FAIL: ${m}`)};
const pageDir=join(root,'src/features/member/pages');const pages=(await readdir(pageDir)).filter(f=>f.endsWith('.tsx'));
for(const f of pages){const t=await read(`src/features/member/pages/${f}`);if(/network\/pages\/memberPages|compatibilityProjection|LEGACY_MEMBER_NAV_STORAGE_KEYS|resolveLegacyRouteAlias/.test(t))fail(`${f} contains active legacy Member implementation/navigation dependency`)}
if(!failures)pass(`${pages.length} Member page modules have no detected legacy page/projection/navigation dependency`);
const groups={
 'dashboard/discovery':['MemberDashboardPage.tsx','MemberHomePage.tsx','SmartMemberBusinessDirectoryPage.tsx','CategoryIndexPage.tsx'],
 'profiles/businesses':['MemberDetailPage.tsx','BusinessDetailPage.tsx','MyProfilePage.tsx','MyBusinessesPage.tsx'],
 'networking':['ConnectionSuggestionsPage.tsx','ConnectionsPage.tsx','OneToOneMeetingsPage.tsx','MeetingDetailAttendancePollPage.tsx','BusinessReferencesPage.tsx','CreateReferencePage.tsx','ThankYouNotesPage.tsx'],
 'business':['OpportunityMarketplacePage.tsx','CreateOpportunityPage.tsx','OpportunityDetailPage.tsx','MyOpportunitiesPage.tsx','MyResponsesPage.tsx','OpportunityResponsePage.tsx','TransactionsPage.tsx'],
 'communication/community':['ConverseInboxPage.tsx','ConverseThreadPage.tsx','AnnouncementsPage.tsx','EventsPage.tsx','MemberEventDetailPage.tsx','CalendarPage.tsx','PhotoGalleryPage.tsx','NewsPage.tsx','PartnersPage.tsx','ResourcesPage.tsx','NotificationsPage.tsx','PromotionDetailPage.tsx'],
 'account':['MembershipPage.tsx','MyAttendancePage.tsx','MyPaymentsPage.tsx','MyActivityPage.tsx','PrivacySettingsPage.tsx','NotificationSettingsPage.tsx','SecuritySettingsPage.tsx','FamilyInformationPage.tsx','InstallOfflinePage.tsx','MemberSupportPage.tsx']
};
for(const [g,files] of Object.entries(groups)){const missing=files.filter(f=>!pages.includes(f));missing.length?fail(`${g} missing ${missing.join(', ')}`):pass(`${g}: ${files.length} canonical feature pages present`)}
const security=await read('src/features/member/pages/SecuritySettingsPage.tsx');if(security.includes('V4 enterprise state'))fail('Security page exposes legacy V4 wording');else if(!security.includes('V6 identity/security state'))fail('Security page missing canonical V6 identity/security wording');else pass('Security UX uses canonical V6 terminology');
const matrix=await read('V6_MEMBER_COMPONENT_OWNERSHIP_MATRIX.md');if(!matrix.includes('src/features/network/pages/memberPages.tsx')||!matrix.includes('RETIRED C07'))fail('Historical duplicate retirement evidence not documented');else pass('Historical duplicate is documented as retired after contract migration proof');
if(failures)process.exit(1);console.log('\nSETHU V6 Member Canonical Feature/Component validation: PASS (C04).');
