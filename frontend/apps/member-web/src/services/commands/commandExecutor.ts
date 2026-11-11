import { env } from '@/config/env';
import { executeDomainCommand, type DomainCommand, type DomainCommandResult } from '@/services/api/domainPersistence';
import { offlinePolicyFor, type OfflinePolicy } from '@/services/offline/offlineCommandPolicy';
import type { ApiErrorEnvelope } from '@/types/api';
import { toApiError } from '@/services/api/errorMapper';

export interface CommandExecution<T>{ok:boolean;mode:'preview-local'|'server-authoritative';result?:DomainCommandResult<T>;error?:ApiErrorEnvelope|Error;offlinePolicy:OfflinePolicy;}
export interface CommandExecutionOptions<TPayload,TResult>{
  policyId:string;
  command:DomainCommand<TPayload>;
  previewAction?:()=>unknown;
  onAccepted?:(result:DomainCommandResult<TResult>)=>void|Promise<void>;
}
const isOffline=()=>typeof navigator!=='undefined'&&!navigator.onLine;

/** Single mutation seam for screens. Preview dispatch remains local; production is server-authoritative. */
export async function executeCommandWithPolicy<TPayload,TResult=unknown>(options:CommandExecutionOptions<TPayload,TResult>):Promise<CommandExecution<TResult>>{
  const policy=offlinePolicyFor(options.policyId);
  if(isOffline()&&policy==='online-required')return{ok:false,mode:env.useMocks?'preview-local':'server-authoritative',offlinePolicy:policy,error:{type:'OFFLINE',code:'NETWORK_OFFLINE',title:'You are offline',detail:'Reconnect before continuing.',status:0,correlationId:options.command.commandId,retryable:true,fieldErrors:[]} satisfies ApiErrorEnvelope};
  if(env.useMocks){
    try{await options.previewAction?.();return{ok:true,mode:'preview-local',offlinePolicy:policy};}
    catch(error){return{ok:false,mode:'preview-local',offlinePolicy:policy,error:error instanceof Error?error:new Error(String(error))};}
  }
  try{const result=await executeDomainCommand<TPayload,TResult>(options.command);await options.onAccepted?.(result);return{ok:true,mode:'server-authoritative',offlinePolicy:policy,result};}
  catch(error){return{ok:false,mode:'server-authoritative',offlinePolicy:policy,error:toApiError(error)};}
}
