import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { AsyncState } from '@/components/AsyncState';
import { CursorPager } from '@/components/CursorPager';
import { EmptyState } from '@/components/EmptyState';
import { CommandFeedback } from '@/components/CommandFeedback';
import { useOrg } from '@/state/OrgStore';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { useOrgCommandAction } from '@/hooks/useOrgCommandAction';
import { businessDateOnly } from '@/utils/businessDate';
import type { AttendanceRecord } from '@/domain/types';
import { authStorage } from '@/utils/authStorage';
import { ShieldCheck, CheckCircle2, Clock, CreditCard } from 'lucide-react';

export default function AttendancePage() {
  const s = useOrg();
  const nav = useNavigate();
  const cmd = useOrgCommandAction();
  const isTrust = authStorage.isTrustUser();
  const isLeadershipTeam = authStorage.isLeadershipTeam();
  const isReadOnly = isTrust || isLeadershipTeam;
  const isTreasurer = authStorage.isTreasurer() || (s.actor?.position || '').toLowerCase().includes('treasurer') || (s.actor?.position || '').toLowerCase().includes('trusser');
  const canVerifyMeetingPayment = !isReadOnly && (isTreasurer || (s.actor?.position || '').toLowerCase().includes('president'));

  // Query & state
  const req = useMemo(() => ({
    queryId: 'org.attendance.list',
    organisationScope: s.scope.id,
    pageSize: 50
  }), [s.scope.id]);

  const page = useDomainCursorPage<AttendanceRecord>(req, [], [s.scope.id]);
  useRealtimeRefresh(['org.attendance.*', 'org.meeting.*', 'org.task.*'], page.reload);

  // Filter & Search states
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states: Correct Attendance
  const [correctingRecord, setCorrectingRecord] = useState<AttendanceRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<'Present' | 'Absent' | 'Substitute' | 'Excused'>('Present');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  // Modal states: Record Attendance
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newStatus, setNewStatus] = useState<'Present' | 'Absent' | 'Substitute' | 'Excused'>('Present');
  const [newSessionName, setNewSessionName] = useState('Weekly Chapter Business Meeting');
  const [recordNote, setRecordNote] = useState('');

  // Filtered list
  const filteredItems = useMemo(() => {
    if (!page.page?.items) return [];
    return page.page.items.filter(item => {
      const matchesStatus = filterStatus === 'ALL' || item.status.toLowerCase() === filterStatus.toLowerCase();
      const matchesSearch = !searchQuery || 
        (item.memberName && item.memberName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.sessionId && item.sessionId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.status.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [page.page?.items, filterStatus, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const items = page.page?.items ?? [];
    const total = items.length;
    const present = items.filter(i => i.status.toLowerCase() === 'present').length;
    const substitute = items.filter(i => i.status.toLowerCase() === 'substitute').length;
    const absent = items.filter(i => i.status.toLowerCase() === 'absent').length;
    const excused = items.filter(i => i.status.toLowerCase() === 'excused').length;
    const effectivePresent = present + substitute;
    const rate = total > 0 ? Math.round((effectivePresent / total) * 100) : 0;
    const verifiedPayments = items.filter(i => i.isPaymentVerified).length;
    const pendingPayments = items.filter(i => !i.isPaymentVerified && i.status.toLowerCase() !== 'absent').length;
    return { total, present, substitute, absent, excused, rate, verifiedPayments, pendingPayments };
  }, [page.page?.items]);

  // Actions
  const handleVerifyMeetingPayment = async (a: AttendanceRecord) => {
    if (isReadOnly) return;
    const res = await cmd.run({
      commandType: 'org.meeting.payment.verify',
      aggregateType: 'Attendance',
      aggregateId: a.id,
      payload: {
        attendanceId: a.id,
        memberId: a.memberId,
        meetingId: a.sessionId,
        amount: 500,
        verifiedBy: s.actor.name,
        scopeId: s.scope.id
      },
      reason: `Meeting fee payment verified by ${s.actor.name} (${s.actor.position || 'Treasurer'})`
    });
    if (res.ok) {
      page.reload();
    }
  };

  const handleFollowUp = async (a: AttendanceRecord) => {
    if (isReadOnly) return;
    const res = await cmd.run({
      commandType: 'org.task.create',
      aggregateType: 'Task',
      payload: {
        title: `Attendance follow-up: ${a.memberName ?? a.memberId}`,
        description: `Participation follow-up for recorded status: ${a.status} in session ${a.sessionId || 'Chapter Meeting'}. Contact member to assess availability and support.`,
        owner: s.actor.name,
        sourceType: 'ATTENDANCE',
        sourceId: a.id,
        due: businessDateOnly(3),
        priority: a.status === 'Absent' ? 'HIGH' : 'MEDIUM',
        status: 'TODO',
        scope: s.scope
      },
      reason: `Intervention task generated for ${a.memberName ?? a.memberId} (${a.status})`
    });
    if (res.ok) {
      page.reload();
    }
  };

  const openCorrection = (a: AttendanceRecord) => {
    if (isReadOnly) return;
    setCorrectingRecord(a);
    // default to something different than current
    if (a.status === 'Present') setTargetStatus('Substitute');
    else if (a.status === 'Absent') setTargetStatus('Present');
    else if (a.status === 'Substitute') setTargetStatus('Present');
    else setTargetStatus('Present');
    setCorrectionReason('');
  };

  const submitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!correctingRecord) return;
    const res = await cmd.run({
      commandType: 'org.attendance.correct',
      aggregateType: 'Attendance',
      aggregateId: correctingRecord.id,
      expectedVersion: correctingRecord.version,
      payload: {
        status: targetStatus,
        reason: correctionReason.trim() || `Governed status update to ${targetStatus}`
      },
      reason: `Attendance correction for ${correctingRecord.memberName ?? correctingRecord.memberId}`
    });

    if (res.ok) {
      setCorrectingRecord(null);
      page.reload();
    }
  };

  const submitNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!newMemberName.trim()) return;

    const res = await cmd.run({
      commandType: 'org.attendance.record',
      aggregateType: 'Attendance',
      payload: {
        memberName: newMemberName.trim(),
        sessionType: 'MEETING',
        sessionId: newSessionName.trim() || 'Weekly Chapter Business Meeting',
        status: newStatus,
        reason: recordNote.trim() || 'Recorded via Chapter Attendance Operations',
        scopeId: s.scope.id
      },
      reason: `Record new attendance for ${newMemberName.trim()}`
    });

    if (res.ok) {
      setShowRecordModal(false);
      setNewMemberName('');
      setRecordNote('');
      page.reload();
    }
  };

  // Helper badge color
  const getStatusBadge = (status: string) => {
    const sLow = status.toLowerCase();
    switch (sLow) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Present
          </span>
        );
      case 'substitute':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            Substitute
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Absent
          </span>
        );
      case 'excused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Excused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <PageHeader
        title="Attendance Operations"
        actions={
          isTrust ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
              <ShieldCheck className="size-4 text-amber-600" />
              <span>Trustee Audit Mode (Read-Only)</span>
            </div>
          ) : isLeadershipTeam ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold shadow-2xs">
              <ShieldCheck className="size-4 text-indigo-600" />
              <span>Leadership Team Mode (Read-Only Audit)</span>
            </div>
          ) : null
        }
      >
        Attendance remains canonical. This workspace detects participation gaps, creates follow-up work, and submits governed corrections directly connected to chapter operations.
      </PageHeader>

      {isTrust && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs font-medium flex items-center gap-2.5">
          <ShieldCheck className="size-5 text-amber-700 shrink-0" />
          <span>
            <strong>Trustee Read-Only Oversight:</strong> Attendance tracking, follow-ups, and corrections are recorded and managed by Chapter Leadership. Trustee has full audit and visibility access.
          </span>
        </div>
      )}

      {isTreasurer && (
        <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-900 text-xs font-medium flex items-center gap-2.5">
          <CreditCard className="size-5 text-emerald-700 shrink-0" />
          <span>
            <strong>Treasurer Workspace:</strong> You have authority to verify chapter meeting fee payments. Click "Verify Meeting Payment" on attendees below to record real-time fee verification.
          </span>
        </div>
      )}

      {isLeadershipTeam && (
        <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200/90 text-indigo-900 text-xs font-medium flex items-center gap-2.5">
          <ShieldCheck className="size-5 text-indigo-700 shrink-0" />
          <span>
            <strong>Leadership Read-Only Oversight:</strong> Attendance tracking and corrections are governed by Chapter Executive Officers. You have full audit visibility across all chapters.
          </span>
        </div>
      )}

      <CommandFeedback
        busy={cmd.busy}
        slow={cmd.slow}
        error={cmd.error}
        onRetry={cmd.retry}
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Total Tracked</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
          <div className="text-xs font-medium text-emerald-700">Present</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.present}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-sky-100 bg-sky-50/20 shadow-2xs">
          <div className="text-xs font-medium text-sky-700">Substitute</div>
          <div className="text-2xl font-bold text-sky-800 mt-1">{stats.substitute}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-rose-100 bg-rose-50/20 shadow-2xs">
          <div className="text-xs font-medium text-rose-700">Absent</div>
          <div className="text-2xl font-bold text-rose-800 mt-1">{stats.absent}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-amber-100 bg-amber-50/20 shadow-2xs">
          <div className="text-xs font-medium text-amber-700">Excused</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{stats.excused}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-indigo-100 bg-indigo-50/20 shadow-2xs">
          <div className="text-xs font-medium text-indigo-700">Effective Rate</div>
          <div className="text-2xl font-bold text-indigo-900 mt-1">{stats.rate}%</div>
        </div>
      </div>

      {/* Action Bar & Quick Nav */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="btn px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 min-h-[40px] transition-colors shadow-2xs inline-flex items-center gap-1.5"
            onClick={() => nav('/org/committees?type=ATTENDANCE')}
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Attendance Committee
          </button>
          <Link
            className="btn px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 min-h-[40px] transition-colors shadow-2xs inline-flex items-center gap-1.5"
            to="/org/meetings"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Meetings
          </Link>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              className="btn px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 min-h-[40px] transition-colors shadow-xs inline-flex items-center gap-1.5"
              onClick={() => setShowRecordModal(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Record Attendance
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Records' },
            { id: 'PRESENT', label: 'Present' },
            { id: 'SUBSTITUTE', label: 'Substitute' },
            { id: 'ABSENT', label: 'Absent' },
            { id: 'EXCUSED', label: 'Excused' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              onClick={() => setFilterStatus(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            placeholder="Search member or meeting..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Attendance List */}
      <AsyncState
        loading={page.loading}
        refreshing={page.refreshing}
        stale={page.stale}
        error={page.error}
        onRetry={page.reload}
      >
        {filteredItems.length ? (
          <div className="list space-y-2.5">
            {filteredItems.map(a => (
              <div
                className="row p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-200 hover:shadow-xs transition-all"
                key={a.id}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <b className="text-sm font-bold text-slate-900">
                      {a.memberName ?? a.memberId}
                    </b>
                    {getStatusBadge(a.status)}
                    {a.isPaymentVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Meeting Fee: Paid & Verified
                      </span>
                    ) : a.status.toLowerCase() === 'absent' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Meeting Fee: Exempt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Meeting Fee: Pending Verification
                      </span>
                    )}
                  </div>
                  <div className="row-meta text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-600">{a.sessionType}</span>
                    <span>·</span>
                    <span className="text-slate-600">{a.sessionId}</span>
                    {a.recordedAt && (
                      <>
                        <span>·</span>
                        <span>{new Date(a.recordedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </>
                    )}
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="row-actions flex items-center gap-2 flex-wrap shrink-0">
                    {canVerifyMeetingPayment && !a.isPaymentVerified && a.status.toLowerCase() !== 'absent' && (
                      <button
                        className="btn px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 min-h-[38px] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 shadow-2xs"
                        disabled={cmd.busy}
                        onClick={() => void handleVerifyMeetingPayment(a)}
                        title="Verify Chapter Meeting Payment (Treasurer Action)"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-white" />
                        Verify Meeting Payment
                      </button>
                    )}
                    <button
                      className="btn px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 min-h-[38px] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 shadow-2xs"
                      disabled={cmd.busy}
                      onClick={() => void handleFollowUp(a)}
                      title="Generate a governed follow-up task"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Create follow-up
                    </button>
                    <button
                      className="btn px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 text-indigo-700 font-semibold text-xs hover:bg-indigo-100 min-h-[38px] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 shadow-2xs"
                      disabled={cmd.busy}
                      onClick={() => openCorrection(a)}
                      title="Correct attendance record with reason"
                    >
                      <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Correct attendance
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={searchQuery || filterStatus !== 'ALL' ? "No matching attendance records found" : "No attendance records in this scope"}
          />
        )}

        <CursorPager
          canPrevious={page.canPrevious}
          canNext={page.canNext}
          onPrevious={page.previous}
          onNext={page.next}
          totalEstimate={page.page?.totalEstimate}
        />
      </AsyncState>

      {/* Correct Attendance Modal */}
      {correctingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Correct Attendance</h3>
                <p className="text-xs text-slate-500 mt-0.5">Submit governed correction to canonical record</p>
              </div>
              <button
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                onClick={() => setCorrectingRecord(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitCorrection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Parivar Member</label>
                <div className="text-sm font-bold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {correctingRecord.memberName ?? correctingRecord.memberId}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Current Status</label>
                <div>{getStatusBadge(correctingRecord.status)}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corrected Status *</label>
                <select
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  value={targetStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetStatus(e.target.value as any)}
                  required
                >
                  <option value="Present">Present</option>
                  <option value="Substitute">Substitute</option>
                  <option value="Absent">Absent</option>
                  <option value="Excused">Excused</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Correction *</label>
                <textarea
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  rows={3}
                  placeholder="e.g. Attended chapter meeting as verified by Secretary; physical check-in verified."
                  value={correctionReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCorrectionReason(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  onClick={() => setCorrectingRecord(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cmd.busy || !correctionReason.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {cmd.busy ? 'Saving...' : 'Apply Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Attendance Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Member Attendance</h3>
                <p className="text-xs text-slate-500 mt-0.5">Persist attendance directly to PostgreSQL database</p>
              </div>
              <button
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                onClick={() => setShowRecordModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitNewRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Member Full Name & Role *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  placeholder="e.g. Vignesh Balan (Growth Coordinator)"
                  value={newMemberName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMemberName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session / Meeting *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  placeholder="Weekly Parivar Business Meeting"
                  value={newSessionName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSessionName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attendance Status *</label>
                <select
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  value={newStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewStatus(e.target.value as any)}
                  required
                >
                  <option value="Present">Present</option>
                  <option value="Substitute">Substitute</option>
                  <option value="Absent">Absent</option>
                  <option value="Excused">Excused</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  placeholder="e.g. In-person arrival on time"
                  value={recordNote}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecordNote(e.target.value)}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  onClick={() => setShowRecordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cmd.busy || !newMemberName.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {cmd.busy ? 'Recording...' : 'Record Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
