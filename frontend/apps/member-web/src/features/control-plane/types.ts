import type { Workspace } from '@/types/screen';

export type ConfigLifecycle='Draft'|'Pending Review'|'Approved'|'Scheduled'|'Active'|'Superseded'|'Rolled Back'|'Rejected';
export type ConfigArtifactType='Module'|'Action'|'Permission'|'Organisation Unit Type'|'Organisation Unit'|'Role'|'Policy Rule'|'RACI'|'Workflow'|'SLA Policy'|'Maker Checker'|'Form'|'Taxonomy'|'Notification Template'|'Notification Route'|'Promotion Policy'|'Import Profile'|'Integration'|'Webhook'|'Data Quality Rule'|'Setting'|'Feature Flag'|'Retention Policy'|'Numbering Rule'|'Matching Policy';
export interface ConfigurationChange {id:string;artifactType:ConfigArtifactType;artifactId:string;operation:'Upsert'|'Retire';status:ConfigLifecycle;version:number;maker:string;checker?:string;createdAt:string;updatedAt:string;validatedAt?:string;impactAnalysedAt?:string;submittedAt?:string;approvedAt?:string;effectiveFrom?:string;activatedAt?:string;changeSummary:string;reason:string;affectedModules:string[];validationErrors:string[];impact:string[];draft:unknown;previous?:unknown;rollbackOf?:string;governanceDecisionId?:string;baseArtifactVersion?:number;idempotencyKey?:string;conflictDetected?:boolean;}
export interface PlatformConfigurationVersion {id:string;version:string;status:ConfigLifecycle;createdBy:string;createdAt:string;approvedBy?:string;approvedAt?:string;effectiveFrom?:string;changeSummary:string;affectedModules:string[];checksum:string;predecessorVersionId?:string;rollbackTargetVersionId?:string;migrationRequirements:string[];}

export interface ModuleDefinition {id:string;code:string;name:string;workspace:Exclude<Workspace,'Public'|'Workspace'>;routeRoots:string[];enabled:boolean;group:string;order:number;requiredPermission?:string;dependencies:string[];featureFlagIds:string[];events:string[];forms:string[];workflows:string[];settings:string[];version:number;}
export interface ActionDefinition {id:string;code:string;domain:string;entity:string;description:string;fromStates:string[];toStates:string[];permission:string;workflowRequired:boolean;reasonRequired:boolean;notificationEvent?:string;auditEvent:string;risk:'Low'|'Medium'|'High'|'Critical';runtimeActionTypes?:string[];version:number;}
export interface PermissionDefinition {id:string;code:string;resource:string;action:string;description:string;risk:'Low'|'Medium'|'High'|'Critical';requiresReason:boolean;requiresReauth:boolean;makerChecker:boolean;scopeApplicable:boolean;auditLevel:'Standard'|'Sensitive'|'Critical';version:number;}
export interface OrganisationUnitTypeDefinition {id:string;code:string;name:string;parentTypeIds:string[];active:boolean;version:number;}
export interface OrganisationUnitDefinition {id:string;code:string;name:string;unitTypeId:string;parentId?:string;active:boolean;effectiveFrom:string;effectiveTo?:string;aliases:string[];geo?:string;successorUnitId?:string;version:number;}
export interface RoleDefinition {id:string;code:string;name:string;roleFamily:string;workspace:Exclude<Workspace,'Public'|'Workspace'>;eligibleUnitTypeIds:string[];permissionCodes:string[];restrictions:string[];exclusive:boolean;delegatable:boolean;requiresApproval:boolean;makerCheckerRestricted:boolean;active:boolean;version:number;}
export type PolicyOutcome='Allow'|'Deny'|'Conditional'|'Requires Approval'|'Requires Re-authentication';
export interface AccessPolicyRule {id:string;name:string;priority:number;effect:PolicyOutcome;permissionCode:string;roleCodes:string[];workspace?:Exclude<Workspace,'Public'|'Workspace'>;unitTypeIds?:string[];scopeMode:'Self'|'Own Business'|'Assigned Unit'|'Descendants'|'Explicit Units'|'National'|'Platform'|'Any';explicitUnitIds?:string[];condition?:'None'|'Not Recused'|'Not Maker'|'Identity Active'|'MFA Required';effectiveFrom:string;effectiveTo?:string;active:boolean;version:number;}
export interface RaciDefinition {id:string;process:string;workflowCode?:string;stage?:string;action:string;responsibility:'R'|'A'|'C'|'I'|'D';resolverType:'Role'|'Organisation Position'|'Unit Type'|'Identity'|'Dynamic';resolverValue:string;allow:boolean;effectiveFrom:string;effectiveTo?:string;active:boolean;version:number;}
export interface WorkflowTransitionDefinition {id:string;actionCode:string;label:string;fromStates:string[];toState:string;requiredResponsibilities:Array<'R'|'A'|'D'>;reasonRequired:boolean;evidenceRequired:boolean;makerCheckerPolicyId?:string;terminal?:boolean;}
export interface WorkflowBlueprint {id:string;code:string;name:string;domain:string;entityType:string;version:number;status:'Draft'|'Active'|'Superseded';trigger:string;unitTypeIds:string[];initialState:string;states:string[];transitions:WorkflowTransitionDefinition[];slaPolicyId?:string;notificationEvents:string[];active:boolean;}
export interface SlaPolicy {id:string;code:string;name:string;stageHours:Record<string,number>;warningHours:number;escalationHours:number;escalationRoleCode?:string;repeatEscalationHours?:number;pauseStates:string[];businessCalendar:'Calendar Hours'|'Business Hours';active:boolean;version:number;}
export interface MakerCheckerPolicy {id:string;code:string;entity:string;actionCode:string;makerRoleCodes:string[];checkerRoleCodes:string[];independentIdentity:boolean;sameUnitAllowed:boolean;threshold?:number;evidenceRequired:boolean;reasonRequired:boolean;secondChecker:boolean;active:boolean;version:number;}
export type FormFieldType='text'|'textarea'|'number'|'currency'|'percentage'|'email'|'phone'|'date'|'datetime'|'checkbox'|'radio'|'select'|'multiselect'|'taxonomy'|'member'|'business'|'organisation'|'file'|'image'|'declaration'|'acknowledgement'|'address'|'repeater'|'table'|'calculated'|'hidden';
export interface DynamicFormField {id:string;label:string;type:FormFieldType;required:boolean;options?:string[];taxonomyDomain?:string;helpText?:string;placeholder?:string;defaultValue?:unknown;visibleToRoles?:string[];editableByRoles?:string[];condition?:string;validation?:string;section?:string;readOnly?:boolean;}
export interface DynamicFormDefinition {id:string;code:string;name:string;purpose:string;description?:string;targetModule?:string;targetEntity?:string;instructions?:string;confirmationMessage?:string;effectiveFrom?:string;effectiveTo?:string;version:number;status:'Draft'|'Active'|'Superseded';fields:DynamicFormField[];active:boolean;}
export interface FormAuthoringDraft {id:string;formId:string;sourceVersion?:number;definition:DynamicFormDefinition;savedAt:string;savedBy:string;releaseChangeId?:string;}
export interface TaxonomyDefinition {id:string;domain:string;code:string;name:string;description?:string;parentId?:string;synonyms:string[];keywords:string[];active:boolean;effectiveFrom:string;effectiveTo?:string;replacementId?:string;version:number;}
export interface NotificationEventDefinition {id:string;code:string;domain:string;description:string;variables:string[];active:boolean;version:number;}
export interface NotificationTemplateDefinition {id:string;eventCode:string;channel:'In App'|'Email'|'SMS'|'Push'|'Webhook';language:string;audience:string;organisationUnitId?:string;subject:string;body:string;cta?:string;priority:'Low'|'Normal'|'High'|'Urgent';acknowledgementRequired:boolean;active:boolean;version:number;}
export interface NotificationRoutingPolicy {id:string;eventCode:string;recipientResolvers:string[];channels:Array<'In App'|'Email'|'SMS'|'Push'|'Webhook'>;retryCount:number;dedupeMinutes:number;quietHours?:string;deliveryMode:'Immediate'|'Digest';acknowledgementRequired:boolean;active:boolean;version:number;}
export interface PromotionPolicyDefinition {id:string;code:string;name:string;eligibleTypes:string[];audiences:string[];scopeModes:string[];priority:number;frequencyCap:number;memberImpressionCap:number;approvalRequired:boolean;moderationRequired:boolean;placements:string[];active:boolean;version:number;}
export interface ImportProfile {id:string;code:string;name:string;domain:'Attendance'|'Payment'|'Member'|'Visitor'|'Business'|'Taxonomy';sourceFormat:'CSV'|'XLSX'|'API'|'Manual';fieldMap:Record<string,string>;requiredFields:string[];duplicateFields:string[];warningRules:string[];rejectionRules:string[];makerCheckerPolicyId?:string;postingTarget:string;reversalSupported:boolean;active:boolean;version:number;}
export interface IntegrationDefinition {id:string;code:string;name:string;type:'Email'|'SMS'|'Payment'|'Identity'|'ERP'|'Webhook'|'Other';endpointAlias:string;secretReference?:string;capabilities:string[];direction:'Inbound'|'Outbound'|'Both';timeoutMs:number;retryCount:number;circuitBreakerFailures:number;rateLimitPerMinute:number;healthStrategy:'Ping'|'Synthetic'|'Passive';enabled:boolean;status:'Connected'|'Degraded'|'Disconnected'|'Disabled';lastCheckedAt?:string;lastSuccessAt?:string;lastFailureAt?:string;lastError?:string;version:number;}
export interface WebhookDefinition {id:string;code:string;name:string;eventCodes:string[];endpointAlias:string;secretReference?:string;enabled:boolean;retryCount:number;signingRequired:boolean;lastDeliveryAt?:string;lastResult?:'Succeeded'|'Failed';version:number;}
export interface TaxonomyImportLedgerEntry {batchId:string;changes:Array<{id:string;previous?:TaxonomyDefinition}>;appliedAt:string;reversedAt?:string;}
export interface DataQualityRuleDefinition {id:string;code:string;entity:string;description:string;condition:string;severity:'Low'|'Medium'|'High'|'Critical';remediationWorkflowCode?:string;ownerResolver:string;slaPolicyId?:string;automaticAction?:string;active:boolean;version:number;}
export interface SettingDefinition {id:string;key:string;namespace:string;label:string;type:'string'|'number'|'boolean'|'json';defaultValue:unknown;globalValue:unknown;validation?:string;allowedScopes:string[];inheritance:boolean;overrideRules:string[];sensitivity:'Public'|'Internal'|'Sensitive';changeAuthorityPermission:string;auditRequired:boolean;version:number;active:boolean;}
export interface SettingOverride {id:string;settingKey:string;scopeType:string;scopeId:string;value:unknown;effectiveFrom:string;effectiveTo?:string;version:number;active:boolean;}
export interface FeatureFlagDefinition {id:string;code:string;name:string;enabled:boolean;organisationUnitIds:string[];roleCodes:string[];startAt?:string;endAt?:string;dependencies:string[];killSwitch:boolean;version:number;}
export interface RetentionPolicyDefinition {id:string;code:string;domain:string;days:number;action:'Archive'|'Delete'|'Anonymise';requiresApproval:boolean;active:boolean;version:number;}
export interface NumberingRuleDefinition {id:string;code:string;entity:string;pattern:string;nextValue:number;scopeMode:'Global'|'Unit';active:boolean;version:number;}
export interface MatchingPolicyDefinition {id:string;code:string;searchableFields:Record<string,number>;taxonomyWeight:number;relationshipWeight:number;geographyWeight:number;certificationWeight:number;capabilityWeight:number;fuzzy:boolean;synonyms:boolean;minimumScore:number;active:boolean;version:number;}
export interface SecurityEvent {id:string;at:string;accountId?:string;actor:string;event:string;result:'Succeeded'|'Denied'|'Failed';risk:'Low'|'Medium'|'High'|'Critical';correlationId:string;reason?:string;}
export interface DomainEventCatalogueEntry {id:string;code:string;producer:string;payloadFields:string[];consumers:string[];notificationEventCode?:string;workflowTrigger?:string;webhookAvailable:boolean;auditAction:string;active:boolean;version:number;}
export interface DomainEventRecord {id:string;code:string;at:string;actor:string;payload:Record<string,string|number|boolean|null|undefined>;correlationId:string;configurationVersion:string;consumers:string[];status:'Published'|'Partially Delivered'|'Delivered'|'Rejected';}

export interface PlatformControlState {
 schemaVersion:number;
 releaseVersion:string;
 configurationVersions:PlatformConfigurationVersion[];
 changes:ConfigurationChange[];
 modules:ModuleDefinition[];
 actions:ActionDefinition[];
 permissions:PermissionDefinition[];
 organisationUnitTypes:OrganisationUnitTypeDefinition[];
 organisationUnits:OrganisationUnitDefinition[];
 roles:RoleDefinition[];
 accessPolicies:AccessPolicyRule[];
 raci:RaciDefinition[];
 workflows:WorkflowBlueprint[];
 slaPolicies:SlaPolicy[];
 makerCheckerPolicies:MakerCheckerPolicy[];
 forms:DynamicFormDefinition[];
 formHistory:DynamicFormDefinition[];
 formDrafts:FormAuthoringDraft[];
 taxonomy:TaxonomyDefinition[];
 notificationEvents:NotificationEventDefinition[];
 notificationTemplates:NotificationTemplateDefinition[];
 notificationRoutes:NotificationRoutingPolicy[];
 promotionPolicies:PromotionPolicyDefinition[];
 importProfiles:ImportProfile[];
 integrations:IntegrationDefinition[];
 webhooks:WebhookDefinition[];
 dataQualityRules:DataQualityRuleDefinition[];
 taxonomyImportLedger:TaxonomyImportLedgerEntry[];
 settings:SettingDefinition[];
 settingOverrides:SettingOverride[];
 featureFlags:FeatureFlagDefinition[];
 retentionPolicies:RetentionPolicyDefinition[];
 numberingRules:NumberingRuleDefinition[];
 matchingPolicies:MatchingPolicyDefinition[];
 securityEvents:SecurityEvent[];
 domainEvents:DomainEventCatalogueEntry[];
 domainEventLog:DomainEventRecord[];
}
