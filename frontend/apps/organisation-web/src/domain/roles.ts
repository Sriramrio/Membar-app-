import type {OrgRoleType,OperationalResponsibilityType} from './types';

/** Presentation-only labels. Formal organisational office authority is backend/Platform-Admin governed. */
const roleLabels:Readonly<Record<OrgRoleType,string>>={
 CHAPTER_PRESIDENT:'Chapter President',CHAPTER_VICE_PRESIDENT:'Chapter Vice President',CHAPTER_SECRETARY:'Chapter Secretary',CHAPTER_TREASURER:'Chapter Treasurer',CHAPTER_COORDINATOR:'Chapter Coordinator',
 REGION_COORDINATOR:'Region Coordinator',CITY_COORDINATOR:'City Coordinator',STATE_COORDINATOR:'State Coordinator',NATIONAL_PRESIDENT:'National President',
 NATIONAL_SECRETARY:'National Secretary',NATIONAL_TREASURER:'National Treasurer',MANAGEMENT_REVIEWER:'Management Reviewer'
};
const responsibilityLabels:Readonly<Record<OperationalResponsibilityType,string>>={
 COMMITTEE_CONVENER:'Working Committee Convener',COMMITTEE_MEMBER:'Working Committee Member',EVENT_LEAD:'Event Lead',KYT_LEAD:'KYT Lead',ATTENDANCE_LEAD:'Attendance Lead',
 MEETING_COORDINATOR:'Meeting Coordinator',MEMBER_GROWTH_LEAD:'Member Growth Lead',PROGRAMME_OWNER:'Programme Owner'
};
export function roleLabel(roleType?:string){return roleType&&roleType in roleLabels?roleLabels[roleType as OrgRoleType]:roleType??'No active organisational office'}
export function responsibilityLabel(type:OperationalResponsibilityType){return responsibilityLabels[type]}
