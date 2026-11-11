import { useMemo, useState } from 'react';
import { businessDateOnly } from '@/utils/businessDate';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useOrg } from '@/state/OrgStore';
import { RecordNotFound } from '@/components/RecordNotFound';
import { StatusPill } from '@/components/StatusPill';
import { CommandFeedback } from '@/components/CommandFeedback';
import { AsyncState } from '@/components/AsyncState';
import { EmptyState } from '@/components/EmptyState';
import { useOrgCommandAction } from '@/hooks/useOrgCommandAction';
import { useDomainRecord } from '@/hooks/useDomainRecord';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import type { ActionItem, Meeting } from '@/domain/types';
import { canPublishMom } from '@/domain/stateMachines';
import { CalendarDays, CheckCircle2, ArrowRight } from 'lucide-react';

function UsersIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function FileTextIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function CheckSquareIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export default function MeetingDetailPage() {
  const { id } = useParams();
  const s = useOrg();
  const cmd = useOrgCommandAction();
  const [decision, setDecision] = useState('');
  const [summary, setSummary] = useState('');
  const [owner, setOwner] = useState(s.actor.name);
  const [due, setDue] = useState(businessDateOnly(10));
  const [showCandidates, setShowCandidates] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const local = s.meetings.find(x => x.id === id);
  const detail = useDomainRecord<Meeting & { minutes?: string; momPublished?: boolean }>(
    { entityType: 'MEETING', id, organisationScope: s.scope.id },
    local,
    Boolean(id)
  );

  const localCandidates = useMemo(() => s.actions.filter(a => a.status !== 'DONE'), [s.actions]);
  const candidateReq = useMemo(
    () => ({
      queryId: 'org.meeting.agenda-candidates',
      organisationScope: s.scope.id,
      parameters: { meetingId: id },
      pageSize: 25,
    }),
    [s.scope.id, id]
  );
  const candidates = useDomainCursorPage<ActionItem>(candidateReq, localCandidates, [id], Boolean(id));

  useRealtimeRefresh(['org.meeting.*', 'org.mom.*'], detail.reload, e => !id || !e.aggregateId || e.aggregateId === id);
  useRealtimeRefresh(['org.action.*', 'org.task.*'], candidates.reload);

  const m = detail.record;
  if (!detail.loading && !m && !detail.error) {
    return <RecordNotFound title="Meeting not found" backTo="/org/meetings" backLabel="Back to Meetings" />;
  }

  const participants = Array.isArray(m?.participants)
    ? m.participants
    : m?.participants
      ? [String(m.participants)]
      : [s.actor?.name || 'Organizer'];

  const agenda = Array.isArray(m?.agenda)
    ? m.agenda
    : m?.agenda
      ? [String(m.agenda)]
      : ['Review open actions', 'General discussion'];

  const quorumRequired = typeof m?.quorumRequired === 'number' ? m.quorumRequired : 1;
  const isMomAlreadyPublished = Boolean(m?.momPublished || m?.status === 'Actions Active' || (m?.minutes && m.minutes.trim().length > 0));

  const publish = async () => {
    if (!m) return;
    const quorum = participants.length >= quorumRequired;
    if (!quorum || !owner.trim() || !due) return;

    const composedDecision = decision.trim() || `Follow through: ${m.title}`;
    const composedMinutes = decision.trim()
      ? `Decision: ${decision.trim()}${summary.trim() ? `\n\nSummary: ${summary.trim()}` : ''}`
      : summary.trim() || `Follow through: ${m.title}`;

    const payload = {
      meetingId: m.id,
      minutes: composedMinutes,
      summary: summary.trim(),
      decision: composedDecision,
      owner: owner.trim(),
      due,
    };

    const result = await cmd.run(
      {
        commandType: 'org.mom.publish',
        aggregateType: 'Meeting',
        aggregateId: m.id,
        expectedVersion: m.version,
        payload,
        reason: 'Publish operational MoM and follow-through',
      },
      () =>
        s.dispatch({
          type: 'MEETING_FOLLOW_THROUGH',
          payload: {
            meetingId: m.id,
            title: composedDecision,
            owner: owner.trim(),
            due,
            decision: composedDecision,
          },
        })
    );

    if (result.ok) {
      setSavedSuccess(true);
      setDecision('');
      setSummary('');
      detail.reload();
      candidates.reload();
    }
  };

  return (
    <AsyncState
      loading={detail.loading}
      refreshing={detail.refreshing}
      stale={detail.stale}
      error={detail.error}
      onRetry={detail.reload}
    >
      {m && (() => {
        const quorum = participants.length >= quorumRequired;
        const momPublished = isMomAlreadyPublished || savedSuccess;

        return (
          <div className="space-y-6">
            <PageHeader title={m.title}>
              <div className="inline-flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="font-semibold text-slate-700">{m.type}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5 text-slate-400" />
                  {new Date(m.scheduledAt).toLocaleString()}
                </span>
                <span>•</span>
                <span>Location: {m.location || 'Hosur Conference Hall'}</span>
              </div>
            </PageHeader>

            <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry} />

            {/* MoM Published & Follow-through Active Banner */}
            {momPublished && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Minutes of Meeting (MoM) Published & Follow-through Active
                    </h3>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Resolutions recorded and governed follow-through tasks are active in the Action Register.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Link
                    to="/org/tasks"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
                    style={{ color: '#ffffff' }}
                  >
                    <span>View Action Register</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid metrics grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="card metric p-4 lg:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Participants</span>
                  <UsersIcon className="size-4 text-slate-400" />
                </div>
                <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block">
                  {participants.length}
                </strong>
                <span className="text-[11px] text-slate-500 block mt-0.5">Assigned attendees</span>
              </div>

              <div className="card metric p-4 lg:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required Quorum</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">Min</span>
                </div>
                <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block">
                  {quorumRequired}
                </strong>
                <span className="text-[11px] text-slate-500 block mt-0.5">Voting threshold</span>
              </div>

              <div className="card metric p-4 lg:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quorum Achieved</span>
                  {quorum ? (
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  ) : (
                    <span className="size-2 rounded-full bg-amber-500" />
                  )}
                </div>
                <strong
                  className={`text-2xl lg:text-3xl font-extrabold tracking-tight block ${
                    quorum ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {quorum ? 'Yes' : 'No'}
                </strong>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {quorum ? 'Quorum requirement met' : 'Quorum not reached'}
                </span>
              </div>

              <div className="card metric p-4 lg:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agenda Items</span>
                  <FileTextIcon className="size-4 text-slate-400" />
                </div>
                <strong className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight block">
                  {agenda.length}
                </strong>
                <span className="text-[11px] text-slate-500 block mt-0.5">Scheduled topics</span>
              </div>
            </div>

            {/* Published MoM Details Card (If Published) */}
            {momPublished && m.minutes && (
              <div className="card p-5 lg:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="size-4 text-[#1b5fa7]" />
                    <h2 className="text-base font-bold text-slate-900">Official Minutes of Meeting (MoM)</h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <CheckSquareIcon className="size-3.5" />
                    Published Record
                  </span>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
                  <pre className="font-sans text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {m.minutes}
                  </pre>
                </div>
              </div>
            )}

            {/* Split Grid: Smart Agenda vs Meeting Control */}
            <div className="split grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: Smart Agenda */}
              <div className="card p-5 lg:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-900">Smart Agenda</h2>
                    <span className="text-xs font-medium text-slate-500">{agenda.length} topics</span>
                  </div>

                  <ol className="space-y-2.5 text-sm text-slate-700 mb-6">
                    {agenda.map((a, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                        <span className="size-5 rounded-full bg-[#1b5fa7]/10 text-[#1b5fa7] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-800">{a}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <button
                    type="button"
                    className="btn px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 min-h-[42px] transition-colors cursor-pointer w-full sm:w-auto"
                    onClick={() => setShowCandidates(x => !x)}
                  >
                    {showCandidates ? 'Hide' : 'Review'} previous open actions
                  </button>

                  {showCandidates && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <AsyncState
                        loading={candidates.loading}
                        refreshing={candidates.refreshing}
                        stale={candidates.stale}
                        error={candidates.error}
                        onRetry={candidates.reload}
                      >
                        {candidates.page?.items.length ? (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {candidates.page.items.map(a => (
                              <Link
                                key={a.id}
                                className="row link-row p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 transition-all"
                                to={`/org/actions/${a.id}`}
                              >
                                <div>
                                  <b className="text-sm font-bold text-slate-900">{a.title}</b>
                                  <div className="row-meta text-xs text-slate-500 mt-0.5">
                                    {a.owner} · due {a.due}
                                  </div>
                                </div>
                                <StatusPill value={a.status} />
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <EmptyState title="No open agenda candidates" />
                        )}
                      </AsyncState>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Meeting Control */}
              <div className="card p-5 lg:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900">Meeting Control</h2>
                  <StatusPill value={momPublished ? 'Actions Active' : m.status} />
                </div>

                <div className="row p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 mb-4">
                  <div>
                    <b className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Governance Status</b>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {momPublished
                        ? 'MoM published. Follow-through tasks are actively tracked.'
                        : 'Formal resolution requires quorum before MoM publication.'}
                    </div>
                  </div>
                </div>

                <div className="form-grid flex flex-col gap-3.5">
                  <div className="form-field flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Discussion summary</label>
                    <textarea
                      className="p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 min-h-[85px] focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                      value={summary}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSummary(e.target.value)}
                      placeholder="Summarise the material discussion..."
                      disabled={momPublished}
                    />
                  </div>

                  <div className="form-field flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Resolution / decision</label>
                    <textarea
                      className="p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 min-h-[85px] focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                      value={decision}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDecision(e.target.value)}
                      placeholder="Record the authorised outcome..."
                      disabled={momPublished}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="form-field flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Action owner</label>
                      <input
                        className="p-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                        value={owner}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOwner(e.target.value)}
                        disabled={momPublished}
                      />
                    </div>

                    <div className="form-field flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Due date</label>
                      <input
                        className="p-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#1b5fa7]/20 focus:border-[#1b5fa7]"
                        type="date"
                        value={due}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDue(e.target.value)}
                        disabled={momPublished}
                      />
                    </div>
                  </div>

                  {momPublished ? (
                    <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        disabled
                        className="btn inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs min-h-[44px] w-full cursor-not-allowed"
                      >
                        <CheckCircle2 className="size-4 text-emerald-700" />
                        <span>✓ MoM & Follow-through Active</span>
                      </button>
                      <Link
                        to="/org/tasks"
                        className="btn primary inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b5fa7] !text-white hover:bg-[#174f89] font-bold text-xs min-h-[44px] transition-all cursor-pointer shadow-xs hover:shadow whitespace-nowrap"
                        style={{ color: '#ffffff' }}
                      >
                        <span>View Tasks</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn primary inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b5fa7] !text-white hover:bg-[#174f89] font-bold text-xs min-h-[44px] transition-all cursor-pointer shadow-xs hover:shadow disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                      style={{ color: '#ffffff' }}
                      disabled={cmd.busy || !quorum || !owner.trim() || !due || !canPublishMom(m.status)}
                      onClick={() => void publish()}
                    >
                      {cmd.busy ? (
                        <>
                          <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Publishing MoM...</span>
                        </>
                      ) : (
                        <>
                          <CheckSquareIcon className="size-4" />
                          <span>Prepare MoM & create follow-through</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom: MoM Governance Standard Card */}
            <div className="card p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 mb-1.5">MoM Governance Standard</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Approved MoM cannot be silently edited. Corrections create a superseding version. Published MoM creates canonical Actions/Tasks, notifications, calendar entries and carry-forward candidates for subsequent meetings.
              </p>
            </div>
          </div>
        );
      })()}
    </AsyncState>
  );
}
