import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { CommandFeedback } from '@/components/CommandFeedback';
import { AsyncState } from '@/components/AsyncState';
import { EmptyState } from '@/components/EmptyState';
import { useOrg } from '@/state/OrgStore';
import { useOrgCommandAction } from '@/hooks/useOrgCommandAction';
import { useDomainProjection } from '@/hooks/useDomainProjection';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import type { ReportsSummaryProjection } from '@/domain/types';
import { useRouteView } from '@/config/routeViews';

export default function ReportsPage() {
  const s = useOrg();
  const view = useRouteView('Reports & Operational Intelligence', 'Every metric must drill to source evidence; large reports execute as jobs.');
  const cmd = useOrgCommandAction();
  const [last, setLast] = useState('');

  const local = useMemo<ReportsSummaryProjection>(() => ({
    taskCompleted: s.tasks.filter((t) => t.status === 'DONE').length,
    taskTotal: s.tasks.length,
    openMemberCases: s.cases.filter((c) => c.status !== 'Closed').length,
    openSupportRequests: s.support.filter((x) => x.status !== 'Closed').length,
    auditEvents: s.audits.length,
    volunteerEffort: []
  }), [s.tasks, s.cases, s.support, s.audits]);

  const req = useMemo(() => ({
    queryId: 'org.reports.summary',
    organisationScope: s.scope.id,
    parameters: { period: 'current' }
  }), [s.scope.id]);

  const projection = useDomainProjection<ReportsSummaryProjection>(req, local);
  useRealtimeRefresh(['org.task.*', 'org.member-case.*', 'org.support-request.*', 'org.audit.*'], projection.reload);

  const generate = async (name: string) => {
    const result = await cmd.run(
      {
        commandType: 'org.job.request',
        aggregateType: 'Job',
        payload: { kind: 'REPORT', title: name, scope: s.scope.id },
        reason: `Generate ${name} report`
      },
      () => s.dispatch({ type: 'ADD_JOB', payload: { kind: 'REPORT', title: name } })
    );
    if (result.ok) setLast(name);
  };

  const d = projection.data as any;
  const rawSummary = d?.summary;

  const taskCompleted = d?.taskCompleted ?? rawSummary?.taskCompleted ?? local.taskCompleted ?? 0;
  const taskTotal = d?.taskTotal ?? rawSummary?.taskTotal ?? local.taskTotal ?? 0;
  const openMemberCases = d?.openMemberCases ?? rawSummary?.openMemberCases ?? local.openMemberCases ?? 0;
  const openSupportRequests = d?.openSupportRequests ?? rawSummary?.openSupportRequests ?? local.openSupportRequests ?? 0;
  const auditEvents = d?.auditEvents ?? rawSummary?.auditEvents ?? local.auditEvents ?? 0;

  const volunteerEffort = (d?.volunteerEffort && d.volunteerEffort.length > 0)
    ? d.volunteerEffort
    : (rawSummary?.volunteerEffort && rawSummary.volunteerEffort.length > 0)
    ? rawSummary.volunteerEffort
    : local.volunteerEffort;

  return (
    <>
      <PageHeader title={view.title}>{view.description}</PageHeader>
      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      <AsyncState loading={projection.loading} refreshing={projection.refreshing} stale={projection.stale} error={projection.error} onRetry={projection.reload}>
        <div className="grid metrics grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
          <Link className="card metric p-4 lg:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all block" to="/org/tasks">
            <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block">
              {taskCompleted}/{taskTotal}
            </strong>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1 block">
              Task closure · open evidence
            </span>
          </Link>

          <Link className="card metric p-4 lg:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all block" to="/org/member-cases">
            <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block">
              {openMemberCases}
            </strong>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1 block">
              Open Member cases · evidence
            </span>
          </Link>

          <Link className="card metric p-4 lg:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all block" to="/org/support">
            <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block">
              {openSupportRequests}
            </strong>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1 block">
              Open support requests · evidence
            </span>
          </Link>

          <Link className="card metric p-4 lg:p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all block" to="/org/audit">
            <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block">
              {auditEvents}
            </strong>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1 block">
              Audited changes · evidence
            </span>
          </Link>
        </div>
      </AsyncState>

      {last && (
        <div className="callout my-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs">
          Report job requested for <b className="font-bold">{last}</b>. Generation is asynchronous, auditable and expiring.
        </div>
      )}

      <div className="split mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 mb-3">Reports</h2>
          <div className="space-y-2">
            {[
              'Membership & lifecycle',
              'Networking outcomes',
              'Chapter health',
              'Working Committees',
              'Programmes & Events',
              'Meetings / MoM / Actions',
              'Member Cases',
              'Support / Escalations',
              'Dues / reconciliation',
              'Operational risk'
            ].map((x) => (
              <div className="row p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3" key={x}>
                <b className="text-sm font-bold text-slate-900">{x}</b>
                <button
                  className="btn px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 min-h-[44px] transition-colors disabled:opacity-50"
                  disabled={cmd.busy}
                  onClick={() => void generate(x)}
                >
                  Generate
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 mb-3">Volunteer effort & automation</h2>
          {volunteerEffort?.length ? (
            <div className="space-y-2">
              {volunteerEffort.map((x: any) => (
                <div className="row p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3" key={x.key}>
                  <span className="text-sm text-slate-700">{x.label}</span>
                  <b className="text-sm font-bold text-slate-900">
                    {x.value} {x.unit}
                  </b>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 leading-relaxed">
              Measured volunteer-effort and automation values appear only when backend telemetry/read models provide them. The frontend does not manufacture percentages or durations.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
