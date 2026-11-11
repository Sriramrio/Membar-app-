import { env } from '@/config/env';
import { stableClientId } from '@/utils/stableId';
import { serverClock } from '@/services/time/serverClock';

export type TelemetrySeverity='info'|'warning'|'error';
export type TelemetryCategory='ui'|'global'|'api'|'storage'|'security'|'workflow'|'performance';
export interface TelemetryEvent{
  id:string;
  occurredAt:string;
  severity:TelemetrySeverity;
  category:TelemetryCategory;
  name:string;
  message:string;
  correlationId:string;
  route:string;
  releaseVersion:string;
  details?:Record<string,string|number|boolean|null|undefined>;
  stack?:string;
}

type TelemetryListener=(event:TelemetryEvent)=>void;
const listeners=new Set<TelemetryListener>();
const recent:TelemetryEvent[]=[];
const MAX_RECENT=100;

export function newCorrelationId(prefix='UI'){return stableClientId(prefix)}

function currentRoute(){
  if(typeof window==='undefined')return 'server';
  return `${window.location.pathname}${window.location.search}`;
}

function normaliseError(error:unknown){
  if(error instanceof Error)return{message:error.message||error.name,stack:error.stack?.slice(0,8000)};
  if(typeof error==='string')return{message:error};
  return{message:'Unexpected application error'};
}

function emit(event:TelemetryEvent){
  recent.push(event);if(recent.length>MAX_RECENT)recent.shift();
  for(const listener of listeners){try{listener(event)}catch{/* telemetry listeners must never break application execution */}}
  if(typeof window!=='undefined'&&event.category!=='performance')window.dispatchEvent(new CustomEvent('sethu:telemetry',{detail:event}));
}

export const telemetry={
  report(severity:TelemetrySeverity,category:TelemetryCategory,name:string,error?:unknown,details?:TelemetryEvent['details'],correlationId=newCorrelationId()){
    const normalised=normaliseError(error);
    const event:TelemetryEvent={id:newCorrelationId('EVT'),occurredAt:serverClock.isoNow(),severity,category,name,message:normalised.message,correlationId,route:currentRoute(),releaseVersion:env.releaseVersion,details,stack:normalised.stack};
    emit(event);return event;
  },
  error(category:TelemetryCategory,name:string,error:unknown,details?:TelemetryEvent['details'],correlationId?:string){return this.report('error',category,name,error,details,correlationId)},
  warning(category:TelemetryCategory,name:string,message:string,details?:TelemetryEvent['details'],correlationId?:string){return this.report('warning',category,name,message,details,correlationId)},
  info(category:TelemetryCategory,name:string,message:string,details?:TelemetryEvent['details'],correlationId?:string){return this.report('info',category,name,message,details,correlationId)},
  subscribe(listener:TelemetryListener){listeners.add(listener);return()=>listeners.delete(listener)},
  recent(){return [...recent]},
};
