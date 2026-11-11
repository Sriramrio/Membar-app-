import { useEffect } from 'react';
import { realtimeGateway, type RealtimeEvent } from '@/services/realtime/realtimeGateway';

function matches(rule:string,type:string){return rule.endsWith('*')?type.startsWith(rule.slice(0,-1)):rule===type;}

/**
 * Refresh a server/local cursor view when a relevant realtime domain event arrives.
 * Events are debounced so bursts (for example message + notification + audit side-effects)
 * reconcile once rather than causing request storms.
 */
export function useRealtimeRefresh(rules:readonly string[],refresh:()=>void,predicate?:(event:RealtimeEvent)=>boolean){
  useEffect(()=>{
    if(!rules.length)return;
    let timer:ReturnType<typeof setTimeout>|undefined;
    const unsubscribe=realtimeGateway.subscribe('*',event=>{
      if(!rules.some(rule=>matches(rule,event.type)))return;
      if(predicate&&!predicate(event))return;
      if(timer)clearTimeout(timer);
      timer=setTimeout(refresh,150);
    });
    return()=>{if(timer)clearTimeout(timer);unsubscribe();};
  },[refresh,predicate,...rules]);
}
