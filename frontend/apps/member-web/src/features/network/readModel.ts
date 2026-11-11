import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

// Granular source selectors are intentional: indexes only recompute when their owning
// collection changes, instead of on every mutation anywhere in the network slice.
export const selectMembers=(s:RootState)=>s.network.members;
export const selectBusinesses=(s:RootState)=>s.network.businesses;
export const selectAffiliations=(s:RootState)=>s.network.affiliations;
export const selectConnections=(s:RootState)=>s.network.connections;
export const selectConversations=(s:RootState)=>s.network.conversations;
export const selectMessages=(s:RootState)=>s.network.messages;
export const selectOpportunities=(s:RootState)=>s.network.opportunities;
export const selectResponses=(s:RootState)=>s.network.responses;
export const selectMeetings=(s:RootState)=>s.network.meetings;
export const selectNotifications=(s:RootState)=>s.network.notifications;
export const selectAttendance=(s:RootState)=>s.network.attendance;
export const selectEvents=(s:RootState)=>s.network.events;
export const selectCertificationRecords=(s:RootState)=>s.network.certificationRecords;
export const selectTransactions=(s:RootState)=>s.network.transactions;
export const selectReferences=(s:RootState)=>s.network.references;

const entityMap=<T extends {id:string}>(rows:readonly T[])=>Object.fromEntries(rows.map(x=>[x.id,x])) as Record<string,T>;
export const selectMemberEntities=createSelector([selectMembers],entityMap);
export const selectBusinessEntities=createSelector([selectBusinesses],entityMap);
export const selectConversationEntities=createSelector([selectConversations],entityMap);
export const selectOpportunityEntities=createSelector([selectOpportunities],entityMap);
export const selectMeetingEntities=createSelector([selectMeetings],entityMap);
export const selectEventEntities=createSelector([selectEvents],entityMap);

export const selectAffiliationsByMember=createSelector([selectAffiliations],rows=>{
  const result:Record<string,typeof rows>= {};
  for(const row of rows)(result[row.memberId]??=[]).push(row);
  return result;
});
export const selectAffiliationsByBusiness=createSelector([selectAffiliations],rows=>{
  const result:Record<string,typeof rows>= {};
  for(const row of rows)(result[row.businessId]??=[]).push(row);
  return result;
});
export const selectMessagesByConversation=createSelector([selectMessages],rows=>{
  const result:Record<string,typeof rows>= {};
  for(const row of rows)(result[row.conversationId]??=[]).push(row);
  for(const group of Object.values(result))group.sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  return result;
});
export const selectResponsesByOpportunity=createSelector([selectResponses],rows=>{
  const result:Record<string,typeof rows>= {};
  for(const row of rows)(result[row.opportunityId]??=[]).push(row);
  return result;
});
export const selectNotificationsByMember=createSelector([selectNotifications],rows=>{
  const result:Record<string,typeof rows>= {};
  for(const row of rows)(result[row.memberId]??=[]).push(row);
  for(const group of Object.values(result))group.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  return result;
});
export const selectAttendanceByEvent=createSelector([selectAttendance],rows=>{
  const result:Record<string,typeof rows>= {};
  for(const row of rows)(result[row.eventId]??=[]).push(row);
  return result;
});
export const selectAttendanceByMember=createSelector([selectAttendance],rows=>{
  const result:Record<string,typeof rows>= {};
  for(const row of rows)(result[row.memberId]??=[]).push(row);
  return result;
});
export const selectConnectionsByMember=createSelector([selectConnections],rows=>{
  const result:Record<string,typeof rows>= {};
  for(const row of rows){(result[row.ownerId]??=[]).push(row);if(row.targetId!==row.ownerId)(result[row.targetId]??=[]).push(row);}
  return result;
});
export const selectMembersByChapter=createSelector([selectMembers],rows=>{
  const result:Record<string,typeof rows>= {};
  for(const row of rows)(result[row.chapter]??=[]).push(row);
  return result;
});
export const selectMeetingsByMember=createSelector([selectMeetings],rows=>{
  const result:Record<string,typeof rows>= {};
  for(const row of rows)for(const memberId of row.participantIds)(result[memberId]??=[]).push(row);
  for(const group of Object.values(result))group.sort((a,b)=>a.dateTime.localeCompare(b.dateTime));
  return result;
});

const EMPTY_LIST: any[] = [];
export const makeSelectMemberById=()=>createSelector([selectMemberEntities,(_:RootState,id:string)=>id],(entities,id)=>entities[id]);
export const makeSelectBusinessById=()=>createSelector([selectBusinessEntities,(_:RootState,id:string)=>id],(entities,id)=>entities[id]);
export const makeSelectMessagesForConversation=()=>createSelector([selectMessagesByConversation,(_:RootState,id:string)=>id],(groups,id)=>groups[id]??EMPTY_LIST);
export const makeSelectNotificationsForMember=()=>createSelector([selectNotificationsByMember,(_:RootState,id:string)=>id],(groups,id)=>groups[id]??EMPTY_LIST);
export const makeSelectAttendanceForMember=()=>createSelector([selectAttendanceByMember,(_:RootState,id:string)=>id],(groups,id)=>groups[id]??EMPTY_LIST);
export const makeSelectMeetingsForMember=()=>createSelector([selectMeetingsByMember,(_:RootState,id:string)=>id],(groups,id)=>groups[id]??EMPTY_LIST);
