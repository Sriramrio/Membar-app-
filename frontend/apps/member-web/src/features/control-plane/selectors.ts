import { selectIdentityRecords } from '@/features/platform-runtime/identitySecurityRuntime';
import { selectRoleAssignments } from '@/features/platform-runtime/authorisationRuntime';
import type { RootState } from '@/app/store';
import type { Workspace } from '@/types/screen';
import { evaluateControlPermission,platformPathPermission } from './policyEngine';

export function selectEffectiveSetting(state:RootState,key:string,scope?:{type:string;id:string}){
 const setting=state.controlPlane.settings.find(s=>s.key===key&&s.active);if(!setting)return undefined;const today=new Date().toISOString().slice(0,10);
 const eligible=state.controlPlane.settingOverrides.filter(x=>x.active&&x.settingKey===key&&x.effectiveFrom<=today&&(!x.effectiveTo||x.effectiveTo>=today));
 if(scope&&setting.inheritance){
  const units=state.controlPlane.organisationUnits;const chain:string[]=[];let cursor=units.find(u=>u.id===scope.id||u.code===scope.id||u.name===scope.id);const seen=new Set<string>();
  while(cursor&&!seen.has(cursor.id)){seen.add(cursor.id);chain.push(cursor.id);cursor=cursor.parentId?units.find(u=>u.id===cursor!.parentId):undefined;}
  const direct=eligible.filter(x=>x.scopeId===scope.id&&x.scopeType===scope.type).sort((a,b)=>b.version-a.version)[0];if(direct)return{value:direct.value,source:`${direct.scopeType}:${direct.scopeId}`,version:direct.version};
  for(const unitId of chain){const unit=units.find(u=>u.id===unitId);if(!unit)continue;const type=state.controlPlane.organisationUnitTypes.find(t=>t.id===unit.unitTypeId);const override=eligible.filter(x=>x.scopeId===unit.id&&(x.scopeType===unit.unitTypeId||x.scopeType===type?.code||x.scopeType===type?.name||x.scopeType==='Organisation Unit')).sort((a,b)=>b.version-a.version)[0];if(override)return{value:override.value,source:`${type?.name??override.scopeType}:${unit.name}`,version:override.version};}
 }
 return{value:setting.globalValue??setting.defaultValue,source:'Global',version:setting.version};
}
export function selectWorkflow(state:RootState,code:string){return state.controlPlane.workflows.filter(w=>w.code===code&&w.active&&w.status==='Active').sort((a,b)=>b.version-a.version)[0];}
export function selectForm(state:RootState,codeOrPurpose:string){return state.controlPlane.forms.filter(f=>f.active&&f.status==='Active'&&(f.code===codeOrPurpose||f.purpose===codeOrPurpose)).sort((a,b)=>b.version-a.version)[0];}
export function selectFormVersion(state:RootState,codeOrPurpose:string,version:string|number){const wanted=String(version);return [...state.controlPlane.forms,...state.controlPlane.formHistory].filter(f=>(f.code===codeOrPurpose||f.purpose===codeOrPurpose)&&String(f.version)===wanted).sort((a,b)=>b.version-a.version)[0];}
export function selectNotificationTemplate(state:RootState,eventCode:string,channel='In App'){return state.controlPlane.notificationTemplates.filter(t=>t.active&&t.eventCode===eventCode&&t.channel===channel).sort((a,b)=>b.version-a.version)[0];}
export function selectPromotionPolicy(state:RootState,code='member.promotions'){return state.controlPlane.promotionPolicies.filter(p=>p.active&&p.code===code).sort((a,b)=>b.version-a.version)[0];}
export function selectMatchingPolicy(state:RootState,code='directory.default'){return state.controlPlane.matchingPolicies.filter(p=>p.active&&p.code===code).sort((a,b)=>b.version-a.version)[0];}
import { workspaceForPath } from '@/utils/permissions';

export function selectModuleForPath(state:RootState,path:string,workspace?:Workspace){return state.controlPlane.modules.filter(m=>m.enabled&&(!workspace||m.workspace===workspace)).filter(m=>m.routeRoots.some(root=>path===root||path.startsWith(`${root}/`))).sort((a,b)=>b.routeRoots[0].length-a.routeRoots[0].length)[0];}
export function selectRouteAllowedByControlPlane(state:RootState,path:string){const account=state.auth.account;if(!account)return false;const module=selectModuleForPath(state,path,workspaceForPath(path));if(!module)return true;const featureBlocked=module.featureFlagIds.some(id=>{const f=state.controlPlane.featureFlags.find(x=>x.id===id);return f&&(f.killSwitch||!f.enabled)});if(featureBlocked)return false;if(!module.requiredPermission)return true;const identity=selectIdentityRecords(state).find(i=>i.accountId===account.id);return evaluateControlPermission({account,identity,enterpriseAssignments:selectRoleAssignments(state),state:state.controlPlane,permissionCode:path.startsWith('/platform-admin')?platformPathPermission(path):module.requiredPermission,unitName:account.unit}).allowed;}
