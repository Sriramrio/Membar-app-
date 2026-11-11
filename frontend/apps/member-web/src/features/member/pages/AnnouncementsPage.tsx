import { serverClock } from '@/services/time/serverClock';
import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, PageHead, SearchField, StatusPill } from '@/features/network/components/NetworkUI';
import { activeMemberId } from '@/features/network/selectors';
import { acknowledgeAnnouncement } from '@/features/network/networkSlice';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { QueryError, QueryLoading } from '@/components/data/QueryState';
import type { Announcement } from '@/features/network/types';

type AnnouncementTab = 'all' | 'action' | 'important' | 'general' | 'archived';

export default function AnnouncementsPage() {
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const memberId = useAppSelector(activeMemberId);
  const items = useAppSelector((s) => s.network.announcements);

  const [q, setQ] = useState('');
  const [tab, setTab] = useState<AnnouncementTab>('all');

  const filteredLocal = useMemo(() =>
    items
      .filter((a) => {
        const expired = Boolean(a.expiresAt && new Date(a.expiresAt).getTime() < serverClock.nowMs());
        const archived = a.status === 'archived' || a.status === 'withdrawn' || expired;
        const ack = a.acknowledgedBy?.includes(memberId);
        if (tab === 'archived') return archived && (!q || `${a.title} ${a.body} ${a.scope}`.toLowerCase().includes(q.toLowerCase()));
        if (archived) return false;
        if (tab === 'action' && (!a.acknowledgementRequired || ack)) return false;
        if (tab === 'important' && !(a.priority === 'important' || a.priority === 'urgent')) return false;
        if (tab === 'general' && (a.priority === 'important' || a.priority === 'urgent' || a.acknowledgementRequired)) return false;
        return !q || `${a.title} ${a.body} ${a.scope}`.toLowerCase().includes(q.toLowerCase());
      })
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.publishedAt.localeCompare(a.publishedAt)),
    [items, q, tab, memberId]
  );

  const queryRequest = useMemo(() => ({
    queryId: 'member.announcements.list',
    domain: 'member' as const,
    parameters: { memberId, tab, search: q || undefined },
    pagination: { pageSize: 50 },
  }), [memberId, tab, q]);

  const query = useDomainCursorPage<Announcement>(queryRequest, filteredLocal, [memberId, tab, q]);
  useRealtimeRefresh(['announcement.*', 'org.communication.*', 'communication.*'], query.reload);

  const rawList = query.page?.items?.map(item => ({
    ...item,
    body: (item as any).content ?? item.body,
    priority: (item as any).priority ?? item.priority ?? 'normal',
    acknowledgementRequired: (item as any).acknowledgementRequired ?? false,
    acknowledgedBy: (item as any).acknowledged ? [memberId] : (item.acknowledgedBy ?? []),
    publishedAt: (item as any).publishedAt ?? item.publishedAt ?? new Date().toISOString(),
    scope: (item as any).chapterName ?? (item as any).scope ?? 'Chapter',
  })) ?? filteredLocal;

  const announcementsList = useMemo(() => {
    return rawList.filter((a) => {
      const expired = Boolean(a.expiresAt && new Date(a.expiresAt).getTime() < serverClock.nowMs());
      const archived = a.status === 'archived' || a.status === 'withdrawn' || expired;
      const ack = a.acknowledgedBy?.includes(memberId) || (a as any).acknowledged;
      if (tab === 'archived') return archived && (!q || `${a.title} ${a.body} ${a.scope}`.toLowerCase().includes(q.toLowerCase()));
      if (archived) return false;
      if (tab === 'action' && (!a.acknowledgementRequired || ack)) return false;
      if (tab === 'important' && !(a.priority === 'important' || a.priority === 'urgent')) return false;
      if (tab === 'general' && (a.priority === 'important' || a.priority === 'urgent' || (a.acknowledgementRequired && !ack))) return false;
      return !q || `${a.title} ${a.body} ${a.scope}`.toLowerCase().includes(q.toLowerCase());
    });
  }, [rawList, tab, memberId, q]);

  const acknowledge = async (id: string, version?: string) => {
    const res = await command.execute({
      domain: 'member',
      policyId: 'announcement.acknowledge',
      command: 'announcement.acknowledge',
      aggregateType: 'Announcement',
      aggregateId: id,
      expectedVersion: version,
      payload: { announcementId: id, memberId },
      previewAction: () => dispatch(acknowledgeAnnouncement({ announcementId: id, memberId })),
    });
    if (res.ok) {
      query.reload();
    }
  };

  return (
    <div>
      <PageHead
        title="Announcements"
        description="Important network communication is separated from information that requires your explicit action."
      />
      <CommandExecutionFeedback
        error={command.error}
        onRetry={() => void command.retry()}
        onDismiss={command.clearError}
      />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {([
          ['all', 'All'],
          ['action', 'Requires Action'],
          ['important', 'Important'],
          ['general', 'General'],
          ['archived', 'Archived'],
        ] as const).map(([v, l]) => (
          <Button
            key={v}
            variant={tab === v ? 'default' : 'secondary'}
            onClick={() => setTab(v)}
            className="shrink-0"
          >
            {l}
          </Button>
        ))}
      </div>
      <SearchField value={q} onChange={setQ} placeholder="Search announcements…" />
      {query.loading && !query.page ? (
        <div className="mt-5">
          <QueryLoading label="Loading announcements…" />
        </div>
      ) : query.error ? (
        <div className="mt-5">
          <QueryError error={query.error} onRetry={query.reload} />
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {announcementsList.map((a) => {
            const ack = a.acknowledgedBy?.includes(memberId) || (a as any).acknowledged;
            const Icon =
              a.priority === 'urgent'
                ? AlertTriangle
                : a.acknowledgementRequired
                ? CheckCircle2
                : Info;
            return (
              <Card key={a.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                      a.priority === 'urgent'
                        ? 'bg-red-50 text-red-700'
                        : a.priority === 'important'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill
                        tone={
                          a.priority === 'urgent'
                            ? 'bad'
                            : a.priority === 'important'
                            ? 'warn'
                            : 'info'
                        }
                      >
                        {a.priority}
                      </StatusPill>
                      {a.pinned && <StatusPill>Pinned</StatusPill>}
                      {a.acknowledgementRequired && (
                        <StatusPill tone={ack ? 'good' : 'warn'}>
                          {ack ? 'Acknowledged' : 'Acknowledgement Required'}
                        </StatusPill>
                      )}
                    </div>
                    <h2 className="mt-3 text-lg font-black">{a.title}</h2>
                    <p className="mt-2 text-base leading-7 text-slate-600">{a.body}</p>
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      {a.scope ?? 'Network'} · Published{' '}
                      {new Date(a.publishedAt).toLocaleString('en-IN')}
                      {a.expiresAt &&
                        ` · Expires ${new Date(a.expiresAt).toLocaleString('en-IN')}`}
                    </p>
                  </div>
                  {a.acknowledgementRequired && !ack && (
                    <Button
                      disabled={command.busy}
                      onClick={() => void acknowledge(a.id, a.version)}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
          {!announcementsList.length && (
            <EmptyState
              title="No announcements in this view"
              body={
                tab === 'action'
                  ? 'You have no announcements waiting for acknowledgement.'
                  : 'Published announcements that match this view will appear here.'
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
