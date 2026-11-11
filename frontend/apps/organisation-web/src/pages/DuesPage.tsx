import {useMemo, useState} from 'react';
import {PageHeader} from '@/components/PageHeader';
import {StatusPill} from '@/components/StatusPill';
import {CommandFeedback} from '@/components/CommandFeedback';
import {AsyncState} from '@/components/AsyncState';
import {CursorPager} from '@/components/CursorPager';
import {EmptyState} from '@/components/EmptyState';
import {useOrg} from '@/state/OrgStore';
import {useOrgCommandAction} from '@/hooks/useOrgCommandAction';
import {useDomainCursorPage} from '@/hooks/useDomainCursorPage';
import {useRealtimeRefresh} from '@/hooks/useRealtimeRefresh';
import type {MemberDuesRow} from '@/domain/types';
import {useRouteView} from '@/config/routeViews';
import {authStorage} from '@/utils/authStorage';
import {Lock, ShieldCheck} from 'lucide-react';

function isPaidOrMatched(status?: string): boolean {
  const s = (status || '').toLowerCase();
  return s === 'paid' || s === 'matched' || s === 'closed' || s === 'reconciled';
}

export default function DuesPage() {
  const s = useOrg();
  const isLeadership = authStorage.isLeadershipTeam();
  const isTrust = authStorage.isTrustUser();
  const isReadOnly = isLeadership || isTrust;
  const view = useRouteView('Membership Dues / Treasurer Operations', 'Operational reconciliation visibility—not an accounting ledger.');
  const cmd = useOrgCommandAction();
  const [viewed, setViewed] = useState<MemberDuesRow | undefined>();
  const [reconciledIds, setReconciledIds] = useState<Set<string>>(new Set());

  const local = useMemo<MemberDuesRow[]>(
    () =>
      s.members.map(m => ({
        id: `dues:${m.id}`,
        memberId: m.id,
        memberName: m.name,
        business: m.business,
        membershipTerm: m.membershipTerm ?? '2026-2027 Annual',
        status: m.duesStatus,
        paymentReferenceMasked: `TXN-2026-06-${m.id.replace(/\D/g, '') || '9421'}`,
        version: 1
      })),
    [s.members]
  );

  const req = useMemo(
    () => ({
      queryId: 'org.member-dues.list' as const,
      organisationScope: s.scope.id,
      pageSize: 25
    }),
    [s.scope.id]
  );

  const page = useDomainCursorPage<MemberDuesRow>(req, local);
  useRealtimeRefresh(['org.dues.*', 'org.member.*'], page.reload);

  const rows = (page.page?.items ?? []).filter(
    r => view.path !== '/org/payment-exceptions' || !isPaidOrMatched(r.status)
  );

  const reconcile = async (row: MemberDuesRow) => {
    if (isReadOnly) return;
    const result = await cmd.run(
      {
        commandType: 'org.dues.reconcile',
        aggregateType: 'MemberDues',
        aggregateId: row.id,
        expectedVersion: row.version,
        payload: {memberId: row.memberId, status: row.status},
        reason: 'Start dues reconciliation'
      },
      () => s.dispatch({type: 'DUES_RECONCILE', payload: {memberId: row.memberId}})
    );
    if (result.ok) {
      setReconciledIds(prev => new Set(prev).add(row.id).add(row.memberId));
      page.reload();
    }
  };

  return (
    <>
      <PageHeader title={view.title}>{view.description}</PageHeader>

      {isLeadership && (
        <div className="callout p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs mb-6 flex items-center gap-3 shadow-2xs">
          <ShieldCheck className="size-5 text-indigo-600 shrink-0" />
          <span>
            <strong>Leadership Team Read-Only Mode:</strong> Financial dues reconciliation and exception approvals are governed by Chapter Treasurers. You have full audit visibility across all chapters.
          </span>
        </div>
      )}

      <div className="callout warn-callout p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-6 flex items-center justify-between gap-3 shadow-2xs">
        <span className="flex items-center gap-2">
          <span>🛡️</span>
          <span>Sensitive finance fields require field-level permission. The backend/finance subsystem remains authoritative.</span>
        </span>
      </div>

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      <AsyncState loading={page.loading} refreshing={page.refreshing} stale={page.stale} error={page.error} onRetry={page.reload}>
        {rows.length ? (
          <div className="list mt-4 divide-y divide-slate-200/80 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            {rows.map(row => {
              const rowStatus = reconciledIds.has(row.id) || reconciledIds.has(row.memberId) ? 'Matched' : row.status;
              const isSettled = isPaidOrMatched(rowStatus);

              return (
                <div
                  className="row flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 hover:bg-slate-50/60 transition-colors"
                  key={row.id}
                >
                  <div>
                    <div className="row-title font-semibold text-slate-900 text-base">{row.memberName}</div>
                    <div className="row-meta text-xs text-slate-500 mt-1">
                      {row.membershipTerm || '2026-2027 Annual'}
                      {row.business ? ` · ${row.business}` : ''}
                    </div>
                  </div>

                  <div className="row-actions flex flex-wrap items-center gap-2">
                    <StatusPill value={rowStatus} />

                    <button
                      className="btn px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors min-h-[40px] inline-flex items-center gap-1.5"
                      onClick={() => setViewed({...row, status: rowStatus})}
                    >
                      <span>📄</span>
                      <span>Payment reference</span>
                    </button>

                    {!isSettled ? (
                      isReadOnly ? (
                        <button
                          className="btn px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-400 text-xs font-semibold shadow-2xs min-h-[40px] inline-flex items-center gap-1.5 cursor-not-allowed"
                          disabled
                          title="Read only: Financial dues reconciliation requires Artha Dhara (Parivar Treasurer) authority"
                        >
                          <Lock size={12} />
                          <span>Reconciliation (Treasurer Only)</span>
                        </button>
                      ) : (
                        <button
                          className="btn primary px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors min-h-[40px] inline-flex items-center gap-1.5"
                          disabled={cmd.busy}
                          onClick={() => void reconcile(row)}
                        >
                          <span>⚡</span>
                          <span>Start reconciliation</span>
                        </button>
                      )
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 inline-flex items-center gap-1">
                        ✓ Reconciled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title={view.path === '/org/payment-exceptions' ? 'No payment exceptions in this scope' : 'No dues records in this scope'} />
        )}

        <CursorPager canPrevious={page.canPrevious} canNext={page.canNext} onPrevious={page.previous} onNext={page.next} totalEstimate={page.page?.totalEstimate} />
      </AsyncState>

      {/* Interactive Payment Reference Modal */}
      {viewed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setViewed(undefined)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Payment Reference</h3>
                <p className="text-xs text-slate-500 mt-0.5">{viewed.memberName} · {viewed.business || 'Chapter Member'}</p>
              </div>
              <button
                onClick={() => setViewed(undefined)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600">Reference / UTR:</span>
                <span className="text-xs font-mono font-bold text-blue-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 select-all">
                  {viewed.paymentReferenceMasked || `TXN-2026-06-${viewed.memberId.replace(/\D/g, '') || '9421'}`}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600">Amount:</span>
                <span className="text-xs font-bold text-emerald-700 font-mono text-sm">₹15,000.00</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600">Membership Term:</span>
                <span className="text-xs font-medium text-slate-700">{viewed.membershipTerm || '2026-2027 Annual'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600">Current Status:</span>
                <StatusPill value={viewed.status} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {!isPaidOrMatched(viewed.status) ? (
                <button
                  className="btn primary px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold min-h-[38px] shadow-2xs inline-flex items-center gap-1.5"
                  disabled={cmd.busy}
                  onClick={async () => {
                    await reconcile(viewed);
                    setViewed(undefined);
                  }}
                >
                  <span>⚡</span> Reconcile This Payment
                </button>
              ) : (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  ✓ Payment verified and matched
                </span>
              )}
              <button
                onClick={() => setViewed(undefined)}
                className="btn px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg min-h-[38px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
