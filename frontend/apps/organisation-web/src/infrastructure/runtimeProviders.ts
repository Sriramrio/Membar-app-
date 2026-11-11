import type {OrganisationalBootstrap,OrganisationalCommandRequest,OrganisationalQueryRequest,OrganisationalRealtimeEvent} from '@/contracts/runtimeContracts';
import {fetchOrgBootstrap} from '@/services/bootstrapGateway';
import {queryServer} from '@/services/queryGateway';
import {executeCommand} from '@/services/commandGateway';
import {realtimeTransport} from '@/services/realtimeTransport';

export interface BootstrapProvider{load(signal?:AbortSignal):Promise<OrganisationalBootstrap>}
export interface QueryProvider{execute<T>(query:OrganisationalQueryRequest,signal?:AbortSignal):Promise<T>}
export interface CommandProvider{execute<TPayload,TResult>(command:OrganisationalCommandRequest<TPayload>,preview?:()=>TResult|Promise<TResult>):Promise<TResult>}
export interface RealtimeProvider{start(scopeId:string,sessionRevision:string,onEvent?:(event:OrganisationalRealtimeEvent)=>void):void;stop():void}
export interface OrganisationalRuntimeProviders{bootstrap:BootstrapProvider;query:QueryProvider;command:CommandProvider;realtime:RealtimeProvider}

const httpProviders:OrganisationalRuntimeProviders={
  bootstrap:{load:fetchOrgBootstrap},
  query:{execute:<T>(query:OrganisationalQueryRequest,signal?:AbortSignal)=>queryServer<T>(query,signal)},
  command:{execute:<TPayload,TResult>(command:OrganisationalCommandRequest<TPayload>,preview?:()=>TResult|Promise<TResult>)=>executeCommand<TPayload,TResult>(command,preview)},
  realtime:{start:(scopeId,sessionRevision)=>realtimeTransport.start(scopeId,sessionRevision),stop:()=>realtimeTransport.stop()}
};

let providers=httpProviders;
export const runtimeProviders=()=>providers;

/** Test/dev composition seam. Production startup must not install a simulator provider. */
export function configureRuntimeProviders(next:OrganisationalRuntimeProviders){providers=next}
export function resetRuntimeProviders(){providers=httpProviders}
