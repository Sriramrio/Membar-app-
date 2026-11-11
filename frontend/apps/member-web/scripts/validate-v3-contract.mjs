import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const failures=[];
const passes=[];
const requireTokens=(file,tokens,label)=>{
  const text=read(file);
  const missing=tokens.filter(t=>!text.includes(t));
  if(missing.length) failures.push(`${label}: missing ${missing.join(', ')}`);
  else passes.push(`${label}: ${tokens.length} required contract markers present`);
};

requireTokens('src/routes/publicRouteConfig.tsx',[
  "path:'/'","path:'/login'","path:'/login/otp'","path:'/forgot-access'","path:'/visitor/register'","path:'/visitor/register/verify'","path:'/visitor/register/success'","path:'/activation'","path:'/events'","path:'/events/:id'","path:'/news'","path:'/news/:id'","path:'/privacy'","path:'/terms'"
],'Public/auth routes');
requireTokens('src/routes/ProtectedRoute.tsx',[
  '/login?returnTo=','/access-status?status=','reason=stale-context','canAccessPath','workspaceForPath','/unauthorized'
],'Protected route boundary');
requireTokens('src/features/member/components/MemberPageBoundary.tsx',[
  'member-${auth.account?.id',"workspaces.includes('Member')",'/unauthorized','document.title','aria-live'
],'Member boundary');
requireTokens('src/features/enterprise/enterpriseSlice.ts',[
  'saveVisitorDraft','verifyVisitorEmail','updateDueDiligenceCheck','recommendVisitor','decideVisitor','linkActivatedMember',
  "action:'Claim'|'Request Information'|'Approve'|'Reject'|'Delegate'|'Escalate'",'Maker cannot be checker',
  'configureImportMapping','validateImport','submitImportForCheck','approveImport','postImport','reconcileImport','reverseImport','Maker/checker segregation',
  'addRoleAssignment','Overlapping exclusive office','updateHandover','decideGovernance','Quorum not met','Unresolved conflict','revokeSession','revokeOtherSessions'
],'Enterprise workflow state');
requireTokens('src/features/network/types.ts',[
  "'private'|'admin'|'connections'|'chapter'|'network'|'public'",'waitlistIds','pollResponses','acknowledgementRequired','correctionStatus','confidentiality','valueVisibility','pinnedBy','mutedBy','archivedBy'
],'Network lifecycle models');
requireTokens('src/features/network/networkSlice.ts',[
  'cancelConnectionRequest','removeConnection','blockMember','createChapterGroupConversation','toggleConversationFlag','removeConversationParticipant','setMeetingPollResponse','acknowledgeAnnouncement','finaliseAttendance','requestAttendanceCorrection','approveAttendanceCorrection','updateReferenceStatus'
],'Member lifecycle reducers');
requireTokens('src/features/member/pages/SmartMemberBusinessDirectoryPage.tsx',[
  'People','Businesses','relationship','verification','scroll','URLSearchParams'
],'Directory depth');
requireTokens('src/features/member/pages/PrivacySettingsPage.tsx',[
  'Private','Admin only','Connections','Chapter','DBN Members','Public'
],'Field privacy UI');
requireTokens('src/features/member/pages/SecuritySettingsPage.tsx',[
  'sessions','MFA','OTP','revokeSession','revokeOtherSessions'
],'Security/session UI');
requireTokens('src/features/platform-admin/operations/ImportCentrePageV6.tsx',[
  'Mapping','Validated','Maker Submitted','Checker Approved','Posted','Reconciled','Reversed'
],'Import centre lifecycle');
requireTokens('src/features/platform-admin/access-control/RoleCatalogueAssignmentsPageV6.tsx',[
  'Effective operational assignments','exclusiveOffice','handoverStatus','successor','updateHandover','addRoleAssignment'
],'Role tenure admin UI');
requireTokens('src/features/governance/pages/DecisionRegisterPage.tsx',[
  'quorum','conflict','rationale','immutable'
],'Governance decision UI');

const appRoutes=read('src/routes/AppRoutes.tsx');
if(!appRoutes.includes('MemberPageBoundary')) failures.push('AppRoutes: MemberPageBoundary is not wired');
else passes.push('AppRoutes: MemberPageBoundary wired');
if(!appRoutes.includes('publicRouteConfig')) failures.push('AppRoutes: publicRouteConfig is not wired');
else passes.push('AppRoutes: publicRouteConfig wired');

console.log('SETHU V3 source-contract validation');
for(const p of passes) console.log(`PASS: ${p}`);
if(failures.length){for(const f of failures)console.error(`FAIL: ${f}`);process.exit(1)}
console.log(`PASS: ${passes.length} V3 contract groups satisfied by source markers.`);
