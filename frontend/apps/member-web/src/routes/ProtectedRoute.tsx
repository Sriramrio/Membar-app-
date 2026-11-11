import { useEffect, type ReactNode } from 'react';
import { Navigate,useLocation } from 'react-router-dom';
import { useAppDispatch,useAppSelector } from '@/app/hooks';
import { selectWorkspace } from '@/features/auth/authSlice';
import { canAccessPath,effectiveWorkspaces,workspaceForPath } from '@/utils/permissions';
import { evaluateControlPermission,platformPathPermission } from '@/features/control-plane/policyEngine';
import { requiredPermissionForWorkspacePath } from '@/features/control-plane/workspaceRoutePermissions';
import { selectRoleAssignments } from '@/features/platform-runtime/authorisationRuntime';
import { selectIdentityRecords } from '@/features/platform-runtime/identitySecurityRuntime';
import { canIdentityAccessProtectedWorkspace } from '@/features/platform-runtime/stateMachines';
export function ProtectedRoute({children,allowWorkspaceHub=false}:{children:ReactNode;allowWorkspaceHub?:boolean}){
  const auth=useAppSelector(s=>s.auth);const account=auth.account;const members=useAppSelector(s=>s.network.members);const roleAssignments=useAppSelector(selectRoleAssignments);const identities=useAppSelector(selectIdentityRecords);const controlPlane=useAppSelector(s=>s.controlPlane);const location=useLocation();const dispatch=useAppDispatch();const targetWorkspace=workspaceForPath(location.pathname);const returnTo=location.pathname+location.search;const accountMember=account?members.find(m=>m.id===`member-${account.id}`):undefined;const identity=account?identities.find(x=>x.accountId===account.id):undefined;const workspaces=effectiveWorkspaces(account,roleAssignments);const staleContext=Boolean(auth.activeWorkspace&&account&&targetWorkspace!=='Workspace'&&!workspaces.includes(auth.activeWorkspace));
  useEffect(()=>{if(account&&targetWorkspace!=='Workspace'&&targetWorkspace!=='Public'&&workspaces.includes(targetWorkspace)&&auth.activeWorkspace!==targetWorkspace&&!staleContext)dispatch(selectWorkspace(targetWorkspace))},[account?.id,targetWorkspace,auth.activeWorkspace,staleContext,dispatch,workspaces.join('|')]);
 if(!auth.authenticated||!account){
   const loginPath = targetWorkspace === 'Platform Admin' ? '/platformdbnnetwork' : '/login';
   return <Navigate to={`${loginPath}?returnTo=${encodeURIComponent(returnTo)}`} replace/>;
 }
 const effectiveStatus=identity?.status.toLowerCase()??account.status??(accountMember?.status==='suspended'?'suspended':'active');if(!canIdentityAccessProtectedWorkspace(effectiveStatus))return <Navigate to={`/access-status?status=${encodeURIComponent(effectiveStatus)}`} replace/>;
 if(staleContext)return <Navigate to={`/app/home?returnTo=${encodeURIComponent(returnTo)}&reason=stale-context`} replace/>;
 if(allowWorkspaceHub&&targetWorkspace==='Workspace')return children;
 if(!workspaces.includes(targetWorkspace)&&targetWorkspace!=='Workspace'&&targetWorkspace!=='Public'){
   if(targetWorkspace==='Platform Admin')return <Navigate to={`/platformdbnnetwork?returnTo=${encodeURIComponent(returnTo)}&denied=1`} replace/>;
   return <Navigate to="/app/home" replace/>;
 }
 if(!canAccessPath(account,location.pathname,roleAssignments))return <Navigate to="/unauthorized" replace state={{from:returnTo}}/>;
 return children;
}
