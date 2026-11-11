import { useMemo, useState } from 'react';
import { Archive, Building2, MessageCircleMore, Pin, Plus, UsersRound } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/common/Input';
import { Avatar, EmptyState, PageHead, SearchField, StatusPill } from '@/features/network/components/NetworkUI';
import { activeMemberId, selectActiveMember } from '@/features/network/selectors';
import { createChapterGroupConversation, joinChapterConversation, toggleConversationFlag } from '@/features/network/networkSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { Tabs } from '@/components/ui/Tabs';
import { toast } from '@/components/ui/Toast';
import type { Conversation } from '@/features/network/types';
import { selectMemberEntities, selectMembersByChapter, selectConversations, selectMessagesByConversation } from '@/features/network/readModel';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { QueryError, QueryLoading } from '@/components/data/QueryState';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { stableClientId } from '@/utils/stableId';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { env } from '@/config/env';
import { toGuid, toMemberSlug } from '@/services/api/guidUtils';

type ConverseView = 'recent' | 'direct' | 'chapter' | 'groups' | 'unread' | 'archived';
const asView = (value: string | null): ConverseView =>
  ['direct', 'chapter', 'groups', 'unread', 'archived'].includes(value ?? '') ? (value as ConverseView) : 'recent';
const kindOf = (c: Conversation) => c.kind ?? 'direct';
const contextKind = (value?: string) => {
  if (!value) return 'general';
  if (value.startsWith('business:')) return 'business';
  if (value.startsWith('opportunity:') || value.startsWith('opp-')) return 'opportunities';
  if (value.startsWith('meeting:')) return 'meetings';
  if (value.startsWith('reference:') || value.startsWith('promotion:')) return 'business';
  return 'general';
};
const contextLabel = (value?: string) => {
  const kind = contextKind(value);
  return kind === 'opportunities' ? 'Opportunity' : kind === 'meetings' ? 'Meeting' : kind === 'business' ? 'Business' : 'General';
};

export default function ConverseInboxPage() {
  const { go } = useMemberNavigation();
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const memberId = useAppSelector(activeMemberId);
  const memberEntities = useAppSelector(selectMemberEntities);
  const membersByChapter = useAppSelector(selectMembersByChapter);
  const conversations = useAppSelector(selectConversations);
  const messagesByConversation = useAppSelector(selectMessagesByConversation);
  const account = useAppSelector(s => s.auth.account);
  const activeMember = useAppSelector(selectActiveMember);
  const member = activeMember || memberEntities[memberId];
  const [params, setParams] = useSearchParams();

  const [q, setQ] = useState('');
  const view = asView(params.get('view'));
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);

  if (!member) {
    return (
      <EmptyState
        title="Member context unavailable"
        body="Converse requires an active Member profile."
        action={<Button variant="secondary" onClick={() => go('/workspace', { label: 'Converse' })}>Return to workspace</Button>}
      />
    );
  }

  const myGuid = toGuid(memberId).toLowerCase();
  const isMyId = (id: string) => {
    const lower = String(id || '').trim().toLowerCase();
    return lower === memberId || toMemberSlug(lower) === memberId || toGuid(lower).toLowerCase() === myGuid;
  };

  const canManageChapterGroups = Boolean(
    account?.assignments?.some(a => a.status === 'Active' && a.workspace === 'Management' && a.unitType === 'Chapter' && a.unit === member.chapter && a.role.startsWith('Chapter '))
  );
  const setView = (next: ConverseView) => {
    const p = new URLSearchParams(params);
    next === 'recent' ? p.delete('view') : p.set('view', next);
    setParams(p, { replace: true });
  };
  const chapterMembers = (membersByChapter[member.chapter] ?? []).filter(m => m.id !== memberId && m.status !== 'suspended').sort((a, b) => a.name.localeCompare(b.name));
  const visibleChapterGroups = conversations.filter(c => c.kind === 'chapter-group' && c.chapter === member.chapter);

  const localRows = useMemo(() => conversations.filter(c => {
    const pIds = c.participantIds ?? [];
    const participant = pIds.some(isMyId);
    const kind = kindOf(c);
    const chapterVisible = (kind === 'chapter' || kind === 'chapter-group') && c.chapter === member.chapter;
    if (!participant && !chapterVisible) return false;
    const archived = (c.archivedBy ?? []).some(isMyId);
    if (view === 'archived') return participant && archived;
    if (archived) return false;
    if (view === 'direct') return participant && kind === 'direct';
    if (view === 'chapter') return kind === 'chapter' && chapterVisible;
    if (view === 'groups') return kind === 'chapter-group' && chapterVisible;
    if (view === 'unread') return participant && (c.unreadBy ?? []).some(isMyId);
    return participant || chapterVisible;
  }).filter(c => !q || `${c.groupName ?? c.subject} ${c.groupDescription ?? ''} ${c.context ?? ''} ${(c.participantIds ?? []).map(id => memberEntities[id]?.name ?? '').join(' ')}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => Number((b.pinnedBy ?? []).some(isMyId)) - Number((a.pinnedBy ?? []).some(isMyId)) || (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')), [conversations, memberEntities, memberId, member.chapter, q, view, myGuid]);

  const queryRequest = useMemo(() => ({
    queryId: 'member.converse.inbox',
    domain: 'member' as const,
    parameters: { memberId, chapter: member.chapter, view },
    search: q || undefined,
    sort: [{ field: 'updatedAt', direction: 'desc' as const }],
    pagination: { pageSize: 30 }
  }), [memberId, member.chapter, view, q]);

  const query = useDomainCursorPage<Conversation>(queryRequest, localRows, [memberId, member.chapter, view, q]);
  useRealtimeRefresh(['conversation.*', 'message.*'], query.reload);

  const rawRows: Conversation[] = query.page?.items ?? (env.useMocks ? localRows : []);

  const rows = useMemo(() => {
    return rawRows.filter(c => {
      const kind = kindOf(c);
      const pIds = c.participantIds ?? [];
      const participant = pIds.some(isMyId);
      const chapterVisible = (kind === 'chapter' || kind === 'chapter-group') && (!c.chapter || c.chapter === member.chapter);

      if (!participant && !chapterVisible) return false;

      const archived = (c.archivedBy ?? []).some(isMyId);
      if (view === 'archived') return participant && archived;
      if (archived) return false;

      if (view === 'direct') return participant && kind === 'direct';
      if (view === 'chapter') return kind === 'chapter' && chapterVisible;
      if (view === 'groups') return kind === 'chapter-group' && chapterVisible;
      if (view === 'unread') return participant && (c.unreadBy ?? []).some(isMyId);

      // 'recent'
      return participant || chapterVisible;
    }).filter(c => {
      if (!q.trim()) return true;
      const term = q.toLowerCase();
      const pIds = c.participantIds ?? [];
      const names = pIds.map(id => memberEntities[toMemberSlug(id)]?.name ?? '').join(' ');
      const otherName = (c as any).otherMemberName ?? '';
      const searchable = `${c.groupName ?? ''} ${c.subject ?? ''} ${c.groupDescription ?? ''} ${c.context ?? ''} ${names} ${otherName}`.toLowerCase();
      return searchable.includes(term);
    }).sort((a, b) => {
      const aPinned = (a.pinnedBy ?? []).some(isMyId) ? 1 : 0;
      const bPinned = (b.pinnedBy ?? []).some(isMyId) ? 1 : 0;
      return (bPinned - aPinned) || (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
    });
  }, [rawRows, memberId, myGuid, member.chapter, view, q, memberEntities]);

  const createGroup = async () => {
    if (!canManageChapterGroups || groupName.trim().length < 3 || participants.length < 1) return;
    const conversationId = stableClientId('converse-group');
    const previewPayload = { creatorId: memberId, chapter: member.chapter, participantIds: participants, groupName: groupName.trim(), groupDescription: groupDescription.trim() || undefined, authorised: true };
    const result = await command.execute({ domain: 'member', policyId: 'converse.conversation.create', command: 'converse.chapter-group.create', aggregateType: 'Conversation', aggregateId: conversationId, payload: { id: conversationId, ...previewPayload }, previewAction: () => dispatch(createChapterGroupConversation(previewPayload)) });
    if (!result.ok) return;
    toast.success(`Chapter group “${groupName.trim()}” enabled.`);
    setGroupName('');
    setGroupDescription('');
    setParticipants([]);
    setGroupOpen(false);
    setView('groups');
  };

  const join = async (c: Conversation) => {
    const result = await command.execute({ domain: 'member', policyId: 'converse.conversation.join', command: 'converse.conversation.join', aggregateType: 'Conversation', aggregateId: c.id, expectedVersion: c.version, payload: { conversationId: c.id, memberId }, previewAction: () => dispatch(joinChapterConversation({ conversationId: c.id, memberId })) });
    if (result.ok) {
      toast.success(c.kind === 'chapter' ? `Opened ${c.groupName ?? c.subject}` : `Joined ${c.groupName ?? c.subject}`);
      go(`/app/messages/${c.id}`, { label: 'Converse' });
    }
  };

  const flag = (c: Conversation, flag: 'pinned' | 'archived') =>
    void command.execute({ domain: 'member', policyId: 'converse.conversation.flag', command: 'converse.conversation.flag', aggregateType: 'Conversation', aggregateId: c.id, expectedVersion: c.version, payload: { conversationId: c.id, flag }, previewAction: () => dispatch(toggleConversationFlag({ conversationId: c.id, memberId, flag })) });

  return (
    <div>
      <PageHead
        eyebrow="Bhandhu Journey"
        title="Converse"
        description="Text-only Converse connects Business, Opportunities and Meetings while preserving context."
        actions={canManageChapterGroups ? <Button variant="secondary" onClick={() => setGroupOpen(v => !v)}><Plus className="size-4" />Enable Chapter group</Button> : undefined}
      />
      <CommandExecutionFeedback error={command.error} onRetry={() => void command.retry()} onDismiss={command.clearError} />

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <MessageCircleMore className="mt-0.5 size-5 shrink-0 text-sky-700" />
          <div>
            <strong className="text-base text-[var(--navy-950)]">Converse V1 is intentionally text-only.</strong>
            <p className="mt-1 text-sm leading-6 text-slate-600">Type or copy and paste useful discussion text. File, image and document uploads are not enabled in this version.</p>
          </div>
        </div>
      </div>

      {groupOpen && canManageChapterGroups && (
        <Card className="mb-5">
          <div className="grid gap-4">
            <div>
              <h2 className="text-xl font-black text-[var(--navy-950)]">Enable a Parivar group</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Chapter-governed groups are focused working spaces, not arbitrary Member-created chat groups. Members of {member.chapter} can discover the group and join it.</p>
            </div>
            <Input label="Group name" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Business Opportunities Circle" />
            <label className="grid gap-1.5 text-sm font-bold text-slate-700">
              Purpose / description
              <textarea className="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base font-normal leading-6" maxLength={320} value={groupDescription} onChange={e => setGroupDescription(e.target.value)} placeholder="Explain what Members should discuss in this group." />
            </label>
            <fieldset>
              <legend className="mb-2 text-sm font-bold text-slate-700">Initial members <span className="font-normal text-slate-500">Select at least one; other Parivar members can join later.</span></legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {chapterMembers.map(m => (
                  <label key={m.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 p-3 text-base">
                    <input type="checkbox" checked={participants.includes(m.id)} onChange={e => setParticipants(e.target.checked ? [...participants, m.id] : participants.filter(x => x !== m.id))} />
                    <span><strong className="block">{m.name}</strong><span className="block text-sm text-slate-500">{m.designation}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <Button disabled={groupName.trim().length < 3 || participants.length < 1} onClick={() => void createGroup()}>Enable group</Button>
              <Button variant="secondary" onClick={() => { setGroupOpen(false); setParticipants([]); }}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Tabs ariaLabel="Converse views" variant="buttons" value={view} onChange={t => setView(t as ConverseView)} items={[{ key: 'recent', label: 'Recent' }, { key: 'direct', label: 'Direct' }, { key: 'chapter', label: 'Parivar' }, { key: 'groups', label: 'Groups' }, { key: 'unread', label: 'Unread' }, { key: 'archived', label: 'Archived' }]} />
      </div>

      <SearchField value={q} onChange={setQ} placeholder="Search people, groups or business context…" />

      {query.loading && !query.page ? (
        <div className="mt-5"><QueryLoading label="Loading Converse…" /></div>
      ) : query.error ? (
        <div className="mt-5"><QueryError error={query.error} onRetry={query.reload} /></div>
      ) : (
        <div className="mt-5 grid gap-3">
          {rows.map(c => {
            const kind = kindOf(c);
            const pIds = c.participantIds ?? [];
            const participant = pIds.some(isMyId);
            const otherId = pIds.find(id => !isMyId(id));
            const otherSlug = otherId ? (toMemberSlug(otherId) || otherId) : undefined;
            const other = otherSlug ? (memberEntities[otherSlug] || memberEntities[otherId!]) : undefined;
            const messageRows = messagesByConversation[c.id] ?? [];
            const last = messageRows[messageRows.length - 1];
            const unread = participant && (c.unreadBy ?? []).some(isMyId);
            const pinned = participant && (c.pinnedBy ?? []).some(isMyId);
            const archived = participant && (c.archivedBy ?? []).some(isMyId);
            const context = contextLabel(c.context);
            const otherName = (c as any).otherMemberName || other?.name;
            const display = c.groupName ?? otherName ?? (kind === 'direct' ? 'Direct Message' : c.subject);

            return (
              <Card key={c.id} className={unread ? 'border-sky-200 bg-sky-50/50' : ''}>
                <div className="flex items-center gap-3">
                  <Avatar text={kind === 'direct' ? (other?.avatarText ?? (otherName ? otherName.slice(0, 2).toUpperCase() : 'M')) : kind === 'chapter' ? 'CH' : 'GR'} />
                  <div className="min-w-0 flex-1">
                    <button type="button" className="w-full text-left" onClick={() => participant ? go(`/app/messages/${c.id}`, { label: 'Converse' }) : undefined}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-lg font-black text-[var(--navy-950)]">{display}</span>
                        {kind === 'chapter' && <StatusPill tone="info"><Building2 className="mr-1 inline size-3" />Official Chapter</StatusPill>}
                        {kind === 'chapter-group' && <StatusPill><UsersRound className="mr-1 inline size-3" />Chapter group</StatusPill>}
                        {unread && <StatusPill tone="info">Unread</StatusPill>}
                        {kind === 'direct' && context !== 'General' && <StatusPill tone="neutral">{context}</StatusPill>}
                      </div>
                      <div className="mt-1 truncate text-base text-slate-600">{last?.body ?? c.groupDescription ?? 'Start a useful business discussion'}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-400">
                        {c.chapter && kind !== 'direct' ? `${c.chapter} · ` : ''}
                        {participant ? `${pIds.length} participant${pIds.length === 1 ? '' : 's'}` : 'Available to join'} · Updated {c.updatedAt ? new Date(c.updatedAt).toLocaleString('en-IN') : ''}
                      </div>
                    </button>
                    {!participant && (kind === 'chapter' || kind === 'chapter-group') && (
                      <Button className="mt-3" variant="secondary" disabled={command.busy} onClick={() => void join(c)}>
                        {kind === 'chapter' ? 'Open Chapter Converse' : 'Join group'}
                      </Button>
                    )}
                  </div>
                  {participant && (
                    <div className="flex gap-1">
                      <button type="button" aria-label={pinned ? 'Unpin Converse' : 'Pin Converse'} className="grid size-11 place-items-center rounded-xl hover:bg-slate-100 focus-visible:ring-3 focus-visible:ring-sky-200" disabled={command.busy} onClick={() => flag(c, 'pinned')}>
                        <Pin className="size-5" fill={pinned ? 'currentColor' : 'none'} />
                      </button>
                      <button type="button" aria-label={archived ? 'Restore Converse' : 'Archive Converse'} className="grid size-11 place-items-center rounded-xl hover:bg-slate-100 focus-visible:ring-3 focus-visible:ring-sky-200" disabled={command.busy} onClick={() => flag(c, 'archived')}>
                        <Archive className="size-5" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
          {!rows.length && (
            <EmptyState
              title="No Converse threads in this view"
              body={view === 'groups' && visibleChapterGroups.length === 0 ? 'Your Parivar has not enabled any working groups yet.' : 'Converse threads appear as you connect with Members, participate in Chapter discussion or join Chapter-enabled groups.'}
              action={<Button variant="secondary" onClick={() => go('/app/directory', { label: 'Converse' })}>Continue Bhandhu journey</Button>}
            />
          )}
          <div className="mt-2 flex justify-between">
            <Button variant="secondary" onClick={query.previous} disabled={!query.canPrevious}>Previous</Button>
            <Button variant="secondary" onClick={query.next} disabled={!query.canNext}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

