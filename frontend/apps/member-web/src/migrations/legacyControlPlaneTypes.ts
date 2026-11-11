import type { Workspace } from '@/types/screen';

export interface OrganisationUnit { id:string; name:string; type:'Chapter'|'City'|'Region'|'State'|'National'|'Platform'; parentId?:string; active:boolean; effectiveFrom:string; effectiveTo?:string; }
export type RaciLetter='R'|'A'|'C'|'I'|'D';
export interface RaciRule { id:string; process:string; action:string; resource:string; role:string; unitType?:OrganisationUnit['type']; responsibility:RaciLetter; allow:boolean; effectiveFrom:string; effectiveTo?:string; version:string; }
export interface WorkflowStepDefinition { id:string; label:string; action:'Claim'|'Request Information'|'Approve'|'Reject'|'Delegate'|'Escalate'; requiredResponsibility:RaciLetter[]; terminal?:boolean; }
export interface WorkflowDefinition { id:string; name:string; caseType:string; version:string; active:boolean; unitTypes:OrganisationUnit['type'][]; slaHours:number; steps:WorkflowStepDefinition[]; }
export interface FormFieldDefinition { id:string; label:string; type:'text'|'email'|'phone'|'number'|'date'|'select'|'multiselect'|'checkbox'|'textarea'; required:boolean; options?:string[]; visibility?:'public'|'member'|'management'|'admin'; }
export interface FormDefinition { id:string; name:string; purpose:'Visitor Registration'|'Member Profile'|'Business Profile'|'Event Registration'|'Opportunity'; version:string; active:boolean; fields:FormFieldDefinition[]; }
export interface NotificationTemplate { id:string; event:string; audience:'Member'|'Management'|'Governance'|'Platform Admin'|'Public'; channel:'In App'|'Email'|'SMS'; subject:string; body:string; active:boolean; version:string; }
export interface PromotionPolicy { id:string; name:string; maxImpressionsPerMemberPerDay:number; maxActiveCampaignsPerBusiness:number; requireApproval:boolean; allowedScopes:string[]; active:boolean; version:string; }
export interface IntegrationConnector { id:string; name:string; type:'Email'|'SMS'|'Payment'|'Identity'|'ERP'|'Webhook'; status:'Connected'|'Degraded'|'Disconnected'|'Disabled'; lastCheckedAt?:string; lastSuccessAt?:string; endpointAlias:string; enabled:boolean; }
export interface TaxonomyTerm { id:string; domain:'Product'|'Service'|'Process'|'Material'|'Industry'|'Capability'|'Certification'|'Geography'|'Standard'; code:string; name:string; synonyms:string[]; active:boolean; }
export interface PlatformSetting { key:string; label:string; value:string|number|boolean; category:'Security'|'Privacy'|'Workflow'|'Messaging'|'Network'|'Operations'; requiresApproval:boolean; version:number; updatedAt:string; }
