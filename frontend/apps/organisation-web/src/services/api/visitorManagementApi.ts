import { env } from '@/config/env';
import { authStorage } from '@/utils/authStorage';

export interface VisitorRegistrationRow { id:string; fullName:string; businessName:string; verified:boolean; visitingDate:string; createdAt:string }
export interface VisitorRegistrationPage { items:VisitorRegistrationRow[]; total:number; page:number; pageSize:number; chapterId:string }
export interface ChapterVisitorSummary { chapterId:string; invitationsCreated:number; cancelled:number; verifiedRegistrationLinked:number; attendanceVerified:number; followUpsCreated:number }
export interface VisitorLifecycleRow {
  id:string; fullName:string; businessName:string|null; verified:boolean; createdAt:string;
  invitationReference:string|null; verifiedAttendanceCount:number; followUpCount:number;
  lastFollowUpOutcome:string|null;
}
export interface VisitorLifecyclePage {
  items:VisitorLifecycleRow[]; total:number; page:number; pageSize:number; chapterId:string;
  applicationLinkVerified:false; conversionAttributionAvailable:false;
}
export interface ReconciliationResult { invitationId:string; registrationId:string; replayed:boolean }
const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function assertGuid(value:string) { if (!guid.test(value)) throw new Error('Select a valid authorised chapter or record.'); }
async function request<T>(path:string, init:RequestInit = {}):Promise<T> {
  const token=authStorage.getToken();
  const headers:Record<string,string>={'Accept':'application/json',...(init.body?{'Content-Type':'application/json'}:{})};
  if(token) headers.Authorization=`Bearer ${token}`;
  const response=await fetch(`${env.apiBaseUrl}${path}`,{...init,headers,credentials:'include',cache:'no-store'});
  if(!response.ok){let code='';try{const body=await response.json() as {code?:string};code=body.code??''}catch{/* no JSON error */}
    throw new Error(code||`Visitor operation failed (HTTP ${response.status}).`);
  }
  return response.json() as Promise<T>;
}
export interface OfficialChapterConversion { id:string; registrationId:string; intakeId:string; memberId:string; invitationId:string; inviterMemberId:string; activatedAt:string }
export interface OfficialChapterConversionPage { total:number; page:number; pageSize:number; periodBasis:string; items:OfficialChapterConversion[] }
export const visitorManagementApi = {
  conversionHistory(chapterId:string,from:string,toExclusive:string,page=1,signal?:AbortSignal) {
    assertGuid(chapterId);
    if (!Number.isInteger(page) || page < 1) throw new Error('Invalid official conversion page.');
    const params = new URLSearchParams({chapterId,from,toExclusive,page:String(page),pageSize:'10'});
    return request<OfficialChapterConversionPage>(`/organisational/visitors/conversions/history?${params}`,{signal});
  },
  lifecycle(chapterId:string,page:number,signal?:AbortSignal) {
    assertGuid(chapterId);
    if(!Number.isInteger(page)||page<1)throw new Error('Invalid page.');
    const params=new URLSearchParams({chapterId,page:String(page),pageSize:'25'});
    return request<VisitorLifecyclePage>(`/organisational/visitors/lifecycle?${params}`,{signal});
  },
  list(chapterId:string,page:number,signal?:AbortSignal) {
    assertGuid(chapterId);
    if(!Number.isInteger(page)||page<1)throw new Error('Invalid page.');
    const params=new URLSearchParams({chapterId,page:String(page),pageSize:'25'});
    return request<VisitorRegistrationPage>(`/organisational/visitors/registrations?${params}`,{signal});
  },
  summary(chapterId:string,from:string,toExclusive:string,signal?:AbortSignal) {
    assertGuid(chapterId);
    const params=new URLSearchParams({chapterId,from,toExclusive});
    return request<ChapterVisitorSummary>(`/organisational/visitors/invitations/summary?${params}`,{signal});
  },
  linkIntake(registrationId:string,intakeId:string) {
    assertGuid(registrationId);assertGuid(intakeId);
    return request<{linkId:string;replayed:boolean;membershipActivated:boolean}>(
      '/organisational/visitors/intake-links',
      {method:'POST',body:JSON.stringify({registrationId,intakeId})});
  },
  linkedActiveMembers(chapterId:string,from:string,toExclusive:string,signal?:AbortSignal) {
    assertGuid(chapterId);
    const params=new URLSearchParams({chapterId,from,toExclusive});
    return request<{verifiedActiveLinkedMembers:number;officialConversionCredits:number;periodBasis:string;officialCreditSource:string}>(
      `/organisational/visitors/conversions?${params}`,{signal});
  },
  conversionReconciliation(chapterId:string,page=1,signal?:AbortSignal) {
    assertGuid(chapterId);
    if (!Number.isInteger(page) || page < 1) throw new Error('Invalid reconciliation page.');
    const params = new URLSearchParams({chapterId,page:String(page),pageSize:'25'});
    return request<{chapterId:string;total:number;page:number;pageSize:number;items:Array<{
      linkId:string;registrationId:string;intakeId:string;linkedAt:string;
      eligibleInvitationCount:number;reason:string
    }>;officialCreditsCreated:false;activationTimestampInferred:false}>(
      `/organisational/visitors/conversions/reconciliation?${params}`,{signal});
  },
  historicalCredit(linkId:string,invitationId:string) {
    assertGuid(linkId); assertGuid(invitationId);
    return request<{creditId:string;memberId:string;invitationId:string;activationEffectiveAt:string;reviewed:boolean}>(
      '/organisational/visitors/conversions/historical-credit',
      {method:'POST',body:JSON.stringify({linkId,invitationId})});
  },
  reconcile(invitationId:string,registrationId:string) {
    assertGuid(invitationId);assertGuid(registrationId);
    return request<ReconciliationResult>(`/organisational/visitors/invitations/${invitationId}/reconcile`,{method:'POST',body:JSON.stringify({registrationId})});
  },
  attendance(chapterId:string,signal?:AbortSignal) {
    assertGuid(chapterId);
    return request<{items:{id:string;registrationId:string;eventId:string;verifiedAt:string}[]}>(`/organisational/visitors/attendance?chapterId=${chapterId}`,{signal});
  },
  verifyAttendance(chapterId:string,registrationId:string,eventId:string) {
    [chapterId,registrationId,eventId].forEach(assertGuid);
    return request<{id?:string;replayed:boolean}>(`/organisational/visitors/attendance/verify`,{method:'POST',body:JSON.stringify({chapterId,registrationId,eventId})});
  },
  followUps(chapterId:string,signal?:AbortSignal) {
    assertGuid(chapterId);
    return request<{items:{id:string;registrationId:string;outcome:string;notes:string;createdAt:string}[]}>(`/organisational/visitors/follow-ups?chapterId=${chapterId}`,{signal});
  },
  createFollowUp(chapterId:string,registrationId:string,notes:string) {
    [chapterId,registrationId].forEach(assertGuid);
    if(!notes.trim()||notes.length>2000)throw new Error('Follow-up notes must be between 1 and 2000 characters.');
    return request<{id:string}>(`/organisational/visitors/follow-ups`,{method:'POST',body:JSON.stringify({chapterId,registrationId,notes:notes.trim()})});
  }

};
