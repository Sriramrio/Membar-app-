import type { Middleware } from '@reduxjs/toolkit';
import { recordAudit, recordWorkflowFirstCheck } from '@/features/platform-runtime/platformRuntimeSlice';
import { evaluateControlPermission, effectiveRoleDefinitions } from '@/features/control-plane/policyEngine';
import { recordSecurityEvent } from '@/features/control-plane/controlPlaneSlice';
import type { PlatformControlState,ConfigArtifactType } from '@/features/control-plane/types';
import type { AppAccount } from '@/types/common';
import type { WorkflowTask } from '@/features/platform-runtime/operationalTypes';
import type { PlatformRuntimeState } from '@/features/platform-runtime/platformRuntimeState';

interface RootLike {auth:{account:AppAccount|null};platformRuntime:PlatformRuntimeState;controlPlane:PlatformControlState}
const ENTERPRISE_PERMISSION:Record<string,string>={
 'platformRuntime/updateIdentityRecord':'platform.identity.manage','platformRuntime/addRoleAssignment':'platform.role.manage','platformRuntime/updateRoleAssignmentStatus':'platform.role.manage',
 'platformRuntime/upsertModerationCase':'platform.moderation.manage','platformRuntime/decideModerationCase':'platform.moderation.manage','platformRuntime/assignDataQualityIssue':'platform.dataquality.manage','platformRuntime/resolveDataQualityIssue':'platform.dataquality.manage','platformRuntime/applyDataQualityDecision':'platform.dataquality.manage',
 'platformRuntime/addImportBatch':'platform.import.manage','platformRuntime/configureImportMapping':'platform.import.manage','platformRuntime/setImportStagedRecords':'platform.import.manage','platformRuntime/validateImport':'platform.import.manage','platformRuntime/submitImportForCheck':'platform.import.manage','platformRuntime/approveImport':'import.approve','platformRuntime/postImport':'import.post','platformRuntime/reconcileImport':'platform.import.manage','platformRuntime/reverseImport':'platform.import.manage',
 'platformRuntime/acknowledgeBoardPack':'governance.workspace.access','platformRuntime/castGovernanceVote':'governance.vote','platformRuntime/declareGovernanceRecusal':'governance.vote','platformRuntime/declareGovernanceConflict':'governance.vote','platformRuntime/resolveGovernanceConflict':'governance.review','platformRuntime/decideGovernance':'governance.review','platformRuntime/upsertStrategyOutcome':'governance.review','platformRuntime/upsertPolicyException':'governance.workspace.access',
};
const ARTIFACT_PERMISSION:Partial<Record<ConfigArtifactType,string>>={
 Module:'platform.setting.manage',Action:'platform.rbac.manage',Permission:'platform.rbac.manage','Organisation Unit Type':'platform.organisation.manage','Organisation Unit':'platform.organisation.manage',Role:'platform.role.manage','Policy Rule':'platform.rbac.manage',RACI:'platform.workflow.manage',Workflow:'platform.workflow.manage','SLA Policy':'platform.workflow.manage','Maker Checker':'platform.workflow.manage',Form:'platform.form.manage',Taxonomy:'platform.taxonomy.manage','Notification Template':'platform.notification.manage','Notification Route':'platform.notification.manage','Promotion Policy':'platform.promotion.manage','Import Profile':'platform.import.manage',Integration:'platform.integration.manage',Webhook:'platform.integration.manage','Data Quality Rule':'platform.dataquality.manage',Setting:'platform.setting.manage','Feature Flag':'platform.setting.manage','Retention Policy':'platform.setting.manage','Numbering Rule':'platform.setting.manage','Matching Policy':'platform.setting.manage'
};
function requestedPermission(type:string,payload:Record<string,unknown>|undefined,state:RootLike){
 const catalogued=state.controlPlane.actions.find(a=>a.runtimeActionTypes?.includes(type));if(catalogued)return catalogued.permission;
 if(ENTERPRISE_PERMISSION[type])return ENTERPRISE_PERMISSION[type];
 if(!type.startsWith('controlPlane/'))return undefined;
 if(['controlPlane/approveConfigurationChange','controlPlane/rejectConfigurationChange','controlPlane/activateConfigurationChange'].includes(type))return'platform.configuration.publish';
 if(type==='controlPlane/rollbackConfigurationChange')return'platform.configuration.publish';
 if(type==='controlPlane/proposeConfigurationChange'){return ARTIFACT_PERMISSION[payload?.artifactType as ConfigArtifactType]??'platform.setting.manage';}
 if(['controlPlane/validateConfigurationChange','controlPlane/analyseConfigurationImpact','controlPlane/submitConfigurationChange'].includes(type)){const change=state.controlPlane.changes.find(c=>c.id===String(payload?.id??''));return change?ARTIFACT_PERMISSION[change.artifactType]??'platform.setting.manage':'platform.setting.manage';}
 if(type==='controlPlane/upsertSettingOverride')return'platform.setting.manage';
 if(type==='controlPlane/recordIntegrationHealth'||type==='controlPlane/recordWebhookDelivery')return'platform.integration.manage';
 return undefined;
}
function dateActive(from:string,to?:string){const today=new Date().toISOString().slice(0,10);return from<=today&&(!to||to>=today)}
function workflowBlueprint(state:RootLike,task:WorkflowTask){return state.controlPlane.workflows.find(w=>w.active&&w.status==='Active'&&(w.id===task.definitionId||w.name===task.caseType||w.code===task.caseType));}
function workflowDeny(store:any,state:RootLike,task:WorkflowTask,actor:string,reason:string,action:string){
 store.dispatch(recordAudit({actor,action:`Workflow ${action}`,resource:'WorkflowTask',recordId:task.id,result:'Denied',reason,workspace:'Management',unit:task.unit,workflowVersion:task.workflowVersion,policyVersion:`control-plane-${state.controlPlane.releaseVersion}`}));
 store.dispatch(recordSecurityEvent({event:'Denied sensitive action',actor,result:'Denied',risk:'Medium',reason:`Workflow ${action} denied: ${reason}`}));
}
function enforceWorkflowAction(store:any,state:RootLike,payload:Record<string,unknown>){
 const task=state.platformRuntime.workflowRuntime.tasks.find(t=>t.id===String(payload.id??''));if(!task)return {allow:true};
 const workflow=workflowBlueprint(state,task);if(!workflow)return {allow:false,reason:`No canonical active V6 workflow definition is available for ${task.caseType}.`,task};
 const action=String(payload.action??'');const transition=workflow.transitions.find(t=>t.actionCode===action);
 if(!transition)return {allow:false,reason:`Active workflow ${workflow.code} does not define ${action}.`,task};
 if(!transition.fromStates.includes(task.status))return {allow:false,reason:`${action} is not legal from ${task.status} under ${workflow.code} v${workflow.version}.`,task};
 const reason=String(payload.reason??'').trim();if(transition.reasonRequired&&!reason)return {allow:false,reason:'A reason is required by the active workflow transition.',task};
 if(transition.evidenceRequired&&!task.evidence.length)return {allow:false,reason:'Evidence is required by the active workflow transition.',task};
 const account=state.auth.account;if(!account)return {allow:false,reason:'Authenticated actor is required.',task};
 const roleDefs=effectiveRoleDefinitions(account,state.platformRuntime.authorisation.assignments,state.controlPlane);const roleCodes=roleDefs.map(r=>r.role.code);
 const raci=state.controlPlane.raci.filter(r=>r.active&&dateActive(r.effectiveFrom,r.effectiveTo)&&(r.workflowCode===workflow.code||r.process===workflow.name||r.process===task.caseType)&&r.action===action);
 if(raci.length){const allowed=raci.some(r=>r.allow&&((r.resolverType==='Role'&&roleCodes.includes(r.resolverValue))||(r.resolverType==='Identity'&&(r.resolverValue===account.id||r.resolverValue===account.name))));if(!allowed)return {allow:false,reason:`V6 RACI denies ${action} for the actor's effective roles (${roleCodes.join(', ')||'none'}).`,task};}
 const mc=transition.makerCheckerPolicyId?state.controlPlane.makerCheckerPolicies.find(p=>p.id===transition.makerCheckerPolicyId&&p.active):undefined;
 if(mc&&['Approve','Reject'].includes(action)){
  if(mc.independentIdentity&&task.maker===account.name)return {allow:false,reason:'Maker/checker policy requires an independent identity.',task};
  if(mc.checkerRoleCodes.length&&!mc.checkerRoleCodes.some(r=>roleCodes.includes(r)))return {allow:false,reason:`Checker role must be one of: ${mc.checkerRoleCodes.join(', ')}.`,task};
  if(!mc.sameUnitAllowed&&account.unit===task.unit)return {allow:false,reason:'Maker/checker policy requires a checker from a different organisational unit.',task};
  if(mc.reasonRequired&&!reason)return {allow:false,reason:'Maker/checker policy requires a decision reason.',task};
  if(mc.evidenceRequired&&!task.evidence.length)return {allow:false,reason:'Maker/checker policy requires evidence.',task};
  if(mc.secondChecker&&action==='Approve'&&!task.firstChecker){store.dispatch(recordWorkflowFirstCheck({id:task.id,checker:account.name,reason}));return {allow:false,handled:true,reason:'First checker recorded; second independent checker is required.',task};}
  if(mc.secondChecker&&action==='Approve'&&task.firstChecker===account.name)return {allow:false,reason:'Second checker must be a different identity from the first checker.',task};
 }
 return {allow:true,task};
}
export const authorizationMiddleware:Middleware=store=>next=>action=>{
 const typed=action as {type?:string;payload?:Record<string,unknown>;meta?:Record<string,unknown>};if(!typed.type)return next(action);
 if(typed.meta?.controlPlaneSync)return next(action);
 const state=store.getState() as RootLike;
 if(typed.type==='platformRuntime/decideVisitor'&&typed.payload?.decision==='Approved'){
  const visitor=state.platformRuntime.visitorOnboarding.applications.find(v=>v.id===String(typed.payload?.id??''));const task=visitor?state.platformRuntime.workflowRuntime.tasks.find(t=>t.recordId===visitor.id&&t.caseType==='Membership onboarding'&&!['Rejected','Closed'].includes(t.status)):undefined;
  if(task){const verdict=enforceWorkflowAction(store,state,{id:task.id,action:'Approve',reason:typed.payload?.reason});if(!verdict.allow){if(!verdict.handled)workflowDeny(store,state,task,state.auth.account?.name??String(typed.payload?.actor??'Unknown actor'),verdict.reason??'Denied','Approve');return action;}}
 }
 if(typed.type==='platformRuntime/workflowAction'){
  const verdict=enforceWorkflowAction(store,state,typed.payload??{});if(!verdict.allow){if(!verdict.handled&&verdict.task)workflowDeny(store,state,verdict.task,state.auth.account?.name??String(typed.payload?.actor??'Unknown actor'),verdict.reason??'Denied',String(typed.payload?.action??'Action'));return action;}
 }

 if(['platformRuntime/submitImportForCheck','platformRuntime/approveImport','platformRuntime/postImport','platformRuntime/reverseImport'].includes(typed.type)){
  const batch=state.platformRuntime.importOperations.batches.find(b=>b.id===String(typed.payload?.id??''));const profile=batch?.profileId?state.controlPlane.importProfiles.find(p=>p.id===batch.profileId&&p.version===batch.profileVersion):undefined;const mc=profile?.makerCheckerPolicyId?state.controlPlane.makerCheckerPolicies.find(p=>p.id===profile.makerCheckerPolicyId&&p.active):undefined;const account=state.auth.account;const roles=effectiveRoleDefinitions(account,state.platformRuntime.authorisation.assignments,state.controlPlane).map(x=>x.role.code);
  let reason='';if(!batch)reason='Import batch not found.';else if(typed.type==='platformRuntime/submitImportForCheck'&&mc?.makerRoleCodes.length&&!mc.makerRoleCodes.some(r=>roles.includes(r)))reason=`Maker role must be one of: ${mc.makerRoleCodes.join(', ')}.`;else if(typed.type==='platformRuntime/approveImport'&&mc?.checkerRoleCodes.length&&!mc.checkerRoleCodes.some(r=>roles.includes(r)))reason=`Checker role must be one of: ${mc.checkerRoleCodes.join(', ')}.`;else if(typed.type==='platformRuntime/approveImport'&&mc?.independentIdentity&&batch.maker===account?.name)reason='Maker/checker policy requires an independent identity.';else if(typed.type==='platformRuntime/reverseImport'&&batch.reversalSupported===false)reason='The pinned Import Profile does not allow reversal.';
  if(reason){store.dispatch(recordAudit({actor:account?.name??'Unauthenticated user',action:typed.type,resource:'ImportBatch',recordId:batch?.id??String(typed.payload?.id??''),result:'Denied',reason,workspace:'Platform Admin',unit:batch?.unit,policyVersion:`control-plane-${state.controlPlane.releaseVersion}`}));store.dispatch(recordSecurityEvent({event:'Denied sensitive action',actor:account?.name??'Unauthenticated user',result:'Denied',risk:'High',reason:`${typed.type}: ${reason}`}));return action;}
 }
 if(typed.type==='platformRuntime/updateHandover'){
  const account=state.auth.account;const identity=state.platformRuntime.identitySecurity.identities.find(i=>i.accountId===account?.id);const unitName=account?.unit;
  const platformDecision=evaluateControlPermission({account,identity,enterpriseAssignments:state.platformRuntime.authorisation.assignments,state:state.controlPlane,permissionCode:'platform.role.manage',unitName});
  const governanceDecision=evaluateControlPermission({account,identity,enterpriseAssignments:state.platformRuntime.authorisation.assignments,state:state.controlPlane,permissionCode:'governance.review',unitName});
  const allowed=(platformDecision.allowed&&(!platformDecision.requiresReauth||Boolean(account?.mfaEnabled)))||governanceDecision.allowed;
  if(allowed)return next(action);
  const denial=`Role handover requires Platform role administration or Governance review authority. Platform: ${platformDecision.reason}; Governance: ${governanceDecision.reason}`;
  store.dispatch(recordAudit({actor:account?.name??'Unauthenticated user',action:typed.type,resource:'RoleAssignment',recordId:String(typed.payload?.id??''),result:'Denied',reason:denial,workspace:account?.workspaces.includes('Governance')?'Governance':'Platform Admin',unit:account?.unit,policyVersion:`control-plane-${state.controlPlane.releaseVersion}`}));
  store.dispatch(recordSecurityEvent({event:'Denied sensitive action',actor:account?.name??'Unauthenticated user',result:'Denied',risk:'High',reason:denial}));
  return action;
 }
 const permission=requestedPermission(typed.type,typed.payload,state);if(!permission)return next(action);
 const account=state.auth.account;const identity=state.platformRuntime.identitySecurity.identities.find(i=>i.accountId===account?.id);const changeId=String(typed.payload?.id??'');const change=state.controlPlane.changes.find(c=>c.id===changeId);
 const decision=evaluateControlPermission({account,identity,enterpriseAssignments:state.platformRuntime.authorisation.assignments,state:state.controlPlane,permissionCode:permission,unitName:account?.unit,context:{makerId:change?.maker&&account?.name===change.maker?account.id:undefined}});
 if(decision.allowed&&(!decision.requiresReauth||Boolean(account?.mfaEnabled)))return next(action);
 const denial=decision.allowed&&decision.requiresReauth&&!account?.mfaEnabled?'Step-up authentication/MFA is required for this sensitive action.':decision.reason;
 store.dispatch(recordAudit({actor:account?.name??'Unauthenticated user',action:typed.type,resource:'PlatformControlPlane',recordId:String(typed.payload?.id??typed.payload?.artifactId??typed.payload?.key??'configuration'),result:'Denied',reason:denial,workspace:'Platform Admin',unit:account?.unit,safeDiff:`Permission ${permission}; ${decision.trace.join(' | ')}`,policyVersion:`control-plane-${state.controlPlane.releaseVersion}`}));
 store.dispatch(recordSecurityEvent({event:'Denied sensitive action',actor:account?.name??'Unauthenticated user',result:'Denied',risk:'High',reason:`${typed.type}: ${denial}`}));
 return action;
};
