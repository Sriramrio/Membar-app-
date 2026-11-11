import type {Actor,OrgLevel,OrgScope,OrgUnit} from '@/domain/types';
import {serverClock} from '@/services/serverClock';
export type ResourceAction='read'|'create'|'update'|'approve'|'close'|'escalate'|'export';
const rank:Record<OrgLevel,number>={CHAPTER:1,REGION:2,CITY:3,STATE:4,NATIONAL:5,MANAGEMENT:6};
const isExpired=(actor:Actor)=>Boolean(actor.effectiveTo&&Date.parse(actor.effectiveTo)<serverClock.now().getTime());
export function isScopeWithin(activeScope:OrgScope,target:OrgScope,units:readonly OrgUnit[]){
  if(activeScope.id===target.id)return true;
  const byId=new Map(units.map(u=>[u.id,u]));
  let cursor=byId.get(target.id);const seen=new Set<string>();
  while(cursor?.parentId&&!seen.has(cursor.id)){seen.add(cursor.id);if(cursor.parentId===activeScope.id)return true;cursor=byId.get(cursor.parentId)}
  return activeScope.level==='MANAGEMENT';
}
export function hasPermissionId(permissions:readonly string[],requiredPermission:string){
  if(!permissions.length||!requiredPermission)return false;
  if(permissions.includes('org:*')||permissions.includes(requiredPermission))return true;
  const colon=requiredPermission.lastIndexOf(':');
  if(colon>0&&permissions.includes(`${requiredPermission.slice(0,colon)}:*`))return true;
  const dot=requiredPermission.lastIndexOf('.');
  if(dot>0&&permissions.includes(`${requiredPermission.slice(0,dot)}.*`))return true;
  return false;
}
export function hasEffectivePermission(permissions:readonly string[],resource:string,action:ResourceAction){
  return hasPermissionId(permissions,`org.${resource}:${action}`)||hasPermissionId(permissions,`${resource}:${action}`);
}
export function canAccess(actor:Actor,target:OrgScope,action:ResourceAction,units:readonly OrgUnit[]=[],activeScope:OrgScope=actor.scope,permissions:readonly string[]=[]){
  if(isExpired(actor))return false;
  if(units.length&&!isScopeWithin(activeScope,target,units))return false;
  if(!units.length&&rank[activeScope.level]<rank[target.level]&&activeScope.id!==target.id)return false;
  if(!hasEffectivePermission(permissions,'scope',action)&&!hasPermissionId(permissions,'org:*'))return false;
  return true;
}
export function fieldProjection(permissions:readonly string[]=[]){
  return hasPermissionId(permissions,'org.member.financial:read')?'OrgMemberFinancialView':'OrgMemberOperationalView';
}
