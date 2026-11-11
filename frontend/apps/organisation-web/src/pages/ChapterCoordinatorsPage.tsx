import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Compass, 
  Calendar, 
  Phone, 
  Mail, 
  Search, 
  X, 
  UserPlus, 
  RefreshCw, 
  Grid, 
  List, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Building2,
  ExternalLink,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AsyncState } from '@/components/AsyncState';
import { CursorPager } from '@/components/CursorPager';
import { EmptyState } from '@/components/EmptyState';
import { useOrg } from '@/state/OrgStore';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { chapterWorkflowApi } from '@/services/chapterWorkflowApi';
import type { ChapterCoordinatorResponsibility } from '@/domain/types';

export default function ChapterCoordinatorsPage() {
  const s = useOrg();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ENDED'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);
  
  // Assign Form
  const [formData, setFormData] = useState({
    memberName: '',
    email: '',
    phone: '',
    chapterId: '',
    chapterName: '',
    regionName: 'Tamil Nadu Region',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });

  // Available Chapters for Dropdown
  const [availableChapters, setAvailableChapters] = useState<Array<{ id: string; name: string; regionId?: string | null }>>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchChapters = async () => {
      setIsLoadingChapters(true);
      try {
        const liveChapters = await chapterWorkflowApi.getChapters();
        if (isMounted && Array.isArray(liveChapters) && liveChapters.length > 0) {
          setAvailableChapters(liveChapters.map(c => ({ id: c.id, name: c.name, regionId: c.regionId })));
          return;
        }
      } catch (err) {
        console.warn('Could not fetch live chapters from API, falling back:', err);
      }

      if (isMounted) {
        const unitChapters = (s.units ?? [])
          .filter(u => u.level === 'CHAPTER')
          .map(u => ({ id: u.id, name: u.name, regionId: 'Tamil Nadu Region' }));

        if (unitChapters.length > 0) {
          setAvailableChapters(unitChapters);
        } else {
          setAvailableChapters([
            { id: '7f529033-6d9d-ea75-08f5-43bf55a471d4', name: 'Hosur Chapter', regionId: 'Tamil Nadu North' },
            { id: '263cc7d4-8eaf-89d7-6f81-eceb514b7c36', name: 'Coimbatore Chapter', regionId: 'Tamil Nadu West' },
            { id: 'b60d8c61-2693-9501-10eb-b10db5584e9c', name: 'Chennai Chapter', regionId: 'Tamil Nadu Central' },
            { id: 'fbb79511-c808-459b-a386-75844ba60188', name: 'Chapter A', regionId: 'Tamil Nadu West' },
            { id: 'a1110000-0000-0000-0000-000000000005', name: 'Salem Chapter', regionId: 'Tamil Nadu West' },
            { id: 'a1110000-0000-0000-0000-000000000006', name: 'Madurai Chapter', regionId: 'Tamil Nadu South' },
            { id: 'a1110000-0000-0000-0000-000000000007', name: 'Tiruchirappalli Chapter', regionId: 'Tamil Nadu Central' }
          ]);
        }
      }
      setIsLoadingChapters(false);
    };

    fetchChapters();
    return () => { isMounted = false; };
  }, [s.units]);

  const cmd = useGovernedCommand();

  const req = useMemo(() => ({
    queryId: 'org.chapter-coordinators.list',
    organisationScope: s.scope.id,
    pageSize: 50
  }), [s.scope.id]);

  const page = useDomainCursorPage<ChapterCoordinatorResponsibility>(
    req,
    s.chapterCoordinatorResponsibilities,
    [s.scope.id]
  );

  useRealtimeRefresh(['org.assignment.*', 'org.chapter.*'], page.reload);

  const rawItems = page.page?.items ?? [];

  // Filter & Search
  const filteredItems = useMemo(() => {
    return rawItems.filter(item => {
      // Status filter
      if (statusFilter === 'ACTIVE' && item.status !== 'ACTIVE') return false;
      if (statusFilter === 'ENDED' && item.status !== 'ENDED') return false;

      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (item.memberName ?? '').toLowerCase();
      const chapter = (item.chapterName ?? '').toLowerCase();
      const region = (item.regionName ?? '').toLowerCase();
      const email = (item.email ?? '').toLowerCase();
      const phone = (item.phone ?? '').toLowerCase();
      return name.includes(q) || chapter.includes(q) || region.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [rawItems, statusFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = rawItems.length;
    const active = rawItems.filter(i => i.status === 'ACTIVE').length;
    const ended = rawItems.filter(i => i.status === 'ENDED').length;
    const uniqueChapters = new Set(rawItems.map(i => i.chapterId || i.chapterName)).size;

    // Check expiring within 60 days
    const now = Date.now();
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    const expiringSoon = rawItems.filter(i => {
      if (i.status !== 'ACTIVE' || !i.effectiveTo) return false;
      const end = new Date(i.effectiveTo).getTime();
      return end > now && end - now <= sixtyDaysMs;
    }).length;

    return { total, active, ended, uniqueChapters, expiringSoon };
  }, [rawItems]);

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEndTenure = async (coordinatorId: string) => {
    if (!window.confirm('Are you sure you want to end this Coordinator responsibility?')) return;
    setEndingId(coordinatorId);
    try {
      await cmd.execute({
        commandType: 'org.coordinator.end',
        aggregateType: 'Appointment',
        aggregateId: coordinatorId,
        organisationScope: s.scope.id,
        payload: { id: coordinatorId }
      });
      await page.reload();
    } finally {
      setEndingId(null);
    }
  };

  // Map of active coordinator tenures by chapter
  const activeChapterMap = useMemo(() => {
    const map = new Map<string, string>();
    rawItems.forEach(item => {
      if (item.status === 'ACTIVE') {
        const cName = item.memberName || 'Active Coordinator';
        if (item.chapterId) map.set(item.chapterId.toLowerCase(), cName);
        if (item.chapterName) map.set(item.chapterName.toLowerCase(), cName);
        if (item.chapter) map.set(item.chapter.toLowerCase(), cName);
      }
    });
    return map;
  }, [rawItems]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberName.trim() || !formData.chapterId) {
      alert('Please fill in coordinator member name and select a chapter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const chId = formData.chapterId;
      const selectedChapter = availableChapters.find(c => c.id === chId);
      const chName = formData.chapterName || selectedChapter?.name || 'Assigned Chapter';

      await cmd.execute({
        commandType: 'org.coordinator.assign',
        aggregateType: 'Appointment',
        organisationScope: chId,
        payload: {
          memberId: formData.memberName.toLowerCase().replace(/\s+/g, '-'),
          memberName: formData.memberName,
          chapterId: chId,
          chapterName: chName,
          regionName: formData.regionName,
          email: formData.email || `${formData.memberName.toLowerCase().replace(/\s+/g, '.')}@dbn.org`,
          phone: formData.phone || '+91 98450 11223',
          effectiveFrom: formData.effectiveFrom,
          effectiveTo: formData.effectiveTo
        }
      });

      setIsModalOpen(false);
      setFormData({
        memberName: '',
        email: '',
        phone: '',
        chapterId: '',
        chapterName: '',
        regionName: 'Tamil Nadu Region',
        effectiveFrom: new Date().toISOString().slice(0, 10),
        effectiveTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      });
      await page.reload();
    } catch (err: any) {
      console.error('Error appointing coordinator:', err);
      const msg = err?.message || 'Failed to appoint coordinator. Please verify if another coordinator has an active tenure on this chapter.';
      alert(`Could not appoint coordinator: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProgress = (from?: string, to?: string) => {
    if (!from || !to) return 50;
    const start = new Date(from).getTime();
    const end = new Date(to).getTime();
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <PageHeader title="Parivar Coordinators">
            Each Chapter has one Region-facing coordination responsibility. The Coordinator supports communication, alignment, and operational health between the Chapter and Regional Leadership.
          </PageHeader>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => page.reload()}
            title="Refresh list"
            disabled={page.loading || page.refreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={18} className={page.refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all"
          >
            <UserPlus size={18} />
            <span>Appoint Coordinator</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <User size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.total}</div>
            <div className="text-xs font-medium text-slate-500">Total Coordinators</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{metrics.active}</div>
            <div className="text-xs font-medium text-slate-500">Active In-Term</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.uniqueChapters}</div>
            <div className="text-xs font-medium text-slate-500">Parivars Covered</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{metrics.expiringSoon}</div>
            <div className="text-xs font-medium text-slate-500">Expiring in 60 Days</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Search by coordinator, chapter, region, or email..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Tabs & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({metrics.total})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({metrics.active})
            </button>
            <button
              onClick={() => setStatusFilter('ENDED')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'ENDED'
                  ? 'bg-white text-slate-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ended ({metrics.ended})
            </button>
          </div>

          <div className="hidden sm:flex items-center border-l border-slate-200 pl-3 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <AsyncState
        loading={page.loading}
        refreshing={page.refreshing}
        stale={page.stale}
        error={page.error}
        onRetry={page.reload}
      >
        {filteredItems.length === 0 ? (
          searchQuery ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Search size={26} />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No matching coordinators found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                No chapter coordinators match "{searchQuery}". Try searching by another keyword or reset the search.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <UserPlus size={28} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No Parivar Coordinators in this Region</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Each chapter should be paired with a Region-facing Coordinator to ensure steady communication and governance support.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md transition-colors"
              >
                <UserPlus size={18} />
                <span>Appoint First Coordinator</span>
              </button>
            </div>
          )
        ) : viewMode === 'grid' ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map(c => {
              const progress = calculateProgress(c.effectiveFrom, c.effectiveTo);
              const isActive = c.status === 'ACTIVE';
              const name = c.memberName || c.name || 'Coordinator Officer';
              const initials = name
                .split(' ')
                .map((n: string) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={c.id}
                  className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
                >
                  {/* Top Gradient Banner */}
                  <div className={`h-2.5 w-full ${isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-300'}`} />

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Header: Avatar, Name, Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-xs ${
                            isActive 
                              ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {initials}
                          </div>
                          {isActive && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                            {name}
                          </h4>
                          <span className="inline-block text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 mt-0.5">
                            ID: {c.memberId ? c.memberId.slice(0, 8) : 'COORD'}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    {/* Scope: Chapter -> Region */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <MapPin size={14} className="text-indigo-500 shrink-0" />
                        <span className="truncate">
                          Chapter: <b className="text-slate-900">{c.chapterName || c.chapter || 'Chapter'}</b>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Compass size={14} className="text-blue-500 shrink-0" />
                        <span className="truncate">
                          Region: <span className="text-slate-700">{c.regionName || c.region || 'Regional Unit'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="mt-3.5 space-y-2 text-xs">
                      {c.email && (
                        <div className="flex items-center justify-between text-slate-600 group/copy">
                          <a
                            href={`mailto:${c.email}`}
                            className="inline-flex items-center gap-2 hover:text-indigo-600 truncate transition-colors"
                          >
                            <Mail size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{c.email}</span>
                          </a>
                          <button
                            onClick={() => handleCopyEmail(c.email!, c.id)}
                            title="Copy Email"
                            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                          >
                            {copiedId === c.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <a href={`tel:${c.phone}`} className="hover:text-indigo-600 transition-colors">
                            {c.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Term Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          Tenure Period
                        </span>
                        <span>{progress}% elapsed</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isActive ? 'bg-gradient-to-r from-indigo-500 to-emerald-500' : 'bg-slate-300'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between font-mono">
                        <span>{c.effectiveFrom || 'Start'}</span>
                        <span>{c.effectiveTo || 'Active'}</span>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/org/chapters/${c.chapterId || ''}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Building2 size={13} />
                          <span>Parivar</span>
                        </Link>
                        <Link
                          to="/org/converse"
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <MessageCircle size={13} />
                          <span>Message</span>
                        </Link>
                      </div>

                      {isActive && (
                        <button
                          onClick={() => handleEndTenure(c.id)}
                          disabled={endingId === c.id}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {endingId === c.id ? 'Ending...' : 'End Term'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Coordinator</th>
                    <th className="px-5 py-3.5">Assigned Parivar</th>
                    <th className="px-5 py-3.5">Region</th>
                    <th className="px-5 py-3.5">Effective Dates</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(c => {
                    const name = c.memberName || c.name || 'Coordinator Officer';
                    const isActive = c.status === 'ACTIVE';

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{name}</div>
                              <div className="text-xs text-slate-400">{c.email || 'coordinator@sethu.local'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-slate-400" />
                            <span>{c.chapterName || c.chapter || 'Chapter'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Compass size={14} className="text-slate-400" />
                            <span>{c.regionName || c.region || 'Region'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-500">
                          {c.effectiveFrom} {c.effectiveTo ? `→ ${c.effectiveTo}` : ''}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/org/chapters/${c.chapterId || ''}`}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              Chapter
                            </Link>
                            <Link
                              to="/org/converse"
                              className="px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              Message
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pager */}
        <CursorPager
          canPrevious={page.canPrevious}
          canNext={page.canNext}
          onPrevious={page.previous}
          onNext={page.next}
          totalEstimate={page.page?.totalEstimate}
        />
      </AsyncState>

      {/* Appoint Coordinator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Appoint Parivar Coordinator</h3>
                  <p className="text-xs text-slate-500">Assign a leader to coordinate chapter-regional alignment</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Coordinator Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.memberName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, memberName: e.target.value })}
                  placeholder="e.g. Anand Kumar, Meera Narayanan"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="coordinator@dbn.org"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98450 11223"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="assignedChapterSelect" className="block text-xs font-semibold text-slate-700">
                    Assigned Chapter <span className="text-rose-500">*</span>
                  </label>
                  {isLoadingChapters && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Loading chapters...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    id="assignedChapterSelect"
                    required
                    value={formData.chapterId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const selectedId = e.target.value;
                      const selectedChapter = availableChapters.find(c => c.id === selectedId);
                      setFormData(prev => ({
                        ...prev,
                        chapterId: selectedId,
                        chapterName: selectedChapter ? selectedChapter.name : '',
                        regionName: selectedChapter?.regionId || prev.regionName || 'Tamil Nadu Region'
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium cursor-pointer shadow-2xs"
                  >
                    <option value="" disabled>-- Select Parivar to Assign --</option>
                    {availableChapters.map(ch => {
                      const activeCoord = activeChapterMap.get(ch.id.toLowerCase()) || activeChapterMap.get(ch.name.toLowerCase());
                      return (
                        <option key={ch.id} value={ch.id}>
                          {ch.name} {activeCoord ? `• [Active: ${activeCoord}]` : '✓ [Available]'}
                        </option>
                      );
                    })}
                  </select>
                </div>
                {formData.chapterId && (
                  <div className="mt-1.5">
                    {activeChapterMap.has(formData.chapterId.toLowerCase()) || activeChapterMap.has(formData.chapterName.toLowerCase()) ? (
                      <p className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-start gap-1.5 font-medium leading-tight">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                        <span>
                          <strong>Tenure Notice:</strong> Currently assigned to <em>{activeChapterMap.get(formData.chapterId.toLowerCase()) || activeChapterMap.get(formData.chapterName.toLowerCase())}</em>. Ensure new dates do not overlap or conclude the previous tenure.
                        </span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        <span>Parivar is vacant and available for new appointment.</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Regional Scope
                </label>
                <input
                  type="text"
                  value={formData.regionName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, regionName: e.target.value })}
                  placeholder="Auto-populated from selected chapter"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Automatically derived from the selected chapter's region.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Effective From
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveFrom}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Effective To
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveTo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, effectiveTo: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Confirm & Appoint</span>
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
