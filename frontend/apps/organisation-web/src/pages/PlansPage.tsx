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
import type { GoalItem } from '@/domain/types';
import { useRouteView } from '@/config/routeViews';
import { X, ArrowRight, User, CalendarDays, Clock, ShieldCheck } from 'lucide-react';
import { authStorage } from '@/utils/authStorage';

function PlusIcon({ className = 'size-4', stroke = 'currentColor' }: { className?: string; stroke?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function TargetIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export default function PlansPage() {
  const s = useOrg();
  const cmd = useOrgCommandAction();
  const view = useRouteView(
    'Annual / Term Plan',
    'Goals, targets, programmes and recurring operating routines tied to owners and evidence.'
  );

  const isGoalsView = view.path === '/org/goals';
  const isTrust = authStorage.isTrustUser();

  // Modal dialog state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState(s.actor.name);
  const [reviewCadence, setReviewCadence] = useState('Monthly');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'Planned' | 'Active' | 'At Risk' | 'Completed'>('Active');

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const req = useMemo(
    () => ({
      queryId: 'org.goals.list',
      organisationScope: s.scope.id,
      pageSize: 25,
    }),
    [s.scope.id]
  );

  const page = useDomainCursorPage<GoalItem>(req, s.goals);
  useRealtimeRefresh(['org.goal.*', 'org.plan.*'], page.reload);

  const createGoal = async () => {
    if (!title.trim()) return;
    const result = await cmd.run({
      commandType: 'org.goal.create',
      aggregateType: 'Goal',
      payload: {
        title: title.trim(),
        owner: owner.trim(),
        reviewCadence,
        progress: Number(progress) || 0,
        status,
      },
      reason: `Create plan objective: ${title.trim()}`,
    });

    if (result.ok) {
      setTitle('');
      setProgress(0);
      setShowModal(false);
      page.reload();
    }
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
          ) : (
            <button
              type="button"
              className="btn primary inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b5fa7] !text-white hover:bg-[#174f89] font-bold text-xs min-h-[42px] shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
              style={{ color: '#ffffff' }}
              onClick={() => setShowModal(true)}
            >
              <PlusIcon className="size-4 text-white" stroke="#ffffff" />
              <span style={{ color: '#ffffff' }}>New {isGoalsView ? 'Goal' : 'Plan Objective'}</span>
            </button>
          )
        }
      >
        {view.description}
      </PageHeader>

      {isTrust && (
        <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3 text-xs shadow-2xs">
          <ShieldCheck className="size-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold">Trustee Read-Only Oversight: </span>
            <span>You have audit access to all chapter annual plans, milestones, and strategic goals. Setting goals and managing operational routines is reserved for Parivar Leadership.</span>
          </div>
        </div>
      )}

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      {/* Creation Modal Dialog */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          onClick={(e: any) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-scale-up"
            onClick={(e: any) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-[#1b5fa7]/10 text-[#1b5fa7] flex items-center justify-center">
                  <TargetIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add {isGoalsView ? 'Strategic Goal' : 'Annual Plan Target'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set clear accountability, progress tracking, and review frequency.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Goal / Target Title *
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                  placeholder="e.g. Achieve 150 Active Members with 95% Retention"
                  value={title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Accountable Lead
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                    value={owner}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOwner(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Review Cadence
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                    value={reviewCadence}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setReviewCadence(e.target.value)}
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                    value={status}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as any)}
                  >
                    <option value="Active">Active</option>
                    <option value="Planned">Planned</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Current Progress
                    </label>
                    <span className="text-xs font-bold text-[#1b5fa7]">{progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    className="w-full accent-[#1b5fa7] cursor-pointer mt-2"
                    value={progress}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setProgress(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b5fa7] !text-white hover:bg-[#174f89] font-bold text-xs min-h-[42px] transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
                style={{ color: '#ffffff' }}
                disabled={cmd.busy || !title.trim()}
                onClick={() => void createGoal()}
              >
                {cmd.busy ? (
                  <span>Saving...</span>
                ) : (
                  <span style={{ color: '#ffffff' }}>Save {isGoalsView ? 'Goal' : 'Objective'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main List */}
      <AsyncState
        loading={page.loading}
        refreshing={page.refreshing}
        stale={page.stale}
        error={page.error}
        onRetry={page.reload}
      >
        {page.page?.items.length ? (
          <div className="list space-y-3">
            {page.page.items.map(g => {
              const isCompleted = (g.status as string) === 'Completed';
              const isAtRisk = g.status === 'At Risk';
              const borderAccent = isCompleted
                ? 'border-l-4 border-l-emerald-500'
                : isAtRisk
                ? 'border-l-4 border-l-amber-500'
                : 'border-l-4 border-l-[#1b5fa7]';

              return (
                <div
                  key={g.id}
                  className={`p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${borderAccent}`}
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      className="row-title font-bold text-sm text-slate-900 hover:text-[#1b5fa7] transition-colors line-clamp-1 block"
                      to={`/org/goals/${g.id}`}
                    >
                      {g.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <User className="size-3 text-slate-400" />
                        {g.owner}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Clock className="size-3 text-slate-400" />
                        Cadence: {g.reviewCadence}
                      </span>
                      <div className="inline-flex items-center gap-2 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                        <span className="text-[11px] font-medium text-slate-500">Progress</span>
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#1b5fa7] h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, g.progress))}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-[#1b5fa7]">{g.progress}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="row-actions flex items-center gap-2 flex-wrap shrink-0">
                    <StatusPill value={g.status} />
                    <Link
                      to={`/org/goals/${g.id}`}
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
              title={`No ${isGoalsView ? 'Goals' : 'Annual Plan Objectives'} in this scope`}
              body={
                isTrust
                  ? `No active ${isGoalsView ? 'goals' : 'annual plan objectives'} in this scope. Goal setting and plan management are governed exclusively by Chapter Leadership.`
                  : 'Establish strategic objectives to track chapter milestones and operational routines.'
              }
            />
            {!isTrust && (
              <button
                type="button"
                className="btn primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b5fa7] !text-white hover:bg-[#174f89] font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                style={{ color: '#ffffff' }}
                onClick={() => setShowModal(true)}
              >
                <PlusIcon className="size-4 text-white" stroke="#ffffff" />
                <span style={{ color: '#ffffff' }}>Add First {isGoalsView ? 'Goal' : 'Objective'}</span>
              </button>
            )}
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

      <div className="card mt-8 p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs" hidden={view.path === '/org/goals'}>
        <h2 className="text-base font-bold text-slate-900 mb-1.5">Recurring Routines & Term Objectives</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Recurring routines are backend-governed schedule definitions tied to office-bearer terms. They create future work without duplicating historical records.
        </p>
      </div>
    </>
  );
}
