import { serverClock } from '@/services/time/serverClock';
import { useMemo, useState } from 'react';
import { CalendarDays, Megaphone } from 'lucide-react';
import { useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, PageHead, SearchField, StatusPill } from '@/features/network/components/NetworkUI';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { QueryError, QueryLoading } from '@/components/data/QueryState';

type NewsTab = 'updates' | 'events';

export default function NewsPage() {
  const { go } = useMemberNavigation();
  const n = useNetworkSlice(['announcements', 'events'] as const);
  const [tab, setTab] = useState<NewsTab>('updates');
  const [q, setQ] = useState('');

  const localAnnouncements = useMemo(
    () =>
      n.announcements
        .filter(
          (a) =>
            a.status !== 'archived' &&
            a.status !== 'withdrawn' &&
            (!a.expiresAt || new Date(a.expiresAt).getTime() >= serverClock.nowMs())
        )
        .filter((a) => !q || `${a.title} ${a.body} ${a.scope}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [n.announcements, q]
  );

  const localEvents = useMemo(
    () =>
      n.events
        .filter((e) => new Date(e.dateTime).getTime() >= serverClock.nowMs())
        .filter(
          (e) => !q || `${e.name} ${e.description} ${e.city} ${e.type}`.toLowerCase().includes(q.toLowerCase())
        )
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [n.events, q]
  );

  const queryRequest = useMemo(
    () => ({
      queryId: tab === 'updates' ? 'member.news.list' : 'member.calendar.events',
      domain: 'member' as const,
      parameters: { search: q || undefined },
      pagination: { pageSize: 50 },
    }),
    [tab, q]
  );

  const query = useDomainCursorPage<any>(
    queryRequest,
    tab === 'updates' ? localAnnouncements : localEvents,
    [tab, q]
  );
  useRealtimeRefresh(['news.*', 'announcement.*', 'event.*', 'org.communication.*', 'communication.*', 'org.event.*', 'org.meeting.*'], query.reload);

  const announcements = useMemo(() => {
    if (tab !== 'updates') return [];
    if (query.page?.items) {
      return query.page.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        body: item.content ?? item.summary ?? item.body ?? '',
        priority: item.priority ?? 'normal',
        scope: item.category ?? item.scope ?? 'Network',
        publishedAt: item.publishedAt ?? new Date().toISOString(),
      }));
    }
    return localAnnouncements;
  }, [tab, query.page?.items, localAnnouncements]);

  const events = useMemo(() => {
    if (tab !== 'events') return [];
    if (query.page?.items) {
      return query.page.items.map((item: any) => ({
        id: item.id ?? item.eventId,
        name: item.title ?? item.name,
        description: item.description ?? '',
        dateTime: item.startsAt ?? item.dateTime,
        venue: item.venue ?? 'Main Hall',
        city: item.city ?? 'Salem',
        type: item.type ?? 'Conclave',
      }));
    }
    return localEvents;
  }, [tab, query.page?.items, localEvents]);

  return (
    <div>
      <PageHead
        title="News & Network Updates"
        description="This briefing uses published network announcements and real upcoming events rather than invented news content."
      />
      <div className="mb-4 flex gap-2">
        <Button
          variant={tab === 'updates' ? 'default' : 'secondary'}
          onClick={() => setTab('updates')}
        >
          Network Updates
        </Button>
        <Button
          variant={tab === 'events' ? 'default' : 'secondary'}
          onClick={() => setTab('events')}
        >
          Event Briefing
        </Button>
      </div>
      <SearchField value={q} onChange={setQ} placeholder="Search network updates…" />

      {query.loading && !query.page ? (
        <div className="mt-5">
          <QueryLoading label={`Loading ${tab === 'updates' ? 'news' : 'events'}…`} />
        </div>
      ) : query.error ? (
        <div className="mt-5">
          <QueryError error={query.error} onRetry={query.reload} />
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {tab === 'updates' &&
            announcements.map((a: any) => (
              <Card key={a.id}>
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">
                    <Megaphone className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone={a.priority === 'urgent' ? 'bad' : a.priority === 'important' ? 'warn' : 'info'}>
                        {a.priority}
                      </StatusPill>
                      <StatusPill>{a.scope}</StatusPill>
                    </div>
                    <h2 className="mt-3 text-xl font-black">{a.title}</h2>
                    <p className="mt-2 text-base leading-7 text-slate-600">{a.body}</p>
                    <div className="mt-3 text-sm font-semibold text-slate-400">
                      Published {new Date(a.publishedAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

          {tab === 'events' &&
            events.map((e: any) => (
              <Card key={e.id}>
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
                    <CalendarDays className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <StatusPill tone="info">{e.type}</StatusPill>
                    <h2 className="mt-3 text-xl font-black">{e.name}</h2>
                    <p className="mt-2 text-base leading-7 text-slate-600">{e.description}</p>
                    <div className="mt-3 text-sm text-slate-500">
                      {new Date(e.dateTime).toLocaleString('en-IN')} · {e.venue}, {e.city}
                    </div>
                    <Button
                      variant="secondary"
                      className="mt-4"
                      onClick={() => go(`/app/events/${e.id}`, { label: 'News' })}
                    >
                      View event
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

          {((tab === 'updates' && !announcements.length) || (tab === 'events' && !events.length)) && (
            <EmptyState
              title="No published updates found"
              body="Published network information matching this view will appear here."
            />
          )}
        </div>
      )}
    </div>
  );
}
