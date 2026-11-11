import { useMemo, useState, useEffect, type ChangeEvent } from 'react';
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
import { nextOperationalScope } from '@/domain/hierarchy';
import type { SupportRequest } from '@/domain/types';
import { X, ArrowRight, ShieldCheck } from 'lucide-react';
import { authStorage } from '@/utils/authStorage';

function PlusIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function LifeBuoyIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
      <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
    </svg>
  );
}

function LayersIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export default function SupportPage() {
  const s = useOrg();
  const cmd = useOrgCommandAction();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desiredHelp, setDesiredHelp] = useState('');

  const target = useMemo(() => nextOperationalScope(s.scope, s.units), [s.scope, s.units]);
  const req = useMemo(
    () => ({
      queryId: 'org.support-requests.list',
      organisationScope: s.scope.id,
      pageSize: 25
    }),
    [s.scope.id]
  );
  const page = useDomainCursorPage<SupportRequest>(req, s.support);
  useRealtimeRefresh(['org.support-request.*'], page.reload);

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

  const isTrustee = authStorage.isTrustUser();

  const effectiveTarget = useMemo(() => {
    return target || {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Krishnagiri Region',
      level: 'REGION' as const
    };
  }, [target]);

  const request = async () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      requesterScope: s.scope,
      targetScope: effectiveTarget,
      summary: desiredHelp.trim() || 'Operational assistance requested.',
      desiredHelp: desiredHelp.trim()
    };
    const result = await cmd.run(
      {
        commandType: 'org.support-request.create',
        aggregateType: 'SupportRequest',
        payload,
        reason: `Operational support requested from ${effectiveTarget.name}`
      },
      () => s.dispatch({ type: 'ADD_SUPPORT', payload })
    );
    if (result.ok) {
      setTitle('');
      setDesiredHelp('');
      setShowModal(false);
      page.reload();
    }
  };

  return (
    <>
      <PageHeader
        title="Support & Intervention"
        actions={
          isTrustee ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold shadow-xs">
              <ShieldCheck className="size-4 text-amber-600" />
              Trustee Audit Mode (Read-Only)
            </span>
          ) : (
            <button
              type="button"
              className="btn primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b5fa7] hover:bg-[#174f89] !text-white font-bold text-xs shadow-xs transition-all cursor-pointer min-h-[44px]"
              style={{ color: '#ffffff' }}
              onClick={() => setShowModal(true)}
            >
              <PlusIcon className="size-4 text-white" />
              <span style={{ color: '#ffffff' }}>Request Support</span>
            </button>
          )
        }
      >
        Request help from the immediate parent operating level without prematurely creating a formal escalation.
      </PageHeader>

      {isTrustee && (
        <div className="mb-4 px-4 py-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2">
          <ShieldCheck className="size-4 text-amber-700 shrink-0" />
          <span>
            <strong>Trustee Oversight Notice:</strong> You have read-only audit access across all chapter operational support requests. Support requests and interventions are raised by Chapter Leadership.
          </span>
        </div>
      )}

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      {!target && (
        <div className="callout p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-sm mb-6 flex items-start gap-2.5">
          <LifeBuoyIcon className="size-4.5 text-slate-500 mt-0.5 shrink-0" />
          <div>
            Management is the highest operational oversight level. Further protected matters must use the appropriate Governance or Platform Administration handoff rather than a higher operational Support Request.
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
                <LifeBuoyIcon className="size-5 text-[#1b5fa7]" />
                <h3 className="text-base font-bold text-slate-900">Request Operational Support</h3>
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
                  What support is needed?
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regional Chief Guest Attendance for Annual Gala"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                  value={title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Coordination Level
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-medium"
                  value={`${effectiveTarget.name} (${effectiveTarget.level})`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Desired Help / Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="What specific outcome or assistance would resolve the bottleneck?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                  value={desiredHelp}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDesiredHelp(e.target.value)}
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
                disabled={cmd.busy || !title.trim() || !target}
                onClick={() => void request()}
              >
                <span style={{ color: '#ffffff' }}>Submit Request</span>
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
            {page.page.items.map(r => (
              <div
                key={r.id}
                className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[#1b5fa7]"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <LifeBuoyIcon className="size-3.5 text-blue-600" />
                      SUPPORT REQUEST
                    </span>
                  </div>

                  <Link
                    to={`/org/support/${r.id}`}
                    className="font-bold text-slate-900 hover:text-[#1b5fa7] text-base transition-colors block truncate"
                  >
                    {r.title}
                  </Link>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/50">
                      <LayersIcon className="size-3 text-slate-400" />
                      {r.requesterScope?.name ?? 'Chapter Scope'} → {r.targetScope?.name ?? 'Region Scope'}
                    </span>
                    {r.summary && (
                      <span className="text-slate-500 text-xs truncate max-w-md">
                        {r.summary}
                      </span>
                    )}
                  </div>
                </div>

                <div className="row-actions flex items-center gap-2 flex-wrap shrink-0">
                  <StatusPill value={r.status} />
                  <Link
                    to={`/org/support/${r.id}`}
                    className="btn primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1b5fa7] !text-white font-bold text-xs hover:bg-[#174f89] shadow-xs min-h-[38px] transition-all cursor-pointer"
                    style={{ color: '#ffffff' }}
                  >
                    <span style={{ color: '#ffffff' }}>Open details</span>
                    <ArrowRight className="size-3.5 !text-white" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-4">
            <EmptyState
              title="No active support requests"
              body={
                isTrustee
                  ? "No operational support requests are currently active in this chapter scope."
                  : "Request assistance or interventions from parent operational levels to resolve bottlenecks early."
              }
            />
            {!isTrustee && target && (
              <button
                type="button"
                className="btn primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b5fa7] !text-white hover:bg-[#174f89] font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                style={{ color: '#ffffff' }}
                onClick={() => setShowModal(true)}
              >
                <PlusIcon className="size-4 text-white" />
                <span style={{ color: '#ffffff' }}>Request First Support</span>
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
    </>
  );
}
