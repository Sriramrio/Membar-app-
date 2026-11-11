import { useCallback, useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { useOrg } from '@/state/OrgStore';
import { PageHeader } from '@/components/PageHeader';
import { visitorManagementApi, type VisitorRegistrationPage, type VisitorLifecyclePage, type ChapterVisitorSummary } from '@/services/api/visitorManagementApi';

function message(error:unknown){return error instanceof Error?error.message:'The visitor service is unavailable.'}
function monthPeriod(){const now=new Date();return {from:new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)).toISOString(),toExclusive:now.toISOString()}}
export default function VisitorManagementPage(){
  const {scope}=useOrg();
  const chapterId=scope.level==='CHAPTER'?scope.id:'';
  const [page,setPage]=useState(1);
  const [listing,setListing]=useState<VisitorRegistrationPage|null>(null);
  const [summary,setSummary]=useState<ChapterVisitorSummary|null>(null);
  const [lifecycle,setLifecycle]=useState<VisitorLifecyclePage|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [invitationId,setInvitationId]=useState('');
  const [registrationId,setRegistrationId]=useState('');
  const [saving,setSaving]=useState(false);
  const [intakeId,setIntakeId]=useState('');
  const [intakeRegistrationId,setIntakeRegistrationId]=useState('');
  const [linkedActive,setLinkedActive]=useState<number|null>(null);
  const [attendance,setAttendance]=useState<{registrationId:string;eventId:string;verifiedAt:string}[]>([]);
  const [followUps,setFollowUps]=useState<{id:string;registrationId:string;notes:string;outcome:string}[]>([]);
  const [eventId,setEventId]=useState('');
  const [selectedRegistration,setSelectedRegistration]=useState('');
  const [notes,setNotes]=useState('');
  const refresh=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);setError('');setListing(null);setSummary(null);setLifecycle(null);setLinkedActive(null);
    try{
      if(!chapterId)return;
      const period=monthPeriod();
      const [rows,totals,attend,follow,life,linked]=await Promise.all([
        visitorManagementApi.list(chapterId,page,signal),
        visitorManagementApi.summary(chapterId,period.from,period.toExclusive,signal),
        visitorManagementApi.attendance(chapterId,signal),
        visitorManagementApi.followUps(chapterId,signal),
        visitorManagementApi.lifecycle(chapterId,page,signal),
        visitorManagementApi.linkedActiveMembers(chapterId,period.from,period.toExclusive,signal)
      ]);
      if(!signal?.aborted){setListing(rows);setSummary(totals);setAttendance(attend.items);setFollowUps(follow.items);setLifecycle(life);setLinkedActive(linked.verifiedActiveLinkedMembers)}
    }catch(e){if(!signal?.aborted)setError(message(e))}
    finally{if(!signal?.aborted)setLoading(false)}
  },[chapterId,page]);
  useEffect(()=>{setPage(1);setListing(null);setSummary(null);setLifecycle(null);setAttendance([]);setFollowUps([]);setNotice('')},[chapterId]);
  useEffect(()=>{const ctl=new AbortController();void refresh(ctl.signal);return()=>ctl.abort()},[refresh]);
  async function reconcile(event:FormEvent){
    event.preventDefault();if(saving||!chapterId)return;
    setSaving(true);setError('');setNotice('');
    try{
      const result=await visitorManagementApi.reconcile(invitationId.trim(),registrationId.trim());
      setNotice(result.replayed?'This registration is already linked to the invitation.':'Invitation was linked to the verified registration.');
      setInvitationId('');setRegistrationId('');await refresh();
    }catch(e){setError(message(e))}finally{setSaving(false)}
  }
  async function linkToIntake(event:FormEvent){
    event.preventDefault();if(saving||!chapterId)return;
    setSaving(true);setError('');setNotice('');
    try {
      const response=await visitorManagementApi.linkIntake(intakeRegistrationId.trim(),intakeId.trim());
      setNotice(response.replayed?'This verified visitor is already linked to that governed application.':'Verified visitor was linked to the existing governed intake. No membership was activated.');
      setIntakeRegistrationId('');setIntakeId('');await refresh();
    }catch(e){setError(message(e))}finally{setSaving(false)}
  }
  async function attendanceSubmit(event:FormEvent){
    event.preventDefault();if(saving||!chapterId)return;
    setSaving(true);setError('');setNotice('');
    try {await visitorManagementApi.verifyAttendance(chapterId,selectedRegistration.trim(),eventId.trim());
      setNotice('Event attendance confirmed by the server.');setEventId('');await refresh();}
    catch(e){setError(message(e))}finally{setSaving(false)}
  }
  async function followUpSubmit(event:FormEvent){
    event.preventDefault();if(saving||!chapterId)return;
    setSaving(true);setError('');setNotice('');
    try {await visitorManagementApi.createFollowUp(chapterId,selectedRegistration.trim(),notes);
      setNotice('Follow-up recorded by the server.');setNotes('');await refresh();}
    catch(e){setError(message(e))}finally{setSaving(false)}
  }
  return <div className="space-y-5">
    <PageHeader title="Athithi Management" eyebrow="Athithis">Verified chapter registrations and member-invitation reconciliation</PageHeader>
    {!chapterId?<div role="status" className="rounded-lg border p-4">Select an authorised Parivar scope to view its Athithis. No chapter is selected automatically.</div>:<>
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold">Current month · Invitation activity (UTC)</h2>
        {summary?<div className="mt-3 grid gap-3 sm:grid-cols-5">
          <div><strong className="text-xl">{summary.invitationsCreated}</strong><p>Invitations created</p></div>
          <div><strong className="text-xl">{summary.cancelled}</strong><p>Cancelled</p></div>
          <div><strong className="text-xl">{summary.verifiedRegistrationLinked}</strong><p>Linked registrations</p></div>
          <div><strong className="text-xl">{summary.attendanceVerified}</strong><p>Verified attendance</p></div>
          <div><strong className="text-xl">{summary.followUpsCreated}</strong><p>Follow-ups created</p></div>
        </div>:<p className="mt-2 text-sm">{loading?'Loading current totals…':'No summary available.'}</p>}
        <p className="mt-2 text-sm">These are stored invitation counts, not verified attendance or membership conversions.</p>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Verified invitation attribution</h2>
        <p className="mb-3 text-sm">Use only when the Athithi registration has been verified. The backend enforces chapter, tenant and contact matching.</p>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={reconcile}>
          <label className="text-sm">Invitation ID<input required className="mt-1 w-full rounded border p-2" value={invitationId} onChange={(e: ChangeEvent<HTMLInputElement>)=>setInvitationId(e.target.value)} /></label>
          <label className="text-sm">Registration ID<input required className="mt-1 w-full rounded border p-2" value={registrationId} onChange={(e: ChangeEvent<HTMLInputElement>)=>setRegistrationId(e.target.value)} /></label>
          <button disabled={saving} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" type="submit">{saving?'Reconciling…':'Reconcile verified registration'}</button>
        </form>
      </div>
      <div className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">Verified Athithi → governed membership application</h2>
        <p className="text-sm">Link only a verified Athithi to an existing MemberIntake application with the same chapter and a verified applicant contact. This action does not approve or activate membership.</p>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={linkToIntake}>
          <label className="text-sm">Verified Athithi registration ID<input required className="mt-1 w-full rounded border p-2" value={intakeRegistrationId} onChange={(e: ChangeEvent<HTMLInputElement>)=>setIntakeRegistrationId(e.target.value)}/></label>
          <label className="text-sm">Governed MemberIntake ID<input required className="mt-1 w-full rounded border p-2" value={intakeId} onChange={(e: ChangeEvent<HTMLInputElement>)=>setIntakeId(e.target.value)}/></label>
          <button disabled={saving} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{saving?'Linking…':'Link verified application'}</button>
        </form>
        <p className="text-sm">Current month: {linkedActive===null?'Unavailable':linkedActive} linked intake records with an active canonical Member. Counted by link date, not activation date. Official conversion attribution is not yet certified.</p>
      </div>
      <div className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">Attendance and Athithi follow-up</h2>
        <p className="text-sm">Attendance requires an existing verified registration and a published event in this chapter. The event ID must refer to a real programme.</p>
        <label className="block text-sm">Verified registration ID<input required className="mt-1 w-full rounded border p-2" value={selectedRegistration} onChange={(e: ChangeEvent<HTMLInputElement>)=>setSelectedRegistration(e.target.value)}/></label>
        <form className="space-y-2" onSubmit={attendanceSubmit}>
          <label className="block text-sm">Published event ID<input required className="mt-1 w-full rounded border p-2" value={eventId} onChange={(e: ChangeEvent<HTMLInputElement>)=>setEventId(e.target.value)}/></label>
          <button disabled={saving||!chapterId} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">Verify event attendance</button>
        </form>
        <form className="space-y-2" onSubmit={followUpSubmit}>
          <label className="block text-sm">Follow-up notes<textarea required maxLength={2000} className="mt-1 w-full rounded border p-2" value={notes} onChange={(e: ChangeEvent<HTMLTextAreaElement>)=>setNotes(e.target.value)}/></label>
          <button disabled={saving||!chapterId} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">Record follow-up</button>
        </form>
        <p className="text-sm">Verified attendance records: {attendance.length} shown · Follow-ups: {followUps.length} shown (first page)</p>
      </div>
      {error&&<div role="alert" className="rounded border border-red-300 p-3 text-red-800">{error}</div>}
      {notice&&<div role="status" className="rounded border border-green-300 p-3">{notice}</div>}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold">Athithi lifecycle (canonical records)</h2>
        <p className="mt-1 text-sm">Invitation linkage, event attendance and follow-ups are derived from the same authorised backend records. Membership application and activation are not yet linked; no conversion credit is asserted.</p>
        {lifecycle?.items.length ? <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Athithi</th><th className="p-2">Invitation</th><th className="p-2">Verified attendance</th><th className="p-2">Follow-ups</th><th className="p-2">Latest outcome</th><th className="p-2">Conversion</th></tr></thead><tbody>{lifecycle.items.map(row=><tr key={row.id} className="border-t"><td className="p-2">{row.fullName||'—'}</td><td className="p-2">{row.invitationReference||'Not linked'}</td><td className="p-2">{row.verifiedAttendanceCount}</td><td className="p-2">{row.followUpCount}</td><td className="p-2">{row.lastFollowUpOutcome||'—'}</td><td className="p-2">Not verified</td></tr>)}</tbody></table></div> : <p className="mt-2 text-sm">{loading?'Loading lifecycle…':'No lifecycle records available.'}</p>}
      </div>
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold">Parivar Athithi registrations</h2>
        {loading?<p>Loading registrations…</p>:listing?.items.length?<div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Athithi</th><th className="p-2">Business</th><th className="p-2">Visiting date</th><th className="p-2">Verified</th><th className="p-2">Registration ID</th></tr></thead><tbody>{listing.items.map(row=><tr key={row.id} className="border-t"><td className="p-2">{row.fullName||'—'}</td><td className="p-2">{row.businessName||'—'}</td><td className="p-2">{row.visitingDate||'—'}</td><td className="p-2">{row.verified?'Yes':'No'}</td><td className="p-2 font-mono text-xs">{row.id}</td></tr>)}</tbody></table></div>:<p className="mt-2">No registrations available for this chapter.</p>}
        <div className="mt-3 flex items-center gap-3"><button disabled={loading||page<=1} className="rounded border px-3 py-1 disabled:opacity-40" onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</button><span>Page {page}{listing?` · ${listing.total} registrations`:''}</span><button disabled={loading||!listing||page*listing.pageSize>=listing.total} className="rounded border px-3 py-1 disabled:opacity-40" onClick={()=>setPage(p=>p+1)}>Next</button></div>
      </div>
    </>}
  </div>;
}
