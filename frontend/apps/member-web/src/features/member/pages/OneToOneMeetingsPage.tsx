import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { CalendarDays, ChevronRight, Plus, UsersRound } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/common/Input';
import { ContextBanner, EnterpriseStatus } from '@/features/member/components/EnterpriseMemberUI';
import { EmptyState, PageHead, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId } from '@/features/network/selectors';
import { addNotification, createMeeting } from '@/features/network/networkSlice';
import type { Meeting } from '@/features/network/types';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { AnalyticsSummary } from '@/features/member/analytics/AnalyticsSummary';
import { buildPersonalNetworkingAnalytics } from '@/features/member/analytics/networkingAnalytics';
import type { DashboardPeriodKey } from '@/features/member/dashboard/types';
import { inPeriod, resolveDashboardPeriod } from '@/features/member/dashboard/period';
import { makeSelectMeetingsForMember, selectConnectionsByMember, selectMemberEntities, selectBusinessEntities, selectBusinesses } from '@/features/network/readModel';
import { serverClock } from '@/services/time/serverClock';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { stableClientId } from '@/utils/stableId';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { QueryError,QueryLoading } from '@/components/data/QueryState';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { toast } from '@/components/ui/Toast';
import { env } from '@/config/env';

import { toGuid, toMemberSlug } from '@/services/api/guidUtils';

const tabs = [
  ['all', 'All'],
  ['action', 'Action Needed'],
  ['upcoming', 'Upcoming'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
] as const;

type ViewKey = (typeof tabs)[number][0];

function defaultMeetingTime() {
  const d = serverClock.now();
  d.setDate(d.getDate() + 2);
  d.setHours(11, 0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function OneToOneMeetingsPage() {
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const meetingId = useRef(stableClientId('meeting'));
  const { go } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const connectionsByMember = useAppSelector(selectConnectionsByMember);
  const memberEntities = useAppSelector(selectMemberEntities);
  const businessEntities = useAppSelector(selectBusinessEntities);
  const businesses = useAppSelector(selectBusinesses);
  const selectMeetings = useMemo(makeSelectMeetingsForMember, []);
  const meetings = useAppSelector(s => selectMeetings(s, memberId));
  const [sp, setSp] = useSearchParams();
  const requestedMember = sp.get('member') ?? '';
  const requestedBusiness = sp.get('business') ?? '';
  const requestedOpportunity = sp.get('opportunity') ?? '';
  const requestedReference = sp.get('reference') ?? '';
  const requestedView = (sp.get('view') ?? 'upcoming') as ViewKey;
  const requestedStatus = sp.get('status') ?? '';
  const requestedDirection = sp.get('direction') ?? '';
  const periodKey = (sp.get('period') ?? 'month') as DashboardPeriodKey;
  const intelligence = useAppSelector(s => buildPersonalNetworkingAnalytics(s, memberId, periodKey));
  const analyticsPeriod = useMemo(() => resolveDashboardPeriod(periodKey), [periodKey]);
  const view: ViewKey = tabs.some(([key]) => key === requestedView) ? requestedView : 'upcoming';

  const connectionsRequest = useMemo(() => ({
    queryId: 'member.connections.list',
    domain: 'member' as const,
    pagination: { pageSize: 50 },
    parameters: { memberId }
  }), [memberId]);

  const connectionsQuery = useDomainCursorPage<any>(connectionsRequest, [], [memberId]);
  useRealtimeRefresh(['connection.*'], connectionsQuery.reload);
  const serverConnections = connectionsQuery.page?.items ?? [];

  const connected = useMemo(() => {
    const list: string[] = (connectionsByMember[memberId] ?? [])
      .filter(c => c.status === 'connected')
      .map(c => c.ownerId === memberId ? c.targetId : c.ownerId);

    const myGuid = toGuid(memberId).toLowerCase();

    serverConnections.forEach((sc: any) => {
      const rawState = String(sc.state ?? '');
      if (rawState === 'Accepted' || rawState === 'Connected') {
        const initGuid = String(sc.initiatorId ?? '').toLowerCase();
        const otherGuid = String(sc.otherMemberId ?? '').toLowerCase();
        const targetGuid = initGuid === myGuid ? otherGuid : initGuid;
        const slug = toMemberSlug(targetGuid) || (initGuid === myGuid ? otherGuid : initGuid);
        if (slug && !list.includes(slug)) {
          list.push(slug);
        }
      }
    });

    return [...new Set(list)];
  }, [connectionsByMember, serverConnections, memberId]);

  const serverMemberInfoMap = useMemo(() => {
    const map = new Map<string, { name: string; chapter: string }>();
    const myGuid = toGuid(memberId).toLowerCase();
    serverConnections.forEach((sc: any) => {
      const initGuid = String(sc.initiatorId ?? '').toLowerCase();
      const otherGuid = String(sc.otherMemberId ?? '').toLowerCase();
      const targetGuid = initGuid === myGuid ? otherGuid : initGuid;
      const slug = toMemberSlug(targetGuid) || targetGuid;
      if (sc.otherMemberName) {
        const info = { name: sc.otherMemberName, chapter: sc.otherMemberChapter || 'Network Chapter' };
        map.set(targetGuid, info);
        map.set(slug, info);
        map.set(otherGuid, info);
      }
    });
    return map;
  }, [serverConnections, memberId]);

  const [target, setTarget] = useState(() => (requestedMember || connected[0] || ''));
  const [businessId, setBusinessId] = useState(requestedBusiness);
  const [date, setDate] = useState(defaultMeetingTime);
  const [alternate, setAlternate] = useState('');
  const [mode, setMode] = useState<Meeting['mode']>('Online');
  const [location, setLocation] = useState('Video meeting');
  const [agenda, setAgenda] = useState('Business introduction and collaboration discussion.');
  const [show, setShow] = useState(() => Boolean(requestedMember));
  const [error, setError] = useState('');

  const selectableMembers = useMemo(() => {
    const list = [...connected];
    if (requestedMember) {
      const slug = toMemberSlug(requestedMember) || requestedMember;
      if (!list.includes(slug)) list.unshift(slug);
    }
    if (target) {
      const slug = toMemberSlug(target) || target;
      if (!list.includes(slug)) list.unshift(slug);
    }
    return [...new Set(list)];
  }, [connected, requestedMember, target]);

  useEffect(() => {
    if (requestedMember) {
      setTarget(requestedMember);
      setShow(true);
    } else if (!target && selectableMembers.length > 0) {
      setTarget(selectableMembers[0]);
    }
  }, [requestedMember, selectableMembers, target]);

  useEffect(() => {
    if (requestedBusiness) setBusinessId(requestedBusiness);
  }, [requestedBusiness]);

  const localRows = useMemo(() => meetings.filter(m => {
    const inView = view === 'all' ? true : view === 'completed'
      ? m.status === 'completed'
      : view === 'cancelled'
        ? ['cancelled', 'declined'].includes(m.status)
        : view === 'action'
          ? (m.status === 'proposed' || m.status === 'alternate-proposed') && m.recipientId === memberId
          : !['completed', 'cancelled', 'declined'].includes(m.status);
    const statusMatch = !requestedStatus || (requestedStatus === 'pending-response' ? (m.recipientId === memberId && ['proposed','alternate-proposed'].includes(m.status)) : requestedStatus === 'follow-up' ? (m.status === 'completed' && !m.followUp?.trim()) : requestedStatus === 'outcome-recorded' ? (m.status === 'completed' && Boolean(m.outcome?.trim())) : m.status === requestedStatus);
    const directionMatch = !requestedDirection || (requestedDirection === 'initiated' ? m.requesterId === memberId : requestedDirection === 'received' ? m.recipientId === memberId : true);
    const periodMatch = !sp.get('period') || inPeriod(m.dateTime, analyticsPeriod);
    return inView && statusMatch && directionMatch && periodMatch;
  }).sort((a,b)=>a.dateTime.localeCompare(b.dateTime)), [meetings,view,requestedStatus,requestedDirection,periodKey,analyticsPeriod.start,analyticsPeriod.end,memberId]);

  const meetingRequest = useMemo(() => ({
    queryId: 'member.meetings.list',
    domain: 'member' as const,
    pagination: { pageSize: 40 },
    sort: [{ field: 'dateTime', direction: 'asc' as const }],
    parameters: {
      viewerMemberId: memberId,
      view,
      status: requestedStatus || undefined,
      direction: requestedDirection || undefined,
      period: sp.get('period') ?? undefined
    }
  }), [memberId, view, requestedStatus, requestedDirection, periodKey]);

  const meetingQuery = useDomainCursorPage<any>(meetingRequest, localRows, [memberId, view, requestedStatus, requestedDirection, periodKey]);
  useRealtimeRefresh(['meeting.*', 'transaction.*'], meetingQuery.reload);

  const rawMeetings: any[] = meetingQuery.page?.items ?? (env.useMocks ? localRows : []);

  const visibleMeetings = useMemo(() => {
    return rawMeetings.map((raw: any): Meeting => {
      const fromSlug = toMemberSlug(raw.fromMemberId ?? raw.requesterId) || (raw.fromMemberId ?? raw.requesterId);
      const toSlug = toMemberSlug(raw.toMemberId ?? raw.recipientId) || (raw.toMemberId ?? raw.recipientId);
      const participantIds = Array.isArray(raw.participantIds) && raw.participantIds.length > 0
        ? raw.participantIds
        : [fromSlug, toSlug].filter(Boolean);

      const otherSlug = fromSlug === memberId ? toSlug : fromSlug;
      const otherMember = memberEntities[otherSlug] || memberEntities[toMemberSlug(otherSlug)];
      const rawStatus = String(raw.status ?? 'proposed').toLowerCase();
      let status: Meeting['status'] = 'proposed';
      if (rawStatus === 'confirmed' || rawStatus === 'scheduled') status = 'confirmed';
      else if (rawStatus === 'completed') status = 'completed';
      else if (rawStatus === 'cancelled') status = 'cancelled';
      else if (rawStatus === 'declined') status = 'declined';
      else if (rawStatus === 'alternate-proposed' || rawStatus === 'timeproposed') status = 'alternate-proposed';

      return {
        id: String(raw.id),
        participantIds,
        requesterId: fromSlug,
        recipientId: toSlug,
        title: raw.title || (raw.otherMemberName ? `One-to-one with ${raw.otherMemberName}` : (otherMember ? `One-to-one with ${otherMember.name}` : 'One-to-One Meeting')),
        dateTime: raw.dateTime || raw.confirmedAt || raw.proposedAt || new Date().toISOString(),
        alternateDateTime: raw.alternateDateTime,
        mode: raw.mode || 'Online',
        location: raw.location || 'Video meeting',
        agenda: raw.agenda || 'Business introduction and collaboration discussion.',
        status,
        outcome: raw.outcome,
        followUp: raw.followUp ?? raw.followUpAt,
        businessId: raw.businessId,
        opportunityId: raw.opportunityId,
        referenceId: raw.referenceId,
        version: raw.version ? String(raw.version) : undefined,
      };
    }).filter((m: Meeting) => {
      const inView = view === 'all' ? true : view === 'completed'
        ? m.status === 'completed'
        : view === 'cancelled'
          ? ['cancelled', 'declined'].includes(m.status)
          : view === 'action'
            ? (m.status === 'proposed' || m.status === 'alternate-proposed') && (m.recipientId === memberId || toMemberSlug(m.recipientId) === memberId)
            : !['completed', 'cancelled', 'declined'].includes(m.status);
      const statusMatch = !requestedStatus || (requestedStatus === 'pending-response' ? (m.recipientId === memberId && ['proposed','alternate-proposed'].includes(m.status)) : requestedStatus === 'follow-up' ? (m.status === 'completed' && !m.followUp?.trim()) : requestedStatus === 'outcome-recorded' ? (m.status === 'completed' && Boolean(m.outcome?.trim())) : m.status === requestedStatus);
      const directionMatch = !requestedDirection || (requestedDirection === 'initiated' ? m.requesterId === memberId : requestedDirection === 'received' ? m.recipientId === memberId : true);
      const periodMatch = !sp.get('period') || inPeriod(m.dateTime, analyticsPeriod);
      return inView && statusMatch && directionMatch && periodMatch;
    }).sort((a: Meeting, b: Meeting) => a.dateTime.localeCompare(b.dateTime));
  }, [rawMeetings, memberId, memberEntities, view, requestedStatus, requestedDirection, sp, analyticsPeriod]);

  const actionCount = visibleMeetings.filter(m => (m.status === 'proposed' || m.status === 'alternate-proposed') && (m.recipientId === memberId || toMemberSlug(m.recipientId) === memberId)).length;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    command.clearError();
    if (!target || !date || !agenda.trim()) {
      setError('Select a connected member, date/time and a clear meeting agenda.');
      return;
    }
    const primary = new Date(date);
    if (primary.getTime() <= serverClock.nowMs()) {
      setError('Choose a future meeting time.');
      return;
    }
    if (alternate && new Date(alternate).getTime() <= serverClock.nowMs()) {
      setError('Choose a future alternate time or leave it blank.');
      return;
    }
    const person = memberEntities[target] || memberEntities[toMemberSlug(target)];
    const titleBusiness = businessId ? businessEntities[businessId] : undefined;
    const previewPayload = {
      participantIds: [memberId, target],
      requesterId: memberId,
      recipientId: target,
      title: titleBusiness ? `Business discussion · ${titleBusiness.name}` : `One-to-one with ${person?.name ?? 'Member'}`,
      dateTime: primary.toISOString(),
      alternateDateTime: alternate ? new Date(alternate).toISOString() : undefined,
      mode,
      location: location.trim() || mode,
      agenda: agenda.trim(),
      status: 'proposed' as const,
      businessId: businessId || undefined,
      opportunityId: requestedOpportunity || undefined,
      referenceId: requestedReference || undefined,
    };
    const payload = { id: meetingId.current, ...previewPayload };
    const result = await command.execute({
      domain: 'member',
      policyId: 'meeting.create',
      command: 'meeting.create',
      aggregateType: 'Meeting',
      aggregateId: meetingId.current,
      payload,
      previewAction: () => {
        dispatch(createMeeting(previewPayload));
        dispatch(addNotification({
          memberId: target,
          text: `${memberEntities[memberId]?.name ?? 'A member'} requested a one-to-one meeting`,
          href: '/app/one-to-one?view=action'
        }));
      }
    });
    if (!result.ok) return;
    toast.success('Meeting request sent successfully!');
    meetingId.current = stableClientId('meeting');
    setShow(false);
    setDate(defaultMeetingTime());
    setAlternate('');
    setAgenda('Business introduction and collaboration discussion.');
    setError('');
    meetingQuery.reload();
  };

  const setView = (next: ViewKey) => {
    const params = new URLSearchParams(sp);
    params.set('view', next);
    setSp(params, { replace: true });
  };

  return (
    <div>
      <PageHead
        eyebrow="Relationship workflow"
        title="One-to-One Meetings"
        description="Schedule, complete and follow up One-to-One business meetings."
        actions={<Button onClick={() => setShow(v => !v)} disabled={!selectableMembers.length}><Plus className="size-4" />Schedule meeting</Button>}
      />

      <div className="mb-5"><CommandExecutionFeedback error={command.error} onRetry={()=>void command.retry()} onDismiss={command.clearError}/></div>
      <section className="mb-5"><div className="mb-2 flex items-center justify-between gap-3"><div><h2 className="font-black text-[var(--navy-950)]">One-to-One progress</h2><p className="text-sm text-slate-500">Initiated, received, completed and follow-up activity.</p></div></div><AnalyticsSummary items={intelligence.relationships.meetings} onOpen={route=>go(route,{label:'One-to-One Analytics'})}/></section>

      {actionCount > 0 && (
        <div className="mb-5">
          <ContextBanner title={`${actionCount} meeting invitation${actionCount === 1 ? '' : 's'} ${actionCount === 1 ? 'needs' : 'need'} your decision`} action={<Button onClick={() => setView('action')}>Review invitations</Button>}>
            Confirm, decline or propose a new time so the other participant knows what happens next.
          </ContextBanner>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <Button key={key} variant={view === key ? 'default' : 'secondary'} onClick={() => setView(key)}>
            {label}{key === 'action' && actionCount > 0 ? ` (${actionCount})` : ''}
          </Button>
        ))}
      </div>

      {!selectableMembers.length && <div className="mb-5"><Tip>Connect with a member before scheduling a one-to-one meeting.</Tip></div>}

      {show && (
        <Card className="mb-6 max-w-4xl p-5 sm:p-6">
          <form className="grid gap-5" onSubmit={submit}>
            <div>
              <h2 className="text-xl font-black text-[var(--navy-950)]">Schedule a focused business conversation</h2>
              <p className="mt-1 text-base leading-6 text-slate-600">Keep the participant, business context, timing and agenda together so the meeting remains useful later.</p>
            </div>
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-700">{error}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-bold">Connected member
                <select required className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base" value={target} onChange={e => setTarget(e.target.value)}>
                  {selectableMembers.map(id => {
                    const slug = toMemberSlug(id);
                    const serverInfo = serverMemberInfoMap.get(id) || (slug ? serverMemberInfoMap.get(slug) : undefined);
                    const member = serverInfo || memberEntities[slug] || memberEntities[id] || (slug === 'member-secretary' ? { name: 'Meera Narayanan', chapter: 'Hosur Chapter' } : slug === 'member-member' ? { name: 'Anand Kumar', chapter: 'Hosur Chapter' } : { name: 'Member', chapter: 'Hosur Chapter' });
                    return <option key={id} value={slug || id}>{member.name} · {member.chapter}</option>;
                  })}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-bold">Related business <span className="font-normal text-slate-500">Optional</span>
                <select className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base" value={businessId} onChange={e => setBusinessId(e.target.value)}>
                  <option value="">No specific business</option>
                  {businesses.filter(b => b.visibility !== 'hidden').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Proposed date and time" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
              <Input label="Alternate date and time (optional)" type="datetime-local" value={alternate} onChange={e => setAlternate(e.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-bold">Mode
                <select className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base" value={mode} onChange={e => { const next = e.target.value as Meeting['mode']; setMode(next); setLocation(next === 'Online' ? 'Video meeting' : next === 'Phone' ? 'Phone call' : ''); }}>
                  <option>Online</option><option>In person</option><option>Phone</option>
                </select>
              </label>
              <Input label={mode === 'In person' ? 'Venue / location' : mode === 'Phone' ? 'Phone / call note' : 'Meeting link / platform'} value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <label className="grid gap-1.5 text-sm font-bold">Agenda
              <textarea rows={4} className="rounded-xl border border-slate-300 p-3 text-base font-normal leading-6" value={agenda} onChange={e => setAgenda(e.target.value)} placeholder="What should both participants prepare or decide?" />
            </label>
            <div className="flex flex-wrap gap-2"><Button type="submit">Send meeting request</Button><Button type="button" variant="secondary" onClick={() => setShow(false)}>Cancel</Button></div>
          </form>
        </Card>
      )}

      {meetingQuery.loading&&!meetingQuery.page&&<QueryLoading label="Loading meetings…"/>}{meetingQuery.error&&<QueryError error={meetingQuery.error} onRetry={meetingQuery.reload}/>}
      <div className="grid gap-4">
        {visibleMeetings.map(meeting => {
          const others = (meeting.participantIds || []).filter(id => id !== memberId).map(id => memberEntities[id] || memberEntities[toMemberSlug(id)]).filter(Boolean);
          const business = meeting.businessId ? businessEntities[meeting.businessId] : undefined;
          return (
            <button type="button" key={meeting.id} onClick={() => go(`/app/meetings/${meeting.id}`, { label: 'One-to-One Meetings' })} className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-sky-300 focus-visible:ring-3 focus-visible:ring-sky-100">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-800"><CalendarDays className="size-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black text-[var(--navy-950)]">{meeting.title}</h2><p className="mt-1 text-base text-slate-600">{others.map(x => x?.name).join(', ') || 'Member meeting'}</p></div><EnterpriseStatus status={meeting.status} tone={meeting.status === 'confirmed' || meeting.status === 'completed' ? 'success' : meeting.status === 'cancelled' || meeting.status === 'declined' ? 'danger' : 'warning'} /></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3"><div><div className="text-sm font-bold text-slate-500">When</div><div className="mt-1 text-base font-semibold">{new Date(meeting.dateTime || serverClock.nowMs()).toLocaleString('en-IN')}</div></div><div><div className="text-sm font-bold text-slate-500">Mode</div><div className="mt-1 text-base font-semibold">{meeting.mode}</div></div><div><div className="text-sm font-bold text-slate-500">Business context</div><div className="mt-1 text-base font-semibold">{business?.name ?? 'General networking'}</div></div></div>
                  <p className="mt-4 line-clamp-2 text-base leading-6 text-slate-600">{meeting.agenda}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-slate-400" />
              </div>
            </button>
          );
        })}
        {!visibleMeetings.length && !meetingQuery.loading && <EmptyState title="No meetings in this view" body="Choose another meeting view or schedule a focused one-to-one with a connected member." action={selectableMembers.length ? <Button onClick={() => setShow(true)}>Schedule meeting</Button> : <Button onClick={() => go('/app/directory', { label: 'Meetings' })}>Discover members</Button>} />}
      </div>
      <div className="mt-4 flex justify-between"><Button variant="secondary" onClick={meetingQuery.previous} disabled={!meetingQuery.canPrevious}>Previous</Button><Button variant="secondary" onClick={meetingQuery.next} disabled={!meetingQuery.canNext}>Next</Button></div>
    </div>
  );
}
