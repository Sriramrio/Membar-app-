import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Archive, CalendarDays, LogOut, Pin, Reply, Send, UserRound, VolumeX } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ContextBanner } from '@/features/member/components/EnterpriseMemberUI';
import { PageHead, StatusPill } from '@/features/network/components/NetworkUI';
import { activeMemberId, selectActiveMember } from '@/features/network/selectors';
import { joinChapterConversation, leaveChapterConversation, markConversationRead, sendMessage, toggleConversationFlag, upsertConversation } from '@/features/network/networkSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { toast } from '@/components/ui/Toast';
import { selectMemberEntities, selectConversationEntities, selectMessagesByConversation, selectBusinessEntities, selectOpportunityEntities, selectMeetingEntities, selectReferences, selectEvents } from '@/features/network/readModel';
import type { Conversation, Message } from '@/features/network/types';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { QueryError, QueryLoading } from '@/components/data/QueryState';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { stableClientId } from '@/utils/stableId';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { apiClient } from '@/services/api/apiClient';
import { toGuid, toMemberSlug } from '@/services/api/guidUtils';

export default function ConverseThreadPage() {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const { go, back } = useMemberNavigation();
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const memberId = useAppSelector(activeMemberId);
  const memberEntities = useAppSelector(selectMemberEntities);
  const conversationEntities = useAppSelector(selectConversationEntities);
  const messagesByConversation = useAppSelector(selectMessagesByConversation);
  const businessEntities = useAppSelector(selectBusinessEntities);
  const opportunityEntities = useAppSelector(selectOpportunityEntities);
  const meetingEntities = useAppSelector(selectMeetingEntities);
  const references = useAppSelector(selectReferences);
  const events = useAppSelector(selectEvents);
  const promotions = useAppSelector(s => s.network.promotions);

  const [serverConversation, setServerConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    apiClient.get<any>(`/messages/conversations/${conversationId}`)
      .then(res => {
        if (res) {
          const item: Conversation = {
            id: String(res.id),
            kind: (res.kind ?? 'direct') as Conversation['kind'],
            subject: res.subject ?? 'Direct Message',
            participantIds: Array.isArray(res.participantIds) ? res.participantIds : [String(res.otherMemberId ?? '')],
            updatedAt: res.updatedAt ?? new Date().toISOString(),
            unreadBy: [],
            ...(res.otherMemberName ? { otherMemberName: res.otherMemberName } : {}),
          } as Conversation;
          setServerConversation(item);
          dispatch(upsertConversation(item));
        }
      })
      .catch(() => {});
  }, [conversationId, dispatch]);

  const activeMember = useAppSelector(selectActiveMember);
  const member = activeMember || memberEntities[memberId];
  const candidate = (conversationId ? conversationEntities[conversationId] : undefined) ?? serverConversation ?? undefined;

  const myGuid = toGuid(memberId).toLowerCase();
  const isParticipant = candidate ? (candidate.participantIds.includes(memberId) || candidate.participantIds.some(p => {
    const pLower = p.toLowerCase();
    return pLower === memberId || toMemberSlug(pLower) === memberId || toGuid(pLower).toLowerCase() === myGuid;
  })) : false;

  const c = isParticipant ? candidate : undefined;
  const canJoinChapterConversation = Boolean(member && candidate && (candidate.kind === 'chapter' || candidate.kind === 'chapter-group') && candidate.chapter === member.chapter && member.status !== 'suspended');

  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string>();
  const timelineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    command.clearError();
    if (c) void command.execute({
      domain: 'member',
      policyId: 'converse.conversation.read',
      command: 'converse.conversation.read',
      aggregateType: 'Conversation',
      aggregateId: c.id,
      expectedVersion: c.version,
      payload: { conversationId: c.id },
      previewAction: () => dispatch(markConversationRead({ conversationId: c.id, memberId }))
    });
  }, [c?.id, memberId]);

  useEffect(() => {
    if (c) requestAnimationFrame(() => timelineRef.current?.scrollTo({ top: timelineRef.current.scrollHeight }));
  }, [c?.id]);

  const join = async (conversation: NonNullable<typeof candidate>) => {
    const result = await command.execute({
      domain: 'member',
      policyId: 'converse.conversation.join',
      command: 'converse.conversation.join',
      aggregateType: 'Conversation',
      aggregateId: conversation.id,
      expectedVersion: conversation.version,
      payload: { conversationId: conversation.id },
      previewAction: () => dispatch(joinChapterConversation({ conversationId: conversation.id, memberId }))
    });
    if (result.ok) toast.success(conversation.kind === 'chapter' ? 'Chapter Converse opened' : 'Chapter group joined');
  };

  const mutateFlag = (flag: 'pinned' | 'muted' | 'archived') =>
    command.execute({
      domain: 'member',
      policyId: 'converse.conversation.flag',
      command: 'converse.conversation.flag',
      aggregateType: 'Conversation',
      aggregateId: c!.id,
      expectedVersion: c!.version,
      payload: { conversationId: c!.id, flag },
      previewAction: () => dispatch(toggleConversationFlag({ conversationId: c!.id, memberId, flag }))
    });

  const leave = async () => {
    if (!c) return;
    const result = await command.execute({
      domain: 'member',
      policyId: 'converse.conversation.leave',
      command: 'converse.conversation.leave',
      aggregateType: 'Conversation',
      aggregateId: c.id,
      expectedVersion: c.version,
      payload: { conversationId: c.id },
      previewAction: () => dispatch(leaveChapterConversation({ conversationId: c.id, memberId }))
    });
    if (result.ok) {
      toast.info(`Left ${c.groupName ?? c.subject}`);
      back('/app/messages');
    }
  };

  const convId = c?.id ?? conversationId ?? '';
  const localMessages = useMemo(() => [...(messagesByConversation[convId] ?? [])].reverse(), [messagesByConversation, convId]);
  const messageRequest = useMemo(() => ({
    queryId: 'member.converse.messages',
    domain: 'member' as const,
    filters: [{ field: 'conversationId', operator: 'eq' as const, value: convId }],
    sort: [{ field: 'createdAt', direction: 'desc' as const }],
    pagination: { pageSize: 50 },
    parameters: { memberId, conversationId: convId }
  }), [convId, memberId]);

  const messageQuery = useDomainCursorPage<Message>(messageRequest, localMessages, [convId, memberId]);
  useRealtimeRefresh(['message.*', 'conversation.*'], messageQuery.reload);
  const msgs = useMemo(() => [...(messageQuery.page?.items ?? [])].reverse(), [messageQuery.page?.items]);
  const messageEntities = useMemo(() => Object.fromEntries((messagesByConversation[convId] ?? []).map(m => [m.id, m])), [messagesByConversation, convId]);

  if (!c) {
    if (!serverConversation && conversationId) {
      return (
        <div className="p-6">
          <QueryLoading label="Loading Converse thread…" />
        </div>
      );
    }
    return (
      <>
        <PageHead title="Converse" />
        <Card>
          <h2 className="text-lg font-black">{canJoinChapterConversation ? 'Join this Chapter conversation' : 'Converse unavailable'}</h2>
          <p className="mt-2 text-base text-slate-600">
            {canJoinChapterConversation
              ? 'This Chapter conversation is available to your active Chapter membership. Join it to continue the discussion.'
              : 'This thread is unavailable in your current Member or Chapter context. It may be archived, restricted or require membership.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {canJoinChapterConversation && candidate && (
              <Button disabled={command.busy} onClick={() => void join(candidate)}>
                {candidate.kind === 'chapter' ? 'Open Chapter Converse' : 'Join group'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => back('/app/messages')}>Back to Converse</Button>
          </div>
        </Card>
      </>
    );
  }

  const kind = c.kind ?? 'direct';

  const otherParticipantId = c.participantIds.find(p => {
    const pLower = p.toLowerCase();
    return pLower !== memberId && toMemberSlug(pLower) !== memberId && toGuid(pLower).toLowerCase() !== myGuid;
  });
  const otherSlug = otherParticipantId ? toMemberSlug(otherParticipantId) : '';
  const otherMember = (otherSlug ? memberEntities[otherSlug] : undefined) || (otherParticipantId ? memberEntities[otherParticipantId] : undefined);
  const otherName = (c as any).otherMemberName ?? (otherSlug === 'member-secretary' ? 'Meera Narayanan' : otherSlug === 'member-member' ? 'Anand Kumar' : 'Member');
  const other = kind === 'direct' ? (otherMember ?? (otherParticipantId ? {
    id: otherSlug || otherParticipantId,
    name: String(otherName),
    designation: 'Member',
    chapter: 'Hosur Chapter',
    city: 'Hosur',
    region: 'Tamil Nadu North',
    state: 'Tamil Nadu',
    country: 'India',
    bio: '',
    expertise: [],
    email: '',
    phone: '',
    avatarText: 'M',
    profileCompleteness: 80,
  } : undefined)) : undefined;

  const people: string[] = [];
  c.participantIds.forEach(id => {
    const slug = toMemberSlug(id);
    const m = (slug ? memberEntities[slug] : undefined) || memberEntities[id];
    if (m?.name) people.push(m.name);
  });
  if (!people.length && other?.name) people.push(other.name);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || command.busy) return;
    command.clearError();
    const messageId = stableClientId('message');
    const payload = { id: messageId, conversationId: c.id, senderMemberId: memberId, body: text, content: text, replyToId: replyTo };
    const result = await command.execute({
      domain: 'member',
      policyId: 'converse.message.send',
      command: 'converse.message.send',
      aggregateType: 'Message',
      aggregateId: messageId,
      payload,
      previewAction: () => dispatch(sendMessage({ conversationId: c.id, senderMemberId: memberId, body: text, replyToId: replyTo }))
    });
    if (!result.ok) return;
    setBody('');
    setReplyTo(undefined);
    requestAnimationFrame(() => timelineRef.current?.scrollTo({ top: timelineRef.current?.scrollHeight ?? 0, behavior: 'smooth' }));
    messageQuery.reload();
  };

  const pinned = (c.pinnedBy ?? []).includes(memberId), muted = (c.mutedBy ?? []).includes(memberId), archived = (c.archivedBy ?? []).includes(memberId);
  const raw = searchParams.get('context')?.trim() || c.context || '';
  const [contextType, contextId] = raw.includes(':') ? raw.split(':', 2) : raw.startsWith('opp-') ? ['opportunity', raw] : ['', ''];

  const contextTarget = (() => {
    if (contextType === 'business') { const b = businessEntities[contextId]; return b && { type: 'Business', label: b.name, href: `/app/businesses/${b.id}` }; }
    if (contextType === 'opportunity') { const o = opportunityEntities[contextId]; return o && { type: 'Opportunity', label: o.title, href: `/app/opportunities/${o.id}` }; }
    if (contextType === 'meeting') { const m = meetingEntities[contextId]; return m && { type: 'Meeting', label: m.title, href: `/app/meetings/${m.id}` }; }
    if (contextType === 'reference') { const r = references.find(x => x.id === contextId); return r && { type: 'Reference', label: 'Business reference', href: `/app/references?reference=${r.id}` }; }
    if (contextType === 'promotion') { const p = promotions.find(x => x.id === contextId); return p && { type: 'Promotion', label: p.headline, href: `/app/promotions/${p.id}` }; }
    if (contextType === 'event') { const event = events.find(x => x.id === contextId); return event && { type: 'Event', label: event.name, href: `/app/events/${event.id}` }; }
    return undefined;
  })();

  const title = kind === 'direct' ? (other?.name ?? c.subject) : (c.groupName ?? c.subject);
  const descriptor = kind === 'direct' ? `Direct Converse · ${people.join(', ')}` : kind === 'chapter' ? `${c.chapter} · official Chapter Converse · ${c.participantIds.length} members` : `${c.chapter} · Chapter group · ${c.participantIds.length} members`;

  return (
    <div>
      <PageHead
        eyebrow="Converse"
        title={title}
        description={descriptor}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={command.busy} onClick={() => void mutateFlag('pinned')}>
              <Pin className="size-4" />{pinned ? 'Unpin' : 'Pin'}
            </Button>
            <Button variant="secondary" disabled={command.busy} onClick={() => void mutateFlag('muted')}>
              <VolumeX className="size-4" />{muted ? 'Unmute' : 'Mute'}
            </Button>
            <Button variant="secondary" disabled={command.busy} onClick={() => void mutateFlag('archived').then(r => { if (r.ok && !archived) back('/app/messages'); })}>
              <Archive className="size-4" />{archived ? 'Restore' : 'Archive'}
            </Button>
          </div>
        }
      />

      {c.groupDescription && (
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={kind === 'chapter' ? 'info' : 'neutral'}>
              {kind === 'chapter' ? 'Official Chapter Converse' : 'Chapter-enabled group'}
            </StatusPill>
            <span className="text-sm font-semibold text-slate-500">Text discussion only</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{c.groupDescription}</p>
        </div>
      )}

      <div className="mb-5">
        <CommandExecutionFeedback error={command.error} onRetry={() => void command.retry()} onDismiss={command.clearError} />
      </div>

      {contextTarget && (
        <div className="mb-5">
          <ContextBanner title={`Regarding ${contextTarget.type}`} action={<Button variant="secondary" onClick={() => go(contextTarget.href, { label: 'Converse' })}>Open related {contextTarget.type.toLowerCase()}</Button>}>
            {contextTarget.label}. Keep discussion connected to the owning Bhandhu Journey workflow.
          </ContextBanner>
        </div>
      )}

      {kind === 'direct' && other && (
        <div className="mb-5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => go(`/app/members/${other.id}`, { label: 'Converse' })}>
            <UserRound className="size-4" />View member
          </Button>
          <Button variant="secondary" onClick={() => go(`/app/one-to-one?member=${other.id}${contextType === 'business' ? `&business=${contextId}` : ''}${contextType === 'opportunity' ? `&opportunity=${contextId}` : ''}&conversation=${c.id}`, { label: 'Converse' })}>
            <CalendarDays className="size-4" />Schedule meeting
          </Button>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        {messageQuery.error && <div className="p-4"><QueryError error={messageQuery.error} onRetry={messageQuery.reload} /></div>}
        {messageQuery.loading && !messageQuery.page && <div className="p-4"><QueryLoading label="Loading messages…" /></div>}
        <div className="flex justify-center border-b border-slate-200 bg-white p-2">
          <Button variant="ghost" onClick={messageQuery.next} disabled={!messageQuery.canNext}>Older messages</Button>
        </div>
        <div ref={timelineRef} className="min-h-[360px] max-h-[62dvh] overflow-y-auto bg-slate-50 p-4 pb-6 sm:p-6" aria-live="polite">
          <div className="grid gap-3">
            {msgs.map(m => {
              const mSender = String(m.senderMemberId ?? '').toLowerCase();
              const mine = mSender === memberId || toMemberSlug(mSender) === memberId || toGuid(mSender).toLowerCase() === myGuid || (m as any).isFromMe === true;
              const sender = memberEntities[toMemberSlug(m.senderMemberId)] || memberEntities[m.senderMemberId];
              const parent = m.replyToId ? messageEntities[m.replyToId] : undefined;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-base leading-7 sm:max-w-[78%] ${mine ? 'bg-[var(--navy-900)] text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
                    {kind !== 'direct' && !mine && (
                      <button type="button" className="mb-1 block text-sm font-black opacity-85 hover:underline" onClick={() => sender && go(`/app/members/${sender.id}`, { label: 'Converse' })}>
                        {sender?.name}
                      </button>
                    )}
                    {parent && (
                      <div className={`mb-2 rounded-lg px-2 py-1 text-sm ${mine ? 'bg-white/10' : 'bg-slate-100'}`}>
                        Reply to: {parent.body.slice(0, 120)}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">
                      {(m.body?.startsWith('business:') || m.body?.startsWith('biz-') || m.body?.startsWith('opportunity:') || m.body?.startsWith('opp-'))
                        ? (contextTarget ? `Regarding ${contextTarget.type}: ${contextTarget.label}` : 'Business introduction and enquiry')
                        : m.body}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm opacity-70">
                      <span>{new Date(m.createdAt).toLocaleString('en-IN')}</span>
                      <button type="button" onClick={() => setReplyTo(m.id)} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2">
                        <Reply className="size-3" />Reply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!msgs.length && <p className="py-12 text-center text-base text-slate-500">No discussion yet. Start with useful business context.</p>}
          </div>
        </div>
        <form onSubmit={send} className="member-converse-composer sticky border-t border-slate-200 bg-white p-3">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-lg bg-sky-50 px-3 py-2 text-sm">
              <span className="min-w-0 truncate">Replying to {messageEntities[replyTo]?.body.slice(0, 120)}</span>
              <button type="button" onClick={() => setReplyTo(undefined)} className="min-h-9 shrink-0 font-bold">Cancel</button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              maxLength={4000}
              className="max-h-32 min-h-12 flex-1 resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-base leading-6 outline-none focus:border-sky-600 focus:ring-3 focus:ring-sky-100 placeholder:text-slate-400"
              aria-label="Converse text"
              placeholder="Type or paste your message…"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
            <Button type="submit" className="min-h-12 shrink-0" disabled={command.busy || !body.trim()}>
              <Send className="size-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          <p className="mt-1.5 px-1 text-sm text-slate-500">Text only in this version. Use Opportunities, References or Meetings for structured business records.</p>
        </form>
      </Card>
      {kind === 'chapter-group' && c.createdByMemberId !== memberId && (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" disabled={command.busy} onClick={() => void leave()}>
            <LogOut className="size-4" />Leave group
          </Button>
        </div>
      )}
    </div>
  );
}
