import type {OrganisationalRealtimeEvent} from '@/contracts/runtimeContracts';
export type OrgEvent=OrganisationalRealtimeEvent;
type Handler=(e:OrgEvent)=>void;
class Gateway{
  private seen=new Set<string>();
  private latestVersion=new Map<string,number>();
  private handlers=new Map<string,Set<Handler>>();
  subscribe(type:string,h:Handler){const s=this.handlers.get(type)??new Set();s.add(h);this.handlers.set(type,s);return()=>s.delete(h)}
  accept(e:OrgEvent){
    if(!e.id||this.seen.has(e.id))return;
    const aggregateKey=e.aggregateType&&e.aggregateId?`${e.aggregateType}:${e.aggregateId}`:undefined;
    if(aggregateKey&&typeof e.version==='number'){
      const latest=this.latestVersion.get(aggregateKey);
      if(latest!==undefined&&e.version<latest)return;
      this.latestVersion.set(aggregateKey,Math.max(latest??e.version,e.version));
    }
    this.seen.add(e.id);
    if(this.seen.size>1500)this.seen.delete(this.seen.values().next().value!);
    for(const h of this.handlers.get(e.type)??[])h(e);
    for(const h of this.handlers.get('*')??[])h(e);
  }
}
export const realtimeGateway=new Gateway();
