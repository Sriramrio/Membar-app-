import { useCallback } from 'react';
import { useAppSelector } from '@/app/hooks';
import { executeCommandWithPolicy } from '@/services/commands/commandExecutor';
import type { CanonicalDomain, DomainCommand } from '@/services/api/domainPersistence';
import { stableClientId } from '@/utils/stableId';

const workspaceFor=(domain:CanonicalDomain)=>domain==='member'?'Member':domain==='management'?'Management':domain==='governance'?'Governance':'Platform Admin' as const;
export interface DomainCommandInput<TPayload>{domain:CanonicalDomain;command:string;aggregateType:string;aggregateId:string;payload:TPayload;expectedVersion?:string;reason?:string;policyId:string;commandId?:string;previewAction?:()=>unknown;}
export function useDomainCommandExecutor(){
 const account=useAppSelector(s=>s.auth.account);const activeUnit=useAppSelector(s=>s.auth.activeUnit);
 return useCallback(async<TPayload,TResult=unknown>(input:DomainCommandInput<TPayload>)=>{
   if(!account)return{ok:false as const,error:new Error('Authenticated account context is required.'),mode:'preview-local' as const,offlinePolicy:'online-required' as const};
   const command:DomainCommand<TPayload>={commandId:input.commandId??stableClientId('cmd'),domain:input.domain,command:input.command,aggregateType:input.aggregateType,aggregateId:input.aggregateId,payload:input.payload,expectedVersion:input.expectedVersion,reason:input.reason,actor:{accountId:account.id,workspace:workspaceFor(input.domain),role:account.role,unit:activeUnit??account.unit}};
   return executeCommandWithPolicy<TPayload,TResult>({policyId:input.policyId,command,previewAction:input.previewAction});
 },[account,activeUnit]);
}
