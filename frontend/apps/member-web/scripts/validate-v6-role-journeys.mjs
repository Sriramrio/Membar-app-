import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
let checks=0, failures=0;
const check=(ok,msg)=>{checks++;console.log(`${ok?'PASS':'FAIL'}: ${msg}`);if(!ok)failures++;};

const auth=read('src/features/auth/authService.ts');
const authSlice=read('src/features/auth/authSlice.ts');
const roleBar=read('src/components/layout/RoleContextBar.tsx');
const protectedRoute=read('src/routes/ProtectedRoute.tsx');
const routes=read('src/routes/routeConfig.tsx');
const navigation=read('src/config/navigation.ts');
const routeMetadata=read('src/config/routeMetadata.ts');
const cpData=read('src/features/control-plane/data.ts');
const routePermSource=read('src/features/control-plane/platformRoutePermissions.ts');

const expectedAccounts={
 member:{email:'member@sethu.local',role:'Member',workspaces:['Member']},
 secretary:{email:'secretary@sethu.local',role:'Chapter Secretary',workspaces:['Member','Management']},
 treasurer:{email:'treasurer@sethu.local',role:'Chapter Treasurer',workspaces:['Member','Management']},
 regional:{email:'regional@sethu.local',role:'Regional Convenor',workspaces:['Member','Management']},
 board:{email:'board@sethu.local',role:'Board Member',workspaces:['Member','Governance']},
 statereviewer:{email:'state-reviewer@sethu.local',role:'State Reviewer',workspaces:['Management']},
 governancereviewer:{email:'governance-reviewer@sethu.local',role:'Governance Reviewer',workspaces:['Governance']},
 platform:{email:'platform@sethu.local',role:'Platform Administrator',workspaces:['Platform Admin']},
 platformreviewer:{email:'platform-reviewer@sethu.local',role:'Platform Reviewer',workspaces:['Platform Admin']},
 superadmin:{email:'superadmin@sethu.local',role:'Super Administrator',workspaces:['Platform Admin']},
 qa:{email:'reviewer@sethu.local',role:'Cross-Workspace Reviewer',workspaces:['Member','Management','Governance','Platform Admin']},
};

function accountLine(id){return auth.split('\n').find(line=>line.includes(`{id:'${id}'`))??'';}
for(const [id,spec] of Object.entries(expectedAccounts)){
 const line=accountLine(id);
 check(Boolean(line),`role journey identity ${id} is seeded`);
 check(line.includes(`email:'${spec.email}'`),`${id} email matches deterministic preview credential`);
 for(const ws of spec.workspaces)check(line.includes(`'${ws}'`),`${id} has ${ws} workspace`);
 const forbidden=['Member','Management','Governance','Platform Admin'].filter(x=>!spec.workspaces.includes(x));
 for(const ws of forbidden)check(!line.match(new RegExp(`workspaces:\\[[^\\]]*'${ws}'`)),`${id} does not advertise unauthorized ${ws} workspace`);
}
check(auth.includes("DEFAULT_PREVIEW_PASSWORD='Sethu@123456'"),'all deterministic preview journeys share documented preview password');

const routeCounts={
 Member:(routes.match(/workspace:"Member" as Workspace/g)||[]).length,
 Management:(routes.match(/workspace:"Management" as Workspace/g)||[]).length,
 Governance:(routes.match(/workspace:"Governance" as Workspace/g)||[]).length,
 'Platform Admin':(routes.match(/workspace:"Platform Admin" as Workspace/g)||[]).length,
};
check(routeCounts.Member===45,'Member route inventory is 45');
check(routeCounts.Management===13,'Management route inventory is 13');
check(routeCounts.Governance===8,'Governance route inventory is 8');
check(routeCounts['Platform Admin']===17,'Platform Admin route inventory is 17');
for(const [ws,home] of Object.entries({Member:'/app/dashboard',Management:'/manage/dashboard',Governance:'/governance/dashboard','Platform Admin':'/platform-admin/dashboard'})){
 check(routeMetadata.includes(`workspace==='${ws}'?'${home}'`),`${ws} has canonical landing route ${home}`);
}
check(navigation.includes('export const workspaceHome=workspaceHomePath'),'workspace home resolution delegates to canonical route metadata');

check(protectedRoute.includes('if(!auth.authenticated||!account)'), 'ProtectedRoute requires authenticated account');
check(protectedRoute.includes('canIdentityAccessProtectedWorkspace(effectiveStatus)'), 'ProtectedRoute denies inactive/suspended identity');
check(protectedRoute.includes('if(staleContext)return <Navigate'), 'ProtectedRoute fails closed on stale role context');
check(protectedRoute.includes('if(!canAccessPath(account,location.pathname,roleAssignments))'), 'ProtectedRoute enforces workspace/assignment access for direct URLs');
check(protectedRoute.includes("if(targetWorkspace==='Platform Admin')"), 'Platform Admin routes receive additional policy evaluation');
check(protectedRoute.includes('evaluateControlPermission'), 'Platform Admin route permission is policy-engine enforced');
check(protectedRoute.includes("reason:'module-disabled'"), 'disabled Platform Admin modules fail closed');
check(protectedRoute.includes('to="/unauthorized"'), 'authorization denial has an explicit Unauthorized destination');

check(roleBar.includes('effectiveAssignments(auth.account,roleAssignments)'), 'Role switcher derives options from effective assignments');
check(roleBar.includes("if(dirty.dirty){setPending(target);return;}"), 'role switching protects unsaved work');
check(roleBar.includes("dispatch(selectMemberContext())"), 'role switcher supports return to Member context');
check(roleBar.includes("dispatch(selectAssignment(target.id))"), 'role switcher selects explicit non-Member assignment');
check(authSlice.includes('selectAssignment(state,action:PayloadAction<string>)'), 'auth state has explicit assignment switching');
check(authSlice.includes('syncEffectiveAssignments'), 'auth state can reconcile effective assignments');
check(authSlice.includes("state.account.workspaces=[...new Set(active.map(x=>x.workspace))]"), 'stale workspace access is rebuilt from active assignments');

const routePermModule=await import(pathToFileURL(path.join(root,'src/features/control-plane/platformRoutePermissions.ts')).href);
const platformAccess=await import(pathToFileURL(path.join(root,'src/features/platform-admin/access-control/platformAccess.ts')).href);
const routeEntries=Object.entries(routePermModule.PLATFORM_ADMIN_ROUTE_PERMISSIONS);
check(routeEntries.length===17,'all 17 Platform Admin routes have centralized permission contracts');
const requiredPerms=[...new Set(routeEntries.map(([,p])=>p))];
const roleLine=code=>cpData.split('\n').find(line=>line.includes(`code:'${code}'`))??'';
const pa=roleLine('PLATFORM_ADMIN'), pr=roleLine('PLATFORM_REVIEWER'), sa=roleLine('SUPER_ADMIN'), memberRole=roleLine('MEMBER');
for(const perm of requiredPerms){
 check(pa.includes(`'${perm}'`),`Platform Administrator can open route permission ${perm}`);
 check(pr.includes(`'${perm}'`),`Platform Reviewer can open route permission ${perm} for checker/inspection`);
}
check(sa.includes("permissionCodes:['*']"),'Super Administrator wildcard covers every Platform Admin route permission');
check(!memberRole.includes("platform.workspace.access"),'Member role cannot enter Platform Admin workspace');
check(platformAccess.canProposePlatformConfiguration('Platform Administrator')&&!platformAccess.canReviewPlatformConfiguration('Platform Administrator'),'Platform Administrator journey is maker-only for configuration review');
check(!platformAccess.canProposePlatformConfiguration('Platform Reviewer')&&platformAccess.canReviewPlatformConfiguration('Platform Reviewer'),'Platform Reviewer journey is checker-only for configuration review');
check(platformAccess.canProposePlatformConfiguration('Super Administrator')&&platformAccess.canReviewPlatformConfiguration('Super Administrator'),'Super Administrator has both authorities but remains subject to independence rules');
check(platformAccess.canMakeImportOperation('Platform Administrator')&&platformAccess.canReviewImportOperation('Platform Reviewer'),'import journey separates maker and checker roles');
check(!platformAccess.canManagePlatformAssignments('Platform Reviewer'),'Platform Reviewer inspection does not silently grant assignment mutation');

check(routePermSource.includes("'/platform-admin/dashboard'")&&routePermSource.includes("'/platform-admin/settings'"),'Platform Admin permission contract spans dashboard through settings');

if(failures){console.error(`\nSETHU V6.1 role journey validation: FAIL (${failures}/${checks} checks failed).`);process.exit(1);}
console.log(`\nSETHU V6.1 role journey validation: PASS (${checks}/${checks} checks).`);
console.log('NOTE: F15 is dependency-free source/state-policy journey validation. Actual browser login/navigation execution remains F17.');
