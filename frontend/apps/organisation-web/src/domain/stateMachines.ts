import type {WorkStatus} from './types';

const taskTransitions:Record<WorkStatus,readonly WorkStatus[]>={
  TODO:['IN_PROGRESS','WAITING','BLOCKED','DONE'],
  IN_PROGRESS:['WAITING','BLOCKED','REVIEW','DONE'],
  WAITING:['IN_PROGRESS','BLOCKED','DONE'],
  BLOCKED:['IN_PROGRESS','WAITING'],
  REVIEW:['IN_PROGRESS','DONE'],
  DONE:[]
};

export function canTaskTransition(from:WorkStatus,to:WorkStatus){return from===to||taskTransitions[from].includes(to)}
export function canPublishMom(status:string){return !['Actions Active','Closed','Archived'].includes(status)}

export type LifecycleDomain='KYT'|'MEMBER_PRESENTATION'|'MEMBER_GROWTH'|'MEMBER_CASE'|'COMMITTEE'|'PROGRAMME'|'EVENT'|'SUPPORT'|'ESCALATION'|'EXCEPTION'|'RISK'|'ISSUE'|'COMMUNICATION'|'FEEDBACK'|'DATA_QUALITY'|'GOAL'|'HANDOFF'|'NOTIFICATION';
const transitions:Record<LifecycleDomain,Record<string,readonly string[]>>={
  KYT:{Planned:['Scheduled'],Scheduled:['In Progress','Cancelled'],['In Progress']:['Follow-up','Completed'],['Follow-up']:['Completed'],Completed:[],Cancelled:[]},
  MEMBER_PRESENTATION:{Queued:['Scheduled'],Scheduled:['Prepared','Cancelled'],Prepared:['Presented'],Presented:['Follow-up','Completed'],['Follow-up']:['Completed'],Completed:[],Cancelled:[]},
  MEMBER_GROWTH:{['Prospect Identified']:['Assigned','Contacted'],Assigned:['Contacted'],Contacted:['Interested','Lost'],Interested:['Chapter Interaction','Lost'],['Chapter Interaction']:['Application','Lost'],Application:['Eligibility Review'],['Eligibility Review']:['Classification Check','Rejected'],['Classification Check']:['Specialisation Availability'],['Specialisation Availability']:['Approved','Rejected'],Approved:['Activated'],Activated:['Onboarding'],Onboarding:['Active Member'],['Active Member']:[],Rejected:[],Lost:[]},
  MEMBER_CASE:{Open:['Assigned','Under Review'],Assigned:['Under Review','Information Required','Action Required'],['Under Review']:['Information Required','Action Required','Escalated','Resolved'],['Information Required']:['Under Review','Action Required'],['Action Required']:['Under Review','Escalated','Resolved'],Escalated:['Under Review','Resolved'],Resolved:['Closure Review','Reopened'],['Closure Review']:['Closed','Reopened'],Closed:['Reopened'],Reopened:['Assigned','Under Review']},
  COMMITTEE:{Draft:['Proposed'],Proposed:['Approved'],Approved:['Active'],Active:['Under Review','Completed'],['Under Review']:['Active','Extended','Completed'],Extended:['Active','Completed'],Completed:['Closed'],Closed:['Archived'],Archived:[]},
  PROGRAMME:{Idea:['Draft'],Draft:['Proposed'],Proposed:['Approved'],Approved:['Planned'],Planned:['Active'],Active:['At Risk','Paused','Completed'],['At Risk']:['Active','Paused','Completed'],Paused:['Active','Completed'],Completed:['Closure Review'],['Closure Review']:['Closed'],Closed:['Archived'],Archived:[]},
  EVENT:{Draft:['Planned'],Planned:['Approved'],Approved:['Published'],Published:['Registration Open'],['Registration Open']:['Registration Closed','Active'],['Registration Closed']:['Active'],Active:['Completed'],Completed:['Closure Pending'],['Closure Pending']:['Closed'],Closed:['Archived'],Archived:[]},
  SUPPORT:{Requested:['Triaged'],Triaged:['Accepted','Closed'],Accepted:['Assigned'],Assigned:['Intervention Active'],['Intervention Active']:['Awaiting Feedback','Resolved'],['Awaiting Feedback']:['Intervention Active','Resolved'],Resolved:['Closed'],Closed:[]},
  ESCALATION:{Open:['Assigned','Under Review'],Assigned:['Under Review'],['Under Review']:['Action Requested','Escalated','Intervention Active','Resolved'],['Action Requested']:['Intervention Active','Escalated'],Escalated:['Intervention Active','Resolved'],['Intervention Active']:['Resolved'],Resolved:['Closure Review','Returned'],Returned:['Under Review','Closed'],['Closure Review']:['Closed'],Closed:[]},
  EXCEPTION:{Draft:['Submitted'],Submitted:['Review'],Review:['Clarification','Approved','Conditionally Approved','Rejected'],Clarification:['Review'],Approved:['Effective'],['Conditionally Approved']:['Effective'],Effective:['Expired','Revoked','Closed'],Expired:['Closed'],Revoked:['Closed'],Rejected:['Closed'],Closed:[]},
  RISK:{Identified:['Assessed'],Assessed:['Mitigation Active','Accepted'],['Mitigation Active']:['Monitoring','Resolved'],Monitoring:['Mitigation Active','Resolved','Accepted'],Accepted:['Monitoring','Closed'],Resolved:['Closed'],Closed:[]},
  ISSUE:{Open:['Owned','Action','Escalation'],Owned:['Action','Escalation','Resolution'],Action:['Escalation','Resolution'],Escalation:['Action','Resolution'],Resolution:['Closed'],Closed:[]},
  COMMUNICATION:{Draft:['Review'],Review:['Approved'],Approved:['Scheduled','Published'],Scheduled:['Published'],Published:['Active','Expired'],Active:['Expired'],Expired:['Archived'],Archived:[]},
  FEEDBACK:{Draft:['Open'],Open:['Closed'],Closed:['Results Available'],['Results Available']:['Archived'],Archived:[]},
  DATA_QUALITY:{Detected:['Open'],Open:['Assigned','Investigating'],Assigned:['Investigating'],Investigating:['Correction Proposed'],['Correction Proposed']:['Corrected'],Corrected:['Verified'],Verified:['Closed'],Closed:[],Suppressed:['Open']},
  GOAL:{Planned:['Active','Cancelled'],Active:['At Risk','Completed','Deferred','Cancelled'],['At Risk']:['Active','Completed','Deferred','Cancelled'],Deferred:['Active','Cancelled'],Completed:[],Cancelled:[]},
  HANDOFF:{Requested:['Accepted','Rejected'],Accepted:['In Progress'],['In Progress']:['Completed','Rejected'],Completed:[],Rejected:[]},
  NOTIFICATION:{Unread:['Read','Acknowledged'],Read:['Acknowledged'],Acknowledged:[]}
};
export const allowedTransitions=(domain:LifecycleDomain,status:string)=>transitions[domain]?.[status]??[];
export const canDomainTransition=(domain:LifecycleDomain,from:string,to:string)=>from===to||allowedTransitions(domain,from).includes(to);
