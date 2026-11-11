import { Link } from 'react-router-dom';
import { useMemo, useState, type ChangeEvent } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  X, 
  CheckSquare, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
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
import { stableId } from '@/utils/ids';
import { businessDateOnly } from '@/utils/businessDate';
import type { Approval } from '@/domain/types';

type StatusTab = 'ALL' | 'PENDING' | 'APPROVED' | 'RETURNED' | 'REJECTED';
type RiskFilter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';

export default function ApprovalsPage() {
  const s = useOrg();
  const cmd = useOrgCommandAction();

  // Filters & Search
  const [tab, setTab] = useState<StatusTab>('PENDING');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');
  const [search, setSearch] = useState('');

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState<{
    approval: Approval;
    targetStatus: 'RETURNED' | 'REJECTED';
  } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionError, setDecisionError] = useState('');

  // Create Approval Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newRequester, setNewRequester] = useState(s.actor.name || 'Chapter Officer');
  const [newSourceType, setNewSourceType] = useState('FINANCIAL_BUDGET');
  const [newRisk, setNewRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newDue, setNewDue] = useState(businessDateOnly(7));
  const [createError, setCreateError] = useState('');

  // Backend query specification
  const req = useMemo(() => ({
    queryId: 'org.approvals.list',
    organisationScope: s.scope.id,
    pageSize: 50
  }), [s.scope.id]);

  const page = useDomainCursorPage<Approval>(req, s.approvals);
  useRealtimeRefresh(['org.approval.*'], page.reload);

  // All available approvals (from server page or fallback)
  const allItems = page.page?.items ?? s.approvals;

  // Filtered list
  const filteredItems = useMemo(() => {
    return allItems.filter((a) => {
      // 1. Status Tab filter
      const aStatus = (a.status || 'PENDING').toUpperCase();
      if (tab !== 'ALL' && aStatus !== tab) {
        return false;
      }
      // 2. Risk filter
      const aRisk = (a.risk || a.priority || 'LOW').toUpperCase();
      if (riskFilter !== 'ALL' && aRisk !== riskFilter) {
        return false;
      }
      // 3. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesSubject = (a.subject || '').toLowerCase().includes(q);
        const matchesRequester = (a.requester || '').toLowerCase().includes(q);
        const matchesSourceType = (a.sourceType || a.itemType || '').toLowerCase().includes(q);
        if (!matchesSubject && !matchesRequester && !matchesSourceType) {
          return false;
        }
      }
      return true;
    });
  }, [allItems, tab, riskFilter, search]);

  // Metric counts
  const metrics = useMemo(() => {
    const pending = allItems.filter((a) => (a.status || 'PENDING').toUpperCase() === 'PENDING').length;
    const approved = allItems.filter((a) => (a.status || '').toUpperCase() === 'APPROVED').length;
    const returned = allItems.filter((a) => (a.status || '').toUpperCase() === 'RETURNED').length;
    const rejected = allItems.filter((a) => (a.status || '').toUpperCase() === 'REJECTED').length;
    const highRisk = allItems.filter((a) => (a.status || 'PENDING').toUpperCase() === 'PENDING' && (a.risk || a.priority || '').toUpperCase() === 'HIGH').length;
    return {
      all: allItems.length,
      pending,
      approved,
      returned,
      rejected,
      highRisk
    };
  }, [allItems]);

  // Handle Quick Approve
  const handleApprove = async (approval: Approval) => {
    const res = await cmd.run(
      {
        commandType: 'org.approval.decide',
        aggregateType: 'Approval',
        aggregateId: approval.id,
        expectedVersion: approval.version,
        payload: { status: 'APPROVED', decision: 'APPROVED' },
        reason: 'Operational approval approved'
      },
      () => s.dispatch({ type: 'APPROVAL', payload: { id: approval.id, status: 'APPROVED' } })
    );
    if (res.ok) {
      page.reload();
    }
  };

  // Open Decision Modal for Return or Reject
  const openDecisionModal = (approval: Approval, targetStatus: 'RETURNED' | 'REJECTED') => {
    setDecisionModal({ approval, targetStatus });
    setDecisionReason('');
    setDecisionError('');
  };

  // Submit Decision from Modal
  const submitDecisionModal = async () => {
    if (!decisionModal) return;
    if (!decisionReason.trim()) {
      setDecisionError('Please enter remarks or reasons for this governance decision.');
      return;
    }

    const { approval, targetStatus } = decisionModal;
    const res = await cmd.run(
      {
        commandType: 'org.approval.decide',
        aggregateType: 'Approval',
        aggregateId: approval.id,
        expectedVersion: approval.version,
        payload: { 
          status: targetStatus, 
          decision: targetStatus,
          reason: decisionReason.trim()
        },
        reason: `Operational approval ${targetStatus.toLowerCase()}: ${decisionReason.trim()}`
      },
      () => s.dispatch({ 
        type: 'APPROVAL', 
        payload: { 
          id: approval.id, 
          status: targetStatus, 
          reason: decisionReason.trim() 
        } 
      })
    );

    if (res.ok) {
      setDecisionModal(null);
      setDecisionReason('');
      setDecisionError('');
      page.reload();
    }
  };

  // Submit New Approval Request
  const handleCreateApproval = async () => {
    if (!newSubject.trim()) {
      setCreateError('Subject / Title is required.');
      return;
    }

    const approvalId = stableId('ap');
    const newApproval: Approval = {
      id: approvalId,
      subject: newSubject.trim(),
      requester: newRequester.trim() || 'Officer',
      sourceType: newSourceType,
      sourceId: stableId('src'),
      due: newDue,
      status: 'PENDING',
      risk: newRisk,
      scope: s.scope,
      version: 1
    };

    const res = await cmd.run(
      {
        commandType: 'org.approval.create',
        aggregateType: 'Approval',
        aggregateId: approvalId,
        expectedVersion: 1,
        payload: {
          subject: newApproval.subject,
          requester: newApproval.requester,
          sourceType: newApproval.sourceType,
          sourceId: newApproval.sourceId,
          due: newApproval.due,
          risk: newApproval.risk
        },
        reason: `Request operational approval for ${newApproval.subject}`
      },
      () => s.dispatch({ type: 'ADD_APPROVAL', payload: newApproval })
    );

    if (res.ok) {
      setIsCreateOpen(false);
      setNewSubject('');
      setCreateError('');
      page.reload();
    }
  };

  return (
    <>
      <PageHeader 
        title="Operational Approvals"
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn primary px-4 py-2 rounded-lg bg-[#1b5fa7] hover:bg-[#174f89] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all min-h-[40px]"
          >
            <span className="text-base font-bold leading-none mr-0.5">+</span> Request Approval
          </button>
        }
      >
        Approve, review, or return governance requests within your operating authority. Full audit compliance maintained.
      </PageHeader>

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div 
          onClick={() => { setTab('PENDING'); setRiskFilter('ALL'); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            tab === 'PENDING' 
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40 shadow-sm' 
              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Pending Actions</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.pending}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">Awaiting your decision</div>
        </div>

        <div 
          onClick={() => { setTab('PENDING'); setRiskFilter('HIGH'); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            tab === 'PENDING' && riskFilter === 'HIGH'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/40 shadow-sm' 
              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">High Risk Pending</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.highRisk}</div>
          <div className="text-[11px] text-rose-700 font-medium mt-0.5">Requires priority review</div>
        </div>

        <div 
          onClick={() => { setTab('APPROVED'); setRiskFilter('ALL'); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            tab === 'APPROVED' 
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/40 shadow-sm' 
              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.approved}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Granted approvals</div>
        </div>

        <div 
          onClick={() => { setTab('RETURNED'); setRiskFilter('ALL'); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            tab === 'RETURNED' || tab === 'REJECTED'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400/40 shadow-sm' 
              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Returned / Rejected</span>
            <ArrowRight className="w-4 h-4 text-indigo-600 rotate-180" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.returned + metrics.rejected}</div>
          <div className="text-[11px] text-indigo-700 font-medium mt-0.5">Rework or rejected</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'PENDING', 'APPROVED', 'RETURNED', 'REJECTED'] as const).map((t) => {
            const count = 
              t === 'ALL' ? metrics.all :
              t === 'PENDING' ? metrics.pending :
              t === 'APPROVED' ? metrics.approved :
              t === 'RETURNED' ? metrics.returned : metrics.rejected;
            const active = tab === t;

            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
                  active 
                    ? 'bg-[#1b5fa7] text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Risk Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search approvals..."
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={riskFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setRiskFilter(e.target.value as RiskFilter)}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      <AsyncState loading={page.loading} refreshing={page.refreshing} stale={page.stale} error={page.error} onRetry={page.reload}>
        {filteredItems.length ? (
          <div className="list space-y-3">
            {filteredItems.map((a) => {
              const statusUpper = (a.status || 'PENDING').toUpperCase();
              const isPending = statusUpper === 'PENDING';
              const riskVal = a.risk || a.priority || 'LOW';
              const riskUpper = riskVal.toUpperCase();
              const riskColor = 
                riskUpper === 'HIGH' 
                  ? 'bg-rose-100 text-rose-800 border-rose-200' 
                  : riskUpper === 'MEDIUM' 
                  ? 'bg-amber-100 text-amber-800 border-amber-200' 
                  : 'bg-slate-100 text-slate-700 border-slate-200';
              const sourceTypeDisplay = (a.sourceType || a.itemType || 'OPERATIONAL').replaceAll('_', ' ');

              return (
                <div 
                  key={a.id}
                  className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link 
                        to={`/org/approvals/${a.id}`} 
                        className="font-bold text-sm text-slate-900 hover:text-[#1b5fa7] transition-colors truncate max-w-md"
                      >
                        {a.subject || 'Approval Request'}
                      </Link>
                      <StatusPill value={a.status || 'PENDING'} />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskColor}`}>
                        {riskVal} Risk
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <span>Requester: <b className="text-slate-700">{a.requester || 'Officer'}</b></span>
                      <span>·</span>
                      <span>Type: <b className="text-slate-700">{sourceTypeDisplay}</b></span>
                      {a.due && (
                        <>
                          <span>·</span>
                          <span>Due: <b className="text-slate-700">{a.due}</b></span>
                        </>
                      )}
                    </div>

                    {/* Remarks / Decision Reason */}
                    {a.decisionReason && (
                      <div className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 inline-block">
                        <b>Remarks:</b> {a.decisionReason}
                      </div>
                    )}

                    {a.decidedBy && (
                      <div className="text-[11px] text-slate-400">
                        Decided by {a.decidedBy} {a.decidedAt ? `on ${new Date(a.decidedAt).toLocaleDateString()}` : ''}
                      </div>
                    )}
                  </div>

                  {/* Actions for Pending Requests */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {isPending ? (
                      <>
                        <button
                          disabled={cmd.busy}
                          onClick={() => openDecisionModal(a, 'RETURNED')}
                          className="btn px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 min-h-[40px] transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Return
                        </button>
                        <button
                          disabled={cmd.busy}
                          onClick={() => openDecisionModal(a, 'REJECTED')}
                          className="btn danger px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 min-h-[40px] transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          disabled={cmd.busy}
                          onClick={() => void handleApprove(a)}
                          className="btn primary px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs min-h-[40px] transition-colors disabled:opacity-50 inline-flex items-center gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                      </>
                    ) : (
                      <Link
                        to={`/org/approvals/${a.id}`}
                        className="btn px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 min-h-[40px] inline-flex items-center"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            title={
              search 
                ? `No approvals found matching "${search}"` 
                : tab === 'PENDING' 
                ? 'No pending approvals requiring action' 
                : 'No approvals found for selected filter'
            }
          />
        )}

        <CursorPager 
          canPrevious={page.canPrevious} 
          canNext={page.canNext} 
          onPrevious={page.previous} 
          onNext={page.next} 
          totalEstimate={filteredItems.length}
        />
      </AsyncState>

      {/* Decision Remarks Modal for Return / Reject */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-5 h-5 ${
                  decisionModal.targetStatus === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'
                }`} />
                <h3 className="text-base font-bold text-slate-900">
                  {decisionModal.targetStatus === 'REJECTED' ? 'Reject Approval Request' : 'Return Request for Revisions'}
                </h3>
              </div>
              <button 
                onClick={() => setDecisionModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-2">
              Subject: <b className="text-slate-800">{decisionModal.approval.subject}</b>
            </p>
            <p className="text-xs text-slate-500 mb-4">
              {decisionModal.targetStatus === 'REJECTED' 
                ? 'State the governance or policy reasons why this request cannot be approved.' 
                : 'State what changes, attachments, or clarifications are required before resubmission.'}
            </p>

            {decisionError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {decisionError}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Decision Remarks / Reason (Required):
              </label>
              <textarea
                rows={3}
                value={decisionReason}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { setDecisionReason(e.target.value); setDecisionError(''); }}
                placeholder="Enter mandatory reason for governance records..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="btn px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={cmd.busy}
                onClick={() => void submitDecisionModal()}
                className={`btn px-4 py-2 rounded-lg text-white font-bold text-xs min-h-[40px] inline-flex items-center gap-1.5 ${
                  decisionModal.targetStatus === 'REJECTED'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Confirm {decisionModal.targetStatus === 'REJECTED' ? 'Rejection' : 'Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Approval Request Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#1b5fa7]" />
                <h3 className="text-base font-bold text-slate-900">Request Operational Approval</h3>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {createError}
              </div>
            )}

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Matter *</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewSubject(e.target.value)}
                  placeholder="e.g. Q4 Regional Conclave Venue Budget"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requester</label>
                  <input
                    type="text"
                    value={newRequester}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewRequester(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Source Category</label>
                  <select
                    value={newSourceType}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewSourceType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="FINANCIAL_BUDGET">Financial Budget</option>
                    <option value="EXPENSE">Expense Disbursement</option>
                    <option value="MEMBERSHIP">Membership Decision</option>
                    <option value="MOM">Minutes of Meeting (MoM)</option>
                    <option value="EVENT">Event Sanction</option>
                    <option value="OTHER">Other Operational</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Assessment</label>
                  <select
                    value={newRisk}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewRisk(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="LOW">Low Risk</option>
                    <option value="MEDIUM">Medium Risk</option>
                    <option value="HIGH">High Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewDue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="btn px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={cmd.busy}
                onClick={() => void handleCreateApproval()}
                className="btn primary px-4 py-2 rounded-lg bg-[#1b5fa7] hover:bg-[#174f89] text-white font-bold text-xs min-h-[40px] inline-flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" /> Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
