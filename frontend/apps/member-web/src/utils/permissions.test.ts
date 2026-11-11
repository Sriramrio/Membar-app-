import { describe, expect, it } from 'vitest';
import { canAccessPath } from './permissions';
import { previewAccounts } from '@/features/auth/authService';

describe('default-deny workspace guard', () => {
  const member = previewAccounts.find(a => a.id === 'member')!;
  it('permits member app', () => expect(canAccessPath(member, '/app/home')).toBe(true));
  it('denies platform admin', () => expect(canAccessPath(member, '/platform-admin/rbac')).toBe(false));
  it('permits workspace hub', () => expect(canAccessPath(member, '/workspace')).toBe(true));
  it('denies unauthenticated user from protected route', () => expect(canAccessPath(null, '/app/home')).toBe(false));

  it('checks all preview accounts for their home paths', async () => {
    const { initialPlatformControlState } = await import('@/features/control-plane/data');
    const { initialPlatformRuntimeState } = await import('@/features/platform-runtime/platformRuntimeData');
    const { workspaceForPath } = await import('./permissions');
    const { evaluateControlPermission, platformPathPermission } = await import('@/features/control-plane/policyEngine');
    const { requiredPermissionForWorkspacePath } = await import('@/features/control-plane/workspaceRoutePermissions');
    const { workspaceHomePath } = await import('@/config/routeMetadata');

    const roleAssignments = initialPlatformRuntimeState.authorisation.assignments;
    const identities = initialPlatformRuntimeState.identitySecurity.identities;
    const controlPlane = initialPlatformControlState;

    for (const a of previewAccounts) {
      const { store } = await import('@/app/store');
      const { authenticateAccount } = await import('@/features/auth/authSlice');
      store.dispatch(authenticateAccount(a));
      const state = store.getState();
      const currentAccount = state.auth.account!;
      const currentRoleAssignments = state.platformRuntime.authorisation.assignments;
      const currentIdentities = state.platformRuntime.identitySecurity.identities;
      const currentControlPlane = state.controlPlane;
      const currentIdentity = currentIdentities.find(x => x.accountId === a.id);

      const home = currentAccount.workspaces.length === 1 ? workspaceHomePath(currentAccount.workspaces[0]) : '/workspace';
      const targetWorkspace = workspaceForPath(home);
      const canAccess = canAccessPath(currentAccount, home, currentRoleAssignments);
      
      let allowed = true;
      let reason = '';
      if (targetWorkspace === 'Platform Admin') {
        const decision = evaluateControlPermission({ account: currentAccount, identity: currentIdentity, enterpriseAssignments: currentRoleAssignments, state: currentControlPlane, permissionCode: platformPathPermission(home), unitName: state.auth.activeUnit ?? currentAccount.unit });
        allowed = decision.allowed;
        reason = decision.reason;
      } else if (targetWorkspace === 'Management' || targetWorkspace === 'Governance') {
        const permissionCode = requiredPermissionForWorkspacePath(home, currentControlPlane.modules);
        if (!permissionCode) {
          allowed = false;
          reason = 'module-disabled';
        } else {
          const decision = evaluateControlPermission({ account: currentAccount, identity: currentIdentity, enterpriseAssignments: currentRoleAssignments, state: currentControlPlane, permissionCode, unitName: state.auth.activeUnit ?? currentAccount.unit });
          allowed = decision.allowed;
          reason = decision.reason;
        }
      }
      console.log(`REAL_STORE_TEST: ACCOUNT ${a.id} (workspaces=${JSON.stringify(currentAccount.workspaces)}, activeWorkspace=${state.auth.activeWorkspace}, activeUnit=${state.auth.activeUnit}) -> ${home} (canAccess=${canAccess}, allowed=${allowed}, reason=${reason})`);
      expect(canAccess, `canAccessPath for ${a.id}`).toBe(true);
      expect(allowed, `allowed for ${a.id}: ${reason}`).toBe(true);
    }
  });
});
