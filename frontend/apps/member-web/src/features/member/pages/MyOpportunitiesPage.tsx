import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EnterpriseStatus } from '@/features/member/components/EnterpriseMemberUI';
import { EmptyState, PageHead } from '@/features/network/components/NetworkUI';
import { activeMemberId } from '@/features/network/selectors';
import { updateOpportunity, updateOpportunityStatus } from '@/features/network/networkSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import type { OpportunityStatus } from '@/features/network/types';
import { inPeriod, resolveDashboardPeriod } from '@/features/member/dashboard/period';
import type { DashboardPeriodKey } from '@/features/member/dashboard/types';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import type { Opportunity } from '@/features/network/types';
import { toGuid } from '@/services/api/guidUtils';
import { apiClient } from '@/services/api/apiClient';

const groups: Array<{ key: string; label: string; statuses: OpportunityStatus[] }> = [
  { key: 'all', label: 'All', statuses: ['draft', 'pending-review', 'open', 'closed', 'expired', 'withdrawn', 'rejected'] },
  { key: 'draft', label: 'Draft', statuses: ['draft', 'pending-review'] },
  { key: 'open', label: 'Open', statuses: ['open'] },
  { key: 'closed', label: 'Closed', statuses: ['closed', 'expired', 'withdrawn', 'rejected'] },
];

const fmt = (v: string) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function MyOpportunitiesPage() {
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const { go } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const n = useNetworkSlice(['opportunities', 'opportunityQuestions', 'responses'] as const);
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab') ?? 'all';
  const tab = groups.some(g => g.key === requestedTab) ? requestedTab : 'all';
  const responsesOnly = params.get('view') === 'responses';
  const periodKey = (params.get('period') ?? 'month') as DashboardPeriodKey;
  const analyticsPeriod = resolveDashboardPeriod(periodKey);

  const [liveOpps, setLiveOpps] = useState<any[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const fetchLiveOpps = useCallback(() => {
    setLoadingOpps(true);
    apiClient.get<any[]>('/opportunities', { retry: 'safe' })
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setLiveOpps(res);
          setIsLiveConnected(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOpps(false));
  }, []);

  useEffect(() => {
    fetchLiveOpps();
  }, [fetchLiveOpps, memberId]);

  const allOpportunities = useMemo(() => {
    if (liveOpps.length > 0) {
      const liveMapped: Opportunity[] = liveOpps.map(o => ({
        id: String(o.id || o.Id),
        ownerMemberId: String(o.ownerMemberId || o.OwnerMemberId || memberId),
        businessId: String(o.businessId || o.BusinessId || ''),
        title: o.title || o.Title || 'Business Opportunity',
        description: o.description || `Business requirement: ${o.title || o.Title}. Available within the verified network.`,
        status: ((o.status || o.Status || 'open').toLowerCase()) as OpportunityStatus,
        type: o.scope || o.Scope || 'requirement',
        closingDate: o.closingDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        createdAt: o.createdAt || new Date().toISOString(),
        version: o.version || o.Version || 1,
        location: o.location || 'Tamil Nadu',
        categoryId: String(o.categoryId || o.CategoryId || 'cat-general'),
        visibility: 'members' as const,
      }));
      const liveIds = new Set(liveMapped.map(x => x.id.toLowerCase()));
      const liveTitles = new Set(liveMapped.map(x => `${toGuid(x.ownerMemberId)}::${x.title.trim().toLowerCase()}`));
      const localOnly = n.opportunities.filter(x => 
        !liveIds.has(x.id.toLowerCase()) &&
        !liveTitles.has(`${toGuid(x.ownerMemberId)}::${x.title.trim().toLowerCase()}`)
      );
      const seen = new Set<string>();
      return [...liveMapped, ...localOnly].filter(o => {
        const key = `${toGuid(o.ownerMemberId)}::${o.title.trim().toLowerCase()}::${o.status}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    const seen = new Set<string>();
    return (n.opportunities ?? []).filter(o => {
      const key = `${toGuid(o.ownerMemberId)}::${o.title.trim().toLowerCase()}::${o.status}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [liveOpps, n.opportunities, memberId]);

  const owned = useMemo(() => (
    allOpportunities
      .filter(o => o.ownerMemberId === memberId || toGuid(o.ownerMemberId) === toGuid(memberId))
      .filter(o => !params.get('period') || inPeriod(o.createdAt, analyticsPeriod))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  ), [allOpportunities, memberId, params, analyticsPeriod.start, analyticsPeriod.end]);

  const visible = owned
    .filter(o => groups.find(g => g.key === tab)?.statuses.includes(o.status))
    .filter(o => !responsesOnly || n.responses.some(r => r.opportunityId === o.id || toGuid(r.opportunityId) === toGuid(o.id)));

  const mutate = async (o: Opportunity, commandName: 'opportunity.update' | 'opportunity.status.update', changes: Record<string, unknown>, previewAction: () => void) => {
    await command.execute({ domain: 'member', policyId: commandName, command: commandName, aggregateType: 'Opportunity', aggregateId: o.id, expectedVersion: o.version, payload: { opportunityId: o.id, ...changes }, previewAction });
    fetchLiveOpps();
  };

  const extend = (o: Opportunity, days: number) => {
    const d = new Date(`${o.closingDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    const closingDate = d.toISOString().slice(0, 10);
    void mutate(o, 'opportunity.update', { changes: { closingDate } }, () => dispatch(updateOpportunity({ opportunityId: o.id, ownerMemberId: memberId, changes: { closingDate } })));
  };

  const status = (o: Opportunity, next: OpportunityStatus) => (
    void mutate(o, 'opportunity.status.update', { status: next }, () => dispatch(updateOpportunityStatus({ opportunityId: o.id, ownerMemberId: memberId, status: next })))
  );

  return (
    <div>
      <PageHead
        eyebrow={isLiveConnected ? "Database Live Opportunities" : "Buyer workspace"}
        title="My Opportunities"
        description="Manage requirements from draft through supplier response, discussion, selection and recorded business outcome."
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={fetchLiveOpps} disabled={loadingOpps}>
              <RefreshCw className={`size-4 ${loadingOpps ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={() => go('/app/opportunities/new', { label: 'My Opportunities' })}>
              <Plus className="size-4" />Post Opportunity
            </Button>
          </div>
        }
      />
      <CommandExecutionFeedback error={command.error} onRetry={() => void command.retry()} onDismiss={command.clearError} />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Opportunity status">
        {groups.map(g => (
          <button
            type="button"
            key={g.key}
            role="tab"
            aria-selected={tab === g.key}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set('tab', g.key);
              next.delete('view');
              setParams(next, { replace: true });
            }}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${tab === g.key ? 'bg-[var(--navy-900)] text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
          >
            {g.label} <span className="ml-1 opacity-80">{owned.filter(o => g.statuses.includes(o.status)).length}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-4">
        {visible.map(o => {
          const responses = n.responses.filter(r => r.opportunityId === o.id || toGuid(r.opportunityId) === toGuid(o.id));
          const questions = n.opportunityQuestions.filter(q => q.opportunityId === o.id || toGuid(q.opportunityId) === toGuid(o.id));
          const openQuestions = questions.filter(q => !q.answer).length;
          const selected = responses.find(r => r.status === 'won');
          return (
            <Card key={o.id} className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <EnterpriseStatus status={o.status} tone={o.status === 'open' ? 'success' : o.status === 'draft' || o.status === 'pending-review' ? 'warning' : 'neutral'} />
                    {o.type && <EnterpriseStatus status={o.type} tone="info" />}
                  </div>
                  <button type="button" className="mt-3 text-left text-xl font-black text-sky-800 hover:underline" onClick={() => go(`/app/opportunities/${o.id}`, { label: 'My Opportunities' })}>
                    {o.title}
                  </button>
                  <p className="mt-2 line-clamp-2 text-base leading-6 text-slate-600">{o.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                    <span><strong>{responses.length}</strong> response{responses.length === 1 ? '' : 's'}</span>
                    <span><strong>{questions.length}</strong> question{questions.length === 1 ? '' : 's'}{openQuestions ? ` · ${openQuestions} need${openQuestions === 1 ? 's' : ''} answer` : ''}</span>
                    <span>Closes <strong>{fmt(o.closingDate)}</strong></span>
                    {selected && <span className="font-bold text-emerald-700">Supplier selected</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 xl:max-w-[360px] xl:justify-end">
                  <Button onClick={() => go(`/app/opportunities/${o.id}`, { label: 'My Opportunities' })}>
                    {responses.length ? 'Review Responses' : 'View Opportunity'}
                  </Button>
                  {['draft', 'open'].includes(o.status) && (
                    <Button variant="secondary" onClick={() => go(`/app/opportunities/new?edit=${o.id}`, { label: o.title })}>
                      Edit
                    </Button>
                  )}
                  {o.status === 'draft' && (
                    <Button variant="secondary" disabled={command.busy} onClick={() => status(o, 'open')}>
                      Publish
                    </Button>
                  )}
                  {o.status === 'open' && (
                    <>
                      <Button variant="secondary" disabled={command.busy} onClick={() => extend(o, 7)}>
                        Extend 7 days
                      </Button>
                      <Button variant="ghost" disabled={command.busy} onClick={() => status(o, 'closed')}>
                        Close
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {!visible.length && (
          <EmptyState
            title={tab === 'all' ? 'No opportunities posted' : `No ${groups.find(g => g.key === tab)?.label.toLowerCase()} opportunities`}
            body={tab === 'all' ? 'Post a structured business requirement to reach relevant companies in your network.' : 'Items move here automatically as their business workflow status changes.'}
            action={tab === 'all' ? <Button onClick={() => go('/app/opportunities/new', { label: 'My Opportunities' })}>Post Opportunity</Button> : undefined}
          />
        )}
      </div>
    </div>
  );
}
