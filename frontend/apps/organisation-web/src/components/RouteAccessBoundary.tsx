import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import type {OrgLevel} from '@/domain/types';
import {useOrg} from '@/state/OrgStore';
import {hasPermissionId} from '@/security/access';
import {authStorage} from '@/utils/authStorage';
import {ShieldCheck} from 'lucide-react';
const rank:Record<OrgLevel,number>={CHAPTER:1,REGION:2,CITY:3,STATE:4,NATIONAL:5,MANAGEMENT:6};
export function RouteAccessBoundary({minimumLevel,requiredPermission,capability,children}:{minimumLevel?:OrgLevel;requiredPermission:string;capability:string;children:ReactNode}){
  const {scope,permissions,activeAssignment,preview}=useOrg();
  const isTrust = permissions.includes('org.trust:payment') || permissions.includes('org:trust:payment') || authStorage.isTrustUser();
  const previewBypass = Boolean(preview && permissions.includes('preview:*'));

  // Strict hierarchy boundary: A chapter-level actor cannot access pages requiring Region, State, National, or Management levels
  const levelDenied = Boolean(minimumLevel && rank[scope.level] < rank[minimumLevel] && !previewBypass && !isTrust);
  const permissionDenied = !previewBypass && !isTrust && !permissions.includes('org:*') && !permissions.includes('*') && !hasPermissionId(permissions, requiredPermission);
  const assignmentDenied = !previewBypass && !isTrust && !activeAssignment;

  if (levelDenied || permissionDenied || assignmentDenied) {
    return (
      <div className="card p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs max-w-lg mt-6" role="alert">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access not available</h1>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          {levelDenied
            ? `This capability requires ${minimumLevel?.toLowerCase()}-level scope or higher (current scope: ${scope.name} [${scope.level}]).`
            : assignmentDenied
            ? 'An active organisational assignment is required.'
            : `Your effective access does not include ${capability}.`}
          {' '}Frontend navigation is fail-closed; the backend remains authoritative.
        </p>
        <Link className="btn primary px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-colors min-h-[44px] inline-flex items-center" to={isTrust ? "/org/trustee/leadership" : "/org/today"}>
          {isTrust ? "Go to Chapter Leadership Governance" : "Return to Today"}
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
