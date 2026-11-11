import { Sparkles, UserCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, PageHead, StatusPill, Tip, Avatar } from '@/features/network/components/NetworkUI';
import { activeMemberId, connectionStatus } from '@/features/network/selectors';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { MemberJourneyScopeBar } from '@/features/member/components/MemberJourneyScopeBar';
import { useMemberJourneyScope } from '@/features/member/navigation/useMemberJourneyScope';
import { useConnectionCommands } from '@/hooks/useConnectionCommands';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { toast } from '@/components/ui/Toast';

export default function ConnectionSuggestionsPage() {
  const dispatch = useAppDispatch();
  const connectionCommands = useConnectionCommands();
  const { go } = useMemberNavigation();
  const { scope, setScope } = useMemberJourneyScope();
  const memberId = useAppSelector(activeMemberId);
  const n = useNetworkSlice(['connections'] as const);

  const request = useMemo(() => ({
    queryId: 'member.connections.suggestions',
    domain: 'member' as const,
    pagination: { pageSize: 50 },
    parameters: { memberId, scope }
  }), [memberId, scope]);

  const query = useDomainCursorPage<any>(request, [], [memberId, scope]);
  useRealtimeRefresh(['connection.*'], query.reload);

  const rawSuggestions: any[] = query.page?.items ?? [];
  const suggestions = rawSuggestions;

  const handleConnect = async (targetId: string, memberGuid: string) => {
    await connectionCommands.request(memberGuid || targetId, 'Business introduction');
    toast.success('Connection request sent');
    query.reload();
  };

  return (
    <div>
      <PageHead
        title="Connection Suggestions"
        description="Explainable people recommendations from your live chapter network—backed by real database records."
      />
      <CommandExecutionFeedback
        error={connectionCommands.error}
        onRetry={() => void connectionCommands.retry()}
        onDismiss={connectionCommands.clearError}
      />
      <MemberJourneyScopeBar value={scope} onChange={setScope} className="mb-5" />
      {suggestions.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {suggestions.map((m: any) => (
            <Card key={m.memberId || m.id} className="flex h-full flex-col p-5">
              <div className="flex gap-3">
                <Avatar text={m.avatarText || m.name?.slice(0, 2).toUpperCase()} />
                <div className="min-w-0">
                  <button
                    type="button"
                    className="text-left text-lg font-black text-[var(--navy-950)] hover:underline"
                    onClick={() => go(`/app/members/${m.id}`, { label: 'Connection Suggestions' })}
                  >
                    {m.name}
                  </button>
                  <div className="mt-1 text-base text-slate-700">{m.designation}</div>
                  <div className="mt-1 text-sm text-slate-500">{m.city} · {m.chapter}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill tone="info">{m.reason || 'Same Chapter · Same City'}</StatusPill>
              </div>
              <p className="mt-4 flex-1 text-base leading-7 text-slate-600">{m.bio}</p>
              <div className="mt-5 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => go(`/app/members/${m.id}`, { label: 'Connection Suggestions' })}
                >
                  View profile
                </Button>
                <Button
                  className="flex-1"
                  disabled={connectionCommands.busy}
                  onClick={() => void handleConnect(m.id, m.memberId)}
                >
                  <UserCheck className="size-4" />
                  Connect
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No new connection suggestions"
          body="Everyone currently in your Parivar or eligible network is already connected or pending."
          action={<Button onClick={() => go('/app/directory', { label: 'Connection Suggestions' })}>Explore Directory</Button>}
        />
      )}
      <div className="mt-5">
        <Tip>
          <Sparkles className="mr-1 inline size-4" />
          Suggestions are loaded live from the PostgreSQL database and respect actual member connection state.
        </Tip>
      </div>
    </div>
  );
}
