import { businessDateOnly } from '@/utils/businessDate';
import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { StatusPill } from '@/components/StatusPill';
import { AsyncState } from '@/components/AsyncState';
import { CursorPager } from '@/components/CursorPager';
import { CommandFeedback } from '@/components/CommandFeedback';
import { EmptyState } from '@/components/EmptyState';
import { useOrg } from '@/state/OrgStore';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { useOrgCommandAction } from '@/hooks/useOrgCommandAction';
import type { Task, ActionItem, WorkStatus } from '@/domain/types';
import { canTaskTransition } from '@/domain/stateMachines';
import { useRouteView } from '@/config/routeViews';
import {
  CheckSquare,
  X,
  User,
  CheckCircle2,
  Clock,
  ArrowRight,
  CalendarDays,
  ShieldCheck
} from 'lucide-react';
import { authStorage } from '@/utils/authStorage';

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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}

function LayersIcon({ className = 'size-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m6.75 7.5 5.25 3 5.25-3m-10.5 4.5 5.25 3 5.25-3m-10.5 4.5 5.25 3 5.25-3"
      />
    </svg>
  );
}

export default function TasksPage() {
  const s = useOrg();
  const view = useRouteView('Tasks & Actions');
  const cmd = useOrgCommandAction();
  const isTrust = authStorage.isTrustUser();
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(businessDateOnly(7));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        setShow(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show]);

  const taskReq = useMemo(
    () => ({
      queryId: 'org.tasks.list',
      organisationScope: s.scope.id,
      pageSize: 25,
    }),
    [s.scope.id]
  );

  const actionReq = useMemo(
    () => ({
      queryId: 'org.actions.list',
      organisationScope: s.scope.id,
      pageSize: 25,
    }),
    [s.scope.id]
  );

  const tasks = useDomainCursorPage<Task>(taskReq, s.tasks);
  const actions = useDomainCursorPage<ActionItem>(actionReq, s.actions);

  useRealtimeRefresh(['org.task.*'], tasks.reload);
  useRealtimeRefresh(['org.action.*'], actions.reload);

  const update = async (t: Task, status: WorkStatus) => {
    if (!canTaskTransition(t.status, status)) return;
    await cmd.run(
      {
        commandType: status === 'DONE' ? 'org.task.complete' : 'org.task.update',
        aggregateType: 'Task',
        aggregateId: t.id,
        expectedVersion: t.version,
        payload: { status },
        reason: 'Operational task update',
      },
      () => s.dispatch({ type: 'TASK_STATUS', payload: { id: t.id, status } })
    );
  };

  const create = async () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      description: 'Created from Tasks',
      owner: s.actor.name,
      sourceType: 'MANUAL',
      sourceId: 'org',
      due,
      priority: 'MEDIUM' as const,
      status: 'TODO' as const,
      scope: s.scope,
    };
    const result = await cmd.run(
      {
        commandType: 'org.task.create',
        aggregateType: 'Task',
        payload,
        reason: 'Manual organisational task',
      },
      () => s.dispatch({ type: 'ADD_TASK', payload })
    );
    if (result.ok) {
      setTitle('');
      setShow(false);
    }
  };

  const createAction = async () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      owner: s.actor.name,
      sourceType: 'MANUAL',
      sourceId: 'org',
      due,
      priority: 'MEDIUM',
      status: 'TODO',
      scope: s.scope,
    };
    const result = await cmd.run({
      commandType: 'org.action.create',
      aggregateType: 'Action',
      payload,
      reason: 'Manual organisational action',
    });
    if (result.ok) {
      setTitle('');
      setShow(false);
      actions.reload();
    }
  };

  return (
    <>
      <PageHeader
        title={view.path === '/org/actions' ? view.title : view.path === '/org/tasks' ? 'Tasks' : view.title}
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
              onClick={() => setShow(true)}
            >
              <PlusIcon className="size-4 !text-white" />
              <span style={{ color: '#ffffff' }}>New task</span>
            </button>
          )
        }
      >
        Volunteer-friendly obligations with canonical source links, owner, due date and audit.
      </PageHeader>

      {isTrust && (
        <div className="mb-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3 text-xs shadow-2xs">
          <ShieldCheck className="size-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold">Trustee Read-Only Oversight: </span>
            <span>You have audit access to all chapter obligations and action items. Creating and assigning tasks is managed by Parivar Leadership.</span>
          </div>
        </div>
      )}

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      {/* Modal Popup for Creating Task or Action Item */}
      {show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) setShow(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-task-title"
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-[#1b5fa7] shadow-2xs border border-sky-100">
                  <CheckSquare className="size-5 text-[#1b5fa7]" />
                </span>
                <div>
                  <h3 id="modal-task-title" className="text-base font-bold text-slate-900">
                    Create Task or Action Item
                  </h3>
                  <p className="text-xs text-slate-500">
                    Record a volunteer obligation with owner assignment and due date
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
              {/* What needs to be done */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckSquare className="size-3.5 text-slate-400" />
                  <span>What needs to be done?</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                  placeholder="e.g. Follow up on chapter onboarding documents..."
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && title.trim()) {
                      void create();
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Owner */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="size-3.5 text-slate-400" />
                    <span>Owner</span>
                    <span className="text-slate-400 font-normal text-[11px]">(Auto-assigned)</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/90 text-sm font-medium text-slate-700 cursor-not-allowed min-h-[44px]"
                    readOnly
                    value={s.actor.name}
                  />
                </div>

                {/* Due Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-slate-400" />
                    <span>Due Date</span>
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1b5fa7] focus:ring-3 focus:ring-sky-100 transition-all min-h-[44px]"
                    type="date"
                    value={due}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDue(e.target.value)}
                  />
                </div>
              </div>

              {/* Why / Source */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <TagIcon className="size-3.5 text-slate-400" />
                  <span>Why / source</span>
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/90 text-sm font-medium text-slate-700 cursor-not-allowed min-h-[44px]"
                  readOnly
                  value="Operational follow-up"
                />
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 hover:border-slate-400 min-h-[42px] transition-all disabled:opacity-50 cursor-pointer"
                  onClick={() => void createAction()}
                  disabled={cmd.busy || !title.trim()}
                >
                  <span>Create action</span>
                </button>
                <button
                  type="button"
                  className="btn primary inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#1b5fa7] !text-white font-bold text-xs hover:bg-[#174f89] shadow-sm hover:shadow min-h-[42px] transition-all disabled:opacity-50 cursor-pointer"
                  style={{ color: '#ffffff' }}
                  onClick={() => void create()}
                  disabled={cmd.busy || !title.trim()}
                >
                  <PlusIcon className="size-4 !text-white" />
                  <span style={{ color: '#ffffff' }}>Create task</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <AsyncState
        loading={tasks.loading}
        refreshing={tasks.refreshing}
        stale={tasks.stale}
        error={tasks.error}
        onRetry={tasks.reload}
      >
        {tasks.page?.items.length ? (
          <div className="list space-y-3">
            {tasks.page.items.map((t) => {
              const isDone = t.status === 'DONE';
              const isWaiting = t.status === 'WAITING';
              const borderAccent = isDone
                ? 'border-l-4 border-l-emerald-500'
                : isWaiting
                ? 'border-l-4 border-l-amber-500'
                : 'border-l-4 border-l-[#1b5fa7]';

              return (
                <div
                  key={t.id}
                  className={`p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${borderAccent}`}
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      className="row-title font-bold text-sm text-slate-900 hover:text-[#1b5fa7] transition-colors line-clamp-1 block"
                      to={`/org/tasks/${t.id}`}
                    >
                      {t.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <User className="size-3 text-slate-400" />
                        {t.owner}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <LayersIcon className="size-3 text-slate-400" />
                        {t.sourceType} {t.sourceId}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <CalendarDays className="size-3 text-slate-400" />
                        due {t.due}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">v{t.version}</span>
                    </div>
                  </div>

                  <div className="row-actions flex items-center gap-2 flex-wrap shrink-0">
                    <StatusPill value={t.status} />
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 hover:border-slate-400 min-h-[38px] transition-all disabled:opacity-40 cursor-pointer"
                      disabled={cmd.busy || !canTaskTransition(t.status, 'WAITING')}
                      onClick={() => update(t, 'WAITING')}
                      title="Set status to Waiting"
                    >
                      <Clock className="size-3.5 text-amber-600" />
                      <span>Waiting</span>
                    </button>
                    <button
                      type="button"
                      className="btn primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1b5fa7] !text-white font-bold text-xs hover:bg-[#174f89] shadow-xs min-h-[38px] transition-all disabled:opacity-40 cursor-pointer"
                      style={{ color: '#ffffff' }}
                      disabled={cmd.busy || !canTaskTransition(t.status, 'DONE')}
                      onClick={() => update(t, 'DONE')}
                      title="Complete task"
                    >
                      <CheckCircle2 className="size-3.5 !text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                      <span style={{ color: '#ffffff' }}>Done</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No Tasks in this scope" />
        )}
        <CursorPager
          canPrevious={tasks.canPrevious}
          canNext={tasks.canNext}
          onPrevious={tasks.previous}
          onNext={tasks.next}
          totalEstimate={tasks.page?.totalEstimate}
        />
      </AsyncState>

      {/* Action Register Section */}
      <div className="section-title flex items-center justify-between mt-8 mb-3.5 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-sky-50 text-[#1b5fa7]">
            <CheckSquare className="size-4" />
          </span>
          <h2 className="text-base font-bold text-slate-900">Action register</h2>
          {actions.page?.items.length !== undefined && (
            <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {actions.page.items.length}
            </span>
          )}
        </div>
      </div>

      <AsyncState
        loading={actions.loading}
        refreshing={actions.refreshing}
        stale={actions.stale}
        error={actions.error}
        onRetry={actions.reload}
      >
        {actions.page?.items.length ? (
          <div className="list space-y-3">
            {actions.page.items.map((a) => (
              <Link
                className="row link-row p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150 flex items-center justify-between gap-3 group"
                to={`/org/actions/${a.id}`}
                key={a.id}
              >
                <div className="flex-1 min-w-0">
                  <div className="row-title font-bold text-sm text-slate-900 group-hover:text-[#1b5fa7] transition-colors">
                    {a.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      <User className="size-3 text-slate-400" />
                      {a.owner}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      <TagIcon className="size-3 text-slate-400" />
                      source {a.sourceType}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      <CalendarDays className="size-3 text-slate-400" />
                      due {a.due}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusPill value={a.status} />
                  <ArrowRight className="size-4 text-slate-400 group-hover:text-[#1b5fa7] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No Actions in this scope" />
        )}
      </AsyncState>
    </>
  );
}
