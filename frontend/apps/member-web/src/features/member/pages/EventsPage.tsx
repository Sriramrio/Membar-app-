import { serverClock } from '@/services/time/serverClock';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock3, Users, RefreshCw } from 'lucide-react';
import { useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, PageHead, SearchField, StatusPill } from '@/features/network/components/NetworkUI';
import { activeMemberId, selectActiveMember } from '@/features/network/selectors';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { MemberJourneyScopeBar } from '@/features/member/components/MemberJourneyScopeBar';
import { useMemberJourneyScope } from '@/features/member/navigation/useMemberJourneyScope';
import { apiClient } from '@/services/api/apiClient';

type EventTab = 'upcoming' | 'registered' | 'attended' | 'past';

export default function EventsPage() {
  const { go } = useMemberNavigation();
  const { scope, setScope } = useMemberJourneyScope();
  const memberId = useAppSelector(activeMemberId);
  const member = useAppSelector(selectActiveMember);
  const n = useNetworkSlice(['attendance', 'events'] as const);
  const [params, setParams] = useSearchParams();
  const requestedTab = (params.get('view') ?? 'upcoming') as EventTab;
  const tab: EventTab = ['upcoming', 'registered', 'attended', 'past'].includes(requestedTab) ? requestedTab : 'upcoming';
  const chapterFilter = params.get('chapter') ?? '';
  const [q, setQ] = useState('');
  const now = serverClock.nowMs();

  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const fetchEvents = useCallback(() => {
    setIsLoading(true);
    apiClient.get<any[]>('/events')
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setLiveEvents(res);
          setIsLiveConnected(true);
        } else {
          return apiClient.get<any[]>('/calendar/events')
            .then(cRes => {
              if (Array.isArray(cRes) && cRes.length > 0) {
                setLiveEvents(cRes);
                setIsLiveConnected(true);
              }
            });
        }
      })
      .catch(() => {
        apiClient.get<any[]>('/calendar/events')
          .then(cRes => {
            if (Array.isArray(cRes) && cRes.length > 0) {
              setLiveEvents(cRes);
              setIsLiveConnected(true);
            }
          })
          .catch(() => {});
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const allEvents = useMemo(() => {
    if (liveEvents.length > 0) {
      return liveEvents.map(e => ({
        id: String(e.id),
        name: e.name || e.title || 'Network Event',
        type: e.type || 'Meeting',
        dateTime: e.dateTime || e.scheduledAt || e.date || new Date().toISOString(),
        venue: e.venue || e.location || 'Main Hall',
        city: e.city || 'Salem',
        chapter: e.chapter || e.chapterName || 'Salem Chapter',
        description: e.description || `${e.name || e.title || 'Activity'} scheduled for network members.`,
        capacity: e.capacity || 50,
        attendeeIds: e.myRsvp?.status === 'ATTENDING' ? [memberId] : [],
        waitlistIds: [],
      }));
    }
    return n.events;
  }, [liveEvents, n.events, memberId]);

  const rows = useMemo(() => allEvents.filter(e => {
    if (scope === 'chapter' && member?.chapter && e.chapter !== member.chapter) return false;
    if (scope !== 'chapter' && chapterFilter && e.chapter !== chapterFilter) return false;
    const start = new Date(e.dateTime).getTime();
    const attendance = n.attendance.find(a => a.eventId === e.id && a.memberId === memberId);
    const registered = e.attendeeIds.includes(memberId) || (e.waitlistIds ?? []).includes(memberId);
    if (tab === 'upcoming' && start < now) return false;
    if (tab === 'registered' && (!registered || start < now)) return false;
    if (tab === 'attended' && attendance?.status !== 'present') return false;
    if (tab === 'past' && start >= now) return false;
    return !q || `${e.name} ${e.city} ${e.type} ${e.chapter}`.toLowerCase().includes(q.toLowerCase());
  }).sort((a, b) => tab === 'past' ? b.dateTime.localeCompare(a.dateTime) : a.dateTime.localeCompare(b.dateTime)), [allEvents, n.attendance, memberId, tab, q, now, chapterFilter, scope, member?.chapter]);

  return (
    <div>
      <PageHead
        eyebrow={isLiveConnected ? "Database Live Events" : undefined}
        title="Events"
        description="Discover, register and follow through on chapter, regional and network activities."
        actions={
          <Button variant="ghost" onClick={fetchEvents} disabled={isLoading}>
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        }
      />
      <MemberJourneyScopeBar value={scope} onChange={setScope} className="mb-5" />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {([['upcoming', 'Upcoming'], ['registered', 'Registered'], ['attended', 'Attended'], ['past', 'Past']] as const).map(([v, l]) => (
          <Button
            key={v}
            variant={tab === v ? 'default' : 'secondary'}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set('view', v);
              setParams(next, { replace: true });
            }}
            className="shrink-0"
          >
            {l}
          </Button>
        ))}
      </div>
      <SearchField value={q} onChange={setQ} placeholder="Search events, cities, chapters or event types…" />
      <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {rows.map(e => {
          const attending = e.attendeeIds.includes(memberId);
          const waiting = (e.waitlistIds ?? []).includes(memberId);
          const attendance = n.attendance.find(a => a.eventId === e.id && a.memberId === memberId);
          const sameChapter = member?.chapter === e.chapter;
          return (
            <Card key={e.id} className="flex h-full flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-800">
                  <CalendarDays className="size-5" />
                </span>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => go(`/app/events/${e.id}`, { label: 'Events' })}
                    className="text-left text-lg font-black leading-6 hover:text-sky-700 hover:underline"
                  >
                    {e.name}
                  </button>
                  <div className="mt-1 text-sm text-slate-500">
                    {new Date(e.dateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill tone="info">{e.type}</StatusPill>
                {sameChapter && <StatusPill tone="good">Parivar</StatusPill>}
                {attending && <StatusPill tone="good">Registered</StatusPill>}
                {waiting && <StatusPill tone="warn">Waitlisted</StatusPill>}
                {attendance?.status === 'present' && <StatusPill tone="good">Attended</StatusPill>}
              </div>
              <p className="mt-4 line-clamp-3 text-base leading-7 text-slate-600">{e.description}</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2"><Clock3 className="size-4" />{e.venue} · {e.city}</span>
                <span className="inline-flex items-center gap-2"><Users className="size-4" />{e.attendeeIds.length}/{e.capacity} registered{(e.waitlistIds?.length ?? 0) > 0 ? ` · ${e.waitlistIds!.length} waitlisted` : ''}</span>
              </div>
              <Button
                className="mt-5"
                variant={attending || waiting ? 'secondary' : 'default'}
                onClick={() => go(`/app/events/${e.id}`, { label: 'Events' })}
              >
                {attending ? <><CheckCircle2 className="size-4" />Manage registration</> : waiting ? 'View waitlist status' : 'View & register'}
              </Button>
            </Card>
          );
        })}
      </div>
      {!rows.length && (
        <div className="mt-5">
          <EmptyState
            title={`No ${tab} events found`}
            body={q ? 'Try a broader search.' : 'Events will appear here when they match this view.'}
          />
        </div>
      )}
    </div>
  );
}
