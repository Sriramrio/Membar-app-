import {useLocation} from 'react-router-dom';
export interface RouteView{title:string;description?:string}
const views:Record<string,RouteView>={
  '/org/actions':{title:'Action Register',description:'Actions raised from meetings, events, decisions and member cases, with owners and due dates.'},
  '/org/mom':{title:'Minutes of Meeting',description:'Minutes, decisions and follow-through actions for each meeting.'},
  '/org/goals':{title:'Goals & Targets',description:'Goals and targets with owners, progress and review cadence.'},
  '/org/projects':{title:'Special Projects',description:'Special project operations with owners, milestones and risk.'},
  '/org/payment-exceptions':{title:'Payment Exceptions',description:'Dues that are not yet matched or paid and need reconciliation.'},
  '/org/polls':{title:'Polls',description:'Advisory polls. Outcomes stay advisory until converted into a governed decision.'},
  '/org/surveys':{title:'Surveys & Feedback',description:'Surveys and feedback collected from members and volunteers.'},
  '/org/imports':{title:'Imports',description:'Bulk import jobs with progress, reconciliation and audit.'},
  '/org/exports':{title:'Exports',description:'Bulk export jobs with progress, reconciliation and audit.'},
  '/org/resources':{title:'Operational Resources',description:'Controlled operational references, templates and SOPs.'},
  '/org/analytics':{title:'Analytics & Operational Intelligence',description:'Metrics that drill down to source evidence.'},
  '/org/networking':{title:'Networking Operations',description:'Connections, one-to-ones, references and participation support.'},
  '/org/availability':{title:'Availability & Delegation',description:'Volunteer availability, temporary absence, leave and delegation of cover.'},
  '/org/delegations':{title:'Availability & Delegation',description:'Volunteer availability, temporary absence, leave and delegation of cover.'},
  '/org/handover':{title:'Handover Continuity',description:'Handover so work survives role changes.'},
  '/org/timeline':{title:'Operational Timeline',description:'Chronological trail of what happened and who did it.'}
};
export function useRouteView(defaultTitle:string,defaultDescription?:string){
  const {pathname}=useLocation();
  const key=pathname.replace(/\/+$/,'');
  const v=views[key];
  return {path:key,title:v?.title??defaultTitle,description:v?.description??defaultDescription};
}
