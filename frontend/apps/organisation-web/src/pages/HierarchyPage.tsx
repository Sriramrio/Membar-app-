import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { AsyncState } from '@/components/AsyncState';
import { EmptyState } from '@/components/EmptyState';
import { useOrg } from '@/state/OrgStore';
import { useDomainProjection } from '@/hooks/useDomainProjection';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import type { HierarchyOperationsProjection, OrgLevel, OperationalPerson } from '@/domain/types';
import {
  Building2,
  Users,
  CheckSquare,
  AlertCircle,
  ShieldCheck,
  Search,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ExtendedUnitItem {
  id: string;
  name: string;
  code: string;
  level: string;
  status: string;
  active: boolean;
  chapterCount?: number;
  chapters?: Array<{ id: string; name: string }>;
  coordinatorName?: string | null;
  coordinatorEmail?: string | null;
  coordinatorPhone?: string | null;
  health?: number;
  to?: string;
}

export function HierarchyPage({ level }: { level: 'REGION' | 'CITY' | 'STATE' | 'NATIONAL' | 'MANAGEMENT' }) {
  const s = useOrg();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'ASSIGNED' | 'VACANT'>('ALL');

  const label = {
    REGION: 'Region',
    CITY: 'City / Cluster',
    STATE: 'State',
    NATIONAL: 'National',
    MANAGEMENT: 'Management'
  }[level];

  const coordinatorLabel = {
    REGION: 'Region Coordinator',
    CITY: 'City Coordinator',
    STATE: 'State Coordinator',
    NATIONAL: 'National Leader',
    MANAGEMENT: 'Management Officer'
  }[level];

  const local = useMemo<HierarchyOperationsProjection>(() => {
    const childLevel: Record<Exclude<OrgLevel, 'CHAPTER'>, OrgLevel> = {
      REGION: 'CHAPTER',
      CITY: 'REGION',
      STATE: 'CITY',
      NATIONAL: 'STATE',
      MANAGEMENT: 'NATIONAL'
    };
    const units = s.units.filter(u => u.level === childLevel[level]);
    return {
      level: level as OrgLevel,
      unitCount: units.length,
      openWork: s.tasks.filter(t => t.status !== 'DONE').length,
      openMemberCases: s.cases.filter(c => c.status !== 'Closed').length,
      supportInterventions: s.support.filter(x => x.status !== 'Closed').length + s.escalations.filter(x => x.status !== 'Closed').length,
      attentionUnits: units.filter(u => u.health < 80).map(u => ({
        id: u.id,
        name: u.name,
        level: u.level,
        status: u.status,
        health: u.health,
        memberCount: u.memberCount,
        to: u.level === 'CHAPTER' ? `/org/chapters/${u.id}` : u.level === 'REGION' ? `/org/regions/${u.id}` : u.level === 'CITY' ? `/org/cities/${u.id}` : u.level === 'STATE' ? `/org/states/${u.id}` : u.level === 'NATIONAL' ? '/org/national' : '/org/management'
      }))
    };
  }, [level, s.units, s.tasks, s.cases, s.support, s.escalations]);

  const peopleReq = useMemo(() => ({ queryId: 'org.people.list', organisationScope: s.scope.id, pageSize: 50 }), [s.scope.id]);
  const people = useDomainCursorPage<OperationalPerson>(peopleReq, s.people, [s.scope.id]);
  
  const leaders = (people.page?.items ?? []).filter(p =>
    level === 'NATIONAL' ? /National President|National Secretary|National Treasurer/i.test(p.position) :
    level === 'MANAGEMENT' ? /Management/i.test(p.position) :
    p.position === coordinatorLabel
  );

  const req = useMemo(() => ({ queryId: 'org.hierarchy.summary', organisationScope: s.scope.id, parameters: { level } }), [s.scope.id, level]);
  const projection = useDomainProjection<HierarchyOperationsProjection & { units?: ExtendedUnitItem[] }>(req, local, [level]);

  useRealtimeRefresh(['org.assignment.*', 'org.people.*'], people.reload);
  useRealtimeRefresh(['org.chapter.*', 'org.member-case.*', 'org.task.*', 'org.support-request.*', 'org.escalation.*'], projection.reload);

  const d = projection.data;
  const attentionUnits = d?.attentionUnits ?? [];
  const rawUnits: ExtendedUnitItem[] = d?.units ?? [];

  // Filtered units for the card grid
  const filteredUnits = useMemo(() => {
    return rawUnits.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        u.name.toLowerCase().includes(q) || 
        (u.coordinatorName && u.coordinatorName.toLowerCase().includes(q)) ||
        (u.chapters && u.chapters.some(c => c.name.toLowerCase().includes(q)));
      
      const hasCoord = Boolean(u.coordinatorName);
      const matchesTab = 
        filterTab === 'ALL' ? true :
        filterTab === 'ASSIGNED' ? hasCoord :
        !hasCoord;

      return matchesSearch && matchesTab;
    });
  }, [rawUnits, searchQuery, filterTab]);

  return (
    <>
      <PageHeader 
        title={`${label} Operations`}
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="size-3.5 text-blue-600" />
              100% Live DB
            </span>
          </div>
        }
      >
        Regional coordination, municipal cluster governance, constituent chapter roll-ups, and operational interventions.
      </PageHeader>

      <AsyncState loading={projection.loading} refreshing={projection.refreshing} stale={projection.stale} error={projection.error} onRetry={projection.reload}>
        {d ? (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
              <div className="p-4 lg:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Units In View</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Building2 className="size-4" />
                  </div>
                </div>
                <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block mt-2">
                  {d?.unitCount ?? rawUnits.length ?? 0}
                </strong>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Configured in database</span>
              </div>

              <div className="p-4 lg:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Open Work</span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <CheckSquare className="size-4" />
                  </div>
                </div>
                <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block mt-2">
                  {d?.openWork ?? 0}
                </strong>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Active tasks in progress</span>
              </div>

              <div className="p-4 lg:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Member Cases</span>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Users className="size-4" />
                  </div>
                </div>
                <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block mt-2">
                  {d?.openMemberCases ?? 0}
                </strong>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Under governance review</span>
              </div>

              <div className="p-4 lg:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Interventions</span>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <AlertCircle className="size-4" />
                  </div>
                </div>
                <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block mt-2">
                  {d?.supportInterventions ?? 0}
                </strong>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Escalations & support</span>
              </div>
            </div>

            {/* Main Interactive Clusters Section */}
            <div className="card p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="size-4 text-blue-600" />
                    {label === 'City / Cluster' ? 'City Clusters & Constituents' : `${label} Units Directory`}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Browse all active {label.toLowerCase()} jurisdictions, leadership assignments, and constituent chapters.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto text-xs font-semibold">
                  <button
                    onClick={() => setFilterTab('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      filterTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({rawUnits.length})
                  </button>
                  <button
                    onClick={() => setFilterTab('ASSIGNED')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      filterTab === 'ASSIGNED' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Appointed ({rawUnits.filter(u => u.coordinatorName).length})
                  </button>
                  <button
                    onClick={() => setFilterTab('VACANT')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      filterTab === 'VACANT' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Vacant ({rawUnits.filter(u => !u.coordinatorName).length})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${label.toLowerCase()} by name, coordinator, or chapter...`}
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-medium"
                />
              </div>

              {/* Card Grid of Clusters */}
              {filteredUnits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredUnits.map((u) => {
                    const toLink = u.to || (level === 'CITY' ? `/org/cities/${u.id}` : `/org/${level.toLowerCase()}s/${u.id}`);
                    return (
                      <div
                        key={u.id}
                        className="p-4 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {u.name}
                              </h3>
                              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="size-3 text-slate-400" />
                                {u.level} Tier
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                              u.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {u.status || 'ACTIVE'}
                            </span>
                          </div>

                          {/* Coordinator Details */}
                          <div className="p-2.5 bg-white rounded-lg border border-slate-100 mb-3 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {coordinatorLabel}
                            </span>
                            {u.coordinatorName ? (
                              <div>
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                  <ShieldCheck className="size-3.5 text-blue-600" />
                                  {u.coordinatorName}
                                </div>
                                {u.coordinatorEmail && (
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                    <Mail className="size-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{u.coordinatorEmail}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-amber-600 italic">Position Vacant</span>
                                <Link
                                  to="/org/chapter-coordinators"
                                  className="text-[10px] font-bold text-blue-600 hover:underline"
                                >
                                  Appoint
                                </Link>
                              </div>
                            )}
                          </div>

                          {/* Constituent Chapters */}
                          {u.chapters && u.chapters.length > 0 && (
                            <div className="mb-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Constituent Chapters ({u.chapters.length})
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {u.chapters.map(ch => (
                                  <Link
                                    key={ch.id}
                                    to={`/org/chapters/${ch.id}`}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[10px] font-semibold rounded transition-colors"
                                  >
                                    {ch.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Link */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-500">
                            {u.chapterCount !== undefined ? `${u.chapterCount} chapters attached` : 'Operational Jurisdiction'}
                          </span>
                          <Link
                            to={toLink}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Explore Roll-up
                            <ChevronRight className="size-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title={`No ${label.toLowerCase()} units match your criteria`} />
              )}
            </div>

            {/* Split Section: Leadership & Attention */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              {/* Leadership Card */}
              <div className="card p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-indigo-600" />
                  {coordinatorLabel} Appointments
                </h2>
                {leaders.length > 0 ? (
                  <div className="space-y-2">
                    {leaders.map(p => (
                      <div
                        className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                        key={p.id}
                      >
                        <div>
                          <b className="text-sm font-bold text-slate-900">{p.name}</b>
                          <div className="text-xs text-slate-500 mt-0.5 font-medium">
                            {p.position} · <span className="text-blue-600">{p.scope.name}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                          ACTIVE
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title={`No active ${coordinatorLabel.toLowerCase()} appointments registered`} />
                )}
              </div>

              {/* Units Requiring Attention Card */}
              <div className="card p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-600" />
                  Units Requiring Attention
                </h2>
                {attentionUnits.length > 0 ? (
                  <div className="space-y-2">
                    {attentionUnits.map(u => (
                      <Link
                        className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-xs transition-all"
                        key={u.id}
                        to={u.to}
                      >
                        <div>
                          <b className="text-sm font-bold text-slate-900">{u.name}</b>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {u.memberCount !== undefined ? `${u.memberCount} members · ` : ''}{u.status}
                          </div>
                        </div>
                        {u.health !== undefined && (
                          <strong className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            {u.health}% Health
                          </strong>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <ShieldCheck className="size-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">All {label.toLowerCase()} units operating stably</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">No immediate health interventions or critical anomalies reported.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Operating Focus Quick Navigation */}
            <div className="card p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 mb-3">Operating Focus & Shortcuts</h2>
              <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                <Link
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  to="/org/chapters"
                >
                  All Chapters
                </Link>
                <Link
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  to="/org/chapter-coordinators"
                >
                  Chapter Coordinators
                </Link>
                <Link
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  to="/org/support"
                >
                  Support Requests
                </Link>
                <Link
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  to="/org/escalations"
                >
                  Escalations
                </Link>
                <Link
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  to="/org/programmes"
                >
                  Programmes
                </Link>
                <Link
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  to="/org/reports"
                >
                  Evidence & Reports
                </Link>
              </div>
            </div>
          </>
        ) : (
          <EmptyState title={`No ${label.toLowerCase()} operational summary is available`} />
        )}
      </AsyncState>
    </>
  );
}
