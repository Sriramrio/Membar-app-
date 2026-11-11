import fs from 'node:fs';import path from 'node:path';
const r=process.cwd();const read=p=>fs.readFileSync(path.join(r,p),'utf8');
const auth=read('src/features/auth/authService.ts'), runtime=read('src/features/platform-runtime/platformRuntimeData.ts'), slice=read('src/features/auth/authSlice.ts'), bar=read('src/components/layout/RoleContextBar.tsx'), hub=read('src/features/workspaces/pages/WorkspaceHubPage.tsx');
const accounts=[['statereviewer','State Reviewer','Management'],['governancereviewer','Governance Reviewer','Governance'],['platformreviewer','Platform Reviewer','Platform Admin'],['superadmin','Super Administrator','Platform Admin']];
let fail=0;const c=(ok,m)=>{console.log(`${ok?'PASS':'FAIL'}: ${m}`);if(!ok)fail++};
for(const [id,role,ws] of accounts){c(auth.includes(`id:'${id}'`)&&auth.includes(`role:'${role}'`)&&auth.includes(`workspaces:['${ws}']`),`${id} auth assignment`);c(runtime.includes(`accountId:'${id}'`)&&runtime.includes(`role:'${role}'`)&&runtime.includes(`workspace:'${ws}'`),`${id} canonical runtime assignment`);c(runtime.includes(`accountId:'${id}'`)&&runtime.includes(`email:'${id==='statereviewer'?'state-reviewer@sethu.local':id==='governancereviewer'?'governance-reviewer@sethu.local':id==='platformreviewer'?'platform-reviewer@sethu.local':'superadmin@sethu.local'}'`),`${id} identity record`)}
c(!slice.includes('payloadNonMember.length?payloadNonMember:nonMember'),'revoked non-Member assignments are not silently retained');
c(slice.includes("state.account.workspaces=[...new Set(active.map(x=>x.workspace))]"),'workspace list is rebuilt from active/effective assignments');
c(bar.includes('const hasMember=Boolean(memberAssignment)')&&bar.includes('if(!hasMember)return'),'Member switch is offered/executed only when Member assignment exists');
c(hub.includes('isSafeLocalReturnPath(returnTo)'),'Workspace Hub deep link uses shared local-return guard');
if(fail)process.exit(1);console.log('\nSETHU V6.1 role/identity/assignment source validation: PASS.');
