import { selectIdentityRecords } from '@/features/platform-runtime/identitySecurityRuntime';
import { selectRoleAssignments } from '@/features/platform-runtime/authorisationRuntime';
import { useAppSelector } from '@/app/hooks';
import { evaluateControlPermission } from './policyEngine';
import { selectEffectiveSetting,selectForm,selectFormVersion,selectMatchingPolicy,selectNotificationTemplate,selectPromotionPolicy,selectWorkflow } from './selectors';
export const useEffectiveSetting=(key:string,scope?:{type:string;id:string})=>useAppSelector(s=>selectEffectiveSetting(s,key,scope));
export const useEffectiveWorkflow=(code:string)=>useAppSelector(s=>selectWorkflow(s,code));
export const useFormDefinition=(codeOrPurpose:string)=>useAppSelector(s=>selectForm(s,codeOrPurpose));
export const useFormDefinitionVersion=(codeOrPurpose:string,version:string|number)=>useAppSelector(s=>selectFormVersion(s,codeOrPurpose,version));
export const useNotificationTemplate=(eventCode:string,channel='In App')=>useAppSelector(s=>selectNotificationTemplate(s,eventCode,channel));
export const usePromotionPolicy=(code='member.promotions')=>useAppSelector(s=>selectPromotionPolicy(s,code));
export const useMatchingPolicy=(code='directory.default')=>useAppSelector(s=>selectMatchingPolicy(s,code));
export const useTaxonomy=(domain?:string)=>useAppSelector(s=>s.controlPlane.taxonomy.filter(t=>t.active&&(!domain||t.domain===domain)));
export const useOrganisationScope=()=>useAppSelector(s=>s.controlPlane.organisationUnits.filter(u=>u.active));
export function usePermissionDecision(permissionCode:string,unitName?:string){return useAppSelector(s=>evaluateControlPermission({account:s.auth.account,identity:selectIdentityRecords(s).find(i=>i.accountId===s.auth.account?.id),enterpriseAssignments:selectRoleAssignments(s),state:s.controlPlane,permissionCode,unitName}));}
