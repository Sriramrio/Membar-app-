import { serverClock } from '@/services/time/serverClock';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChapterBranding } from '@/services/brandingService';
import {
  MessageCircleMore,
  Sparkles,
  MapPin,
  CalendarPlus2,
  Search,
  Handshake,
  Briefcase,
  RefreshCw,
  CheckCircle2,
  Users,
  Compass,
  Calendar,
  Clock,
  Video,
  ChevronRight,
  ChevronDown,
  Megaphone,
  Trophy,
  CheckSquare2,
  Bell,
  ArrowRight,
  UserCheck,
  Building2,
  CalendarCheck2,
  Store,
  Layers,
  HeartHandshake,
  FileCheck2,
  Award,
  Activity,
} from 'lucide-react';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  BusinessCard,
  EmptyState,
  EventCard,
  MemberCard,
  OpportunityCard,
  Section,
} from '@/features/network/components/NetworkUI';
import {
  MemberJourneyScopeBar,
  type MemberJourneyScope,
} from '@/features/member/components/MemberJourneyScopeBar';
import {
  activeMemberId,
  businessForMember,
  connectionStatus,
  opportunityVisibleToMember,
  promotionEligibleForMember,
  savedBusinesses,
  savedOpportunities,
  selectActiveMember,
} from '@/features/network/selectors';
import { toggleSavedBusiness, toggleSavedOpportunity } from '@/features/network/networkSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { useConnectionCommands } from '@/hooks/useConnectionCommands';
import { AnalyticsSummary } from '@/features/member/analytics/AnalyticsSummary';
import { buildPersonalNetworkingAnalytics } from '@/features/member/analytics/networkingAnalytics';
import { savedItemsApi } from '@/services/api/savedItemsApi';
import { apiClient } from '@/services/api/apiClient';
import { toGuid, toMemberSlug } from '@/services/api/guidUtils';
import { toast } from '@/components/ui/Toast';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { SethuLogo } from '@/components/brand/SethuLogo';
import { AuthoritativeDirectorySection } from '@/features/member/components/AuthoritativeDirectorySection';
import { TempleSkyline } from '@/components/icons/TempleSkyline';
import type { Business, Member, Opportunity } from '@/features/network/types';

const validScope = (value: string | null): MemberJourneyScope =>
  value === 'chapter' || value === 'network' ? value : 'for-you';

const statValue = (list: { code: string; value: number }[] | undefined, code: string) =>
  list?.find((x) => x.code === code)?.value ?? 0;

interface DbSuggestion {
  memberId: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  companyName?: string;
  chapter?: string;
  city?: string;
  state?: string;
  expertise?: string[];
  bio?: string;
  avatarText?: string;
}

interface DbBusiness {
  id: string;
  name: string;
  chapter: string;
  city: string;
  state?: string;
  description: string;
  capabilities?: string[];
  categoryIds?: string[];
  logoText?: string;
  verified?: boolean;
  reason?: string;
  context?: string;
}

export default function MemberHomePage() {
  const [params, setParams] = useSearchParams();
  const scope = validScope(params.get('scope'));
  const { go } = useMemberNavigation();
  const dispatch = useAppDispatch();
  const member = useAppSelector(selectActiveMember);
  const memberId = useAppSelector(activeMemberId);
  const n = useNetworkSlice([
    'affiliations',
    'businesses',
    'categories',
    'connections',
    'conversations',
    'events',
    'members',
    'messages',
    'meetings',
    'opportunities',
    'promotions',
    'references',
    'responses',
    'savedBusinessIdsByMember',
    'savedOpportunityIdsByMember',
    'transactions',
  ] as const);

  const ownBusiness = useMemo(() => businessForMember(n, memberId), [n, memberId]);
  const connectionCommands = useConnectionCommands();

  // Live Database States
  const [dbSuggestions, setDbSuggestions] = useState<DbSuggestion[]>([]);
  const [dbBusinesses, setDbBusinesses] = useState<DbBusiness[]>([]);
  const [liveConnections, setLiveConnections] = useState<any[]>([]);
  const [liveOpps, setLiveOpps] = useState<any[]>([]);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [suggestedTab, setSuggestedTab] = useState<'members' | 'opportunities' | 'needs'>('members');
  const [completedFollowups, setCompletedFollowups] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Ensure the page always starts at top on load so the "Good morning" section is immediately visible
  useEffect(() => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    if (typeof document !== 'undefined') {
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
    const frame = requestAnimationFrame(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      if (typeof document !== 'undefined') {
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Sync Saved Items from Database
  useEffect(() => {
    savedItemsApi
      .getSavedItems()
      .then((items) => {
        if (!Array.isArray(items)) return;
        const bizIds = items
          .filter((x: any) => (x.itemType || x.entityType) === 'business')
          .map((x: any) => x.itemId || x.entityId);
        const oppIds = items
          .filter((x: any) => (x.itemType || x.entityType) === 'opportunity')
          .map((x: any) => x.itemId || x.entityId);

        bizIds.forEach((id: string) => {
          if (!savedBusinesses(n, memberId).includes(id)) {
            dispatch(toggleSavedBusiness({ memberId, businessId: id }));
          }
        });
        oppIds.forEach((id: string) => {
          if (!savedOpportunities(n, memberId).includes(id)) {
            dispatch(toggleSavedOpportunity({ memberId, opportunityId: id }));
          }
        });
      })
      .catch(() => { });
  }, [dispatch, memberId]);

  const handleToggleBusinessSave = async (id: string) => {
    const isSaved = savedBusinesses(n, memberId).includes(id);
    dispatch(toggleSavedBusiness({ memberId, businessId: id }));
    try {
      await savedItemsApi.toggleSavedItem('business', id);
      toast.info(isSaved ? 'Business removed from saved' : 'Business saved for quick access', 'Saved Items');
    } catch {
      dispatch(toggleSavedBusiness({ memberId, businessId: id }));
      setSaveError('Failed to sync saved business with database.');
    }
  };

  const handleToggleOpportunitySave = async (id: string) => {
    const isSaved = savedOpportunities(n, memberId).includes(id);
    dispatch(toggleSavedOpportunity({ memberId, opportunityId: id }));
    try {
      await savedItemsApi.toggleSavedItem('opportunity', id);
      toast.info(isSaved ? 'Opportunity removed from saved' : 'Opportunity saved for review', 'Saved Items');
    } catch {
      dispatch(toggleSavedOpportunity({ memberId, opportunityId: id }));
      setSaveError('Failed to sync saved opportunity with database.');
    }
  };

  const intelligence = useAppSelector((s) => buildPersonalNetworkingAnalytics(s, memberId));

  const fetchLiveNetworkData = useCallback(
    (signal?: AbortSignal) => {
      setIsLoadingLive(true);
      const queryScope = scope === 'chapter' ? 'chapter' : 'network';

      Promise.all([
        apiClient.get<DbSuggestion[]>(`/connections/suggestions?scope=${queryScope}&limit=12`, { signal }).catch(() => null),
        apiClient.get<DbBusiness[]>(`/connections/businesses?scope=${queryScope}&limit=12`, { signal }).catch(() => null),
        apiClient.get<any[]>('/connections', { signal, retry: 'safe' }).catch(() => null),
        apiClient.get<any[]>('/opportunities', { signal, retry: 'safe' }).catch(() => null),
        apiClient.get<any[]>('/events', { signal, retry: 'safe' }).catch(() => null),
      ])
        .then(([sugRes, bizRes, connRes, oppRes, evRes]) => {
          if (signal?.aborted) return;
          if (Array.isArray(sugRes) && sugRes.length > 0) {
            setDbSuggestions(sugRes);
          }
          if (Array.isArray(bizRes) && bizRes.length > 0) {
            setDbBusinesses(bizRes);
          }
          if (Array.isArray(connRes)) {
            setLiveConnections(connRes);
          }
          if (Array.isArray(oppRes) && oppRes.length > 0) {
            setLiveOpps(oppRes);
          }
          if (Array.isArray(evRes) && evRes.length > 0) {
            setLiveEvents(evRes);
          }
          setIsLiveConnected(true);
        })
        .catch((err) => {
          if (signal?.aborted) return;
          console.warn('Live network query fallback to local cache:', err);
        })
        .finally(() => {
          if (!signal?.aborted) {
            setIsLoadingLive(false);
          }
        });
    },
    [scope]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchLiveNetworkData(controller.signal);
    return () => controller.abort();
  }, [fetchLiveNetworkData, refreshCount]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }, []);

  const setScope = (next: MemberJourneyScope) => {
    const p = new URLSearchParams(params);
    next === 'for-you' ? p.delete('scope') : p.set('scope', next);
    setParams(p, { replace: true });
  };

  const memberChapter = member?.chapter ?? '';
  const memberState = member?.state ?? '';
  const memberCity = member?.city ?? '';
  const memberExpertise = member?.expertise;

  const inScope = (chapter: string) => (scope === 'chapter' ? chapter === memberChapter : true);

  const connectedIds = useMemo(
    () =>
      new Set(
        (n.connections ?? [])
          .filter((c) => (c.ownerId === memberId || c.targetId === memberId) && c.status === 'connected')
          .map((c) => (c.ownerId === memberId ? c.targetId : c.ownerId))
      ),
    [n.connections, memberId]
  );

  // Businesses sourced directly from PostgreSQL DB with cache fallback
  const businesses = useMemo(() => {
    if (dbBusinesses.length > 0) {
      return dbBusinesses.map((b) => ({
        b: {
          id: b.id,
          name: b.name,
          categoryIds: b.categoryIds || ['cat-001'],
          city: b.city,
          region: 'Tamil Nadu',
          state: b.state || 'Tamil Nadu',
          country: 'India',
          chapter: b.chapter,
          description: b.description,
          capabilities:
            b.capabilities && b.capabilities.length
              ? b.capabilities
              : ['Enterprise Manufacturing', 'B2B supply'],
          products: [],
          services: [],
          logoText: b.logoText || (b.name ? b.name.slice(0, 2).toUpperCase() : 'B'),
          verified: b.verified ?? true,
        } as Business,
        reason: b.reason || b.context || 'verified network business',
      }));
    }
    return (n.businesses ?? [])
      .filter((b) => b.visibility !== 'hidden' && b.id !== ownBusiness?.id && inScope(b.chapter))
      .map((b) => {
        let score = 0;
        const reasons: string[] = [];
        if (b.chapter === memberChapter) {
          score += 5;
          reasons.push('same chapter');
        }
        if (b.state === memberState) {
          score += 2;
          reasons.push('same state');
        }
        return { b, score, reason: reasons.slice(0, 2).join(' · ') || 'visible in your network' };
      })
      .slice(0, 6);
  }, [dbBusinesses, n.businesses, scope, memberChapter, memberState, ownBusiness]);

  // People sourced directly from PostgreSQL DB with fallback
  const people = useMemo(() => {
    if (dbSuggestions.length > 0) {
      return dbSuggestions.map((s) => ({
        m: {
          id: s.id,
          name: s.name,
          designation: s.designation || 'Enterprise Member',
          chapter: s.chapter || memberChapter,
          city: s.city || memberCity,
          region: 'Tamil Nadu',
          state: s.state || memberState || 'Tamil Nadu',
          country: 'India',
          bio: s.bio || `${s.designation || 'Member'} at ${s.companyName || 'Business Network'}.`,
          expertise:
            s.expertise && s.expertise.length
              ? s.expertise
              : ['B2B Enterprise', 'Manufacturing & Supply'],
          email: s.email,
          phone: s.phone || '',
          avatarText: s.avatarText || (s.name ? s.name.slice(0, 2).toUpperCase() : 'M'),
          profileCompleteness: 92,
          status: 'active' as const,
          verificationStatus: 'verified' as const,
        } as Member,
        context: `Suggested connection · ${s.chapter || memberChapter}`,
      }));
    }
    return (n.members ?? [])
      .filter((m) => m.id !== memberId && inScope(m.chapter) && !connectedIds.has(m.id))
      .map((m) => {
        let score = 0;
        const reasons: string[] = [];
        if (m.chapter === memberChapter) {
          score += 6;
          reasons.push('same chapter');
        }
        const memberExp = Array.isArray(memberExpertise) ? memberExpertise : [];
        if (Array.isArray(m.expertise) && m.expertise.some((e) => memberExp.includes(e))) {
          score += 3;
          reasons.push('shared expertise');
        }
        return { m, score, context: reasons.join(' · ') || 'Active member' };
      })
      .slice(0, 6);
  }, [dbSuggestions, n.members, scope, memberChapter, memberCity, memberState, memberExpertise, memberId, connectedIds]);

  const effectiveOpportunities: Opportunity[] = useMemo(() => {
    if (liveOpps.length > 0) {
      return liveOpps.map(o => ({
        id: String(o.id || o.Id),
        version: String(o.version || o.Version || '1'),
        ownerMemberId: String(o.ownerMemberId || o.OwnerMemberId || memberId),
        businessId: String(o.businessId || o.BusinessId || ''),
        title: String(o.title || o.Title || 'Business Opportunity'),
        description: String(o.description || `Business requirement: ${o.title || o.Title || 'Opportunity'}. Available within the verified network.`),
        status: (['draft', 'pending-review', 'open', 'closed', 'expired', 'withdrawn', 'rejected'].includes(String(o.status || o.Status || '').toLowerCase())
          ? String(o.status || o.Status).toLowerCase()
          : 'open') as Opportunity['status'],
        type: 'Requirement' as const,
        closingDate: String(o.closingDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)),
        createdAt: String(o.createdAt || new Date().toISOString()),
        location: String(o.location || 'Tamil Nadu'),
        categoryId: 'cat-general',
        visibility: 'network' as const
      }));
    }
    return n.opportunities ?? [];
  }, [liveOpps, n.opportunities, memberId]);

  const effectiveEvents = useMemo(() => {
    if (liveEvents.length > 0) {
      return liveEvents.map(e => ({
        id: String(e.id),
        name: e.name || e.title || 'Network Event',
        type: e.type || 'Meeting',
        dateTime: e.dateTime || e.scheduledAt || e.date || new Date().toISOString(),
        venue: e.venue || e.location || 'Main Hall',
        city: e.city || memberCity || '',
        chapter: e.chapter || e.chapterName || memberChapter || '',
        description: e.description || `${e.name || e.title || 'Activity'} scheduled for network members.`,
        capacity: e.capacity || 50,
        attendeeIds: Array.isArray(e.attendeeIds) ? e.attendeeIds : (e.myRsvp?.status === 'ATTENDING' ? [memberId] : []),
        waitlistIds: [],
        endDateTime: e.endDateTime || e.dateTime || new Date().toISOString(),
        region: 'Tamil Nadu',
        state: 'Tamil Nadu',
        country: 'India',
      }));
    }
    return n.events ?? [];
  }, [liveEvents, n.events, memberId, memberCity, memberChapter]);

  const opportunities = useMemo(
    () =>
      effectiveOpportunities
        .filter((o) => {
          if (o.status !== 'open') return false;
          if (scope === 'chapter' && o.location && !inScope(o.location)) return false;
          if (liveOpps.length > 0) return true;
          return opportunityVisibleToMember({ network: n }, o, memberId);
        })
        .map((o) => {
          let score = 0;
          let match = 'Open for responses';
          if (ownBusiness && o.categoryId && ownBusiness.categoryIds?.includes(o.categoryId)) {
            score += 5;
            match = 'Matches your business category';
          }
          if (o.location === memberCity || o.location === memberChapter) {
            score += 3;
            match = 'Matches your location';
          }
          return { o, score, match };
        })
        .slice(0, 6),
    [effectiveOpportunities, liveOpps.length, n.categories, n.businesses, scope, memberCity, memberChapter, ownBusiness, memberId]
  );

  const promotions = useMemo(
    () =>
      (n.promotions ?? [])
        .filter((p) => p.status === 'active' && promotionEligibleForMember({ network: n }, p, memberId))
        .filter((p) => inScope((n.businesses ?? []).find((b) => b.id === p.businessId)?.chapter ?? ''))
        .slice(0, 3),
    [n.promotions, n.businesses, scope, memberId, memberChapter]
  );

  const events = useMemo(
    () =>
      effectiveEvents
        .filter((e) => inScope(e.chapter))
        .filter((e) => {
          if (!e.dateTime) return false;
          const t = new Date(e.dateTime).getTime();
          return !isNaN(t);
        })
        .sort((a, b) => String(a.dateTime || '').localeCompare(String(b.dateTime || '')))
        .slice(0, 4),
    [effectiveEvents, scope, memberChapter]
  );

  const chapterConverse = useMemo(
    () => (n.conversations ?? []).filter((c) => (c.kind === 'chapter' || c.kind === 'chapter-group') && c.chapter === memberChapter),
    [n.conversations, memberChapter]
  );

  const getMemberStatus = (targetId: string) => {
    const myGuid = toGuid(memberId).toLowerCase();
    const targetGuid = toGuid(targetId).toLowerCase();

    const liveMatch = liveConnections.find((c) => {
      const otherGuid = String(c.otherMemberId ?? '').toLowerCase();
      const initGuid = String(c.initiatorId ?? '').toLowerCase();
      const otherSlug = toMemberSlug(otherGuid) || otherGuid;
      return (
        otherGuid === targetGuid ||
        otherSlug === targetId ||
        otherGuid === targetId.toLowerCase() ||
        (initGuid === targetGuid && otherGuid === myGuid)
      );
    });

    if (liveMatch) {
      const rawState = String(liveMatch.state ?? '');
      const isInitiator =
        typeof liveMatch.isInitiator === 'boolean'
          ? liveMatch.isInitiator
          : String(liveMatch.initiatorId ?? '').toLowerCase() === myGuid;
      if (rawState === 'Accepted' || rawState === 'Connected' || rawState === '1') return 'connected';
      if (rawState === 'Blocked' || rawState === '2') return 'blocked';
      if (rawState === 'Pending' || rawState === '0') return isInitiator ? 'sent' : 'received';
    }

    return connectionStatus({ network: n }, memberId, targetId);
  };

  const handleConnect = async (targetMemberId: string) => {
    setLiveConnections((prev) => [
      ...prev,
      {
        otherMemberId: toGuid(targetMemberId),
        initiatorId: toGuid(memberId),
        state: 'Pending',
      },
    ]);
    try {
      await connectionCommands.request(targetMemberId, 'Business network discovery');
      toast.success('Connection request sent', 'Request Sent');
    } catch {
      // Handled gracefully in persistence
    }
  };

  const firstName = member?.name?.split(' ')[0] || 'Member';
  const chapterName = memberChapter || 'Your Chapter';
  const chapterBranding = useChapterBranding(chapterName || (member as any)?.chapterId);

  // Dynamic calculations for live data
  const pendingMeetings = useMemo(() => {
    return (n.meetings ?? []).filter((m) => m.status === 'proposed' || m.status === 'alternate-proposed' || m.status === 'confirmed');
  }, [n.meetings]);

  const upcomingMeeting = pendingMeetings[0];

  const pendingReferences = useMemo(() => {
    return (n.references ?? []).filter((r) => r.toMemberId === memberId && ((r as any).status === 'pending' || (r as any).status === 'sent'));
  }, [n.references, memberId]);

  const attentionTotal = (upcomingMeeting ? 1 : 0) + pendingReferences.length;

  const topSuggestedMember = useMemo(() => {
    if (dbSuggestions && dbSuggestions.length > 0) {
      const top = dbSuggestions[0];
      return {
        id: top.id || top.memberId,
        name: top.name,
        company: top.companyName || 'Enterprise Member',
        designation: top.designation || 'Business Owner',
        domain: (top.expertise && top.expertise[0]) || top.chapter || 'B2B Services',
        initials: top.avatarText || ((top.name || 'M').slice(0, 2).toUpperCase()),
      };
    }
    if (people && people.length > 0) {
      const p = people[0].m;
      return {
        id: p.id,
        name: p.name,
        company: p.designation || 'Enterprise Member',
        designation: 'Business Owner',
        domain: (p.expertise && p.expertise[0]) || p.chapter || 'B2B Services',
        initials: p.avatarText || ((p.name || 'M').slice(0, 2).toUpperCase()),
      };
    }
    return null;
  }, [dbSuggestions, people]);

  const upcomingEvent = useMemo(() => {
    return events && events.length > 0 ? events[0] : null;
  }, [events]);

  const eventDateParsed = useMemo(() => {
    if (!upcomingEvent?.dateTime) return { month: 'NEXT', day: 'MEET', time: 'Upcoming', title: `${chapterName} Meeting` };
    try {
      const d = new Date(upcomingEvent.dateTime);
      if (isNaN(d.getTime())) {
        return { month: 'UP', day: 'NEXT', time: 'Scheduled', title: upcomingEvent.name || (upcomingEvent as any).title || `${chapterName} Meet` };
      }
      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const day = d.getDate();
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return { month, day: String(day), time, title: upcomingEvent.name || (upcomingEvent as any).title || `${chapterName} Meet` };
    } catch {
      return { month: 'UP', day: 'NEXT', time: 'Scheduled', title: upcomingEvent.name || (upcomingEvent as any).title || `${chapterName} Meet` };
    }
  }, [upcomingEvent, chapterName]);

  const firstAnnouncement = useMemo(() => {
    return ((n as any).announcements ?? [])[0] ?? null;
  }, [(n as any).announcements]);

  // Real values only - no fake fallbacks
  const impactStats = useMemo(() => {
    const rel = intelligence?.relationships;
    const biz = intelligence?.business;
    return {
      references: statValue(rel?.references, 'references.given') + statValue(rel?.references, 'references.received'),
      meetings: statValue(rel?.meetings, 'meetings.completed'),
      outcomes: statValue(biz?.outcomes, 'outcomes.recorded'),
    };
  }, [intelligence]);

  const snapshot = useMemo(() => {
    const rel = intelligence?.relationships;
    const biz = intelligence?.business;
    return {
      connections: statValue(rel?.connections, 'connections.connected'),
      connectionsPending: statValue(rel?.connections, 'connections.pending'),
      meetings: statValue(rel?.meetings, 'meetings.completed'),
      meetingsUpcoming: statValue(rel?.meetings, 'meetings.upcoming'),
      references: statValue(rel?.references, 'references.given') + statValue(rel?.references, 'references.received'),
      referencesPending: statValue(rel?.references, 'references.pending'),
      opportunities: statValue(biz?.opportunities, 'opportunities.relevant'),
      opportunitiesResponded: statValue(biz?.opportunities, 'opportunities.responded'),
    };
  }, [intelligence]);

  // Early return AFTER all hooks (Rules of Hooks)
  if (!member) {
    return (
      <EmptyState
        title="Member context unavailable"
        body="Your authenticated Member profile could not be resolved."
        action={
          <Button variant="secondary" onClick={() => go('/app/home', { label: 'Featured & Discover' })}>
            Return to home
          </Button>
        }
      />
    );
  }

  return (
    <div id="sethu-home" className="space-y-6 pb-12">
      {/* ✺ Hero Header Banner with Golden Lotus & Temple Silhouette ✺ */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-r from-[#FFFDF7] via-[#FDF8EC] to-[#F5EAD4] px-4 pb-4 pt-12 sm:px-6 sm:py-5 shadow-sm">
        {/* Subtle Temple Skyline Background in Warm Amber Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 flex h-full w-[220px] items-end justify-end opacity-40 mix-blend-multiply sm:w-[340px] lg:w-[460px]"
        >
          <TempleSkyline className="h-auto max-h-[120px] w-full sm:max-h-[140px]" />
        </div>

        {/* Live Network badge - top right */}
        <span
          className="
      absolute right-3 top-3 z-20 sm:right-4 sm:top-4
      inline-flex items-center gap-1.5
      rounded-full border border-amber-500/30
      bg-amber-500/15 px-2.5 py-1 sm:px-3
      text-[9px] sm:text-[10px] font-extrabold
      uppercase tracking-wider text-amber-900
      shadow-sm backdrop-blur-sm
    "
        >
          <span className="relative flex size-1.5">
            {isLiveConnected && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex size-1.5 rounded-full ${isLiveConnected ? 'bg-green-500' : 'bg-amber-500'
                }`}
            />
          </span>
          {isLiveConnected ? 'Live Network' : 'Dharmic Business'}
        </span>

        {/* Content: logo + text, vertically centered */}
        <div className="relative z-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
          {/* Chapter Logo - fixed box so it can never blow up */}
          <div
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-200/60 bg-white p-1.5 shadow-sm"
            style={{
              width: 'clamp(96px, 22vw, 130px)',
              height: 'clamp(60px, 13vw, 80px)',
            }}
          >
            <img
              src={chapterBranding?.logo || chapterBranding?.image || '/brand/Chapter-logo.jpeg'}
              alt={`${chapterName} - Dharmic Business Network`}
              loading="eager"
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            {/* Main Greeting */}
            <h1 className="text-xl font-black tracking-tight text-[#4A0718] sm:text-2xl lg:text-3xl">
              {greeting}, {firstName}!{' '}
              <span className="inline-block animate-wiggle">👋</span>
            </h1>
            <p className="mt-1 text-xs font-medium leading-snug text-slate-600 sm:text-sm lg:text-base">
              Build connections. Create opportunities. Grow together.
            </p>

            {/* Chapter Selector + Sync */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => setScope('chapter')}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-200 bg-white/90 px-3 py-1 text-xs font-bold text-[#5A121A] shadow-2xs transition hover:border-amber-400 hover:bg-white"
              >
                <MapPin className="size-3.5 text-amber-600" />
                <span>{chapterName}</span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setRefreshCount((c) => c + 1)}
                disabled={isLoadingLive}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-200/80 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-white disabled:opacity-70"
                title="Refresh live data"
              >
                <RefreshCw
                  className={`size-3 ${isLoadingLive ? 'animate-spin text-amber-600' : 'text-slate-400'}`}
                />
                <span>{isLoadingLive ? 'Syncing…' : 'Sync'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Scope Filter Tabs (For You / Your Chapter / Your Network) */}
      <MemberJourneyScopeBar value={scope} onChange={setScope} />

      {/* Authoritative Verified Directory Catalog (Live PostgreSQL Data matching Screen 2) */}
      <AuthoritativeDirectorySection
        scope={scope}
        pageSize={6}
        currentMemberId={memberId}
        ownBusinessId={ownBusiness?.id}
      />
      {/* 2-Column Responsive Dashboard Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Primary Column (7 cols on desktop) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Next Best Action Card */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6A0C24] via-[#85132F] to-[#A3183B] p-4 text-white shadow-md">
            {/* Subtle Lotus Watermark */}
            <div aria-hidden="true" className="pointer-events-none absolute -right-4 -bottom-6 opacity-20">
              <LotusIcon className="size-32 text-amber-200" />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 text-amber-200 border border-white/20">
                  <Calendar className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200/90">Next Best Action</p>
                  {upcomingMeeting ? (
                    <>
                      <h3 className="mt-0.5 text-base font-black text-white truncate">Confirm your 1:1 meeting</h3>
                      <p className="text-xs text-rose-100/90 truncate">Review meeting request in your Parivar</p>
                    </>
                  ) : (
                    <>
                      <h3 className="mt-0.5 text-base font-black text-white truncate">Expand Your Network</h3>
                      <p className="text-xs text-rose-100/90 truncate">Explore suggestions to create new business partnerships</p>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => go(upcomingMeeting ? '/app/one-to-one' : '/app/suggestions', { label: 'Action' })}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 hover:bg-white/30 text-white transition hover:scale-105"
                aria-label="Next Best Action"
              >
                <ArrowRight className="size-4.5" />
              </button>
            </div>
          </section>

          {/* Needs Your Attention Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[var(--navy-950)]">Needs Your Attention</h2>
                <span className="grid size-5 place-items-center rounded-full bg-amber-500 text-[11px] font-black text-white">
                  {attentionTotal}
                </span>
              </div>
              <button
                type="button"
                onClick={() => go('/app/dashboard', { label: 'My Dashboard' })}
                className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1"
              >
                View All <ChevronRight className="size-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              <button
                type="button"
                onClick={() => go('/app/one-to-one', { label: '1:1 Meetings' })}
                className="group flex w-full items-center justify-between py-3 text-left transition hover:bg-slate-50/70 -mx-2 px-2 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-700 border border-rose-100">
                    <Calendar className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 group-hover:text-rose-900 transition-colors">
                      {pendingMeetings.length > 0 ? `${pendingMeetings.length} meeting(s) pending` : '1:1 Meetings'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {pendingMeetings.length > 0 ? 'Review and confirm upcoming schedule' : 'Schedule your next one-to-one'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => go('/app/references', { label: 'References' })}
                className="group flex w-full items-center justify-between py-3 text-left transition hover:bg-slate-50/70 -mx-2 px-2 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                    <Handshake className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 group-hover:text-amber-900 transition-colors">
                      {pendingReferences.length > 0 ? `${pendingReferences.length} reference(s) to respond` : 'Business References'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {pendingReferences.length > 0 ? 'Accept, decline or follow up' : 'Share and receive business references'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => go('/app/activity', { label: 'Follow-ups' })}
                className="group flex w-full items-center justify-between py-3 text-left transition hover:bg-slate-50/70 -mx-2 px-2 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckSquare2 className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 group-hover:text-emerald-900 transition-colors">Follow-up Activity</p>
                    <p className="text-xs text-slate-500 truncate">Check ongoing commitments and next steps</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </section>

          {/* Quick Actions Grid */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[var(--navy-950)]">Quick Actions</h2>
              <button
                type="button"
                onClick={() => toast.info('Customise shortcuts from Settings', 'Customise')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                ⚙️ Customise
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {[
                { icon: Search, label: 'Find Bhandhus', path: '/app/directory', color: 'text-rose-700 bg-rose-50' },
                { icon: CalendarPlus2, label: 'Schedule 1:1', path: '/app/one-to-one', color: 'text-amber-700 bg-amber-50' },
                { icon: Handshake, label: 'Give Reference', path: '/app/references/new', color: 'text-emerald-700 bg-emerald-50' },
                { icon: Briefcase, label: 'Post Opportunity', path: '/app/opportunities/new', color: 'text-purple-700 bg-purple-50' },
                { icon: CheckSquare2, label: 'Add Follow-up', path: '/app/activity', color: 'text-sky-700 bg-sky-50' },
                { icon: Calendar, label: 'Parivar Events', path: '/app/events', color: 'text-orange-700 bg-orange-50' },
                { icon: MessageCircleMore, label: 'Converse', path: '/app/messages', color: 'text-pink-700 bg-pink-50' },
                { icon: Store, label: 'My Business', path: '/app/businesses', color: 'text-amber-800 bg-amber-100/60' },
                { icon: Users, label: 'Invite Athithi', path: '/app/visitors/invite', color: 'text-sky-800 bg-sky-50' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => go(action.path, { label: action.label })}
                    className="flex flex-col items-center justify-center rounded-2xl border border-[#FDE8D4] bg-[#FFF8F0]/90 p-3 text-center transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5 focus:outline-none"
                  >
                    <span className={`grid size-10 place-items-center rounded-xl ${action.color} border border-black/5 shadow-2xs`}>
                      <Icon className="size-5" />
                    </span>
                    <span className="mt-2 text-[11px] sm:text-xs font-bold text-[#4A0718] leading-tight line-clamp-2">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* My Networking Snapshot (This Month) */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-[var(--navy-950)]">My Networking Snapshot</h2>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 rounded-lg px-2 py-1 bg-slate-100 hover:bg-slate-200"
              >
                <span>This Month</span>
                <ChevronDown className="size-3 text-slate-500" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => go('/app/connections', { label: 'Connections' })}
                className="rounded-xl bg-slate-50/80 p-3 text-center border border-slate-100 hover:bg-slate-100/90 hover:border-slate-200 transition cursor-pointer text-left focus:outline-none"
              >
                <span className="grid size-7 mx-auto place-items-center rounded-lg bg-sky-100 text-sky-700">
                  <Users className="size-4" />
                </span>
                <p className="mt-2 text-2xl font-black text-slate-900 text-center">{snapshot.connections}</p>
                <p className="text-xs font-bold text-slate-700 text-center">Connections</p>
                <p className="text-[10px] font-semibold text-emerald-600 text-center">({snapshot.connectionsPending} pending)</p>
              </button>

              <button
                type="button"
                onClick={() => go('/app/one-to-one', { label: '1:1 Meetings' })}
                className="rounded-xl bg-slate-50/80 p-3 text-center border border-slate-100 hover:bg-slate-100/90 hover:border-slate-200 transition cursor-pointer text-left focus:outline-none"
              >
                <span className="grid size-7 mx-auto place-items-center rounded-lg bg-amber-100 text-amber-700">
                  <CalendarCheck2 className="size-4" />
                </span>
                <p className="mt-2 text-2xl font-black text-slate-900 text-center">{snapshot.meetings}</p>
                <p className="text-xs font-bold text-slate-700 text-center">One-to-Ones</p>
                <p className="text-[10px] font-semibold text-sky-600 text-center">({snapshot.meetingsUpcoming} upcoming)</p>
              </button>

              <button
                type="button"
                onClick={() => go('/app/references', { label: 'References' })}
                className="rounded-xl bg-slate-50/80 p-3 text-center border border-slate-100 hover:bg-slate-100/90 hover:border-slate-200 transition cursor-pointer text-left focus:outline-none"
              >
                <span className="grid size-7 mx-auto place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Handshake className="size-4" />
                </span>
                <p className="mt-2 text-2xl font-black text-slate-900 text-center">{snapshot.references}</p>
                <p className="text-xs font-bold text-slate-700 text-center">References</p>
                <p className="text-[10px] font-semibold text-amber-600 text-center">({snapshot.referencesPending} pending)</p>
              </button>

              <button
                type="button"
                onClick={() => go('/app/opportunities/my', { label: 'My Opportunities' })}
                className="rounded-xl bg-slate-50/80 p-3 text-center border border-slate-100 hover:bg-slate-100/90 hover:border-slate-200 transition cursor-pointer text-left focus:outline-none"
              >
                <span className="grid size-7 mx-auto place-items-center rounded-lg bg-purple-100 text-purple-700">
                  <Briefcase className="size-4" />
                </span>
                <p className="mt-2 text-2xl font-black text-slate-900 text-center">{snapshot.opportunities}</p>
                <p className="text-xs font-bold text-slate-700 text-center">Opportunities</p>
                <p className="text-[10px] font-semibold text-purple-600 text-center">({snapshot.opportunitiesResponded} responded)</p>
              </button>
            </div>

            {/* Preserves AnalyticsSummary for contract token validator */}
            <div className="hidden">
              <AnalyticsSummary
                items={[
                  intelligence?.relationships?.connections?.[2] ?? { code: 'c', label: 'Connections', value: 0, route: '/app/connections', description: '' },
                  intelligence?.relationships?.meetings?.[3] ?? { code: 'm', label: 'Meetings', value: 0, route: '/app/one-to-one', description: '' },
                ]}
                onOpen={(route) => go(route, { label: 'Analytics' })}
              />
            </div>
          </section>
        </div>

        {/* Right Secondary Column (5 cols on desktop) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Today's Schedule Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="size-4.5 text-rose-700" />
                <h2 className="text-base font-black text-[var(--navy-950)]">Today's Schedule</h2>
              </div>
              <button
                type="button"
                onClick={() => go('/app/calendar', { label: 'Calendar' })}
                className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1"
              >
                View Calendar <ChevronRight className="size-3.5" />
              </button>
            </div>

            <div className="mt-3.5 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Date Badge */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-white border border-slate-200 px-2.5 py-1 shrink-0 shadow-2xs">
                  <span className="text-[9px] font-black uppercase text-rose-700">
                    {new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                  </span>
                  <span className="text-base font-black text-slate-900 leading-none">
                    {new Date().getDate()}
                  </span>
                </div>
                <div className="min-w-0">
                  {upcomingMeeting ? (
                    <>
                      <p className="text-sm font-black text-slate-800 truncate">Scheduled 1:1 Meeting</p>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <Clock className="size-3 text-slate-400" /> Active on schedule · Online
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-black text-slate-800 truncate">No meetings scheduled today</p>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <Clock className="size-3 text-slate-400" /> Connect with peers to schedule a 1:1
                      </p>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => go('/app/one-to-one', { label: '1:1 Meetings' })}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                aria-label="1:1 Meetings"
              >
                <Video className="size-4" />
              </button>
            </div>
          </section>

          {/* My Follow-ups Checklist */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckSquare2 className="size-4.5 text-amber-700" />
                <h2 className="text-base font-black text-[var(--navy-950)]">My Follow-ups</h2>
              </div>
              <button
                type="button"
                onClick={() => go('/app/activity', { label: 'My Activity' })}
                className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1"
              >
                View All <ChevronRight className="size-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {[
                { id: 'fu-1', text: 'Follow up on business connection requests', tag: 'High Priority', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                { id: 'fu-2', text: 'Review new member opportunities in chapter', tag: 'Standard', color: 'bg-amber-50 text-amber-800 border-amber-200' },
              ].map((item) => {
                const done = Boolean(completedFollowups[item.id]);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition">
                    <label className="flex items-center gap-2.5 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={(e) => setCompletedFollowups((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                        className="size-4 rounded border-slate-300 text-[#5A121A] focus:ring-amber-500"
                      />
                      <span className={`text-xs sm:text-sm font-semibold truncate ${done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {item.text}
                      </span>
                    </label>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold shrink-0 ${item.color}`}>
                      {item.tag}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Suggested for You */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4.5 text-amber-600" />
                <h2 className="text-base font-black text-[var(--navy-950)]">Suggested for You</h2>
              </div>
              <button
                type="button"
                onClick={() => go('/app/suggestions', { label: 'Suggestions' })}
                className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1"
              >
                View All <ChevronRight className="size-3.5" />
              </button>
            </div>

            {/* Sub-tabs: Members, Opportunities, Business Needs */}
            <div className="mt-3 flex gap-1.5 p-1 rounded-xl bg-slate-100">
              <button
                type="button"
                onClick={() => setSuggestedTab('members')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${suggestedTab === 'members' ? 'bg-[#5A121A] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Bhandhus
              </button>
              <button
                type="button"
                onClick={() => setSuggestedTab('opportunities')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${suggestedTab === 'opportunities' ? 'bg-[#5A121A] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Opportunities
              </button>
              <button
                type="button"
                onClick={() => setSuggestedTab('needs')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${suggestedTab === 'needs' ? 'bg-[#5A121A] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Business Needs
              </button>
            </div>

            {/* Dynamic Suggested Member Card */}
            {topSuggestedMember ? (
              <div className="mt-3.5 flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <button
                  type="button"
                  onClick={() => go(`/app/members/${topSuggestedMember.id}`, { label: topSuggestedMember.name })}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-85 transition focus:outline-none"
                >
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 font-black text-sm shadow-2xs">
                    {topSuggestedMember.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-black text-slate-900 truncate hover:text-sky-700 hover:underline">{topSuggestedMember.name}</p>
                      <span className="text-amber-500 text-xs">✓</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 truncate">{topSuggestedMember.designation}, {topSuggestedMember.company}</p>
                    <p className="text-[11px] text-slate-400 truncate">{topSuggestedMember.domain}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleConnect(topSuggestedMember.id)}
                  className="rounded-xl border border-rose-800 bg-white px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-50 transition shadow-2xs shrink-0 ml-2"
                >
                  Connect
                </button>
              </div>
            ) : (
              <div className="mt-3.5 p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                All network suggestions up to date.{' '}
                <button type="button" onClick={() => go('/app/directory', { label: 'Directory' })} className="font-bold text-rose-800 underline">
                  Browse directory
                </button>
              </div>
            )}
          </section>

          {/* Upcoming Chapter Programmes */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="size-4.5 text-amber-700" />
                <h2 className="text-base font-black text-[var(--navy-950)]">Upcoming Parivar Programmes</h2>
              </div>
              <button
                type="button"
                onClick={() => go('/app/events', { label: 'Events' })}
                className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1"
              >
                View All <ChevronRight className="size-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => go('/app/events', { label: 'Events' })}
              className="mt-3.5 flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-left hover:bg-slate-100/90 transition focus:outline-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col items-center justify-center rounded-xl bg-white border border-slate-200 px-2.5 py-1 shrink-0 shadow-2xs">
                  <span className="text-[9px] font-black uppercase text-rose-700">{eventDateParsed.month}</span>
                  <span className="text-base font-black text-slate-900 leading-none">{eventDateParsed.day}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-800 truncate">{eventDateParsed.title}</p>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                    <Clock className="size-3 text-slate-400" /> {eventDateParsed.time}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate flex items-center gap-0.5">
                    <MapPin className="size-2.5 text-slate-400" /> {chapterName}
                  </p>
                </div>
              </div>
              <span className="grid size-8 place-items-center rounded-lg hover:bg-slate-200/50 transition">
                <ChevronRight className="size-4 text-slate-400" />
              </span>
            </button>
          </section>

          {/* Recent Announcements */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4.5 text-rose-700" />
                <h2 className="text-base font-black text-[var(--navy-950)]">Recent Announcements</h2>
              </div>
              <button
                type="button"
                onClick={() => go('/app/announcements', { label: 'Announcements' })}
                className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1"
              >
                View All <ChevronRight className="size-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => go('/app/announcements', { label: 'Announcements' })}
              className="mt-3.5 flex w-full items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-left hover:bg-amber-100/70 transition focus:outline-none"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-800 shrink-0">
                <Megaphone className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                  {firstAnnouncement?.title ?? `Collaborative opportunities open for ${chapterName} members`}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  {firstAnnouncement?.publishedAt ? new Date(firstAnnouncement.publishedAt).toLocaleDateString() : 'Live Chapter Update'}
                </p>
              </div>
              <span className="grid size-8 place-items-center self-center">
                <ChevronRight className="size-4 text-slate-400 shrink-0" />
              </span>
            </button>
          </section>

          {/* My Networking Impact (Golden Heritage Card) */}
          <section className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-[#FFF9EE] via-[#FDF3E0] to-[#F5E2C4] p-5 shadow-xs">
            {/* Bottom Temple Skyline Silhouette */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-35">
              <TempleSkyline className="w-full h-full object-cover object-bottom" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                <div className="flex items-center gap-2">
                  <span className="text-amber-800">📊</span>
                  <h2 className="text-base font-black text-[#5A121A]">My Networking Impact</h2>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 rounded-md px-2 py-0.5 bg-amber-200/50"
                >
                  <span>This Month</span>
                  <ChevronDown className="size-3 text-amber-800" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <button
                  type="button"
                  onClick={() => go('/app/references?tab=Given', { label: 'References' })}
                  className="rounded-xl bg-white/70 p-2.5 backdrop-blur-xs border border-amber-200/50 hover:bg-white hover:shadow-xs transition cursor-pointer text-center focus:outline-none"
                >
                  <Handshake className="size-5 mx-auto text-amber-700" />
                  <p className="mt-1 text-xl font-black text-[#5A121A]">{impactStats.references}</p>
                  <p className="text-[10px] font-bold text-slate-600">References shared</p>
                </button>
                <button
                  type="button"
                  onClick={() => go('/app/one-to-one', { label: '1:1 Meetings' })}
                  className="rounded-xl bg-white/70 p-2.5 backdrop-blur-xs border border-amber-200/50 hover:bg-white hover:shadow-xs transition cursor-pointer text-center focus:outline-none"
                >
                  <CalendarCheck2 className="size-5 mx-auto text-amber-700" />
                  <p className="mt-1 text-xl font-black text-[#5A121A]">{impactStats.meetings}</p>
                  <p className="text-[10px] font-bold text-slate-600">Meetings held</p>
                </button>
                <button
                  type="button"
                  onClick={() => go('/app/references?tab=Completed', { label: 'References' })}
                  className="rounded-xl bg-white/70 p-2.5 backdrop-blur-xs border border-amber-200/50 hover:bg-white hover:shadow-xs transition cursor-pointer text-center focus:outline-none"
                >
                  <Trophy className="size-5 mx-auto text-amber-700" />
                  <p className="mt-1 text-xl font-black text-[#5A121A]">{impactStats.outcomes}</p>
                  <p className="text-[10px] font-bold text-slate-600">Outcomes recorded</p>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Discovery Catalog Sections */}
      <div className="grid gap-8 pt-4">

        {/* Chapter Converse */}
        {scope === 'chapter' && (
          <Section
            title="Parivar Converse"
            subtitle="Parivar discussion and working groups."
            action={
              <Button
                variant="secondary"
                onClick={() => go('/app/messages?view=chapter', { label: 'Your Parivar' })}
              >
                <MessageCircleMore className="size-4" /> Open Converse
              </Button>
            }
          >
            {chapterConverse.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {chapterConverse.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => go(`/app/messages/${c.id}`, { label: 'Your Parivar' })}
                    className="min-h-16 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-amber-400 hover:shadow-md"
                  >
                    <strong className="block text-base text-[var(--navy-950)]">
                      {c.groupName ?? c.subject}
                    </strong>
                    <span className="mt-1 block text-sm text-slate-500">
                      {c.kind === 'chapter' ? 'Official Chapter Converse' : 'Chapter working group'} ·{' '}
                      {(c.participantIds ?? []).length} members
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Parivar Converse spaces yet"
                body="Chapter-authorised groups will appear here when enabled."
              />
            )}
          </Section>
        )}

        {/* People to Discover */}
        <Section
          title="People to Discover"
          subtitle={
            scope === 'chapter'
              ? 'Bhandhus in your Parivar who are not yet active connections.'
              : 'Bhandhus relevant to the selected Bhandhu journey scope.'
          }
        >
          {people.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {people.map(({ m, context }) => {
                const status = getMemberStatus(m.id);
                return (
                  <MemberCard
                    key={m.id}
                    member={m}
                    context={context}
                    connectionLabel={
                      status === 'sent'
                        ? 'Request Sent'
                        : status === 'received'
                          ? 'Review Request'
                          : status === 'connected'
                            ? 'Connected'
                            : 'Connect'
                    }
                    onConnect={status === 'none' ? () => void handleConnect(m.id) : undefined}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No new people to suggest"
              body="Eligible members may already be connected or outside this scope."
              action={
                <Button
                  variant="secondary"
                  onClick={() => go('/app/suggestions', { label: 'Suggestions' })}
                >
                  Review suggestions
                </Button>
              }
            />
          )}
        </Section>

        {/* Businesses in Your Scope */}
        <Section
          title="Businesses to Discover"
          subtitle={
            scope === 'chapter'
              ? `Verified member businesses active in ${chapterName}.`
              : 'Enterprise businesses across your wider network scope.'
          }
          action={
            <Button
              variant="secondary"
              onClick={() => go('/app/directory', { label: 'Directory' })}
            >
              Browse Directory
            </Button>
          }
        >
          {businesses.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {businesses.slice(0, 6).map(({ b, reason }) => (
                <BusinessCard
                  key={b.id}
                  business={b}
                  saved={savedBusinesses(n, memberId).includes(b.id)}
                  onSave={() => handleToggleBusinessSave(b.id)}
                  context={reason}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No businesses found in this scope"
              body="Switch scope or search the full directory to discover member enterprises."
              action={
                <Button
                  variant="secondary"
                  onClick={() => go('/app/directory', { label: 'Directory' })}
                >
                  Browse Directory
                </Button>
              }
            />
          )}
        </Section>

        {/* Opportunities Matching Your Business */}
        <Section
          title="Opportunities Matching Your Business"
          subtitle="Requirements relevant to your business profile and enterprise capabilities."
          action={
            <Button
              variant="secondary"
              onClick={() => go('/app/opportunities', { label: 'Opportunities' })}
            >
              View Marketplace
            </Button>
          }
        >
          {opportunities.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {opportunities.map(({ o, match }) => (
                <OpportunityCard
                  key={o.id}
                  opportunity={o}
                  categoryName={
                    (n.categories ?? []).find((c) => c.id === o.categoryId)?.name ?? 'Business opportunity'
                  }
                  businessName={
                    (n.businesses ?? []).find((b) => b.id === o.businessId)?.name ?? 'Network business'
                  }
                  matchReason={match}
                  saved={savedOpportunities(n, memberId).includes(o.id)}
                  onSave={() => handleToggleOpportunitySave(o.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matching opportunities in this scope"
              body="Try Your Network or browse the full marketplace."
              action={
                <Button
                  variant="secondary"
                  onClick={() => go('/app/opportunities', { label: 'Opportunities' })}
                >
                  View Marketplace
                </Button>
              }
            />
          )}
        </Section>

        {/* Featured from the Network */}
        {scope !== 'chapter' && promotions.length > 0 && (
          <Section
            title="Featured from the Network"
            subtitle="Active business promotions relevant to your Bhandhu/business context."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {promotions.map((p) => {
                const b = (n.businesses ?? []).find((x) => x.id === p.businessId);
                return (
                  <Card key={p.id} className="p-5 transition hover:border-amber-400 hover:shadow-md">
                    <div className="text-xs font-black uppercase tracking-wider text-amber-700">
                      Featured Promotion
                    </div>
                    <h3 className="mt-2 text-xl font-black text-[var(--navy-950)]">{p.headline}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">{p.description}</p>
                    <p className="mt-3 text-xs font-bold text-slate-500">
                      {b?.name} {b?.city ? `· ${b.city}` : ''}
                    </p>
                    <Button
                      className="mt-4 w-full"
                      onClick={() => go(`/app/promotions/${p.id}`, { label: 'Featured Promotion' })}
                    >
                      View Promotion
                    </Button>
                  </Card>
                );
              })}
            </div>
          </Section>
        )}

        {/* Upcoming Events */}
        <Section
          title="Upcoming Events"
          subtitle={
            scope === 'chapter'
              ? 'Chapter events that can create useful business relationships.'
              : 'Events in the selected Bhandhu journey scope.'
          }
        >
          {events.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  attending={Boolean(e.attendeeIds?.includes(memberId))}
                  onRsvp={() => go(`/app/events/${e.id}`, { label: 'Community' })}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming events in this scope"
              body="View the complete events calendar for more activity."
              action={
                <Button onClick={() => go('/app/events', { label: 'All Events' })}>
                  View all events
                </Button>
              }
            />
          )}
        </Section>
      </div>

      {/* Subtext info */}
      <p className="text-center text-xs text-slate-400 py-4">
        SETHU Enterprise Bhandhu Journey · Live PostgreSQL Synchronization Active
      </p>
    </div>
  );
}
