import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { StatusPill } from '@/components/StatusPill';
import { CommandFeedback } from '@/components/CommandFeedback';
import { AsyncState } from '@/components/AsyncState';
import { CursorPager } from '@/components/CursorPager';
import { EmptyState } from '@/components/EmptyState';
import { useOrg } from '@/state/OrgStore';
import { useOrgCommandAction } from '@/hooks/useOrgCommandAction';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import type { Handoff } from '@/domain/types';

export default function HandoffsPage() {
  const s = useOrg();
  const cmd = useOrgCommandAction();

  // Form state
  const [target, setTarget] = useState<Handoff['targetWorkspace']>('PLATFORM_ADMIN');
  const [reason, setReason] = useState('');
  const [lastAction, setLastAction] = useState<string>();

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const requestedCapability =
    target === 'PLATFORM_ADMIN'
      ? 'platform-change'
      : target === 'GOVERNANCE'
      ? 'governance-review'
      : 'member-response';

  const req = useMemo(
    () => ({
      queryId: 'org.handoffs.list',
      organisationScope: s.scope.id,
      pageSize: 50
    }),
    [s.scope.id]
  );

  const page = useDomainCursorPage<Handoff>(req, s.handoffs);
  useRealtimeRefresh(['org.handoff.*'], page.reload);

  const handoffs = useMemo(() => {
    let list = page.page?.items ?? [];
    if (statusFilter !== 'ALL') {
      list = list.filter((h) => h.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (h) =>
          h.reason.toLowerCase().includes(q) ||
          h.targetWorkspace.toLowerCase().includes(q) ||
          h.requestedCapability.toLowerCase().includes(q) ||
          (h.correlationId && h.correlationId.toLowerCase().includes(q))
      );
    }
    return list;
  }, [page.page?.items, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const raw = page.page?.items ?? [];
    return {
      total: raw.length,
      requested: raw.filter((h) => h.status === 'Requested' || h.status === 'PENDING').length,
      accepted: raw.filter((h) => h.status === 'Accepted' || h.status === 'In Progress').length,
      completed: raw.filter((h) => h.status === 'Completed' || h.status === 'RESOLVED').length
    };
  }, [page.page?.items]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const payload = {
      sourceWorkspace: 'ORGANISATIONAL',
      sourceType: 'WORKSPACE',
      sourceId: s.scope.id,
      targetWorkspace: target,
      requestedCapability,
      reason: reason.trim(),
      status: 'Requested'
    };

    const result = await cmd.run(
      {
        commandType: 'org.handoff.create',
        aggregateType: 'Handoff',
        payload,
        reason: reason.trim()
      },
      () => s.dispatch({ type: 'ADD_HANDOFF', payload })
    );

    if (result.ok) {
      setReason('');
      setLastAction(`Cross-workspace handoff dispatched to ${targetName(target)} and saved to database.`);
      page.reload();
    }
  };

  const handleTransition = async (handoff: Handoff, nextStatus: string) => {
    const result = await cmd.run({
      commandType: 'org.handoff.update',
      aggregateType: 'Handoff',
      aggregateId: handoff.id,
      payload: { status: nextStatus },
      reason: `Update handoff status to ${nextStatus}`
    });

    if (result.ok) {
      setLastAction(`Handoff #${formatHandoffCode(handoff.id)} updated to ${nextStatus}.`);
      page.reload();
    }
  };

  const formatHandoffCode = (id: string) => {
    return `HND-${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`;
  };

  const targetName = (tw: string) => {
    switch (tw) {
      case 'PLATFORM_ADMIN':
        return 'Platform Administration';
      case 'GOVERNANCE':
        return 'Independent Governance';
      case 'MEMBER':
        return 'Member Workspace';
      default:
        return tw;
    }
  };

  return (
    <>
      <PageHeader
        title="Cross-Workspace Handoffs"
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Active Scope: {s.scope.name}
            </span>
          </div>
        }
      >
        Preserve one source context while independent workspaces execute their own authority.
      </PageHeader>

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      {lastAction && (
        <div className="callout mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-700">✓</span>
            <span>{lastAction}</span>
          </div>
          <button
            className="text-xs font-semibold text-emerald-700 hover:underline"
            onClick={() => setLastAction(undefined)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Handoffs</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-[11px] font-medium text-slate-400">In PostgreSQL DB</span>
          </div>
        </div>

        <div className="card p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Awaiting Action</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-amber-600">{stats.requested}</span>
            <span className="text-[11px] font-medium text-slate-400">Requested</span>
          </div>
        </div>

        <div className="card p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">In Progress</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-blue-600">{stats.accepted}</span>
            <span className="text-[11px] font-medium text-slate-400">Active Working</span>
          </div>
        </div>

        <div className="card p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-600">{stats.completed}</span>
            <span className="text-[11px] font-medium text-slate-400">Reconciled</span>
          </div>
        </div>
      </div>

      {/* Create Handoff Form */}
      <div className="card p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs mb-6">
        <div className="mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Initiate Cross-Workspace Handoff</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely delegate operational items from <b>{s.scope.name}</b> to external workspace controllers.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
            Source: {s.scope.name}
          </span>
        </div>

        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-field flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Target Workspace</label>
              <select
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
                value={target}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTarget(e.target.value as Handoff['targetWorkspace'])}
              >
                <option value="PLATFORM_ADMIN">Platform Administration (IT, Security & System Changes)</option>
                <option value="GOVERNANCE">Independent Governance (Ethics, Appeals & Policy Review)</option>
                <option value="MEMBER">Member Workspace (Direct Communication & Member Action)</option>
              </select>
            </div>

            <div className="form-field flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Requested Capability</label>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium text-sm min-h-[44px]"
                readOnly
                value={
                  target === 'PLATFORM_ADMIN'
                    ? 'Technical / Configuration Correction (platform-change)'
                    : target === 'GOVERNANCE'
                    ? 'Independent Review / Decision (governance-review)'
                    : 'Member-Facing Action or Response (member-response)'
                }
              />
            </div>

            <div className="form-field flex flex-col gap-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Operational Reason & Context</label>
                <span className="text-[11px] text-slate-400">{reason.length} characters</span>
              </div>
              <textarea
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[85px]"
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                placeholder="Explain why this workspace handoff is required, specifying affected entities, policy citations, or configuration keys..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Initiated by: <b>{s.actor?.name || 'Saravanan, President'}</b>
            </span>
            <button
              type="submit"
              className="btn primary px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-colors min-h-[44px] disabled:opacity-50 inline-flex items-center gap-2"
              disabled={cmd.busy || !reason.trim()}
            >
              <span>{cmd.busy ? 'Dispatching...' : 'Dispatch Handoff'}</span>
              <span>→</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            className="w-full pl-3.5 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Search by reason, capability, target workspace or correlation..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'Requested', 'Accepted', 'In Progress', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Handoff Register */}
      <div className="section-title mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Handoff Register</h2>
        <span className="text-xs font-medium text-slate-500">
          Showing {handoffs.length} of {stats.total} total handoffs
        </span>
      </div>

      <AsyncState
        loading={page.loading}
        refreshing={page.refreshing}
        stale={page.stale}
        error={page.error}
        onRetry={page.reload}
      >
        {handoffs.length ? (
          <div className="list divide-y divide-slate-200/80 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            {handoffs.map((h) => (
              <div
                className="row flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-5 gap-4 hover:bg-slate-50/60 transition-colors"
                key={h.id}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span
                      className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-semibold text-slate-700 border border-slate-200"
                      title={`Handoff UUID: ${h.id}`}
                    >
                      #{formatHandoffCode(h.id)}
                    </span>
                    <Link
                      className="font-bold text-slate-900 hover:text-blue-600 text-base transition-colors"
                      to={`/org/handoffs/${h.id}`}
                    >
                      {targetName(h.targetWorkspace)} · {h.requestedCapability}
                    </Link>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                      {h.targetWorkspace}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed mb-2 font-normal line-clamp-2">
                    {h.reason}
                  </p>

                  <div className="row-meta text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>
                      Source: <b>{s.scope.name}</b> ({h.sourceWorkspace})
                    </span>
                    <span>·</span>
                    <span>
                      Correlation: <b className="font-mono text-slate-600">{h.correlationId || 'CORR-AUTO'}</b>
                    </span>
                    {h.targetReference && (
                      <>
                        <span>·</span>
                        <span>Ref: {h.targetReference}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end justify-between gap-3 shrink-0">
                  <StatusPill value={h.status} />

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(h.status === 'Requested' || h.status === 'PENDING') && (
                      <>
                        <button
                          type="button"
                          disabled={cmd.busy}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                          onClick={() => handleTransition(h, 'Accepted')}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={cmd.busy}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                          onClick={() => handleTransition(h, 'Rejected')}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {h.status === 'Accepted' && (
                      <button
                        type="button"
                        disabled={cmd.busy}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                        onClick={() => handleTransition(h, 'In Progress')}
                      >
                        Start Progress
                      </button>
                    )}

                    {h.status === 'In Progress' && (
                      <button
                        type="button"
                        disabled={cmd.busy}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        onClick={() => handleTransition(h, 'Completed')}
                      >
                        Mark Completed
                      </button>
                    )}

                    <Link
                      to={`/org/handoffs/${h.id}`}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Details
                    </Link>
                    <Link
                      to={`/org/audit?q=${h.id}`}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Audit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No cross-workspace handoffs matching view"
            body="Use the form above to dispatch a cross-workspace handoff to Platform Administration, Governance, or Members."
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
    </>
  );
}
