import { screenById } from '@/config/screenCatalog';

export interface JourneyStep { screenId:number; label?:string; }
export interface JourneyDefinition { id:string; title:string; outcome:string; steps:JourneyStep[]; }

export const priorityJourneys:JourneyDefinition[] = [
  { id:'visitor-member', title:'Visitor → active member', outcome:'Register, verify, onboard, reconcile dues and activate membership.', steps:[{screenId:46},{screenId:47},{screenId:50},{screenId:35},{screenId:2}] },
  { id:'discover-value', title:'Discover → connect → business value', outcome:'Discover a relevant member, connect, converse, meet, refer, confirm an outcome and recognise support.', steps:[{screenId:3},{screenId:5},{screenId:9},{screenId:21},{screenId:13},{screenId:11},{screenId:12},{screenId:14}] },
  { id:'opportunity', title:'Opportunity → response → transaction', outcome:'Publish a governed business need, receive a private response and progress it into a confirmed transaction.', steps:[{screenId:15},{screenId:16},{screenId:17},{screenId:20},{screenId:19},{screenId:10},{screenId:12}] },
  { id:'meeting-attendance', title:'Meeting → poll → final attendance', outcome:'Create a meeting, collect attendance intent, reconcile attendance and expose the final member record.', steps:[{screenId:48},{screenId:25},{screenId:49},{screenId:36}] },
  { id:'payments', title:'Payment → import → reconciliation → receipt', outcome:'Stage payment data, validate and reconcile it, checker-approve posting and expose the member receipt state.', steps:[{screenId:37},{screenId:73},{screenId:50},{screenId:78}] },
  { id:'content-event', title:'Announcement / event / gallery publication', outcome:'Author scoped content, review, publish, participate and preserve lifecycle history.', steps:[{screenId:51},{screenId:23},{screenId:52},{screenId:26},{screenId:53},{screenId:27}] },
  { id:'promotion', title:'Promotion approval and delivery', outcome:'Configure placement and scope, complete commercial/creative approvals and review delivery.', steps:[{screenId:77},{screenId:54},{screenId:55}] },
  { id:'governance-tenure', title:'Governance decision → role tenure → history', outcome:'Record a governed decision, appointment, effective tenure, handover and historical accountability.', steps:[{screenId:57},{screenId:62},{screenId:67},{screenId:63}] },
  { id:'policy-control', title:'Policy → RBAC / RACI → workflow → audit', outcome:'Configure policy controls, simulate access, bind workflow responsibility and verify immutable audit evidence.', steps:[{screenId:60},{screenId:68},{screenId:69},{screenId:70},{screenId:78}] },
  { id:'platform-quality', title:'Platform integration → moderation → data quality', outcome:'Operate platform integrations, notifications, moderation and quality without granting business approval authority.', steps:[{screenId:74},{screenId:76},{screenId:75},{screenId:79},{screenId:64}] },
];

const workspaceFallbacks:Record<string,JourneyDefinition> = {
  Workspace:{id:'workspace-routing',title:'Workspace routing',outcome:'Resolve current portal, role, unit and effective period.',steps:[{screenId:1},{screenId:2},{screenId:43},{screenId:56},{screenId:64}]},
  Member:{id:'member-daily',title:'Member daily experience',outcome:'Discover, connect, exchange value, participate and manage own records.',steps:Array.from({length:41},(_,i)=>({screenId:i+2}))},
  Management:{id:'organisation-operations',title:'Organisation operations',outcome:'Operate membership, visitors, meetings, attendance, payments, content and reports.',steps:Array.from({length:13},(_,i)=>({screenId:i+43}))},
  Governance:{id:'governance-cycle',title:'Management & Board governance',outcome:'Govern decisions, strategy, policies, exceptions and tenure.',steps:Array.from({length:8},(_,i)=>({screenId:i+56}))},
  'Platform Admin':{id:'platform-admin-cycle',title:'Platform administration',outcome:'Configure identity, hierarchy, access, workflows, integrations, audit and data quality.',steps:Array.from({length:17},(_,i)=>({screenId:i+64}))},
};

export function journeyForScreen(screenId:number,workspace:string):JourneyDefinition{
  return priorityJourneys.find(j=>j.steps.some(step=>step.screenId===screenId)) ?? workspaceFallbacks[workspace] ?? workspaceFallbacks.Member;
}

export function routeForScreenId(screenId:number):string{
  const screen=screenById.get(screenId);
  if(!screen)return '/workspace';
  return screen.route
    .replace(':slug','manufacturing-connect')
    .replace(':conversationId','conv-1001')
    .replace(':id', screenId===5?'m-1047':screenId===6?'b-1008':screenId===17?'op-401':screenId===25?'mtg-2409':screenId===26?'evt-2026-01':'demo-001');
}
