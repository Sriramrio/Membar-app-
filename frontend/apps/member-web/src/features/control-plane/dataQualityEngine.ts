import type { PlatformRuntimeState } from '@/features/platform-runtime/operationalTypes';
import type { NetworkState } from '@/features/network/networkSlice';
import type { DataQualityRuleDefinition, PlatformControlState } from './types';
import { serverClock } from '@/services/time/serverClock';

export interface DataQualityFinding {ruleId:string;ruleCode:string;entity:string;recordId:string;message:string;severity:DataQualityRuleDefinition['severity'];owner:string;workflowCode?:string;slaPolicyId?:string;}

function evalBooleanExpression(expression:string,context:Record<string,boolean>){
 const clauses=expression.split('&&').map(x=>x.trim()).filter(Boolean);return clauses.every(clause=>{const negate=clause.startsWith('!');const key=(negate?clause.slice(1):clause).trim();const value=Boolean(context[key]);return negate?!value:value});
}
function contexts(rule:DataQualityRuleDefinition,network:NetworkState,runtime:PlatformRuntimeState){
 if(rule.entity==='MemberBusinessAffiliation')return network.affiliations.map(a=>({recordId:a.id,context:{active:a.active,verified:a.verificationStatus==='Verified',noPrimary:!network.affiliations.some(x=>x.memberId===a.memberId&&x.active&&x.verificationStatus==='Verified'&&x.primaryRepresentative)}}));
 if(rule.entity==='CertificationRecord')return network.certificationRecords.map(c=>({recordId:c.id,context:{verified:c.verificationStatus==='Verified',evidence:Boolean(c.evidenceName),expired:c.verificationStatus==='Expired'}}));
 if(rule.entity==='Member')return network.members.map(m=>({recordId:m.id,context:{active:m.status==='active',email:Boolean(m.email),phone:Boolean(m.phone),business:Boolean(network.affiliations.some(a=>a.memberId===m.id&&a.active&&a.verificationStatus==='Verified'))}}));
 if(rule.entity==='Business')return network.businesses.map(b=>({recordId:b.id,context:{active:b.visibility!=='hidden',category:Boolean(b.categoryIds.length),city:Boolean(b.city),state:Boolean(b.state),country:Boolean(b.country),primary:Boolean(network.affiliations.some(a=>a.businessId===b.id&&a.active&&a.verificationStatus==='Verified'&&a.primaryRepresentative))}}));
 if(rule.entity==='VisitorApplication')return runtime.visitorOnboarding.applications.map(v=>({recordId:v.id,context:{active:!['Activated','Rejected'].includes(v.status),duplicate:Boolean(v.duplicateCandidates.length),verified:v.emailVerified}}));
 if(rule.entity==='RoleAssignment')return runtime.authorisation.assignments.map(r=>({recordId:r.id,context:{active:r.status==='Active',expired:r.endsAt<serverClock.todayIso(),exclusive:r.exclusiveOffice}}));
 return [] as Array<{recordId:string;context:Record<string,boolean>}>;
}
export function evaluateConfiguredDataQuality(state:PlatformControlState,network:NetworkState,runtime:PlatformRuntimeState):DataQualityFinding[]{
 const findings:DataQualityFinding[]=[];
 for(const rule of state.dataQualityRules.filter(r=>r.active))for(const candidate of contexts(rule,network,runtime))if(evalBooleanExpression(rule.condition,candidate.context))findings.push({ruleId:rule.id,ruleCode:rule.code,entity:rule.entity,recordId:candidate.recordId,message:rule.description,severity:rule.severity,owner:rule.ownerResolver,workflowCode:rule.remediationWorkflowCode,slaPolicyId:rule.slaPolicyId});
 return findings;
}
