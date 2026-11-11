import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  Search, 
  Grid, 
  List, 
  MapPin, 
  UserCheck, 
  AlertCircle, 
  Plus, 
  X, 
  RefreshCw, 
  Calendar, 
  Phone, 
  Mail,
  CheckCircle2
} from 'lucide-react';
import { useOrg } from '@/state/OrgStore';
import { chapterWorkflowApi, type ChapterDto } from '@/services/chapterWorkflowApi';

export default function ChaptersPage() {
  const s = useOrg();
  const scope = s.scope;
  const [chapters, setChapters] = useState<ChapterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ASSIGNED' | 'VACANT'>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newChapterForm, setNewChapterForm] = useState({
    name: '',
    regionId: 'Tamil Nadu West',
    stateId: 'Tamil Nadu'
  });

  const loadChapters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chapterWorkflowApi.getChapters(true);
      if (Array.isArray(data)) {
        setChapters(data);
      } else {
        setChapters([]);
      }
    } catch (err: any) {
      console.error('Failed to load chapters:', err);
      setError(err?.message || 'Could not load chapter portfolio from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChapters();
  }, []);

  // Distinct regions for filter dropdown
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    chapters.forEach(c => {
      if (c.regionId) set.add(c.regionId);
    });
    return Array.from(set).sort();
  }, [chapters]);

  // Real Metric Summaries
  const metrics = useMemo(() => {
    const total = chapters.length;
    const active = chapters.filter(c => c.status === 'ACTIVE').length;
    const withCoordinator = chapters.filter(c => Boolean(c.coordinatorName)).length;
    const totalMembers = chapters.reduce((acc, c) => acc + (c.memberCount ?? 1), 0);
    const regionsCount = new Set(chapters.map(c => c.regionId).filter(Boolean)).size;

    return { total, active, withCoordinator, totalMembers, regionsCount };
  }, [chapters]);

  // Filtered chapters list
  const filteredChapters = useMemo(() => {
    return chapters.filter(c => {
      // Status filter
      if (statusFilter === 'ACTIVE' && c.status !== 'ACTIVE') return false;
      if (statusFilter === 'ASSIGNED' && !c.coordinatorName) return false;
      if (statusFilter === 'VACANT' && Boolean(c.coordinatorName)) return false;

      // Region filter
      if (regionFilter !== 'ALL' && c.regionId !== regionFilter) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const region = (c.regionId || '').toLowerCase();
      const state = (c.stateId || '').toLowerCase();
      const coord = (c.coordinatorName || '').toLowerCase();
      return name.includes(q) || region.includes(q) || state.includes(q) || coord.includes(q);
    });
  }, [chapters, statusFilter, regionFilter, searchQuery, s.scope,s.permissions]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterForm.name.trim()) {
      alert('Please enter a chapter name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await chapterWorkflowApi.createChapter({
        name: newChapterForm.name.trim(),
        regionId: newChapterForm.regionId.trim(),
        stateId: newChapterForm.stateId.trim()
      });

      setIsModalOpen(false);
      setNewChapterForm({
        name: '',
        regionId: 'Tamil Nadu West',
        stateId: 'Tamil Nadu'
      });
      await loadChapters();
    } catch (err: any) {
      console.error('Error creating chapter:', err);
      alert(`Failed to create chapter: ${err?.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Parivars">
          Governed chapter portfolio, health, membership, and leadership oversight across the network.
        </PageHeader>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadChapters}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Parivars"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs hover:shadow-sm transition-all"
          >
            <Plus className="size-4" />
            <span>New Parivar</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Metric Cards (Real Calculations) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="card p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Parivars</span>
            <Building2 className="size-4 text-blue-600" />
          </div>
          <strong className="text-2xl sm:text-3xl font-extrabold text-slate-900 block tracking-tight">
            {metrics.total}
          </strong>
          <span className="text-xs text-slate-500 mt-1 block">Registered in database</span>
        </div>

        <div className="card p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Status</span>
            <ShieldCheck className="size-4 text-emerald-600" />
          </div>
          <strong className="text-2xl sm:text-3xl font-extrabold text-emerald-600 block tracking-tight">
            {metrics.active}
          </strong>
          <span className="text-xs text-slate-500 mt-1 block">Operational chapters</span>
        </div>

        <div className="card p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Coordinators</span>
            <UserCheck className="size-4 text-indigo-600" />
          </div>
          <strong className="text-2xl sm:text-3xl font-extrabold text-indigo-600 block tracking-tight">
            {metrics.withCoordinator} <span className="text-sm font-normal text-slate-400">/ {metrics.total}</span>
          </strong>
          <span className="text-xs text-slate-500 mt-1 block">Appointed leaders in office</span>
        </div>

        <div className="card p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Regions Covered</span>
            <MapPin className="size-4 text-amber-600" />
          </div>
          <strong className="text-2xl sm:text-3xl font-extrabold text-slate-900 block tracking-tight">
            {metrics.regionsCount}
          </strong>
          <span className="text-xs text-slate-500 mt-1 block">Geographic scopes</span>
        </div>
      </div>

      {/* Search, Filter Tabs & View Controls */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search chapters by name, region, or coordinator..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Region Dropdown Filter */}
          <div className="w-full md:w-56">
            <select
              value={regionFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRegionFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium cursor-pointer"
            >
              <option value="ALL">All Regions ({metrics.regionsCount})</option>
              {availableRegions.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Card Grid View"
            >
              <Grid className="size-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table List View"
            >
              <List className="size-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-slate-100">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Chapters ({chapters.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active ({metrics.active})
          </button>
          <button
            onClick={() => setStatusFilter('ASSIGNED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'ASSIGNED'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            With Coordinator ({metrics.withCoordinator})
          </button>
          <button
            onClick={() => setStatusFilter('VACANT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'VACANT'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Vacant Coordinator ({metrics.total - metrics.withCoordinator})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200/80 text-slate-500 shadow-2xs space-y-3">
          <RefreshCw className="size-6 text-blue-600 animate-spin" />
          <span className="text-sm font-medium">Loading real chapter portfolio from database…</span>
        </div>
      ) : error ? (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-2xs">
          <AlertCircle className="size-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <strong className="block font-bold">Failed to load chapter data</strong>
            <span>{error}</span>
          </div>
        </div>
      ) : filteredChapters.length === 0 ? (
        <EmptyState title="No chapters match your filter criteria" />
      ) : viewMode === 'grid' ? (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChapters.map((ch) => {
            const isUserScope = scope?.id === ch.id || scope?.name?.toLowerCase() === ch.name.toLowerCase();
            const healthScore = ch.health ?? 100;

            return (
              <div 
                key={ch.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                  isUserScope ? 'border-blue-300 ring-2 ring-blue-500/10' : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* Top Section */}
                <div className="p-5 space-y-4">
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shrink-0">
                        <Building2 className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base leading-snug">
                            {ch.name}
                          </h3>
                        </div>
                        {isUserScope && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md mt-0.5">
                            <CheckCircle2 className="size-3" /> Your Primary Chapter
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <ShieldCheck className="size-3.5" />
                      <span>{ch.status}</span>
                    </span>
                  </div>

                  {/* Location Info */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <MapPin className="size-3.5 text-slate-400 shrink-0" />
                    <span>{ch.regionId ?? 'Regional Scope'} · {ch.stateId ?? 'Tamil Nadu'}</span>
                  </div>

                  {/* Appointed Coordinator Box */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Chapter Coordinator
                    </span>
                    {ch.coordinatorName ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {ch.coordinatorName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block truncate max-w-[150px]">
                              {ch.coordinatorName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {ch.coordinatorEmail && (
                            <a 
                              href={`mailto:${ch.coordinatorEmail}`}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white transition-colors"
                              title={ch.coordinatorEmail}
                            >
                              <Mail className="size-3.5" />
                            </a>
                          )}
                          {ch.coordinatorPhone && (
                            <a 
                              href={`tel:${ch.coordinatorPhone}`}
                              className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-white transition-colors"
                              title={ch.coordinatorPhone}
                            >
                              <Phone className="size-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-700 font-medium">Vacant · Not Assigned</span>
                        <Link 
                          to="/org/chapter-coordinators"
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Appoint
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Health & Metrics Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <ShieldCheck className="size-3.5 text-slate-400" /> Operational Health
                      </span>
                      <strong className={`font-bold ${
                        healthScore >= 90 ? 'text-emerald-600' : healthScore >= 75 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {healthScore}%
                      </strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          healthScore >= 90 ? 'bg-emerald-500' : healthScore >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${healthScore}%` }}
                      />
                    </div>
                    {ch.openTasks !== undefined && ch.openTasks > 0 && (
                      <span className="text-[11px] text-amber-600 font-medium block">
                        • {ch.openTasks} open action task{ch.openTasks > 1 ? 's' : ''} in workspace
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Quick Action Footer */}
                <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/org/members?scopeId=${encodeURIComponent(ch.id)}`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      <Users className="size-3.5 text-slate-400" />
                      <span>{ch.memberCount ?? 1}</span>
                    </Link>
                    <Link
                      to={`/org/meetings?scopeId=${encodeURIComponent(ch.id)}`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      <Calendar className="size-3.5 text-slate-400" />
                      <span>Meetings</span>
                    </Link>
                  </div>

                  <Link
                    to={`/org/chapters/${ch.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:translate-x-0.5 transition-all"
                  >
                    <span>Workspace</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Parivar</th>
                  <th className="px-5 py-3.5">Region & State</th>
                  <th className="px-5 py-3.5">Coordinator</th>
                  <th className="px-5 py-3.5">Members</th>
                  <th className="px-5 py-3.5">Health</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChapters.map((ch) => {
                  const healthScore = ch.health ?? 100;
                  return (
                    <tr key={ch.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            <Building2 className="size-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {ch.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {ch.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        <span>{ch.regionId ?? 'Regional Scope'}</span>
                        <span className="text-slate-400 block text-[11px]">{ch.stateId ?? 'Tamil Nadu'}</span>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        {ch.coordinatorName ? (
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <UserCheck className="size-3.5 text-indigo-600 shrink-0" />
                            <span>{ch.coordinatorName}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-medium text-[11px]">Vacant</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                        {ch.memberCount ?? 1}
                      </td>

                      <td className="px-5 py-4">
                        <strong className={`text-xs font-bold ${
                          healthScore >= 90 ? 'text-emerald-600' : healthScore >= 75 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {healthScore}%
                        </strong>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ch.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/org/chapters/${ch.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all"
                        >
                          <span>Workspace</span>
                          <ArrowRight className="size-3 text-slate-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* "New Chapter" Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Building2 className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Register New Chapter
                </h3>
                <p className="text-xs text-slate-500">
                  Add an official local chapter to the governed network
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chapter Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Erode Parivar, Tirunelveli Parivar"
                  value={newChapterForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewChapterForm({ ...newChapterForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Regional Scope <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newChapterForm.regionId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewChapterForm({ ...newChapterForm, regionId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium cursor-pointer"
                >
                  <option value="Tamil Nadu West">Tamil Nadu West</option>
                  <option value="Tamil Nadu Central">Tamil Nadu Central</option>
                  <option value="Tamil Nadu North">Tamil Nadu North</option>
                  <option value="Tamil Nadu South">Tamil Nadu South</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  State Scope
                </label>
                <input
                  type="text"
                  value={newChapterForm.stateId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewChapterForm({ ...newChapterForm, stateId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Register Parivar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
