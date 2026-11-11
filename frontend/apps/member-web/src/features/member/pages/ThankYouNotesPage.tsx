import { useMemo, useState, useEffect, useCallback, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ContextBanner, EnterpriseStatus } from '@/features/member/components/EnterpriseMemberUI';
import { EmptyState, PageHead, Tip } from '@/features/network/components/NetworkUI';
import { acknowledgeThankYouNote, createThankYouNote } from '@/features/network/networkSlice';
import { activeMemberId } from '@/features/network/selectors';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { stableClientId } from '@/utils/stableId';
import { apiClient } from '@/services/api/apiClient';

export default function ThankYouNotesPage() {
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const { go } = useMemberNavigation();
  const n = useNetworkSlice(['meetings', 'members', 'thankYouNotes'] as const);
  const memberId = useAppSelector(activeMemberId);
  const [params] = useSearchParams();
  const completed = useMemo(() => n.meetings.filter(m => m.participantIds.includes(memberId) && m.status === 'completed').sort((a,b)=>b.dateTime.localeCompare(a.dateTime)), [n.meetings, memberId]);
  const requestedMeeting = params.get('meeting') ?? '';
  const [meetingId, setMeetingId] = useState(() => completed.some(m => m.id === requestedMeeting) ? requestedMeeting : completed[0]?.id ?? '');
  const [text, setText] = useState('');
  const [outcome, setOutcome] = useState<'Introduction'|'Opportunity'|'Transaction'|'Support'|'Other'>('Introduction');

  const [liveNotes, setLiveNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const fetchLiveNotes = useCallback(() => {
    setLoadingNotes(true);
    apiClient.get<any>('/thank-you-notes', { retry: 'safe' })
      .then(res => {
        const items = Array.isArray(res) ? res : res?.items;
        if (Array.isArray(items)) {
          setLiveNotes(items);
          setIsLiveConnected(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingNotes(false));
  }, []);

  useEffect(() => {
    fetchLiveNotes();
  }, [fetchLiveNotes, memberId]);

  const selected = completed.find(m => m.id === meetingId);
  const counterpartId = selected?.participantIds.find(id => id !== memberId);
  const counterpart = counterpartId ? n.members.find(m => m.id === counterpartId) : undefined;

  const notes = useMemo(() => {
    if (liveNotes.length > 0) {
      return liveNotes.map(note => ({
        id: String(note.id),
        fromMemberId: String(note.authorMemberId || note.fromMemberId),
        fromMemberName: note.authorMemberName,
        toMemberId: String(note.recipientMemberId || note.toMemberId),
        toMemberName: note.recipientMemberName,
        meetingId: note.meetingId,
        referenceId: note.referenceId,
        opportunityId: note.opportunityId,
        text: note.message || note.text || '',
        outcomeClass: note.outcome || note.outcomeClass || 'Introduction',
        createdAt: note.createdAt || new Date().toISOString(),
        acknowledged: note.status === 'acknowledged' || Boolean(note.acknowledgedAt),
        version: note.version || 1,
      })).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    }
    return n.thankYouNotes.filter(x => x.fromMemberId === memberId || x.toMemberId === memberId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  }, [liveNotes, n.thankYouNotes, memberId]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !counterpartId || text.trim().length < 5) return;
    const previewPayload = { fromMemberId: memberId, toMemberId: counterpartId, meetingId: selected.id, referenceId: selected.referenceId, opportunityId: selected.opportunityId, text: text.trim(), outcomeClass: outcome };
    const noteId = stableClientId('thanks');
    const result = await command.execute({
      domain: 'member',
      policyId: 'thank-you.create',
      command: 'thank-you.create',
      aggregateType: 'ThankYouNote',
      aggregateId: noteId,
      payload: { id: noteId, ...previewPayload },
      previewAction: () => dispatch(createThankYouNote(previewPayload))
    });
    if (!result.ok) return;
    setText('');
    fetchLiveNotes();
  };

  return (
    <div>
      <PageHead
        eyebrow={isLiveConnected ? "Database Live Follow-ups" : "Relationship follow-up"}
        title="Thank You & Follow-up"
        description="Close the loop after a meeting, reference or opportunity and preserve the agreed next step in the relationship history."
        actions={
          <Button variant="ghost" onClick={fetchLiveNotes} disabled={loadingNotes}>
            <RefreshCw className={`size-4 ${loadingNotes ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        }
      />
      <CommandExecutionFeedback error={command.error} onRetry={() => void command.retry()} onDismiss={command.clearError} />
      {selected && counterpart && (
        <div className="mb-5">
          <ContextBanner
            title="Follow up while the meeting context is fresh"
            action={<Button variant="secondary" onClick={() => go(`/app/meetings/${selected.id}`, { label: 'Follow-up' })}>View meeting</Button>}
          >
            Your selected meeting was with <strong>{counterpart.name}</strong>. A short, specific note helps both sides remember the agreed next action.
          </ContextBanner>
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-xl font-black text-[var(--navy-950)]">Send follow-up</h2>
          {completed.length ? (
            <form onSubmit={send} className="mt-5 grid gap-4">
              <label className="grid gap-1.5 text-sm font-bold">Completed meeting
                <select className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base" value={meetingId} onChange={e => setMeetingId(e.target.value)}>
                  {completed.map(m => <option key={m.id} value={m.id}>{m.title} · {new Date(m.dateTime).toLocaleDateString('en-IN')}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-bold">Outcome type
                <select className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base" value={outcome} onChange={e => setOutcome(e.target.value as typeof outcome)}>
                  <option>Introduction</option>
                  <option>Opportunity</option>
                  <option>Transaction</option>
                  <option>Support</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-bold">Thank-you / follow-up note
                <textarea rows={5} className="rounded-xl border border-slate-300 p-3 text-base font-normal leading-7" value={text} onChange={e => setText(e.target.value)} placeholder="Thank the member and capture the agreed next step." />
              </label>
              <Button type="submit" disabled={!counterpartId || text.trim().length < 5}>Send follow-up note</Button>
              <Tip>Keep the note practical: what was discussed, what was helpful and who will do what next.</Tip>
            </form>
          ) : (
            <EmptyState title="No completed meetings yet" body="Complete a one-to-one meeting before sending a meeting-linked follow-up." action={<Button onClick={() => go('/app/one-to-one', { label: 'Follow-up' })}>View meetings</Button>} />
          )}
        </Card>

        <div className="grid content-start gap-4">
          {notes.map(note => {
            const other = n.members.find(m => m.id === (note.fromMemberId === memberId ? note.toMemberId : note.fromMemberId));
            const displayName = note.fromMemberId === memberId ? ((note as any).toMemberName || other?.name || 'Member') : ((note as any).fromMemberName || other?.name || 'Member');
            return (
              <Card key={note.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-[var(--navy-950)]">
                      {note.fromMemberId === memberId ? 'To' : 'From'} {displayName}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {note.outcomeClass ?? 'Follow-up'} · {new Date(note.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <EnterpriseStatus status={note.acknowledged ? 'Acknowledged' : 'Awaiting acknowledgement'} tone={note.acknowledged ? 'success' : 'warning'} />
                </div>
                <p className="mt-4 text-base leading-7 text-slate-700">{note.text}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {note.meetingId && (
                    <Button variant="secondary" onClick={() => go(`/app/meetings/${note.meetingId}`, { label: 'Follow-up' })}>
                      View meeting
                    </Button>
                  )}
                  {note.toMemberId === memberId && !note.acknowledged && (
                    <Button
                      disabled={command.busy}
                      onClick={() => void command.execute({
                        domain: 'member',
                        policyId: 'thank-you.acknowledge',
                        command: 'thank-you.acknowledge',
                        aggregateType: 'ThankYouNote',
                        aggregateId: note.id,
                        expectedVersion: note.version,
                        payload: { noteId: note.id },
                        previewAction: () => dispatch(acknowledgeThankYouNote(note.id))
                      }).then(() => fetchLiveNotes())}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
          {!notes.length && <EmptyState title="No follow-up notes" body="Relationship follow-up notes will appear here after a completed meeting." />}
        </div>
      </div>
    </div>
  );
}
