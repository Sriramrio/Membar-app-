import type { RootState } from '@/app/store';
import type { AccountAssignment } from '@/types/common';
import type { DashboardPeriodKey } from '@/features/member/dashboard/types';
import { inPeriod, resolveDashboardPeriod } from '@/features/member/dashboard/period';
import { affiliatedBusinessIdsForMember } from '@/features/network/selectors';

export type AnalyticsDirection='initiated'|'received'|'all';
export interface AnalyticsCount { code:string; label:string; value:number; route:string; description:string; }
export interface PersonalNetworkingAnalytics {
 period:ReturnType<typeof resolveDashboardPeriod>;
 relationships:{connections:AnalyticsCount[];meetings:AnalyticsCount[];references:AnalyticsCount[]};
 business:{opportunities:AnalyticsCount[];outcomes:AnalyticsCount[];totalOutcomeValue:number};
 participation:{eventsAttended:number;upcomingEvents:number};
 pendingTotal:number;
}
export type OrganisationLevel='Chapter'|'City'|'Region'|'State'|'National';
export interface OrganisationAnalytics {
 unitName:string;level:OrganisationLevel;memberCount:number;businessCount:number;
 connections:number;meetingsInitiated:number;meetingsCompleted:number;referencesGiven:number;referencesReceived:number;
 opportunitiesCreated:number;responsesSubmitted:number;outcomes:number;outcomeValue:number;events:number;attendance:number;pending:number;
 period:ReturnType<typeof resolveDashboardPeriod>;
}
const uniq=<T extends {id:string}>(rows:T[])=>[...new Map(rows.map(x=>[x.id,x])).values()];
const activeTxStatuses=new Set(['proposed','contacted','discussion','proposal','negotiation','correction-requested','disputed']);
const responsePendingStatuses=new Set(['draft','submitted','discussion','shortlisted']);
function route(path:string,params:Record<string,string>){const q=new URLSearchParams(params);return `${path}?${q.toString()}`;}

export function buildPersonalNetworkingAnalytics(state:RootState,memberId:string,periodKey:DashboardPeriodKey='month'):PersonalNetworkingAnalytics{
 const n=state.network;const period=resolveDashboardPeriod(periodKey);const account=state.auth.account;
 const member=(n.members ?? []).find(m=>m.id===memberId)||(account?{id:memberId,name:account.name||'Member',designation:account.role||'Member',chapter:account.baseChapter||'Chennai Chapter',city:'Chennai',region:'Tamil Nadu',state:'Tamil Nadu',country:'India',bio:'',expertise:[],email:account.email||'',phone:account.phone||'',avatarText:(account.name||'M').slice(0,2).toUpperCase(),profileCompleteness:85,status:'active' as const,verificationStatus:'verified' as const}:undefined);
 if(!member) {
  return {
   period,
   relationships: {
    connections: [
     {code:'connections.initiated',label:'Initiated',value:0,route:route('/app/connections',{status:'sent'}),description:'Connection requests initiated by you.'},
     {code:'connections.received',label:'Received',value:0,route:route('/app/connections',{status:'received'}),description:'Connection requests directed to you.'},
     {code:'connections.connected',label:'Connected',value:0,route:route('/app/connections',{status:'connected'}),description:'Current accepted relationships.'},
     {code:'connections.pending',label:'Pending',value:0,route:route('/app/connections',{status:'received'}),description:'Connection requests still awaiting action.'},
    ],
    meetings: [
     {code:'meetings.initiated',label:'Initiated',value:0,route:route('/app/one-to-one',{view:'all',direction:'initiated',period:period.key}),description:'One-to-One meetings initiated by you.'},
     {code:'meetings.received',label:'Received',value:0,route:route('/app/one-to-one',{view:'all',direction:'received',period:period.key}),description:'One-to-One meeting requests received by you.'},
     {code:'meetings.upcoming',label:'Upcoming',value:0,route:route('/app/one-to-one',{view:'upcoming'}),description:'Upcoming or proposed One-to-Ones.'},
     {code:'meetings.completed',label:'Completed',value:0,route:route('/app/one-to-one',{view:'completed',status:'completed',period:period.key}),description:'Completed One-to-One meetings.'},
     {code:'meetings.pending',label:'Pending Response',value:0,route:route('/app/one-to-one',{status:'pending-response'}),description:'Meeting requests waiting for your response.'},
     {code:'meetings.followup',label:'Follow-Up Needed',value:0,route:route('/app/one-to-one',{view:'completed',status:'follow-up',period:period.key}),description:'Completed meetings without follow-up.'},
     {code:'meetings.outcome',label:'Outcome Recorded',value:0,route:route('/app/one-to-one',{view:'completed',status:'outcome-recorded',period:period.key}),description:'Completed meetings with an outcome recorded.'},
    ],
    references: [
     {code:'references.given',label:'Given',value:0,route:route('/app/references',{tab:'given',period:period.key}),description:'References created by you.'},
     {code:'references.received',label:'Received',value:0,route:route('/app/references',{tab:'received',period:period.key}),description:'References received by you.'},
     {code:'references.pending',label:'Pending',value:0,route:route('/app/references',{tab:'received',status:'pending'}),description:'References requiring acknowledgement or progression.'},
    ]
   },
   business: {
    opportunities: [
     {code:'opportunities.created',label:'Created',value:0,route:route('/app/opportunities/my',{period:period.key}),description:'Opportunities created by you.'},
     {code:'opportunities.relevant',label:'Received / Relevant',value:0,route:route('/app/opportunities',{scope:'network'}),description:'Open opportunities currently relevant in your permitted network.'},
     {code:'opportunities.responded',label:'Responded',value:0,route:route('/app/responses/my',{period:period.key}),description:'Unique opportunities you responded to.'},
     {code:'opportunities.pending',label:'Pending',value:0,route:route('/app/responses/my',{status:'submitted'}),description:'Responses still progressing.'},
     {code:'opportunities.outcome',label:'With Outcome',value:0,route:route('/app/transactions',{source:'opportunity'}),description:'Your opportunities with linked business outcomes.'},
    ],
    outcomes: [
     {code:'outcomes.recorded',label:'Recorded',value:0,route:route('/app/transactions',{direction:'recorded',period:period.key}),description:'Business outcomes recorded by you.'},
     {code:'outcomes.received',label:'Received / Attributed',value:0,route:route('/app/transactions',{direction:'received',period:period.key}),description:'Outcomes attributed to one of your businesses.'},
     {code:'outcomes.pending',label:'Pending',value:0,route:route('/app/transactions',{status:'active'}),description:'Business outcomes still in progress or awaiting closure.'},
     {code:'outcomes.won',label:'Won / Confirmed',value:0,route:route('/app/transactions',{status:'won',period:period.key}),description:'Outcomes that reached a positive confirmed state.'},
    ],
    totalOutcomeValue: 0
   },
   participation: { eventsAttended: 0, upcomingEvents: 0 },
   pendingTotal: 0
  };
 }
 const connections=(n.connections ?? []).filter(c=>c.ownerId===memberId||c.targetId===memberId);
 const meetings=(n.meetings ?? []).filter(m=>(m.participantIds ?? []).includes(memberId));
 const refs=(n.references ?? []).filter(r=>r.fromMemberId===memberId||r.toMemberId===memberId);
 const ownOpp=(n.opportunities ?? []).filter(o=>o.ownerMemberId===memberId);const ownOppIds=new Set(ownOpp.map(o=>o.id));
 const relevantOpp=(n.opportunities ?? []).filter(o=>o.ownerMemberId!==memberId&&o.status==='open'&&(o.visibility==='network'||(o.visibility==='chapter'&&(n.members ?? []).find(m=>m.id===o.ownerMemberId)?.chapter===member.chapter)||(o.visibility==='regional'&&(n.members ?? []).find(m=>m.id===o.ownerMemberId)?.region===member.region)));
 const responses=(n.responses ?? []).filter(r=>r.memberId===memberId);const responseOppIds=new Set(responses.filter(r=>r.status!=='draft').map(r=>r.opportunityId));
 const businessIds=new Set(affiliatedBusinessIdsForMember(n,memberId));
 const tx=(n.transactions ?? []).filter(t=>t.memberId===memberId||businessIds.has(t.buyerBusinessId)||businessIds.has(t.counterpartyBusinessId));
 const events=n.events ?? [];const attendance=(n.attendance ?? []).filter(a=>a.memberId===memberId);
 const createdIn=<T,>(rows:T[],date:(x:T)=>string|undefined)=>rows.filter(x=>inPeriod(date(x),period));
 const completedMeetings=meetings.filter(m=>m.status==='completed'&&inPeriod(m.dateTime,period));
 const pendingResponse=meetings.filter(m=>m.recipientId===memberId&&['proposed','alternate-proposed'].includes(m.status));
 const upcoming=meetings.filter(m=>['confirmed','proposed','alternate-proposed'].includes(m.status));
 const followUpRequired=completedMeetings.filter(m=>!m.followUp?.trim());const noOutcome=completedMeetings.filter(m=>!m.outcome?.trim());
 const pendingRefs=refs.filter(r=>r.toMemberId===memberId&&['Sent','Acknowledged','In Progress'].includes(r.status??'Sent'));
 const pendingOppResponses=responses.filter(r=>responsePendingStatuses.has(r.status));
 const pendingOutcomes=tx.filter(t=>activeTxStatuses.has(t.status));
 const opportunityWithOutcome=new Set(tx.map(t=>t.opportunityId).filter(Boolean) as string[]);
 const outcomeRows=createdIn(tx,x=>x.createdAt);const ownOutcomes=outcomeRows.filter(t=>t.memberId===memberId);const receivedOutcomes=outcomeRows.filter(t=>t.memberId!==memberId&&(businessIds.has(t.buyerBusinessId)||businessIds.has(t.counterpartyBusinessId)));
 const eventById=new Map(events.map(e=>[e.id,e]));const attended=attendance.filter(a=>a.status==='present'&&inPeriod(eventById.get(a.eventId)?.dateTime,period)).length;
 const upcomingEvents=events.filter(e=>e.dateTime>=new Date().toISOString()&&((e.attendeeIds ?? []).includes(memberId)||(e.waitlistIds ?? []).includes(memberId))).length;
 return{period,relationships:{
  connections:[
   {code:'connections.initiated',label:'Initiated',value:createdIn(connections.filter(c=>c.ownerId===memberId),x=>x.updatedAt).length,route:route('/app/connections',{status:'sent'}),description:'Connection requests initiated by you.'},
   {code:'connections.received',label:'Received',value:createdIn(connections.filter(c=>c.targetId===memberId),x=>x.updatedAt).length,route:route('/app/connections',{status:'received'}),description:'Connection requests directed to you.'},
   {code:'connections.connected',label:'Connected',value:connections.filter(c=>c.status==='connected').length,route:route('/app/connections',{status:'connected'}),description:'Current accepted relationships.'},
   {code:'connections.pending',label:'Pending',value:connections.filter(c=>(c.ownerId===memberId&&c.status==='sent')||(c.targetId===memberId&&c.status==='sent')).length,route:route('/app/connections',{status:'received'}),description:'Connection requests still awaiting action.'},
  ],meetings:[
   {code:'meetings.initiated',label:'Initiated',value:createdIn(meetings.filter(m=>m.requesterId===memberId),x=>x.dateTime).length,route:route('/app/one-to-one',{view:'all',direction:'initiated',period:period.key}),description:'One-to-One meetings initiated by you.'},
   {code:'meetings.received',label:'Received',value:createdIn(meetings.filter(m=>m.recipientId===memberId),x=>x.dateTime).length,route:route('/app/one-to-one',{view:'all',direction:'received',period:period.key}),description:'One-to-One meeting requests received by you.'},
   {code:'meetings.upcoming',label:'Upcoming',value:upcoming.length,route:route('/app/one-to-one',{view:'upcoming'}),description:'Upcoming or proposed One-to-Ones.'},
   {code:'meetings.completed',label:'Completed',value:completedMeetings.length,route:route('/app/one-to-one',{view:'completed',status:'completed',period:period.key}),description:'Completed One-to-One meetings.'},
   {code:'meetings.pending',label:'Pending Response',value:pendingResponse.length,route:route('/app/one-to-one',{status:'pending-response'}),description:'Meeting requests waiting for your response.'},
   {code:'meetings.followup',label:'Follow-Up Needed',value:followUpRequired.length,route:route('/app/one-to-one',{view:'completed',status:'follow-up',period:period.key}),description:'Completed meetings without follow-up.'},
   {code:'meetings.outcome',label:'Outcome Recorded',value:completedMeetings.length-noOutcome.length,route:route('/app/one-to-one',{view:'completed',status:'outcome-recorded',period:period.key}),description:'Completed meetings with an outcome recorded.'},
  ],references:[
   {code:'references.given',label:'Given',value:createdIn(refs.filter(r=>r.fromMemberId===memberId),x=>x.createdAt).length,route:route('/app/references',{tab:'given',period:period.key}),description:'References created by you.'},
   {code:'references.received',label:'Received',value:createdIn(refs.filter(r=>r.toMemberId===memberId),x=>x.createdAt).length,route:route('/app/references',{tab:'received',period:period.key}),description:'References received by you.'},
   {code:'references.pending',label:'Pending',value:pendingRefs.length,route:route('/app/references',{tab:'received',status:'pending'}),description:'References requiring acknowledgement or progression.'},
  ]},business:{opportunities:[
   {code:'opportunities.created',label:'Created',value:createdIn(ownOpp,x=>x.createdAt).length,route:route('/app/opportunities/my',{period:period.key}),description:'Opportunities created by you.'},
   {code:'opportunities.relevant',label:'Received / Relevant',value:relevantOpp.length,route:route('/app/opportunities',{scope:'network'}),description:'Open opportunities currently relevant in your permitted network.'},
   {code:'opportunities.responded',label:'Responded',value:responseOppIds.size,route:route('/app/responses/my',{period:period.key}),description:'Unique opportunities you responded to.'},
   {code:'opportunities.pending',label:'Pending',value:pendingOppResponses.length,route:route('/app/responses/my',{status:'submitted'}),description:'Responses still progressing.'},
   {code:'opportunities.outcome',label:'With Outcome',value:ownOpp.filter(o=>opportunityWithOutcome.has(o.id)).length,route:route('/app/transactions',{source:'opportunity'}),description:'Your opportunities with linked business outcomes.'},
  ],outcomes:[
   {code:'outcomes.recorded',label:'Recorded',value:ownOutcomes.length,route:route('/app/transactions',{direction:'recorded',period:period.key}),description:'Business outcomes recorded by you.'},
   {code:'outcomes.received',label:'Received / Attributed',value:receivedOutcomes.length,route:route('/app/transactions',{direction:'received',period:period.key}),description:'Outcomes attributed to one of your businesses.'},
   {code:'outcomes.pending',label:'Pending',value:pendingOutcomes.length,route:route('/app/transactions',{status:'active'}),description:'Business outcomes still in progress or awaiting closure.'},
   {code:'outcomes.won',label:'Won / Confirmed',value:outcomeRows.filter(t=>['won','confirmed','closed'].includes(t.status)).length,route:route('/app/transactions',{status:'won',period:period.key}),description:'Outcomes that reached a positive confirmed state.'},
  ],totalOutcomeValue:outcomeRows.filter(t=>['won','confirmed','closed'].includes(t.status)).reduce((sum,t)=>sum+(t.value??0),0)},participation:{eventsAttended:attended,upcomingEvents},pendingTotal:pendingResponse.length+followUpRequired.length+pendingRefs.length+pendingOppResponses.length+pendingOutcomes.length};
}

function unitMembers(state:RootState,unitName:string,level:OrganisationLevel){const rows=state.network.members.filter(m=>m.status!=='suspended'&&m.status!=='expired');if(level==='National')return rows;if(level==='State')return rows.filter(m=>m.state===unitName);if(level==='Region')return rows.filter(m=>m.region===unitName);if(level==='City')return rows.filter(m=>m.city===unitName);return rows.filter(m=>m.chapter===unitName);}
export function buildOrganisationAnalytics(state:RootState,unitName:string,level:OrganisationLevel,periodKey:DashboardPeriodKey='month'):OrganisationAnalytics{
 const n=state.network;const period=resolveDashboardPeriod(periodKey);const members=unitMembers(state,unitName,level);const ids=new Set(members.map(m=>m.id));const businesses=n.businesses.filter(b=>level==='National'||(level==='State'?b.state===unitName:level==='Region'?b.region===unitName:level==='City'?b.city===unitName:b.chapter===unitName));const businessIds=new Set(businesses.map(b=>b.id));
 const connections=uniq(n.connections.filter(c=>(ids.has(c.ownerId)||ids.has(c.targetId))&&c.status==='connected'&&inPeriod(c.updatedAt,period)));
 const meetings=uniq(n.meetings.filter(m=>m.participantIds.some(id=>ids.has(id))&&inPeriod(m.dateTime,period)));
 const refs=uniq(n.references.filter(r=>(ids.has(r.fromMemberId)||ids.has(r.toMemberId))&&inPeriod(r.createdAt,period)));
 const opp=uniq(n.opportunities.filter(o=>ids.has(o.ownerMemberId)&&inPeriod(o.createdAt,period)));const oppIds=new Set(opp.map(o=>o.id));
 const responses=uniq(n.responses.filter(r=>(ids.has(r.memberId)||oppIds.has(r.opportunityId))&&inPeriod(r.createdAt,period)));
 const tx=uniq(n.transactions.filter(t=>(ids.has(t.memberId)||businessIds.has(t.buyerBusinessId)||businessIds.has(t.counterpartyBusinessId))&&inPeriod(t.createdAt,period)));
 const eventRows=n.events.filter(e=>level==='National'||(level==='State'?e.state===unitName:level==='Region'?e.region===unitName:level==='City'?e.city===unitName:e.chapter===unitName)).filter(e=>inPeriod(e.dateTime,period));const eventIds=new Set(eventRows.map(e=>e.id));const attendance=n.attendance.filter(a=>ids.has(a.memberId)&&eventIds.has(a.eventId)&&a.status==='present');
 const pendingMeetings=n.meetings.filter(m=>m.recipientId&&ids.has(m.recipientId)&&['proposed','alternate-proposed'].includes(m.status)).length;const pendingRefs=n.references.filter(r=>ids.has(r.toMemberId)&&['Sent','Acknowledged','In Progress'].includes(r.status??'Sent')).length;const pendingTx=n.transactions.filter(t=>(ids.has(t.memberId)||businessIds.has(t.buyerBusinessId)||businessIds.has(t.counterpartyBusinessId))&&activeTxStatuses.has(t.status)).length;
 return{unitName,level,memberCount:members.length,businessCount:businesses.length,connections:connections.length,meetingsInitiated:meetings.filter(m=>m.requesterId&&ids.has(m.requesterId)).length,meetingsCompleted:meetings.filter(m=>m.status==='completed').length,referencesGiven:refs.filter(r=>ids.has(r.fromMemberId)).length,referencesReceived:refs.filter(r=>ids.has(r.toMemberId)).length,opportunitiesCreated:opp.length,responsesSubmitted:responses.filter(r=>r.status!=='draft').length,outcomes:tx.length,outcomeValue:tx.filter(t=>['won','confirmed','closed'].includes(t.status)).reduce((s,t)=>s+(t.value??0),0),events:eventRows.length,attendance:attendance.length,pending:pendingMeetings+pendingRefs+pendingTx,period};
}
export function authorisedOrganisationAssignment(state:RootState):AccountAssignment|undefined{const account=state.auth.account;if(!account)return undefined;const today=new Date().toISOString().slice(0,10);const ranked:{[K in AccountAssignment['unitType']]:number}={Chapter:1,City:2,Region:3,State:4,National:5,Platform:0};return [...(account.assignments??[])].filter(a=>a.status==='Active'&&a.workspace!=='Member'&&a.startsAt<=today&&a.endsAt>=today&&a.unitType!=='Platform').sort((a,b)=>ranked[b.unitType]-ranked[a.unitType])[0];}
