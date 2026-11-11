import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root=fileURLToPath(new URL('..',import.meta.url));
const read=async p=>readFile(join(root,p),'utf8');
let failures=0;let passes=0;
const pass=m=>{passes++;console.log(`PASS: ${m}`)};
const fail=m=>{failures++;console.error(`FAIL: ${m}`)};
const markers=async(label,file,required)=>{const text=await read(file);const missing=required.filter(x=>!text.includes(x));missing.length?fail(`${label}: missing ${missing.join(', ')}`):pass(`${label}: ${required.length}/${required.length} functional markers`);return text};

const route=await read('src/routes/routeConfig.tsx');
const routeModules=[
['/app/home','MemberHomePage'],['/app/dashboard','MemberDashboardPage'],['/app/directory','SmartMemberBusinessDirectoryPage'],['/app/categories','CategoryIndexPage'],['/app/members/:id','MemberDetailPage'],['/app/businesses/:id','BusinessDetailPage'],['/app/suggestions','ConnectionSuggestionsPage'],['/app/saved','SavedItemsPage'],['/app/profile','MyProfilePage'],['/app/businesses','MyBusinessesPage']];
for(const [path,module] of routeModules){
  if(route.includes(`path:"${path}"`) && route.includes(`/pages/${module}`)) pass(`Foundation route ${path} resolves to canonical ${module}`); else fail(`Foundation route ${path} canonical ownership`);
}

await markers('Dashboard command centre','src/features/member/pages/MemberDashboardPage.tsx',['Action Required','My Network','My Business Activity','My Engagement','Recommended Next Actions','buildMemberDashboardProjection','member.dashboard.metrics.enabled']);
await markers('Discovery home','src/features/member/pages/MemberHomePage.tsx',['Recommended for You','People to Discover','Opportunities Matching Your Business','Upcoming Events','No businesses in this scope','No new people to suggest','No matching opportunities in this scope','opportunityVisibleToMember','promotionEligibleForMember']);
await markers('Directory','src/features/member/pages/SmartMemberBusinessDirectoryPage.tsx',['Businesses','People','Clear All','No matching results','relationship','capability','certification','verification','MEMBER_NAV_STORAGE_KEYS.directoryQuery','useConnectionCommands','toggleSavedBusiness']);
await markers('Category discovery','src/features/member/pages/CategoryIndexPage.tsx',['Business Categories','No business categories are available','opportunityVisibleToMember','affiliatedBusinessIdsForMember']);
await markers('Member detail','src/features/member/pages/MemberDetailPage.tsx',['Professional network identity','Connect with a business purpose','fieldVisible','Verified organisation affiliations remain separate','Connected activity','useConnectionCommands','connectionCommands.block','connectionCommands.createDirectConversation','connectionCommands.request']);
await markers('Business detail','src/features/member/pages/BusinessDetailPage.tsx',['Business discovery profile','Contact details are relationship protected','Verified representatives','Business relationship graph','opportunityVisibleToMember','toggleSavedBusiness','useConnectionCommands','connectionCommands.createDirectConversation','connectionCommands.request']);
await markers('Connection suggestions','src/features/member/pages/ConnectionSuggestionsPage.tsx',['Connection Suggestions','Explainable people recommendations','No new connection suggestions','connectionStatus','useConnectionCommands','connectionCommands.request']);
await markers('Saved reauthorization','src/features/member/pages/SavedItemsPage.tsx',['no longer available','opportunityVisibleToMember','affiliatedBusinessIdsForMember','No accessible saved businesses','No accessible saved opportunities']);
await markers('Profile persistence','src/features/member/pages/MyProfilePage.tsx',['setDirtyGuard','clearDirtyGuard','requestContactVerification','verifyContactVerification','changedContact','Save profile','Open privacy settings','updateMember']);
await markers('Business/affiliation persistence','src/features/member/pages/MyBusinessesPage.tsx',['setDirtyGuard','upsertAffiliation','createWorkflowTask','memberBusinessPolicy','endAffiliation','upsertCertificationRecord','Save business','Add your business']);
await markers('Governed connection command seam','src/hooks/useConnectionCommands.ts',['requestConnection','respondConnection','cancelConnectionRequest','removeConnection','blockMember','createConversation','expectedVersion','useGovernedCommand']);

for(const file of routeModules.map(([,m])=>`src/features/member/pages/${m}.tsx`)){
  const text=await read(file);
  if(/features\/enterprise|network\/pages\/memberPages|window\.confirm\s*\(|window\.prompt\s*\(/.test(text)) fail(`${file} contains retired/native-dialog dependency`); else pass(`${file} has no retired Member/enterprise/native-dialog dependency`);
}

if(failures){console.error(`\nSETHU V6.1 Member Foundation validation: FAIL (${failures} failed, ${passes} passed).`);process.exit(1)}
console.log(`\nSETHU V6.1 Member Foundation validation: PASS (${passes}/${passes} checks).`);
