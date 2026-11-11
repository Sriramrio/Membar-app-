import { useMemo, useState } from 'react';
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
import type { DataQualityFinding } from '@/domain/types';

export default function DataQualityPage() {
  const s = useOrg();
  const cmd = useOrgCommandAction();
  const [active, setActive] = useState<string>();
  const [showModal, setShowModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<DataQualityFinding | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('MEMBER');
  const [newEntityId, setNewEntityId] = useState('');
  const [newSeverity, setNewSeverity] = useState('Medium');
  const [newDesc, setNewDesc] = useState('');

  const req = useMemo(() => ({
    queryId: 'org.data-quality.list',
    organisationScope: s.scope.id,
    pageSize: 50
  }), [s.scope.id]);

  const page = useDomainCursorPage<DataQualityFinding>(req, s.dataQuality);
  useRealtimeRefresh(['org.data-quality.*'], page.reload);

  const rawItems = page.page?.items ?? [];

  // Filter items
  const filteredItems = useMemo(() => {
    return rawItems.filter(r => {
      if (statusFilter !== 'ALL' && (r.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (severityFilter !== 'ALL') {
        const sev = ((r as any).severity || r.category || '').toLowerCase();
        if (sev !== severityFilter.toLowerCase()) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t = (r.title || '').toLowerCase();
        const d = (r.description || '').toLowerCase();
        const et = ((r as any).entityType || r.sourceType || '').toLowerCase();
        const eid = ((r as any).entityId || r.sourceId || '').toLowerCase();
        if (!t.includes(q) && !d.includes(q) && !et.includes(q) && !eid.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [rawItems, statusFilter, severityFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = rawItems.length;
    const openCount = rawItems.filter(x => x.status === 'Open' || x.status === 'Investigating').length;
    const pendingReview = rawItems.filter(x => x.status === 'Correction Proposed' || x.status === 'Corrected').length;
    const closedCount = rawItems.filter(x => x.status === 'Closed' || x.status === 'Verified').length;
    const criticalCount = rawItems.filter(x => ((x as any).severity || x.category || '').toUpperCase() === 'CRITICAL' || ((x as any).severity || x.category || '').toUpperCase() === 'HIGH').length;
    return { total, openCount, pendingReview, closedCount, criticalCount };
  }, [rawItems]);

  const handleTransition = async (r: DataQualityFinding, nextStatus: string, reasonText?: string, resolution?: string) => {
    const payload: Record<string, any> = { status: nextStatus };
    if (resolution) {
      payload.resolution = resolution;
    }
    const result = await cmd.run({
      commandType: nextStatus === 'Corrected' ? 'org.data-quality.correct' : 'org.data-quality.update',
      aggregateType: 'DataQuality',
      aggregateId: r.id,
      expectedVersion: r.version,
      payload,
      reason: reasonText || `Transition data quality finding to ${nextStatus}`
    });
    if (result.ok) {
      setActive(r.id);
      setShowResolutionModal(false);
      setSelectedFinding(null);
      setResolutionText('');
      page.reload();
    }
  };

  const handleOpenResolution = (r: DataQualityFinding) => {
    setSelectedFinding(r);
    setResolutionText('');
    setShowResolutionModal(true);
  };

  const submitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;
    await handleTransition(
      selectedFinding,
      'Corrected',
      'Governed correction applied',
      resolutionText.trim() || 'Verified and corrected through chapter MC data governance'
    );
  };

  const handleCreateFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const result = await cmd.run({
      commandType: 'org.data-quality.report',
      aggregateType: 'DataQuality',
      payload: {
        title: newTitle.trim(),
        entityType: newType,
        entityId: newEntityId.trim(),
        severity: newSeverity,
        description: newDesc.trim()
      },
      reason: 'Report new data-quality finding'
    });

    if (result.ok) {
      setShowModal(false);
      setNewTitle('');
      setNewEntityId('');
      setNewDesc('');
      page.reload();
    }
  };

  const severityBadgeClass = (severity?: string) => {
    const s = (severity || '').toUpperCase();
    if (s === 'CRITICAL') return 'bg-rose-100 text-rose-700 border-rose-300';
    if (s === 'HIGH') return 'bg-amber-100 text-amber-800 border-amber-300';
    if (s === 'MEDIUM') return 'bg-sky-100 text-sky-800 border-sky-300';
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  return (
    <>
      <PageHeader
        title="Data Quality"
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn primary px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold min-h-[40px] transition-colors shadow-2xs inline-flex items-center gap-1.5"
              onClick={() => setShowModal(true)}
              disabled={cmd.busy}
            >
              <span>+</span>
              <span>Report Anomaly</span>
            </button>
          </div>
        }
      >
        Detect, assign, correct through governed commands, revalidate and close. No hidden direct data fixes.
      </PageHeader>

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      {/* KPI Metrics Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Findings</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs font-medium text-slate-500">Live in DB</span>
          </div>
        </div>
        <div className="card p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Active Investigations</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-amber-600">{stats.openCount}</span>
            <span className="text-xs font-medium text-amber-600/80">Open / Investigating</span>
          </div>
        </div>
        <div className="card p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Pending Revalidation</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-blue-600">{stats.pendingReview}</span>
            <span className="text-xs font-medium text-blue-600/80">Proposed / Corrected</span>
          </div>
        </div>
        <div className="card p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Resolved & Closed</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-600">{stats.closedCount}</span>
            <span className="text-xs font-medium text-emerald-600/80">Verified & Audited</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by title, domain, entity ID or description..."
              className="w-full pl-3.5 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium">Severity:</span>
              <select
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={severityFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeverityFilter(e.target.value)}
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Tab Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Filter Status:</span>
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto max-w-full">
            {['ALL', 'Open', 'Investigating', 'Correction Proposed', 'Corrected', 'Verified', 'Closed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showModal && (
        <div className="card p-5 bg-white rounded-xl border border-blue-200 shadow-md mb-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Report Data Anomaly / Discrepancy</h3>
            <button
              className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 py-1"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleCreateFinding} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Title</label>
              <input
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Unreconciled Attendance in Meeting #104"
                value={newTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entity Domain</label>
                <select
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={newType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewType(e.target.value)}
                >
                  <option value="MEMBER">Member Record</option>
                  <option value="ATTENDANCE">Attendance & Meeting</option>
                  <option value="TASK">Task / Action Register</option>
                  <option value="DUES">Dues & Reconciliation</option>
                  <option value="KYT">KYT Session</option>
                  <option value="PROGRAMME">Programme / Initiative</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entity Reference ID (Optional)</label>
                <input
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. meet-104 or mem-042"
                  value={newEntityId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntityId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                <select
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={newSeverity}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewSeverity(e.target.value)}
                >
                  <option value="Low">Low (Informational)</option>
                  <option value="Medium">Medium (Attention Required)</option>
                  <option value="High">High (Impacting Operations)</option>
                  <option value="Critical">Critical (Compliance Violation)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Evidence</label>
              <textarea
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe the discrepancy and what source records are affected..."
                value={newDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDesc(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[40px]"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={cmd.busy || !newTitle.trim()}
                className="btn primary px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold min-h-[40px] disabled:opacity-50"
              >
                Submit Anomaly to Database
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Governed Correction Modal */}
      {showResolutionModal && selectedFinding && (
        <div className="card p-5 bg-white rounded-xl border border-emerald-200 shadow-md mb-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Apply Governed Correction</h3>
              <p className="text-xs text-slate-500 mt-0.5">Finding: {selectedFinding.title}</p>
            </div>
            <button
              className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 py-1"
              onClick={() => { setShowResolutionModal(false); setSelectedFinding(null); }}
            >
              ✕
            </button>
          </div>
          <form onSubmit={submitCorrection} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resolution Summary & Governance Notes
              </label>
              <textarea
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Enter description of what was corrected, verified source document, or MC resolution reference..."
                value={resolutionText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResolutionText(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[40px]"
                onClick={() => { setShowResolutionModal(false); setSelectedFinding(null); }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={cmd.busy || !resolutionText.trim()}
                className="btn primary px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold min-h-[40px] disabled:opacity-50"
              >
                Apply & Save Correction
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Findings List */}
      <AsyncState loading={page.loading} refreshing={page.refreshing} stale={page.stale} error={page.error} onRetry={page.reload}>
        {filteredItems.length ? (
          <div className="list divide-y divide-slate-200/80 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredItems.map((r) => {
              const sev = (r as any).severity || r.category || 'Medium';
              const entity = (r as any).entityType || r.sourceType || 'Domain';
              const entityId = (r as any).entityId || r.sourceId || '';
              return (
                <div className="row flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:p-5 gap-4 hover:bg-slate-50/60 transition-colors" key={r.id}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link className="row-title font-semibold text-slate-900 hover:text-blue-600 transition-colors text-base" to={`/org/data-quality/${r.id}`}>
                        {r.title}
                      </Link>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${severityBadgeClass(sev)}`}>
                        {sev}
                      </span>
                    </div>
                    {r.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                        {r.description}
                      </p>
                    )}
                    <div className="row-meta text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-slate-700">Domain: {entity} {entityId ? `(#${entityId})` : ''}</span>
                      <span>·</span>
                      <span>Scope: {(r as any).scopeName || s.scope.name || 'Chapter'}</span>
                      <span>·</span>
                      <span>Version: {r.version ?? 1}</span>
                    </div>
                  </div>

                  <div className="row-actions flex flex-wrap items-center gap-2 shrink-0">
                    <StatusPill value={r.status} />

                    {/* Governed State Machine Buttons */}
                    {r.status === 'Open' && (
                      <button
                        className="btn px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors min-h-[38px]"
                        disabled={cmd.busy}
                        onClick={() => void handleTransition(r, 'Investigating', 'Open investigation into data discrepancy')}
                      >
                        Investigate
                      </button>
                    )}

                    {r.status === 'Investigating' && (
                      <button
                        className="btn px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold shadow-2xs transition-colors min-h-[38px]"
                        disabled={cmd.busy}
                        onClick={() => void handleTransition(r, 'Correction Proposed', 'Propose governed data correction')}
                      >
                        Propose Correction
                      </button>
                    )}

                    {r.status === 'Correction Proposed' && (
                      <button
                        className="btn primary px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors min-h-[38px]"
                        disabled={cmd.busy}
                        onClick={() => handleOpenResolution(r)}
                      >
                        Apply Correction
                      </button>
                    )}

                    {r.status === 'Corrected' && (
                      <button
                        className="btn px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold shadow-2xs transition-colors min-h-[38px]"
                        disabled={cmd.busy}
                        onClick={() => void handleTransition(r, 'Verified', 'Revalidate and verify data accuracy')}
                      >
                        Revalidate
                      </button>
                    )}

                    {r.status === 'Verified' && (
                      <button
                        className="btn px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors min-h-[38px]"
                        disabled={cmd.busy}
                        onClick={() => void handleTransition(r, 'Closed', 'Close verified data quality finding')}
                      >
                        Close Finding
                      </button>
                    )}

                    {r.status === 'Closed' && (
                      <button
                        className="btn px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-2xs transition-colors min-h-[38px]"
                        disabled={cmd.busy}
                        onClick={() => void handleTransition(r, 'Open', 'Reopen data quality finding')}
                      >
                        Reopen
                      </button>
                    )}

                    <Link
                      to={`/org/data-quality/${r.id}`}
                      className="btn px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium shadow-2xs transition-colors min-h-[38px] inline-flex items-center"
                    >
                      Details
                    </Link>

                    <Link
                      to={`/org/audit?q=${encodeURIComponent(r.id)}`}
                      className="btn px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 text-xs font-medium shadow-2xs transition-colors min-h-[38px] inline-flex items-center"
                      title="View audit trail for this finding"
                    >
                      Audit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No data-quality findings match the selected filters" />
        )}
        <CursorPager canPrevious={page.canPrevious} canNext={page.canNext} onPrevious={page.previous} onNext={page.next} />
      </AsyncState>

      {active && (
        <div className="callout mt-8 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between">
          <div>
            Investigation / correction active for <b>{rawItems.find((x) => x.id === active)?.title ?? active}</b>. All modifications persist to the database and are recorded in the audit trail.
          </div>
          <Link
            to={`/org/audit?q=${encodeURIComponent(active)}`}
            className="text-amber-800 underline font-semibold text-xs ml-4 shrink-0 hover:text-amber-950"
          >
            Inspect Audit Log →
          </Link>
        </div>
      )}
    </>
  );
}
