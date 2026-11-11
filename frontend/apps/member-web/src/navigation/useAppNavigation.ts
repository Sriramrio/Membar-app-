import { stableClientId } from '@/utils/stableId';
import { serverClock } from '@/services/time/serverClock';
import { useCallback } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { useAppDispatch,useAppSelector } from '@/app/hooks';
import { popNavigationOrigin,pushNavigationOrigin,rememberWorkspaceContext,setPendingNavigation,type NavigationOrigin } from '@/features/member/navigation/memberNavigationSlice';
import { workspaceForPath } from '@/utils/permissions';
import { selectRouteAllowedByControlPlane } from '@/features/control-plane/selectors';
import { isSafeCanonicalPath,resolveRouteAlias } from '@/routes/routeAliases';
import { telemetry } from '@/services/telemetry/telemetry';

export const createNavigationOrigin=(pathname:string,search:string,label?:string):NavigationOrigin=>({id:stableClientId('origin'),workspace:workspaceForPath(pathname),pathname,search,sourceLabel:label,returnLabel:label?`Back to ${label}`:undefined,scrollY:typeof window==='undefined'?0:window.scrollY,createdAt:serverClock.isoNow()});
export function useAppNavigation(){
 const loc=useLocation();const nav=useNavigate();const dispatch=useAppDispatch();const stack=useAppSelector(s=>s.memberNavigation.stack);const dirty=useAppSelector(s=>s.memberNavigation.dirtyGuard);const origin=stack.at(-1);const originAllowed=useAppSelector(s=>origin?selectRouteAllowedByControlPlane(s,origin.pathname):true);
 const safeTarget=useCallback((requested:string,fallback='/workspace')=>{if(isSafeCanonicalPath(requested))return resolveRouteAlias(requested);telemetry.warning('ui','navigation.rejected','Unsafe or non-canonical navigation target rejected',{requested,from:`${loc.pathname}${loc.search}`});return isSafeCanonicalPath(fallback)?resolveRouteAlias(fallback):'/workspace';},[loc.pathname,loc.search]);
 const go=useCallback((requested:string,opts?:{label?:string;replace?:boolean;remember?:boolean})=>{const to=safeTarget(requested);const current=createNavigationOrigin(loc.pathname,loc.search,opts?.label);if(dirty.dirty){dispatch(setPendingNavigation({kind:'go',to,origin:opts?.remember===false?undefined:current,replace:opts?.replace}));return;}if(opts?.remember!==false){dispatch(pushNavigationOrigin(current));dispatch(rememberWorkspaceContext(current));}nav(to,{replace:opts?.replace});},[dispatch,dirty.dirty,loc.pathname,loc.search,nav,safeTarget]);
 const back=useCallback((fallback:string)=>{const target=stack.at(-1);if(target&&isSafeCanonicalPath(target.pathname)&&originAllowed){const to=`${resolveRouteAlias(target.pathname)}${target.search}`;if(dirty.dirty){dispatch(setPendingNavigation({kind:'back',to,restoreScrollY:target.scrollY}));return;}dispatch(popNavigationOrigin());nav(to);if(typeof window!=='undefined')requestAnimationFrame(()=>window.scrollTo({top:target.scrollY,behavior:'auto'}));return;}if(target&&!originAllowed)dispatch(popNavigationOrigin());const to=safeTarget(fallback);if(dirty.dirty){dispatch(setPendingNavigation({kind:'back',to}));return;}nav(to);},[dispatch,dirty.dirty,nav,originAllowed,stack,safeTarget]);
 return{go,back,origin,dirty};
}
