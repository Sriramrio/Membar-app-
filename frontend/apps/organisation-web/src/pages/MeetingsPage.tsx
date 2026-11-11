import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { StatusPill } from '@/components/StatusPill';
import { AsyncState } from '@/components/AsyncState';
import { CursorPager } from '@/components/CursorPager';
import { EmptyState } from '@/components/EmptyState';
import { CommandFeedback } from '@/components/CommandFeedback';
import { useOrg } from '@/state/OrgStore';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { useOrgCommandAction } from '@/hooks/useOrgCommandAction';
import type { Meeting } from '@/domain/types';
import { useRouteView } from '@/config/routeViews';
import { X, CalendarDays, CheckSquare, User, ArrowRight, CheckCircle2, ShieldCheck, Trash2, MapPin } from 'lucide-react';
import { authStorage } from '@/utils/authStorage';

function Edit({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function PlusIcon({ className = 'size-4', stroke = 'currentColor' }: { className?: string; stroke?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function TagIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}

function UsersIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

export default function MeetingsPage() {
  const s = useOrg();
  const view = useRouteView('Meetings & MoM');
  const [params] = useSearchParams();
  const cmd = useOrgCommandAction();
  const isTrust = authStorage.isTrustUser();
  const isLeadershipTeam = authStorage.isLeadershipTeam();

  // Create Meeting Modal state
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [type, setType] = useState('OPERATIONAL');
  const [quorum, setQuorum] = useState(1);

  // Edit Meeting Modal state
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editType, setEditType] = useState('OPERATIONAL');
  const [editQuorum, setEditQuorum] = useState(1);
  const [editLocation, setEditLocation] = useState('');

  const openEditModal = (m: Meeting) => {
    setEditingMeeting(m);
    setEditTitle(m.title || '');
    let formattedDate = '';
    if (m.scheduledAt) {
      try {
        const d = new Date(m.scheduledAt);
        const pad = (n: number) => String(n).padStart(2, '0');
        formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch {}
    }
    setEditScheduledAt(formattedDate);
    setEditType(m.type || 'OPERATIONAL');
    setEditQuorum(m.quorumRequired ?? 1);
    setEditLocation(m.location || '');
  };

  const updateMeeting = async () => {
    if (!editingMeeting || !editTitle.trim()) return;
    const result = await cmd.run({
      commandType: 'org.meeting.update',
      aggregateType: 'Meeting',
      aggregateId: editingMeeting.id,
      expectedVersion: editingMeeting.version,
      payload: {
        title: editTitle.trim(),
        scheduledAt: editScheduledAt ? new Date(editScheduledAt).toISOString() : editingMeeting.scheduledAt,
        type: editType,
        quorumRequired: editQuorum,
        location: editLocation.trim(),
      },
      reason: 'Update meeting details by leadership team'
    });
    if (result.ok) {
      setEditingMeeting(null);
      page.reload();
    }
  };

  const deleteMeeting = async (m: Meeting) => {
    if (!window.confirm(`Are you sure you want to delete "${m.title}"? This cannot be undone.`)) return;
    const result = await cmd.run({
      commandType: 'org.meeting.delete',
      aggregateType: 'Meeting',
      aggregateId: m.id,
      payload: {},
      reason: 'Delete meeting by leadership team'
    });
    if (result.ok) {
      page.reload();
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        setShow(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show]);

  const requested = params.get('scopeId');
  const requestedUnit = requested ? s.units.find(u => u.id === requested) : undefined;
  const queryScope = requestedUnit?.id ?? s.scope.id;

  const local = useMemo(
    () => s.meetings.filter(m => !requestedUnit || m.scope.id === requestedUnit.id),
    [s.meetings, requestedUnit]
  );

  const req = useMemo(
    () => ({
      queryId: 'org.meetings.list',
      organisationScope: queryScope,
      pageSize: 25,
    }),
    [queryScope]
  );

  const page = useDomainCursorPage<Meeting>(req, local, [queryScope]);
  useRealtimeRefresh(['org.meeting.*', 'org.mom.*'], page.reload);

  const create = async () => {
    if (!title.trim() || !scheduledAt) return;
    const result = await cmd.run({
      commandType: 'org.meeting.create',
      aggregateType: 'Meeting',
      payload: {
        title: title.trim(),
        type,
        scheduledAt: new Date(scheduledAt).toISOString(),
        quorumRequired: quorum,
        participants: [s.actor.id],
        agenda: [],
      },
      reason: 'Create organisational meeting',
    });
    if (result.ok) {
      setTitle('');
      setScheduledAt('');
      setQuorum(1);
      setShow(false);
      page.reload();
    }
  };

  return (
    <>
      <PageHeader
        title={view.path === '/org/meetings' ? 'Meetings' : view.title}
        actions={
          isTrust ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
              <ShieldCheck className="size-4 text-amber-600" />
              <span>Trustee Audit Mode (Read-Only)</span>
            </div>
          ) : isLeadershipTeam ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold shadow-2xs">
              <ShieldCheck className="size-4 text-indigo-600" />
              <span>Leadership Team Mode (Edit & Delete Access)</span>
            </div>
          ) : (
            <button
              type="button"
              className="btn primary inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b5fa7] !text-white hover:bg-[#174f89] font-bold text-xs min-h-[42px] shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
              style={{ color: '#ffffff' }}
              onClick={() => setShow(true)}
            >
              <PlusIcon className="size-4 !text-white" />
              <span style={{ color: '#ffffff' }}>New meeting</span>
            </button>
          )
        }
      >
        Templates, smart agenda, quorum, resolutions, MoM and automatic follow-through.
      </PageHeader>

      {isTrust && (
        <div className="mb-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3 text-xs shadow-2xs">
          <ShieldCheck className="size-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold">Trustee Read-Only Oversight: </span>
            <span>You have audit access to all chapter meetings and Minutes of Meetings (MoM). Scheduling meetings and recording resolutions is managed by Parivar Leadership.</span>
          </div>
        </div>
      )}

      {isLeadershipTeam && (
        <div className="mb-4 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-3 text-xs shadow-2xs">
          <ShieldCheck className="size-5 text-indigo-600 shrink-0" />
          <div>
            <span className="font-bold">Leadership Governance Mode: </span>
            <span>You have edit and delete governance access on existing chapter meetings across all chapters. Parivar officers initiate new scheduled meetings.</span>
          </div>
        </div>
      )}

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      {/* Modal Popup for Scheduling New Meeting */}
      {show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) setShow(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-meeting-title"
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-[#1b5fa7] shadow-2xs border border-sky-100">
                  <CalendarDays className="size-5 text-[#1b5fa7]" />
                </span>
                <div>
                  <h3 id="modal-meeting-title" className="text-base font-bold text-slate-900">
                    Schedule New Meeting
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set up chapter meeting, smart agenda quorum, and follow-through
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Meeting Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckSquare className="size-3.5 text-slate-400" />
                  <span>Meeting Title</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                  placeholder="e.g. Parivar Executive Committee Review"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && title.trim() && scheduledAt) {
                      void create();
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Schedule Date & Time */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-slate-400" />
                    <span>Schedule Date & Time</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScheduledAt(e.target.value)}
                  />
                </div>

                {/* Meeting Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <TagIcon className="size-3.5 text-slate-400" />
                    <span>Meeting Type</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                    value={type}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}
                  >
                    <option value="OPERATIONAL">Operational Meeting</option>
                    <option value="EXECUTIVE">Executive Committee</option>
                    <option value="GOVERNANCE">Governance & Advisory</option>
                    <option value="GENERAL">General Assembly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Required Quorum */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <UsersIcon className="size-3.5 text-slate-400" />
                    <span>Required Quorum</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                    type="number"
                    min={1}
                    value={quorum}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setQuorum(Math.max(1, Number(e.target.value) || 1))
                    }
                  />
                </div>

                {/* Convened By / Scope */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="size-3.5 text-slate-400" />
                    <span>Convened By</span>
                    <span className="text-slate-400 font-normal text-[11px]">(Auto-assigned)</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/90 text-sm font-medium text-slate-700 cursor-not-allowed min-h-[44px]"
                    readOnly
                    value={s.actor.name}
                  />
                </div>
              </div>

              {/* Smart Agenda Note Banner */}
              <div className="text-xs font-medium text-slate-600 bg-blue-50/60 p-3 rounded-xl border border-blue-200/70 flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#1b5fa7] shrink-0"></span>
                <span>
                  Candidates: previous open actions, overdue tasks, Member cases and escalations will be automatically pre-populated into smart agenda.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 min-h-[42px] transition-all cursor-pointer"
                onClick={() => setShow(false)}
              >
                <span>Cancel</span>
              </button>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  className="btn primary inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1b5fa7] !text-white font-bold text-xs hover:bg-[#174f89] shadow-sm hover:shadow min-h-[42px] transition-all disabled:opacity-50 cursor-pointer"
                  style={{ color: '#ffffff' }}
                  disabled={cmd.busy || !title.trim() || !scheduledAt}
                  onClick={() => void create()}
                >
                  <PlusIcon className="size-4 !text-white" />
                  <span style={{ color: '#ffffff' }}>Create meeting</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Meeting Modal */}
      {editingMeeting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) setEditingMeeting(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-meeting-title"
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 shadow-2xs border border-indigo-100">
                  <Edit className="size-5 text-indigo-600" />
                </span>
                <div>
                  <h3 id="modal-edit-meeting-title" className="text-base font-bold text-slate-900">
                    Edit Meeting Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modify meeting title, quorum, date/time and venue
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMeeting(null)}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Meeting Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckSquare className="size-3.5 text-slate-400" />
                  <span>Meeting Title</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                  value={editTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Schedule Date & Time */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-slate-400" />
                    <span>Schedule Date & Time</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                    type="datetime-local"
                    value={editScheduledAt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditScheduledAt(e.target.value)}
                  />
                </div>

                {/* Meeting Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <TagIcon className="size-3.5 text-slate-400" />
                    <span>Meeting Type</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                    value={editType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditType(e.target.value)}
                  >
                    <option value="OPERATIONAL">Operational Meeting</option>
                    <option value="EXECUTIVE">Executive Committee</option>
                    <option value="GOVERNANCE">Governance & Advisory</option>
                    <option value="GENERAL">General Assembly</option>
                    <option value="NETWORKING">Networking Session</option>
                    <option value="REGULAR">Regular Weekly Business Meet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Required Quorum */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <UsersIcon className="size-3.5 text-slate-400" />
                    <span>Required Quorum</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                    type="number"
                    min={1}
                    value={editQuorum}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditQuorum(Math.max(1, Number(e.target.value) || 1))
                    }
                  />
                </div>

                {/* Location / Venue */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-slate-400" />
                    <span>Venue / Location</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                    placeholder="Parivar Hall or Online URL"
                    value={editLocation}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditLocation(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 min-h-[42px] transition-all cursor-pointer"
                onClick={() => setEditingMeeting(null)}
              >
                <span>Cancel</span>
              </button>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  className="btn primary inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 !text-white font-bold text-xs shadow-sm hover:shadow min-h-[42px] transition-all disabled:opacity-50 cursor-pointer"
                  style={{ color: '#ffffff' }}
                  disabled={cmd.busy || !editTitle.trim()}
                  onClick={() => void updateMeeting()}
                >
                  <Edit className="size-4 !text-white" />
                  <span style={{ color: '#ffffff' }}>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Header */}
      <div className="section-title flex items-center justify-between mb-4 mt-2">
        <h2 className="text-base font-bold text-slate-900">Upcoming / active meetings</h2>
        {page.page?.items.length !== undefined && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {page.page.items.length} records
          </span>
        )}
      </div>

      {/* Meetings List */}
      <AsyncState
        loading={page.loading}
        refreshing={page.refreshing}
        stale={page.stale}
        error={page.error}
        onRetry={page.reload}
      >
        {page.page?.items.length ? (
          <div className="list space-y-3">
            {page.page.items.map((m) => {
              const isCompleted = m.status === 'COMPLETED' || m.status === 'CLOSED';
              const borderAccent = isCompleted
                ? 'border-l-4 border-l-emerald-500'
                : 'border-l-4 border-l-[#1b5fa7]';

              const formattedDate = m.scheduledAt
                ? new Date(m.scheduledAt).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'Date TBD';

              return (
                <div
                  key={m.id}
                  className={`p-4.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${borderAccent}`}
                >
                  {/* Meeting Information */}
                  <div className="flex-1 min-w-0">
                    <Link
                      className="row-title font-bold text-base text-slate-900 hover:text-[#1b5fa7] transition-colors line-clamp-1 block"
                      to={`/org/meetings/${m.id}`}
                    >
                      {m.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-2">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <TagIcon className="size-3 text-slate-400" />
                        <span>{m.type?.replaceAll('_', ' ') || 'OPERATIONAL'}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <CalendarDays className="size-3 text-slate-400" />
                        <span>{formattedDate}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-bold text-[#1b5fa7] bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                        <UsersIcon className="size-3 text-[#1b5fa7]" />
                        <span>Quorum: {m.quorumRequired ?? 1}</span>
                      </span>

                      {m.participants && m.participants.length > 0 && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <User className="size-3 text-slate-400" />
                          <span>{m.participants.length} participants</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="row-actions flex flex-wrap items-center gap-2.5 shrink-0">
                    <StatusPill value={m.status} />

                    <Link
                      className="btn px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs min-h-[38px] inline-flex items-center transition-all shadow-2xs cursor-pointer"
                      to={`/org/meetings/${m.id}`}
                    >
                      Open meeting
                    </Link>

                    {!isTrust && (
                      <>
                        <button
                          type="button"
                          className="btn px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs min-h-[38px] inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          onClick={() => openEditModal(m)}
                          title="Modify meeting details"
                        >
                          <Edit className="size-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="btn px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs min-h-[38px] inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          onClick={() => void deleteMeeting(m)}
                          title="Delete this meeting"
                        >
                          <Trash2 className="size-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}

                    <Link
                      className="btn primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1b5fa7] !text-white font-bold text-xs hover:bg-[#174f89] shadow-xs min-h-[38px] transition-all cursor-pointer"
                      style={{ color: '#ffffff' }}
                      to={`/org/meetings/${m.id}`}
                    >
                      <span>Prepare MoM</span>
                      <ArrowRight className="size-3.5 !text-white" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No meetings in this scope" />
        )}

        <CursorPager
          canPrevious={page.canPrevious}
          canNext={page.canNext}
          onPrevious={page.previous}
          onNext={page.next}
          totalEstimate={page.page?.totalEstimate}
        />
      </AsyncState>

      {/* Styled MoM & Governance Standards Card */}
      <div className="card mt-10 p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3 mb-3">
          <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-[#1b5fa7]">
            <CheckCircle2 className="size-5 text-[#1b5fa7]" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Meeting & Minutes of Meeting (MoM) Standard</h2>
            <p className="text-xs text-slate-500">Authoritative governance lifecycle from smart agenda to automatic follow-through.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4 pt-3 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-1">Smart Agenda</span>
            <strong className="text-xs font-bold text-slate-900 block">Automatic Candidate Pull</strong>
            <p className="text-[11px] text-slate-500 mt-1">Carries forward open tasks, pending member cases, and escalated operational items.</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-1">Quorum Control</span>
            <strong className="text-xs font-bold text-slate-900 block">Enforced Participation</strong>
            <p className="text-[11px] text-slate-500 mt-1">Formal decisions require verified attendance meeting or exceeding quorum requirement.</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-1">Follow-Through</span>
            <strong className="text-xs font-bold text-slate-900 block">Immutable Record</strong>
            <p className="text-[11px] text-slate-500 mt-1">Published MoM automatically creates assigned obligations and tasks in the Action Register.</p>
          </div>
        </div>
      </div>
    </>
  );
}
