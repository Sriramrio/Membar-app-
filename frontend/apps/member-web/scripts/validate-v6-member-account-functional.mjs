import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
let pass=0,fail=0;const ok=(cond,msg)=>{if(cond){console.log(`PASS: ${msg}`);pass++}else{console.error(`FAIL: ${msg}`);fail++}};
const route=read('src/routes/routeConfig.tsx');
const routes={
 '/app/support':'MemberSupportPage','/app/family':'FamilyInformationPage','/app/membership':'MembershipPage','/app/attendance':'MyAttendancePage','/app/payments':'MyPaymentsPage','/app/activity':'MyActivityPage','/app/settings/privacy':'PrivacySettingsPage','/app/settings/notifications':'NotificationSettingsPage','/app/settings/security':'SecuritySettingsPage','/app/settings/install':'InstallOfflinePage'
};
for(const [path,page] of Object.entries(routes)){ok(route.includes(`path:\"${path}\"`)||route.includes(`path:"${path}"`),`${path} is canonical Member route`);ok(route.includes(`import('@/features/member/pages/${page}')`),`${path} uses ${page}`)}
const files={
 support:read('src/features/member/pages/MemberSupportPage.tsx'),family:read('src/features/member/pages/FamilyInformationPage.tsx'),membership:read('src/features/member/pages/MembershipPage.tsx'),attendance:read('src/features/member/pages/MyAttendancePage.tsx'),payments:read('src/features/member/pages/MyPaymentsPage.tsx'),activity:read('src/features/member/pages/MyActivityPage.tsx'),privacy:read('src/features/member/pages/PrivacySettingsPage.tsx'),notifications:read('src/features/member/pages/NotificationSettingsPage.tsx'),security:read('src/features/member/pages/SecuritySettingsPage.tsx'),install:read('src/features/member/pages/InstallOfflinePage.tsx')
};
const slice=read('src/features/network/networkSlice.ts');
ok(slice.includes("paymentId:string;memberId:string"),'Self-service payment mutation is Member-scoped');
ok(slice.includes("x.id===a.payload.paymentId&&x.memberId===a.payload.memberId"),'Payment lookup enforces Member ownership');
ok(slice.includes("r.correctionStatus==='requested'"),'Attendance duplicate correction request is guarded');
ok(slice.includes("const reason=a.payload.reason.trim()"),'Attendance correction reason is normalized');
ok(slice.includes("e.memberId===a.payload.memberId&&e.name.trim()&&e.relationship.trim()"),'Family persistence is Member-scoped and validates required values');
ok(slice.includes("subject.length<3||body.length<10"),'Support request reducer rejects underspecified requests');
ok(files.support.includes('canSubmit=subject.trim().length>=3&&body.trim().length>=10'),'Support UI matches reducer validation');
ok(files.support.includes('reference}));setSent(reference)'),'Support success reference is persisted with request');
ok(files.family.includes('const valid=entries.every'),'Family UI validates all editable entries');
ok(files.family.includes('disabled={!dirty||!valid}'),'Family save prevents invalid rows');
ok(files.privacy.includes("setDirtyGuard({dirty,label:'Privacy settings'"),'Privacy settings have unsaved-change guard');
ok(files.notifications.includes("setDirtyGuard({dirty,label:'Notification settings'"),'Notification settings have unsaved-change guard');
ok(files.security.includes('Verification policy'),'Security screen presents authoritative verification policy');
ok(!files.security.includes('setOtpLogin')&&!files.security.includes('setMfa'),'Security screen has no fake client-only OTP/MFA toggles');
ok(files.security.includes('revokeOtherSessions')&&files.security.includes('revokeSession'),'Security session revoke actions are wired');
ok(files.activity.includes("params.get('view')==='actions'"),'Activity Action Centre route state is implemented');
ok(files.install.includes('beforeinstallprompt')&&files.install.includes('appinstalled'),'PWA install flow listens to browser lifecycle');
for(const [name,src] of Object.entries(files)){ok(!src.includes("@/features/enterprise"),`${name} has no retired enterprise dependency`);ok(!/window\.(confirm|prompt)\s*\(/.test(src),`${name} has no native prompt/confirm`);ok(!/\bTODO\b|coming soon|Coming soon/.test(src),`${name} has no TODO/coming-soon placeholder`)}
if(fail){console.error(`\nSETHU V6.1 Member Account validation: FAIL (${pass} passed, ${fail} failed).`);process.exit(1)}
console.log(`\nSETHU V6.1 Member Account validation: PASS (${pass}/${pass} checks).`);
