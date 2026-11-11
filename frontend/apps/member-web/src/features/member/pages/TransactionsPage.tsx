import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/common/Input';
import { ContextBanner, DetailGrid, EnterpriseStatus } from '@/features/member/components/EnterpriseMemberUI';
import { EmptyState, PageHead, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId, primaryRepresentativeMemberIdForBusiness } from '@/features/network/selectors';
import { addInteractionNote, createTransaction, updateTransactionStatus } from '@/features/network/networkSlice';
import { transactionTransitions } from '@/features/network/stateMachines';
import type { Transaction } from '@/features/network/types';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { AnalyticsSummary } from '@/features/member/analytics/AnalyticsSummary';
import { buildPersonalNetworkingAnalytics } from '@/features/member/analytics/networkingAnalytics';
import type { DashboardPeriodKey } from '@/features/member/dashboard/types';
import { inPeriod, resolveDashboardPeriod } from '@/features/member/dashboard/period';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { QueryError, QueryLoading } from '@/components/data/QueryState';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { toGuid } from '@/services/api/guidUtils';
import { stableClientId } from '@/utils/stableId';
import { notesApi } from '@/services/api/notesApi';

const statusTone = (status: Transaction['status']) =>
  status === 'won' || status === 'closed' || status === 'confirmed'
    ? 'success'
    : status === 'lost' || status === 'disputed' || status === 'closed-without-transaction'
    ? 'danger'
    : status === 'correction-requested'
    ? 'warning'
    : 'info';

const money = (v?: number) =>
  v === undefined
    ? 'Not recorded'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function TransactionsPage() {
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const noteCommand = useGovernedCommand();
  const { go } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const n = useNetworkSlice(['affiliations', 'businesses', 'interactionNotes', 'members', 'opportunities', 'references', 'transactions'] as const);
  const [params, setParams] = useSearchParams();
  const [noteTarget, setNoteTarget] = useState<{ transaction: Transaction; targetMemberId: string; businessId: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ counterpartyBusinessId: '', amount: '', notes: '' });

  const statusFilter = params.get('status');
  const activeOnly = statusFilter === 'active';
  const businessFilter = params.get('business');
  const referenceFilter = params.get('reference');
  const opportunityFilter = params.get('opportunity');
  const directionFilter = params.get('direction');
  const periodKey = (params.get('period') ?? 'month') as DashboardPeriodKey;
  const intelligence = useAppSelector(s => buildPersonalNetworkingAnalytics(s, memberId, periodKey));
  const analyticsPeriod = useMemo(() => resolveDashboardPeriod(periodKey), [periodKey]);

  const memberBusinessIds = useMemo(() => {
    const ids = new Set<string>();
    n.affiliations
      .filter(a => (a.memberId === memberId || toGuid(a.memberId) === toGuid(memberId)) && a.active && a.verificationStatus === 'Verified')
      .forEach(a => {
        ids.add(a.businessId);
        ids.add(toGuid(a.businessId).toLowerCase());
      });
    return ids;
  }, [n.affiliations, memberId]);

  const periodFilter = params.get('period') ?? '';
  const localRows = useMemo(() =>
    n.transactions
      .filter(t =>
        t.memberId === memberId ||
        toGuid(t.memberId) === toGuid(memberId) ||
        memberBusinessIds.has(t.buyerBusinessId) ||
        memberBusinessIds.has(t.counterpartyBusinessId) ||
        memberBusinessIds.has(toGuid(t.buyerBusinessId).toLowerCase()) ||
        memberBusinessIds.has(toGuid(t.counterpartyBusinessId).toLowerCase())
      )
      .filter(t => !directionFilter || (directionFilter === 'recorded' ? (t.memberId === memberId || toGuid(t.memberId) === toGuid(memberId)) : (t.memberId !== memberId && toGuid(t.memberId) !== toGuid(memberId))))
      .filter(t => !periodFilter || inPeriod(t.createdAt, analyticsPeriod))
      .filter(t => !statusFilter || (activeOnly ? !['won', 'lost', 'closed', 'closed-without-transaction'].includes(t.status) : t.status === statusFilter))
      .filter(t => !businessFilter || t.buyerBusinessId === businessFilter || t.counterpartyBusinessId === businessFilter || toGuid(t.buyerBusinessId) === toGuid(businessFilter) || toGuid(t.counterpartyBusinessId) === toGuid(businessFilter))
      .filter(t => !referenceFilter || t.referenceId === referenceFilter || toGuid(t.referenceId) === toGuid(referenceFilter))
      .filter(t => !opportunityFilter || t.opportunityId === opportunityFilter || toGuid(t.opportunityId) === toGuid(opportunityFilter))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [n.transactions, memberId, memberBusinessIds, directionFilter, periodFilter, analyticsPeriod, statusFilter, activeOnly, businessFilter, referenceFilter, opportunityFilter]
  );

  const request = useMemo(() => ({
    queryId: 'member.transactions.list',
    domain: 'member' as const,
    pagination: { pageSize: 40 },
    sort: [{ field: 'createdAt', direction: 'desc' as const }],
    parameters: {
      viewerMemberId: memberId,
      status: statusFilter || undefined,
      direction: directionFilter || undefined,
      businessId: businessFilter || undefined,
      referenceId: referenceFilter || undefined,
      opportunityId: opportunityFilter || undefined,
      period: periodFilter || undefined,
    },
  }), [memberId, statusFilter, directionFilter, businessFilter, referenceFilter, opportunityFilter, periodFilter]);

  const query = useDomainCursorPage<Transaction>(request, localRows, [memberId, statusFilter, directionFilter, businessFilter, referenceFilter, opportunityFilter, periodFilter]);
  useRealtimeRefresh(['transaction.*', 'reference.*', 'opportunity.*', 'meeting.*'], query.reload);
  const rows = query.page?.items ?? [];

  const changeStatus = async (t: Transaction, status: Transaction['status']) => {
    await command.execute({
      domain: 'member',
      policyId: 'transaction.status.update',
      command: 'transaction.status.update',
      aggregateType: 'Transaction',
      aggregateId: t.id,
      expectedVersion: t.version,
      payload: { transactionId: t.id, status },
      previewAction: () => dispatch(updateTransactionStatus({ transactionId: t.id, actorMemberId:memberId, status })),
    });
  };

  const handleCreateOutcome = async () => {
    if (!createForm.counterpartyBusinessId || !createForm.amount || Number(createForm.amount) <= 0) return;
    const myBusiness = n.businesses.find(b => memberBusinessIds.has(b.id) || memberBusinessIds.has(toGuid(b.id).toLowerCase())) ?? n.businesses[0];
    const newId = stableClientId('txn');
    const amountVal = Number(createForm.amount);
    const desc = createForm.notes.trim() || 'Recorded business outcome';
    const payload = {
      id: newId,
      buyerBusinessId: myBusiness?.id || 'business-member',
      counterpartyBusinessId: createForm.counterpartyBusinessId,
      amount: amountVal,
      value: amountVal,
      notes: desc,
      description: desc,
      status: 'recorded' as const,
      memberId,
    };
    const result = await command.execute({
      domain: 'member',
      policyId: 'transaction.create',
      command: 'transaction.create',
      aggregateType: 'Transaction',
      aggregateId: newId,
      payload,
      previewAction: () => dispatch(createTransaction({
        memberId,
        buyerBusinessId: payload.buyerBusinessId,
        counterpartyBusinessId: payload.counterpartyBusinessId,
        description: desc,
        value: amountVal,
        status: 'confirmed',
        proofNote: desc,
      })),
    });
    if (result.ok) {
      setCreateOpen(false);
      setCreateForm({ counterpartyBusinessId: '', amount: '', notes: '' });
      query.reload();
    }
  };

  const clearFilters = () => {
    const copy = new URLSearchParams(params);
    ['status', 'business', 'reference', 'opportunity', 'direction', 'period'].forEach(k => copy.delete(k));
    setParams(copy, { replace: true });
  };

  return (
    <div>
      <PageHead
        eyebrow="Relationship value"
        title="Business Outcomes"
        description="Track outcomes generated through relationships, references, meetings and opportunities."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setCreateOpen(true)}>Record Outcome</Button>
            <Button variant="secondary" onClick={() => go('/app/one-to-one?view=completed', { label: 'Business Outcomes' })}>Record from Meeting</Button>
            <Button variant="secondary" onClick={() => go('/app/references?tab=action-needed', { label: 'Business Outcomes' })}>Review References</Button>
          </div>
        }
      />
      <CommandExecutionFeedback error={command.error ?? noteCommand.error} onRetry={() => void (command.error ? command.retry() : noteCommand.retry())} onDismiss={() => { command.clearError(); noteCommand.clearError(); }} />

      <section className="mb-5">
        <div className="mb-2">
          <h2 className="font-black text-[var(--navy-950)]">Outcome activity</h2>
          <p className="text-sm text-slate-500">Recorded, attributed, pending and confirmed business outcomes.</p>
        </div>
        <AnalyticsSummary items={intelligence.business.outcomes} onOpen={route => go(route, { label: 'Business Outcome Analytics' })} />
        {intelligence.business.totalOutcomeValue > 0 && (
          <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
            Confirmed / won value in period: {money(intelligence.business.totalOutcomeValue)}
          </div>
        )}
      </section>

      {(statusFilter || businessFilter || referenceFilter || opportunityFilter) && (
        <div className="mb-5">
          <ContextBanner title="Connected activity filter" action={<Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>}>
            Showing outcomes linked to the business, opportunity or reference you came from.
          </ContextBanner>
        </div>
      )}

      {query.loading && !query.page && <QueryLoading label="Loading business outcomes…" />}
      {query.error && <QueryError error={query.error} onRetry={query.reload} />}

      <div className="grid gap-4">
        {rows.map(t => {
          const buyer = n.businesses.find(b => b.id === t.buyerBusinessId || toGuid(b.id) === t.buyerBusinessId?.toLowerCase());
          const counter = n.businesses.find(b => b.id === t.counterpartyBusinessId || toGuid(b.id) === t.counterpartyBusinessId?.toLowerCase());
          const opportunity = t.opportunityId ? n.opportunities.find(o => o.id === t.opportunityId || toGuid(o.id) === t.opportunityId?.toLowerCase()) : undefined;
          const reference = t.referenceId ? n.references.find(r => r.id === t.referenceId || toGuid(r.id) === t.referenceId?.toLowerCase()) : undefined;
          const next = transactionTransitions[t.status] ?? [];
          const displayDesc = t.description || (t as any).notes || 'Business Transaction';
          const displayVal = t.value ?? (t as any).amount;
          const displayProof = t.proofNote || (t as any).notes || 'No supporting note recorded';

          return (
            <Card key={t.id} className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <EnterpriseStatus status={t.status} tone={statusTone(t.status)} />
                    <EnterpriseStatus status={`Value: ${t.valueVisibility ?? 'participants'}`} tone="neutral" />
                  </div>
                  <h2 className="mt-3 text-xl font-black text-[var(--navy-950)]">{displayDesc}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-slate-600">
                    <button type="button" className="font-bold text-sky-800 hover:underline" onClick={() => buyer && go(`/app/businesses/${buyer.id}`, { label: 'Business Outcomes' })}>
                      {buyer?.name ?? 'Buyer'}
                    </button>
                    <span aria-hidden>↔</span>
                    <button type="button" className="font-bold text-sky-800 hover:underline" onClick={() => counter && go(`/app/businesses/${counter.id}`, { label: 'Business Outcomes' })}>
                      {counter?.name ?? 'Counterparty'}
                    </button>
                  </div>
                  <div className="mt-4">
                    <DetailGrid
                      items={[
                        { label: 'Recorded', value: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : 'Recently' },
                        { label: 'Approximate value', value: money(displayVal) },
                        { label: 'Current stage', value: t.status },
                        { label: 'Evidence / note', value: displayProof },
                      ]}
                    />
                  </div>
                  {t.correctionReason && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-900">
                      <strong>Correction / dispute:</strong> {t.correctionReason}
                    </div>
                  )}
                  {n.interactionNotes.filter(note => (note.authorMemberId === memberId || toGuid(note.authorMemberId) === toGuid(memberId)) && note.contextType==='Transaction' && (note.contextId === t.id || toGuid(note.contextId) === toGuid(t.id))).map(note => (
                    <div key={note.id} className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                      <strong>My transaction note:</strong> {note.text}
                    </div>
                  ))}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {opportunity && (
                      <Button variant="secondary" onClick={() => go(`/app/opportunities/${opportunity.id}`, { label: 'Business Outcomes' })}>
                        Opportunity: {opportunity.title}
                      </Button>
                    )}
                    {reference && (
                      <Button variant="secondary" onClick={() => go(`/app/references?reference=${reference.id}`, { label: 'Business Outcomes' })}>
                        Linked Reference
                      </Button>
                    )}
                    {(() => {
                      const counterpartyBusinessId = memberBusinessIds.has(t.buyerBusinessId) || memberBusinessIds.has(toGuid(t.buyerBusinessId).toLowerCase()) ? t.counterpartyBusinessId : t.buyerBusinessId;
                      const targetMemberId = primaryRepresentativeMemberIdForBusiness(n, counterpartyBusinessId);
                      return targetMemberId && targetMemberId !== memberId ? (
                        <Button variant="secondary" onClick={() => setNoteTarget({ transaction: t, targetMemberId, businessId: counterpartyBusinessId })}>
                          Add transaction note
                        </Button>
                      ) : null;
                    })()}
                  </div>
                </div>
                <div className="w-full xl:w-[320px]">
                  <h3 className="text-base font-black">Record next business stage</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Only valid forward or governed correction transitions are offered.</p>
                  <div className="mt-3 grid gap-2">
                    {next.length ? (
                      next.map(status => (
                        <Button
                          key={status}
                          variant={status === 'won' || status === 'confirmed' ? 'default' : status === 'disputed' ? 'danger' : 'secondary'}
                          disabled={command.busy}
                          onClick={() => void changeStatus(t, status)}
                        >
                          {status === 'won' ? 'Mark Won' : status === 'closed-without-transaction' ? 'Close Without Business' : status === 'correction-requested' ? 'Request Correction' : status === 'disputed' ? 'Dispute' : `Move to ${status.replaceAll('-', ' ')}`}
                        </Button>
                      ))
                    ) : (
                      <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">This outcome is in a final state.</div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {!rows.length && !query.loading && (
          <EmptyState
            title="No recorded business outcomes"
            body="Outcomes created from selected opportunities, completed meetings and trusted references will appear here."
            action={<Button onClick={() => setCreateOpen(true)}>Record an Outcome</Button>}
          />
        )}
      </div>

      <div className="mt-4 flex justify-between">
        <Button variant="secondary" onClick={query.previous} disabled={!query.canPrevious}>Previous</Button>
        <Button variant="secondary" onClick={query.next} disabled={!query.canNext}>Next</Button>
      </div>

      <div className="mt-6">
        <Tip>Commercial value visibility is separate from workflow stage. Confirmation, evidence and correction handling should follow the authority rules defined for the relationship.</Tip>
      </div>

      {createOpen && (
        <Card className="mt-5 p-5 sm:p-6 border-sky-300 bg-sky-50/20">
          <h3 className="text-lg font-black text-[var(--navy-950)]">Record Business Outcome</h3>
          <p className="mt-1 text-sm text-slate-600">Enter commercial outcome details with a network counterparty.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-bold">
              Counterparty Business
              <select
                className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"
                value={createForm.counterpartyBusinessId}
                onChange={e => setCreateForm({ ...createForm, counterpartyBusinessId: e.target.value })}
              >
                <option value="">Select counterparty business</option>
                {n.businesses.filter(b => !memberBusinessIds.has(b.id)).map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                ))}
              </select>
            </label>
            <Input
              type="number"
              label="Approximate Value (INR)"
              placeholder="e.g. 50000"
              value={createForm.amount}
              onChange={e => setCreateForm({ ...createForm, amount: e.target.value })}
            />
          </div>
          <div className="mt-4">
            <Input
              label="Description / Slip Notes"
              placeholder="e.g. Purchase order completed for precision machined parts"
              value={createForm.notes}
              onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
            />
          </div>
          <div className="mt-5 flex gap-2">
            <Button disabled={command.busy || !createForm.counterpartyBusinessId || !createForm.amount} onClick={() => void handleCreateOutcome()}>
              {command.busy ? 'Saving…' : 'Save Outcome Slip'}
            </Button>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {noteTarget && (
        <ActionDialog
          open
          title="Add transaction note"
          description="This private note remains separate from proof/evidence and stays linked to this business outcome."
          inputLabel="Transaction note"
          requireValue
          confirmLabel="Save note"
          onClose={() => setNoteTarget(null)}
          onConfirm={async text => {
            const payload = {
              authorMemberId: memberId,
              targetMemberId: noteTarget.targetMemberId,
              businessId: noteTarget.businessId,
              contextType:'Transaction' as const,
              contextId: noteTarget.transaction.id,
              noteType: 'Transaction' as const,
              text,
              visibility: 'Private' as const,
            };
            try {
              // Authoritative backend notes persistence (TX-06, NOTE-01)
              await notesApi.createNote('Transaction', noteTarget.transaction.id, text);
              dispatch(addInteractionNote(payload));
              return true;
            } catch {
              const result = await noteCommand.execute({
                domain: 'member',
                policyId: 'member.interaction-note.create',
                command: 'member.interaction-note.create',
                aggregateType: 'MemberInteractionNote',
                aggregateId: `note-${noteTarget.transaction.id}-${memberId}`,
                payload,
                previewAction: () => dispatch(addInteractionNote(payload)),
              });
              return result.ok;
            }
          }}
        />
      )}
    </div>
  );
}
