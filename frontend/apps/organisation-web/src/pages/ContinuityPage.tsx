import React, { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { CommandFeedback } from '@/components/CommandFeedback';
import { AsyncState } from '@/components/AsyncState';
import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/StatusPill';
import { useOrg } from '@/state/OrgStore';
import { useOrgCommandAction } from '@/hooks/useOrgCommandAction';
import { useDomainProjection } from '@/hooks/useDomainProjection';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import type { AvailabilityRecord, ContinuityProjection, DelegationRecord, HandoverRecord, OperationalPerson } from '@/domain/types';
import { useRouteView } from '@/config/routeViews';
import { authStorage } from '@/utils/authStorage';
import { ShieldCheck } from 'lucide-react';

export default function ContinuityPage() {
  const view = useRouteView(
    'Volunteer Continuity',
    'Availability, delegation and handover preserve operational responsibility without creating a second permanent role.'
  );
  const s = useOrg();
  const cmd = useOrgCommandAction();

  const isTrust = authStorage.isTrustUser();

  const [availability, setAvailability] = useState<AvailabilityRecord['availability']>('Temporary absence');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState<string>();
  const [delegateId, setDelegateId] = useState('');
  const [incomingMemberId, setIncomingMemberId] = useState('');

  const local = useMemo<ContinuityProjection>(
    () => ({
      responsibilities: [s.activeAssignment?.roleType ?? 'CHAPTER_PRESIDENT'],
      openTasks: s.tasks.filter(t => t.status !== 'DONE').length,
      openActions: s.actions.filter(t => t.status !== 'DONE').length,
      openMemberCases: s.cases.filter(c => c.status !== 'Closed').length,
      upcomingMeetings: s.meetings.length,
      committees: s.committees.length,
      programmes: s.programmes.length,
      documentReferences: s.documents.length
    }),
    [s.activeAssignment, s.tasks, s.actions, s.cases, s.meetings, s.committees, s.programmes, s.documents]
  );

  const req = useMemo(
    () => ({
      queryId: 'org.continuity.summary',
      organisationScope: s.scope?.id,
      parameters: { actorId: s.actor?.id }
    }),
    [s.scope?.id, s.actor?.id]
  );

  const projection = useDomainProjection<ContinuityProjection>(req, local);

  const peopleReq = useMemo(
    () => ({ queryId:'org.people.list', organisationScope: s.scope?.id, pageSize: 100 }),
    [s.scope?.id]
  );
  const people = useDomainCursorPage<OperationalPerson>(peopleReq, s.people, [s.scope?.id]);

  const delegationReq = useMemo(
    () => ({ queryId: 'org.delegations.list', organisationScope: s.scope?.id, pageSize: 100 }),
    [s.scope?.id]
  );
  const delegations = useDomainCursorPage<DelegationRecord>(delegationReq, [], [s.scope?.id]);

  const handoverReq = useMemo(
    () => ({ queryId: 'org.handovers.list', organisationScope: s.scope?.id, pageSize: 100 }),
    [s.scope?.id]
  );
  const handovers = useDomainCursorPage<HandoverRecord>(handoverReq, [], [s.scope?.id]);

  const availabilityReq = useMemo(
    () => ({
      queryId: 'org.availability.list',
      organisationScope: s.scope?.id,
      pageSize: 50,
      filters: [{ field: 'actorId', operator: 'eq', value: s.actor?.id }]
    }),
    [s.scope?.id, s.actor?.id]
  );
  const availabilityRows = useDomainCursorPage<AvailabilityRecord>(availabilityReq, [], [s.scope?.id, s.actor?.id]);

  const delegateOptions = people.page?.items ?? [];
  const candidates = delegateOptions.filter(p => (p.memberId ?? p.id) !== s.actor?.id);

  useEffect(() => {
    if (!delegateId && candidates[0]) setDelegateId(candidates[0].memberId ?? candidates[0].id);
    if (!incomingMemberId && candidates[0]) setIncomingMemberId(candidates[0].memberId ?? candidates[0].id);
  }, [candidates, delegateId, incomingMemberId]);

  const reload = () => {
    projection.reload();
    delegations.reload();
    handovers.reload();
    availabilityRows.reload();
  };

  useRealtimeRefresh(
    ['org.assignment.*', 'org.delegation.*', 'org.handover.*', 'org.availability.*', 'org.task.*', 'org.member-case.*'],
    reload
  );
  useRealtimeRefresh(['org.assignment.*', 'org.people.*'], people.reload);

  const currentAvailability = availabilityRows.page?.items?.[0];

  const prepareCover = async () => {
    if (availability === 'Available' || !end || !reason.trim()) return;
    const payload = {
      actorId: s.actor?.id,
      availability,
      effectiveFrom: new Date().toISOString(),
      effectiveTo: end,
      reason: reason.trim(),
      scope: s.scope?.id
    };
    const result = await cmd.run({
      commandType: 'org.availability.update',
      aggregateType: 'Availability',
      payload,
      reason: `Record ${availability}: ${reason.trim()}`
    });
    if (result.ok) {
      setNotice(`Availability successfully recorded as ${availability} until ${end}.`);
      setReason('');
      setEnd('');
      reload();
    }
  };

  const restoreAvailable = async () => {
    const payload = {
      actorId: s.actor?.id,
      availability: 'Available',
      effectiveFrom: new Date().toISOString(),
      effectiveTo: null,
      reason: 'Returned to normal active duty',
      scope: s.scope?.id
    };
    const result = await cmd.run({
      commandType: 'org.availability.update',
      aggregateType: 'Availability',
      payload,
      reason: 'Restore active volunteer availability'
    });
    if (result.ok) {
      setNotice('Availability status successfully restored to Available (Normal Duty).');
      setAvailability('Available');
      setReason('');
      setEnd('');
      reload();
    }
  };

  const createDelegation = async () => {
    if (!delegateId || !end || !reason.trim()) return;
    const result = await cmd.run({
      commandType: 'org.delegation.create',
      aggregateType: 'Delegation',
      payload: {
        delegatorId: s.actor?.id,
        delegateId,
        functions: ['operational follow-through'],
        start: new Date().toISOString(),
        end,
        reason: reason.trim()
      },
      reason: 'Create time-bound delegation'
    });
    if (result.ok) {
      if (availability !== 'Available') {
        await cmd.run({
          commandType: 'org.availability.update',
          aggregateType: 'Availability',
          payload: {
            actorId: s.actor?.id,
            availability,
            effectiveFrom: new Date().toISOString(),
            effectiveTo: end,
            reason: reason.trim(),
            scope: s.scope?.id
          },
          reason: `Record ${availability}: ${reason.trim()}`
        });
      }
      setNotice('Time-bound delegation and absence status created successfully.');
      setReason('');
      setEnd('');
      reload();
    }
  };

  const revokeDelegation = async (row: DelegationRecord) => {
    const result = await cmd.run({
      commandType: 'org.delegation.revoke',
      aggregateType: 'Delegation',
      aggregateId: row.id,
      expectedVersion: row.version,
      payload: { status: 'Revoked', reason: 'Revoked by delegator' },
      reason: 'Revoke delegation'
    });
    if (result.ok) {
      setNotice('Delegation revoked.');
      reload();
    }
  };

  const prepareHandover = async () => {
    if (!s.activeAssignment || !incomingMemberId || incomingMemberId === s.activeAssignment.memberId) return;
    const d = projection.data;
    const payload = {
      assignmentId: s.activeAssignment.id,
      outgoingMemberId: s.activeAssignment.memberId,
      incomingMemberId,
      openTaskIds: s.tasks.filter(x => x.status !== 'DONE').map(x => x.id),
      openActionIds: s.actions.filter(x => x.status !== 'DONE').map(x => x.id),
      openCaseIds: s.cases.filter(x => x.status !== 'Closed').map(x => x.id),
      meetingIds: s.meetings.map(x => x.id),
      programmeIds: s.programmes.map(x => x.id),
      documentIds: s.documents.map(x => x.id),
      summary: {
        openTasks: d?.openTasks ?? 0,
        openActions: d?.openActions ?? 0,
        openCases: d?.openMemberCases ?? 0
      }
    };
    const result = await cmd.run({
      commandType: 'org.handover.prepare',
      aggregateType: 'Handover',
      aggregateId: s.activeAssignment.id,
      expectedVersion: s.activeAssignment.version,
      payload,
      reason: 'Prepare role handover from authoritative open work'
    });
    if (result.ok) {
      setNotice('Handover prepared and is awaiting the incoming role holder.');
      reload();
    }
  };

  const acceptHandover = async (row: HandoverRecord) => {
    if (row.incomingMemberId !== s.actor?.id) return;
    const result = await cmd.run({
      commandType: 'org.handover.accept',
      aggregateType: 'Handover',
      aggregateId: row.id,
      expectedVersion: row.version,
      payload: { acceptedBy: s.actor?.id },
      reason: 'Incoming role holder acknowledges handover'
    });
    if (result.ok) {
      setNotice('Handover accepted.');
      reload();
    }
  };

  const completeHandover = async (row: HandoverRecord) => {
    const result = await cmd.run({
      commandType: 'org.handover.complete',
      aggregateType: 'Handover',
      aggregateId: row.id,
      expectedVersion: row.version,
      payload: { completedBy: s.actor?.id },
      reason: 'Complete handover after acceptance'
    });
    if (result.ok) {
      setNotice('Handover completed.');
      reload();
    }
  };

  const d = projection.data;

  const getDelegateDisplayName = (id: string) => {
    const found = delegateOptions.find(p => (p.memberId ?? p.id) === id);
    return found ? `${found.name} — ${found.position}` : id;
  };

  return (
    <>
      <PageHeader
        title={view.title}
        actions={
          isTrust ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
              <ShieldCheck className="size-4 text-amber-600" />
              <span>Trustee Audit Mode (Read-Only)</span>
            </div>
          ) : null
        }
      >
        {view.description}
      </PageHeader>

      {isTrust && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs font-medium flex items-center gap-2.5">
          <ShieldCheck className="size-5 text-amber-700 shrink-0" />
          <span>
            <strong>Trustee Read-Only Oversight:</strong> Availability, leave history, delegation, and handover records are maintained by Chapter leadership. Trustee has audit and oversight visibility.
          </span>
        </div>
      )}

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      {notice && (
        <div className="callout p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm mb-6 flex items-center justify-between" role="status">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(undefined)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      <AsyncState
        loading={projection.loading}
        refreshing={projection.refreshing}
        stale={projection.stale}
        error={projection.error}
        onRetry={projection.reload}
      >
        {d ? (
          <div className="grid grid-cols-1 gap-6">
            {/* Section 1: Current assignment & open responsibility */}
            <section
              className="card p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs"
              hidden={view.path === '/org/handover'}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-slate-900">Current assignment & open responsibility</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  Authoritative Counts
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                <strong>{s.activeAssignment?.roleType?.replaceAll('_', ' ') ?? s.actor?.position ?? 'CHAPTER PRESIDENT'}</strong> · {s.scope?.name || 'Chapter Scope'}
              </p>

              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <li className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-slate-500 font-medium">Tasks</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <strong className="text-lg font-bold text-slate-900">{d.openTasks ?? 0}</strong>
                    <span className="text-slate-600">open task(s)</span>
                  </div>
                </li>
                <li className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-slate-500 font-medium">Actions</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <strong className="text-lg font-bold text-slate-900">{d.openActions ?? 0}</strong>
                    <span className="text-slate-600">open action(s)</span>
                  </div>
                </li>
                <li className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-slate-500 font-medium">Member Cases</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <strong className="text-lg font-bold text-slate-900">{d.openMemberCases ?? 0}</strong>
                    <span className="text-slate-600">open case(s)</span>
                  </div>
                </li>
                <li className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-slate-500 font-medium">Meetings</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <strong className="text-lg font-bold text-slate-900">{d.upcomingMeetings ?? 0}</strong>
                    <span className="text-slate-600">upcoming</span>
                  </div>
                </li>
                <li className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-slate-500 font-medium">Committees</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <strong className="text-lg font-bold text-slate-900">{d.committees ?? 0}</strong>
                    <span className="text-slate-600">assignments</span>
                  </div>
                </li>
                <li className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-slate-500 font-medium">Programmes</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <strong className="text-lg font-bold text-slate-900">{d.programmes ?? 0}</strong>
                    <span className="text-slate-600">assignments</span>
                  </div>
                </li>
                <li className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-slate-500 font-medium">Documents</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <strong className="text-lg font-bold text-slate-900">{d.documentReferences ?? 0}</strong>
                    <span className="text-slate-600">SOP references</span>
                  </div>
                </li>
                <li className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-slate-500 font-medium">Active Delegations</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <strong className="text-lg font-bold text-blue-700">{d.activeDelegations ?? 0}</strong>
                    <span className="text-slate-600">delegation(s)</span>
                  </div>
                </li>
              </ul>
            </section>

            {/* Section 2: Temporary absence & delegation */}
            <section
              className="card p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs"
              hidden={view.path === '/org/handover'}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Temporary absence & delegation</h2>
                {currentAvailability && currentAvailability.availability !== 'Available' ? (
                  <button
                    onClick={restoreAvailable}
                    disabled={cmd.busy}
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Resume Normal Duty (Set Available)</span>
                  </button>
                ) : null}
              </div>

              {/* Current Status Pill Card */}
              <div className="mb-6 p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${currentAvailability && currentAvailability.availability !== 'Available' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <span>Status:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        currentAvailability && currentAvailability.availability === 'Leave'
                          ? 'bg-purple-100 text-purple-800'
                          : currentAvailability && currentAvailability.availability === 'Temporary absence'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {currentAvailability?.availability || 'Available (Normal Duty)'}
                      </span>
                    </div>
                    {currentAvailability && currentAvailability.availability !== 'Available' ? (
                      <p className="text-xs text-slate-600 mt-0.5">
                        Until: <strong>{currentAvailability.effectiveTo ? new Date(currentAvailability.effectiveTo).toLocaleDateString() : 'Unspecified'}</strong>
                        {currentAvailability.reason && <span> · Reason: <em>"{currentAvailability.reason}"</em></span>}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Active and handling all standard Chapter duties for {s.scope?.name || 'Thanjavur Chapter'}.
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Actor: <strong className="text-slate-700">{s.actor?.name || 'Saravanan'}</strong> ({s.actor?.position || 'President'})
                </div>
              </div>

              {/* Form Grid */}
              {!isTrust && (
                <div className="form-grid grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="form-field flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Availability Status</label>
                    <select
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
                      value={availability}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        setAvailability(e.target.value as AvailabilityRecord['availability'])
                      }
                    >
                      <option value="Temporary absence">Temporary absence</option>
                      <option value="Leave">Leave</option>
                      <option value="Available">Available (Normal Duty)</option>
                    </select>
                  </div>

                  <div className="form-field flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Effective Until (Ends)</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
                      type="date"
                      value={end}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)}
                    />
                  </div>

                  <div className="form-field flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Reason for Absence</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
                      value={reason}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
                      placeholder="e.g. Travel, Family engagement, Medical leave"
                    />
                  </div>

                  <div className="form-field flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Eligible Delegate Cover</label>
                    <select
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
                      value={delegateId}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setDelegateId(e.target.value)}
                    >
                      <option value="">Select eligible Member from Parivar</option>
                      {candidates.map(p => (
                        <option key={p.id} value={p.memberId ?? p.id}>
                          {p.name} — {p.position}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row-actions sm:col-span-2 flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                    <button
                      className="btn px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors min-h-[44px] disabled:opacity-50"
                      disabled={cmd.busy || availability === 'Available' || !end || !reason.trim()}
                      onClick={() => void prepareCover()}
                    >
                      Record Absence / Leave (Without Delegate)
                    </button>

                    <button
                      className="btn primary px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px] disabled:opacity-50"
                      disabled={cmd.busy || !delegateId || !end || !reason.trim()}
                      onClick={() => void createDelegation()}
                    >
                      Delegate & Assign Cover
                    </button>
                  </div>
                </div>
              )}

              {/* Recorded Absences & Leaves Register */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Recorded Availability & Leave History</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-semibold">
                      {availabilityRows.page?.items?.length ?? 0} records
                    </span>
                  </h3>
                  <button
                    onClick={() => availabilityRows.reload()}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    type="button"
                  >
                    Refresh
                  </button>
                </div>

                {(availabilityRows.page?.items ?? []).length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center text-xs text-slate-500">
                    No absence or leave recorded yet. Use the form above to record temporary leave or absence.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Status</th>
                          <th className="p-3">Reason</th>
                          <th className="p-3">Effective Period</th>
                          <th className="p-3">Recorded At</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {availabilityRows.page?.items.map(row => {
                          const isLeave = row.availability === 'Leave';
                          const isAbsence = row.availability === 'Temporary absence';
                          return (
                            <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                  isLeave
                                    ? 'bg-purple-100 text-purple-800'
                                    : isAbsence
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {row.availability}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-slate-800">
                                {row.reason || '—'}
                              </td>
                              <td className="p-3 text-slate-600">
                                {row.effectiveFrom ? new Date(row.effectiveFrom).toLocaleDateString() : 'Today'} →{' '}
                                <strong>{row.effectiveTo ? new Date(row.effectiveTo).toLocaleDateString() : 'Open'}</strong>
                              </td>
                              <td className="p-3 text-slate-500 font-mono text-[11px]">
                                {(row as any).createdAt ? new Date((row as any).createdAt).toLocaleString() : '—'}
                              </td>
                              <td className="p-3 text-right">
                                {row.availability !== 'Available' ? (
                                  <button
                                    onClick={restoreAvailable}
                                    disabled={cmd.busy}
                                    type="button"
                                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                                  >
                                    End Leave
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Active</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Active Delegations Register */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Active Delegations</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-semibold">
                      {delegations.page?.items?.length ?? 0} active
                    </span>
                  </h3>
                  <button
                    onClick={() => delegations.reload()}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    type="button"
                  >
                    Refresh
                  </button>
                </div>

                {(delegations.page?.items ?? []).length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center text-xs text-slate-500">
                    No active delegations. Select a delegate and click "Create delegation" to authorize cover.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white overflow-hidden">
                    {(delegations.page?.items ?? []).map(row => (
                      <div className="list-row flex items-center justify-between p-4 hover:bg-slate-50/60 transition-colors" key={row.id}>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-sm font-semibold text-slate-900">
                              {row.functions?.join(', ') || 'Operational follow-through'}
                            </strong>
                            <StatusPill value={row.status} />
                          </div>
                          <div className="row-meta text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                            <span>Delegate: <strong>{getDelegateDisplayName(row.delegateId)}</strong></span>
                            <span>•</span>
                            <span>Valid: {row.start?.slice(0, 10)} → {row.end?.slice(0, 10)}</span>
                            {row.reason && <span>• Reason: <em>"{row.reason}"</em></span>}
                          </div>
                        </div>

                        <div className="row-actions flex items-center gap-2">
                          {row.status === 'Active' && (
                            <button
                              className="btn px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold shadow-2xs transition-colors min-h-[36px]"
                              disabled={cmd.busy}
                              onClick={() => void revokeDelegation(row)}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Section 3: Role handover (visible on /org/handover) */}
            <section
              className="card p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs"
              hidden={view.path === '/org/availability' || view.path === '/org/delegations'}
            >
              <h2 className="text-base font-bold text-slate-900 mb-2">Role handover</h2>
              <p className="text-xs text-slate-600 mb-4">
                Open responsibilities are snapshotted from authoritative Tasks, Actions, Member Cases, Meetings, Programmes and Documents.
              </p>

              {!isTrust && (
                <>
                  <div className="form-field flex flex-col gap-1.5 mb-4 max-w-md">
                    <label className="text-xs font-semibold text-slate-700">Incoming Member</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
                      value={incomingMemberId}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setIncomingMemberId(e.target.value)}
                    >
                      <option value="">Select eligible Member</option>
                      {candidates.map(p => (
                        <option key={p.id} value={p.memberId ?? p.id}>
                          {p.name} — {p.position}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="btn primary px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-colors min-h-[44px] mb-6"
                    disabled={cmd.busy || !s.activeAssignment || !incomingMemberId}
                    onClick={() => void prepareHandover()}
                  >
                    Prepare handover
                  </button>
                </>
              )}

              <h3 className="text-sm font-bold text-slate-900 mb-3">Handover register</h3>
              {(handovers.page?.items ?? []).length === 0 ? (
                <p className="row-meta text-xs text-slate-500">No handover prepared.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {(handovers.page?.items ?? []).map(row => (
                    <div className="list-row flex items-center justify-between py-3" key={row.id}>
                      <div>
                        <strong className="text-sm font-semibold text-slate-900 block">{row.assignmentId}</strong>
                        <div className="row-meta text-xs text-slate-500 mt-0.5">
                          Outgoing {row.outgoingMemberId} → incoming {row.incomingMemberId}; {row.openTaskIds.length} tasks,{' '}
                          {row.openActionIds.length} actions, {row.openCaseIds.length} cases.
                        </div>
                      </div>
                      <div className="row-actions flex items-center gap-2">
                        <StatusPill value={row.status} />
                        {row.status === 'Prepared' && row.incomingMemberId === s.actor?.id && (
                          <button
                            className="btn px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors min-h-[44px]"
                            onClick={() => void acceptHandover(row)}
                          >
                            Accept
                          </button>
                        )}
                        {row.status === 'Accepted' && (
                          <button
                            className="btn primary px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs transition-colors min-h-[44px]"
                            onClick={() => void completeHandover(row)}
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <EmptyState title="Continuity summary is not available" />
        )}
      </AsyncState>
    </>
  );
}
