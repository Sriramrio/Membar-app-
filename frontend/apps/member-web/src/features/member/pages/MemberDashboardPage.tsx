import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, Building2, CalendarClock, ChevronRight, Info, LayoutDashboard, Network, Target, TrendingDown, TrendingUp, RefreshCw, Zap } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { activeMemberId, selectActiveMember } from '@/features/network/selectors';
import { buildMemberDashboardProjection } from '@/features/member/dashboard/projections';
import type { DashboardMetricValue, DashboardPeriodKey } from '@/features/member/dashboard/types';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, PageHead, StatusPill } from '@/features/network/components/NetworkUI';
import { ChapterInsightsView } from '@/features/member/dashboard/ChapterInsightsView';
import { OrganisationInsightsView } from '@/features/member/dashboard/OrganisationInsightsView';
import { AnalyticsSummary } from '@/features/member/analytics/AnalyticsSummary';
import { authorisedOrganisationAssignment, buildPersonalNetworkingAnalytics } from '@/features/member/analytics/networkingAnalytics';
import { useEffectiveSetting } from '@/features/control-plane/hooks';
import { Tabs } from '@/components/ui/Tabs';
import { analyticsApi, type NetworkAnalyticsSnapshotDto, type MemberActionItemDto } from '@/services/api/analyticsApi';

const periodOptions: Array<{ key: DashboardPeriodKey; label: string }> = [{ key: 'month', label: 'This Month' }, { key: 'last-month', label: 'Last Month' }, { key: 'quarter', label: 'Quarter' }, { key: 'year', label: 'Year' }];
const qs = (route: string, params?: Record<string, string>) => { if (!params || !Object.keys(params).length) return route; const [path, existing = ''] = route.split('?'); const search = new URLSearchParams(existing); Object.entries(params).forEach(([k, v]) => search.set(k, v)); return `${path}?${search.toString()}` };

function MetricCard({ metric, onOpen }: { metric: DashboardMetricValue; onOpen: () => void }) {
  const numeric = typeof metric.value === 'number';
  return (
    <button type="button" onClick={onOpen} className="group min-h-28 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-200">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-bold uppercase tracking-wide text-slate-500">{metric.definition.label}</div>
        <ChevronRight className="size-4 text-slate-300 transition group-hover:text-sky-600" />
      </div>
      <div className="mt-2 text-2xl font-black text-[var(--navy-950)]">{metric.value}</div>
      <div className="mt-2 flex min-h-5 items-center gap-1 text-sm text-slate-500">
        {numeric && metric.trend !== undefined && metric.trend !== 0 ? (
          metric.trend > 0 ? (
            <><TrendingUp className="size-3.5 text-emerald-600" /><span>{Math.abs(metric.trend)} more than previous period</span></>
          ) : (
            <><TrendingDown className="size-3.5 text-amber-600" /><span>{Math.abs(metric.trend)} fewer than previous period</span></>
          )
        ) : (
          <span>{metric.definition.periodBehaviour === 'Current' ? 'Current status' : metric.detail ?? metric.definition.description}</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1 text-sm text-slate-400">
        <Info className="size-3" />{metric.definition.description}
      </div>
    </button>
  );
}

export default function MemberDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get('view') ?? searchParams.get('tab');
  const activeTab = requestedView === 'chapter' ? 'chapter' : requestedView === 'organisation' ? 'organisation' : 'dashboard';
  const setTab = (tab: 'dashboard' | 'chapter' | 'organisation') => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'chapter' || tab === 'organisation') {
      next.set('view', tab);
      next.set('tab', tab);
    } else {
      next.delete('view');
      next.delete('tab');
    }
    setSearchParams(next, { replace: true });
  };

  const memberId = useAppSelector(activeMemberId);
  const member = useAppSelector(selectActiveMember);
  const organisationAssignment = useAppSelector(authorisedOrganisationAssignment);
  const scope = member?.chapter ? { type: 'Chapter', id: member.chapter } : undefined;
  const defaultPeriodSetting = useEffectiveSetting('member.dashboard.defaultPeriod', scope);
  const enabledMetricSetting = useEffectiveSetting('member.dashboard.metrics.enabled', scope);
  const chapterEnabledSetting = useEffectiveSetting('member.dashboard.chapter.enabled', scope);
  const recommendationsSetting = useEffectiveSetting('member.dashboard.recommendations.enabled', scope);
  const configuredPeriod = (['month', 'last-month', 'quarter', 'year'] as DashboardPeriodKey[]).includes(String(defaultPeriodSetting?.value) as DashboardPeriodKey) ? String(defaultPeriodSetting?.value) as DashboardPeriodKey : 'month';
  const [periodChoice, setPeriodChoice] = useState<DashboardPeriodKey | null>(null);
  const period = periodChoice ?? configuredPeriod;
  const affiliations = useAppSelector(s => s.network.affiliations.filter(a => a.memberId === memberId && a.active && a.verificationStatus === 'Verified'));
  const businesses = useAppSelector(s => s.network.businesses.filter(b => affiliations.some(a => a.businessId === b.id)));
  const [businessId, setBusinessId] = useState('all');
  const projection = useAppSelector(s => buildMemberDashboardProjection(s, memberId, period, businessId === 'all' ? undefined : businessId));
  const intelligence = useAppSelector(s => buildPersonalNetworkingAnalytics(s, memberId, period));
  const { go } = useMemberNavigation();
  const enabledMetricCodes = Array.isArray(enabledMetricSetting?.value) ? enabledMetricSetting.value.filter((x): x is string => typeof x === 'string') : [];
  const visiblePerformance = enabledMetricCodes.length ? projection.personalPerformance.filter(m => enabledMetricCodes.includes(m.definition.code)) : projection.personalPerformance;
  const chapterEnabled = chapterEnabledSetting?.value !== false;
  const recommendationsEnabled = recommendationsSetting?.value !== false;

  // Live Backend Analytics Integration
  const [liveSnapshot, setLiveSnapshot] = useState<NetworkAnalyticsSnapshotDto | null>(null);
  const [liveActionItems, setLiveActionItems] = useState<MemberActionItemDto[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [loadingLive, setLoadingLive] = useState(false);

  const fetchLiveAnalytics = () => {
    setLoadingLive(true);
    const controller = new AbortController();
    Promise.all([
      analyticsApi.getSnapshot(controller.signal).catch(() => null),
      analyticsApi.getActionItems(20, controller.signal).catch(() => null)
    ]).then(([snapshot, actions]) => {
      if (snapshot) {
        setLiveSnapshot(snapshot);
        setIsLiveConnected(true);
      }
      if (Array.isArray(actions)) {
        setLiveActionItems(actions);
      }
    }).finally(() => {
      setLoadingLive(false);
    });
  };

  useEffect(() => {
    fetchLiveAnalytics();
  }, [memberId]);

  const commandGroups = useMemo(() => [
    {
      title: 'My Network',
      description: 'Track connections, one-to-one meetings and trusted business references across your network.',
      categories: ['Network', 'Meetings', 'References'] as const,
    },
    {
      title: 'My Business Activity',
      description: 'Follow opportunities, responses and business outcomes generated through the network.',
      categories: ['Opportunities', 'Business Outcomes'] as const,
    },
    {
      title: 'My Engagement',
      description: 'See your community participation and keep your Member and Business profiles discovery-ready.',
      categories: ['Community', 'Profile'] as const,
    },
  ].map(group => ({
    ...group,
    sections: group.categories.map(category => ({
      category,
      metrics: visiblePerformance.filter(metric => metric.definition.category === category),
    })).filter(section => section.metrics.length > 0),
  })).filter(group => group.sections.length > 0), [visiblePerformance]);

  const tabsBar = (
    <div className="mb-6 flex border-b border-slate-200 pb-3">
      <Tabs
        ariaLabel="Dashboard views"
        value={activeTab}
        onChange={(t) => setTab(t as 'dashboard' | 'chapter' | 'organisation')}
        items={[
          { key: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { key: 'chapter', label: 'My Parivar', icon: Building2 },
          ...(organisationAssignment ? [{ key: 'organisation', label: `${organisationAssignment.unitType} Roll-up`, icon: Network }] : []),
        ]}
      />
    </div>
  );

  if (activeTab === 'organisation' && organisationAssignment) return <div>{tabsBar}<OrganisationInsightsView period={period} /></div>;
  if (activeTab === 'chapter') return <div>{tabsBar}{chapterEnabled ? <ChapterInsightsView period={(searchParams.get('period') as DashboardPeriodKey) || period} /> : <div><PageHead title="My Parivar Performance" /><EmptyState title="Parivar Insights are not enabled" body="Platform Administration has disabled this Member-view insight for your current scope." action={<Button variant="secondary" onClick={() => setTab('dashboard')}>Return to Dashboard</Button>} /></div>}</div>;

  const displayPendingTotal = liveSnapshot ? (liveSnapshot.connectionsPending + liveSnapshot.referencesPending + liveSnapshot.notesPendingFollowUp) : intelligence.pendingTotal;

  return (
    <div>
      <PageHead
        eyebrow={isLiveConnected ? "Database Live Analytics" : undefined}
        title="My Dashboard"
        description="Your actions, activity, business outcomes and upcoming commitments in one place."
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={fetchLiveAnalytics} disabled={loadingLive}>
              <RefreshCw className={`size-4 ${loadingLive ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="secondary" onClick={() => go('/app/home', { label: 'Dashboard' })}>Discover network</Button>
          </div>
        }
      />
      {tabsBar}

      {/* Chapter Membership & Approval Workflow Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-blue-50 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sky-600 p-2.5 text-white shadow-xs">
            <Building2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900">Parivar Membership & Approval Console</h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Live DB Workflow</span>
            </div>
            <p className="text-xs text-slate-600">
              Manage Bhandhu registration, payment gates, coordinator KYC verification, executive approvals, and chapter directories.
            </p>
          </div>
        </div>
        <Button
          onClick={() => go('/manage/chapter-workflow', { label: 'Dashboard' })}
          className="bg-[var(--navy-900)] text-white hover:bg-slate-800 rounded-xl font-bold text-xs py-2 px-3.5"
        >
          Open Chapter Console <ArrowRight className="size-3.5 ml-1 inline" />
        </Button>
      </div>
      <section className="mb-6 overflow-hidden rounded-[2rem] bg-[var(--navy-950)] text-white shadow-lg">
        <div className="grid gap-5 bg-[radial-gradient(circle_at_88%_12%,rgba(14,165,233,.22),transparent_32%)] p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-black uppercase tracking-[.16em] text-sky-200">Member context</div>
              {isLiveConnected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  <Zap className="size-3" /> Live API
                </span>
              )}
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{member?.name}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {member?.chapter} · data synced {new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-sm font-bold text-slate-200">
              <span>Performance period</span>
              <select value={period} onChange={e => setPeriodChoice(e.target.value as DashboardPeriodKey)} className="min-h-10 rounded-xl border border-white/20 bg-white px-3 text-sm font-semibold text-slate-900">
                {periodOptions.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </label>
            {businesses.length > 1 && (
              <label className="grid gap-1 text-sm font-bold text-slate-200">
                <span>Business</span>
                <select value={businessId} onChange={e => setBusinessId(e.target.value)} className="min-h-10 max-w-[260px] rounded-xl border border-white/20 bg-white px-3 text-sm font-semibold text-slate-900">
                  <option value="all">All My Businesses</option>
                  {businesses.map(b => <option value={b.id} key={b.id}>{b.name}</option>)}
                </select>
              </label>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 divide-y divide-white/10 sm:grid-cols-4 sm:divide-y-0 sm:divide-x divide-white/10 border-t border-white/10">
          {[
            [displayPendingTotal, 'Pending actions'],
            [liveSnapshot ? liveSnapshot.connectionsAccepted : businesses.length, liveSnapshot ? 'Connected Members' : 'Verified businesses'],
            [liveSnapshot ? liveSnapshot.opportunitiesCreated : projection.upcoming.length, liveSnapshot ? 'Opportunities Posted' : 'Upcoming commitments'],
            [liveSnapshot ? liveSnapshot.eventsRegistered : projection.recommendations.length, liveSnapshot ? 'Events Registered' : 'Recommendations']
          ].map(([value, label]) => (
            <div key={label} className="p-4 sm:p-5">
              <div className="text-2xl font-black tracking-tight sm:text-3xl">{value}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400 sm:text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Snapshot Cards */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[var(--navy-950)]">My Networking Snapshot</h2>
            <p className="text-sm text-slate-500">Live activity and what still needs attention.</p>
          </div>
          <Button variant="secondary" onClick={() => go('/app/activity?view=actions', { label: 'Dashboard' })}>
            {displayPendingTotal} pending
          </Button>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <h3 className="mb-3 font-black text-[var(--navy-950)]">One-to-One</h3>
            <AnalyticsSummary columns="compact" items={intelligence.relationships.meetings.slice(0, 6)} onOpen={route => go(route, { label: 'Dashboard' })} />
          </Card>
          <Card>
            <h3 className="mb-3 font-black text-[var(--navy-950)]">Business Generation</h3>
            <AnalyticsSummary columns="compact" items={[...intelligence.relationships.references, ...intelligence.business.opportunities].slice(0, 6)} onOpen={route => go(route, { label: 'Dashboard' })} />
          </Card>
        </div>
      </section>

      {/* Action Required */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[var(--navy-950)]">Action Required</h2>
            <p className="text-sm text-slate-500">Items that need a response or follow-up from you.</p>
          </div>
          {(liveActionItems.length > 0 || projection.actionRequired.length > 0) && (
            <Button variant="secondary" onClick={() => go('/app/activity?view=actions', { label: 'Dashboard' })}>
              View all actions <ArrowRight className="size-4" />
            </Button>
          )}
        </div>

        {liveActionItems.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {liveActionItems.map(a => (
              <div key={a.itemId} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="truncate text-sm text-slate-900">{a.title}</strong>
                    <StatusPill tone="warn">{a.kind}</StatusPill>
                  </div>
                  {a.dueAt && (
                    <div className="mt-1 text-sm text-slate-500">
                      Due {new Date(a.dueAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : projection.actionRequired.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {projection.actionRequired.slice(0, 6).map(a => (
              <button key={a.id} type="button" onClick={() => go(a.route, { label: 'Dashboard' })} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left hover:border-amber-300">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="truncate text-sm text-slate-900">{a.title}</strong>
                    <StatusPill tone={a.priority === 'Urgent' ? 'bad' : a.priority === 'High' ? 'warn' : 'info'}>{a.priority}</StatusPill>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.description}</p>
                  {a.dueAt && <div className="mt-1 text-sm text-slate-500">Due {new Date(a.dueAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</div>}
                </div>
                <ChevronRight className="size-4 shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="You're up to date" body="There are no immediate Member actions waiting for you." />
        )}
      </section>

      {/* Activity & Performance */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-black text-[var(--navy-950)]">My Activity & Performance</h2>
          <p className="text-sm text-slate-500">Factual activity and outcome measures for {projection.period.label.toLowerCase()}, grouped around the Bhandhu journey.</p>
        </div>
        <div className="grid gap-6">
          {commandGroups.map(group => (
            <Card key={group.title} className="p-5">
              <div className="mb-4">
                <h3 className="text-xl font-black text-[var(--navy-950)]">{group.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{group.description}</p>
              </div>
              <div className="grid gap-5">
                {group.sections.map(section => (
                  <div key={section.category}>
                    <h4 className="mb-2 text-sm font-black text-slate-700">{section.category}</h4>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {section.metrics.map(metric => (
                        <MetricCard key={metric.definition.code} metric={metric} onOpen={() => go(qs(metric.definition.drill.route, metric.definition.drill.params), { label: 'Dashboard' })} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* My Businesses */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <BriefcaseBusiness className="size-5 text-sky-700" />
          <div>
            <h2 className="text-lg font-black text-[var(--navy-950)]">My Businesses</h2>
            <p className="text-sm text-slate-500">Your verified affiliations, business readiness and network activity.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {projection.businessPerformance.map(b => (
            <Card key={b.businessId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button onClick={() => go(`/app/businesses/${b.businessId}`, { label: 'Dashboard' })} className="text-left text-lg font-black hover:text-sky-700 hover:underline">{b.name}</button>
                  <div className="mt-1 text-sm text-slate-500">{b.relationship ?? 'Affiliated Member'} · {b.verified ? 'Verified business' : 'Verification pending'}</div>
                </div>
                <StatusPill tone={b.profileCompleteness >= 85 ? 'good' : 'warn'}>{b.profileCompleteness}% complete</StatusPill>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div><div className="text-xl font-black">{b.activeCertifications}</div><div className="text-sm text-slate-500">Verified certs</div></div>
                <div><div className="text-xl font-black">{b.activeOpportunities}</div><div className="text-sm text-slate-500">Active opportunities</div></div>
                <div><div className="text-xl font-black">{b.responsesReceived}</div><div className="text-sm text-slate-500">Responses</div></div>
                <div><div className="text-xl font-black">{b.relationships}</div><div className="text-sm text-slate-500">Relationships</div></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => go(`/app/businesses/${b.businessId}`, { label: 'Dashboard' })}>View business</Button>
                <Button variant="ghost" onClick={() => go('/app/businesses', { label: 'Dashboard' })}>Manage affiliation</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Upcoming & Recommendations */}
      <section className={`mb-8 grid gap-5 ${recommendationsEnabled ? 'xl:grid-cols-2' : ''}`}>
        <Card>
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-sky-700" />
            <h2 className="font-black text-[var(--navy-950)]">Upcoming</h2>
          </div>
          <div className="mt-4 grid gap-2">
            {projection.upcoming.map(x => (
              <button key={`${x.kind}-${x.id}`} onClick={() => go(x.route, { label: 'Dashboard' })} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-sky-300">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold uppercase text-slate-400">{x.kind}</div>
                  <div className="truncate font-bold">{x.title}</div>
                  <div className="mt-1 text-sm text-slate-500">{new Date(x.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}{x.detail ? ` · ${x.detail}` : ''}</div>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </button>
            ))}
            {!projection.upcoming.length && <EmptyState title="No upcoming commitments" body="Your confirmed meetings, events and due dates will appear here." />}
          </div>
        </Card>
        {recommendationsEnabled && (
          <Card>
            <div className="flex items-center gap-2">
              <Target className="size-5 text-sky-700" />
              <h2 className="font-black text-[var(--navy-950)]">Recommended Next Actions</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {projection.recommendations.map(r => (
                <button key={r.id} onClick={() => go(r.route, { label: 'Dashboard' })} className="rounded-xl border border-slate-200 p-4 text-left hover:border-sky-300">
                  <div className="font-bold">{r.title}</div>
                  <div className="mt-1 text-sm text-slate-500">Why: {r.why}</div>
                </button>
              ))}
              {!projection.recommendations.length && <EmptyState title="No recommended actions" body="Your core profile and network actions are in good order." />}
            </div>
          </Card>
        )}
      </section>

      {/* Recent Activity */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Network className="size-5 text-sky-700" />
          <div>
            <h2 className="text-lg font-black text-[var(--navy-950)]">Recent Activity</h2>
            <p className="text-sm text-slate-500">Your recent network and business activity.</p>
          </div>
        </div>
        <Card>
          {projection.recentActivity.length ? (
            <div className="divide-y divide-slate-100">
              {projection.recentActivity.map(x => (
                <button key={x.id} onClick={() => go(x.route, { label: 'Dashboard' })} className="flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{x.label}</div>
                    <div className="truncate text-sm text-slate-500">{x.detail}</div>
                  </div>
                  <div className="shrink-0 text-sm text-slate-400">{new Date(x.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  <ChevronRight className="size-4 text-slate-300" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent activity" body="Connections, meetings, responses and references will appear here." />
          )}
        </Card>
      </section>
    </div>
  );
}
