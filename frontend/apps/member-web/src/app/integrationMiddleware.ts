import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { AppAccount, AccountAssignment } from '@/types/common';
import type { EffectiveRoleAssignment } from '@/features/platform-runtime/operationalTypes';
import type { PlatformRuntimeState } from '@/features/platform-runtime/platformRuntimeState';
import type { NetworkState } from '@/features/network/networkSlice';
import { serverClock } from '@/services/time/serverClock';
import type { PlatformControlState } from '@/features/control-plane/types';
import { applyApprovedTaxonomyImport, reverseApprovedTaxonomyImport, publishDomainEvent } from '@/features/control-plane/controlPlaneSlice';
import {
  addRoleAssignment, applyDataQualityDecision, decideGovernance, decideModerationCase, openSystemModerationCase, postImport, recordAudit, recordImportAppliedIds, removeImportedVisitors, reverseImport,
  saveVisitorDraft, updateHandover, updateRoleAssignmentStatus, workflowAction, linkActivatedMember,
} from '@/features/platform-runtime/platformRuntimeSlice';
import { authenticateAccount, signIn, syncEffectiveAssignments } from '@/features/auth/authSlice';
import {
  acknowledgeAnnouncement, addNotification, addReference, applyCertificationReview, applyImportRecords, approveAttendanceCorrection, awardResponse,
  blockMember, createAnnouncement, createConversation, createEvent, createMeeting, createOpportunity,
  createPromotion, createThankYouNote, createTransaction, payMembership, removeConnection,
  requestAttendanceCorrection, requestConnection, respondConnection, reverseImportRecords, rsvpEvent, savePreferences,
  sendMessage, setMeetingPollResponse, setPromotionStatus, submitResponse, toggleSavedBusiness, toggleSavedOpportunity,
  updateBusiness, updateMember, updateMeeting, updateOpportunityStatus, updatePaymentStatus, updateReferenceStatus, updateResponseStatus,
  updateTransactionStatus, upsertAffiliation, upsertBusinessRelationship, upsertCertificationRecord, setPrimaryAffiliation, setPromotionRuntimePolicy,
} from '@/features/network/networkSlice';

interface RootLike { auth:{account:AppAccount|null}; platformRuntime:PlatformRuntimeState; network:NetworkState; controlPlane:PlatformControlState }
const listener=createListenerMiddleware();
const nowDate=()=>serverClock.todayIso();

function mapAssignment(r:EffectiveRoleAssignment):AccountAssignment{
  return {id:r.id,workspace:r.workspace,role:r.role,unit:r.unit,unitType:r.unitType,startsAt:r.startsAt,endsAt:r.endsAt,status:r.status==='Handover'?'Active':r.status==='Pending Approval'?'Scheduled':r.status};
}

function renderTemplate(body:string,vars:Record<string,string>){return body.replace(/\{\{(\w+)\}\}/g,(_match,key:string)=>vars[key]??'');}
function notifyByEvent(api:any,event:string,memberId:string,vars:Record<string,string>,href:string,fallback:string){
  const state=api.getState() as RootLike;const catalogued=state.controlPlane.notificationEvents.some(e=>e.code===event&&e.active);const route=state.controlPlane.notificationRoutes.find(r=>r.eventCode===event&&r.active);
  if(catalogued&&(!route||!route.channels.includes('In App')))return;
  const v5Template=state.controlPlane.notificationTemplates.filter(t=>t.eventCode===event&&t.active&&t.channel==='In App').sort((a,b)=>b.version-a.version)[0];
  const text=v5Template?renderTemplate(v5Template.body,vars):fallback;
  if(route?.dedupeMinutes){const cutoff=serverClock.nowMs()-route.dedupeMinutes*60_000;const duplicate=state.network.notifications.some(n=>n.memberId===memberId&&n.text===text&&n.href===href&&new Date(n.createdAt).getTime()>=cutoff);if(duplicate)return;}
  const availableAt=route?.deliveryMode==='Digest'?serverClock.addMs(60*60_000).toISOString():undefined;
  api.dispatch(addNotification({memberId,text,href,deliveryMode:route?.deliveryMode??'Immediate',availableAt,acknowledgementRequired:route?.acknowledgementRequired??v5Template?.acknowledgementRequired??false,routePolicyId:route?.id,templateVersion:v5Template?.version}));
}

function activeMemberId(state:RootLike){const account=state.auth.account;if(!account)return undefined;const direct=`member-${account.id}`;return state.network.members.some(m=>m.id===direct)?direct:state.network.members.find(m=>m.email.toLowerCase()===account.email.toLowerCase())?.id;}
function businessMemberIds(state:RootLike,businessId:string){const affiliationIds=state.network.affiliations.filter(a=>a.businessId===businessId&&a.active&&a.verificationStatus==='Verified').map(a=>a.memberId);return [...new Set(affiliationIds)];}
function notifyParticipants(api:any,memberIds:string[],event:string,vars:Record<string,string>,href:string,fallback:string){const state=api.getState() as RootLike;const actor=activeMemberId(state);[...new Set(memberIds)].filter(id=>id&&id!==actor).forEach(id=>notifyByEvent(api,event,id,vars,href,fallback));}

function syncCurrentAccount(api:{getState:()=>unknown;dispatch:(action:unknown)=>unknown}){
  const state=api.getState() as RootLike;const account=state.auth.account;if(!account)return;
  const relevant=state.platformRuntime.authorisation.assignments.filter(r=>(r.accountId&&r.accountId===account.id)||(!r.accountId&&r.memberName===account.name)).map(mapAssignment);
  api.dispatch(syncEffectiveAssignments(relevant));
}

listener.startListening({matcher:isAnyOf(addRoleAssignment,updateRoleAssignmentStatus,updateHandover,decideGovernance),effect:(_action,api)=>{syncCurrentAccount(api as never)}});
listener.startListening({matcher:isAnyOf(signIn.fulfilled,authenticateAccount),effect:(_action,api)=>{syncCurrentAccount(api as never)}});

listener.startListening({actionCreator:postImport,effect:(action,api)=>{
  const state=api.getState() as RootLike;const batch=state.platformRuntime.importOperations.batches.find(x=>x.id===action.payload.id);if(!batch||batch.stage!=='Posted')return;
  const rows=(batch.stagedRecords??[]).slice(0,batch.valid||undefined);
  if(batch.type==='Visitor'){
    const ids:string[]=[];rows.forEach((row,index)=>{const id=`import-${batch.id}-${index}`;ids.push(id);api.dispatch(saveVisitorDraft({id,applicantName:String(row.applicantName??row.name??'Imported visitor'),businessName:String(row.businessName??'Imported business'),email:String(row.email??`${id}@example.test`),phone:String(row.phone??''),chapter:String(row.chapter??batch.unit),category:String(row.category??'Uncategorised'),source:`Import ${batch.id}`,consent:Boolean(row.consent??true),customResponses:{importBatch:batch.id,profileId:batch.profileId??'legacy',profileVersion:String(batch.profileVersion??4)}}))});api.dispatch(recordImportAppliedIds({id:batch.id,recordIds:ids}));
  }else if(batch.type==='Taxonomy'){
    api.dispatch(applyApprovedTaxonomyImport({batchId:batch.id,rows:rows as Array<Record<string,unknown>>,actor:action.payload.actor}));
    const after=api.getState() as RootLike;const ids=rows.map(row=>{const domain=String(row.domain??'Capability');const code=String(row.code??'').trim().toUpperCase();return after.controlPlane.taxonomy.find(x=>x.domain===domain&&x.code===code)?.id}).filter(Boolean).map(x=>`taxonomy:${x}`);api.dispatch(recordImportAppliedIds({id:batch.id,recordIds:ids as string[]}));
  }else{
    api.dispatch(applyImportRecords({batchId:batch.id,type:batch.type,records:rows as Array<Record<string,unknown>>}));
    const after=api.getState() as RootLike;const ledger=after.network.importLedger.find(x=>x.batchId===batch.id&&!x.reversedAt);api.dispatch(recordImportAppliedIds({id:batch.id,recordIds:ledger?.appliedIds??[]}));
  }
}});

listener.startListening({actionCreator:reverseImport,effect:(action,api)=>{
  const state=api.getState() as RootLike;const batch=state.platformRuntime.importOperations.batches.find(x=>x.id===action.payload.id);if(!batch)return;
  if(batch.type==='Visitor')api.dispatch(removeImportedVisitors({ids:batch.appliedRecordIds??[],actor:action.payload.actor}));
  else if(batch.type==='Taxonomy')api.dispatch(reverseApprovedTaxonomyImport({batchId:batch.id,actor:action.payload.actor}));
  else api.dispatch(reverseImportRecords({batchId:batch.id}));
}});

listener.startListening({actionCreator:requestConnection,effect:(action,api)=>{
  const state=api.getState() as RootLike;const actor=state.network.members.find(m=>m.id===action.payload.ownerId)?.name??'A member';
  notifyByEvent(api,'connection.requested',action.payload.targetId,{actor},'/app/connections','You received a new connection request.');
}});
listener.startListening({actionCreator:awardResponse,effect:(action,api)=>{
  const state=api.getState() as RootLike;const response=state.network.responses.find(x=>x.id===action.payload.responseId);const opportunity=state.network.opportunities.find(x=>x.id===action.payload.opportunityId);if(response&&opportunity){notifyByEvent(api,'opportunity.awarded',response.memberId,{opportunity:opportunity.title},'/app/transactions',`Your response to “${opportunity.title}” was selected.`);api.dispatch(publishDomainEvent({code:'OpportunityAwarded',actor:state.auth.account?.name??'Member user',payload:{opportunityId:opportunity.id,responseId:response.id,businessId:response.businessId}}));}
}});
listener.startListening({actionCreator:updateReferenceStatus,effect:(action,api)=>{
  const before=api.getOriginalState() as RootLike;const state=api.getState() as RootLike;const old=before.network.references.find(x=>x.id===action.payload.referenceId);const ref=state.network.references.find(x=>x.id===action.payload.referenceId);if(!ref||!old)return;const prior=old.status??'Sent';if(ref.status!==action.payload.status&&prior!==action.payload.status){api.dispatch(recordAudit({actor:state.auth.account?.name??'Member user',action:`Reference → ${action.payload.status}`,resource:'Reference',recordId:ref.id,result:'Denied',reason:`Illegal transition from ${prior} to ${action.payload.status}`,workspace:'Member'}));return;}api.dispatch(recordAudit({actor:state.auth.account?.name??'Member user',action:`Reference → ${ref.status??prior}`,resource:'Reference',recordId:ref.id,result:'Succeeded',workspace:'Member'}));const business=state.network.businesses.find(b=>b.id===ref.businessId)?.name??'the referenced business';notifyParticipants(api,[ref.fromMemberId,ref.toMemberId],'reference.status.changed',{business,status:ref.status??'Sent'},'/app/references',`A business reference involving ${business} is now ${ref.status??'Sent'}.`);
}});
listener.startListening({actionCreator:updateTransactionStatus,effect:(action,api)=>{
  const before=api.getOriginalState() as RootLike;const state=api.getState() as RootLike;const old=before.network.transactions.find(x=>x.id===action.payload.transactionId);const tx=state.network.transactions.find(x=>x.id===action.payload.transactionId);if(!tx||!old)return;if(tx.status!==action.payload.status&&old.status!==action.payload.status){api.dispatch(recordAudit({actor:state.auth.account?.name??'Member user',action:`Transaction → ${action.payload.status}`,resource:'Transaction',recordId:tx.id,result:'Denied',reason:`Illegal transition from ${old.status} to ${action.payload.status}`,workspace:'Member'}));return;}api.dispatch(recordAudit({actor:state.auth.account?.name??'Member user',action:`Transaction → ${tx.status}`,resource:'Transaction',recordId:tx.id,result:'Succeeded',workspace:'Member'}));const counterparty=state.network.businesses.find(b=>b.id===tx.counterpartyBusinessId)?.name??'the counterparty';const ids=[tx.memberId,...businessMemberIds(state,tx.counterpartyBusinessId),...businessMemberIds(state,tx.buyerBusinessId)];notifyParticipants(api,ids,'transaction.status.changed',{business:counterparty,status:tx.status},'/app/transactions',`The business outcome with ${counterparty} is now ${tx.status}.`);
}});
listener.startListening({actionCreator:updateMeeting,effect:(action,api)=>{
  const before=api.getOriginalState() as RootLike;const after=api.getState() as RootLike;const old=before.network.meetings.find(x=>x.id===action.payload.id);const current=after.network.meetings.find(x=>x.id===action.payload.id);if(!current||!old||!action.payload.status)return;if(current.status!==action.payload.status&&old.status!==action.payload.status){api.dispatch(recordAudit({actor:after.auth.account?.name??'Member user',action:`Meeting → ${action.payload.status}`,resource:'Meeting',recordId:current.id,result:'Denied',reason:`Illegal transition from ${old.status} to ${action.payload.status}`,workspace:'Member'}));return;}api.dispatch(recordAudit({actor:after.auth.account?.name??'Member user',action:`Meeting → ${current.status}`,resource:'Meeting',recordId:current.id,result:'Succeeded',workspace:'Member'}));if(old.status!==current.status&&current.status==='completed')notifyParticipants(api,current.participantIds,'meeting.completed',{meeting:current.title},`/app/meetings/${current.id}`,`${current.title} was completed. Review the outcome and follow-up actions.`);
}});
listener.startListening({actionCreator:updateOpportunityStatus,effect:(action,api)=>{const before=api.getOriginalState() as RootLike;const after=api.getState() as RootLike;const old=before.network.opportunities.find(x=>x.id===action.payload.opportunityId);const current=after.network.opportunities.find(x=>x.id===action.payload.opportunityId);if(!old||!current)return;const valid=current.status===action.payload.status||old.status===action.payload.status;api.dispatch(recordAudit({actor:after.auth.account?.name??'Member user',action:`Opportunity → ${action.payload.status}`,resource:'Opportunity',recordId:current.id,result:valid?'Succeeded':'Denied',reason:valid?undefined:`Illegal transition from ${old.status} to ${action.payload.status}`,workspace:'Member'}));}});
listener.startListening({actionCreator:updateResponseStatus,effect:(action,api)=>{const before=api.getOriginalState() as RootLike;const after=api.getState() as RootLike;const old=before.network.responses.find(x=>x.id===action.payload.responseId);const current=after.network.responses.find(x=>x.id===action.payload.responseId);if(!old||!current)return;const valid=current.status===action.payload.status||old.status===action.payload.status;api.dispatch(recordAudit({actor:after.auth.account?.name??'Member user',action:`Opportunity response → ${action.payload.status}`,resource:'OpportunityResponse',recordId:current.id,result:valid?'Succeeded':'Denied',reason:valid?undefined:`Illegal transition from ${old.status} to ${action.payload.status}`,workspace:'Member'}));}});
listener.startListening({actionCreator:setPromotionStatus,effect:(action,api)=>{const before=api.getOriginalState() as RootLike;const after=api.getState() as RootLike;const old=before.network.promotions.find(x=>x.id===action.payload.id);const current=after.network.promotions.find(x=>x.id===action.payload.id);if(!old||!current)return;const valid=current.status===action.payload.status||old.status===action.payload.status;api.dispatch(recordAudit({actor:after.auth.account?.name??'Management user',action:`Promotion → ${action.payload.status}`,resource:'Promotion',recordId:current.id,result:valid?'Succeeded':'Denied',reason:valid?undefined:`Illegal transition from ${old.status} to ${action.payload.status}`,workspace:'Management'}));}});
listener.startListening({actionCreator:upsertCertificationRecord,effect:(action,api)=>{
  const c=action.payload;if(c.verificationStatus!=='Pending')return;api.dispatch(openSystemModerationCase({resource:'Certification',recordId:c.id,reason:`Verify ${c.standard} for business ${c.businessId}${c.evidenceName?` using evidence ${c.evidenceName}`:'; evidence is still required'}`}));
}});
listener.startListening({actionCreator:decideModerationCase,effect:(action,api)=>{
  const state=api.getState() as RootLike;const c=state.platformRuntime.moderation.cases.find(x=>x.id===action.payload.id);if(!c||c.resource!=='Certification'||!['Verified','Rejected'].includes(action.payload.resolution))return;api.dispatch(applyCertificationReview({id:c.recordId,decision:action.payload.resolution as 'Verified'|'Rejected',actor:action.payload.actor}));const after=api.getState() as RootLike;const cert=after.network.certificationRecords.find(x=>x.id===c.recordId);if(!cert)return;const business=after.network.businesses.find(b=>b.id===cert.businessId)?.name??'Business';businessMemberIds(after,cert.businessId).forEach(memberId=>notifyByEvent(api,'certification.reviewed',memberId,{standard:cert.standard,business,status:action.payload.resolution},'/app/businesses',`${cert.standard} for ${business} was ${action.payload.resolution.toLowerCase()}.`));
}});

listener.startListening({actionCreator:rsvpEvent,effect:(action,api)=>{
  const before=api.getOriginalState() as RootLike;const after=api.getState() as RootLike;const b=before.network.events.find(x=>x.id===action.payload.eventId);const a=after.network.events.find(x=>x.id===action.payload.eventId);if(!b||!a)return;const becameWaitlisted=!(b.waitlistIds??[]).includes(action.payload.memberId)&&(a.waitlistIds??[]).includes(action.payload.memberId);if(becameWaitlisted)api.dispatch(publishDomainEvent({code:'EventRegistrationWaitlisted',actor:after.auth.account?.name??'Member user',payload:{eventId:a.id,memberId:action.payload.memberId}}));const promoted=a.attendeeIds.find(id=>!b.attendeeIds.includes(id)&&id!==action.payload.memberId);if(promoted)notifyByEvent(api,'event.waitlist.promoted',promoted,{event:a.name},`/app/events/${a.id}`,`A seat opened for ${a.name}; you were promoted from the waitlist.`);
}});
listener.startListening({actionCreator:linkActivatedMember,effect:(action,api)=>{const state=api.getState() as RootLike;const visitor=state.platformRuntime.visitorOnboarding.applications.find(v=>v.id===action.payload.visitorId);const affiliation=state.network.affiliations.find(a=>a.memberId===action.payload.memberId&&a.active&&a.verificationStatus==='Verified'&&a.primaryRepresentative)??state.network.affiliations.find(a=>a.memberId===action.payload.memberId&&a.active&&a.verificationStatus==='Verified');api.dispatch(publishDomainEvent({code:'MemberActivated',actor:action.payload.actor,payload:{memberId:action.payload.memberId,chapter:visitor?.chapter??'',businessId:affiliation?.businessId??''}}));}});
listener.startListening({matcher:isAnyOf(addRoleAssignment,updateRoleAssignmentStatus,updateHandover),effect:(action,api)=>{
  const state=api.getState() as RootLike;const payload=(action as {payload?:{id?:string}}).payload;const id=payload&&typeof payload==='object'&&'id' in payload?String(payload.id):'';const r=state.platformRuntime.authorisation.assignments.find(x=>x.id===id);if(!r?.accountId)return;const memberId=`member-${r.accountId}`;if(state.network.members.some(m=>m.id===memberId))notifyByEvent(api,'role.assignment.changed',memberId,{role:r.role,unit:r.unit},'/workspace',`Your ${r.role} assignment for ${r.unit} was updated.`);
}});


listener.startListening({actionCreator:workflowAction,effect:(action,api)=>{
  const state=api.getState() as RootLike;const task=state.platformRuntime.workflowRuntime.tasks.find(t=>t.id===action.payload.id);if(!task||task.caseType!=='Business affiliation verification'||!['Approved','Rejected'].includes(task.status))return;
  const affiliation=state.network.affiliations.find(a=>a.id===task.recordId);if(!affiliation)return;
  const approved=task.status==='Approved';const updated={...affiliation,verificationStatus:approved?'Verified' as const:'Rejected' as const,active:approved};
  api.dispatch(upsertAffiliation(updated));
  if(approved&&!state.network.affiliations.some(a=>a.memberId===affiliation.memberId&&a.active&&a.verificationStatus==='Verified'&&a.primaryRepresentative))api.dispatch(setPrimaryAffiliation({id:affiliation.id,memberId:affiliation.memberId}));
  const businessName=state.network.businesses.find(b=>b.id===affiliation.businessId)?.name??'Business';
  notifyByEvent(api,'business.affiliation.decided',affiliation.memberId,{business:businessName,status:task.status},'/app/businesses',`Your affiliation with ${businessName} was ${task.status.toLowerCase()}.`);if(approved)api.dispatch(publishDomainEvent({code:'BusinessAffiliationApproved',actor:action.payload.actor,payload:{memberId:affiliation.memberId,businessId:affiliation.businessId}}));
}});
listener.startListening({actionCreator:workflowAction,effect:(action,api)=>{
  const state=api.getState() as RootLike;const task=state.platformRuntime.workflowRuntime.tasks.find(t=>t.id===action.payload.id);if(!task||task.caseType!=='Data quality remediation'||!['Approved','Rejected'].includes(task.status))return;
  api.dispatch(applyDataQualityDecision({id:task.recordId,approved:task.status==='Approved',actor:action.payload.actor}));
}});

listener.startListening({
  predicate:(action)=>action.type.startsWith('network/')&&!new Set<string>([updateReferenceStatus.type,updateTransactionStatus.type,updateMeeting.type,updateOpportunityStatus.type,updateResponseStatus.type,setPromotionStatus.type]).has(action.type),
  effect:(action,api)=>{
   const state=api.getState() as RootLike;const account=state.auth.account;const raw=(action as {payload?:unknown}).payload;const payload=(raw&&typeof raw==='object'?raw:{}) as Record<string,unknown>;const recordId=String(payload.id??payload.memberId??payload.businessId??payload.opportunityId??payload.transactionId??payload.referenceId??payload.eventId??payload.conversationId??'network');
   api.dispatch(recordAudit({actor:account?.name??'Member user',action:action.type,resource:'NetworkDomain',recordId,result:'Succeeded',workspace:state.auth.account?'Member':'System',unit:account?.unit,safeDiff:`Recorded ${nowDate()}`}));
  }
});

export const integrationMiddleware=listener.middleware;
