import {useMemo} from 'react';
import {businessDateOnly} from '@/utils/businessDate';
import {useNavigate} from 'react-router-dom';
import {PageHeader} from '@/components/PageHeader';
import {CommandFeedback} from '@/components/CommandFeedback';
import {AsyncState} from '@/components/AsyncState';
import {EmptyState} from '@/components/EmptyState';
import {useOrg} from '@/state/OrgStore';
import {useOrgCommandAction} from '@/hooks/useOrgCommandAction';
import {useDomainProjection} from '@/hooks/useDomainProjection';
import {useRealtimeRefresh} from '@/hooks/useRealtimeRefresh';
import type {MemberSummary, NetworkingOperationsProjection} from '@/domain/types';
import {useRouteView} from '@/config/routeViews';
import {authStorage} from '@/utils/authStorage';
import {ShieldCheck, Lock} from 'lucide-react';

export default function GrowthNetworkingPage() {
  const s = useOrg();
  const isLeadershipTeam = authStorage.isLeadershipTeam();
  const isTrust = authStorage.isTrustUser();
  const isReadOnly = isLeadershipTeam || isTrust;
  const view = useRouteView(
    'Growth & Networking Operations',
    'Use Member-domain analytics to improve participation; never mutate canonical Member activity.'
  );
  const nav = useNavigate();
  const cmd = useOrgCommandAction();

  const local = useMemo<NetworkingOperationsProjection | undefined>(() => {
    const low = s.members.filter(m => (m.engagement ?? 100) < 60);
    if (s.networkingSummary) {
      return {
        ...s.networkingSummary,
        lowParticipation: low
      };
    }
    return {
      period: 'current',
      connections: 0,
      oneToOnes: 0,
      referencesGiven: 0,
      opportunityResponses: 0,
      recordedOutcomeValue: 0,
      lowParticipation: low,
      source: 'local'
    };
  }, [s.networkingSummary, s.members]);

  const req = useMemo(
    () => ({
      queryId: 'org.networking.summary' as const,
      organisationScope: s.scope.id,
      parameters: {period: 'current'}
    }),
    [s.scope.id]
  );

  const projection = useDomainProjection<NetworkingOperationsProjection | undefined>(req, local);
  useRealtimeRefresh(
    ['member.connection.*', 'member.meeting.*', 'member.reference.*', 'member.opportunity.*', 'member.outcome.*'],
    projection.reload
  );

  const n = projection.data;
  const lowList: MemberSummary[] = Array.isArray(n?.lowParticipation) ? n.lowParticipation : [];
  const connections = n?.connections ?? 0;
  const oneToOnes = n?.oneToOnes ?? 0;
  const referencesGiven = n?.referencesGiven ?? 0;
  const opportunityResponses = n?.opportunityResponses ?? 0;
  const outcomeDisplay = typeof n?.recordedOutcomeValue === 'number'
    ? `₹${(n.recordedOutcomeValue / 100000).toFixed(1)}L`
    : '₹0.0L';

  const follow = async (m: MemberSummary) => {
    if (isReadOnly) return;
    const task = {
      title: `Follow up ${m.name} participation`,
      description: 'Networking participation intervention',
      owner: s.actor.name,
      sourceType: 'MEMBER_NETWORKING',
      sourceId: m.id,
      due: businessDateOnly(7),
      priority: 'MEDIUM' as const,
      status: 'TODO' as const,
      scope: s.scope
    };
    return cmd.run(
      {
        commandType: 'org.task.create',
        aggregateType: 'Task',
        payload: task,
        reason: 'Networking participation follow-up'
      },
      () => s.dispatch({type: 'ADD_TASK', payload: task})
    );
  };

  return (
    <>
      <PageHeader
        title={view.title}
        actions={
          isLeadershipTeam ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Leadership Team (Read-Only)
            </span>
          ) : undefined
        }
      >
        {view.description}
      </PageHeader>
      {isLeadershipTeam && (
        <div className="mb-5 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Leadership Team View:</strong> You have strictly <strong>read-only</strong> access to chapter growth and networking telemetry. Follow-up interventions are managed by Officeholders.
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
            Read-Only
          </span>
        </div>
      )}
      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />
      <AsyncState loading={projection.loading} refreshing={projection.refreshing} stale={projection.stale} error={projection.error} onRetry={projection.reload}>
        {n ? (
          <>
            <div className="grid metrics grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              <div className="card metric p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                <strong className="text-2xl font-bold text-slate-900 block">{connections}</strong>
                <span className="text-xs text-slate-500 mt-1 block">Connections</span>
              </div>
              <div className="card metric p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                <strong className="text-2xl font-bold text-slate-900 block">{oneToOnes}</strong>
                <span className="text-xs text-slate-500 mt-1 block">One-to-Ones</span>
              </div>
              <div className="card metric p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                <strong className="text-2xl font-bold text-slate-900 block">{referencesGiven}</strong>
                <span className="text-xs text-slate-500 mt-1 block">References given</span>
              </div>
              <div className="card metric p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                <strong className="text-2xl font-bold text-slate-900 block">{opportunityResponses}</strong>
                <span className="text-xs text-slate-500 mt-1 block">Opportunity responses</span>
              </div>
              <div className="card metric p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                <strong className="text-2xl font-bold text-slate-900 block">{outcomeDisplay}</strong>
                <span className="text-xs text-slate-500 mt-1 block">Recorded outcomes</span>
              </div>
            </div>

            <div className="split grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs" hidden={view.path === '/org/networking'}>
                <h2 className="text-base font-bold text-slate-900 mb-2">Membership growth</h2>
                <p className="text-xs text-slate-600 mb-4">
                  Growth pipeline totals and conversion stages are backend-owned read models; they must not be inferred from incomplete Member status arrays.
                </p>
                <div className="row-actions flex flex-wrap gap-2">
                  <button className="btn px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors min-h-[44px]" onClick={() => nav('/org/members')}>
                    View Members
                  </button>
                  <button className="btn px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors min-h-[44px]" onClick={() => nav('/org/reports')}>
                    Growth report
                  </button>
                </div>
              </div>

              <div className="card p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 mb-4">Low participation requiring support</h2>
                {lowList.length ? (
                  <div className="divide-y divide-slate-100">
                    {lowList.map(m => (
                      <div className="row flex items-center justify-between py-3" key={m.id}>
                        <div>
                          <b className="font-semibold text-slate-900">{m.name}</b>
                          <div className="row-meta text-xs text-slate-500 mt-0.5">
                            {m.specialisation || 'General Member'} · engagement {m.engagement ?? 50}%
                          </div>
                        </div>
                        <div className="row-actions flex items-center gap-2">
                          <button
                            className="btn px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors min-h-[44px]"
                            onClick={() => nav(`/org/members/${m.id}`)}
                          >
                            Open Member
                          </button>
                          {!isReadOnly ? (
                            <button
                              className="btn primary px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs transition-colors min-h-[44px]"
                              disabled={cmd.busy}
                              onClick={() => void follow(m)}
                            >
                              Create follow-up
                            </button>
                          ) : (
                            <button
                              className="btn px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-400 text-xs font-medium shadow-2xs min-h-[44px] cursor-not-allowed inline-flex items-center gap-1.5"
                              disabled
                              title="Read-only: Follow-up creation is managed by Parivar Officeholders"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Follow-up (Restricted)
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No low-participation Members in this scope" />
                )}
              </div>
            </div>
          </>
        ) : (
          <EmptyState title="Networking analytics are not available for this scope" />
        )}
      </AsyncState>
    </>
  );
}

