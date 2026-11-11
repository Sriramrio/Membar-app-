import type { RootState } from '@/app/store';
export type { VisitorApplication } from './operationalTypes';
export { saveVisitorDraft,submitVisitorRegistration,verifyVisitorEmail,setVisitorStatus,updateDueDiligenceCheck,recommendVisitor,decideVisitor,linkActivatedMember,removeImportedVisitors } from './platformRuntimeSlice';
export const selectVisitors=(s:RootState)=>s.platformRuntime.visitorOnboarding.applications;
export const selectVisitorById=(id:string)=>(s:RootState)=>s.platformRuntime.visitorOnboarding.applications.find(v=>v.id===id);
