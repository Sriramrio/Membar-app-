import {Suspense,lazy} from 'react';import {RouteErrorBoundary} from '@/components/RouteErrorBoundary';import {AccessBoundary} from '@/components/AccessBoundary';import {RouteAccessBoundary} from '@/components/RouteAccessBoundary';
import {Navigate,Route,Routes} from 'react-router-dom';import {ResponsiveShell} from '@/components/ResponsiveShell';import {orgRoutes} from './routeRegistry';import NotFoundPage from '@/pages/NotFoundPage';

import {authStorage} from '@/utils/authStorage';
import {OrgProvider} from '@/state/OrgStore';

const OrgLoginPage=lazy(()=>import('@/pages/OrgLoginPage'));

function RootRedirect() {
  const session = authStorage.getActiveSession();
  if (session) {
    const isTrustee = session.position === 'Trustee' || session.role === 'Trustee';
    const isTrust = isTrustee || session.position === 'Trust' || session.role === 'Trust' || session.roleType === 'TRUST_ADMINISTRATOR';
    const target = isTrustee ? "/org/trustee/leadership" : (isTrust ? "/org/trust-payments" : "/org/today");
    return <Navigate to={target} replace />;
  }
  return <Navigate to="/org/login" replace />;
}

export function OrgApp(){
  return (
    <RouteErrorBoundary>
      <Routes>
        <Route path="/login" element={<Suspense fallback={<div className="card" role="status" aria-live="polite">Loading sign in…</div>}><OrgLoginPage/></Suspense>}/>
        <Route path="/org/login" element={<Suspense fallback={<div className="card" role="status" aria-live="polite">Loading sign in…</div>}><OrgLoginPage/></Suspense>}/>
        <Route element={<OrgProvider><AccessBoundary><ResponsiveShell/></AccessBoundary></OrgProvider>}>
          {orgRoutes.map(r=><Route key={r.path} path={r.path} element={<RouteAccessBoundary minimumLevel={r.minimumLevel} requiredPermission={r.requiredPermission} capability={r.capability}><Suspense fallback={<div className="card" role="status" aria-live="polite">Loading workspace module…</div>}><r.component/></Suspense></RouteAccessBoundary>}/>)}
          <Route path="/org/*" element={<NotFoundPage/>}/>
        </Route>
        <Route path="/org" element={<RootRedirect/>}/>
        <Route path="/" element={<RootRedirect/>}/>
        <Route path="*" element={<NotFoundPage/>}/>
      </Routes>
    </RouteErrorBoundary>
  );
}
