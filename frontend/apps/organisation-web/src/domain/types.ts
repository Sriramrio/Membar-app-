export type OrgLevel='CHAPTER'|'REGION'|'CITY'|'STATE'|'NATIONAL'|'MANAGEMENT';
export type Priority='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';

export type OrgRoleType='CHAPTER_PRESIDENT'|'CHAPTER_VICE_PRESIDENT'|'CHAPTER_SECRETARY'|'CHAPTER_TREASURER'|'CHAPTER_COORDINATOR'|'REGION_COORDINATOR'|'CITY_COORDINATOR'|'STATE_COORDINATOR'|'NATIONAL_PRESIDENT'|'NATIONAL_SECRETARY'|'NATIONAL_TREASURER'|'MANAGEMENT_REVIEWER';
export type OperationalResponsibilityType='COMMITTEE_CONVENER'|'COMMITTEE_MEMBER'|'EVENT_LEAD'|'KYT_LEAD'|'ATTENDANCE_LEAD'|'MEETING_COORDINATOR'|'MEMBER_GROWTH_LEAD'|'PROGRAMME_OWNER';
export interface ResponsibilityAssignment{id:string;memberId:string;responsibilityType:OperationalResponsibilityType;contextType:'COMMITTEE'|'EVENT'|'KYT'|'ATTENDANCE'|'MEETING'|'MEMBER_GROWTH'|'PROGRAMME';contextId:string;scope:OrgScope;effectiveFrom:string;effectiveTo?:string;status:'ACTIVE'|'ENDED';version:number}
export type AssignmentStatus='PLANNED'|'ACTIVE'|'SUSPENDED'|'ENDED';
export interface OrganisationRoleAssignment{id:string;memberId:string;roleType:OrgRoleType;organisationLevel:OrgLevel;organisationUnitId:string;effectiveFrom:string;effectiveTo?:string;status:AssignmentStatus;appointedBy?:string;appointmentReference?:string;portfolio?:string;responsibility?:string;acting?:boolean;delegationId?:string;handoverStatus?:'NOT_REQUIRED'|'PENDING'|'IN_PROGRESS'|'COMPLETED';version:number}
export interface ChapterCoordinatorResponsibility{id:string;memberId:string;memberName?:string;name?:string;chapterId:string;chapterName?:string;chapter?:string;regionId:string;regionName?:string;region?:string;effectiveFrom:string;effectiveTo?:string;status:'ACTIVE'|'ENDED';version:number;phone?:string;email?:string}
export interface AvailabilityRecord{id:string;actorId:string;scopeId:string;availability:'Available'|'Temporary absence'|'Leave';effectiveFrom?:string;effectiveTo?:string;reason?:string;version:number}
export interface DelegationRecord{id:string;delegatorId:string;delegateId:string;scopeId:string;functions:string[];start:string;end:string;reason:string;status:'Active'|'Revoked'|'Expired';version:number}
export interface HandoverRecord{id:string;assignmentId:string;outgoingMemberId:string;incomingMemberId:string;scopeId:string;status:'Prepared'|'Accepted'|'Completed'|'Cancelled';preparedAt:string;acceptedAt?:string;completedAt?:string;openTaskIds:string[];openActionIds:string[];openCaseIds:string[];meetingIds:string[];programmeIds:string[];documentIds:string[];version:number}

export type WorkStatus='TODO'|'IN_PROGRESS'|'WAITING'|'BLOCKED'|'REVIEW'|'DONE';
export type RecordStatus='DRAFT'|'ACTIVE'|'UNDER_REVIEW'|'APPROVED'|'REJECTED'|'CLOSED'|'ARCHIVED';
export interface OrgScope{level:OrgLevel;id:string;name:string}
export interface Actor{id:string;name:string;position:string;scope:OrgScope;effectiveFrom:string;effectiveTo?:string}
export interface TimelineEntry{id:string;at:string;actor:string;role:string;action:string;detail:string;correlationId:string}
export interface Task{id:string;title:string;description:string;owner:string;sourceType:string;sourceId:string;due:string;priority:Priority;status:WorkStatus;version:number;scope:OrgScope;timeline:TimelineEntry[]}
export interface ActionItem{id:string;title:string;owner:string;sourceType:string;sourceId:string;due:string;status:WorkStatus;priority:Priority;scope:OrgScope;version:number}
export interface Approval{id:string;subject:string;requester:string;sourceType?:string;itemType?:string;sourceId?:string;due:string;status:'PENDING'|'APPROVED'|'RETURNED'|'REJECTED';risk:string;priority?:string;scope?:OrgScope;version:number;decisionReason?:string;decidedBy?:string;decidedAt?:string;requestedAt?:string}
export interface Conversation{id:string;type:string;name:string;contextType?:string;contextId?:string;participants:string[];unread:number;muted:boolean;closed?:boolean;lastActivity:string}
export interface Message{id:string;conversationId:string;sender:string;senderRole:string;text:string;createdAt:string;status:'SENT'|'DELIVERED'|'READ'|'FAILED';replyToMessageId?:string}
export interface MemberSummary{id:string;version?:number;name:string;business:string;specialisation:string;chapter:string;baseChapterId?:string;status:string;engagement:number;duesStatus:string;membershipTerm?:string}
export interface OrgUnit{id:string;name:string;level:OrgLevel;parentId?:string;status:string;health:number;memberCount:number}
export type CommitteeType='MEMBER_GROWTH'|'EVENTS'|'KYT'|'ATTENDANCE'|'MEETING'|'MEMBER_PRESENTATION'|'NETWORKING'|'MEMBER_ENGAGEMENT'|'COMMUNICATION'|'PROGRAMME'|'OTHER';
export interface Committee{id:string;version?:number;name:string;committeeType?:CommitteeType;mandate:string;convener:string;coConvener?:string;members:string[];status:string;termStart?:string;termEnd:string;objectives?:string[];targets?:Array<{label:string;target:number;unit:string}>;scope:OrgScope}
export interface Meeting{id:string;title:string;type:string;scope:OrgScope;scheduledAt:string;status:string;participants:string[];quorumRequired:number;agenda:string[];minutes?:string;location?:string;version:number}
export interface MemberCase{id:string;memberId:string;type:string;title:string;owner:string;status:string;priority:Priority;scope:OrgScope;internalNote:string;memberMessage:string;version:number}
export interface Programme{id:string;version?:number;name:string;owner:string;sponsor?:string;committeeId?:string;status:string;progress:number;nextMilestone:string;scope:OrgScope;risk:string}
export interface EventItem{id:string;version?:number;name:string;date:string;status:string;attendance:number;owner:string;committeeId?:string;programmeId?:string;location?:string;scope:OrgScope}
export interface SupportRequest{id:string;title:string;requesterScope:OrgScope;targetScope:OrgScope;status:string;owner:string;summary:string;version:number}
export interface Escalation{id:string;title:string;sourceType:string;sourceId:string;from:OrgScope;to:OrgScope;status:string;owner:string;severity:Priority;version:number}
export interface Handoff{id:string;sourceWorkspace:string;sourceType:string;sourceId:string;targetWorkspace:'MEMBER'|'PLATFORM_ADMIN'|'GOVERNANCE';requestedCapability:string;reason:string;status:string;targetReference?:string;correlationId:string}
export interface AuditEvent{id:string;at:string;actor:string;effectiveRole:string;scope:string;action:string;entityType:string;entityId:string;before?:string;after?:string;reason?:string;commandId:string;correlationId:string}

export interface RiskItem{id:string;title:string;owner:string;status:string;impact:Priority;likelihood:'LOW'|'MEDIUM'|'HIGH';scope:OrgScope;reviewDate:string;version:number}
export interface IssueItem{id:string;title:string;owner:string;status:string;impact:Priority;scope:OrgScope;sourceType:string;sourceId:string;version:number}
export interface DecisionItem{id:string;subject:string;authority:string;sourceType:string;sourceId:string;reason:string;effectiveDate:string;status:string;scope:OrgScope;version:number}
export interface JobItem{id:string;kind:'REPORT'|'IMPORT'|'EXPORT'|'COMMUNICATION'|'ANALYTICS';title:string;status:'Queued'|'Running'|'Partially Completed'|'Completed'|'Failed'|'Cancelled';requestedBy:string;scope:OrgScope;requestedAt:string;progress?:number}
export interface DocumentItem{id:string;title:string;type:string;version:string;scope:OrgScope;status:string;owner:string;effectiveDate?:string;visibility:'INTERNAL'|'RESTRICTED'}
export interface GoalItem{id:string;version?:number;title:string;status:'Planned'|'Active'|'At Risk'|'Completed'|'Deferred'|'Cancelled';progress:number;owner:string;scope:OrgScope;reviewCadence:string}

export interface OperationalPerson{id:string;memberId?:string;name:string;position:string;scope:OrgScope;effectiveFrom:string;effectiveTo?:string;converseConversationId?:string}

export interface OrgSearchResult{id:string;type:string;title:string;sub:string;to:string}

export interface NotificationItem{id:string;version?:number;title:string;status:'Unread'|'Read'|'Acknowledged';sourceType:string;sourceId:string;to:string;createdAt:string;scope:OrgScope}
export interface AlertItem{id:string;title:string;severity:Priority;sourceType:string;sourceId:string;to:string;createdAt:string;scope:OrgScope;requiresAction:boolean}

export interface ActionCentreItem{id:string;entityType:'Task'|'Member Case'|'Approval'|'Action';title:string;owner:string;due?:string;status:string;priority?:Priority;to:string;expectedVersion?:number;sourceType?:string;sourceId?:string}
export interface TodayProjection{metrics:{needsYou:number;dueOverdue:number;unreadConverse:number;upcomingMeetings:number};needs:Array<{id:string;title:string;meta:string;status:string;to:string}>;nextMeeting?:{id:string;title:string;scheduledAt:string};chapterHealth:Array<{id:string;name:string;health:number}>;serverTime?:string}


export interface VolunteerDigestProjection{
  openWork:number;
  overdue:number;
  upcomingMeetings:number;
  unreadConverse:number;
  openMemberCases:number;
  approvalsPending?:number;
  generatedAt?:string;
}

export interface CommunicationItem{id:string;title:string;status:'Draft'|'Review'|'Approved'|'Scheduled'|'Published'|'Active'|'Expired'|'Archived';audience:string;scope:OrgScope;acknowledgementRequired:boolean;version:number}
export interface FeedbackItem{id:string;kind:'POLL'|'SURVEY';title:string;status:'Draft'|'Open'|'Closed'|'Results Available'|'Archived';responses?:number;scope:OrgScope;version:number}
export interface DataQualityFinding{id:string;title:string;status:'Detected'|'Open'|'Assigned'|'Investigating'|'Correction Proposed'|'Corrected'|'Verified'|'Closed'|'Suppressed';category:string;sourceType:string;sourceId:string;scope:OrgScope;version:number;description?:string;severity?:string;entityType?:string;entityId?:string;scopeName?:string;createdAt?:string}

export interface OperationalExceptionItem{id:string;title:string;requester:string;status:'Draft'|'Submitted'|'Review'|'Clarification'|'Approved'|'Conditionally Approved'|'Rejected'|'Effective'|'Expired'|'Revoked'|'Closed';reason:string;scope:OrgScope;effectiveTo?:string;version:number}
export interface ControlRow{id:string;title:string;meta:string;status:string;to:string;severity?:Priority}

export interface CalendarEntry{id:string;date:string;title:string;type:string;to:string;status?:string;owner?:string;time?:string;location?:string;priority?:string;endDate?:string;}


export interface AttendanceRecord{id:string;memberId:string;memberName?:string;sessionType:'MEETING'|'EVENT'|'PROGRAMME';sessionId:string;status:'Present'|'Absent'|'Excused'|'Registered'|'Substitute';recordedAt?:string;scope:OrgScope;version:number;paymentStatus?:string;isPaymentVerified?:boolean;}
export interface KytSession{id:string;memberId:string;memberName:string;scheduledAt:string;status:string;needs:string[];offers:string[];potentialConnections:string[];outcome?:string;scope:OrgScope;version:number}
export interface MemberPresentation{id:string;memberId:string;memberName:string;presentationType:string;topic:string;scheduledAt:string;meetingId?:string;status:string;followUp?:string;scope:OrgScope;version:number}
export interface GrowthProspect{id:string;name:string;business:string;specialisation?:string;sector?:string;segment?:string;owner:string;chapterId:string;status:string;leadSource?:string;nextFollowUp?:string;conversionDate?:string;lostReason?:string;version:number;scope:OrgScope}
export interface MemberDuesRow{id:string;memberId:string;memberName:string;business?:string;membershipTerm:string;status:string;paymentReferenceMasked?:string;reconciliationStatus?:string;version:number}
export interface NetworkingOperationsProjection{
  period:string;
  connections:number;
  oneToOnes:number;
  referencesGiven:number;
  referencesReceived?:number;
  opportunityResponses:number;
  recordedOutcomeValue:number;
  activeMembers?:number;
  participatingMembers?:number;
  lowParticipation:MemberSummary[];
  source:string;
}

export interface HierarchyRollupChild{id:string;name:string;level:OrgLevel;activeMembers:number;openWork:number;attendanceRecords:number;networkingActivities:number;programmes:number;events:number}
export interface HierarchyRollupProjection{unitId:string;level:OrgLevel;activeMembers:number;openWork:number;attendanceRecords:number;networkingActivities:number;programmes:number;events:number;children:HierarchyRollupChild[];serverTime?:string}
export interface HierarchyOperationsProjection{
  level:OrgLevel;
  unitCount:number;
  openWork:number;
  openMemberCases:number;
  supportInterventions:number;
  attentionUnits:Array<{id:string;name:string;level:OrgLevel;status:string;health?:number;memberCount?:number;to:string}>;
  serverTime?:string;
}
export interface ReportsSummaryProjection{
  taskCompleted:number;
  taskTotal:number;
  openMemberCases:number;
  openSupportRequests:number;
  auditEvents?:number;
  volunteerEffort?:Array<{key:string;label:string;value:number;unit:string}>;
  automation?:Array<{key:string;label:string;value:number;unit:string}>;
  serverTime?:string;
}
export interface ContinuityProjection{
  responsibilities:string[];
  openTasks:number;
  openActions:number;
  openMemberCases:number;
  upcomingMeetings:number;
  committees:number;
  programmes:number;
  documentReferences:number;
  activeDelegations?:number;
  actingCover?:{delegateName?:string;effectiveTo?:string;status:string};
  serverTime?:string;
}
export interface ChapterOperationsProjection{
  openTasks:number;
  openMemberCases:number;
  officeBearers:OperationalPerson[];
  membersRequiringAttention:MemberSummary[];
  serverTime?:string;
}
