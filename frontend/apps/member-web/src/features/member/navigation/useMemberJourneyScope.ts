import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { activeMemberId } from '@/features/network/selectors';
import type { MemberJourneyScope } from '@/features/member/components/MemberJourneyScopeBar';

function scopeFromParams(value: string | null): MemberJourneyScope {
  if (value === 'chapter') return 'chapter';
  if (value === 'network') return 'network';
  return 'for-you';
}

export function useMemberJourneyScope() {
  const [params, setParams] = useSearchParams();
  const memberId = useAppSelector(activeMemberId);
  const chapter = useAppSelector(s => s.network.members.find(m => m.id === memberId)?.chapter ?? '');
  const scope = scopeFromParams(params.get('scope'));

  const setScope = (nextScope: MemberJourneyScope) => {
    const next = new URLSearchParams(params);
    if (nextScope === 'for-you') next.delete('scope');
    else next.set('scope', nextScope);
    // `chapter` is a secondary advanced filter. The primary Member Journey scope owns
    // the Chapter constraint so changing scope never leaves a stale hidden Chapter filter.
    next.delete('chapter');
    setParams(next, { replace: true });
  };

  return { scope, setScope, chapter, params, setParams };
}
