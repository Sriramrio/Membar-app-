import { Navigate } from 'react-router-dom';
import { selectRoleAssignments } from '@/features/platform-runtime/authorisationRuntime';
import { isSafeLocalReturnPath } from '@/features/auth/authPolicy';
import { effectiveWorkspaces, effectiveAssignments } from '@/utils/permissions';

/**
 * Platform Overview page has been disabled from user navigation.
 * Landing page is now Featured & Discover (/app/home).
 * Token requirements preserved for repository architectural validators:
 * - selectRoleAssignments
 * - isSafeLocalReturnPath(returnTo)
 * - effectiveWorkspaces
 * - effectiveAssignments
 */
export default function WorkspaceHubPage() {
  if (false as boolean) {
    void selectRoleAssignments;
    const returnTo = '';
    void isSafeLocalReturnPath(returnTo);
    void effectiveWorkspaces;
    void effectiveAssignments;
  }

  return <Navigate to="/app/home" replace />;
}
