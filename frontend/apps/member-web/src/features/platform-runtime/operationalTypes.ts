import type { Workspace } from '@/types/screen';
export type VisitorStatus = 'Draft'|'Verification Pending'|'Duplicate Review'|'Follow-up'|'Due Diligence'|'Returned for Information'|'Recommended'|'Approval Pending'|'Approved'|'Activated'|'Visitor Only'|'Rejected';
export interface DueDiligenceCheck { key:string; label:string; status:'Pending'|'Passed'|'Needs Information'|'Failed'; note?:string; }
export interface VisitorApplication {
  id:string; applicantName:string; businessName:string; email:string; phone:string; chapter:string; category:string; source:string;
  consent:boolean; emailVerified:boolean; status:VisitorStatus; reviewer?:string; duplicateCandidates:string[]; checks:DueDiligenceCheck[];
  evidence:string[]; recommendation?:'Approve'|'Reject'|'Visitor Only'; recommendationReason?:string; approvedBy?:string; linkedMemberId?:string;
  customResponses?:Record<string,string|boolean|string[]>; formVersion?:string; createdAt:string; updatedAt:string;
}

export type WorkflowTaskStatus = 'Open'|'Claimed'|'Information Requested'|'Ready for Decision'|'Approved'|'Rejected'|'Delegated'|'Escalated'|'Closed';
export interface WorkflowTaskHistory { at:string; actor:string; actorRole?:string; action:string; reason?:string; }
export interface WorkflowTaskBlueprint { definitionId:string; caseType:string; workflowVersion:string; slaHours:number; }
export interface WorkflowTask {
  id:string; definitionId?:string; title:string; caseType:string; recordId:string; unit:string; scopeLevel:'Chapter'|'City'|'Region'|'State'|'National'|'Platform';
  maker:string; accountableRole:string; assignee?:string; checker?:string; firstChecker?:string; status:WorkflowTaskStatus; slaDue:string; overdue:boolean; conflict:boolean;
  evidence:string[]; reason?:string; delegatedTo?:string; escalationLevel?:string; workflowVersion:string; actionHistory?:WorkflowTaskHistory[]; updatedAt:string;
}

export type ImportStage = 'Uploaded'|'Mapping'|'Validated'|'Maker Submitted'|'Checker Approved'|'Posted'|'Reconciled'|'Reversed'|'Rejected';
export type ImportRecord = Record<string,string|number|boolean|null|undefined>;
export interface ImportBatch {
  id:string; type:'Attendance'|'Payment'|'Member'|'Visitor'|'Business'|'Taxonomy'; source:'CSV Upload'|'XLSX Upload'|'API'|'Manual Batch'; unit:string; stage:ImportStage;
  rows:number; valid:number; warnings:number; duplicates:number; unmatched:number; rejected:number; maker:string; checker?:string;
  mapping:string[]; validationErrors:string[]; stagedRecords?:ImportRecord[]; appliedRecordIds?:string[]; submittedAt?:string; approvedAt?:string; postedAt?:string; reversedAt?:string; reversalReason?:string; updatedAt:string;
  profileId?:string; profileVersion?:number; postingTarget?:string; reversalSupported?:boolean; requiredFields?:string[]; duplicateFields?:string[]; warningRules?:string[]; rejectionRules?:string[]; makerCheckerPolicyId?:string;
}

export type AssignmentStatus = 'Pending Approval'|'Scheduled'|'Active'|'Handover'|'Expired'|'Revoked';
export interface EffectiveRoleAssignment {
  id:string; accountId?:string; memberName:string; role:string; workspace:Exclude<Workspace,'Public'|'Workspace'>; unit:string; unitType:'Chapter'|'City'|'Region'|'State'|'National'|'Platform';
  startsAt:string; endsAt:string; status:AssignmentStatus; exclusiveOffice:boolean; predecessor?:string; successor?:string; delegation?:string;
  handoverStatus:'Not Required'|'Planned'|'In Progress'|'Complete'|'Blocked'; approvedBy?:string; conflict?:string; updatedAt:string;
}
export interface PolicyRecord { id:string; title:string; category:string; version:string; status:'Draft'|'In Review'|'Active'|'Superseded'|'Retired'; effectiveFrom?:string; effectiveTo?:string; decisionId?:string; summary:string; }
export interface PolicyException { id:string; policyId:string; scope:string; reason:string; status:'Requested'|'Approved'|'Rejected'|'Expired'; startsAt:string; endsAt:string; decisionId?:string; }
export interface BoardPack { id:string; meeting:string; version:string; publishedAt:string; acknowledgedBy:string[]; agenda:string[]; documents:string[]; status:'Draft'|'Published'|'Superseded'; }
export interface StrategyOutcome { id:string; objective:string; owner:string; targetDate:string; status:'On Track'|'At Risk'|'Off Track'|'Complete'; metric:string; current:string; decisionId?:string; }
export interface ModerationCase { id:string; resource:string; recordId:string; reason:string; reporter:string; status:'Open'|'Investigating'|'Actioned'|'Dismissed'; owner?:string; resolution?:'Verified'|'Rejected'|'Remediated'|'No Action'; resolutionNote?:string; updatedAt:string; }
export interface DataQualityIssue { id:string; entity:string; recordId:string; issue:string; ruleCode?:string; severity:'Low'|'Medium'|'High'|'Critical'; status:'Open'|'Assigned'|'Resolution Proposed'|'Resolved'|'Waived'; owner?:string; workflowTaskId?:string; proposedResolution?:string; resolutionProposedBy?:string; updatedAt:string; }
export interface GovernanceEffect { kind:'Activate Policy'|'Approve Policy Exception'|'Activate Role Assignment'|'Update Platform Setting'|'None'; targetId?:string; value?:string|number|boolean; }
export interface GovernanceDecision {
  id:string; title:string; type:'Policy'|'Strategy'|'Role Tenure'|'Exception'|'Board Resolution'; meeting:string; status:'Draft'|'In Review'|'Approved'|'Rejected'|'Deferred';
  eligibleVoters:number; quorumRequired:number; votesFor:number; votesAgainst:number; abstentions:number; recusals:string[]; conflicts:string[];
  voteRecords?:Array<{memberName:string;vote:'For'|'Against'|'Abstain';at:string}>; recusalRecords?:Array<{memberName:string;reason:string;at:string}>; conflictRecords?:Array<{id:string;memberName:string;reason:string;status:'Open'|'Resolved'|'Recused';resolution?:string;updatedAt:string}>;
  rationale:string; evidence:string[]; packVersion:string; workflowVersion:string; immutable:boolean; effect?:GovernanceEffect; effectAppliedAt?:string; decidedAt?:string; updatedAt:string;
}

export interface IdentityRecord { accountId:string; displayName:string; email:string; status:'Active'|'Suspended'|'Inactive'|'Expired'; mfaRequired:boolean; lastAccess:string; risk:'Low'|'Medium'|'High'; }

export interface DeviceSession {
  id:string; accountId:string; device:string; browser:string; lastAccess:string; current:boolean; trusted:boolean; revokedAt?:string;
}

export interface PlatformAuditEvent {
  id:string; at:string; actor:string; action:string; resource:string; recordId:string; result:'Succeeded'|'Denied'|'Pending'|'Failed';
  reason?:string; workspace:Workspace|'System'; unit?:string; correlationId:string; policyVersion:string; workflowVersion?:string; safeDiff?:string; idempotencyKey?:string;
}

export interface PlatformRuntimeState {
  visitorOnboarding:{applications:VisitorApplication[]};
  workflowRuntime:{tasks:WorkflowTask[]};
  importOperations:{batches:ImportBatch[]};
  authorisation:{assignments:EffectiveRoleAssignment[]};
  governance:{policies:PolicyRecord[];policyExceptions:PolicyException[];boardPacks:BoardPack[];strategyOutcomes:StrategyOutcome[];decisions:GovernanceDecision[]};
  moderation:{cases:ModerationCase[]};
  dataQuality:{issues:DataQualityIssue[]};
  identitySecurity:{identities:IdentityRecord[];sessions:DeviceSession[]};
  audit:{events:PlatformAuditEvent[]};
}
