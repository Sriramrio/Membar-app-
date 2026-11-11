import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');let pass=0,fail=0;const check=(ok,msg)=>{console.log(`${ok?'PASS':'FAIL'}: ${msg}`);ok?pass++:fail++};
const bridge=read('src/navigation/DirtyNavigationBridge.tsx');const hook=read('src/navigation/useDirtyGuard.ts');const layout=read('src/layouts/MainLayout.tsx');const guard=read('src/features/member/navigation/NavigationGuardDialog.tsx');
check(bridge.includes('beforeunload'),'Dirty bridge protects tab/window unload');
check(bridge.includes("document.addEventListener('click',capture,true)"),'Dirty bridge captures internal anchor navigation');
check(bridge.includes('setPendingNavigation'),'Dirty bridge routes blocked navigation through canonical pending navigation');
check(layout.includes('<DirtyNavigationBridge />'),'Main layout mounts global dirty-navigation bridge');
check(hook.includes('setDirtyGuard')&&hook.includes('clearDirtyGuard'),'Reusable dirty hook owns register/cleanup lifecycle');
check(guard.includes('Discard & continue')&&guard.includes('Save Draft & Continue'),'Navigation guard provides discard and registered-draft choices');
for(const [p,label] of [
 ['src/features/management/pages/AnnouncementManagementPage.tsx','Management announcement draft'],
 ['src/features/management/pages/EventManagementPage.tsx','Management event draft'],
 ['src/features/management/pages/PromotionManagementPage.tsx','Management promotion draft'],
 ['src/features/governance/pages/PolicyExceptionsPage.tsx','Governance exception draft'],
 ['src/features/platform-admin/operations/NotificationAdministrationPageV6.tsx','Platform notification revision'],
 ['src/features/platform-admin/operations/IntegrationAdministrationPageV6.tsx','Platform integration revision'],
 ['src/features/platform-admin/workflow-taxonomy/WorkflowDesignerPageV6.tsx','Platform workflow revision'],
 ['src/features/platform-admin/workflow-taxonomy/TaxonomyPageV6.tsx','Platform taxonomy revision'],
 ['src/features/platform-admin/access-control/RACIPageV6.tsx','Platform RACI revision'],
 ['src/features/platform-admin/policies/PromotionPolicyPageV6.tsx','Platform promotion-policy revision'],
 ['src/features/control-plane/components/AdminPolicyEditors.tsx','Shared control-plane policy editors'],
])check(read(p).includes('useDirtyGuard'),`${label} registers dirty state`);
console.log(`\nSETHU V6 N06 dirty-navigation closure: ${fail?'FAIL':'PASS'} — ${pass}/${pass+fail}`);process.exit(fail?1:0);
