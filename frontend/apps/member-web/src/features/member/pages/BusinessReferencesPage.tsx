import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { EmptyState, PageHead, StatusPill, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId } from '@/features/network/selectors';
import { updateReferenceStatus } from '@/features/network/networkSlice';
import { canTransitionReference } from '@/features/network/stateMachines';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { AnalyticsSummary } from '@/features/member/analytics/AnalyticsSummary';
import { buildPersonalNetworkingAnalytics } from '@/features/member/analytics/networkingAnalytics';
import type { DashboardPeriodKey } from '@/features/member/dashboard/types';
import { inPeriod, resolveDashboardPeriod } from '@/features/member/dashboard/period';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import type { Reference } from '@/features/network/types';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { QueryError, QueryLoading } from '@/components/data/QueryState';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { env } from '@/config/env';
import { toGuid, toMemberSlug } from '@/services/api/guidUtils';

type Tab = 'Given' | 'Received' | 'Action Needed' | 'Closed';
const parseTab = (value: string | null): Tab => {
  const key = (value ?? '').trim().toLowerCase();
  if (key === 'given') return 'Given';
  if (key === 'action needed' || key === 'action-needed' || key === 'action') return 'Action Needed';
  if (key === 'closed') return 'Closed';
  return 'Received';
};
const tabParam = (tab: Tab) => tab.toLowerCase().replace(/\s+/g, '-');

export default function BusinessReferencesPage() {
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const { go } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const n = useNetworkSlice(['businesses', 'members', 'references', 'transactions'] as const);
  const [params, setParams] = useSearchParams();

  const [tab, setTabState] = useState<Tab>(() => parseTab(params.get('tab')));
  const [followUpId, setFollowUpId] = useState<string | null>(null);
  const periodKey = (params.get('period') ?? 'month') as DashboardPeriodKey;
  const intelligence = useAppSelector(s => buildPersonalNetworkingAnalytics(s, memberId, periodKey));
  const analyticsPeriod = useMemo(() => resolveDashboardPeriod(periodKey), [periodKey]);

  const myGuid = toGuid(memberId).toLowerCase();

  const changeStatus = async (r: Reference, status: NonNullable<Reference['status']>, followUp?: string) => {
    await command.execute({
      domain: 'member',
      policyId: 'reference.status.update',
      command: 'reference.status.update',
      aggregateType: 'Reference',
      aggregateId: r.id,
      expectedVersion: r.version,
      payload: { referenceId: r.id, status, followUp },
      previewAction: () => dispatch(updateReferenceStatus({ referenceId: r.id, status, followUp }))
    });
  };

  const memberFilter = params.get('member');
  const businessFilter = params.get('business');
  const referenceFilter = params.get('reference');
  const periodFilter = params.get('period') ?? '';

  const setTab = (next: Tab) => {
    setTabState(next);
    const copy = new URLSearchParams(params);
    copy.set('tab', tabParam(next));
    setParams(copy, { replace: true });
  };

  const localRows = useMemo(() => n.references
    .filter(r => r.fromMemberId === memberId || r.toMemberId === memberId)
    .filter(r => !memberFilter || r.fromMemberId === memberFilter || r.toMemberId === memberFilter)
    .filter(r => !businessFilter || r.businessId === businessFilter)
    .filter(r => !referenceFilter || r.id === referenceFilter)
    .filter(r => !periodFilter || inPeriod(r.createdAt, analyticsPeriod))
    .filter(r => tab === 'Given' ? r.fromMemberId === memberId : tab === 'Received' ? r.toMemberId === memberId && r.status !== 'Closed' : tab === 'Action Needed' ? r.toMemberId === memberId && ['Sent', 'Acknowledged', 'Accepted', 'In Progress'].includes(r.status ?? 'Sent') : r.status === 'Closed')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [n.references, memberId, memberFilter, businessFilter, referenceFilter, periodFilter, analyticsPeriod, tab]);

  const request = useMemo(() => ({
    queryId: 'member.references.list',
    domain: 'member' as const,
    pagination: { pageSize: 40 },
    sort: [{ field: 'createdAt', direction: 'desc' as const }],
    parameters: { viewerMemberId: memberId, tab, memberFilter, businessFilter, referenceFilter, period: periodFilter || undefined }
  }), [memberId, tab, memberFilter, businessFilter, referenceFilter, periodFilter]);

  const query = useDomainCursorPage<any>(request, localRows, [memberId, tab, memberFilter, businessFilter, referenceFilter, periodFilter]);
  useRealtimeRefresh(['reference.*', 'transaction.*'], query.reload);

  const rawRefs: any[] = query.page?.items ?? (env.useMocks ? localRows : []);

  const refs = useMemo(() => {
    return rawRefs.map((r: any): Reference => {
      const fromSlug = toMemberSlug(r.fromMemberId) || r.fromMemberId;
      const toSlug = toMemberSlug(r.toMemberId) || r.toMemberId;
      return {
        id: String(r.id),
        fromMemberId: fromSlug,
        toMemberId: toSlug,
        businessId: r.businessId || 'business-member',
        text: r.text || r.outcome || 'Business introduction and reference exchange.',
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        status: r.status ?? 'Sent',
        confidentiality: r.confidentiality ?? 'Participants',
        consentConfirmed: r.consentConfirmed ?? true,
        followUp: r.followUp ?? (r.followUpAt ? new Date(r.followUpAt).toLocaleDateString('en-IN') : undefined),
        version: r.version ? String(r.version) : undefined,
        fromMemberName: r.fromMemberName,
        toMemberName: r.toMemberName,
        businessName: r.businessName,
      } as Reference;
    }).filter((r: Reference) => {
      const isFromMe = r.fromMemberId === memberId || toMemberSlug(r.fromMemberId) === memberId || toGuid(r.fromMemberId).toLowerCase() === myGuid;
      const isToMe = r.toMemberId === memberId || toMemberSlug(r.toMemberId) === memberId || toGuid(r.toMemberId).toLowerCase() === myGuid;

      if (memberFilter) {
        const mfGuid = toGuid(memberFilter).toLowerCase();
        const matchesFrom = r.fromMemberId === memberFilter || toGuid(r.fromMemberId).toLowerCase() === mfGuid;
        const matchesTo = r.toMemberId === memberFilter || toGuid(r.toMemberId).toLowerCase() === mfGuid;
        if (!matchesFrom && !matchesTo) return false;
      }
      if (businessFilter && r.businessId !== businessFilter) return false;
      if (referenceFilter && r.id !== referenceFilter) return false;

      if (tab === 'Given') return isFromMe;
      if (tab === 'Received') return isToMe && r.status !== 'Closed';
      if (tab === 'Action Needed') return isToMe && ['Sent', 'Acknowledged', 'Accepted', 'In Progress'].includes(r.status ?? 'Sent');
      if (tab === 'Closed') return r.status === 'Closed';
      return isFromMe || isToMe;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [rawRefs, memberId, myGuid, tab, memberFilter, businessFilter, referenceFilter]);

  return (
    <div>
      <PageHead
        title="Business References"
        description="Consent-aware business introductions with explicit acknowledgement, acceptance, follow-up and closure."
        actions={<Button onClick={() => go('/app/references/new', { label: 'Business References' })}>Create reference</Button>}
      />
      <section className="mb-5">
        <div className="mb-2">
          <h2 className="font-black text-[var(--navy-950)]">Reference activity</h2>
          <p className="text-sm text-slate-500">Given, received and pending trust-based introductions.</p>
        </div>
        <AnalyticsSummary items={intelligence.relationships.references} onOpen={route => go(route, { label: 'Reference Analytics' })} />
      </section>

      {(memberFilter || businessFilter || referenceFilter) && (
        <Card className="mb-4 bg-sky-50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-sky-900">Filtered to connected activity from the previous page.</span>
            <Button variant="secondary" onClick={() => {
              const copy = new URLSearchParams(params);
              copy.delete('member');
              copy.delete('business');
              copy.delete('reference');
              setParams(copy, { replace: true });
            }}>Clear context filter</Button>
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(['Given', 'Received', 'Action Needed', 'Closed'] as const).map(x => (
          <Button key={x} variant={tab === x ? 'default' : 'secondary'} onClick={() => setTab(x)}>
            {x}
          </Button>
        ))}
      </div>

      {query.loading && !query.page && <QueryLoading label="Loading references…" />}
      {query.error && <QueryError error={query.error} onRetry={query.reload} />}

      <div className="grid gap-4">
        {refs.map(r => {
          const from = n.members.find(m => m.id === r.fromMemberId || toMemberSlug(m.id) === r.fromMemberId);
          const to = n.members.find(m => m.id === r.toMemberId || toMemberSlug(m.id) === r.toMemberId);
          const business = n.businesses.find(b => b.id === r.businessId);
          const status = r.status ?? 'Sent';
          const outcomes = n.transactions.filter(t => t.referenceId === r.id);
          const fromName = (r as any).fromMemberName || from?.name || (r.fromMemberId === 'member-member' ? 'Anand Kumar' : r.fromMemberId === 'member-secretary' ? 'Meera Narayanan' : r.fromMemberId);
          const toName = (r as any).toMemberName || to?.name || (r.toMemberId === 'member-member' ? 'Anand Kumar' : r.toMemberId === 'member-secretary' ? 'Meera Narayanan' : r.toMemberId);
          const businessName = (r as any).businessName || business?.name || 'Business reference';
          const isRecipient = r.toMemberId === memberId || toMemberSlug(r.toMemberId) === memberId || toGuid(r.toMemberId).toLowerCase() === myGuid;

          return (
            <Card key={r.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone={status === 'Closed' ? 'good' : status === 'Declined' ? 'bad' : 'info'}>{status}</StatusPill>
                    <StatusPill>{r.confidentiality ?? 'Participants'}</StatusPill>
                    {r.consentConfirmed && <StatusPill tone="good">Consent confirmed</StatusPill>}
                  </div>
                  <button type="button" className="mt-3 text-left font-black text-sky-800 hover:underline" onClick={() => business && go(`/app/businesses/${business.id}`, { label: 'Business References' })}>
                    {businessName}
                  </button>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{r.text}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1 text-sm text-slate-500">
                    <span>From</span>
                    <button type="button" className="font-bold text-sky-700 hover:underline" onClick={() => from && go(`/app/members/${from.id}`, { label: 'Business References' })}>
                      {fromName}
                    </button>
                    <span>→</span>
                    <button type="button" className="font-bold text-sky-700 hover:underline" onClick={() => to && go(`/app/members/${to.id}`, { label: 'Business References' })}>
                      {toName}
                    </button>
                    <span>· {r.createdAt}</span>
                  </div>
                  {r.followUp && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm">Follow-up: {r.followUp}</p>}
                  {outcomes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => go(`/app/transactions?reference=${r.id}`, { label: 'Business References' })}>
                        {outcomes.length} linked outcome{outcomes.length === 1 ? '' : 's'}
                      </Button>
                    </div>
                  )}
                </div>
                {isRecipient && (
                  <div className="flex flex-wrap gap-2">
                    {canTransitionReference(status, 'Acknowledged') && status !== 'Acknowledged' && (
                      <Button variant="secondary" disabled={command.busy} onClick={() => void changeStatus(r, 'Acknowledged')}>Acknowledge</Button>
                    )}
                    {canTransitionReference(status, 'Accepted') && status !== 'Accepted' && (
                      <Button disabled={command.busy} onClick={() => void changeStatus(r, 'Accepted')}>Accept</Button>
                    )}
                    {canTransitionReference(status, 'Declined') && status !== 'Declined' && (
                      <Button variant="danger" disabled={command.busy} onClick={() => void changeStatus(r, 'Declined')}>Decline</Button>
                    )}
                    {canTransitionReference(status, 'In Progress') && status !== 'In Progress' && (
                      <Button variant="secondary" onClick={() => setFollowUpId(r.id)}>In progress</Button>
                    )}
                    {canTransitionReference(status, 'Closed') && status !== 'Closed' && (
                      <Button variant="secondary" disabled={command.busy} onClick={() => void changeStatus(r, 'Closed')}>Close</Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        {!refs.length && !query.loading && <EmptyState title="No references in this view" body="Reference lifecycle records will appear here." />}
      </div>
      <div className="mt-4 flex justify-between">
        <Button variant="secondary" onClick={query.previous} disabled={!query.canPrevious}>Previous</Button>
        <Button variant="secondary" onClick={query.next} disabled={!query.canNext}>Next</Button>
      </div>
      <div className="mt-5">
        <Tip>Confidential references should never expose private commercial details outside the participants or authorised administrators.</Tip>
      </div>
      <ActionDialog
        open={Boolean(followUpId)}
        title="Move reference to in progress"
        inputLabel="Follow-up note"
        requireValue
        confirmLabel="Save follow-up"
        onClose={() => setFollowUpId(null)}
        onConfirm={followUp => {
          const r = refs.find(x => x.id === followUpId);
          if (r) {
            void changeStatus(r, 'In Progress', followUp);
            setFollowUpId(null);
          }
        }}
      />
    </div>
  );
}

