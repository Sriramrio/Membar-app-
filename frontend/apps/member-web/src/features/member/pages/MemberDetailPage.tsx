import { useState, useEffect } from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Flag,
  Mail,
  MapPin,
  MessageSquare,
  StickyNote,
  Phone,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserMinus,
  XCircle,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { converseThreadPath } from '@/features/member/navigation/converseRoute';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { ContextTip } from '@/components/help/ContextTip';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { toast } from '@/components/ui/Toast';
import {
  ContextBanner,
  DetailGrid,
  EnterpriseStatus,
  Timeline,
} from '@/features/member/components/EnterpriseMemberUI';
import {
  Avatar,
  EmptyState,
  PageHead,
  Section,
  StatusPill,
  Tip,
} from '@/features/network/components/NetworkUI';
import { activeMemberId, affiliatedBusinessIdsForMember, connectionStatus, directConversationBetween, selectActiveMember } from '@/features/network/selectors';
import { addInteractionNote,toggleSavedBusiness } from '@/features/network/networkSlice';
import { fieldVisible, memberSummaryAllowed, relationBetween } from '@/features/network/accessPolicy';
import { useConnectionCommands } from '@/hooks/useConnectionCommands';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { apiClient } from '@/services/api/apiClient';
import { searchAuthoritativeDirectory } from '@/services/api/directoryApi';
import { toGuid, toMemberSlug } from '@/services/api/guidUtils';
import type { InteractionNoteContext,MemberInteractionNote, Member } from '@/features/network/types';

const connectionPurposes = [
  'Business introduction',
  'Supplier discussion',
  'Buyer requirement',
  'Partnership',
  'Technology collaboration',
  'Chapter networking',
  'Follow-up after event',
  'Other',
] as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MemberDetailPage() {
  const { id } = useParams();
  const { go, back } = useMemberNavigation();
  const dispatch = useAppDispatch();
  const connectionCommands = useConnectionCommands();
  const noteCommand=useGovernedCommand();
  const n=useNetworkSlice(['affiliations', 'businesses', 'connections', 'conversations', 'interactionNotes', 'meetings', 'members', 'opportunities', 'preferencesByMember', 'references', 'responses', 'transactions'] as const);
  const viewerId = useAppSelector(activeMemberId);
  const activeMember = useAppSelector(selectActiveMember);
  const viewer = n.members.find(m => m.id === viewerId) || activeMember;

  const [liveConnections, setLiveConnections] = useState<any[]>([]);
  const [directoryMember, setDirectoryMember] = useState<Member | null>(null);

  useEffect(() => {
    apiClient.get<any[]>('/connections', { retry: 'safe' })
      .then(res => {
        if (Array.isArray(res)) setLiveConnections(res);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!n.members.some(m => m.id === id) && id) {
      searchAuthoritativeDirectory({ query: id, scope: 'YourNetwork', limit: 1 })
        .then(res => {
          if (res?.items && res.items.length > 0) {
            const item = res.items[0];
            const bName = item.businessName || 'Enterprise';
            setDirectoryMember({
              id: String(item.memberId || id),
              name: `${bName} Representative`,
              designation: 'Managing Director / Representative',
              chapter: item.chapterId || 'Network Chapter',
              city: 'Tamil Nadu',
              region: 'Tamil Nadu',
              state: 'Tamil Nadu',
              country: 'India',
              bio: `Verified representative of ${bName}.`,
              expertise: ['Business Development', 'Networking'],
              email: '',
              phone: '',
              avatarText: bName.slice(0, 2).toUpperCase() || 'NM',
              profileCompleteness: 90,
              status: 'active',
              verificationStatus: 'verified'
            });
          }
        })
        .catch(() => {});
    }
  }, [id, n.members]);

  const myGuid = toGuid(viewerId).toLowerCase();
  const targetGuid = toGuid(id).toLowerCase();

  const liveConn = liveConnections.find(c => {
    const oId = String(c.otherMemberId ?? '').toLowerCase();
    const initId = String(c.initiatorId ?? '').toLowerCase();
    return oId === targetGuid || (initId === targetGuid && oId === myGuid);
  });

  const rawTarget = n.members.find(m => m.id === id);
  const target: Member | undefined = rawTarget || (liveConn ? {
    id: String(id),
    name: liveConn.otherMemberName || 'Network Member',
    designation: liveConn.otherMemberDesignation || 'Managing Director',
    chapter: liveConn.otherMemberChapter || 'Namakkal Chapter',
    city: liveConn.otherMemberCity || 'Namakkal',
    region: 'Tamil Nadu',
    state: 'Tamil Nadu',
    country: 'India',
    bio: `${liveConn.otherMemberDesignation || 'Leader'} at ${liveConn.otherMemberCompany || 'Enterprise'}.`,
    expertise: ['B2B Enterprise', 'Pilot to production'],
    email: liveConn.otherMemberEmail || '',
    phone: '',
    avatarText: liveConn.otherMemberAvatar || (liveConn.otherMemberName ? liveConn.otherMemberName.slice(0, 2).toUpperCase() : 'NM'),
    profileCompleteness: 90,
    status: 'active' as const,
    verificationStatus: 'verified' as const,
  } : undefined) || (directoryMember ?? undefined);

  let status: 'none' | 'sent' | 'received' | 'connected' | 'blocked' = 'none';
  if (liveConn) {
    const rawState = String(liveConn.state ?? '');
    const isInitiator = typeof liveConn.isInitiator === 'boolean'
      ? liveConn.isInitiator
      : String(liveConn.initiatorId ?? '').toLowerCase() === myGuid;
    if (rawState === 'Accepted' || rawState === 'Connected' || rawState === '1') status = 'connected';
    else if (rawState === 'Blocked' || rawState === '2') status = 'blocked';
    else if (rawState === 'Pending' || rawState === '0') status = isInitiator ? 'sent' : 'received';
  } else if (target && viewer) {
    status = connectionStatus({ network: n }, viewer.id, target.id);
  }

  const [showConnectionComposer, setShowConnectionComposer] = useState(false);
  const [purpose, setPurpose] = useState<(typeof connectionPurposes)[number]>('Business introduction');
  const [connectionNote, setConnectionNote] = useState('');
  const [noteOpen,setNoteOpen]=useState(false);
  const [noteContext,setNoteContext]=useState<InteractionNoteContext>('General');
  const [noteVisibility,setNoteVisibility]=useState<MemberInteractionNote['visibility']>('Private');

  if (!viewer) {
    return <EmptyState title="Member identity unavailable" body="Your authenticated account has no active member identity." action={<Button variant="secondary" onClick={() => back('/workspace')}>Return to workspace</Button>} />;
  }

  const relation = target ? relationBetween(viewer, target, status) : 'unavailable';

  if (!target || !memberSummaryAllowed(relation)) {
    return (
      <>
        <PageHead title="Member Profile" />
        <EmptyState
          title="This member is not available in your network"
          body="The profile may be outside your permitted scope, unavailable, or restricted by the relationship policy."
          action={<Button variant="secondary" onClick={() => back('/app/directory')}>Return to directory</Button>}
        />
      </>
    );
  }

  const verifiedAffiliations = n.affiliations.filter(
    a => a.memberId === target.id && a.active && a.verificationStatus === 'Verified',
  );
  const primaryAffiliation =
    verifiedAffiliations.find(a => a.primaryRepresentative) ??
    verifiedAffiliations.find(a => a.authorisedRepresentative) ??
    verifiedAffiliations[0];
  const business = primaryAffiliation
    ? n.businesses.find(b => b.id === primaryAffiliation.businessId)
    : undefined;
  const prefs = n.preferencesByMember[target.id];
  const existingConversation = directConversationBetween(n, viewer.id, target.id);
  const meetingsWithTarget = n.meetings.filter(
    m => m.participantIds.includes(viewer.id) && m.participantIds.includes(target.id),
  );
  const referencesWithTarget = n.references.filter(
    r =>
      (r.fromMemberId === viewer.id && r.toMemberId === target.id) ||
      (r.toMemberId === viewer.id && r.fromMemberId === target.id),
  );
  const viewerBusinessIds = affiliatedBusinessIdsForMember(n, viewer.id);
  const outcomesWithTarget = business
    ? n.transactions.filter(
        t =>
          (t.buyerBusinessId === business.id || t.counterpartyBusinessId === business.id) &&
          (t.memberId === viewer.id || viewerBusinessIds.includes(t.buyerBusinessId) || viewerBusinessIds.includes(t.counterpartyBusinessId)),
      )
    : [];
  const opportunitiesWithTarget=business?n.opportunities.filter(o=>o.businessId===business.id||n.responses.some(r=>r.opportunityId===o.id&&r.businessId===business.id)):[];
  const visibleNotes=n.interactionNotes.filter(note=>note.authorMemberId===viewer.id&&note.targetMemberId===target.id);

  const canEmail = fieldVisible('email', relation, prefs);
  const canPhone = fieldVisible('phone', relation, prefs);
  const canAddress = fieldVisible('address', relation, prefs);
  const canBio = fieldVisible('bio', relation, prefs);
  const safeSummary = relation === 'cross-chapter';

  const relationshipLabel =
    relation === 'connected'
      ? 'Connected member'
      : relation === 'same-chapter'
        ? 'Same chapter'
        : relation === 'self'
          ? 'Your profile'
          : 'Network member';

  const message = async () => {
    if (existingConversation) return go(converseThreadPath(existingConversation.id, business ? `business:${business.id}` : undefined), { label: target.name });
    const result = await connectionCommands.createDirectConversation(target.id, business ? `business:${business.id}` : undefined, `Converse with ${target.name}`);
    if (result.ok) go(converseThreadPath(result.conversationId, business ? `business:${business.id}` : undefined), { label: target.name });
  };

  const sendConnectionRequest = async () => {
    const result = await connectionCommands.request(target.id, purpose, connectionNote.trim() || undefined);
    if(!result.ok)return;
    toast.success(`Connection request sent to ${target.name}!`, 'Request Sent');
    setConnectionNote('');
    setShowConnectionComposer(false);
  };

  const addNote=async(text:string)=>{const noteType:MemberInteractionNote['noteType']=noteContext==='Meeting'?'Meeting':noteContext==='Opportunity'?'Opportunity':noteContext==='Transaction'?'Transaction':'Observation';const payload:Omit<MemberInteractionNote,'id'|'createdAt'|'updatedAt'>={authorMemberId:viewer.id,targetMemberId:target.id,businessId:business?.id,contextType:noteContext,noteType,text,visibility:noteVisibility};const result=await noteCommand.execute({domain:'member',policyId:'member.interaction-note.create',command:'member.interaction-note.create',aggregateType:'MemberInteractionNote',aggregateId:`note-${viewer.id}-${target.id}`,payload,previewAction:()=>dispatch(addInteractionNote(payload))});return result.ok;};

  const activity = (() => {
    const meetingItems = meetingsWithTarget.map(m => ({
      at: m.dateTime,
      title: `${m.status === 'completed' ? 'Completed' : 'Meeting'}: ${m.title}`,
      detail: m.outcome || m.agenda,
      tone: m.status === 'completed' ? ('success' as const) : ('info' as const),
    }));
    const referenceItems = referencesWithTarget.map(r => ({
      at: r.createdAt,
      title: r.fromMemberId === viewer.id ? 'Business reference given' : 'Business reference received',
      detail: r.text,
      tone: r.status === 'Closed' ? ('success' as const) : ('info' as const),
    }));
    const noteItems=visibleNotes.map(note=>({at:note.updatedAt??note.createdAt,title:`${note.contextType} note`,detail:note.text,tone:'neutral' as const}));
    return [...meetingItems, ...referenceItems, ...noteItems]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8);
  })();

  return (
    <div>
      <PageHead
        eyebrow="Professional network identity"
        title="Member Profile"
        description={
          safeSummary
            ? 'You are viewing a privacy-safe network profile. Additional contact information appears only when the member’s visibility preferences and your relationship permit it.'
            : 'Understand this member’s expertise, verified business affiliations and your shared network activity before deciding the next business action.'
        }
        actions={<Button variant="secondary" onClick={() => back('/app/directory')}>Back to discovery</Button>}
      />
      <CommandExecutionFeedback error={connectionCommands.error??noteCommand.error} onRetry={()=>void (connectionCommands.error?connectionCommands.retry():noteCommand.retry())} onDismiss={()=>{connectionCommands.clearError();noteCommand.clearError()}}/>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar text={target.avatarText} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black leading-tight text-[var(--navy-950)] sm:text-[28px]">{target.name}</h2>
                {target.verificationStatus === 'verified' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
                    <ShieldCheck className="size-4" /> Verified member
                  </span>
                )}
              </div>
              <p className="mt-2 text-base font-semibold text-slate-700">
                {target.professionalTitle || target.designation}
                {business ? ` · ${business.tradeName ?? business.name}` : ''}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-base text-slate-600">
                <MapPin className="size-4" /> {target.city} · {target.chapter}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill tone={relation === 'connected' ? 'good' : relation === 'same-chapter' ? 'info' : 'neutral'}>{relationshipLabel}</StatusPill>
                {primaryAffiliation?.authorisedRepresentative && <StatusPill tone="good">Authorised representative</StatusPill>}
                {primaryAffiliation?.primaryRepresentative && <StatusPill tone="info">Primary business representative</StatusPill>}
              </div>
            </div>
          </div>

          {target.id !== viewer.id && (
            <div className="flex max-w-2xl flex-wrap gap-2">
              {status === 'none' && <Button onClick={() => setShowConnectionComposer(true)}><UserCheck className="size-4" />Connect</Button>}
              {status === 'sent' && (
                <Button variant="secondary" disabled={connectionCommands.busy} onClick={() => void connectionCommands.cancel(target.id).then(r=>{if(r.ok)toast.info('Connection request cancelled', 'Request Cancelled')})}>
                  <XCircle className="size-4" /> Cancel request
                </Button>
              )}
              {status === 'received' && (
                <>
                  <Button disabled={connectionCommands.busy} onClick={() => void connectionCommands.respond(target.id,'connected').then(r=>{if(r.ok)toast.success(`Connected with ${target.name}!`, 'Connection Accepted')})}>
                    <CheckCircle2 className="size-4" /> Accept
                  </Button>
                  <Button variant="secondary" disabled={connectionCommands.busy} onClick={() => void connectionCommands.respond(target.id,'declined').then(r=>{if(r.ok)toast.info('Connection request declined', 'Declined')})}>Decline</Button>
                </>
              )}
              {status === 'connected' && (
                <>
                  <Button disabled={connectionCommands.busy} onClick={()=>void message()}><MessageSquare className="size-4" />Converse</Button>
                  <Button variant="secondary" onClick={() => go(`/app/one-to-one?member=${target.id}`, { label: target.name })}><CalendarDays className="size-4" />Schedule meeting</Button>
                  <Button variant="secondary" onClick={()=>setNoteOpen(true)}><StickyNote className="size-4"/>Add note</Button>
                  <Button variant="secondary" onClick={() => go(`/app/references/new?member=${target.id}${business ? `&business=${business.id}` : ''}`, { label: target.name })}>Give reference</Button>
                  <Button variant="ghost" disabled={connectionCommands.busy} onClick={() => void connectionCommands.remove(target.id).then(r=>{if(r.ok)toast.warning(`Connection with ${target.name} removed.`, 'Removed')})}><UserMinus className="size-4" />Remove</Button>
                </>
              )}
              {status !== 'blocked' && <Button variant="ghost" disabled={connectionCommands.busy} onClick={() => void connectionCommands.block(target.id).then(r=>{if(r.ok)toast.error(`Member ${target.name} blocked.`, 'Member Blocked')})}><ShieldOff className="size-4" />Block</Button>}
              <Button variant="ghost" onClick={() => go(`/app/support?report=member&id=${target.id}`, { label: target.name })}><Flag className="size-4" />Report</Button>
            </div>

          )}
        </div>
      </Card>

      {showConnectionComposer && status === 'none' && (
        <Card className="mt-5 border-sky-200 bg-sky-50/70 p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black text-sky-950">Connect with a business purpose</h2>
              <p className="mt-1 text-base leading-6 text-sky-900">A short reason helps {target.name} understand why this connection may be useful.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Purpose
                  <select className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base font-semibold" value={purpose} onChange={e => setPurpose(e.target.value as (typeof connectionPurposes)[number])}>
                    {connectionPurposes.map(item => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Personal note <span className="font-normal text-slate-500">Optional</span>
                  <textarea className="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base leading-6" maxLength={240} placeholder="Add useful context for the introduction…" value={connectionNote} onChange={e => setConnectionNote(e.target.value)} />
                </label>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={connectionCommands.busy} onClick={()=>void sendConnectionRequest()}>Send connection request</Button>
              <Button variant="secondary" onClick={() => setShowConnectionComposer(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {status === 'sent' && (
        <div className="mt-5">
          <ContextBanner title="Connection request sent" action={<Button variant="secondary" onClick={() => go('/app/connections?status=sent', { label: target.name })}>View sent requests</Button>}>
            {target.name} can review your request. Contact information remains governed by their privacy settings until the relationship allows it.
          </ContextBanner>
        </div>
      )}

      <div className="mt-7 grid gap-7 xl:grid-cols-[1.35fr_.65fr]">
        <div className="grid gap-7">
          <Section title="About" subtitle="Professional context shared with your current network relationship.">
            <Card className="p-5">
              {canBio ? (
                <p className="text-base leading-7 text-slate-700">{target.bio || 'No professional summary has been added yet.'}</p>
              ) : (
                <p className="text-base leading-7 text-slate-600">This member has not shared their professional summary at your current visibility level.</p>
              )}
            </Card>
          </Section>

          <Section title="Expertise" subtitle="Areas this member has chosen to make discoverable.">
            <Card className="p-5">
              <div className="flex flex-wrap gap-2">
                {target.expertise.length ? target.expertise.map(x => <Badge key={x}>{x}</Badge>) : <span className="text-base text-slate-600">No expertise tags have been added.</span>}
              </div>
            </Card>
          </Section>

          <Section title="Business" subtitle="Verified organisation affiliations remain separate from the member identity.">
            {business ? (
              <Card className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <button type="button" className="text-left text-lg font-black text-sky-800 hover:underline" onClick={() => go(`/app/businesses/${business.id}`, { label: target.name })}>{business.tradeName ?? business.name}</button>
                    <p className="mt-1 text-base text-slate-600">{primaryAffiliation ? `${primaryAffiliation.relationshipType} · ${primaryAffiliation.designation}` : target.designation}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => go(`/app/businesses/${business.id}`, { label: target.name })}><BriefcaseBusiness className="size-4" />View business</Button>
                    <Button variant="secondary" onClick={() => dispatch(toggleSavedBusiness({ memberId: viewer.id, businessId: business.id }))}>Save business</Button>
                  </div>
                </div>
              </Card>
            ) : (
              <EmptyState title="No verified business affiliation" body="This member does not currently have a verified business affiliation available to your network scope." />
            )}
          </Section>

          <Section title="Connected activity" subtitle="Shared meetings and references help you continue the relationship without losing context.">
            <Card className="p-5">
              <div className="mb-5 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => go(`/app/one-to-one?member=${target.id}`, { label: target.name })}>{meetingsWithTarget.length} meeting{meetingsWithTarget.length === 1 ? '' : 's'}</Button>
                <Button variant="secondary" onClick={() => go(`/app/references?member=${target.id}`, { label: target.name })}>{referencesWithTarget.length} reference{referencesWithTarget.length === 1 ? '' : 's'}</Button>
                {business&&<Button variant="secondary" onClick={()=>go(`/app/opportunities?business=${business.id}`,{label:target.name})}>{opportunitiesWithTarget.length} opportunit{opportunitiesWithTarget.length===1?'y':'ies'}</Button>}
                {business && <Button variant="secondary" onClick={() => go(`/app/transactions?business=${business.id}`, { label: target.name })}>{outcomesWithTarget.length} business outcome{outcomesWithTarget.length === 1 ? '' : 's'}</Button>}
                <Button variant="secondary" onClick={()=>setNoteOpen(true)}>{visibleNotes.length} note{visibleNotes.length===1?'':'s'}</Button>
              </div>
              {activity.length ? (
                <Timeline items={activity.map(item => ({ title: item.title, detail: item.detail, meta: formatDate(item.at), tone: item.tone }))} />
              ) : (
                <p className="text-base leading-7 text-slate-600">No shared meetings or business references yet. A focused meeting is usually the best next step after connecting.</p>
              )}
            </Card>
          </Section>
        </div>

        <div className="grid content-start gap-5">
          <Card className="p-5">
            <h2 className="text-xl font-black text-[var(--navy-950)]">Network context</h2>
            <div className="mt-4">
              <DetailGrid items={[
                { label: 'Relationship', value: relationshipLabel },
                { label: 'Parivar', value: target.chapter },
                { label: 'Location', value: `${target.city}, ${target.state}` },
                { label: 'Member status', value: <EnterpriseStatus status={target.status ?? 'active'} tone={target.status === 'active' || !target.status ? 'success' : 'warning'} /> },
              ]} />
            </div>
          </Card>

          <Card className="bg-slate-50 p-5">
            <h2 className="text-xl font-black text-[var(--navy-950)]">Contact visibility</h2>
            <p className="mt-1 text-base leading-6 text-slate-600">Contact fields are evaluated individually using this member’s privacy settings.</p>
            <div className="mt-4 grid gap-4 text-base">
              {canEmail ? (
                <div className="flex items-center gap-3"><Mail className="size-5 text-slate-400" /><a className="font-semibold text-sky-700 hover:underline" href={`mailto:${target.email}`}>{target.email}</a></div>
              ) : (
                <div className="flex items-start gap-3 text-slate-600"><Mail className="mt-0.5 size-5 text-slate-400" /><span>Email is available only when the member’s visibility setting permits it.</span></div>
              )}
              {canPhone ? (
                <div className="flex items-center gap-3"><Phone className="size-5 text-slate-400" /><span className="font-semibold">{target.phone}</span></div>
              ) : (
                <div className="flex items-start gap-3 text-slate-600"><Phone className="mt-0.5 size-5 text-slate-400" /><span>Phone is available only when the member’s visibility setting permits it.</span></div>
              )}
              {canAddress && target.address && <div className="flex items-start gap-3"><MapPin className="mt-0.5 size-5 text-slate-400" /><span>{target.address}</span></div>}
            </div>
          </Card>

          <div className="flex items-center gap-2"><ContextTip title="Relationship notes">Private notes are visible only to you. Participant notes must only be used where the other member is explicitly part of the relationship context.</ContextTip><span className="text-sm font-semibold text-slate-600">Relationship help</span></div>
          <Tip>Connection approval never overrides a field that the member keeps private. Privacy and relationship permissions are evaluated together.</Tip>
        </div>
      </div>
      <ActionDialog open={noteOpen} title={`Add relationship note · ${target.name}`} description="Notes stay separate from Converse so business context is easy to recover later." inputLabel="Note" requireValue confirmLabel="Save note" onClose={()=>setNoteOpen(false)} onConfirm={addNote}>
        <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-bold">Context<select className="min-h-11 rounded-lg border border-slate-300 px-3 font-normal" value={noteContext} onChange={e=>setNoteContext(e.target.value as InteractionNoteContext)}><option>General</option><option>Opportunity</option><option>Meeting</option><option>Transaction</option><option>Reference</option><option>Business</option></select></label><label className="grid gap-1 text-sm font-bold">Visibility<select className="min-h-11 rounded-lg border border-slate-300 px-3 font-normal" value={noteVisibility} onChange={e=>setNoteVisibility(e.target.value as MemberInteractionNote['visibility'])}><option>Private</option><option>Participants</option></select></label></div>
      </ActionDialog>
    </div>
  );
}
