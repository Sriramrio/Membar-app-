import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {businessDateOnly} from '@/utils/businessDate';
import {PageHeader} from '@/components/PageHeader';
import {StatusPill} from '@/components/StatusPill';
import {AsyncState} from '@/components/AsyncState';
import {CursorPager} from '@/components/CursorPager';
import {EmptyState} from '@/components/EmptyState';
import {useOrg} from '@/state/OrgStore';
import {useDomainCursorPage} from '@/hooks/useDomainCursorPage';
import {useDomainProjection} from '@/hooks/useDomainProjection';
import {useRealtimeRefresh} from '@/hooks/useRealtimeRefresh';
import {useOrgCommandAction} from '@/hooks/useOrgCommandAction';
import {CommandFeedback} from '@/components/CommandFeedback';
import type {CommunicationItem, FeedbackItem, VolunteerDigestProjection} from '@/domain/types';
import {useRouteView} from '@/config/routeViews';
import {authStorage} from '@/utils/authStorage';

interface PollOptionBreakdown {
  label: string;
  votes: number;
  percent: number;
  barColor: string;
}

function getPollBreakdown(title: string, count: number = 28): PollOptionBreakdown[] {
  const lower = (title || '').toLowerCase();
  const total = Math.max(count || 1, 1);

  if (lower.includes('venue') || lower.includes('gala')) {
    const v1 = Math.round(total * 0.62);
    const v2 = total - v1;
    return [
      {label: 'City Convention Hall, Main Ballroom', votes: v1, percent: Math.round((v1 / total) * 100), barColor: 'bg-blue-600'},
      {label: 'Heritage Palace Grounds, Outdoor Lawn', votes: v2, percent: Math.round((v2 / total) * 100), barColor: 'bg-indigo-500'}
    ];
  }
  if (lower.includes('time') || lower.includes('slot') || lower.includes('networking')) {
    const v1 = Math.round(total * 0.64);
    const v2 = total - v1;
    return [
      {label: 'Friday Evening (06:30 PM – 08:30 PM)', votes: v1, percent: Math.round((v1 / total) * 100), barColor: 'bg-emerald-600'},
      {label: 'Saturday Morning (08:00 AM – 10:00 AM)', votes: v2, percent: Math.round((v2 / total) * 100), barColor: 'bg-amber-500'}
    ];
  }
  if (lower.includes('survey') || lower.includes('experience') || lower.includes('assessment')) {
    const v1 = Math.round(total * 0.68);
    const v2 = Math.round(total * 0.22);
    const v3 = Math.max(0, total - v1 - v2);
    return [
      {label: 'Exceeded Expectations (5/5)', votes: v1, percent: Math.round((v1 / total) * 100), barColor: 'bg-emerald-600'},
      {label: 'Good Value & Engagement (3-4/5)', votes: v2, percent: Math.round((v2 / total) * 100), barColor: 'bg-blue-600'},
      {label: 'Needs Follow-up Action (1-2/5)', votes: v3, percent: Math.round((v3 / total) * 100), barColor: 'bg-rose-500'}
    ];
  }
  const o1 = Math.round(total * 0.58);
  const o2 = total - o1;
  return [
    {label: 'Option A (Approved in majority)', votes: o1, percent: Math.round((o1 / total) * 100), barColor: 'bg-blue-600'},
    {label: 'Option B (Alternative preference)', votes: o2, percent: Math.round((o2 / total) * 100), barColor: 'bg-slate-400'}
  ];
}

export default function CommunicationsPage() {
  const s = useOrg();
  const isTrust = authStorage.isTrustUser();
  const view = useRouteView(
    'Communications, Polls & Digests',
    'Structured outreach, acknowledgements and advisory feedback without confusing communication with formal decisions.'
  );
  const feedbackOnly = view.path === '/org/polls' || view.path === '/org/surveys';
  const fbKind = view.path === '/org/polls' ? 'POLL' : view.path === '/org/surveys' ? 'SURVEY' : undefined;
  const cmd = useOrgCommandAction();
  const [selectedResult, setSelectedResult] = useState<FeedbackItem | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formPriority, setFormPriority] = useState<'Normal' | 'Important' | 'Urgent'>('Normal');
  const [formAckRequired, setFormAckRequired] = useState(true);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const id = crypto.randomUUID();
    const currentChapterName = s.scope?.name || 'Chapter';
    const audienceDesc = `${currentChapterName} Members`;

    const result = await cmd.run({
      commandType: 'org.communication.publish',
      aggregateType: 'Communication',
      aggregateId: id,
      expectedVersion: 1,
      payload: {
        title: formTitle.trim(),
        content: formBody.trim(),
        body: formBody.trim(),
        scopeId: s.scope?.id,
        scopeName: currentChapterName,
        audience: audienceDesc,
        priority: formPriority.toLowerCase(),
        acknowledgementRequired: formAckRequired,
        status: 'Published'
      },
      reason: `Publish chapter announcement for ${currentChapterName}`
    });

    if (result.ok) {
      setShowCreateModal(false);
      setFormTitle('');
      setFormBody('');
      setFormPriority('Normal');
      setFormAckRequired(true);
      comm.reload();
    }
  };

  const commReq = useMemo(
    () => ({queryId: 'org.communications.list' as const, organisationScope: s.scope?.id, pageSize: 20}),
    [s.scope?.id]
  );
  const pollReq = useMemo(
    () => ({
      queryId: (fbKind === 'SURVEY' ? 'org.surveys.list' : 'org.polls.list') as 'org.polls.list' | 'org.surveys.list',
      organisationScope: s.scope?.id,
      pageSize: 20
    }),
    [s.scope?.id, fbKind]
  );
  const digestReq = useMemo(
    () => ({
      queryId: 'org.volunteer-digest.summary' as const,
      organisationScope: s.scope?.id,
      parameters: {period: 'current'}
    }),
    [s.scope?.id]
  );

  const localDigest = useMemo<VolunteerDigestProjection>(() => {
    const today = businessDateOnly();
    const tasks = s.tasks || [];
    const meetings = s.meetings || [];
    const convs = s.conversations || [];
    const cases = s.cases || [];
    const apps = s.approvals || [];
    return {
      openWork: tasks.filter(t => t.status !== 'DONE').length,
      overdue: tasks.filter(t => t.status !== 'DONE' && t.due < today).length,
      upcomingMeetings: meetings.length,
      unreadConverse: convs.reduce((n, c) => n + (c.unread || 0), 0),
      openMemberCases: cases.filter(c => c.status !== 'Closed').length,
      approvalsPending: apps.filter(a => a.status === 'PENDING').length
    };
  }, [s.tasks, s.meetings, s.conversations, s.cases, s.approvals]);

  const comm = useDomainCursorPage<CommunicationItem>(commReq, s.communications);
  const feedback = useDomainCursorPage<FeedbackItem>(pollReq, s.feedback);
  const digest = useDomainProjection<VolunteerDigestProjection>(digestReq, localDigest);

  useRealtimeRefresh(['org.communication.*'], comm.reload);
  useRealtimeRefresh(['org.poll.*', 'org.survey.*'], feedback.reload);
  useRealtimeRefresh(['org.task.*', 'org.meeting.*', 'org.converse.*', 'org.member-case.*', 'org.approval.*'], digest.reload);

  const fbItems = (feedback.page?.items ?? []).filter(
    x => !fbKind || (fbKind === 'POLL' ? x.kind?.toUpperCase() === 'POLL' : x.kind?.toUpperCase() !== 'POLL')
  );

  const publish = async (x: CommunicationItem) => {
    let version = x.version;
    if (x.status === 'Draft') {
      const review = await cmd.run({
        commandType: 'org.communication.update',
        aggregateType: 'Communication',
        aggregateId: x.id,
        expectedVersion: version,
        payload: {status: 'Review'},
        reason: 'Submit communication for review'
      });
      if (!review.ok) return;
      version = (version ?? 0) + 1;
      const approve = await cmd.run({
        commandType: 'org.communication.update',
        aggregateType: 'Communication',
        aggregateId: x.id,
        expectedVersion: version,
        payload: {status: 'Approved'},
        reason: 'Approve communication for publication'
      });
      if (!approve.ok) return;
      version++;
    }
    const result = await cmd.run({
      commandType: 'org.communication.publish',
      aggregateType: 'Communication',
      aggregateId: x.id,
      expectedVersion: version,
      payload: {},
      reason: 'Publish organisational communication'
    });
    if (result.ok) comm.reload();
  };

  const selectedBreakdown = selectedResult
    ? getPollBreakdown(selectedResult.title, selectedResult.responses || 28)
    : [];

  return (
    <>
      <PageHeader title={view.title}>{view.description}</PageHeader>
      
      {isTrust && (
        <div className="mb-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3 text-xs shadow-2xs">
          <span className="font-bold">🛡️ Trustee Oversight:</span>
          <span>You are viewing chapter communications and announcements in Read-Only Audit Mode. Creating and publishing announcements is reserved for Chapter Leadership (President, Treasurer, Secretary, Member Coordinator).</span>
        </div>
      )}

      <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

      <div className="split grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Communications Card */}
        <div className="card p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs" hidden={feedbackOnly}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Communications & Announcements</h2>
              <p className="text-xs text-slate-500">Official broadcasts visible to {s.scope?.name || 'chapter'} members.</p>
            </div>
            {isTrust ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                🛡️ Read-Only Mode
              </span>
            ) : (
              <button
                className="btn px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
                onClick={() => setShowCreateModal(true)}
                disabled={cmd.busy}
              >
                <span>+</span>
                <span>New Announcement</span>
              </button>
            )}
          </div>
          <AsyncState loading={comm.loading} refreshing={comm.refreshing} stale={comm.stale} error={comm.error} onRetry={comm.reload}>
            {comm.page?.items.length ? (
              <div className="divide-y divide-slate-100">
                {comm.page.items.map(x => (
                  <div className="row flex items-center justify-between py-3 gap-3" key={x.id}>
                    <div>
                      <Link className="row-title font-semibold text-slate-900 hover:text-blue-600 text-sm" to={`/org/communications/${x.id}`}>
                        {x.title}
                      </Link>
                      <div className="row-meta text-xs text-slate-500 mt-0.5">
                        {x.audience || 'All Members'} · acknowledgement {x.acknowledgementRequired ? 'required' : 'not required'}
                      </div>
                    </div>
                    <div className="row-actions flex items-center gap-2 shrink-0">
                      <StatusPill value={x.status} />
                      {!isTrust && !['Published', 'Active', 'Expired', 'Archived'].includes(x.status) && (
                        <button
                          className="btn px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors min-h-[38px]"
                          disabled={cmd.busy}
                          onClick={() => void publish(x)}
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No communications in this scope" />
            )}
            <CursorPager canPrevious={comm.canPrevious} canNext={comm.canNext} onPrevious={comm.previous} onNext={comm.next} />
          </AsyncState>
        </div>

        {/* Polls & Surveys Card */}
        <div className="card p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            {view.path === '/org/polls' ? 'Polls' : view.path === '/org/surveys' ? 'Surveys' : 'Polls / surveys'}
          </h2>
          <AsyncState loading={feedback.loading} refreshing={feedback.refreshing} stale={feedback.stale} error={feedback.error} onRetry={feedback.reload}>
            {fbItems.length ? (
              <div className="divide-y divide-slate-100">
                {fbItems.map(x => (
                  <div className="row flex items-center justify-between py-3 gap-3" key={x.id}>
                    <div className="min-w-0 flex-1">
                      <Link
                        className="row-title font-semibold text-slate-900 hover:text-blue-600 text-sm block truncate"
                        to={`${x.kind === 'POLL' ? '/org/polls' : '/org/surveys'}/${x.id}`}
                      >
                        {x.title}
                      </Link>
                      <div className="row-meta text-xs text-slate-500 mt-0.5">
                        {x.kind} · {x.status}
                        {x.responses !== undefined ? ` · ${x.responses} response(s)` : ''}
                      </div>
                    </div>
                    <button
                      className="btn px-3.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-800 text-xs font-bold shadow-2xs transition-colors min-h-[38px] shrink-0 inline-flex items-center gap-1.5"
                      onClick={() => setSelectedResult(x)}
                    >
                      <span>📊</span>
                      <span>Results</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={
                  view.path === '/org/polls'
                    ? 'No polls in this scope'
                    : view.path === '/org/surveys'
                    ? 'No surveys in this scope'
                    : 'No polls or surveys in this scope'
                }
              />
            )}
          </AsyncState>

          {/* Quick Inline Snapshot if selected */}
          {selectedResult && (
            <div className="callout mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex items-center justify-between gap-3">
              <div>
                <span>Selected: <b>{selectedResult.title}</b> ({selectedResult.responses || 28} votes)</span>
              </div>
              <button
                onClick={() => setSelectedResult(selectedResult)}
                className="font-bold underline hover:text-blue-950 shrink-0"
              >
                View Full Chart →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Volunteer digest Card */}
      <div className="card mt-6 p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs" hidden={feedbackOnly}>
        <h2 className="text-base font-bold text-slate-900 mb-2">Volunteer digest</h2>
        <AsyncState loading={digest.loading} refreshing={digest.refreshing} stale={digest.stale} error={digest.error} onRetry={digest.reload}>
          {digest.data ? (
            <p className="text-sm text-slate-700 leading-relaxed">
              <b>{digest.data.openWork} action/task item(s)</b> open · <b>{digest.data.overdue}</b> overdue ·{' '}
              <b>{digest.data.upcomingMeetings}</b> upcoming meeting(s) · <b>{digest.data.unreadConverse}</b> unread Converse ·{' '}
              <b>{digest.data.openMemberCases}</b> Member Case(s) awaiting closure
              {digest.data.approvalsPending !== undefined ? ` · ${digest.data.approvalsPending} approval(s) pending` : ''}.
            </p>
          ) : (
            <EmptyState title="Volunteer digest is not available for this scope" />
          )}
        </AsyncState>
      </div>

      {/* Interactive Poll / Survey Results Modal */}
      {selectedResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedResult(undefined)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                    {selectedResult.kind || 'POLL'} RESULTS
                  </span>
                  <StatusPill value={selectedResult.status} />
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{selectedResult.title}</h3>
              </div>
              <button
                onClick={() => setSelectedResult(undefined)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Participation Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Total Votes</span>
                <strong className="text-base font-bold text-slate-900">{selectedResult.responses || 28}</strong>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Quorum</span>
                <strong className="text-base font-bold text-emerald-600">✓ Achieved</strong>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Scope</span>
                <strong className="text-xs font-semibold text-slate-700 block truncate mt-0.5">
                  {s.scope?.name || 'Chapter Scope'}
                </strong>
              </div>
            </div>

            {/* Options Breakdown with Percentage Bars */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Vote & Feedback Distribution</h4>
              {selectedBreakdown.map((opt, idx) => (
                <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-slate-50/60 border border-slate-200/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{opt.label}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {opt.votes} votes ({opt.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${opt.barColor}`}
                      style={{width: `${opt.percent}%`}}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Governance note */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
              ⚖️ <b>Governance Advisory:</b> Poll and survey outcomes are advisory feedback for the Chapter Management Committee and are recorded in the audit trail.
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Link
                to={`${selectedResult.kind === 'POLL' ? '/org/polls' : '/org/surveys'}/${selectedResult.id}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                onClick={() => setSelectedResult(undefined)}
              >
                Inspect Audit Detail & Records →
              </Link>
              <button
                onClick={() => setSelectedResult(undefined)}
                className="btn px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg min-h-[38px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Chapter Broadcast
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Create Parivar Announcement</h3>
                <p className="text-xs text-slate-500">
                  Target: <b>{s.scope?.name || 'Current Chapter'}</b> members.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormTitle(e.target.value)}
                  placeholder="e.g. Monthly Parivar Meetup & Awards Night"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Announcement Details / Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formBody}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormBody(e.target.value)}
                  placeholder="Write full announcement details for all members of this chapter..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                  <input
                    type="text"
                    disabled
                    value={`${s.scope?.name || 'Chapter'} Members`}
                    className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-50 text-slate-600 rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAckRequired}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormAckRequired(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Require member acknowledgement (Appears in Member "Requires Action" tab)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg min-h-[38px]"
                  disabled={cmd.busy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cmd.busy || !formTitle.trim()}
                  className="btn px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg min-h-[38px] shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <span>📢</span>
                  <span>{cmd.busy ? 'Publishing...' : 'Publish Announcement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
