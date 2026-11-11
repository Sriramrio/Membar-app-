import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Handshake,
  Target,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  MemberJourneyScopeBar,
  type MemberJourneyScope,
} from '@/features/member/components/MemberJourneyScopeBar';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import {
  EmptyState,
  PageHead,
  SearchField,
  StatusPill,
} from '@/features/network/components/NetworkUI';
import { activeMemberId } from '@/features/network/selectors';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { QueryError, QueryLoading } from '@/components/data/QueryState';

type CalendarKind = 'Meeting' | 'Event' | 'Opportunity' | 'Payment';
type CalendarFilter =
  | 'all'
  | 'meetings'
  | 'events'
  | 'opportunities'
  | 'payments';
type CalendarView = 'agenda' | 'month';

type CalendarItem = {
  id: string;
  kind: CalendarKind;
  title: string;
  detail: string;
  at: string;
  href: string;
  chapter?: string;
  status?: string;
};

const validScope = (value: string | null): MemberJourneyScope =>
  value === 'chapter' || value === 'network' ? value : 'for-you';
const validFilter = (value: string | null): CalendarFilter =>
  ['meetings', 'events', 'opportunities', 'payments'].includes(value ?? '')
    ? (value as CalendarFilter)
    : 'all';
const validView = (value: string | null): CalendarView =>
  value === 'month' ? 'month' : 'agenda';
const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const dateKey = (value: string) => value.slice(0, 10);
const dayLabel = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
const timeLabel = (value: string) =>
  new Date(value).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });

function kindIcon(kind: CalendarKind) {
  if (kind === 'Meeting') return <Handshake className="size-5" />;
  if (kind === 'Event') return <CalendarDays className="size-5" />;
  if (kind === 'Opportunity') return <Target className="size-5" />;
  return <CircleDollarSign className="size-5" />;
}

function kindTone(kind: CalendarKind): 'info' | 'good' | 'warn' | 'neutral' {
  if (kind === 'Meeting') return 'info';
  if (kind === 'Event') return 'good';
  if (kind === 'Opportunity') return 'warn';
  return 'neutral';
}

export default function CalendarPage() {
  const { go } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const n = useNetworkSlice(['members'] as const);
  const member = n.members.find((m) => m.id === memberId);
  const [params, setParams] = useSearchParams();
  const scope = validScope(params.get('scope'));
  const filter = validFilter(params.get('filter'));
  const view = validView(params.get('view'));
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [displayMonth, setDisplayMonth] = useState(() => {
    const raw = params.get('month');
    const parsed =
      raw && /^\d{4}-\d{2}$/.test(raw)
        ? new Date(`${raw}-01T00:00:00`)
        : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  });

  const [selectedDayItems, setSelectedDayItems] = useState<{
    day: number;
    items: CalendarItem[];
  } | null>(null);

  const queryRequest = useMemo(
    () => ({
      queryId: 'member.calendar.events',
      domain: 'member' as const,
      parameters: {
        memberId,
        month: monthKey(displayMonth),
        scope,
        filter: filter === 'all' ? undefined : filter,
        search: query || undefined,
      },
      pagination: { pageSize: 50 },
    }),
    [memberId, displayMonth, scope, filter, query],
  );

  // Queries only authoritative DB via API - zero hardcoded mock records
  const backendQuery = useDomainCursorPage<any>(
    queryRequest,
    [],
    [displayMonth, scope, filter, query],
  );
  useRealtimeRefresh(
    ['calendar.*', 'event.*', 'meeting.*', 'org.event.*', 'org.meeting.*'],
    backendQuery.reload,
  );

  const serverItems = useMemo<CalendarItem[]>(() => {
    if (!backendQuery.page?.items) return [];
    return backendQuery.page.items.map((item: any) => {
      if (item.kind && item.at) return item as CalendarItem;
      const isMeeting =
        item.kind === 'Meeting' ||
        item.type === 'REGULAR' ||
        item.type === 'COMMITTEE' ||
        item.type === 'GENERAL_BODY' ||
        (typeof item.title === 'string' && item.title.toLowerCase().includes('meeting'));

      const rawId = item.id ?? item.eventId;
      const kind: CalendarKind = isMeeting ? 'Meeting' : 'Event';
      return {
        id: `${kind.toLowerCase()}-${rawId}`,
        kind,
        title: item.title ?? item.name ?? 'Untitled',
        detail: `${item.venue ?? item.chapter ?? 'Venue'} · ${item.city ?? member?.city ?? 'Salem'}`,
        at: item.startsAt ?? item.dateTime ?? new Date().toISOString(),
        href: isMeeting ? `/app/meetings/${rawId}` : `/app/events/${rawId}`,
        chapter: item.chapter,
        status: item.registered ? 'registered' : item.status,
      } as CalendarItem;
    });
  }, [backendQuery.page?.items, member?.city]);

  // Exclusively authoritative DB items
  const items = useMemo<CalendarItem[]>(() => {
    return [...serverItems].sort((a, b) => a.at.localeCompare(b.at));
  }, [serverItems]);

  const visibleItems = useMemo(() => {
    const targetMonth = monthKey(displayMonth);
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (monthKey(new Date(item.at)) !== targetMonth) return false;
      if (filter === 'meetings' && item.kind !== 'Meeting') return false;
      if (filter === 'events' && item.kind !== 'Event') return false;
      if (filter === 'opportunities' && item.kind !== 'Opportunity')
        return false;
      if (filter === 'payments' && item.kind !== 'Payment') return false;
      return (
        !q ||
        `${item.title} ${item.detail} ${item.chapter ?? ''} ${item.status ?? ''}`
          .toLowerCase()
          .includes(q)
      );
    });
  }, [displayMonth, filter, items, query]);

  const grouped = useMemo(() => {
    const result = new Map<string, CalendarItem[]>();
    visibleItems.forEach((item) => {
      const key = dateKey(item.at);
      result.set(key, [...(result.get(key) ?? []), item]);
    });
    return [...result.entries()];
  }, [visibleItems]);

  const daysInMonth = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDay =
    (new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1).getDay() +
      6) %
    7;
  const getItemsForDay = (day: number) =>
    visibleItems.filter((item) => new Date(item.at).getDate() === day);
  const countForDay = (day: number) => getItemsForDay(day).length;

  const handleDayClick = (day: number) => {
    const dayItems = getItemsForDay(day);
    if (!dayItems.length) return;

    // Exactly 1 item -> navigate directly to its canonical details
    if (dayItems.length === 1) {
      go(dayItems[0].href, { label: 'Calendar' });
    } else {
      // Multiple items -> display day overview modal
      setSelectedDayItems({ day, items: dayItems });
    }
  };

  if (!member) {
    return (
      <EmptyState
        title="Calendar unavailable"
        body="An active Member profile is required to open your SETHU calendar."
        action={
          <Button
            variant="secondary"
            onClick={() => go('/workspace', { label: 'Calendar' })}
          >
            Return to workspace
          </Button>
        }
      />
    );
  }

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };
  const setScope = (next: MemberJourneyScope) =>
    setParam('scope', next === 'for-you' ? undefined : next);
  const moveMonth = (delta: number) => {
    const next = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth() + delta,
      1,
    );
    setDisplayMonth(next);
    setParam('month', monthKey(next));
  };
  const today = () => {
    const next = new Date();
    setDisplayMonth(next);
    setParam('month', monthKey(next));
  };

  return (
    <div>
      <PageHead
        title="My SETHU Calendar"
        description="Meetings, events, opportunity deadlines and payment dates from their canonical workflows."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => go('/app/one-to-one', { label: 'Calendar' })}
            >
              Schedule One-to-One
            </Button>
            <Button
              variant="secondary"
              onClick={() => go('/app/events', { label: 'Calendar' })}
            >
              Browse Events
            </Button>
          </div>
        }
      />
      <MemberJourneyScopeBar
        value={scope}
        onChange={setScope}
        className="mb-5"
      />

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="secondary" onClick={today}>
              Today
            </Button>
            <Button
              variant="secondary"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
            <strong className="ml-1 text-lg text-[var(--navy-950)]">
              {displayMonth.toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              })}
            </strong>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Calendar view">
            <Button
              variant={view === 'agenda' ? 'default' : 'secondary'}
              onClick={() => setParam('view', undefined)}
            >
              Schedule view
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'secondary'}
              onClick={() => setParam('view', 'month')}
            >
              Month
            </Button>
          </div>
        </div>
      </Card>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ['all', 'All'],
            ['meetings', 'Meetings'],
            ['events', 'Events'],
            ['opportunities', 'Opportunities'],
            ['payments', 'Payments'],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            className="shrink-0"
            variant={filter === key ? 'default' : 'secondary'}
            onClick={() => setParam('filter', key === 'all' ? undefined : key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <SearchField
        value={query}
        onChange={(value) => {
          setQuery(value);
          const next = new URLSearchParams(params);
          value.trim() ? next.set('q', value) : next.delete('q');
          setParams(next, { replace: true });
        }}
        placeholder="Search meetings, events, opportunities or payment dates…"
      />

      {backendQuery.loading && !backendQuery.page ? (
        <div className="mt-5">
          <QueryLoading label="Loading calendar events…" />
        </div>
      ) : backendQuery.error ? (
        <div className="mt-5">
          <QueryError
            error={backendQuery.error}
            onRetry={backendQuery.reload}
          />
        </div>
      ) : view === 'month' ? (
        <Card className="mt-5 overflow-hidden p-3 sm:p-5">
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-bold text-slate-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div
                key={`blank-${i}`}
                className="min-h-16 rounded-lg bg-slate-50"
              />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const count = countForDay(day);
              const hasItems = count > 0;
              return (
                <div
                  key={day}
                  onClick={() => hasItems && handleDayClick(day)}
                  className={`min-h-16 rounded-lg border border-slate-200 bg-white p-2 transition-all ${
                    hasItems
                      ? 'cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 shadow-xs'
                      : ''
                  }`}
                >
                  <div className="text-sm font-bold text-slate-800">{day}</div>
                  {hasItems && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayClick(day);
                      }}
                      className="mt-2 w-full rounded-full bg-sky-100 hover:bg-sky-200 active:scale-95 px-2 py-1 text-center text-xs sm:text-sm font-bold text-sky-800 cursor-pointer transition-all"
                    >
                      {count} item{count === 1 ? '' : 's'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="mt-5 grid gap-5">
          {grouped.map(([date, rows]) => (
            <section key={date}>
              <h2 className="mb-2 text-lg font-black text-[var(--navy-950)]">
                {dayLabel(`${date}T12:00:00`)}
              </h2>
              <div className="grid gap-3">
                {rows.map((item) => (
                  <Card key={item.id} className="p-0">
                    <button
                      type="button"
                      onClick={() => go(item.href, { label: 'Calendar' })}
                      className="flex min-h-20 w-full items-center gap-4 rounded-2xl p-4 text-left hover:bg-slate-50 focus-visible:ring-3 focus-visible:ring-sky-200 cursor-pointer"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                        {kindIcon(item.kind)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-base">{item.title}</strong>
                          <StatusPill tone={kindTone(item.kind)}>
                            {item.kind}
                          </StatusPill>
                          {item.status && (
                            <StatusPill>{item.status}</StatusPill>
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {item.detail}
                        </p>
                        <div className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                          <Clock3 className="size-3" />
                          {timeLabel(item.at)}
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-slate-400" />
                    </button>
                  </Card>
                ))}
              </div>
            </section>
          ))}
          {!grouped.length && (
            <EmptyState
              title="No scheduled items in this view"
              body="No canonical meetings, events, opportunity deadlines or payments match this month and filter."
              action={
                <Button
                  onClick={() =>
                    go(
                      filter === 'events'
                        ? '/app/events'
                        : filter === 'opportunities'
                          ? '/app/opportunities'
                          : filter === 'payments'
                            ? '/app/payments'
                            : '/app/one-to-one',
                      { label: 'Calendar' },
                    )
                  }
                >
                  {filter === 'events'
                    ? 'Browse Events'
                    : filter === 'opportunities'
                      ? 'Browse Opportunities'
                      : filter === 'payments'
                        ? 'Review Payments'
                        : 'Schedule One-to-One'}
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* Multiple items உள்ள நாளை click செய்தால் வரும் Popup Modal */}
      {selectedDayItems && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          onClick={() => setSelectedDayItems(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Scheduled Items ({selectedDayItems.day}{' '}
                  {displayMonth.toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  })}
                  )
                </h3>
                <p className="text-xs text-slate-500">
                  Click on any item to view details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayItems(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {selectedDayItems.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedDayItems(null);
                    go(item.href, { label: 'Calendar' });
                  }}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-sky-400 hover:bg-sky-50/50 transition-all cursor-pointer"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
                    {kindIcon(item.kind)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-slate-900 truncate">
                        {item.title}
                      </strong>
                      <StatusPill tone={kindTone(item.kind)}>
                        {item.kind}
                      </StatusPill>
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {item.detail}
                    </p>
                    <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                      <Clock3 className="size-3" />
                      {timeLabel(item.at)}
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        Calendar is a consolidated Member view. Meetings are scheduled in
        One-to-One, Chapter/network Events are governed by authorised event
        workflows, Opportunity dates come from the marketplace, and Payment
        dates come from Membership. The Calendar does not create parallel
        records.
      </div>
    </div>
  );
}
