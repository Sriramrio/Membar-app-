import { useMemo, useState, useEffect, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Filter,
  CalendarDays,
  List,
  X,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  Trash2
} from 'lucide-react';

function EditIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}
import { useOrg } from '@/state/OrgStore';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { useOrgCommandAction } from '@/hooks/useOrgCommandAction';
import { AsyncState } from '@/components/AsyncState';
import { EmptyState } from '@/components/EmptyState';
import type { CalendarEntry } from '@/domain/types';
import { authStorage } from '@/utils/authStorage';

type ViewMode = 'MONTH' | 'WEEK' | 'AGENDA';
type EventCategory = 'ALL' | 'Meeting' | 'Event' | 'Task' | 'Action' | 'Approval';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarPage() {
  const s = useOrg();
  const cmd = useOrgCommandAction();
  const isLeadershipTeam = authStorage.isLeadershipTeam();
  const isTrust = authStorage.isTrustUser();

  // Navigation & Date State
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // View & Filter States
  const [viewMode, setViewMode] = useState<ViewMode>('MONTH');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory>('ALL');
  const [search, setSearch] = useState('');
  const [detailModalItem, setDetailModalItem] = useState<CalendarEntry | null>(null);
  const [detailRsvp, setDetailRsvp] = useState<{ attendingCount: number; notAvailableCount: number; substituteCount: number } | null>(null);

  useEffect(() => {
    if (!detailModalItem) {
      setDetailRsvp(null);
      return;
    }
    const rawId = detailModalItem.id.replace(/^(meeting|event):/, '');
    if (rawId && (detailModalItem.type === 'Meeting' || detailModalItem.type === 'Event')) {
      fetch(`/api/events/${rawId}/rsvp-summary`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setDetailRsvp({
            attendingCount: data.attendingCount ?? 0,
            notAvailableCount: data.notAvailableCount ?? 0,
            substituteCount: data.substituteCount ?? 0
          });
        })
        .catch(() => {});
    }
  }, [detailModalItem]);

  // Schedule Meeting Modal State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingType, setMeetingType] = useState('REGULAR');
  const [meetingChapterId, setMeetingChapterId] = useState('');
  const [calendarChapters, setCalendarChapters] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetch('/api/chapters')
      .then(r => r.json())
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.value || []);
        if (items.length > 0) {
          const mapped = items.map((c: any) => ({ id: String(c.id), name: c.name || c.id }));
          setCalendarChapters(mapped);
          const defaultCh = s.scope?.id && s.scope.id !== 'all' && mapped.some((m: { id: string; name: string }) => m.id === s.scope.id)
            ? s.scope.id
            : mapped[0].id;
          setMeetingChapterId(defaultCh);
        }
      })
      .catch(() => {});
  }, [s.scope?.id]);
  const [meetingDate, setMeetingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [meetingTime, setMeetingTime] = useState('09:30');
  const [meetingLocation, setMeetingLocation] = useState('Grand Palace Conference Hall');
  const [meetingAgenda, setMeetingAgenda] = useState('1. Quorum & Welcome, 2. Weekly Business Review, 3. Referrals Round');
  const [meetingError, setMeetingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Calendar Item Modal State
  const [editingCalendarItem, setEditingCalendarItem] = useState<CalendarEntry | null>(null);
  const [editMeetingTitle, setEditMeetingTitle] = useState('');
  const [editMeetingDate, setEditMeetingDate] = useState('');
  const [editMeetingTime, setEditMeetingTime] = useState('09:30');
  const [editMeetingLocation, setEditMeetingLocation] = useState('');
  const [editMeetingType, setEditMeetingType] = useState('Meeting');
  const [editMeetingChapterId, setEditMeetingChapterId] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editMeetingError, setEditMeetingError] = useState('');

  const openEditCalendarModal = (item: CalendarEntry) => {
    setEditingCalendarItem(item);
    setEditMeetingTitle(item.title);
    setEditMeetingDate(item.date || new Date().toISOString().slice(0, 10));
    setEditMeetingTime('09:30');
    setEditMeetingLocation(item.location || '');
    setEditMeetingType(item.type || 'Meeting');
    setEditMeetingChapterId(meetingChapterId || (calendarChapters[0]?.id || ''));
    setEditMeetingError('');
  };

  const handleSaveEditMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCalendarItem || !editMeetingTitle.trim() || isEditSubmitting) return;
    setIsEditSubmitting(true);
    setEditMeetingError('');

    try {
      const scheduledIso = `${editMeetingDate}T${editMeetingTime}:00Z`;
      const rawId = editingCalendarItem.id.replace(/^(meeting|event):/, '');
      const targetChId = editMeetingChapterId || (s.scope.id !== 'all' ? s.scope.id : (calendarChapters[0]?.id || ''));
      const targetChName = calendarChapters.find(c => c.id === targetChId)?.name || s.scope.name;

      const res = await cmd.run({
        commandType: 'org.meeting.update',
        aggregateType: 'Meeting',
        aggregateId: rawId,
        payload: {
          title: editMeetingTitle.trim(),
          type: editMeetingType,
          scheduledAt: scheduledIso,
          location: editMeetingLocation.trim(),
          scopeId: targetChId,
          scopeName: targetChName
        },
        reason: 'Update meeting from Calendar UI'
      });

      if (res.ok) {
        setEditingCalendarItem(null);
        setDetailModalItem(null);
        page.reload();
      } else {
        setEditMeetingError(res.error?.detail || 'Failed to update meeting.');
      }
    } catch (err: unknown) {
      setEditMeetingError(err instanceof Error ? err.message : 'Error updating meeting.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteCalendarItem = async (item: CalendarEntry) => {
    const confirmMsg = `Are you sure you want to permanently delete "${item.title}"? This action will remove it across all chapters and member views.`;
    if (!window.confirm(confirmMsg)) return;

    const rawId = item.id.replace(/^(meeting|event):/, '');
    try {
      const res = await fetch(`/api/events/${rawId}`, { method: 'DELETE' });
      if (res.ok) {
        setDetailModalItem(null);
        page.reload();
        return;
      }
    } catch {
      // fallback to domain command
    }

    await cmd.run({
      commandType: 'org.meeting.delete',
      aggregateType: 'Meeting',
      aggregateId: rawId,
      payload: {},
      reason: 'Delete meeting from Calendar'
    });
    setDetailModalItem(null);
    page.reload();
  };

  // Fallback items from local state (purely backup if network down)
  const local = useMemo<CalendarEntry[]>(() => [
    ...s.meetings.map(m => ({
      id: `meeting:${m.id}`,
      date: m.scheduledAt ? m.scheduledAt.slice(0, 10) : '',
      title: m.title,
      type: 'Meeting',
      to: `/org/meetings/${m.id}`,
      status: m.status,
      time: '10:00 AM',
      location: m.location || 'Meeting Venue'
    })),
    ...s.events.map(e => ({
      id: `event:${e.id}`,
      date: e.date,
      title: e.name,
      type: 'Event',
      to: `/org/events/${e.id}`,
      status: e.status,
      owner: e.owner,
      time: 'All Day',
      location: 'Chapter Center'
    })),
    ...s.tasks.map(t => ({
      id: `task:${t.id}`,
      date: t.due,
      title: t.title,
      type: 'Task',
      to: `/org/tasks/${t.id}`,
      status: t.status,
      owner: t.owner,
      time: 'Due Date',
      priority: t.priority
    })),
    ...s.actions.map(a => ({
      id: `action:${a.id}`,
      date: a.due,
      title: a.title,
      type: 'Action',
      to: `/org/actions/${a.id}`,
      status: a.status,
      owner: a.owner,
      time: 'Deadline',
      priority: a.priority
    })),
    ...s.approvals.map(ap => ({
      id: `approval:${ap.id}`,
      date: ap.due,
      title: ap.subject,
      type: 'Approval',
      to: `/org/approvals/${ap.id}`,
      status: ap.status,
      owner: ap.requester,
      time: 'Sign-off Due',
      priority: ap.risk
    }))
  ].sort((a, b) => a.date.localeCompare(b.date)), [s.meetings, s.events, s.tasks, s.actions, s.approvals]);

  // Request specification for backend query gateway
  const req = useMemo(() => ({
    queryId: 'org.calendar.list',
    organisationScope: s.scope.id,
    pageSize: 100
  }), [s.scope.id]);

  const page = useDomainCursorPage<CalendarEntry>(req, local);
  useRealtimeRefresh(['org.meeting.*', 'org.event.*', 'org.task.*', 'org.action.*', 'org.approval.*'], page.reload);

  // Raw items from database
  const allItems = useMemo<CalendarEntry[]>(() => {
    return page.page?.items ?? local;
  }, [page.page?.items, local]);

  // Client-side category & search filtering
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // 1. Category Filter
      if (categoryFilter !== 'ALL' && item.type !== categoryFilter) {
        return false;
      }
      // 2. Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesOwner = item.owner?.toLowerCase().includes(q);
        const matchesType = item.type?.toLowerCase().includes(q);
        const matchesLoc = item.location?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesOwner && !matchesType && !matchesLoc) {
          return false;
        }
      }
      return true;
    });
  }, [allItems, categoryFilter, search]);

  // Fast date map lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const item of filteredItems) {
      if (!item.date) continue;
      const key = item.date.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return map;
  }, [filteredItems]);

  // Date Navigation Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Calendar Grid Cells Generator (7x5 or 7x6 = 35 or 42 cells)
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{
      dateKey: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const d = String(dayNum).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      cells.push({
        dateKey: key,
        dayNum,
        isCurrentMonth: false,
        isToday: key === todayStr
      });
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = String(i).padStart(2, '0');
      const m = String(month + 1).padStart(2, '0');
      const key = `${year}-${m}-${d}`;
      cells.push({
        dateKey: key,
        dayNum: i,
        isCurrentMonth: true,
        isToday: key === todayStr
      });
    }

    // Trailing days from next month to complete rows of 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const d = String(i).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      cells.push({
        dateKey: key,
        dayNum: i,
        isCurrentMonth: false,
        isToday: key === todayStr
      });
    }

    return cells;
  }, [year, month]);

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    return eventsByDate.get(selectedDate) ?? [];
  }, [eventsByDate, selectedDate]);

  // Color & Badge Helper for Event Types
  const getEventBadge = (type: string) => {
    switch (type) {
      case 'Meeting':
        return {
          chip: 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100',
          dot: 'bg-blue-600',
          badge: 'bg-blue-100 text-blue-800'
        };
      case 'Event':
        return {
          chip: 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100',
          dot: 'bg-purple-600',
          badge: 'bg-purple-100 text-purple-800'
        };
      case 'Task':
        return {
          chip: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100',
          dot: 'bg-amber-500',
          badge: 'bg-amber-100 text-amber-800'
        };
      case 'Action':
        return {
          chip: 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100',
          dot: 'bg-emerald-600',
          badge: 'bg-emerald-100 text-emerald-800'
        };
      case 'Approval':
        return {
          chip: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
          dot: 'bg-rose-600',
          badge: 'bg-rose-100 text-rose-800'
        };
      default:
        return {
          chip: 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100',
          dot: 'bg-slate-500',
          badge: 'bg-slate-100 text-slate-800'
        };
    }
  };

  // Submit Schedule Meeting to PostgreSQL
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || cmd.busy) return;

    if (!meetingTitle.trim()) {
      setMeetingError('Please enter a meeting title.');
      return;
    }

    setIsSubmitting(true);
    setMeetingError('');

    try {
      const scheduledIso = `${meetingDate}T${meetingTime}:00Z`;

      const targetChId = meetingChapterId || (s.scope.id !== 'all' ? s.scope.id : (calendarChapters[0]?.id || ''));
      const targetChName = calendarChapters.find(c => c.id === targetChId)?.name || s.scope.name;

      const payload: any = {
        title: meetingTitle.trim(),
        type: meetingType,
        scheduledAt: scheduledIso,
        location: meetingLocation.trim(),
        agenda: meetingAgenda.trim() ? [meetingAgenda.trim()] : [],
        participants: ['Chapter President', 'Treasurer', 'Secretary', 'Members'],
        quorumRequired: 10
      };

      if (targetChId) {
        payload.scopeId = targetChId;
        payload.scopeName = targetChName;
        payload.scopeLevel = 'CHAPTER';
      }

      const res = await cmd.run(
        {
          commandType: 'org.meeting.create',
          aggregateType: 'Meeting',
          payload,
          reason: 'Meeting scheduled from Google Calendar UI'
        }
      );

      if (res.ok) {
        // Modal immediately closes and resets
        setIsScheduleOpen(false);
        setMeetingTitle('');
        setMeetingError('');
        // Reload fresh calendar data from database
        page.reload();
      } else {
        setMeetingError(res.error?.detail || res.error?.title || 'Failed to schedule meeting. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error scheduling meeting.';
      setMeetingError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Google Calendar Style Top Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Branding & Month Navigation */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Calendar</h1>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                  {s.scope.name || 'Chapter A'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Projection of canonical meetings, conclaves, deadlines and governance sign-offs.
              </p>
            </div>
          </div>

          {/* Center/Right: Navigation Controls & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Today Jump Button */}
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer shadow-2xs"
            >
              Today
            </button>

            {/* Prev / Next Month Buttons */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Month & Year Title Display */}
            <div className="text-sm font-bold text-slate-900 min-w-[140px] text-center">
              {MONTH_NAMES[month]} {year}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('MONTH')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  viewMode === 'MONTH'
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Month</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('AGENDA')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  viewMode === 'AGENDA'
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>

            {/* Schedule Meeting Action Button */}
            {!isTrust && (
              <button
                type="button"
                onClick={() => setIsScheduleOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Meeting</span>
              </button>
            )}
            {isTrust && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Trustee Oversight (Read-Only)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Layout: Left Sidebar + Center Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Sidebar: Filters, Search & Mini Overview (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Search Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Search schedule..."
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* "My Calendars" / Category Layer Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                Categories
              </span>
              <Filter className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="space-y-1.5">
              {[
                { id: 'ALL' as const, label: 'All Items', dot: 'bg-slate-700' },
                { id: 'Meeting' as const, label: 'Meetings', dot: 'bg-blue-600' },
                { id: 'Event' as const, label: 'Events & Conclaves', dot: 'bg-purple-600' },
                { id: 'Task' as const, label: 'Tasks & Deadlines', dot: 'bg-amber-500' },
                { id: 'Action' as const, label: 'Operational Actions', dot: 'bg-emerald-600' },
                { id: 'Approval' as const, label: 'Governance Approvals', dot: 'bg-rose-600' }
              ].map(cat => {
                const count = cat.id === 'ALL'
                  ? allItems.length
                  : allItems.filter(i => i.type === cat.id).length;
                const isSelected = categoryFilter === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 font-bold text-blue-900 ring-1 ring-blue-300'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.dot}`} />
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Quick Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Selected Date
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedDate}
                </div>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                {selectedDateEvents.length} items
              </span>
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {selectedDateEvents.map(item => {
                  const b = getEventBadge(item.type);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setDetailModalItem(item)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${b.chip}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${b.badge}`}>
                          {item.type}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          {item.time || 'All Day'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1 line-clamp-2">
                        {item.title}
                      </div>
                      {item.location && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No items scheduled for this date.
              </div>
            )}
          </div>
        </div>

        {/* Center/Right: Calendar View Area (9 cols) */}
        <div className="lg:col-span-9">
          <AsyncState
            loading={page.loading}
            refreshing={page.refreshing}
            stale={page.stale}
            error={page.error}
            onRetry={page.reload}
          >
            {/* MONTH GRID VIEW */}
            {viewMode === 'MONTH' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden overflow-x-auto">
                <div className="min-w-[640px]">
                  {/* 7 Day Header */}
                  <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center">
                  {DAYS_OF_WEEK.map(d => (
                    <div key={d} className="py-2.5 text-xs font-bold text-slate-600 tracking-wider">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
                  {calendarCells.map(cell => {
                    const dayEvents = eventsByDate.get(cell.dateKey) ?? [];
                    const isSelected = selectedDate === cell.dateKey;

                    return (
                      <div
                        key={cell.dateKey}
                        onClick={() => setSelectedDate(cell.dateKey)}
                        className={`min-h-[105px] p-1.5 transition-all flex flex-col justify-between cursor-pointer group ${
                          !cell.isCurrentMonth
                            ? 'bg-slate-50/40 text-slate-300'
                            : isSelected
                            ? 'bg-blue-50/30 ring-2 ring-blue-500/30'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Day Header with Number */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                              cell.isToday
                                ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                                : isSelected
                                ? 'bg-blue-100 text-blue-900 font-bold'
                                : cell.isCurrentMonth
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {cell.dayNum}
                          </span>

                          {dayEvents.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Event Chips List (up to 3 items) */}
                        <div className="space-y-1 flex-1 overflow-hidden">
                          {dayEvents.slice(0, 3).map(ev => {
                            const b = getEventBadge(ev.type);
                            return (
                              <button
                                key={ev.id}
                                type="button"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  setDetailModalItem(ev);
                                }}
                                className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] truncate flex items-center gap-1 font-medium transition-all ${b.chip}`}
                                title={`${ev.title} (${ev.time || 'All Day'})`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${b.dot}`} />
                                <span className="truncate">{ev.title}</span>
                              </button>
                            );
                          })}

                          {dayEvents.length > 3 && (
                            <div className="text-[10px] font-bold text-slate-500 pl-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

            {/* AGENDA LIST VIEW */}
            {viewMode === 'AGENDA' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                {filteredItems.length > 0 ? (
                  <div className="space-y-4">
                    {/* Group by Date */}
                    {Array.from(eventsByDate.entries())
                      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                      .map(([dateKey, items]) => (
                        <div key={dateKey} className="border-b border-slate-100 pb-4 last:border-b-0">
                          <div className="flex items-center gap-2 mb-2.5">
                            <CalendarDays className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-bold text-slate-900">{dateKey}</h3>
                            <span className="text-xs text-slate-400">
                              ({items.length} {items.length > 1 ? 'items' : 'item'})
                            </span>
                          </div>

                          <div className="space-y-2 pl-6">
                            {items.map(item => {
                              const b = getEventBadge(item.type);
                              return (
                                <div
                                  key={item.id}
                                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`w-3 h-3 rounded-full shrink-0 ${b.dot}`} />
                                    <div>
                                      <div className="text-xs font-bold text-slate-900">
                                        {item.title}
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${b.badge}`}>
                                          {item.type}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-slate-400" />
                                          {item.time || 'All Day'}
                                        </span>
                                        {item.owner && (
                                          <>
                                            <span>•</span>
                                            <span>{item.owner}</span>
                                          </>
                                        )}
                                        {item.location && (
                                          <>
                                            <span>•</span>
                                            <span className="flex items-center gap-0.5">
                                              <MapPin className="w-3 h-3 text-slate-400" />
                                              {item.location}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <Link
                                    to={item.to}
                                    className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-all no-underline shrink-0"
                                  >
                                    <span>Open</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptyState title="No scheduled operational items found" />
                )}
              </div>
            )}
          </AsyncState>
        </div>
      </div>

      {/* 3. Event / Record Detail Modal */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${getEventBadge(detailModalItem.type).dot}`} />
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${getEventBadge(detailModalItem.type).badge}`}>
                  {detailModalItem.type}
                </span>
                {detailModalItem.status && (
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {detailModalItem.status}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {detailModalItem.title}
              </h3>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong>Date & Time:</strong> {detailModalItem.date} {detailModalItem.time ? `· ${detailModalItem.time}` : ''}</span>
              </div>
              {detailModalItem.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><strong>Location:</strong> {detailModalItem.location}</span>
                </div>
              )}
              {detailModalItem.owner && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><strong>Owner / Requester:</strong> {detailModalItem.owner}</span>
                </div>
              )}
              {detailModalItem.priority && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><strong>Priority / Risk:</strong> {detailModalItem.priority}</span>
                </div>
              )}
            </div>

            {/* Live RSVP stats for Meetings and Events */}
            {detailRsvp && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Member Attendance RSVP</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-800">Attending</div>
                    <div className="text-base font-black text-emerald-700">{detailRsvp.attendingCount}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                    <div className="text-[10px] font-bold text-rose-800">Not Available</div>
                    <div className="text-base font-black text-rose-700">{detailRsvp.notAvailableCount}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="text-[10px] font-bold text-amber-800">Substitute</div>
                    <div className="text-base font-black text-amber-700">{detailRsvp.substituteCount}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>

              {!isTrust && (
                <>
                  <button
                    type="button"
                    onClick={() => openEditCalendarModal(detailModalItem)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <EditIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDeleteCalendarItem(detailModalItem)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </>
              )}

              <Link
                to={detailModalItem.to}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all no-underline cursor-pointer"
              >
                <span>Open Full Record</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Schedule New Meeting Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleScheduleMeeting}
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Schedule Parivar Meeting</h3>
                  <p className="text-[11px] text-slate-500">Creates an operational meeting record in PostgreSQL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {meetingError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{meetingError}</span>
              </div>
            )}

            <div className="space-y-3">
              {calendarChapters.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Chapter *
                  </label>
                  <select
                    value={meetingChapterId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMeetingChapterId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800 bg-white"
                  >
                    {calendarChapters.map(c => (
                      <option key={c.id} value={c.id}>📍 {c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Parivar Business Conclave & Weekly Review"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meeting Type
                  </label>
                  <select
                    value={meetingType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMeetingType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="REGULAR">Regular Weekly Meeting</option>
                    <option value="COMMITTEE">Executive Committee</option>
                    <option value="GENERAL_BODY">General Body Meeting (GBM)</option>
                    <option value="OPERATIONAL">Operational Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meeting Time
                  </label>
                  <input
                    type="time"
                    required
                    value={meetingTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeetingTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Date
                </label>
                <input
                  type="date"
                  required
                  value={meetingDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeetingDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location / Venue
                </label>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeetingLocation(e.target.value)}
                  placeholder="e.g. Grand Palace Conference Hall / Microsoft Teams"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agenda Highlights
                </label>
                <textarea
                  rows={2}
                  value={meetingAgenda}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMeetingAgenda(e.target.value)}
                  placeholder="Enter agenda points..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting || cmd.busy}
                onClick={() => {
                  setIsScheduleOpen(false);
                  setMeetingError('');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || cmd.busy || !meetingTitle.trim()}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isSubmitting || cmd.busy ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <span>Confirm &amp; Schedule</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Edit Existing Meeting Modal */}
      {editingCalendarItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditMeeting}
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <EditIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Modify &amp; Update Meeting</h3>
                  <p className="text-[11px] text-slate-500">Leadership Central Control: Updates reflect across all chapters</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCalendarItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editMeetingError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editMeetingError}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Chapter Selection for Leadership */}
              {calendarChapters.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Chapter
                  </label>
                  <select
                    value={editMeetingChapterId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditMeetingChapterId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    {calendarChapters.map(c => (
                      <option key={c.id} value={c.id}>📍 {c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={editMeetingTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditMeetingTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meeting Type
                  </label>
                  <select
                    value={editMeetingType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditMeetingType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="REGULAR">Regular Weekly Meeting</option>
                    <option value="COMMITTEE">Executive Committee</option>
                    <option value="GENERAL_BODY">General Body Meeting (GBM)</option>
                    <option value="OPERATIONAL">Operational Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meeting Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editMeetingDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={editMeetingLocation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditMeetingLocation(e.target.value)}
                  placeholder="e.g. Grand Palace Conference Hall / Microsoft Teams"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isEditSubmitting}
                onClick={() => setEditingCalendarItem(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isEditSubmitting || !editMeetingTitle.trim()}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isEditSubmitting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
