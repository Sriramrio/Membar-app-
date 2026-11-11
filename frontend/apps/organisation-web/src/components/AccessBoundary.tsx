import type {ReactNode} from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import {useOrg} from '@/state/OrgStore';
import {serverClock} from '@/services/serverClock';
import {authStorage} from '@/utils/authStorage';

export function AccessBoundary({children}:{children:ReactNode}){
  const session = authStorage.getActiveSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/org/login" state={{ from: location }} replace />;
  }

  const {actor}=useOrg();
  const expired=Boolean(actor.effectiveTo&&Date.parse(actor.effectiveTo)<serverClock.now().getTime());
  if(expired)return <div className="card p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs max-w-lg mt-6" role="alert"><h1 className="text-xl font-bold text-slate-900 mb-2">Access period ended</h1><p className="text-sm text-slate-600 leading-relaxed">Your organisational assignment is no longer active. Refresh your workspace after the role/assignment is updated.</p></div>;
  return <>{children}</>;
}
