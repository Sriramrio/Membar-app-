import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { AsyncState } from '@/components/AsyncState';
import { CursorPager } from '@/components/CursorPager';
import { EmptyState } from '@/components/EmptyState';
import { useOrg } from '@/state/OrgStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { useRouteView } from '@/config/routeViews';

interface TimelineEvent {
  id: string;
  actorId?: string;
  actor?: string;
  effectiveRole?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  commandId?: string;
  correlationId?: string;
  at?: string;
  occurredAt?: string;
  operation?: string;
  event?: string;
  after?: string;
}

export default function TimelinePage() {
  const s = useOrg();
  const view = useRouteView('Operational Timeline', 'Chronological sequence of organisational milestones, delegations, handovers, and decisions.');
  const [q, setQ] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const dq = useDebouncedValue(q, 300);

  const localAudits = useMemo(() => {
    return s.audits.map(a => ({
      id: a.id,
      actor: a.actor || s.actor.name || 'Officer',
      effectiveRole: a.effectiveRole || s.actor.position || 'Chapter Officer',
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      commandId: a.commandId,
      correlationId: a.correlationId,
      at: a.at,
      event: a.action + (a.after ? `: ${a.after}` : '')
    }));
  }, [s.audits]);

  const req = useMemo(() => ({
    queryId: 'org.audit.list',
    search: dq,
    filters: filterType === 'ALL' ? undefined : [{ field: 'entityType', operator: 'eq', value: filterType }],
    organisationScope: s.scope.id,
    pageSize: 30
  }), [dq, filterType, s.scope.id]);

  const page = useDomainCursorPage<TimelineEvent>(req, localAudits, [dq, filterType]);
  useRealtimeRefresh(['org.audit.*', 'org.handover.*', 'org.delegation.*'], page.reload);

  const items = useMemo(() => {
    const list = page.page?.items ?? [];
    return list.filter(item => {
      const matchSearch = !dq || `${item.action} ${item.actor} ${item.effectiveRole} ${item.event} ${item.entityType}`.toLowerCase().includes(dq.toLowerCase());
      const matchType = filterType === 'ALL' || item.entityType?.toLowerCase() === filterType.toLowerCase() || item.action?.toLowerCase().includes(filterType.toLowerCase());
      return matchSearch && matchType;
    });
  }, [page.page?.items, dq, filterType]);

  const getBadgeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'handover':
      case 'continuity':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delegation':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'task':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'governance':
      case 'decision':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <>
      <PageHeader title={view.title}>{view.description}</PageHeader>

      <div className="toolbar flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs mb-6">
        <input
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50/50 min-h-[44px]"
          value={q}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
          aria-label="Search operational timeline"
          placeholder="Filter by actor, action or event keyword..."
        />
        <select
          className="px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
          aria-label="Filter timeline by category"
          value={filterType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}
        >
          <option value="ALL">All Categories</option>
          <option value="Handover">Handovers</option>
          <option value="Delegation">Delegations</option>
          <option value="Task">Tasks & Actions</option>
          <option value="Decision">Decisions</option>
          <option value="OperationalAudit">Audit Changes</option>
        </select>
      </div>

      <AsyncState loading={page.loading} refreshing={page.refreshing} stale={page.stale} error={page.error} onRetry={page.reload}>
        {items.length ? (
          <div className="timeline-container relative pl-6 border-l-2 border-slate-200 ml-4 space-y-6 my-4">
            {items.map((entry, idx) => {
              const dt = entry.at || entry.occurredAt;
              const dateStr = dt ? new Date(dt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently';
              const entType = entry.entityType || 'Action';
              const actionName = entry.action || entry.operation || 'Operational Milestone';

              return (
                <div key={entry.id || idx} className="timeline-item relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-xs group-hover:scale-125 transition-transform" />

                  <div className="card p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeColor(entType)}`}>
                          {entType}
                        </span>
                        <h3 className="text-base font-semibold text-slate-900">{actionName}</h3>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{dateStr}</span>
                    </div>

                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {entry.event || entry.after || 'Executed governed command on operational entity.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <div>
                        <span className="font-medium text-slate-700">{entry.actor || 'Officer'}</span>
                        {entry.effectiveRole && ` · ${entry.effectiveRole}`}
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.entityId && (
                          <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {entry.entityId.slice(0, 12)}
                          </span>
                        )}
                        <Link
                          to={`/org/audit?q=${encodeURIComponent(entry.id)}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Audit record →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No timeline entries match the selected filters" />
        )}

        <CursorPager canPrevious={page.canPrevious} canNext={page.canNext} onPrevious={page.previous} onNext={page.next} totalEstimate={page.page?.totalEstimate} />
      </AsyncState>
    </>
  );
}
