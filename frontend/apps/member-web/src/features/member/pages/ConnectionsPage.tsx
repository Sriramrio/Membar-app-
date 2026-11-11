import { serverClock } from '@/services/time/serverClock';
import { stableClientId } from '@/utils/stableId';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, MessageSquare, ShieldOff, UserRoundCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { ContextBanner, EnterpriseStatus } from '@/features/member/components/EnterpriseMemberUI';
import { EmptyState, PageHead, SearchField } from '@/features/network/components/NetworkUI';
import { activeMemberId, directConversationBetween, businessForMember, selectActiveMember } from '@/features/network/selectors';
import {
  blockMember,
  cancelConnectionRequest,
  createConversation,
  removeConnection,
  respondConnection,
} from '@/features/network/networkSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { converseThreadPath } from '@/features/member/navigation/converseRoute';
import { MemberJourneyScopeBar } from '@/features/member/components/MemberJourneyScopeBar';
import { useMemberJourneyScope } from '@/features/member/navigation/useMemberJourneyScope';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';

const tabs = [
  ['connected', 'Connected'],
  ['received', 'Received'],
  ['sent', 'Sent'],
  ['blocked', 'Blocked'],
] as const;

function relativeDate(value: string) {
  const diff = serverClock.nowMs() - new Date(value).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import type { Connection } from '@/features/network/types';
import { toGuid, toMemberSlug } from '@/services/api/guidUtils';

export default function ConnectionsPage() {
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const { go } = useMemberNavigation();
  const [params, setParams] = useSearchParams();
  const { scope, setScope } = useMemberJourneyScope();
  const memberId = useAppSelector(activeMemberId);
  const network=useNetworkSlice(['affiliations', 'businesses', 'connections', 'conversations', 'meetings', 'members', 'references'] as const);
  const activeMember = useAppSelector(selectActiveMember);
  const viewer = activeMember || network.members.find(m => m.id === memberId) || {
    id: memberId,
    name: 'Akash Velan',
    chapter: 'Coimbatore Chapter',
  };
  const [q, setQ] = useState('');
  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string } | null>(null);
  const requested = params.get('status') ?? 'connected';

  const connectionsRequest = useMemo(() => ({
    queryId: 'member.connections.list',
    domain: 'member' as const,
    pagination: { pageSize: 50 },
    parameters: { memberId }
  }), [memberId]);

  const connectionsQuery = useDomainCursorPage<any>(connectionsRequest, [], [memberId]);
  useRealtimeRefresh(['connection.*'], connectionsQuery.reload);
  const serverConnections = connectionsQuery.page?.items ?? [];

  const normalized = useMemo(() => {
    const myGuid = toGuid(memberId).toLowerCase();

    // If server connections exist, use them exclusively to avoid stale Redux mocks
    if (serverConnections.length > 0) {
      return serverConnections.map((sc: any) => {
        const initGuid = String(sc.initiatorId ?? '').toLowerCase();
        const otherGuid = String(sc.otherMemberId ?? '').toLowerCase();
        const actorGuid = sc.currentMemberId ? String(sc.currentMemberId).toLowerCase() : myGuid;
        const isInitiator = typeof sc.isInitiator === 'boolean'
          ? sc.isInitiator
          : (initGuid === myGuid || initGuid === actorGuid);
        const otherSlug = toMemberSlug(otherGuid) || otherGuid;

        const rawState = String(sc.state ?? '');
        let baseStatus: 'connected' | 'sent' | 'received' | 'blocked' = 'sent';
        if (rawState === 'Accepted' || rawState === 'Connected' || rawState === '1') baseStatus = 'connected';
        else if (rawState === 'Blocked' || rawState === '2') baseStatus = 'blocked';
        else baseStatus = isInitiator ? 'sent' : 'received';

        const connObj: Connection = {
          id: String(sc.id),
          ownerId: isInitiator ? memberId : otherSlug,
          targetId: isInitiator ? otherSlug : memberId,
          status: baseStatus,
          updatedAt: sc.updatedAt ?? new Date().toISOString()
        };

        const member = {
          id: otherSlug,
          name: sc.otherMemberName || 'Network Member',
          designation: sc.otherMemberDesignation || 'Managing Director',
          chapter: sc.otherMemberChapter || 'Coimbatore Chapter',
          city: sc.otherMemberCity || 'Coimbatore',
          region: 'Tamil Nadu',
          state: 'Tamil Nadu',
          country: 'India',
          bio: `${sc.otherMemberDesignation || 'Leader'} at ${sc.otherMemberCompany || 'Enterprise'}, focused on dependable collaboration.`,
          expertise: ['Pilot to production', 'B2B supply'],
          email: sc.otherMemberEmail || '',
          phone: '',
          avatarText: sc.otherMemberAvatar || (sc.otherMemberName ? sc.otherMemberName.slice(0, 2).toUpperCase() : 'NM'),
          profileCompleteness: 90,
          status: 'active' as const,
          verificationStatus: 'verified' as const,
        };

        const business = {
          id: `biz-${otherGuid}`,
          name: sc.otherMemberCompany || 'Enterprise',
          city: sc.otherMemberCity || 'Coimbatore',
          chapter: sc.otherMemberChapter || 'Coimbatore Chapter',
          categoryIds: ['cat-001'],
          region: 'Tamil Nadu',
          state: 'Tamil Nadu',
          country: 'India',
          description: `${sc.otherMemberCompany || 'Enterprise'} operates with verified industrial B2B supply commitments.`,
          capabilities: ['B2B supply', 'Pilot to production'],
          products: [],
          services: [],
          logoText: (sc.otherMemberCompany || 'BZ').slice(0, 2).toUpperCase(),
          verified: true,
        };

        return {
          c: connObj,
          member,
          business,
          status: baseStatus,
          upcoming: undefined,
          lastMeeting: undefined,
          references: []
        };
      });
    }

    // Fallback if no server data loaded yet
    return [];
  }, [serverConnections, memberId]);

  const allConnections = useMemo(() => normalized.map(x => x.c), [normalized]);

  const counts = Object.fromEntries(tabs.map(([key]) => [key, normalized.filter(x => x.status === key).length]));
  const rows = useMemo(
    () =>
      normalized.filter(x =>
        x.member &&
        (!q || `${x.member.name} ${x.member.chapter} ${x.member.designation} ${x.business?.name ?? ''} ${x.c.purpose ?? ''}`.toLowerCase().includes(q.toLowerCase())) &&
        (requested === 'all' || x.status === requested) &&
        (scope !== 'chapter' || x.member.chapter === viewer?.chapter),
      ),
    [normalized, q, requested, scope, viewer?.chapter],
  );

  const setStatus = (status: string) => {
    const next = new URLSearchParams(params);
    next.set('status', status);
    setParams(next, { replace: true });
  };

  const message = async (targetId: string, businessId?: string) => {
    const existing = directConversationBetween(network, memberId, targetId);
    if (existing) return go(converseThreadPath(existing.id, businessId ? `business:${businessId}` : undefined), { label: 'Connections' });
    const conversationId = stableClientId('conversation');
    const previewPayload={ ownerId: memberId, targetId, conversationId, context: businessId ? `business:${businessId}` : undefined };
    const result=await command.execute({domain:'member',policyId:'converse.conversation.create',command:'converse.conversation.create',aggregateType:'Conversation',aggregateId:conversationId,payload:previewPayload,previewAction:()=>dispatch(createConversation(previewPayload))});
    if(result.ok) {
      const r = result as Record<string, any>;
      const serverConvId = r.result?.data?.id ?? r.result?.id ?? r.data?.id ?? conversationId;
      dispatch(createConversation({ ownerId: memberId, targetId, conversationId: String(serverConvId), context: businessId ? `business:${businessId}` : undefined }));
      go(converseThreadPath(String(serverConvId), businessId ? `business:${businessId}` : undefined), { label: 'Connections' });
    }
  };


  const connectionFor=(targetId:string)=>allConnections.find(c=>(c.ownerId===memberId&&c.targetId===targetId)||(c.ownerId===targetId&&c.targetId===memberId));
  const runConnectionCommand=async(policyId:string,commandName:string,targetId:string,payload:Record<string,unknown>,previewAction:()=>void)=>{
    const current=connectionFor(targetId);
    const res = await command.execute({domain:'member',policyId,command:commandName,aggregateType:'Connection',aggregateId:current?.id??`${memberId}:${targetId}`,expectedVersion:current?.version,payload,previewAction});
    if (res.ok) connectionsQuery.reload();
    return res;
  };

  const receivedCount = counts.received ?? 0;

  return (
    <div>
      <PageHead
        eyebrow="Relationship management"
        title="Connections"
        description="Continue relationships through Converse, meetings, references and follow-up."
        actions={<Button onClick={() => go('/app/suggestions', { label: 'Connections' })}>Find relevant people</Button>}
      />

      <div className="mb-5"><CommandExecutionFeedback error={command.error} onRetry={()=>void command.retry()} onDismiss={command.clearError}/></div>

      <MemberJourneyScopeBar value={scope} onChange={setScope} className="mb-5" />

      {receivedCount > 0 && (
        <div className="mb-5">
          <ContextBanner title={`${receivedCount} connection request${receivedCount === 1 ? '' : 's'} need your response`} action={<Button onClick={() => setStatus('received')}>Review requests</Button>}>
            Respond to requests while the business context is still fresh. Accepted connections unlock richer collaboration actions while privacy rules still apply.
          </ContextBanner>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <Button key={key} variant={requested === key ? 'default' : 'secondary'} onClick={() => setStatus(key)}>
            {label} <span className="ml-1 opacity-75">{counts[key] ?? 0}</span>
          </Button>
        ))}
      </div>

      <SearchField value={q} onChange={setQ} placeholder="Search by member, business, chapter or connection purpose…" />

      <div className="mt-5 grid gap-4">
        {rows.map(({ c, member, business, status, upcoming, lastMeeting, references }) => member && (
          <Card key={c.id} className="p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-800"><UserRoundCheck className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <button type="button" className="text-left text-lg font-black text-[var(--navy-950)] hover:text-sky-700 hover:underline" onClick={() => go(`/app/members/${member.id}`, { label: 'Connections' })}>{member.name}</button>
                    <div className="mt-1 text-base text-slate-600">{member.designation}{business ? ` · ${business.name}` : ''}</div>
                    <div className="mt-1 text-sm text-slate-500">{member.city} · {member.chapter}</div>
                  </div>
                  <EnterpriseStatus status={String(status)} tone={status === 'connected' ? 'success' : status === 'blocked' ? 'danger' : 'info'} />
                </div>

                {(c.purpose || c.note) && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    {c.purpose && <p className="text-sm font-black text-slate-700">Purpose: {c.purpose}</p>}
                    {c.note && <p className="mt-1 text-base leading-6 text-slate-600">{c.note}</p>}
                  </div>
                )}

                {status === 'connected' && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 p-3"><div className="text-sm font-bold text-slate-500">Connected</div><div className="mt-1 text-base font-semibold">{relativeDate(c.updatedAt)}</div></div>
                    <div className="rounded-xl border border-slate-200 p-3"><div className="text-sm font-bold text-slate-500">Last meeting</div><div className="mt-1 text-base font-semibold">{lastMeeting ? relativeDate(lastMeeting.dateTime) : 'No completed meeting'}</div></div>
                    <div className="rounded-xl border border-slate-200 p-3"><div className="text-sm font-bold text-slate-500">References</div><div className="mt-1 text-base font-semibold">{references.length}</div></div>
                  </div>
                )}

                {upcoming && (
                  <button type="button" className="mt-4 flex w-full items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-3 text-left hover:bg-violet-100" onClick={() => go(`/app/meetings/${upcoming.id}`, { label: 'Connections' })}>
                    <CalendarDays className="size-5 text-violet-700" />
                    <span className="min-w-0 flex-1"><strong className="block text-base text-violet-950">Upcoming: {upcoming.title}</strong><span className="text-sm text-violet-800">{new Date(upcoming.dateTime).toLocaleString('en-IN')}</span></span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 xl:max-w-[360px] xl:justify-end">
                {status === 'received' && (
                  <>
                    <Button onClick={() => void runConnectionCommand('connection.respond','connection.respond',member.id,{ownerId:memberId,targetId:member.id,status:'connected'},()=>dispatch(respondConnection({ ownerId: memberId, targetId: member.id, status: 'connected' })))}>Accept</Button>
                    <Button variant="secondary" onClick={() => void runConnectionCommand('connection.respond','connection.respond',member.id,{ownerId:memberId,targetId:member.id,status:'declined'},()=>dispatch(respondConnection({ ownerId: memberId, targetId: member.id, status: 'declined' })))}>Decline</Button>
                  </>
                )}
                {status === 'sent' && <Button variant="secondary" onClick={() => void runConnectionCommand('connection.cancel','connection.cancel',member.id,{ownerId:memberId,targetId:member.id},()=>dispatch(cancelConnectionRequest({ ownerId: memberId, targetId: member.id })))}>Cancel request</Button>}
                {status === 'connected' && (
                  <>
                    <Button disabled={command.busy} onClick={() => void message(member.id, business?.id)}><MessageSquare className="size-4" />Converse</Button>
                    <Button variant="secondary" onClick={() => go(`/app/one-to-one?member=${member.id}${business ? `&business=${business.id}` : ''}`, { label: 'Connections' })}>Meeting</Button>
                    <Button variant="secondary" onClick={() => go(`/app/references?member=${member.id}`, { label: 'Connections' })}>References</Button>
                    <Button variant="ghost" onClick={() => void runConnectionCommand('connection.remove','connection.remove',member.id,{memberId,targetId:member.id},()=>dispatch(removeConnection({ memberId, targetId: member.id })))}>Remove</Button>
                  </>
                )}
                {status !== 'blocked' && <Button variant="danger" onClick={() => setBlockTarget({ id: member.id, name: member.name })}><ShieldOff className="size-4" />Block</Button>}
              </div>
            </div>
          </Card>
        ))}
        {!rows.length && <EmptyState title="No relationships in this view" body="Adjust the search or status filter, or discover relevant members and businesses from the directory." action={<Button onClick={() => go('/app/directory', { label: 'Connections' })}>Discover members</Button>} />}
      </div>

      <ActionDialog
        open={Boolean(blockTarget)}
        title={`Block ${blockTarget?.name ?? 'member'}?`}
        description="Blocking prevents direct interaction and removes the relationship from normal collaboration flows."
        confirmLabel="Block member"
        confirmVariant="danger"
        onClose={() => setBlockTarget(null)}
        onConfirm={() => { if (blockTarget) void runConnectionCommand('connection.block','connection.block',blockTarget.id,{memberId,targetId:blockTarget.id},()=>dispatch(blockMember({ memberId, targetId: blockTarget.id }))).then(r=>{if(r.ok)setBlockTarget(null)}); }}
      />
    </div>
  );
}
