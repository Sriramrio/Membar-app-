export type EvidenceStatus='VERIFIED_FROM_SOURCE'|'IMPLEMENTED_AND_TESTED'|'IMPLEMENTED_PENDING_RUNTIME_TEST'|'DESIGNED_NOT_IMPLEMENTED'|'NOT_VERIFIED'|'BLOCKED_ENVIRONMENT'|'FAILED_VALIDATION';
export type ErrorCode='VALIDATION'|'AUTHENTICATION'|'AUTHORIZATION'|'NOT_FOUND'|'CONFLICT'|'GONE'|'RATE_LIMIT'|'DEPENDENCY'|'OFFLINE'|'CANCELLED'|'UNKNOWN'|'UNKNOWN_COMMITTED';
export interface StructuredError {code:ErrorCode;message:string;correlationId?:string;requestId?:string;retryable?:boolean;fieldErrors?:Record<string,string>;currentVersion?:string|number;allowedRecovery?:string[];retryAfter?:number;unknownOutcome?:boolean}
export interface ActorContext{accountId:string;name:string;status:'Active'|'Suspended'|'Locked';permissions:string[]}
export interface OrganisationScope{type:string;id:string;name:string}
export interface BootstrapResponse{actor:ActorContext;session:{revision:number};activeWorkspace:'Platform Admin';activeScope:OrganisationScope;availableScopes:OrganisationScope[];permissions:string[];serverTime:string;configurationVersion:string;evidence:Record<string,EvidenceStatus>}
export interface QueryFilter{field:string;operator:'eq'|'in'|'contains';value:unknown}
export interface QuerySort{field:string;direction:'asc'|'desc'}
export interface QueryRequest{queryId:string;search?:string;filters?:QueryFilter[];sort?:QuerySort[];pagination?:{cursor?:string;pageSize?:number};scope?:OrganisationScope;fields?:string[];facets?:string[];parameters?:Record<string,unknown>}
export interface QueryPage{nextCursor?:string;pageSize:number;returned:number;hasMore:boolean;totalEstimate?:number;generatedAt?:string;consistencyToken?:string}
export interface QueryResponse<T=unknown>{data:T;version?:string;correlationId?:string;requestId?:string}
export interface CommandRequest<T=Record<string,unknown>>{commandId:string;command:string;aggregateType:string;aggregateId?:string;expectedVersion?:string|number;scope?:OrganisationScope;reason?:string;payload?:T;metadata?:Record<string,unknown>}
export interface CommandResponse{aggregateId?:string;version?:string|number;auditId?:string;correlationId?:string;requestId?:string;status?:string}
export interface EffectiveAccessRequest{actorId:string;workspace:string;organisationId:string;resource:string;action:string;recordState?:string;effectiveAt?:string}
export interface EffectiveAccessFactor{name:string;status:'PASS'|'FAIL'|'INFO';detail?:string}
export interface EffectiveAccessResult{decision:'ALLOW'|'DENY'|'REQUIRES_APPROVAL'|'REQUIRES_REAUTH';factors:EffectiveAccessFactor[];evaluatedAt:string}
export interface EffectiveConfigurationResult{key:string;effectiveValue:unknown;sourceScopeType:string;sourceScopeId?:string;version:number|string;inherited:boolean;overridden:boolean;inheritanceMode:string;path:Array<{scopeType:string;scopeId?:string;value:unknown;version:number|string}>;serverTime:string}
export interface AuditRecord{id:string;at:string;actor:string;action:string;entityType:string;entityId:string;scope?:string;reason?:string;commandId?:string;correlationId?:string;result?:string}
export interface JobStatus{id:string;type:string;status:'Queued'|'Running'|'Partial'|'Completed'|'Failed'|'Cancelled';progress?:number}
export interface HandoffReference{id:string;sourceWorkspace:'MEMBER'|'ORGANISATION'|'GOVERNANCE';sourceType:string;sourceId:string;targetWorkspace:'Platform Admin';requestedCapability:string;reason:string;summary:string;requestedBy:string;authorityContext?:string;status:'Requested'|'Accepted'|'Assigned'|'In Progress'|'Waiting for Information'|'Change Proposed'|'Approved'|'Implemented'|'Verified'|'Returned'|'Source Reconciled'|'Closed';targetReference?:string;assignedTo?:string;returnOutcome?:string;effectiveDate?:string;correlationId?:string;auditLinks?:string[];version:number}

export interface ConfigurationProfileValue{key:string;value:unknown;locked?:boolean}
export interface ConfigurationProfile{id:string;code:string;name:string;description?:string;baseProfileId?:string;applicableUnitTypes:string[];status:'Draft'|'Active'|'Superseded'|'Retired';effectiveFrom?:string;effectiveTo?:string;version:number;values:ConfigurationProfileValue[]}
export interface ConfigurationProfileAssignment{id:string;profileId:string;scopeId:string;status:'Scheduled'|'Active'|'Expired'|'Revoked';effectiveFrom:string;effectiveTo?:string;version:number}
export interface EffectiveConfigurationProfileResult{scopeId:string;profile?:ConfigurationProfile;assignment?:ConfigurationProfileAssignment;resolvedValues:Array<{key:string;value:unknown;source:'PROFILE'|'LOCAL_OVERRIDE'|'INHERITED';sourceId:string}>;conflicts:Array<{key:string;message:string}>;shadowed:Array<{key:string;sourceId:string;reason:string}>;evaluatedAt:string}

export type ConfigurationReleaseStatus='Draft'|'Pending Review'|'Returned'|'Rejected'|'Approved'|'Scheduled'|'Active'|'Superseded'|'Rolled Back'|'Failed Activation'|'Cancelled';
export interface ConfigurationRelease{id:string;artifactType:string;artifactId:string;changeSummary:string;reason?:string;status:ConfigurationReleaseStatus;maker:string;checker?:string;version:number;createdAt:string;updatedAt:string;validatedAt?:string;impactAnalysedAt?:string;impact?:string[];effectiveFrom?:string;activatedAt?:string;rolledBackAt?:string}

export type ChangeSetStatus='Draft'|'Pending Review'|'Returned'|'Rejected'|'Approved'|'Scheduled'|'Active'|'Cancelled';
export interface ChangeSetItem{id:string;artifactType:string;artifactId:string;expectedVersion?:number|string;changeType:'CREATE'|'UPDATE'|'RETIRE'|'ASSIGN'|'UNASSIGN';summary:string}
export interface PlatformChangeSet{id:string;name:string;description?:string;status:ChangeSetStatus;maker:string;checker?:string;version:number;items:ChangeSetItem[];validatedAt?:string;impactAnalysedAt?:string;impact?:string[];effectiveFrom?:string;createdAt:string;updatedAt:string}

export type TaxonomyFamily='BUSINESS_SECTOR'|'BUSINESS_SEGMENT'|'BUSINESS_SPECIALISATION'|'CAPABILITY'|'CERTIFICATION'|'PRODUCT'|'SERVICE'|'GEOGRAPHY'|'STANDARD';
export type TaxonomyStatus='Draft'|'Active'|'Superseded'|'Retired';
export interface TaxonomyNode{id:string;family:TaxonomyFamily;code:string;name:string;parentId?:string;aliases?:string[];keywords?:string[];synonyms?:string[];replacementId?:string;status:TaxonomyStatus;effectiveFrom?:string;effectiveTo?:string;version:number;consumerWorkspaces?:Array<'MEMBER'|'ORGANISATION'|'GOVERNANCE'>}
export interface TaxonomyImpactResult{nodeId:string;children:number;referencedBy:number;dependencies:Array<{type:string;id:string;label:string;evidence:'SIMULATOR_FIXTURE'|'VERIFIED_SOURCE_REFERENCE'|'BLUEPRINT_CONTRACT'}>;canRetire:boolean;blockingReasons:string[];generatedAt:string}

export type MasterDataStatus='Draft'|'Active'|'Superseded'|'Retired';
export interface MasterDataItem{id:string;domain:string;code:string;name:string;description?:string;status:MasterDataStatus;effectiveFrom?:string;effectiveTo?:string;replacementId?:string;version:number;metadata?:Record<string,unknown>;consumerWorkspaces?:Array<'MEMBER'|'ORGANISATION'|'GOVERNANCE'>}
export interface MasterDataImpactResult{itemId:string;referencedBy:number;dependencies:Array<{type:string;id:string;label:string;evidence:'SIMULATOR_FIXTURE'|'VERIFIED_SOURCE_REFERENCE'|'BLUEPRINT_CONTRACT'}>;canRetire:boolean;blockingReasons:string[];generatedAt:string}

export type ReferenceDataStatus='Draft'|'Active'|'Superseded'|'Retired';
export interface ReferenceDataItem{id:string;domain:string;code:string;name:string;description?:string;status:ReferenceDataStatus;source:string;sourceVersion?:string;sourceUri?:string;effectiveFrom?:string;effectiveTo?:string;replacementId?:string;version:number;metadata?:Record<string,unknown>;consumerWorkspaces?:Array<'MEMBER'|'ORGANISATION'|'GOVERNANCE'>}
export interface ReferenceDataImpactResult{itemId:string;referencedBy:number;dependencies:Array<{type:string;id:string;label:string;evidence:'SIMULATOR_FIXTURE'|'VERIFIED_SOURCE_REFERENCE'|'BLUEPRINT_CONTRACT'}>;canRetire:boolean;blockingReasons:string[];generatedAt:string}


export type FormStatus='Draft'|'Published'|'Superseded'|'Retired';
export type FormFieldType='TEXT'|'TEXTAREA'|'NUMBER'|'DATE'|'BOOLEAN'|'SELECT'|'MULTI_SELECT'|'EMAIL'|'PHONE';
export interface FormOptionSource{type:'STATIC'|'TAXONOMY'|'MASTER_DATA'|'REFERENCE_DATA';referenceId?:string;values?:Array<{code:string;label:string}>}
export interface FormFieldDefinition{key:string;label:string;type:FormFieldType;required?:boolean;privacyClassification:'PUBLIC'|'INTERNAL'|'CONFIDENTIAL'|'SENSITIVE';optionSource?:FormOptionSource;visibilityDependsOn?:{fieldKey:string;equals:unknown};validation?:{minLength?:number;maxLength?:number;pattern?:string;min?:number;max?:number}}
export interface FormVersion{id:string;version:number;status:'Draft'|'Published'|'Superseded';fields:FormFieldDefinition[];createdAt:string;publishedAt?:string}
export interface FormDefinition{id:string;code:string;name:string;description?:string;status:FormStatus;currentVersion:number;versions:FormVersion[];consumerWorkspaces:Array<'MEMBER'|'ORGANISATION'|'GOVERNANCE'>;version:number}
export interface FormValidationResult{formId:string;valid:boolean;errors:string[];warnings:string[];generatedAt:string}



export type WorkflowStatus='Draft'|'Published'|'Superseded'|'Retired';
export interface WorkflowStateDefinition{code:string;name:string;initial?:boolean;terminal?:boolean}
export interface WorkflowTransitionDefinition{code:string;from:string;to:string;permission:string;raciKey?:string;sodPolicyIds?:string[];slaPolicyId?:string;notificationEventIds?:string[];reasonRequired?:boolean;evidenceRequired?:boolean}
export interface WorkflowVersionDefinition{id:string;version:number;status:'Draft'|'Published'|'Superseded';states:WorkflowStateDefinition[];transitions:WorkflowTransitionDefinition[];formVersionId?:string;createdAt:string;publishedAt?:string}
export interface WorkflowDefinition{id:string;code:string;name:string;description?:string;status:WorkflowStatus;currentVersion:number;versions:WorkflowVersionDefinition[];consumerWorkspaces:Array<'MEMBER'|'ORGANISATION'|'GOVERNANCE'>;version:number}
export interface WorkflowValidationResult{workflowId:string;valid:boolean;errors:string[];warnings:string[];generatedAt:string}



export type SlaPolicyStatus='Draft'|'Active'|'Superseded'|'Retired';
export interface SlaPolicy{id:string;code:string;name:string;durationMinutes:number;warningMinutes:number;breachMinutes:number;pauseStates?:string[];calendarId:string;escalationLevels:Array<{afterMinutes:number;resolver:string;notificationEventId?:string}>;status:SlaPolicyStatus;version:number}
export interface BusinessCalendar{id:string;code:string;name:string;timezone:string;workingDays:number[];workingHours:{start:string;end:string};holidays:Array<{date:string;name:string}>;blackouts?:Array<{from:string;to:string;reason:string}>;status:'Draft'|'Active'|'Superseded'|'Retired';version:number}
export interface FeatureDefinition{id:string;code:string;name:string;description?:string;status:'Draft'|'Active'|'Disabled'|'Retired';capabilities:string[];dependencies?:string[];scopePolicy:'GLOBAL'|'HIERARCHICAL';version:number}
export interface NotificationDefinition{id:string;code:string;name:string;event:string;recipientResolver:string;templateId:string;channels:Array<'IN_APP'|'EMAIL'|'SMS'>;deliveryPolicy:'IMMEDIATE'|'DIGEST'|'SCHEDULED';status:'Draft'|'Active'|'Superseded'|'Retired';version:number}
export interface TemplateDefinition{id:string;code:string;name:string;channel:'IN_APP'|'EMAIL'|'SMS';subject?:string;body:string;variables:string[];status:'Draft'|'Published'|'Superseded'|'Retired';version:number}



export type IntegrationStatus='Configured'|'Healthy'|'Degraded'|'Failed'|'Disabled';
export interface IntegrationDefinition{id:string;code:string;name:string;type:string;status:IntegrationStatus;endpointLabel?:string;secretConfigured:boolean;healthCheckEnabled:boolean;lastSuccessAt?:string;lastFailureAt?:string;lastTestAt?:string;failureSummary?:string;version:number}
export interface IntegrationHealthSummary{items:IntegrationDefinition[];healthy:number;attention:number;generatedAt:string}



export type ImportStatus='Uploaded'|'Validation'|'Mapped'|'Preview'|'Staged'|'Pending Review'|'Approved'|'Posting'|'Posted'|'Reconciling'|'Completed'|'Exceptions'|'Rejected'|'Cancelled'|'Failed';
export interface ImportException{row?:number;code:string;message:string;field?:string}
export interface ImportRun{id:string;domain:string;source:string;fileName?:string;status:ImportStatus;rows:number;valid:number;invalid:number;warnings:number;owner:string;checker?:string;startedAt:string;updatedAt?:string;stagingReference?:string;exceptions?:ImportException[];reconciliation?:{posted:number;failed:number;unmatched:number};version:number}



export type ExportStatus='Requested'|'Queued'|'Running'|'Ready'|'Downloaded'|'Expired'|'Failed'|'Cancelled';
export interface ExportRun{id:string;reportType:string;scopeId:string;status:ExportStatus;requestedBy:string;requestedAt:string;sensitive:boolean;expiresAt?:string;downloadedAt?:string;failureSummary?:string;version:number}
export interface PlatformJob{id:string;type:string;owner:string;scope:string;status:'Queued'|'Running'|'Partial'|'Completed'|'Failed'|'Cancelled'|'Retrying';progress:number;startedAt?:string;completedAt?:string;failure?:string;correlationId?:string;version:number}



export type DataQualityStatus='Detected'|'Triaged'|'Assigned'|'Investigating'|'Correction Proposed'|'Approved'|'Corrected'|'Revalidated'|'Verified'|'Closed';
export interface DataQualityRule{id:string;code:string;name:string;description?:string;severity:'Low'|'Medium'|'High'|'Critical';scope:string;status:'Draft'|'Active'|'Retired';version:number}
export interface DataQualityFinding{id:string;type:string;severity:'Low'|'Medium'|'High'|'Critical';status:DataQualityStatus;sourceWorkspace:string;sourceType:string;sourceId:string;scopeId:string;owner?:string;proposedCorrection?:unknown;verifiedAt?:string;verifiedBy?:string;version:number}



export type CorrectionStatus='Draft'|'Pending Review'|'Returned'|'Rejected'|'Approved'|'Applied'|'Verified'|'Cancelled';
export interface TechnicalCorrection{id:string;findingId?:string;entityType:string;entityId:string;currentValue:unknown;proposedValue:unknown;reason:string;impactSummary?:string;status:CorrectionStatus;proposedBy:string;approvedBy?:string;appliedBy?:string;verifiedBy?:string;version:number;createdAt:string;updatedAt:string}



export type ModerationPolicyStatus='Draft'|'Active'|'Superseded'|'Retired';
export interface ModerationPolicy{id:string;code:string;name:string;description?:string;appliesTo:string[];severityThreshold:'Low'|'Medium'|'High'|'Critical';reviewRequired:boolean;allowedDecisions:string[];status:ModerationPolicyStatus;version:number}
export interface ModerationQueueItem{id:string;sourceType:string;sourceId:string;status:string;severity:string;reason:string;policyId?:string;decision?:string;version:number}


export interface VersionHistoryRecord{id:string;entityType:string;entityId:string;version?:number|string;changedAt:string;changedBy:string;reason?:string;releaseId?:string;commandId?:string;correlationId?:string;before?:unknown;after?:unknown}


export interface ImpactDependency{type:string;id:string;label:string;evidence:'SIMULATOR_FIXTURE'|'VERIFIED_SOURCE_REFERENCE'|'BLUEPRINT_CONTRACT'}
export interface ImpactAnalysisResult{artifactType:string;artifactId:string;dependencies:ImpactDependency[];blockingReasons:string[];canChange:boolean;generatedAt:string;message:string}


export interface DiagnosticTraceStep{name:string;status:'PASS'|'FAIL'|'INFO';at?:string;detail?:string}
export interface DiagnosticTrace{correlationId:string;requestId?:string;steps:DiagnosticTraceStep[];auditIds:string[];outboxEventIds:string[];safe:boolean;generatedAt:string}


export interface SecurityPolicy{id:string;code:string;name:string;mfaRequired:boolean;sessionMaxHours:number;reauthMinutes:number;lockoutAttempts:number;privilegedElevationMaxMinutes:number;status:'Draft'|'Active'|'Superseded';version:number}
export interface SecurityEvent{id:string;type:string;severity:'Low'|'Medium'|'High'|'Critical';status:'Open'|'Acknowledged'|'Closed';accountId?:string;occurredAt:string;correlationId?:string;version:number}
export interface PrivilegedElevationRequest{id:string;requestedBy:string;scopeId:string;reason:string;durationMinutes:number;status:'Pending Independent Approval'|'Rejected'|'Expired';requestedAt:string;version:number}


export interface RetentionPolicy{id:string;code:string;name:string;resourceType:string;retentionDays:number;expiryAction:'ARCHIVE'|'RETIRE'|'ANONYMISE';legalHoldSupported:boolean;status:'Draft'|'Active'|'Superseded'|'Retired';effectiveFrom?:string;version:number}



export interface PlatformReportDefinition{id:string;code:string;name:string;description:string;category:'ACCESS'|'CONFIGURATION'|'ASSURANCE'|'OPERATIONS'|'SECURITY';status:'Available'|'Disabled';source:'PLATFORM_READ_MODEL';sensitive:boolean;requiredPermission:string;dimensions:string[];metrics:string[]}
export interface PlatformReportPreview{reportId:string;generatedAt:string;source:'PLATFORM_READ_MODEL';metrics:Record<string,number|string>;notes:string[]}

export type ConsumerWorkspace='MEMBER'|'ORGANISATION'|'GOVERNANCE';
export interface ConsumerDependencyContract{type:'TAXONOMY'|'FORM'|'WORKFLOW'|'RACI'|'SOD'|'SLA'|'CALENDAR'|'NOTIFICATION'|'CONFIGURATION'|'FEATURE'|'PERMISSION';contract:string;versioned:boolean;owner:'PLATFORM_ADMIN'}
export interface ConsumerCapabilityDefinition{id:string;workspace:ConsumerWorkspace;functionCode:string;functionName:string;description:string;dependencies:ConsumerDependencyContract[];handoffCapabilities:string[];events:string[];status:'Active'|'Planned';evidence:'VERIFIED_FROM_SOURCE'|'BLUEPRINT_CONTRACT'|'DESIGNED_NOT_IMPLEMENTED'}
