import { stableClientId } from '@/utils/stableId';

export interface RealtimeEvent<T=unknown>{id:string;type:string;occurredAt:string;revision?:string;aggregateType?:string;aggregateId?:string;payload:T;}
export type RealtimeHandler=(event:RealtimeEvent)=>void;
export interface RealtimeTransport { connect(onEvent:RealtimeHandler,onDisconnect:(reason?:unknown)=>void):()=>void; }

export class RealtimeGateway{
  private handlers=new Map<string,Set<RealtimeHandler>>();
  private disconnect?:()=>void;
  private seen=new Map<string,number>();
  readonly clientId=stableClientId('rt');
  constructor(private maxSeen=1000){}
  connect(transport:RealtimeTransport){this.disconnect?.();this.disconnect=transport.connect(event=>this.accept(event),()=>undefined);return ()=>this.close();}
  subscribe(type:string,handler:RealtimeHandler){const set=this.handlers.get(type)??new Set<RealtimeHandler>();set.add(handler);this.handlers.set(type,set);return()=>{set.delete(handler);if(!set.size)this.handlers.delete(type)}}
  close(){this.disconnect?.();this.disconnect=undefined;}
  private accept(event:RealtimeEvent){
    if(!event?.id||!event.type||this.seen.has(event.id))return;
    this.seen.set(event.id,Date.now());
    if(this.seen.size>this.maxSeen){const oldest=[...this.seen.entries()].sort((a,b)=>a[1]-b[1]).slice(0,this.seen.size-this.maxSeen);for(const [id] of oldest)this.seen.delete(id);}
    for(const handler of this.handlers.get(event.type)??[])handler(event);
    for(const handler of this.handlers.get('*')??[])handler(event);
  }
}

export const realtimeGateway=new RealtimeGateway();
