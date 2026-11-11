import { useMemo, useState, useEffect, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
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
import { nextOperationalScope } from '@/domain/hierarchy';
import type { ControlRow } from '@/domain/types';
import { X, ArrowRight, AlertTriangle } from 'lucide-react';

function PlusIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function BranchIcon({ className = 'size-4 text-rose-500' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 17h.01M17 7h.01M7 8v8m10-8v2a3 3 0 0 1-3 3H7" />
    </svg>
  );
}

function FileCheckIcon({ className = 'size-4 text-amber-500' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ScaleIcon({ className = 'size-4 text-blue-500' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  );
}

function ShieldAlertIcon({ className = 'size-4 text-red-500' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

export function ControlsPage({
  mode
}: {
  mode: 'ESCALATIONS' | 'EXCEPTIONS' | 'RISK' | 'ISSUES' | 'DECISIONS';
}) {
  const s = useOrg();
  const cmd = useOrgCommandAction();
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [titleInput, setTitleInput] = useState('');
  const [summaryInput, setSummaryInput] = useState('');
  const [ownerInput, setOwnerInput] = useState(s.actor.name);
  const [severityInput, setSeverityInput] = useState('HIGH');
  const [likelihoodInput, setLikelihoodInput] = useState('MEDIUM');
  const [authorityInput, setAuthorityInput] = useState('Chapter Executive Committee');
  const [reviewDateInput, setReviewDateInput] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [effectiveDateInput, setEffectiveDateInput] = useState(
    new Date().toISOString().split('T')[0]
  );

  const title = {
    ESCALATIONS: 'Escalations',
    EXCEPTIONS: 'Operational Exceptions',
    RISK: 'Risk Register',
    ISSUES: 'Issues & Incidents',
    DECISIONS: 'Decision Register'
  }[mode];

  const config = {
    ESCALATIONS: { queryId: 'org.escalations.list', event: 'org.escalation.*', buttonText: 'Raise Escalation' },
    EXCEPTIONS: { queryId: 'org.exceptions.list', event: 'org.exception.*', buttonText: 'New Exception' },
    RISK: { queryId: 'org.risks.list', event: 'org.risk.*', buttonText: 'Log Risk' },
    ISSUES: { queryId: 'org.issues.list', event: 'org.issue.*', buttonText: 'Report Issue' },
    DECISIONS: { queryId: 'org.decisions.list', event: 'org.decision.*', buttonText: 'Record Decision' }
  }[mode];

  const local = useMemo<ControlRow[]>(() => {
    switch (mode) {
      case 'ESCALATIONS':
        return s.escalations.map(x => ({
          id: x.id,
          title: x.title,
          meta: `${x.from.name} → ${x.to.name} · owner ${x.owner}`,
          status: x.status,
          to: `/org/escalations/${x.id}`,
          severity: x.severity
        }));
      case 'EXCEPTIONS':
        return s.operationalExceptions.map(x => ({
          id: x.id,
          title: x.title,
          meta: `Requested by ${x.requester} · ${x.reason}`,
          status: x.status,
          to: `/org/exceptions/${x.id}`
        }));
      case 'RISK':
        return s.risks.map(x => ({
          id: x.id,
          title: x.title,
          meta: `Owner ${x.owner} · review ${x.reviewDate}`,
          status: x.status,
          to: `/org/risks/${x.id}`,
          severity: x.impact
        }));
      case 'ISSUES':
        return s.issues.map(x => ({
          id: x.id,
          title: x.title,
          meta: `Owner ${x.owner} · ${x.sourceType} ${x.sourceId}`,
          status: x.status,
          to: `/org/issues/${x.id}`,
          severity: x.impact
        }));
      case 'DECISIONS':
        return s.decisions.map(x => ({
          id: x.id,
          title: x.subject,
          meta: `${x.authority} · effective ${x.effectiveDate} · ${x.reason}`,
          status: x.status,
          to: `/org/decisions/${x.id}`
        }));
    }
  }, [mode, s.escalations, s.operationalExceptions, s.risks, s.issues, s.decisions]);

  const req = useMemo(
    () => ({ queryId: config.queryId, organisationScope: s.scope.id, pageSize: 25 }),
    [config.queryId, s.scope.id]
  );
  const page = useDomainCursorPage<ControlRow>(req, local, [mode]);
  useRealtimeRefresh([config.event], page.reload);

  const target = useMemo(() => nextOperationalScope(s.scope, s.units), [s.scope, s.units]);

  // Escape key listener for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const resetForm = () => {
    setTitleInput('');
    setSummaryInput('');
    setOwnerInput(s.actor.name);
    setSeverityInput('HIGH');
    setLikelihoodInput('MEDIUM');
    setShowModal(false);
  };

  const submitCreate = async () => {
    if (!titleInput.trim()) return;

    let result;
    if (mode === 'ESCALATIONS') {
      const effectiveTarget = target || {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Krishnagiri Region',
        level: 'REGION' as const
      };
      result = await cmd.run({
        commandType: 'org.escalation.raise',
        aggregateType: 'Escalation',
        payload: {
          title: titleInput.trim(),
          summary: summaryInput.trim(),
          sourceType: 'MANUAL',
          sourceId: s.scope.id,
          from: s.scope,
          to: effectiveTarget,
          targetScope: effectiveTarget,
          owner: ownerInput.trim() || s.actor.name,
          severity: severityInput
        },
        reason: 'Raise organisational escalation'
      });
    } else if (mode === 'EXCEPTIONS') {
      result = await cmd.run({
        commandType: 'org.exception.create',
        aggregateType: 'OperationalException',
        payload: {
          title: titleInput.trim(),
          description: summaryInput.trim(),
          owner: ownerInput.trim() || s.actor.name,
          reason: summaryInput.trim()
        },
        reason: 'Record operational exception'
      });
    } else if (mode === 'RISK') {
      result = await cmd.run({
        commandType: 'org.risk.create',
        aggregateType: 'Risk',
        payload: {
          title: titleInput.trim(),
          owner: ownerInput.trim() || s.actor.name,
          status: 'ACTIVE',
          impact: severityInput,
          likelihood: likelihoodInput,
          reviewDate: reviewDateInput
        },
        reason: 'Log operational risk'
      });
    } else if (mode === 'ISSUES') {
      result = await cmd.run({
        commandType: 'org.issue.create',
        aggregateType: 'Issue',
        payload: {
          title: titleInput.trim(),
          owner: ownerInput.trim() || s.actor.name,
          status: 'OPEN',
          impact: severityInput,
          sourceType: 'MANUAL',
          sourceId: summaryInput.trim()
        },
        reason: 'Report operational issue'
      });
    } else if (mode === 'DECISIONS') {
      result = await cmd.run({
        commandType: 'org.decision.create',
        aggregateType: 'Decision',
        payload: {
          subject: titleInput.trim(),
          authority: authorityInput.trim() || 'Chapter Executive Committee',
          reason: summaryInput.trim(),
          effectiveDate: effectiveDateInput,
          status: 'APPROVED',
          sourceType: 'MC_MEETING'
        },
        reason: 'Record operational decision'
      });
    }

    if (result && result.ok) {
      resetForm();
      page.reload();
    }
  };

  const getBorderColor = (item: ControlRow) => {
    const st = (item.status || '').toUpperCase();
    const sev = (item.severity || '').toUpperCase();

    if (st === 'RESOLVED' || st === 'APPROVED' || st === 'MITIGATED' || st === 'CLOSED') {
      return 'border-l-emerald-500';
    }
    if (sev === 'CRITICAL' || sev === 'HIGH' || st === 'CRITICAL') {
      return 'border-l-rose-500';
    }
    if (sev === 'MEDIUM' || st === 'PENDING' || st === 'UNDER_REVIEW') {
      return 'border-l-amber-500';
    }
    if (st === 'ACTIVE' || st === 'OPEN') {
      return 'border-l-[#1b5fa7]';
    }
    return 'border-l-slate-300';
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'ESCALATIONS':
        return <BranchIcon className="size-4 text-rose-500" />;
      case 'EXCEPTIONS':
        return <FileCheckIcon className="size-4 text-amber-500" />;
      case 'RISK':
        return <AlertTriangle className="size-4 text-orange-500" />;
      case 'ISSUES':
        return <ShieldAlertIcon className="size-4 text-red-500" />;
      case 'DECISIONS':
        return <ScaleIcon className="size-4 text-blue-500" />;
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        actions={
          <button
            type="button"
            className="btn primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b5fa7] hover:bg-[#174f89] !text-white font-bold text-xs shadow-xs transition-all cursor-pointer min-h-[44px]"
            style={{ color: '#ffffff' }}
            onClick={() => setShowModal(true)}
          >
            <PlusIcon className="size-4 text-white" />
            <span style={{ color: '#ffffff' }}>{config.buttonText}</span>
          </button>
        }
      >
        Transparent operational control with one canonical case, authority, reason, owner, timeline and closure.
      </PageHeader>

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      {mode === 'ESCALATIONS' && (
        <div className="callout p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-sm mb-6 flex items-start gap-2.5">
          <BranchIcon className="size-4.5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Escalation Path: </span>
            Chapter → Region → City → State → National → Management. Escalation moves the canonical case to the immediate parent operating level ({target ? `${target.name} (${target.level})` : 'No higher scope'}).
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                {getModeIcon()}
                <h3 className="text-base font-bold text-slate-900">{config.buttonText}</h3>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {mode === 'DECISIONS' ? 'Decision Subject' : `${title.slice(0, -1)} Title / Subject`}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    mode === 'ESCALATIONS'
                      ? 'e.g. Venue Lease Final Agreement Dispute'
                      : mode === 'EXCEPTIONS'
                      ? 'e.g. Meeting Time Shift to Evening'
                      : mode === 'RISK'
                      ? 'e.g. Q3 Member Attendance Drop'
                      : mode === 'ISSUES'
                      ? 'e.g. Audio Visual Failure at Main Hall'
                      : 'e.g. Subsidized Venue Package Approval'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                  value={titleInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitleInput(e.target.value)}
                />
              </div>

              {mode === 'ESCALATIONS' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Coordination Scope
                  </label>
                  <input
                    type="text"
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-medium"
                    value={target ? `${target.name} (${target.level})` : 'No higher authorized scope available'}
                  />
                </div>
              )}

              {mode === 'DECISIONS' && (
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Authority / Body
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                      value={authorityInput}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setAuthorityInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                      value={effectiveDateInput}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEffectiveDateInput(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Owner / Responsible Officer
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                    value={ownerInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOwnerInput(e.target.value)}
                  />
                </div>

                {mode !== 'DECISIONS' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {mode === 'RISK' ? 'Impact / Severity' : 'Severity'}
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                      value={severityInput}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setSeverityInput(e.target.value)}
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                )}

                {mode === 'RISK' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Likelihood
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                        value={likelihoodInput}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setLikelihoodInput(e.target.value)}
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Review Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                        value={reviewDateInput}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setReviewDateInput(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {mode === 'ESCALATIONS'
                    ? 'Why is intervention required?'
                    : mode === 'EXCEPTIONS'
                    ? 'Reason for Exception'
                    : mode === 'DECISIONS'
                    ? 'Ratification / Reason'
                    : 'Description / Context'}
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide supporting context, rationale, and recommended next steps..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                  value={summaryInput}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSummaryInput(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 font-semibold text-xs transition-colors cursor-pointer min-h-[40px]"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn primary px-5 py-2 rounded-xl bg-[#1b5fa7] hover:bg-[#174f89] !text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5"
                style={{ color: '#ffffff' }}
                disabled={cmd.busy || !titleInput.trim()}
                onClick={() => void submitCreate()}
              >
                <span style={{ color: '#ffffff' }}>Save & Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards List */}
      <AsyncState
        loading={page.loading}
        refreshing={page.refreshing}
        stale={page.stale}
        error={page.error}
        onRetry={page.reload}
      >
        {page.page?.items.length ? (
          <div className="space-y-3">
            {page.page.items.map(x => {
              const itemTo = x.to || `/org/${mode === 'DECISIONS' ? 'decisions' : mode === 'ESCALATIONS' ? 'escalations' : mode === 'EXCEPTIONS' ? 'exceptions' : mode === 'RISK' ? 'risks' : 'issues'}/${x.id}`;
              const itemMeta = x.meta || (x.severity ? `Status: ${x.status} · Severity: ${x.severity}` : `Status: ${x.status}`);
              return (
                <div
                  key={x.id}
                  className={`p-4 sm:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 ${getBorderColor(
                    x
                  )}`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        {getModeIcon()}
                        {mode}
                      </span>
                      {x.severity && (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            x.severity.toUpperCase() === 'HIGH' || x.severity.toUpperCase() === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                              : x.severity.toUpperCase() === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {x.severity}
                        </span>
                      )}
                    </div>

                    <Link
                      to={itemTo}
                      className="font-bold text-slate-900 hover:text-[#1b5fa7] text-base transition-colors block truncate"
                    >
                      {x.title}
                    </Link>

                    {itemMeta && (
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/50">
                          {itemMeta}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="row-actions flex items-center gap-2 flex-wrap shrink-0">
                    <StatusPill value={x.status} />
                    <Link
                      to={itemTo}
                      className="btn primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1b5fa7] !text-white font-bold text-xs hover:bg-[#174f89] shadow-xs min-h-[38px] transition-all cursor-pointer"
                      style={{ color: '#ffffff' }}
                    >
                      <span style={{ color: '#ffffff' }}>Open details</span>
                      <ArrowRight className="size-3.5 !text-white" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-4">
            <EmptyState
              title={`No ${title.toLowerCase()} in this scope`}
              body="Create and maintain canonical operational control records with clear ownership and resolution path."
            />
            <button
              type="button"
              className="btn primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b5fa7] !text-white hover:bg-[#174f89] font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
              style={{ color: '#ffffff' }}
              onClick={() => setShowModal(true)}
            >
              <PlusIcon className="size-4 text-white" />
              <span style={{ color: '#ffffff' }}>Add First {title.slice(0, -1)}</span>
            </button>
          </div>
        )}

        <CursorPager
          canPrevious={page.canPrevious}
          canNext={page.canNext}
          onPrevious={page.previous}
          onNext={page.next}
          totalEstimate={page.page?.totalEstimate}
        />
      </AsyncState>

      <div className="card mt-12 p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 mb-2">Decision / Authority Rule</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Operational decisions and exceptions are distinct from routine tasks. Protected governance exceptions and policy-level decisions are handed to the Independent Governance Workspace.
        </p>
      </div>
    </>
  );
}
export default ControlsPage;
