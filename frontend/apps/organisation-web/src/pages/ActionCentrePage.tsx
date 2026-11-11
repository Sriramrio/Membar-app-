import { Link } from 'react-router-dom';
import { useMemo, useState, type ChangeEvent } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  ArrowRight, 
  X,
  CheckSquare,
  ShieldCheck
} from 'lucide-react';
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
import type { ActionCentreItem, Task, WorkStatus, Priority, Approval } from '@/domain/types';
import { canTaskTransition } from '@/domain/stateMachines';
import { businessDateOnly } from '@/utils/businessDate';

type Tab = 'NEEDS_YOU' | 'DUE_SOON' | 'WAITING' | 'FYI';
type EntityFilter = 'ALL' | 'Task' | 'Approval' | 'Action' | 'Member Case';
type PriorityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export default function ActionCentrePage() {
  const s = useOrg();
  const cmd = useOrgCommandAction();
  const [tab, setTab] = useState<Tab>('NEEDS_YOU');
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [isOverdueOnly, setIsOverdueOnly] = useState(false);

  const today = businessDateOnly();
  const soon = businessDateOnly(7);

  // Compute local fallback items from current store state
  const local = useMemo<ActionCentreItem[]>(() => {
    // 1. Tasks
    const tasks = s.tasks
      .filter((t) => {
        if (tab === 'WAITING') {
          return t.status === 'WAITING' || t.status === 'BLOCKED';
        }
        if (tab === 'DUE_SOON') {
          // Include tasks due in next 7 days AND overdue tasks so they are never lost!
          return t.status !== 'DONE' && t.due && t.due <= soon;
        }
        if (tab === 'FYI') {
          return t.status === 'DONE';
        }
        // NEEDS_YOU: tasks owned by current user or unassigned
        return t.status !== 'DONE' && (
          t.owner === s.actor.name ||
          t.owner === s.actor.position ||
          !t.owner
        );
      })
      .map((t) => ({
        id: t.id,
        entityType: 'Task' as const,
        title: t.title,
        owner: t.owner,
        due: t.due,
        status: t.status,
        priority: t.priority,
        to: `/org/tasks/${t.id}`,
        expectedVersion: t.version,
        sourceType: t.sourceType,
        sourceId: t.sourceId
      }));

    // 2. Member Cases
    const cases = tab === 'NEEDS_YOU'
      ? s.cases
          .filter((c) => c.status !== 'Closed' && (c.owner === s.actor.name || !c.owner))
          .map((c) => ({
            id: c.id,
            entityType: 'Member Case' as const,
            title: c.title,
            owner: c.owner,
            due: '',
            status: c.status,
            priority: c.priority,
            to: `/org/member-cases/${c.id}`,
            expectedVersion: c.version,
            sourceType: 'MEMBER_CASE',
            sourceId: c.memberId
          }))
      : [];

    // 3. Approvals
    const approvals = tab === 'NEEDS_YOU'
      ? s.approvals
          .filter((a) => a.status === 'PENDING')
          .map((a) => ({
            id: a.id,
            entityType: 'Approval' as const,
            title: a.subject,
            owner: a.requester,
            due: a.due,
            status: a.status,
            priority: (a.risk?.toUpperCase() ?? 'MEDIUM') as Priority,
            to: `/org/approvals/${a.id}`,
            expectedVersion: a.version,
            sourceType: a.sourceType,
            sourceId: a.sourceId
          }))
      : [];

    // 4. Action Items
    const actions = tab === 'DUE_SOON'
      ? s.actions
          .filter((a) => a.status !== 'DONE' && a.due && a.due <= soon)
          .map((a) => ({
            id: a.id,
            entityType: 'Action' as const,
            title: a.title,
            owner: a.owner,
            due: a.due,
            status: a.status,
            priority: a.priority,
            to: `/org/actions/${a.id}`,
            expectedVersion: a.version,
            sourceType: a.sourceType,
            sourceId: a.sourceId
          }))
      : [];

    return [...tasks, ...cases, ...approvals, ...actions];
  }, [s.tasks, s.cases, s.approvals, s.actions, s.actor.name, s.actor.position, tab, soon]);

  // Query specification sent to backend query gateway
  const req = useMemo(() => ({
    queryId: 'org.action-centre',
    organisationScope: s.scope.id,
    filters: [
      { field: 'bucket', operator: 'eq', value: tab }
    ],
    pageSize: 25
  }), [s.scope.id, tab]);

  const page = useDomainCursorPage<ActionCentreItem>(req, local, [tab]);
  useRealtimeRefresh(['org.task.*', 'org.member-case.*', 'org.approval.*', 'org.action.*'], page.reload);

  // Quick Inline Actions for Tasks
  const updateTask = async (item: ActionCentreItem, status: WorkStatus) => {
    if (item.entityType !== 'Task') return;
    const localTask = s.tasks.find((t) => t.id === item.id);
    const version = item.expectedVersion ?? localTask?.version;
    await cmd.run(
      {
        commandType: status === 'DONE' ? 'org.task.complete' : 'org.task.update',
        aggregateType: 'Task',
        aggregateId: item.id,
        expectedVersion: version,
        payload: { status },
        reason: 'Action Centre task update'
      },
      () => s.dispatch({ type: 'TASK_STATUS', payload: { id: item.id, status } })
    );
  };

  // Quick Inline Actions for Approvals (Decide)
  const decideApproval = async (item: ActionCentreItem, status: Approval['status']) => {
    if (item.entityType !== 'Approval') return;
    const localApp = s.approvals.find((a) => a.id === item.id);
    const version = item.expectedVersion ?? localApp?.version;
    await cmd.run(
      {
        commandType: 'org.approval.decide',
        aggregateType: 'Approval',
        aggregateId: item.id,
        expectedVersion: version,
        payload: { status },
        reason: `Action Centre operational approval ${status.toLowerCase()}`
      },
      () => s.dispatch({ type: 'APPROVAL', payload: { id: item.id, status } })
    );
  };

  // Metrics computation for summary banner
  const metrics = useMemo(() => {
    const serverSummary = (page.page as { summary?: { pendingApprovals?: number; overdue?: number; totalOpen?: number; urgentActions?: number; needsYou?: number; dueSoon?: number } })?.summary;

    const overdueTasks = s.tasks.filter((t) => t.status !== 'DONE' && t.due && t.due < today).length;
    const overdueActions = s.actions.filter((a) => a.status !== 'DONE' && a.due && a.due < today).length;
    const localOverdue = overdueTasks + overdueActions;

    const needsYouTasks = s.tasks.filter((t) => t.status !== 'DONE' && (t.owner === s.actor.name || !t.owner)).length;
    const needsYouApprovals = s.approvals.filter((a) => a.status === 'PENDING').length;
    const needsYouCases = s.cases.filter((c) => c.status !== 'Closed' && (c.owner === s.actor.name || !c.owner)).length;
    const localNeedsYou = needsYouTasks + needsYouApprovals + needsYouCases;

    const localDueSoon = s.tasks.filter((t) => t.status !== 'DONE' && t.due && t.due <= soon).length +
      s.actions.filter((a) => a.status !== 'DONE' && a.due && a.due <= soon).length;

    const localPendingApprovals = s.approvals.filter((a) => a.status === 'PENDING').length;

    // Items from current query page
    const rawItems = page.page?.items ?? [];
    const pageOverdue = rawItems.filter((i) => Boolean(i.due && i.due < today && i.status !== 'DONE' && i.status !== 'Closed' && i.status !== 'APPROVED')).length;
    const pageApprovals = rawItems.filter((i) => i.entityType === 'Approval' && i.status === 'PENDING').length;
    const pageDueSoon = rawItems.filter((i) => Boolean(i.due && i.due <= soon && i.status !== 'DONE' && i.status !== 'Closed')).length;

    const overdueCount = serverSummary?.overdue !== undefined ? serverSummary.overdue : Math.max(localOverdue, pageOverdue);
    const pendingApprovalsCount = serverSummary?.pendingApprovals !== undefined ? serverSummary.pendingApprovals : Math.max(localPendingApprovals, pageApprovals);
    const needsYouCount = serverSummary?.needsYou !== undefined ? serverSummary.needsYou : (serverSummary?.totalOpen !== undefined ? serverSummary.totalOpen : Math.max(localNeedsYou, rawItems.length));
    const dueSoonCount = serverSummary?.dueSoon !== undefined ? serverSummary.dueSoon : Math.max(localDueSoon, pageDueSoon);

    return {
      needsYou: needsYouCount,
      dueSoon: dueSoonCount,
      overdue: overdueCount,
      pendingApprovals: pendingApprovalsCount
    };
  }, [s.tasks, s.actions, s.approvals, s.cases, s.actor.name, today, soon, page.page]);

  // Client-side filtering for Search, Entity Type, Priority, and Overdue Only
  const filteredItems = useMemo(() => {
    const rawItems = page.page?.items ?? [];
    return rawItems.filter((item) => {
      const isOverdue = Boolean(item.due && item.due < today && item.status !== 'DONE' && item.status !== 'Closed' && item.status !== 'APPROVED');

      // 0. Overdue Only Filter (activated when clicking Overdue KPI card)
      if (isOverdueOnly && !isOverdue) {
        return false;
      }

      // 1. Text Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesOwner = item.owner.toLowerCase().includes(q);
        const matchesType = item.entityType.toLowerCase().includes(q);
        const matchesSource = item.sourceId ? item.sourceId.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesOwner && !matchesType && !matchesSource) {
          return false;
        }
      }

      // 2. Entity Type Filter
      if (entityFilter !== 'ALL' && item.entityType !== entityFilter) {
        return false;
      }

      // 3. Priority Filter
      if (priorityFilter !== 'ALL' && item.priority?.toUpperCase() !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [page.page?.items, search, entityFilter, priorityFilter, isOverdueOnly, today]);

  return (
    <>
      <PageHeader title="Action Centre">
        A projection of work owned by canonical records — never a shadow workflow.
      </PageHeader>

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <button
          type="button"
          onClick={() => {
            setTab('NEEDS_YOU');
            setIsOverdueOnly(false);
            setEntityFilter('ALL');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            tab === 'NEEDS_YOU' && !isOverdueOnly
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Needs You</span>
            <CheckCircle2 className={`w-4 h-4 ${tab === 'NEEDS_YOU' && !isOverdueOnly ? 'text-[#1b5fa7]' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.needsYou}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Tasks & Approvals</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('DUE_SOON');
            setIsOverdueOnly(false);
            setEntityFilter('ALL');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            tab === 'DUE_SOON' && !isOverdueOnly
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Due Soon</span>
            <Clock className={`w-4 h-4 ${tab === 'DUE_SOON' && !isOverdueOnly ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.dueSoon}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Next 7 days</p>
        </button>

        {/* Overdue Card: Now interactive button to toggle overdue filter */}
        <button
          type="button"
          onClick={() => {
            setIsOverdueOnly(prev => !prev);
          }}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            isOverdueOnly
              ? 'bg-rose-100/90 border-rose-400 ring-2 ring-rose-500/30'
              : metrics.overdue > 0
              ? 'bg-rose-50/80 border-rose-200 hover:border-rose-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          title="Click to toggle filtering overdue items"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Overdue</span>
            <AlertCircle className={`w-4 h-4 ${metrics.overdue > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold mt-1 ${metrics.overdue > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {metrics.overdue}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[11px] text-slate-500">Requires immediate action</p>
            {isOverdueOnly ? (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-200/80 px-1.5 py-0.5 rounded">Active Filter</span>
            ) : (
              <span className="text-[10px] font-semibold text-rose-600">Filter ⚡</span>
            )}
          </div>
        </button>

        {/* Pending Approvals Card: Navigates directly to /org/approvals */}
        <Link
          to="/org/approvals"
          className="p-3.5 rounded-xl border bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all cursor-pointer group no-underline block"
          title="Navigate to Operational Approvals page"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 group-hover:text-indigo-900">Pending Approvals</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.pendingApprovals}</div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[11px] text-slate-500">Operational sign-offs</p>
            <span className="text-[11px] font-semibold text-[#1b5fa7] flex items-center gap-0.5 group-hover:underline">
              Go to Approvals <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>
      </div>

      {/* Overdue Warning Alert Banner if overdue items exist */}
      {metrics.overdue > 0 && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Attention:</strong> You have <strong>{metrics.overdue} overdue item{metrics.overdue > 1 ? 's' : ''}</strong> that passed the due date. Check <em>Due Soon</em> to resolve them immediately.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setTab('DUE_SOON');
              setIsOverdueOnly(true);
            }}
            className="px-2.5 py-1 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 transition-colors shrink-0 text-xs cursor-pointer"
          >
            Filter Overdue Items
          </button>
        </div>
      )}

      {/* Primary Category Tabs */}
      <div className="tabs flex items-center gap-2 border-b border-slate-200 pb-2 mb-4 overflow-x-auto">
        {(
          [
            ['NEEDS_YOU', 'Needs you', metrics.needsYou],
            ['DUE_SOON', 'Due soon', metrics.dueSoon],
            ['WAITING', 'Waiting', null],
            ['FYI', 'FYI', null]
          ] as const
        ).map(([k, label, count]) => (
          <button
            key={k}
            type="button"
            className={`btn px-3.5 py-2 rounded-lg font-bold text-xs transition-colors min-h-[44px] flex items-center gap-1.5 ${
              tab === k
                ? 'primary bg-[#1b5fa7] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
            onClick={() => {
              setTab(k);
              setEntityFilter('ALL');
              setIsOverdueOnly(false);
            }}
          >
            <span>{label}</span>
            {count !== null && count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  tab === k ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="filter-bar bg-slate-50/80 p-3 rounded-xl border border-slate-200 mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, owner, or reference..."
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/30 focus:border-[#1b5fa7] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isOverdueOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Overdue Items Only</span>
              <button
                type="button"
                onClick={() => setIsOverdueOnly(false)}
                className="ml-1 text-rose-700 hover:text-rose-950 font-bold px-1 cursor-pointer"
                aria-label="Remove overdue filter"
              >
                ×
              </button>
            </span>
          )}

          <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
            <Search className="w-3.5 h-3.5" />
            <span>Type:</span>
          </div>
          <select
            value={entityFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setEntityFilter(e.target.value as EntityFilter)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1b5fa7]"
          >
            <option value="ALL">All Items</option>
            <option value="Task">Tasks Only</option>
            <option value="Approval">Approvals Only</option>
            <option value="Action">Actions Only</option>
            <option value="Member Case">Cases Only</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setPriorityFilter(e.target.value as PriorityFilter)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1b5fa7]"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {(search || entityFilter !== 'ALL' || priorityFilter !== 'ALL' || isOverdueOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setEntityFilter('ALL');
                setPriorityFilter('ALL');
                setIsOverdueOnly(false);
              }}
              className="text-xs text-[#1b5fa7] font-semibold hover:underline px-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main List Projection */}
      <AsyncState
        loading={page.loading}
        refreshing={page.refreshing}
        stale={page.stale}
        error={page.error}
        onRetry={page.reload}
      >
        {filteredItems.length ? (
          <div className="list space-y-2.5">
            {filteredItems.map((item) => {
              const isOverdue = Boolean(item.due && item.due < today && item.status !== 'DONE' && item.status !== 'Closed' && item.status !== 'APPROVED');
              const isRequesterSelf = item.entityType === 'Approval' && (
                item.owner.toLowerCase() === s.actor.name.toLowerCase() ||
                item.owner.toLowerCase() === (s.actor.position ?? '').toLowerCase()
              );

              return (
                <div
                  className={`row p-3.5 bg-white rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isOverdue
                      ? 'border-rose-200/90 shadow-2xs hover:border-rose-300 hover:shadow-xs'
                      : 'border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs'
                  }`}
                  key={`${item.entityType}-${item.id}`}
                >
                  <div className="row-main min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.entityType === 'Approval'
                          ? 'bg-purple-100 text-purple-800'
                          : item.entityType === 'Member Case'
                          ? 'bg-amber-100 text-amber-800'
                          : item.entityType === 'Action'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.entityType}
                      </span>

                      {item.priority && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          item.priority === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : item.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.priority}
                        </span>
                      )}

                      {isOverdue && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          OVERDUE
                        </span>
                      )}

                      {isRequesterSelf && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Requested by you (Awaiting MC)
                        </span>
                      )}
                    </div>

                    <Link
                      className="row-title font-bold text-sm text-slate-900 hover:text-[#1b5fa7] transition-colors flex items-center gap-1.5"
                      to={item.to}
                    >
                      <span>{item.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </Link>

                    <div className="row-meta text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span>Owner: <strong>{item.owner}</strong></span>
                      {item.sourceType && (
                        <span>· Source: {item.sourceType} {item.sourceId ? `(${item.sourceId})` : ''}</span>
                      )}
                      {item.due && (
                        <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                          · Due: {item.due}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="row-actions flex items-center gap-2 flex-wrap shrink-0">
                    <StatusPill value={item.status} />

                    {/* Quick Task Controls */}
                    {item.entityType === 'Task' && (
                      <>
                        <button
                          type="button"
                          className="btn px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 min-h-[44px] transition-colors disabled:opacity-50 flex items-center gap-1"
                          disabled={cmd.busy || !canTaskTransition(item.status as WorkStatus, 'IN_PROGRESS')}
                          onClick={() => void updateTask(item, 'IN_PROGRESS')}
                        >
                          <span className="text-[10px]">▶</span>
                          <span>Start</span>
                        </button>
                        <button
                          type="button"
                          className="btn primary px-3 py-1.5 rounded-lg bg-[#1b5fa7] text-white font-bold text-xs hover:bg-[#174f89] min-h-[44px] transition-colors disabled:opacity-50 flex items-center gap-1"
                          disabled={cmd.busy || !canTaskTransition(item.status as WorkStatus, 'DONE')}
                          onClick={() => void updateTask(item, 'DONE')}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </button>
                      </>
                    )}

                    {/* Quick Approval Controls (with SoD verification) */}
                    {item.entityType === 'Approval' && item.status === 'PENDING' && (
                      <>
                        {isRequesterSelf ? (
                          <span
                            className="text-[11px] text-slate-500 italic px-2 py-1 bg-slate-50 rounded border border-slate-200"
                            title="Under Separation of Duties, you cannot approve your own submission."
                          >
                            Awaiting Reviewer
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 min-h-[44px] transition-colors disabled:opacity-50 flex items-center gap-1"
                              disabled={cmd.busy}
                              onClick={() => void decideApproval(item, 'RETURNED')}
                              title="Return for correction"
                            >
                              <span className="text-[11px]">↩</span>
                              <span>Return</span>
                            </button>
                            <button
                              type="button"
                              className="btn danger px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 min-h-[44px] transition-colors disabled:opacity-50"
                              disabled={cmd.busy}
                              onClick={() => void decideApproval(item, 'REJECTED')}
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              className="btn primary px-3.5 py-1.5 rounded-lg bg-[#1b5fa7] text-white font-bold text-xs hover:bg-[#174f89] min-h-[44px] transition-colors disabled:opacity-50 flex items-center gap-1"
                              disabled={cmd.busy}
                              onClick={() => void decideApproval(item, 'APPROVED')}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {/* Quick Link to Details for Actions and Cases */}
                    {(item.entityType === 'Action' || item.entityType === 'Member Case') && (
                      <Link
                        to={item.to}
                        className="btn px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 min-h-[44px] flex items-center gap-1 transition-colors"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={search || entityFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'No matching work found with current filters'
              : 'No work in this Action Centre bucket'}
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
