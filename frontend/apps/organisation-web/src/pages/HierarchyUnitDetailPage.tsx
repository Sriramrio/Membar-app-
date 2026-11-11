import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { AsyncState } from '@/components/AsyncState';
import { RecordNotFound } from '@/components/RecordNotFound';
import { EmptyState } from '@/components/EmptyState';
import { useOrg } from '@/state/OrgStore';
import { useDomainRecord } from '@/hooks/useDomainRecord';
import { useDomainProjection } from '@/hooks/useDomainProjection';
import type { HierarchyRollupProjection, OrgLevel, OrgUnit } from '@/domain/types';
import { Users, CheckSquare, CalendarDays, CheckCircle2, ChevronRight, ShieldCheck, MapPin } from 'lucide-react';

const pathFor = (u: { id: string; level: OrgLevel | string }) => {
  const lvl = u.level?.toUpperCase();
  return lvl === 'CHAPTER' ? `/org/chapters/${u.id}` :
         lvl === 'REGION' ? `/org/regions/${u.id}` :
         lvl === 'CITY' ? `/org/cities/${u.id}` :
         lvl === 'STATE' ? `/org/states/${u.id}` :
         lvl === 'NATIONAL' ? '/org/national' : '/org/management';
};

export function HierarchyUnitDetailPage({ expectedLevel }: { expectedLevel: 'REGION' | 'CITY' | 'STATE' }) {
  const { id } = useParams();
  const s = useOrg();
  const local = s.units.find(u => u.id === id && u.level === expectedLevel);
  const detail = useDomainRecord<OrgUnit>({ entityType: 'ORG_UNIT', id, organisationScope: s.scope.id }, local, Boolean(id));
  
  const req = useMemo(() => ({
    queryId: 'org.hierarchy.rollup',
    organisationScope: s.scope.id,
    parameters: { unitId: id, level: expectedLevel }
  }), [s.scope.id, id, expectedLevel]);

  const rollup = useDomainProjection<HierarchyRollupProjection | undefined>(req, undefined, [id], Boolean(id));

  if (!detail.loading && !detail.record && !detail.error) {
    return (
      <RecordNotFound
        title={`${expectedLevel} not found`}
        backTo={`/org/${expectedLevel.toLowerCase()}s`}
        backLabel={`Back to ${expectedLevel.toLowerCase()}s`}
      />
    );
  }

  const u = detail.record;
  const children = rollup.data?.children ?? [];

  return (
    <AsyncState loading={detail.loading} refreshing={detail.refreshing} stale={detail.stale} error={detail.error} onRetry={detail.reload}>
      {u && (
        <>
          <PageHeader
            title={u.name}
            actions={
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                Operational
              </span>
            }
          >
            {expectedLevel} coordination view with evidence-based immediate-child roll-up and authorised drill-down.
          </PageHeader>

          <AsyncState loading={rollup.loading} refreshing={rollup.refreshing} stale={rollup.stale} error={rollup.error} onRetry={rollup.reload}>
            {rollup.data ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
                  <div className="p-4 lg:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Members</span>
                      <Users className="size-4 text-blue-600" />
                    </div>
                    <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block mt-2">
                      {rollup.data.activeMembers ?? 0}
                    </strong>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">Across all constituent units</span>
                  </div>

                  <div className="p-4 lg:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Open Work</span>
                      <CheckSquare className="size-4 text-amber-600" />
                    </div>
                    <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block mt-2">
                      {rollup.data.openWork ?? 0}
                    </strong>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">Pending task milestones</span>
                  </div>

                  <div className="p-4 lg:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Attendance Logged</span>
                      <CalendarDays className="size-4 text-emerald-600" />
                    </div>
                    <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block mt-2">
                      {rollup.data.attendanceRecords ?? 0}
                    </strong>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">Recorded participations</span>
                  </div>

                  <div className="p-4 lg:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Networking Activity</span>
                      <CheckCircle2 className="size-4 text-purple-600" />
                    </div>
                    <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block mt-2">
                      {rollup.data.networkingActivities ?? 0}
                    </strong>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">1-to-1s and referrals</span>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                  <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MapPin className="size-4 text-blue-600" />
                    Immediate Constituent Units ({children.length})
                  </h2>
                  {children.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {children.map((c) => (
                        <Link
                          className="flex items-center justify-between py-3.5 hover:bg-slate-50 rounded-xl px-3 transition-colors group"
                          key={c.id}
                          to={pathFor(c as any)}
                        >
                          <div>
                            <b className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                              {c.name}
                            </b>
                            <div className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                {c.level}
                              </span>
                              <span>·</span>
                              <span>{c.activeMembers} Members</span>
                              <span>·</span>
                              <span>{c.openWork} Open Tasks</span>
                              <span>·</span>
                              <span>{c.attendanceRecords} Attendance</span>
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No constituent units registered in this cluster" />
                  )}
                </div>
              </>
            ) : (
              <EmptyState title="No roll-up summary available" />
            )}
          </AsyncState>
        </>
      )}
    </AsyncState>
  );
}

export const RegionDetailPage = () => <HierarchyUnitDetailPage expectedLevel="REGION" />;
export const CityDetailPage = () => <HierarchyUnitDetailPage expectedLevel="CITY" />;
export const StateDetailPage = () => <HierarchyUnitDetailPage expectedLevel="STATE" />;
