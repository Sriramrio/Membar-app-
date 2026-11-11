import type {OrgLevel,OrgRoleType} from '@/domain/types';
import {hasPermissionId} from '@/security/access';
import {routeAccessPolicy} from './routeAccessPolicy';
import {authStorage} from '@/utils/authStorage';
export interface NavItem{label:string;to:string;minimumLevel?:OrgLevel;recommended?:boolean;capability?:string}
export interface NavGroup{title:string;items:readonly NavItem[]}
const levelRank:Record<OrgLevel,number>={CHAPTER:1,REGION:2,CITY:3,STATE:4,NATIONAL:5,MANAGEMENT:6};
export const navGroups:readonly NavGroup[]=[
  {title:'Workspace',items:[
    {label:'Today',to:'/org/today'},{label:'Action Centre',to:'/org/action-centre'},{label:'Converse',to:'/org/converse'},
    {label:'Calendar',to:'/org/calendar'},{label:'Search',to:'/org/search'},{label:'Approvals',to:'/org/approvals'}]},
  {title:'Parivar Operations',items:[
    {label:'Parivar Leadership Governance',to:'/org/trustee/leadership'},{label:'Members',to:'/org/members'},{label:'Athithi Management',to:'/org/visitors'},{label:'Member Onboarding',to:'/org/member-onboarding'},{label:'Payment Verification (Trust)',to:'/org/trust-payments'},{label:'MC & Office Bearers',to:'/org/mc'},{label:'People',to:'/org/people'},{label:'Committees',to:'/org/committees'},
    {label:'Bhandhu Growth',to:'/org/growth'},{label:'Networking',to:'/org/networking'},{label:'Attendance',to:'/org/attendance'},{label:'KYT',to:'/org/kyt'},
    {label:'Member Business Presentation (MBP)',to:'/org/member-presentations'},{label:'Member Cases',to:'/org/member-cases'},
    {label:'Membership Dues',to:'/org/membership-dues'},{label:'Payment Exceptions',to:'/org/payment-exceptions'}]},
  {title:'Execution & Planning',items:[
    {label:'Tasks',to:'/org/tasks'},{label:'Actions',to:'/org/actions'},{label:'Meetings',to:'/org/meetings'},{label:'Minutes (MoM)',to:'/org/mom'},
    {label:'Events',to:'/org/events'},{label:'Programmes',to:'/org/programmes'},{label:'Projects',to:'/org/projects'},
    {label:'Annual Plan',to:'/org/plans'},{label:'Goals',to:'/org/goals'}]},
  {title:'Hierarchy',items:[
    {label:'Parivars',to:'/org/chapters'},{label:'Parivar Coordinators',to:'/org/chapter-coordinators',minimumLevel:'REGION'},
    {label:'Regions',to:'/org/regions',minimumLevel:'REGION'},{label:'City / Cluster',to:'/org/cities',minimumLevel:'CITY'},
    {label:'States',to:'/org/states',minimumLevel:'STATE'},{label:'National',to:'/org/national',minimumLevel:'NATIONAL'},
    {label:'Management',to:'/org/management',minimumLevel:'MANAGEMENT'}]},
  {title:'Control & Support',items:[
    {label:'Support',to:'/org/support'},{label:'Escalations',to:'/org/escalations'},{label:'Exceptions',to:'/org/exceptions'},
    {label:'Risks',to:'/org/risks'},{label:'Issues',to:'/org/issues'},{label:'Decision Register',to:'/org/decisions'}]},
  {title:'Communication & Knowledge',items:[
    {label:'Communications',to:'/org/communications'},{label:'Polls',to:'/org/polls'},{label:'Surveys',to:'/org/surveys'},
    {label:'Documents & SOPs',to:'/org/documents'},{label:'Resources',to:'/org/resources'},
    {label:'Notifications',to:'/org/notifications'},{label:'Alerts',to:'/org/alerts'}]},
  {title:'Assurance & Continuity',items:[
    {label:'My Authority & Responsibilities',to:'/org/roles-access'},{label:'Availability & Delegation',to:'/org/availability'},
    {label:'Handover',to:'/org/handover'},{label:'Handoffs',to:'/org/handoffs'},{label:'Data Quality',to:'/org/data-quality'},
    {label:'Audit',to:'/org/audit'},{label:'Timeline',to:'/org/timeline'},{label:'Reports',to:'/org/reports'},{label:'Analytics',to:'/org/analytics'},
    {label:'Jobs',to:'/org/jobs'},{label:'Imports',to:'/org/imports'},{label:'Exports',to:'/org/exports'}]}
];
export const rolePriorityRoutes:Partial<Record<string,readonly string[]>>={
 LEADERSHIP_FINANCE:['/org/member-onboarding','/org/today','/org/membership-dues','/org/payment-exceptions','/org/trust-payments','/org/members','/org/reports'],
 CHAPTER_PRESIDENT:['/org/member-onboarding','/org/today','/org/action-centre','/org/mc','/org/members','/org/committees','/org/member-cases','/org/events','/org/reports'],
 CHAPTER_VICE_PRESIDENT:['/org/member-onboarding','/org/today','/org/action-centre','/org/members','/org/committees','/org/reports'],
 CHAPTER_SECRETARY:['/org/member-onboarding','/org/today','/org/action-centre','/org/meetings','/org/mom','/org/member-cases','/org/committees','/org/attendance','/org/communications'],
 CHAPTER_TREASURER:['/org/today','/org/attendance','/org/membership-dues','/org/payment-exceptions','/org/action-centre','/org/reports'],
 CHAPTER_COORDINATOR:['/org/member-onboarding','/org/today','/org/action-centre','/org/chapters','/org/support','/org/escalations','/org/reports'],
 TRUST_ADMINISTRATOR:['/org/trustee/leadership','/org/trust-payments','/org/today','/org/members','/org/reports'],
 REGION_COORDINATOR:['/org/today','/org/action-centre','/org/chapter-coordinators','/org/chapters','/org/support','/org/escalations','/org/programmes','/org/reports'],
 CITY_COORDINATOR:['/org/today','/org/action-centre','/org/regions','/org/chapters','/org/support','/org/escalations','/org/programmes','/org/reports'],
 STATE_COORDINATOR:['/org/today','/org/action-centre','/org/cities','/org/regions','/org/escalations','/org/programmes','/org/reports','/org/analytics'],
 NATIONAL_PRESIDENT:['/org/today','/org/action-centre','/org/states','/org/escalations','/org/programmes','/org/reports','/org/analytics'],
 NATIONAL_SECRETARY:['/org/today','/org/action-centre','/org/states','/org/meetings','/org/communications','/org/programmes','/org/reports'],
 NATIONAL_TREASURER:['/org/today','/org/action-centre','/org/membership-dues','/org/reports','/org/analytics'],
 MANAGEMENT_REVIEWER:['/org/today','/org/action-centre','/org/management','/org/states','/org/risks','/org/escalations','/org/reports','/org/analytics']
};
export interface NavItemState extends NavItem{locked:boolean;recommended:boolean;requiredPermission:string}
export interface NavGroupState{title:string;items:NavItemState[];recommendedCount:number}
export function navGroupsFor(level:OrgLevel,roleType:OrgRoleType|undefined,permissions:readonly string[]):NavGroupState[]{
  const isLeadership = authStorage.isLeadershipTeam();
  const isLeadershipFinance = authStorage.isLeadershipFinance();
  // Strictly Trust Secretariat / Trustee (not Leadership Finance or general Leadership Team)
  const isTrust = !isLeadershipFinance && !isLeadership && (String(roleType) === 'TRUST_ADMINISTRATOR' || authStorage.isTrustUser());

  const session = authStorage.getActiveSession();
  const effectiveRoleKey = isLeadershipFinance
    ? 'LEADERSHIP_FINANCE'
    : (session?.roleType || roleType || 'CHAPTER_SECRETARY');
  const picks = new Set(rolePriorityRoutes[effectiveRoleKey as string] ?? []);

  return navGroups.map(g=>{
    const items=g.items
      .filter(i => {
        // Position-Based Menu Visibility Rules:
        // 1. Trust Secretariat cannot access member onboarding (Leadership Finance DOES access it to verify payments)
        if (isTrust && i.to === '/org/member-onboarding') return false;
        // 2. Chapter Leaders cannot access Trust-wide Payment Verification
        if (!isTrust && !isLeadership && !isLeadershipFinance && i.to === '/org/trust-payments') return false;
        return true;
      })
      .map(i=>{
        const policy=routeAccessPolicy(i.to);
        const levelLocked=(isTrust || isLeadership || isLeadershipFinance) ? false : Boolean((i.minimumLevel??policy.minimumLevel)&&levelRank[level]<levelRank[(i.minimumLevel??policy.minimumLevel)!]);
        const permissionLocked=(isTrust || isLeadership || isLeadershipFinance) ? false : !hasPermissionId(permissions,policy.requiredPermission);
        return{...i,capability:policy.capability,requiredPermission:policy.requiredPermission,locked:levelLocked||permissionLocked,recommended:picks.has(i.to)};
      })
      .sort((a,b)=>Number(b.recommended)-Number(a.recommended)||a.label.localeCompare(b.label));
    return{title:g.title,items,recommendedCount:items.filter(i=>i.recommended&&!i.locked).length};
  }).sort((a,b)=>b.recommendedCount-a.recommendedCount||a.title.localeCompare(b.title));
}

export function priorityRoutesFor(roleType?:OrgRoleType){return rolePriorityRoutes[roleType??'CHAPTER_SECRETARY']??[]}
