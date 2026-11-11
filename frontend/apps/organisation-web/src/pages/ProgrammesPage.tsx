import { useMemo, useState, useEffect, type ChangeEvent } from 'react';
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
import type { Programme } from '@/domain/types';
import { useRouteView } from '@/config/routeViews';
import { X, ArrowRight, AlertTriangle, User, CalendarDays, CheckCircle2, Clock, ShieldCheck, Trash2 } from 'lucide-react';
import { authStorage } from '@/utils/authStorage';

function EditIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function PlusIcon({ className = 'size-4', stroke = 'currentColor' }: { className?: string; stroke?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function LayersIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l10.5 5.25L21.75 12l-4.179-2.25m-11.142 4.5L2.25 16.5l10.5 5.25 9-4.5-4.179-2.25M12 3.75 2.25 9l9.75 5.25 9.75-5.25-9.75-5.25Z" />
    </svg>
  );
}

export default function ProgrammesPage() {
  const view = useRouteView(
    'Programmes',
    'Purpose, owners, milestones, tasks, risks, measures and outcomes without unnecessary project-management overhead.'
  );
  const s = useOrg();
  const cmd = useOrgCommandAction();
  const isTrust = authStorage.isTrustUser();
  const isProjectView = view.path === '/org/projects';

  // Modal dialog state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'PROGRAMME' | 'PROJECT'>(isProjectView ? 'PROJECT' : 'PROGRAMME');
  const [owner, setOwner] = useState(s.actor.name);
  const [sponsor, setSponsor] = useState('Executive Committee');
  const [nextMilestone, setNextMilestone] = useState('');
  const [progress, setProgress] = useState(0);
  const [risk, setRisk] = useState('LOW');

  // Edit Modal State
  const [editingProg, setEditingProg] = useState<(Programme & { category?: string }) | null>(null);
  const [editName, setEditName] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editSponsor, setEditSponsor] = useState('');
  const [editNextMilestone, setEditNextMilestone] = useState('');
  const [editProgress, setEditProgress] = useState(0);
  const [editRisk, setEditRisk] = useState('LOW');
  const [editStatus, setEditStatus] = useState('Active');

  const openEditModal = (p: Programme & { category?: string }) => {
    setEditingProg(p);
    setEditName(p.name || '');
    setEditOwner(p.owner || '');
    setEditSponsor(p.sponsor || '');
    setEditNextMilestone(p.nextMilestone || '');
    setEditProgress(p.progress || 0);
    setEditRisk(p.risk || 'LOW');
    setEditStatus(p.status || 'Active');
  };

  const saveEditProgramme = async () => {
    if (!editingProg || !editName.trim()) return;
    const result = await cmd.run({
      commandType: 'org.programme.update',
      aggregateType: 'Programme',
      aggregateId: editingProg.id,
      expectedVersion: editingProg.version,
      payload: {
        name: editName.trim(),
        owner: editOwner.trim(),
        sponsor: editSponsor.trim(),
        nextMilestone: editNextMilestone.trim(),
        progress: Number(editProgress) || 0,
        risk: editRisk,
        status: editStatus,
      },
      reason: `Update ${editingProg.category?.toLowerCase() || 'programme'}: ${editName.trim()}`,
    });
    if (result.ok) {
      setEditingProg(null);
      page.reload();
    }
  };

  const deleteProgramme = async (p: Programme & { category?: string }) => {
    const itemType = p.category === 'PROJECT' ? 'project' : 'programme';
    if (!window.confirm(`Are you sure you want to permanently delete "${p.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/organisational/operations/programmes/${p.id}`, { method: 'DELETE' });
      if (res.ok) {
        page.reload();
        return;
      }
    } catch {
      // fallback to domain command
    }

    await cmd.run({
      commandType: 'org.programme.delete',
      aggregateType: 'Programme',
      aggregateId: p.id,
      payload: {},
      reason: `Delete ${itemType}: ${p.name}`,
    });
    page.reload();
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const req = useMemo(
    () => ({
      queryId: 'org.programmes.list',
      organisationScope: s.scope.id,
      pageSize: 25,
    }),
    [s.scope.id]
  );

  const page = useDomainCursorPage<Programme & { category?: string }>(req, s.programmes as any);
  useRealtimeRefresh(['org.programme.*', 'org.project.*'], page.reload);

  const createProgramme = async () => {
    if (!name.trim()) return;
    const result = await cmd.run({
      commandType: 'org.programme.create',
      aggregateType: 'Programme',
      payload: {
        name: name.trim(),
        category,
        owner: owner.trim(),
        sponsor: sponsor.trim(),
        nextMilestone: nextMilestone.trim() || 'Initial project scope defined',
        progress: Number(progress) || 0,
        risk,
      },
      reason: `Create ${category.toLowerCase()}: ${name.trim()}`,
    });

    if (result.ok) {
      setName('');
      setNextMilestone('');
      setProgress(0);
      setShowModal(false);
      page.reload();
    }
  };

  const update = async (p: Programme, status: string) => {
    const result = await cmd.run({
      commandType: 'org.programme.update',
      aggregateType: 'Programme',
      aggregateId: p.id,
      expectedVersion: p.version,
      payload: { status },
      reason: `Programme status to ${status}`,
    });
    if (result.ok) page.reload();
  };

  const items = useMemo(() => {
    const all = page.page?.items || [];
    if (isProjectView) {
      const projects = all.filter(p => p.category === 'PROJECT');
      return projects.length > 0 ? projects : all;
    }
    return all;
  }, [page.page?.items, isProjectView]);

  return (
    <>
      <PageHeader
        title={view.title}
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
              onClick={() => {
                setCategory(isProjectView ? 'PROJECT' : 'PROGRAMME');
                setShowModal(true);
              }}
            >
              <PlusIcon className="size-4 text-white" stroke="#ffffff" />
              <span style={{ color: '#ffffff' }}>New {isProjectView ? 'Project' : 'Programme'}</span>
            </button>
          )
        }
      >
        {view.description}
      </PageHeader>

      {isTrust && (
        <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3 text-xs shadow-2xs">
          <ShieldCheck className="size-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold">Trustee Read-Only Oversight: </span>
            <span>You have audit access to all chapter projects and strategic programmes. Project scheduling, milestone tracking, and task ownership are governed exclusively by Parivar Leadership.</span>
          </div>
        </div>
      )}

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      {/* Creation Modal Dialog */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          onClick={(e: any) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-scale-up"
            onClick={(e: any) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-[#1b5fa7]/10 text-[#1b5fa7] flex items-center justify-center">
                  <LayersIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Create New {category === 'PROJECT' ? 'Special Project' : 'Programme'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define milestones, governance scope, and accountability.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {category === 'PROJECT' ? 'Project Name' : 'Programme Name'} *
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                  placeholder={
                    category === 'PROJECT'
                      ? 'e.g. Annual Conclave & Trade Expo 2026'
                      : 'e.g. Member Growth & Referral Drive'
                  }
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                    value={category}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as any)}
                  >
                    <option value="PROGRAMME">Programme</option>
                    <option value="PROJECT">Special Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Risk Assessment
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                    value={risk}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setRisk(e.target.value)}
                  >
                    <option value="LOW">Low Risk</option>
                    <option value="MEDIUM">Medium Risk</option>
                    <option value="HIGH">High Risk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Accountable Owner
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                    value={owner}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOwner(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sponsor / Champion
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                    value={sponsor}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSponsor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Target Milestone
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                  placeholder="e.g. Venue confirmation & committee appointments"
                  value={nextMilestone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNextMilestone(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Current Progress (%)
                  </label>
                  <span className="text-xs font-bold text-[#1b5fa7]">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="w-full accent-[#1b5fa7] cursor-pointer"
                  value={progress}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setProgress(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b5fa7] !text-white hover:bg-[#174f89] font-bold text-xs min-h-[42px] transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
                style={{ color: '#ffffff' }}
                disabled={cmd.busy || !name.trim()}
                onClick={() => void createProgramme()}
              >
                {cmd.busy ? (
                  <span>Saving...</span>
                ) : (
                  <span style={{ color: '#ffffff' }}>Save {category === 'PROJECT' ? 'Project' : 'Programme'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Programme / Project Modal */}
      {editingProg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          onClick={(e: any) => {
            if (e.target === e.currentTarget) setEditingProg(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-scale-up"
            onClick={(e: any) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <EditIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit {editingProg.category === 'PROJECT' ? 'Special Project' : 'Strategic Programme'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Leadership Central Control: Update milestones, status &amp; progress
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => setEditingProg(null)}
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Name / Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={editName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Lead Owner
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={editOwner}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditOwner(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Executive Sponsor
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={editSponsor}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditSponsor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Milestone
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={editNextMilestone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditNextMilestone(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    value={editStatus}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Risk Level
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    value={editRisk}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditRisk(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Current Progress (%)
                  </label>
                  <span className="text-xs font-bold text-indigo-700">{editProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="w-full accent-indigo-600 cursor-pointer"
                  value={editProgress}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditProgress(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => setEditingProg(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 !text-white font-bold text-xs min-h-[42px] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                style={{ color: '#ffffff' }}
                disabled={cmd.busy || !editName.trim()}
                onClick={() => void saveEditProgramme()}
              >
                {cmd.busy ? <span>Saving...</span> : <span style={{ color: '#ffffff' }}>Save Changes</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main List */}
      <AsyncState
        loading={page.loading}
        refreshing={page.refreshing}
        stale={page.stale}
        error={page.error}
        onRetry={page.reload}
      >
        {items.length ? (
          <div className="list space-y-4">
            {items.map(p => {
              const isCompleted = p.status === 'Completed' || p.status === 'CLOSED';
              const isAtRisk = p.status === 'At Risk' || p.risk === 'CRITICAL' || p.risk === 'HIGH';
              const borderAccent = isCompleted
                ? 'border-l-4 border-l-emerald-500'
                : isAtRisk
                ? 'border-l-4 border-l-amber-500'
                : 'border-l-4 border-l-[#1b5fa7]';

              return (
                <div
                  key={p.id}
                  className={`p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 ${borderAccent}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {p.category || 'PROGRAMME'}
                      </span>
                      <Link
                        className="row-title font-bold text-sm text-slate-900 hover:text-[#1b5fa7] transition-colors line-clamp-1 block"
                        to={`/org/programmes/${p.id}`}
                      >
                        {p.name}
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <User className="size-3 text-slate-400" />
                        {p.owner}
                      </span>
                      {p.sponsor && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <span className="text-slate-400 font-normal">Sponsor:</span>
                          {p.sponsor}
                        </span>
                      )}
                      {p.nextMilestone && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <CalendarDays className="size-3 text-slate-400" />
                          {p.nextMilestone}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                          p.risk === 'CRITICAL'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : p.risk === 'HIGH'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : p.risk === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <AlertTriangle className="size-3" />
                        {p.risk} Risk
                      </span>
                      <div className="inline-flex items-center gap-2 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                        <span className="text-[11px] font-medium text-slate-500">Progress</span>
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#1b5fa7] h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-[#1b5fa7]">{p.progress}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="row-actions flex items-center gap-2 flex-wrap shrink-0">
                    <StatusPill value={p.status} />
                    <Link
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 hover:border-slate-400 min-h-[38px] transition-all cursor-pointer"
                      to={`/org/programmes/${p.id}`}
                    >
                      <span>Open details</span>
                      <ArrowRight className="size-3 text-slate-400" />
                    </Link>
                    {!isTrust && (
                      <>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 min-h-[38px] transition-all cursor-pointer"
                          onClick={() => openEditModal(p)}
                          title="Edit details"
                        >
                          <EditIcon className="size-3.5 text-indigo-600" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 min-h-[38px] transition-all cursor-pointer"
                          onClick={() => void deleteProgramme(p)}
                          title="Delete from scope"
                        >
                          <Trash2 className="size-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 hover:border-slate-400 min-h-[38px] transition-all disabled:opacity-40 cursor-pointer"
                          disabled={cmd.busy || p.status === 'At Risk'}
                          onClick={() => void update(p, 'At Risk')}
                          title="Mark as At Risk"
                        >
                          <AlertTriangle className="size-3.5 text-amber-600" />
                          <span>At Risk</span>
                        </button>
                        <button
                          type="button"
                          className="btn primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1b5fa7] !text-white font-bold text-xs hover:bg-[#174f89] shadow-xs min-h-[38px] transition-all disabled:opacity-40 cursor-pointer"
                          style={{ color: '#ffffff' }}
                          disabled={cmd.busy || p.status === 'Completed'}
                          onClick={() => void update(p, 'Completed')}
                          title="Complete Programme"
                        >
                          <CheckCircle2 className="size-3.5 !text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                          <span style={{ color: '#ffffff' }}>Complete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-4">
            <EmptyState
              title={`No ${isProjectView ? 'Projects' : 'Programmes'} in this scope`}
              body={
                isTrust
                  ? `No active ${isProjectView ? 'special projects' : 'strategic programmes'} in this scope. Project planning and execution are managed exclusively by Chapter Leadership.`
                  : `Get started by scheduling your chapter's first ${
                      isProjectView ? 'special project' : 'strategic programme'
                    }.`
              }
            />
            {!isTrust && (
              <button
                type="button"
                className="btn primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b5fa7] !text-white hover:bg-[#174f89] font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                style={{ color: '#ffffff' }}
                onClick={() => {
                  setCategory(isProjectView ? 'PROJECT' : 'PROGRAMME');
                  setShowModal(true);
                }}
              >
                <PlusIcon className="size-4 text-white" stroke="#ffffff" />
                <span style={{ color: '#ffffff' }}>Create First {isProjectView ? 'Project' : 'Programme'}</span>
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
