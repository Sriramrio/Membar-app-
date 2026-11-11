import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, MapPin, Users, CheckCircle2, XCircle, UserCheck, Phone, AlertCircle, RefreshCw } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/common/Input';
import { DetailGrid } from '@/features/member/components/EnterpriseMemberUI';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageHead, Section, StatusPill, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId, selectActiveMember } from '@/features/network/selectors';
import { rsvpEvent } from '@/features/network/networkSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { serverClock } from '@/services/time/serverClock';
import { apiClient } from '@/services/api/apiClient';
import type { Event } from '@/features/network/types';

interface RsvpSummaryData {
  attendingCount: number;
  notAvailableCount: number;
  substituteCount: number;
  totalResponses: number;
  myRsvp?: {
    status: 'ATTENDING' | 'NOT_AVAILABLE' | 'SUBSTITUTE' | string;
    substituteName?: string;
    substitutePhone?: string;
    notes?: string;
    updatedAt?: string;
  } | null;
}

export default function MemberEventDetailPage() {
  const { id } = useParams();
  const { go } = useMemberNavigation();
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const memberId = useAppSelector(activeMemberId);
  const activeMember = useAppSelector(selectActiveMember);
  const n = useNetworkSlice(['events', 'members'] as const);
  const formDef = useAppSelector(s => s.controlPlane.forms.find(f => f.purpose === 'Event Registration' && f.active));

  const [remoteEvent, setRemoteEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [localRegistered, setLocalRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    if (!id) return;

    const mapEvent = (found: any): Event => {
      const derivedAttendeeIds: string[] = Array.isArray(found.attendeeIds)
        ? found.attendeeIds
        : Array.isArray(found.responses)
          ? found.responses.filter((r: any) => r.status === 'ATTENDING').map((r: any) => r.memberId).filter(Boolean)
          : (found.registered || found.myRsvp?.status === 'ATTENDING' ? [memberId] : []);

      return {
        id: found.id ?? found.eventId ?? id,
        name: found.title ?? found.name ?? 'Chapter Conclave',
        description: found.description || 'Chapter meeting and professional networking session for verified members.',
        dateTime: found.dateTime ?? found.startsAt ?? found.date ?? found.scheduledAt ?? new Date().toISOString(),
        endDateTime: found.endDateTime ?? found.endsAt ?? found.startsAt ?? new Date(Date.now() + 7200000).toISOString(),
        venue: found.venue ?? found.location ?? 'Main Chapter Hall',
        city: found.city ?? activeMember?.city ?? (found.chapter ? found.chapter.replace(/chapter/i, '').trim() : 'Salem'),
        chapter: found.chapter ?? found.chapterName ?? activeMember?.chapter ?? 'Salem East Chapter',
        type: found.type ?? 'Training & Development',
        capacity: found.capacity ?? found.quorumRequired ?? 100,
        attendeeIds: derivedAttendeeIds,
        waitlistIds: Array.isArray(found.waitlistIds) ? found.waitlistIds : [],
        version: 1,
        attendeeVisibility: 'members' as const,
        registrationResponses: {},
        registrationMeta: {},
      };
    };

    apiClient.get<any>(`/events/${id}`)
      .then(item => {
        if (!active || !item) return;
        setRemoteEvent(mapEvent(item));
        if (item.attendingCount !== undefined) {
          setRsvpSummary({
            attendingCount: item.attendingCount ?? 0,
            notAvailableCount: item.notAvailableCount ?? 0,
            substituteCount: item.substituteCount ?? 0,
            totalResponses: item.totalResponses ?? 0,
            myRsvp: item.myRsvp ?? null,
          });
        }
        if (item.registered || item.myRsvp?.status === 'ATTENDING') {
          setLocalRegistered(true);
        } else if (item.myRsvp?.status === 'NOT_AVAILABLE') {
          setLocalRegistered(false);
        }
      })
      .catch(() => {
        return apiClient.get<any[]>('/calendar/events')
          .then(items => {
            if (!active || !Array.isArray(items)) return;
            const found = items.find(x => (x.id ?? x.eventId) === id);
            if (found) {
              setRemoteEvent(mapEvent(found));
              if (found.registered) setLocalRegistered(true);
            }
          });
      })
      .catch(err => {
        console.warn('Failed to fetch remote event:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id, memberId, activeMember]);

  const rawEvent = n.events.find(x => x.id === id) || remoteEvent;

  const event: Event | undefined = useMemo(() => {
    if (!rawEvent) return undefined;
    return {
      ...rawEvent,
      attendeeIds: Array.isArray(rawEvent.attendeeIds) ? rawEvent.attendeeIds : [],
      waitlistIds: Array.isArray(rawEvent.waitlistIds) ? rawEvent.waitlistIds : [],
    };
  }, [rawEvent]);

  const [responses, setResponses] = useState<Record<string, string | boolean | string[]>>(() => event?.registrationResponses?.[memberId] ?? {});
  const [acceptedTerms, setAcceptedTerms] = useState(Boolean(event?.registrationMeta?.[memberId]?.acceptedTermsAt));
  const [calendarStatus, setCalendarStatus] = useState('');

  // Chapter Member RSVP state
  const [rsvpSummary, setRsvpSummary] = useState<RsvpSummaryData | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpFeedback, setRsvpFeedback] = useState<string | null>(null);
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [subName, setSubName] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subNotes, setSubNotes] = useState('');
  const [subError, setSubError] = useState('');
  const [isChangingRsvp, setIsChangingRsvp] = useState(false);

  const fetchRsvpSummary = () => {
    if (!id) return;
    setRsvpLoading(true);
    apiClient.get<RsvpSummaryData>(`/events/${id}/rsvp-summary`)
      .then(data => {
        if (data) {
          setRsvpSummary(data);
          if (data.myRsvp) {
            if (data.myRsvp.status === 'ATTENDING') {
              setLocalRegistered(true);
            } else if (data.myRsvp.status === 'NOT_AVAILABLE') {
              setLocalRegistered(false);
            }
          }
        }
      })
      .catch(err => {
        console.warn('Could not load rsvp summary:', err);
      })
      .finally(() => setRsvpLoading(false));
  };

  useEffect(() => {
    fetchRsvpSummary();
  }, [id]);

  const submitRsvp = async (
    status: 'ATTENDING' | 'NOT_AVAILABLE' | 'SUBSTITUTE',
    substituteName?: string,
    substitutePhone?: string,
    notes?: string
  ) => {
    if (!id) return;
    setRsvpSubmitting(true);
    setRsvpFeedback(null);
    try {
      const res = await apiClient.post<any>(`/events/${id}/rsvp`, {
        status,
        substituteName: substituteName || undefined,
        substitutePhone: substitutePhone || undefined,
        notes: notes || undefined
      });
      setRsvpSummary(prev => ({
        attendingCount: res?.attendingCount ?? (status === 'ATTENDING' ? (prev?.attendingCount || 0) + 1 : (prev?.attendingCount || 0)),
        notAvailableCount: res?.notAvailableCount ?? (status === 'NOT_AVAILABLE' ? (prev?.notAvailableCount || 0) + 1 : (prev?.notAvailableCount || 0)),
        substituteCount: res?.substituteCount ?? (status === 'SUBSTITUTE' ? (prev?.substituteCount || 0) + 1 : (prev?.substituteCount || 0)),
        totalResponses: res?.totalResponses ?? ((prev?.totalResponses || 0) + 1),
        myRsvp: res?.rsvp || { status, substituteName, substitutePhone, notes, updatedAt: new Date().toISOString() }
      }));
      if (status === 'ATTENDING') {
        setLocalRegistered(true);
      } else {
        setLocalRegistered(false);
      }
      setIsChangingRsvp(false);
      setShowSubstituteModal(false);
      setRsvpFeedback(
        status === 'ATTENDING'
          ? 'Attendance confirmed! You are registered for this event.'
          : status === 'NOT_AVAILABLE'
          ? 'Response recorded: You marked yourself as Not Available.'
          : `Substitute confirmed: ${substituteName} will attend on your behalf.`
      );
    } catch (err: any) {
      console.error('Failed to submit RSVP:', err);
      setRsvpFeedback('Failed to update RSVP. Please try again.');
    } finally {
      setRsvpSubmitting(false);
    }
  };

  if (!event) {
    if (loading) {
      return (
        <div>
          <PageHead title="Loading Event..." />
          <div className="p-8 text-center text-slate-500">Retrieving event record...</div>
        </div>
      );
    }
    return (
      <>
        <PageHead title="Event" />
        <EmptyState
          title="Event unavailable"
          body="This event record is no longer available in your current network."
          action={<Button variant="secondary" onClick={() => go('/app/events', { label: 'Event' })}>Return to Events</Button>}
        />
      </>
    );
  }

  const attendeeIds = event?.attendeeIds ?? [];
  const waitlistIds = event?.waitlistIds ?? [];

  const formatDateTime = (val?: string) => {
    if (!val) return 'Date & time TBD';
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleString('en-IN');
  };

  const isActuallyAttending = localRegistered !== null
    ? localRegistered
    : attendeeIds.includes(memberId);
  const attending = isActuallyAttending;
  const waiting = !attending && waitlistIds.includes(memberId);
  const nowMs = serverClock.nowMs();
  const registrationOpen = (!event?.registrationOpenAt || new Date(event.registrationOpenAt).getTime() <= nowMs) &&
    (!event?.registrationCloseAt || new Date(event.registrationCloseAt).getTime() >= nowMs);
  const full = attendeeIds.length >= (event?.capacity ?? 100);
  const requiredComplete = (formDef?.fields.filter(f => f.required && ((f as { visibility?: string }).visibility === 'member' || !(f as { visibility?: string }).visibility)) ?? []).every(f => {
    const v = responses[f.id];
    return typeof v === 'boolean' ? v : Boolean(String(v ?? '').trim());
  });

  const setCustom = (field: string, value: string | boolean | string[]) => setResponses(x => ({ ...x, [field]: value }));

  const register = () => {
    if (!event) return;
    const payload = {
      eventId: event.id,
      memberId,
      attending: true,
      responses,
      formVersion: formDef ? String(formDef.version) : undefined,
      acceptedTerms: Boolean(!event.terms || acceptedTerms)
    };
    setLocalRegistered(true);
    void command.execute({
      domain: 'member',
      policyId: 'event.rsvp',
      command: 'event.rsvp',
      aggregateType: 'Event',
      aggregateId: event.id,
      expectedVersion: event.version,
      payload,
      previewAction: () => dispatch(rsvpEvent(payload))
    });
  };

  const cancel = () => {
    if (!event) return;
    const payload = { eventId: event.id, memberId, attending: false };
    setLocalRegistered(false);
    void command.execute({
      domain: 'member',
      policyId: 'event.rsvp',
      command: 'event.rsvp.cancel',
      aggregateType: 'Event',
      aggregateId: event.id,
      expectedVersion: event.version,
      payload,
      previewAction: () => dispatch(rsvpEvent(payload))
    });
  };

  const addCalendar = () => {
    if (!event) return;
    const rawStart = new Date(event.dateTime);
    const start = !isNaN(rawStart.getTime()) ? rawStart : new Date();
    const rawEnd = new Date(event.endDateTime);
    const end = !isNaN(rawEnd.getTime()) ? rawEnd : new Date(start.getTime() + 7200000);
    const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = (x?: string) => (x || '').replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
    const content = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SETHU//Business Network//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@sethu.local`,
      `DTSTAMP:${stamp(serverClock.now())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(event.name)}`,
      `LOCATION:${esc(`${event.venue || 'TBD'}, ${event.city || ''}`)}`,
      `DESCRIPTION:${esc(event.description)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    setCalendarStatus('Calendar file downloaded. Open it to add this event to your calendar.');
  };

  const canSeeAttendees = event.attendeeVisibility === 'members' || (event.attendeeVisibility === 'registered' && (attending || waiting));

  return (
    <div>
      <PageHead
        title={event.name}
        description={`${formatDateTime(event.dateTime)} · ${event.venue || 'TBD'}, ${event.city || ''}`}
        actions={
          <Button variant="secondary" onClick={addCalendar}>
            <CalendarPlus className="size-4" />Add to Calendar
          </Button>
        }
      />
      <div className="mb-4">
        <CommandExecutionFeedback error={command.error} onRetry={() => void command.retry()} onDismiss={command.clearError} />
      </div>
      {calendarStatus && (
        <div role="status" className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-800">
          {calendarStatus}
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-6">
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="info">{event.type}</StatusPill>
            <Badge>{event.chapter}</Badge>
            {waiting && <StatusPill tone="warn">Waitlisted</StatusPill>}
            {attending && <StatusPill tone="good">Registered</StatusPill>}
          </div>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">{event.description}</p>
          <div className="mt-6">
            <DetailGrid
              items={[
                { label: 'Starts', value: formatDateTime(event.dateTime) },
                { label: 'Ends', value: formatDateTime(event.endDateTime) },
                {
                  label: 'Venue',
                  value: (
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="size-4" />{event.venue || 'TBD'}, {event.city || ''}
                    </span>
                  )
                },
                {
                  label: 'Capacity',
                  value: (
                    <span className="inline-flex items-center gap-2">
                      <Users className="size-4" />
                      {(attending && !attendeeIds.includes(memberId) ? attendeeIds.length + 1 : attendeeIds.length)}/{event.capacity ?? 100} registered
                      {(waitlistIds.length > 0) ? ` · ${waitlistIds.length} waitlisted` : ''}
                    </span>
                  )
                }
              ]}
            />
          </div>
          {event.terms && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-base leading-7 text-slate-600">
              <strong>Registration terms:</strong> {event.terms}
            </div>
          )}
          {event.paymentRequired && (
            <div className="mt-5">
              <Tip>This event has a payment requirement. Registration and attendance entitlement remain subject to the governed payment status.</Tip>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900">Attendance RSVP</h2>
              <p className="text-xs text-slate-500 mt-0.5">Let your Parivar leadership know your meeting availability</p>
            </div>
            {rsvpLoading && (
              <RefreshCw className="size-4 text-sky-600 animate-spin" />
            )}
          </div>

          {/* Live RSVP Counts Bar */}
          <div className="mt-3.5 grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-[11px] font-bold text-emerald-800">Attending</div>
              <div className="text-lg font-black text-emerald-700">{rsvpSummary?.attendingCount ?? 0}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <div className="text-[11px] font-bold text-rose-800">Not Available</div>
              <div className="text-lg font-black text-rose-700">{rsvpSummary?.notAvailableCount ?? 0}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-[11px] font-bold text-amber-800">Substitute</div>
              <div className="text-lg font-black text-amber-700">{rsvpSummary?.substituteCount ?? 0}</div>
            </div>
          </div>

          {/* Feedback banner */}
          {rsvpFeedback && (
            <div className="mt-3 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-800 flex items-center justify-between">
              <span>{rsvpFeedback}</span>
              <button type="button" onClick={() => setRsvpFeedback(null)} className="text-sky-600 hover:text-sky-900 font-bold ml-2">✕</button>
            </div>
          )}

          {/* Active Response Display if already responded */}
          {rsvpSummary?.myRsvp && !isChangingRsvp ? (
            <div className="mt-4 p-4 rounded-xl border bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Your Parivar Response</span>
                <button
                  type="button"
                  onClick={() => setIsChangingRsvp(true)}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 underline cursor-pointer"
                >
                  Change Response
                </button>
              </div>

              {rsvpSummary.myRsvp.status === 'ATTENDING' && (
                <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm bg-emerald-100/70 p-3 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                  <div>
                    <div>🟢 You confirmed: I am attending</div>
                    <div className="text-xs font-normal text-emerald-700 mt-0.5">Your seat and roll call are confirmed.</div>
                  </div>
                </div>
              )}

              {rsvpSummary.myRsvp.status === 'NOT_AVAILABLE' && (
                <div className="flex items-center gap-2.5 text-rose-800 font-bold text-sm bg-rose-100/70 p-3 rounded-lg border border-rose-200">
                  <XCircle className="size-5 text-rose-600 shrink-0" />
                  <div>
                    <div>🔴 You marked: I'm not available</div>
                    <div className="text-xs font-normal text-rose-700 mt-0.5">Notified chapter leadership of your absence.</div>
                  </div>
                </div>
              )}

              {rsvpSummary.myRsvp.status === 'SUBSTITUTE' && (
                <div className="space-y-2 text-amber-900 font-bold text-sm bg-amber-100/70 p-3 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <UserCheck className="size-5 text-amber-700 shrink-0" />
                    <span>🟡 Substitute Sent: {rsvpSummary.myRsvp.substituteName}</span>
                  </div>
                  {rsvpSummary.myRsvp.substitutePhone && (
                    <div className="text-xs font-medium text-amber-800 pl-7 flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      <span>Contact: {rsvpSummary.myRsvp.substitutePhone}</span>
                    </div>
                  )}
                  {rsvpSummary.myRsvp.notes && (
                    <div className="text-xs font-normal text-amber-800 pl-7">
                      Notes: {rsvpSummary.myRsvp.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* 3 Response Options */
            <div className="mt-4 space-y-2.5">
              <label className="text-xs font-bold text-slate-700 block">Choose your response:</label>
              
              {/* Option 1: Attending */}
              <button
                type="button"
                disabled={rsvpSubmitting}
                onClick={() => submitRsvp('ATTENDING')}
                className="w-full text-left p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/80 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                    <CheckCircle2 className="size-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-950 group-hover:text-emerald-900">I am attending</div>
                    <div className="text-xs text-emerald-700">Confirm presence for this session</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">Select</span>
              </button>

              {/* Option 2: Not Available */}
              <button
                type="button"
                disabled={rsvpSubmitting}
                onClick={() => submitRsvp('NOT_AVAILABLE')}
                className="w-full text-left p-3.5 rounded-xl border border-rose-300 bg-rose-50/50 hover:bg-rose-100/80 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-rose-600 text-white shadow-2xs">
                    <XCircle className="size-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-rose-950 group-hover:text-rose-900">I'm not available</div>
                    <div className="text-xs text-rose-700">Cannot attend this event</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg">Select</span>
              </button>

              {/* Option 3: Send Substitute */}
              <button
                type="button"
                disabled={rsvpSubmitting}
                onClick={() => setShowSubstituteModal(true)}
                className="w-full text-left p-3.5 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100/80 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-amber-600 text-white shadow-2xs">
                    <UserCheck className="size-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-950 group-hover:text-amber-900">Send substitute</div>
                    <div className="text-xs text-amber-700">Send a representative or colleague</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">Enter Details</span>
              </button>

              {isChangingRsvp && (
                <button
                  type="button"
                  onClick={() => setIsChangingRsvp(false)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1"
                >
                  Keep previous response
                </button>
              )}
            </div>
          )}

          {/* Substitute Modal Dialog */}
          {showSubstituteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-700">
                      <UserCheck className="size-4.5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Send Substitute Member</h3>
                      <p className="text-[11px] text-slate-500">Provide details of the person attending for you</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowSubstituteModal(false); setSubError(''); }}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                {subError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {subError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Substitute Full Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      placeholder="e.g. Ramesh Kumar"
                      value={subName}
                      onChange={e => setSubName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Substitute Mobile / Phone *
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      placeholder="e.g. 9876543210"
                      value={subPhone}
                      onChange={e => setSubPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Notes / Message (Optional)
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      placeholder="e.g. Attending representing my consulting business"
                      value={subNotes}
                      onChange={e => setSubNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setShowSubstituteModal(false); setSubError(''); }}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={rsvpSubmitting}
                    onClick={() => {
                      if (!subName.trim()) {
                        setSubError('Substitute Name is required.');
                        return;
                      }
                      if (!subPhone.trim()) {
                        setSubError('Substitute Mobile number is required.');
                        return;
                      }
                      submitRsvp('SUBSTITUTE', subName.trim(), subPhone.trim(), subNotes.trim());
                    }}
                    className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {rsvpSubmitting ? 'Submitting...' : 'Confirm Substitute RSVP'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Standard Registration Section */}
          <div className="mt-6 pt-5 border-t border-slate-200/80">
            <h3 className="text-base font-bold text-slate-900">Registration Details</h3>
            {attending || waiting ? (
              <>
                <p className="mt-2 text-base leading-6 text-slate-600">
                  {attending
                    ? 'Your place is confirmed.'
                    : 'The event is currently at capacity. You are on the waitlist and will be promoted according to the event registration rules if a place opens.'}
                </p>
                <Button className="mt-4" variant="secondary" disabled={command.busy} onClick={cancel}>
                  Cancel {attending ? 'registration' : 'waitlist place'}
                </Button>
              </>
            ) : registrationOpen ? (
              <div className="mt-4 grid gap-4">
                {formDef?.fields
                  .filter(f => (f as { visibility?: string }).visibility === 'member' || !(f as { visibility?: string }).visibility)
                  .map(f => (
                    <div key={f.id}>
                      {f.type === 'checkbox' ? (
                        <label className="flex min-h-12 gap-3 rounded-xl border border-slate-200 p-3 text-base">
                          <input type="checkbox" checked={Boolean(responses[f.id])} onChange={x => setCustom(f.id, x.target.checked)} />
                          <span>{f.label}{f.required ? ' *' : ''}</span>
                        </label>
                      ) : f.type === 'textarea' ? (
                        <label className="grid gap-1.5 text-base font-bold">
                          {f.label}{f.required ? ' *' : ''}
                          <textarea
                            rows={3}
                            required={f.required}
                            className="rounded-xl border border-slate-300 p-3 font-normal"
                            value={String(responses[f.id] ?? '')}
                            onChange={x => setCustom(f.id, x.target.value)}
                          />
                        </label>
                      ) : (
                        <Input
                          label={`${f.label}${f.required ? ' *' : ''}`}
                          required={f.required}
                          value={String(responses[f.id] ?? '')}
                          onChange={x => setCustom(f.id, x.target.value)}
                        />
                      )}
                    </div>
                  ))}
                {event.terms && (
                  <label className="flex min-h-12 gap-3 rounded-xl border border-slate-200 p-3 text-base">
                    <input type="checkbox" checked={acceptedTerms} onChange={x => setAcceptedTerms(x.target.checked)} />
                    <span>I accept the event registration terms.</span>
                  </label>
                )}
                <Button disabled={command.busy || !requiredComplete || Boolean(event.terms && !acceptedTerms)} onClick={register}>
                  {full ? 'Join Waitlist' : 'Confirm Registration'}
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-base text-slate-600">The registration window is closed.</p>
            )}
          </div>
        </Card>
      </div>

      {canSeeAttendees && (
        <div className="mt-6">
          <Section title="Attendees" subtitle="Visibility follows the event's attendee policy.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {attendeeIds.map(mid => {
                const m = n.members.find(x => x.id === mid);
                return m ? (
                  <button
                    type="button"
                    key={mid}
                    onClick={() => go(`/app/members/${m.id}`, { label: event.name })}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-sky-300"
                  >
                    <div className="font-black">{m.name}</div>
                    <div className="mt-1 text-sm text-slate-600">{m.designation} · {m.chapter}</div>
                  </button>
                ) : null;
              })}
            </div>
          </Section>
        </div>
      )}

      {event.attendeeVisibility === 'private' && (
        <div className="mt-6">
          <Tip>Attendee identities are private for this event.</Tip>
        </div>
      )}
    </div>
  );
}
