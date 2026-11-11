import { sessionStorageService } from './sessionStorage';

export interface VersionedDraft<T>{schemaVersion:number;screenId:string;savedAt:string;payload:T}
export type DraftReadResult<T>=
 | {status:'empty'}
 | {status:'ready';payload:T;savedAt:string}
 | {status:'invalid';reason:'storage'|'shape'|'payload'}
 | {status:'incompatible';foundVersion:number};

const isRecord=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);

export function saveVersionedDraft<T>(key:string,screenId:string,schemaVersion:number,payload:T){
 return sessionStorageService.setResult<VersionedDraft<T>>(key,{schemaVersion,screenId,savedAt:new Date().toISOString(),payload});
}

export function readVersionedDraft<T>(key:string,screenId:string,schemaVersion:number,isPayload:(value:unknown)=>value is T):DraftReadResult<T>{
 const result=sessionStorageService.getResult<unknown>(key);
 if(!result.ok)return {status:'invalid',reason:'storage'};
 if(result.value===undefined)return {status:'empty'};
 const value=result.value;
 if(!isRecord(value)||typeof value.schemaVersion!=='number'||typeof value.screenId!=='string'||typeof value.savedAt!=='string'||!('payload' in value))return {status:'invalid',reason:'shape'};
 if(value.screenId!==screenId||value.schemaVersion!==schemaVersion)return {status:'incompatible',foundVersion:value.schemaVersion};
 if(!isPayload(value.payload))return {status:'invalid',reason:'payload'};
 return {status:'ready',payload:value.payload,savedAt:value.savedAt};
}
