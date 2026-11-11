import { serverClock } from '@/services/time/serverClock';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { Input } from '@/components/common/Input';
import { ContextBanner, DetailGrid, EnterpriseStatus } from '@/features/member/components/EnterpriseMemberUI';
import { EmptyState, PageHead, Section, Tip } from '@/features/network/components/NetworkUI';
import { addInteractionNote,createTransaction, setMeetingPollResponse, updateMeeting } from '@/features/network/networkSlice';
import { activeMemberId, businessForMember } from '@/features/network/selectors';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { stableClientId } from '@/utils/stableId';
import type { Meeting, Transaction } from '@/features/network/types';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { toGuid, toMemberSlug } from '@/services/api/guidUtils';

export default function MeetingDetailAttendancePollPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const noteCommand=useGovernedCommand();
  const { go, back } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const n=useNetworkSlice(['affiliations', 'businesses', 'interactionNotes', 'meetings', 'members', 'opportunities', 'references'] as const);

  const myGuid = toGuid(memberId).toLowerCase();
  const reduxMeeting = n.meetings.find(m => m.id === id && (m.participantIds ?? []).some(pid => pid === memberId || toMemberSlug(pid) === memberId || toGuid(pid).toLowerCase() === myGuid));

  const meetingRequest = useMemo(() => ({
    queryId: 'member.meetings.list',
    domain: 'member' as const,
    parameters: { viewerMemberId: memberId }
  }), [memberId]);
  const meetingQuery = useDomainCursorPage<any>(meetingRequest, [], [memberId]);
  const serverMeetings: any[] = meetingQuery.page?.items ?? [];
  const serverMeetingRaw = serverMeetings.find((m: any) => m.id === id || String(m.id).toLowerCase() === String(id).toLowerCase());

  const normalizedServerMeeting = useMemo(() => {
    if (!serverMeetingRaw) return undefined;
    const fromSlug = toMemberSlug(serverMeetingRaw.fromMemberId ?? serverMeetingRaw.requesterId) || (serverMeetingRaw.fromMemberId ?? serverMeetingRaw.requesterId);
    const toSlug = toMemberSlug(serverMeetingRaw.toMemberId ?? serverMeetingRaw.recipientId) || (serverMeetingRaw.toMemberId ?? serverMeetingRaw.recipientId);
    const participantIds = Array.isArray(serverMeetingRaw.participantIds) && serverMeetingRaw.participantIds.length > 0
      ? serverMeetingRaw.participantIds
      : [fromSlug, toSlug].filter(Boolean);

    const otherSlug = fromSlug === memberId ? toSlug : fromSlug;
    const otherMember = n.members.find(m => m.id === otherSlug || toMemberSlug(m.id) === otherSlug);
    const rawStatus = String(serverMeetingRaw.status ?? 'proposed').toLowerCase();
    let status: Meeting['status'] = 'proposed';
    if (rawStatus === 'confirmed' || rawStatus === 'scheduled') status = 'confirmed';
    else if (rawStatus === 'completed') status = 'completed';
    else if (rawStatus === 'cancelled') status = 'cancelled';
    else if (rawStatus === 'declined') status = 'declined';
    else if (rawStatus === 'alternate-proposed' || rawStatus === 'timeproposed') status = 'alternate-proposed';

    return {
      id: String(serverMeetingRaw.id),
      participantIds,
      requesterId: fromSlug,
      recipientId: toSlug,
      title: serverMeetingRaw.title || (otherMember ? `One-to-one with ${otherMember.name}` : 'One-to-One Meeting'),
      dateTime: serverMeetingRaw.dateTime || serverMeetingRaw.confirmedAt || serverMeetingRaw.proposedAt || new Date().toISOString(),
      alternateDateTime: serverMeetingRaw.alternateDateTime,
      mode: serverMeetingRaw.mode || 'Online',
      location: serverMeetingRaw.location || 'Video meeting',
      agenda: serverMeetingRaw.agenda || 'Business introduction and collaboration discussion.',
      status,
      outcome: serverMeetingRaw.outcome,
      followUp: serverMeetingRaw.followUp ?? serverMeetingRaw.followUpAt,
      businessId: serverMeetingRaw.businessId,
      opportunityId: serverMeetingRaw.opportunityId,
      referenceId: serverMeetingRaw.referenceId,
      version: serverMeetingRaw.version ? String(serverMeetingRaw.version) : undefined,
    } as Meeting;
  }, [serverMeetingRaw, memberId, n.members]);

  const meeting = reduxMeeting || normalizedServerMeeting;

  const [alternate, setAlternate] = useState('');
  const [completionOpen, setCompletionOpen] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [privateNote,setPrivateNote]=useState('');
  const [sharedNote,setSharedNote]=useState('');
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [businessOutcome, setBusinessOutcome] = useState('');
  const [value, setValue] = useState('');

  if (!meeting) {
    return <div><PageHead title="Meeting" /><EmptyState title="Meeting unavailable" body="This meeting does not exist or is outside your Member context." action={<Button variant="secondary" onClick={() => back('/app/one-to-one')}>Return to meetings</Button>} /></div>;
  }

  const response = meeting.pollResponses?.[memberId];
  const deadlinePassed = Boolean(meeting.pollDeadline && new Date(meeting.pollDeadline).getTime() < serverClock.nowMs());
  const tally = (choice: 'Yes'|'Maybe'|'No') => Object.values(meeting.pollResponses ?? {}).filter(x => x === choice).length;
  const participants = (meeting.participantIds || []).map(pid => n.members.find(m => m.id === pid || toMemberSlug(m.id) === pid) || (toMemberSlug(pid) === 'member-secretary' ? { id: 'member-secretary', name: 'Meera Narayanan' } : { id: 'member-member', name: 'Anand Kumar' })).filter(Boolean) as typeof n.members;
  const otherParticipants = participants.filter(p => p.id !== memberId && toMemberSlug(p.id) !== memberId);
  const other = otherParticipants[0];
  const viewer = n.members.find(m => m.id === memberId);
  const viewerBusiness = viewer ? businessForMember(n, viewer.id) : undefined;
  const otherBusiness = meeting.businessId ? n.businesses.find(b => b.id === meeting.businessId) : other ? businessForMember(n, other.id) : undefined;
  const relatedReferences = n.references.filter(r => meeting.referenceId ? r.id === meeting.referenceId : (meeting.participantIds || []).includes(r.fromMemberId) && (meeting.participantIds || []).includes(r.toMemberId));
  const relatedOpportunity = meeting.opportunityId ? n.opportunities.find(o => o.id === meeting.opportunityId) : undefined;
  const canDecide = (meeting.status === 'proposed' || meeting.status === 'alternate-proposed') && (meeting.recipientId === memberId || toMemberSlug(meeting.recipientId) === memberId);
  const canComplete = meeting.status === 'confirmed' && new Date(meeting.dateTime).getTime() <= serverClock.nowMs();

  const update = async (changes: {status?:Meeting['status'];dateTime?:string;alternateDateTime?:string;outcome?:string;followUp?:string;participantNotes?:string}) =>
    command.execute({domain:'member',policyId:'meeting.update',command:'meeting.update',aggregateType:'Meeting',aggregateId:meeting.id,expectedVersion:meeting.version,payload:{meetingId:meeting.id,...changes},previewAction:()=>dispatch(updateMeeting({id:meeting.id,...changes}))});
  const submitAlternate = async () => {
    if (!alternate || new Date(alternate).getTime() <= serverClock.nowMs()) return;
    const result=await update({ status: 'alternate-proposed', alternateDateTime: new Date(alternate).toISOString() });
    if(result.ok)setAlternate('');
  };
  const completeMeeting = async (outcomeValue=outcome) => {
    if (!outcomeValue.trim()) return false;
    const result=await update({ status: 'completed', outcome: outcomeValue.trim(), followUp: followUp.trim() || undefined,participantNotes:sharedNote.trim()||undefined });
    if(!result.ok)return false;
    if(privateNote.trim()&&other){const payload={authorMemberId:memberId,targetMemberId:other.id,businessId:otherBusiness?.id,contextType:'Meeting' as const,contextId:meeting.id,noteType:'Meeting' as const,text:privateNote.trim(),visibility:'Private' as const};const noteResult=await noteCommand.execute({domain:'member',policyId:'member.interaction-note.create',command:'member.interaction-note.create',aggregateType:'MemberInteractionNote',aggregateId:`note-${meeting.id}-${memberId}`,payload,previewAction:()=>dispatch(addInteractionNote(payload))});if(!noteResult.ok)return false;}
    setOutcome('');setPrivateNote('');setSharedNote('');setFollowUp('');
    return true;
  };
  const recordBusinessOutcome = async (outcomeValue=businessOutcome) => {
    if (!outcomeValue.trim() || !viewerBusiness || !otherBusiness) return false;
    const transactionId=stableClientId('txn');
    const previewPayload:Omit<Transaction,'id'|'createdAt'>={ memberId, buyerBusinessId: viewerBusiness.id, counterpartyBusinessId: otherBusiness.id, opportunityId: meeting.opportunityId, referenceId: meeting.referenceId, description: outcomeValue.trim(), value: value ? Number(value) : undefined, status: 'proposed', valueVisibility: 'participants', proofNote: `Recorded from meeting ${meeting.id}` };
    const result=await command.execute({domain:'member',policyId:'transaction.create',command:'transaction.create',aggregateType:'Transaction',aggregateId:transactionId,payload:{id:transactionId,...previewPayload},previewAction:()=>dispatch(createTransaction(previewPayload))});
    if(!result.ok)return false;
    setBusinessOutcome('');setValue('');
    go(`/app/transactions?business=${otherBusiness.id}`, { label: meeting.title });
    return true;
  };
  const poll=async(response:'Yes'|'Maybe'|'No')=>command.execute({domain:'member',policyId:'meeting.poll',command:'meeting.poll',aggregateType:'Meeting',aggregateId:meeting.id,expectedVersion:meeting.version,payload:{meetingId:meeting.id,response},previewAction:()=>dispatch(setMeetingPollResponse({meetingId:meeting.id,memberId,response}))});

  return (
    <div>
      <PageHead eyebrow="Meeting workspace" title={meeting.title} description="Review the meeting, decide next steps and capture the outcome." actions={<Button variant="secondary" onClick={() => back('/app/one-to-one')}>Back to meetings</Button>} /><CommandExecutionFeedback error={command.error??noteCommand.error} onRetry={()=>void (command.error?command.retry():noteCommand.retry())} onDismiss={()=>{command.clearError();noteCommand.clearError()}}/>

      <Card className="mb-6 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2"><EnterpriseStatus status={meeting.status} tone={meeting.status === 'confirmed' || meeting.status === 'completed' ? 'success' : meeting.status === 'cancelled' || meeting.status === 'declined' ? 'danger' : 'warning'} /></div>
            <h2 className="mt-4 text-2xl font-black text-[var(--navy-950)]">{new Date(meeting.dateTime).toLocaleString('en-IN')}</h2>
            <p className="mt-1 text-base text-slate-600">{meeting.mode} · {meeting.location}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canDecide && <><Button disabled={command.busy} onClick={() => void update({status:'confirmed'})}>Accept meeting</Button><Button variant="secondary" disabled={command.busy} onClick={() => void update({status:'declined'})}>Decline</Button></>}
            {meeting.status === 'confirmed' && <Button variant="secondary" disabled={command.busy} onClick={() => void update({status:'cancelled'})}>Cancel meeting</Button>}
            {canComplete && <Button onClick={() => setCompletionOpen(true)}>Complete meeting</Button>}
          </div>
        </div>
      </Card>

      {canDecide && (
        <Card className="mb-6 border-sky-200 bg-sky-50/60 p-5">
          <h2 className="text-xl font-black text-sky-950">Need a different time?</h2>
          <p className="mt-1 text-base text-sky-900">Suggest one alternate time instead of declining the conversation.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Input label="Suggested date and time" type="datetime-local" value={alternate} onChange={e => setAlternate(e.target.value)} /></div><Button variant="secondary" disabled={!alternate} onClick={()=>void submitAlternate()}>Suggest new time</Button></div>
        </Card>
      )}

      {meeting.status === 'alternate-proposed' && meeting.requesterId === memberId && meeting.alternateDateTime && (
        <div className="mb-6"><ContextBanner title="A new time was suggested" action={<Button disabled={command.busy} onClick={() => void update({status:'confirmed',dateTime:meeting.alternateDateTime})}>Accept new time</Button>}>Suggested time: <strong>{new Date(meeting.alternateDateTime).toLocaleString('en-IN')}</strong>.</ContextBanner></div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          <Section title="Agenda" subtitle="The purpose both participants should prepare for."><Card className="p-5"><p className="text-base leading-7 text-slate-700">{meeting.agenda}</p></Card></Section>
          <Section title="Participants" subtitle="Open the member or business profile without losing the meeting context."><div className="grid gap-3 md:grid-cols-2">{participants.map(person => { const business = businessForMember(n, person.id); return <Card key={person.id} className="p-5"><button type="button" className="text-lg font-black text-sky-800 hover:underline" onClick={() => go(`/app/members/${person.id}`, { label: meeting.title })}>{person.name}</button><p className="mt-1 text-base text-slate-600">{person.designation} · {person.chapter}</p>{business && <Button className="mt-3" variant="secondary" onClick={() => go(`/app/businesses/${business.id}`, { label: meeting.title })}>View {business.name}</Button>}</Card>; })}</div></Section>
          {meeting.outcome && <Section title="Meeting outcome" subtitle="The recorded conclusion and agreed follow-up."><Card className="p-5"><p className="text-base leading-7 text-slate-700"><strong>Outcome:</strong> {meeting.outcome}</p>{meeting.followUp && <p className="mt-3 text-base leading-7 text-slate-700"><strong>Follow-up:</strong> {meeting.followUp}</p>}{meeting.participantNotes&&<p className="mt-3 rounded-xl bg-sky-50 p-3 text-base leading-7 text-sky-900"><strong>Shared participant note:</strong> {meeting.participantNotes}</p>}{n.interactionNotes.filter(note=>note.authorMemberId===memberId&&note.contextType==='Meeting'&&note.contextId===meeting.id).map(note=><p key={note.id} className="mt-3 rounded-xl bg-amber-50 p-3 text-base leading-7 text-amber-950"><strong>My private note:</strong> {note.text}</p>)}<div className="mt-5 flex flex-wrap gap-2">{other && <Button variant="secondary" onClick={() => go(`/app/references/new?member=${other.id}${otherBusiness ? `&business=${otherBusiness.id}` : ''}`, { label: meeting.title })}>Give Business Reference</Button>}{viewerBusiness && otherBusiness && <Button onClick={() => setOutcomeOpen(true)}>Record Business Outcome</Button>}<Button variant="secondary" onClick={() => go(`/app/thank-you-notes?meeting=${meeting.id}`, { label: meeting.title })}>Send Thank You / Follow-up</Button></div></Card></Section>}
          <Section title="Connected activity" subtitle="Related references, opportunity and business context stay attached to the meeting journey."><Card className="p-5"><div className="flex flex-wrap gap-2">{otherParticipants.map(person => <Button key={person.id} variant="secondary" onClick={() => go(`/app/members/${person.id}`, { label: meeting.title })}>View {person.name}</Button>)}{otherBusiness && <Button variant="secondary" onClick={() => go(`/app/businesses/${otherBusiness.id}`, { label: meeting.title })}>{otherBusiness.name}</Button>}{relatedReferences.length > 0 && <Button variant="secondary" onClick={() => go(`/app/references?member=${other?.id ?? ''}`, { label: meeting.title })}>{relatedReferences.length} related reference{relatedReferences.length === 1 ? '' : 's'}</Button>}{relatedOpportunity && <Button variant="secondary" onClick={() => go(`/app/opportunities/${relatedOpportunity.id}`, { label: meeting.title })}>Opportunity: {relatedOpportunity.title}</Button>}</div></Card></Section>
        </div>

        <div className="grid content-start gap-5">
          <Card className="p-5"><h2 className="text-xl font-black text-[var(--navy-950)]">Meeting details</h2><div className="mt-4"><DetailGrid items={[{ label: 'Mode', value: meeting.mode }, { label: 'Location / link', value: meeting.location }, { label: 'Participants', value: String(participants.length) }, { label: 'Status', value: <EnterpriseStatus status={meeting.status} /> }]} /></div></Card>
          <Card className="p-5"><h2 className="text-xl font-black text-[var(--navy-950)]">Attendance poll</h2><p className="mt-1 text-base leading-6 text-slate-600">{meeting.pollDeadline ? `Respond by ${new Date(meeting.pollDeadline).toLocaleString('en-IN')}.` : 'Your response remains editable until the meeting.'}</p><div className="mt-4 grid grid-cols-3 gap-2">{(['Yes','Maybe','No'] as const).map(choice => <Button key={choice} variant={response === choice ? 'default' : 'secondary'} disabled={deadlinePassed||command.busy} onClick={() => void poll(choice)}>{choice}</Button>)}</div><div className="mt-4 grid grid-cols-3 gap-2 text-center">{(['Yes','Maybe','No'] as const).map(choice => <div key={choice} className="rounded-lg bg-slate-50 p-3"><div className="text-xl font-black text-slate-900">{tally(choice)}</div><div className="text-sm text-slate-600">{choice}</div></div>)}</div><div className="mt-4"><Tip>Poll response does not overwrite final attendance.</Tip></div></Card>
        </div>
      </div>

      <ActionDialog open={completionOpen} title="Complete meeting" description="Capture what happened and the agreed next step." inputLabel="Meeting outcome" requireValue confirmLabel="Save meeting outcome" onClose={()=>setCompletionOpen(false)} onConfirm={completeMeeting}>
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-bold">Follow-up <span className="font-normal text-slate-500">Optional</span><textarea rows={3} className="rounded-xl border border-slate-300 p-3 text-base font-normal" value={followUp} onChange={e=>setFollowUp(e.target.value)}/></label>
          <label className="grid gap-1.5 text-sm font-bold">My private note <span className="font-normal text-slate-500">Only you can see this</span><textarea rows={3} className="rounded-xl border border-slate-300 p-3 text-base font-normal" value={privateNote} onChange={e=>setPrivateNote(e.target.value)}/></label>
          <label className="grid gap-1.5 text-sm font-bold">Shared participant note <span className="font-normal text-slate-500">Visible to meeting participants</span><textarea rows={3} className="rounded-xl border border-slate-300 p-3 text-base font-normal" value={sharedNote} onChange={e=>setSharedNote(e.target.value)}/></label>
        </div>
      </ActionDialog>

      <ActionDialog open={outcomeOpen} title="Record Business Outcome" description="Record a factual commercial progression linked to this meeting. The counterparty can confirm it through the Business Outcomes workflow." inputLabel="Outcome description" requireValue confirmLabel="Record outcome" onClose={()=>setOutcomeOpen(false)} onConfirm={recordBusinessOutcome}>
        <Input label="Approximate value (optional)" type="number" min="0" value={value} onChange={e=>setValue(e.target.value)}/>
      </ActionDialog>
    </div>
  );
}
