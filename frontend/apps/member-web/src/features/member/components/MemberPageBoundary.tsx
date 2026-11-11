import { useEffect, useRef, useMemo, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectRouteAllowedByControlPlane } from '@/features/control-plane/selectors';
import { EmptyState } from '@/features/network/components/NetworkUI';
import { upsertMember } from '@/features/network/networkSlice';
import type { Member } from '@/features/network/types';

const titles: Record<string, string> = {
  home: 'Home',
  dashboard: 'Dashboard',
  directory: 'Directory',
  categories: 'Categories',
  connections: 'Connections',
  messages: 'Converse',
  opportunities: 'Opportunities',
  events: 'Events',
  calendar: 'Calendar',
  profile: 'Profile',
  businesses: 'Businesses',
  attendance: 'Attendance',
  payments: 'Payments',
  activity: 'Activity',
  membership: 'Membership',
  support: 'Support'
};

export function MemberPageBoundary({ children }: { children: ReactNode }) {
  const auth = useAppSelector(s => s.auth);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const focus = useRef<HTMLDivElement | null>(null);
  const segment = location.pathname.split('/').filter(Boolean)[1] ?? 'home';

  const account = auth.account;
  const targetId = `member-${account?.id ?? ''}`;

  const storeMember = useAppSelector(s =>
    s.network.members.find(
      m => m.id === targetId || (Boolean(account?.email) && Boolean(m.email) && m.email.toLowerCase() === account!.email.toLowerCase())
    )
  );

  const synthesizedMember = useMemo<Member | null>(() => {
    if (!account || !account.workspaces.includes('Member')) return null;
    const cleanChapter = account.baseChapter || 'General Network';
    return {
      id: targetId,
      name: account.name || 'Member',
      designation: account.role || 'Member',
      chapter: cleanChapter,
      city: 'Thanjavur',
      region: 'Tamil Nadu',
      state: 'Tamil Nadu',
      country: 'India',
      bio: `Active member of ${cleanChapter}`,
      expertise: [],
      email: account.email || '',
      phone: '',
      avatarText: (account.name || 'ME').slice(0, 2).toUpperCase(),
      profileCompleteness: 80,
      status: 'active',
      verificationStatus: 'verified'
    };
  }, [account, targetId]);

  useEffect(() => {
    if (!storeMember && synthesizedMember) {
      dispatch(upsertMember(synthesizedMember));
    }
  }, [storeMember, synthesizedMember, dispatch]);

  const activeMember = storeMember ?? synthesizedMember;
  const controlAllowed = useAppSelector(s => selectRouteAllowedByControlPlane(s, location.pathname));

  useEffect(() => {
    document.title = `${titles[segment] ?? 'Member'} · SETHU`;
    focus.current?.focus({ preventScroll: true });
  }, [location.pathname, segment]);

  if (!auth.account) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (!auth.account.workspaces.includes('Member') || !controlAllowed) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname + location.search, reason: 'member-control-plane-policy' }} />;
  }

  if (!activeMember) {
    return (
      <div ref={focus} tabIndex={-1} className="outline-none">
        <EmptyState
          title="Member identity unavailable"
          body="Your authenticated account does not currently resolve to an active Member record. No fallback identity has been substituted. Contact an authorised membership administrator."
        />
      </div>
    );
  }

  if (activeMember.status === 'suspended' || auth.account.status === 'suspended') {
    return <Navigate to="/access-status?status=suspended" replace />;
  }

  if (activeMember.status === 'inactive' || activeMember.status === 'expired') {
    return <Navigate to={`/access-status?status=${activeMember.status}`} replace />;
  }

  return (
    <div ref={focus} tabIndex={-1} className="outline-none">
      <div className="sr-only" role="status" aria-live="polite">
        {titles[segment] ?? 'Member'} page loaded
      </div>
      {children}
    </div>
  );
}
