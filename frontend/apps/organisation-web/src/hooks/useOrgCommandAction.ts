import {useGovernedCommand} from './useGovernedCommand';
import {useOrg} from '@/state/OrgStore';
export function useOrgCommandAction(){const g=useGovernedCommand();const {scope}=useOrg();const run=<T,R>(input:{commandType:string;aggregateType:string;aggregateId?:string;expectedVersion?:number;payload:T;reason?:string},preview?:()=>R|Promise<R>)=>g.execute({...input,organisationScope:scope.id},preview);return{...g,run}}
