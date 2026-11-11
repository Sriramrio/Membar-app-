import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch,useAppSelector } from '@/app/hooks';
import { createNavigationOrigin } from './useAppNavigation';
import { setPendingNavigation } from '@/features/member/navigation/memberNavigationSlice';
import { isSafeCanonicalPath,resolveRouteAlias } from '@/routes/routeAliases';

function anchorTarget(target:EventTarget|null){
 if(!(target instanceof Element))return null;
 return target.closest('a[href]') as HTMLAnchorElement|null;
}
export function DirtyNavigationBridge(){
 const dirty=useAppSelector(s=>s.memberNavigation.dirtyGuard);const dispatch=useAppDispatch();const loc=useLocation();
 useEffect(()=>{
  if(!dirty.dirty)return;
  const beforeUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=''};
  const capture=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const anchor=anchorTarget(event.target);if(!anchor||anchor.target==='_blank'||anchor.hasAttribute('download'))return;
   const url=new URL(anchor.href,window.location.href);if(url.origin!==window.location.origin)return;
   const to=`${url.pathname}${url.search}${url.hash}`;if(!isSafeCanonicalPath(to))return;
   if(url.pathname===loc.pathname&&url.search===loc.search&&url.hash===window.location.hash)return;
   event.preventDefault();event.stopPropagation();
   dispatch(setPendingNavigation({kind:'go',to:resolveRouteAlias(to),origin:createNavigationOrigin(loc.pathname,loc.search,'current page')}));
  };
  window.addEventListener('beforeunload',beforeUnload);
  document.addEventListener('click',capture,true);
  return()=>{window.removeEventListener('beforeunload',beforeUnload);document.removeEventListener('click',capture,true)};
 },[dirty.dirty,dispatch,loc.pathname,loc.search]);
 return null;
}
