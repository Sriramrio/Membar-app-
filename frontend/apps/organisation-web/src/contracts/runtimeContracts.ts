import type {Actor,OrgScope,OrgUnit,OrganisationRoleAssignment} from '@/domain/types';
import type {ApiErrorEnvelope} from '@/types/api';
import type {OrgQueryId,OrgCommandId} from './catalog';

export const ORGANISATIONAL_CONTRACT_VERSION='3.5.0' as const;

export interface EffectivePolicySnapshot{configurationVersion:string;responsibilities?:string[];raci?:Array<{workflow:string;code:'R'|'A'|'C'|'I';description?:string}>;sod?:string[];actingAuthority?:string[];source:'PLATFORM_ADMIN'|'BACKEND'}

export interface OrganisationalBootstrap{
  actor:Actor;
  activeScope:OrgScope;
  availableScopes:OrgScope[];
  units:OrgUnit[];
  permissions:string[];
  activeAssignment?:OrganisationRoleAssignment;
  sessionRevision:string;
  serverTime:string;
  contractVersion?:string;
  effectivePolicy?:EffectivePolicySnapshot;
}

export interface OrganisationalQueryRequest{
  queryId:OrgQueryId|string;
  search?:string;
  filters?:Array<{field:string;operator:string;value:unknown}>;
  sort?:Array<{field:string;direction:'asc'|'desc'}>;
  cursor?:string;
  pageSize?:number;
  fields?:string[];
  includes?:string[];
  organisationScope?:string;
  timezone?:string;
  consistencyToken?:string;
  parameters?:Record<string,unknown>;
}

export interface CursorQueryResponse<T>{
  items:T[];
  nextCursor?:string;
  previousCursor?:string;
  hasMore:boolean;
  totalEstimate?:number;
  consistencyToken?:string;
  serverTime?:string;
  summary?:unknown;
}

export function assertCursorResponse<T>(value:unknown):CursorQueryResponse<T>{
  if(!isObject(value)||!Array.isArray(value.items))throw new Error('Query contract violation: expected cursor response.');
  const hasMore = typeof value.hasMore === 'boolean' ? value.hasMore : false;
  if(value.nextCursor!==undefined&&typeof value.nextCursor!=='string')throw new Error('Query contract violation: nextCursor must be a string.');
  return { ...value, hasMore } as unknown as CursorQueryResponse<T>;
}
export interface OrganisationalCommandRequest<T=unknown>{
  commandId:string;
  commandType:OrgCommandId|string;
  aggregateType:string;
  aggregateId?:string;
  expectedVersion?:number;
  organisationScope:string;
  payload:T;
  reason?:string;
  metadata?:Record<string,unknown>;
}

export interface OrganisationalCommandResponse<T=unknown>{
  result?:T;
  aggregateId?:string;
  version?:number;
  serverTime?:string;
  consistencyToken?:string;
  correlationId?:string;
}

export interface OrganisationalRealtimeEvent{
  id:string;
  type:string;
  occurredAt:string;
  aggregateType?:string;
  aggregateId?:string;
  revision?:string;
  version?:number;
  payload?:unknown;
}

export type OrganisationalApiError=ApiErrorEnvelope;

const isObject=(v:unknown):v is Record<string,unknown>=>Boolean(v&&typeof v==='object'&&!Array.isArray(v));
const isString=(v:unknown):v is string=>typeof v==='string'&&v.length>0;

export function assertBootstrapContract(value:unknown):OrganisationalBootstrap{
  if(!isObject(value))throw new Error('Bootstrap contract violation: response is not an object.');
  const actor=value.actor,activeScope=value.activeScope;
  if(!isObject(actor)||!isString(actor.id)||!isString(actor.name)||!isString(actor.position))throw new Error('Bootstrap contract violation: actor is invalid.');
  if(!isObject(activeScope)||!isString(activeScope.id)||!isString(activeScope.name)||!isString(activeScope.level))throw new Error('Bootstrap contract violation: activeScope is invalid.');
  if(!Array.isArray(value.availableScopes)||!Array.isArray(value.units)||!Array.isArray(value.permissions))throw new Error('Bootstrap contract violation: scope/unit/permission collections are invalid.');
  if(!isString(value.sessionRevision)||!isString(value.serverTime))throw new Error('Bootstrap contract violation: sessionRevision/serverTime is missing.');
  return value as unknown as OrganisationalBootstrap;
}


export function assertObjectResponse<T>(value:unknown,label='response'):T{
  if(!isObject(value))throw new Error(`${label} contract violation: expected an object.`);
  return value as T;
}

export function assertOptionalObjectResponse<T>(value:unknown,label='response'):T|undefined{
  if(value===undefined||value===null)return undefined;
  return assertObjectResponse<T>(value,label);
}

export function assertCommandResponseLike<T>(value:unknown):T{
  if(value===undefined||value===null)return value as T;
  if(!isObject(value))throw new Error('Command contract violation: expected an object or empty response.');
  if(value.version!==undefined&&(typeof value.version!=='number'||!Number.isFinite(value.version)))throw new Error('Command contract violation: version must be numeric.');
  if(value.serverTime!==undefined&&typeof value.serverTime!=='string')throw new Error('Command contract violation: serverTime must be a string.');
  return value as T;
}

export function assertRealtimeEvent(value:unknown):OrganisationalRealtimeEvent{
  if(!isObject(value)||!isString(value.id)||!isString(value.type)||!isString(value.occurredAt))throw new Error('Realtime contract violation.');
  return value as unknown as OrganisationalRealtimeEvent;
}
