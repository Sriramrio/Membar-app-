import { useEffect, useMemo, useRef, useState } from 'react';
import { env } from '@/config/env';
import AuthoritativeDirectoryPage from './AuthoritativeDirectoryPage';
import { Filter, LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { NumberedPagination } from '@/components/ui/NumberedPagination';
import { BusinessCard, EmptyState, MemberCard, PageHead } from '@/features/network/components/NetworkUI';
import { FilterChip } from '@/features/member/components/EnterpriseMemberUI';
import { MemberJourneyScopeBar, type MemberJourneyScope } from '@/features/member/components/MemberJourneyScopeBar';
import { activeMemberId } from '@/features/network/selectors';
import { selectBusinesses, selectMembers, selectAffiliations, selectConnections, selectCertificationRecords, selectMemberEntities } from '@/features/network/readModel';
import { toggleSavedBusiness } from '@/features/network/networkSlice';
import { relationBetween } from '@/features/network/accessPolicy';
import type { Business, Member } from '@/features/network/types';
import { MEMBER_NAV_STORAGE_KEYS } from '@/utils/constants';
import { Tabs } from '@/components/ui/Tabs';
import { toast } from '@/components/ui/Toast';
import { NetworkCardSkeleton } from '@/components/ui/Skeleton';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { QueryError } from '@/components/data/QueryState';
import { sessionStorageService } from '@/services/storage/sessionStorage';
import { useConnectionCommands } from '@/hooks/useConnectionCommands';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

type Mode = 'businesses' | 'people';
type View = 'grid' | 'list';
const uniq = (v: string[]) => [...new Set(v.filter(Boolean))].sort();

export default function SmartMemberBusinessDirectoryPage() {
  return env.authoritativeServer ? <AuthoritativeDirectoryPage /> : <PreviewDirectoryPage />;
}

function PreviewDirectoryPage() {
  const [params, setParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const connectionCommands = useConnectionCommands();
  const allBusinesses = useAppSelector(selectBusinesses);
  const members = useAppSelector(selectMembers);
  const affiliations = useAppSelector(selectAffiliations);
  const connections = useAppSelector(selectConnections);
  const certificationRecords = useAppSelector(selectCertificationRecords);
  const memberEntities = useAppSelector(selectMemberEntities);
  const categories = useAppSelector(s => s.network.categories);
  const taxonomyTerms = useAppSelector(s => s.controlPlane.taxonomy.filter(t => t.active));
  const taxonomy = taxonomyTerms;
  const matchingPolicy = useAppSelector(s => s.controlPlane.matchingPolicies.find(p => p.active && p.code === 'directory.default'));
  const memberId = useAppSelector(activeMemberId);
  const viewer = memberEntities[memberId]!;
  const savedBusinessIds = useAppSelector(s => s.network.savedBusinessIdsByMember[memberId] ?? []);
  const journeyScope: MemberJourneyScope = params.get('scope') === 'chapter' ? 'chapter' : params.get('scope') === 'network' ? 'network' : 'for-you';

  const setJourneyScope = (scope: MemberJourneyScope) => {
    const next = new URLSearchParams(params);
    if (scope === 'for-you') {
      next.delete('scope');
      next.delete('chapter');
    } else if (scope === 'chapter') {
      next.set('scope', 'chapter');
      next.set('chapter', viewer.chapter);
    } else {
      next.set('scope', 'network');
      next.set('chapter', '*');
    }
    next.delete('page');
    setParams(next, { replace: true });
  };

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const closeFilterRef = useRef<HTMLButtonElement | null>(null);
  const mode = (params.get('mode') as Mode) || 'businesses';
  const view = (params.get('view') as View) || 'grid';
  const query = params.get('q') ?? '';
  const debouncedQuery = useDebouncedValue(query, 300);
  const pageSize = 24;

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const savedQuery = sessionStorageService.rawGetResult(MEMBER_NAV_STORAGE_KEYS.directoryQuery);
    const anchor = sessionStorageService.rawGetResult(MEMBER_NAV_STORAGE_KEYS.directoryScroll);
    if (savedQuery.ok && anchor.ok && anchor.value && params.toString() === savedQuery.value) {
      requestAnimationFrame(() => window.scrollTo({ top: Number(anchor.value) || 0 }));
    }
    return () => {
      sessionStorageService.rawSetResult(MEMBER_NAV_STORAGE_KEYS.directoryScroll, String(window.scrollY));
      sessionStorageService.rawSetResult(MEMBER_NAV_STORAGE_KEYS.directoryQuery, params.toString());
    };
  }, [params]);

  useEffect(() => {
    if (filtersOpen) {
      closeFilterRef.current?.focus();
      const key = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setFiltersOpen(false);
      };
      document.addEventListener('keydown', key);
      return () => document.removeEventListener('keydown', key);
    }
  }, [filtersOpen]);

  const options = useMemo(() => ({
    countries: uniq(allBusinesses.map(b => b.country)),
    states: uniq(allBusinesses.map(b => b.state)),
    regions: uniq(allBusinesses.map(b => b.region)),
    cities: uniq(allBusinesses.map(b => b.city)),
    chapters: uniq(allBusinesses.map(b => b.chapter)),
    certifications: uniq(certificationRecords.filter(c => !['Rejected', 'Expired'].includes(c.verificationStatus)).map(c => c.standard)),
    industries: uniq(allBusinesses.flatMap(b => b.industries ?? [])),
    capabilities: uniq(allBusinesses.flatMap(b => b.capabilities))
  }), [allBusinesses, certificationRecords]);

  const category = params.get('category') ?? '';
  const country = params.get('country') ?? '';
  const state = params.get('state') ?? '';
  const region = params.get('region') ?? '';
  const city = params.get('city') ?? '';
  const chapterRaw = params.get('chapter');
  const chapter = chapterRaw === null ? (journeyScope === 'chapter' ? viewer.chapter : '') : chapterRaw === '*' ? '' : chapterRaw;
  const relationship = params.get('relationship') ?? '';
  const verification = params.get('verification') ?? '';
  const certification = params.get('certification') ?? '';
  const industry = params.get('industry') ?? '';
  const capability = params.get('capability') ?? '';
  const sort = params.get('sort') ?? 'relevance';

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, [query, mode, category, country, state, region, city, chapterRaw, certification, industry, capability, verification, relationship, sort]);

  const terms = query.trim().toLowerCase();
  const matchedTaxonomy = taxonomy.filter(t => terms && [t.name, ...t.synonyms, ...t.keywords].some(x => x.toLowerCase().includes(terms) || terms.includes(x.toLowerCase())));
  const expandedTerms = uniq([terms, ...matchedTaxonomy.flatMap(t => [t.name.toLowerCase(), ...t.synonyms.map(x => x.toLowerCase()), ...t.keywords.map(x => x.toLowerCase())])]).filter(Boolean);

  const businessHay = (b: Business) => [
    b.name, b.legalName, b.tradeName, b.description, ...b.products, ...b.services, ...b.capabilities,
    ...(b.processes ?? []), ...(b.materials ?? []), ...(b.industries ?? []),
    ...certificationRecords.filter(c => c.businessId === b.id && !['Rejected', 'Expired'].includes(c.verificationStatus)).map(c => c.standard),
    ...(b.taxonomyRefs ?? []).flatMap(ref => {
      const t = taxonomy.find(x => x.id === ref.taxonomyId || x.code === ref.taxonomyId);
      return t ? [t.name, ...t.synonyms, ...t.keywords] : [];
    })
  ].filter(Boolean).join(' ').toLowerCase();

  const businessScore = (b: Business) => {
    const p = matchingPolicy;
    const sameChapter = b.chapter === viewer.chapter;
    const verified = b.verified;
    const taxHits = (b.taxonomyRefs ?? []).filter(ref => matchedTaxonomy.some(t => t.id === ref.taxonomyId || t.code === ref.taxonomyId)).length;
    if (!terms) return (Number(Boolean(b.featured)) * Math.max(1, p?.relationshipWeight ?? 4)) + (verified ? Math.max(1, p?.certificationWeight ?? 2) : 0) + (sameChapter ? Math.max(1, p?.geographyWeight ?? 2) : 0);
    let score = 0;
    if (b.name.toLowerCase().includes(terms)) score += p?.searchableFields.name ?? 12;
    for (const t of expandedTerms) if (businessHay(b).includes(t)) score += t === terms ? Math.max(2, p?.capabilityWeight ?? 5) : 2;
    score += taxHits * (p?.taxonomyWeight ?? 3);
    if (sameChapter) score += p?.geographyWeight ?? 2;
    if (verified) score += p?.certificationWeight ?? 1;
    return score;
  };

  const relationshipContext = (b: Business) => {
    const reps = affiliations.filter(a => a.businessId === b.id && a.active && a.verificationStatus === 'Verified').map(a => a.memberId);
    const connected = reps.some(id => connections.some(c => ((c.ownerId === viewer.id && c.targetId === id) || (c.targetId === viewer.id && c.ownerId === id)) && c.status === 'connected'));
    if (connected) return 'Connected business';
    if (b.chapter === viewer.chapter) return 'Same Chapter';
    if (b.city === viewer.city) return 'Same City';
    return 'Network business';
  };

  const matchReason = (b: Business) => {
    const reasons: string[] = [];
    if (terms && b.name.toLowerCase().includes(terms)) reasons.push('company name match');
    if (capability && b.capabilities.includes(capability)) reasons.push(`capability: ${capability}`);
    if (industry && b.industries?.includes(industry)) reasons.push(`industry: ${industry}`);
    if (matchedTaxonomy.length) reasons.push(`taxonomy: ${matchedTaxonomy.slice(0, 2).map(t => t.name).join(', ')}`);
    if (b.chapter === viewer.chapter) reasons.push('same chapter');
    return reasons.slice(0, 2).join(' · ') || relationshipContext(b);
  };

  const businessMatches = (b: Business) => {
    const viewerBusinessIds = affiliations.filter(a => a.memberId === viewer.id && a.active && a.verificationStatus === 'Verified').map(a => a.businessId);
    if (b.visibility === 'hidden' && !viewerBusinessIds.includes(b.id)) return false;
    if (category && !b.categoryIds.includes(category)) return false;
    if (country && b.country !== country || state && b.state !== state || region && b.region !== region || city && b.city !== city || chapter && b.chapter !== chapter) return false;
    if (certification && !certificationRecords.some(c => c.businessId === b.id && c.standard === certification && !['Rejected', 'Expired'].includes(c.verificationStatus))) return false;
    if (industry && !b.industries?.includes(industry)) return false;
    if (capability && !b.capabilities.includes(capability)) return false;
    if (verification === 'verified' && !b.verified) return false;
    const reps = affiliations.filter(a => a.businessId === b.id && a.active).map(a => a.memberId);
    const connected = reps.some(id => connections.some(c => ((c.ownerId === viewer.id && c.targetId === id) || (c.targetId === viewer.id && c.ownerId === id)) && c.status === 'connected'));
    if (relationship === 'connected' && !connected) return false;
    if (relationship === 'same-chapter' && b.chapter !== viewer.chapter) return false;
    if (relationship === 'not-connected' && connected) return false;
    if (relationship === 'recommended' && businessScore(b) <= 0) return false;
    const hay = businessHay(b);
    return !terms || hay.includes(terms) || expandedTerms.some(t => hay.includes(t));
  };

  const businesses = useMemo(() => allBusinesses.filter(businessMatches).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'city' ? a.city.localeCompare(b.city) : businessScore(b) - businessScore(a)), [allBusinesses, affiliations, certificationRecords, connections, query, category, country, state, region, city, chapter, certification, industry, capability, verification, relationship, sort, viewer.id, viewer.chapter]);

  const people = useMemo(() => members.filter(m => {
    if (m.id === viewer.id || (m.status && m.status !== 'active')) return false;
    const affiliatedIds = affiliations.filter(a => a.memberId === m.id && a.active && a.verificationStatus === 'Verified').map(a => a.businessId);
    const matching = allBusinesses.filter(x => affiliatedIds.includes(x.id)).filter(businessMatches);
    if (!matching.length) return false;
    const cs = connections.find(c => (c.ownerId === viewer.id && c.targetId === m.id) || (c.targetId === viewer.id && c.ownerId === m.id));
    const status = cs ? (cs.ownerId === viewer.id ? cs.status : cs.status === 'sent' ? 'received' : cs.status === 'received' ? 'sent' : cs.status) : 'none';
    const rel = relationBetween(viewer, m, status);
    if (rel === 'blocked' || rel === 'unavailable') return false;
    if (relationship === 'connected' && rel !== 'connected') return false;
    if (relationship === 'same-chapter' && m.chapter !== viewer.chapter) return false;
    if (relationship === 'not-connected' && rel === 'connected') return false;
    const hay = `${m.name} ${m.designation} ${m.expertise.join(' ')} ${matching.map(b => businessHay(b)).join(' ')}`.toLowerCase();
    return !terms || hay.includes(terms) || expandedTerms.some(t => hay.includes(t));
  }).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : a.chapter === viewer.chapter ? -1 : b.chapter === viewer.chapter ? 1 : 0), [members, allBusinesses, affiliations, certificationRecords, connections, query, category, country, state, region, city, chapter, certification, industry, capability, verification, relationship, sort, viewer.id, viewer.chapter, taxonomy]);

  const rows = mode === 'businesses' ? businesses : people;

  const queryRequest = useMemo(() => ({
    queryId: mode === 'businesses' ? 'member.directory.businesses' : 'member.directory.people',
    domain: 'member' as const,
    search: debouncedQuery || undefined,
    filters: [
      ...(category ? [{ field: 'categoryId', operator: 'eq' as const, value: category }] : []),
      ...(country ? [{ field: 'country', operator: 'eq' as const, value: country }] : []),
      ...(state ? [{ field: 'state', operator: 'eq' as const, value: state }] : []),
      ...(region ? [{ field: 'region', operator: 'eq' as const, value: region }] : []),
      ...(city ? [{ field: 'city', operator: 'eq' as const, value: city }] : []),
      ...(chapter ? [{ field: 'chapter', operator: 'eq' as const, value: chapter }] : []),
      ...(industry ? [{ field: 'industry', operator: 'eq' as const, value: industry }] : []),
      ...(capability ? [{ field: 'capability', operator: 'eq' as const, value: capability }] : []),
      ...(certification ? [{ field: 'certification', operator: 'eq' as const, value: certification }] : []),
      ...(verification ? [{ field: 'verification', operator: 'eq' as const, value: verification }] : []),
      ...(relationship ? [{ field: 'relationship', operator: 'eq' as const, value: relationship }] : [])
    ],
    sort: [{ field: sort === 'relevance' ? 'relevance' : sort, direction: sort === 'relevance' ? 'desc' as const : 'asc' as const }],
    pagination: { pageSize },
    parameters: { viewerMemberId: viewer.id, scope: journeyScope }
  }), [mode, debouncedQuery, category, country, state, region, city, chapter, industry, capability, certification, verification, relationship, sort, viewer.id, journeyScope]);

  const directoryQuery = useDomainCursorPage<Business | Member>(queryRequest, rows, [mode, debouncedQuery, category, country, state, region, city, chapter, industry, capability, certification, verification, relationship, sort, journeyScope]);
  useRealtimeRefresh(['member.*', 'business.*', 'affiliation.*', 'certification.*'], directoryQuery.reload);

  const visible = directoryQuery.page?.items ?? [];
  const active = [
    ['category', category], ['country', country], ['state', state], ['region', region],
    ['city', city], ['chapter', chapter], ['industry', industry], ['capability', capability],
    ['relationship', relationship], ['verification', verification], ['certification', certification]
  ].filter(([, v]) => v);

  const selectClass =
    'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-all duration-200 hover:border-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100';
  const FilterPanel = () => (
    <div className="grid gap-4">
      <label className="grid gap-1 text-sm font-bold text-slate-600">
        Business category
        <select className={selectClass} value={category} onChange={e => set('category', e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      {([
        ['country', 'Country', options.countries, country],
        ['state', 'State', options.states, state],
        ['region', 'Region', options.regions, region],
        ['city', 'City', options.cities, city],
        ['chapter', 'Chapter', options.chapters, chapterRaw === '*' ? '*' : chapter],
        ['industry', 'Industry', options.industries, industry],
        ['capability', 'Capability', options.capabilities, capability],
        ['certification', 'Certification', options.certifications, certification]
      ] as const).map(([key, label, list, value]) => (
        <label key={key} className="grid gap-1 text-sm font-bold text-slate-600">
          {label}
          <select className={selectClass} value={value} onChange={e => set(key, e.target.value)}>
            <option value={key === 'chapter' ? '*' : ''}>{key === 'chapter' ? 'All network' : 'All'}</option>
            {list.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
      ))}
      <label className="grid gap-1 text-sm font-bold text-slate-600">
        Relationship
        <select className={selectClass} value={relationship} onChange={e => set('relationship', e.target.value)}>
          <option value="">Any relationship</option>
          <option value="connected">Connected</option>
          <option value="same-chapter">Same Parivar</option>
          <option value="recommended">Recommended</option>
          <option value="not-connected">Not Connected</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold text-slate-600">
        Trust
        <select className={selectClass} value={verification} onChange={e => set('verification', e.target.value)}>
          <option value="">All visible businesses</option>
          <option value="verified">Verified businesses</option>
        </select>
      </label>
    </div>
  );

  return (
    <div>
      <PageHead
        eyebrow="Discover"
        title="Bhandhu & Business Directory"
        description="Find Members, Businesses and capabilities without losing your search context."
      />
      <CommandExecutionFeedback
        error={connectionCommands.error}
        onRetry={() => void connectionCommands.retry()}
        onDismiss={connectionCommands.clearError}
      />
      <MemberJourneyScopeBar value={journeyScope} onChange={setJourneyScope} />

      {/* Prominent Search Bar & Filter Controls */}
      <div className="mb-6 flex flex-col gap-3.5">
        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          />

          <input
            aria-label="Search directory"
            type="search"
            value={query}
            onChange={e => set('q', e.target.value)}
            placeholder="Search companies, capabilities, products, members or industries…"
            className="
      h-12
      w-full
      rounded-xl
      border
      border-slate-300
      bg-white
      pl-12
      pr-11
      text-sm
      font-medium
      text-slate-800
      shadow-sm
      outline-none
      transition-all
      duration-200
      placeholder:text-slate-400
      hover:border-slate-400
      focus:border-sky-600
      focus:ring-4
      focus:ring-sky-100
    "
          />

          {query && (
            <button
              type="button"
              onClick={() => set('q', '')}
              aria-label="Clear search"
              className="
        absolute
        right-3
        top-1/2
        grid
        size-7
        -translate-y-1/2
        place-items-center
        rounded-lg
        text-slate-400
        transition
        hover:bg-slate-100
        hover:text-slate-700
      "
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tabs
              ariaLabel="Directory mode"
              value={mode}
              onChange={m => set('mode', m)}
              items={[
                { key: 'businesses', label: `Businesses (${businesses.length})` },
                { key: 'people', label: `People (${people.length})` }
              ]}
            />
            <Button variant="secondary" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
              <Filter className="size-4" />
              Filters
            </Button>
          </div>
          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <span className="hidden sm:inline">Sort:</span>
              <select
                aria-label="Sort results"
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold shadow-2xs outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                value={sort}
                onChange={e => set('sort', e.target.value)}
              >
                <option value="relevance">Relevant first</option>
                <option value="name">Name A–Z</option>
                <option value="city">City A–Z</option>
              </select>
            </label>
            <div className="flex rounded-xl border border-slate-300 bg-white p-1 shadow-2xs">
              <button
                type="button"
                aria-label="Grid view"
                className={`grid size-9 place-items-center rounded-lg transition ${view === 'grid' ? 'bg-slate-100 font-bold text-[var(--navy-900)]' : 'text-slate-400 hover:text-slate-700'
                  }`}
                onClick={() => set('view', 'grid')}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                aria-label="List view"
                className={`grid size-9 place-items-center rounded-lg transition ${view === 'list' ? 'bg-slate-100 font-bold text-[var(--navy-900)]' : 'text-slate-400 hover:text-slate-700'
                  }`}
                onClick={() => set('view', 'list')}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {active.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-500">Active filters:</span>
          {active.map(([key, value]) => (
            <FilterChip key={key} label={`${key}: ${value}`} onRemove={() => set(key, '')} />
          ))}
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams();
              next.set('mode', mode);
              setParams(next);
            }}
            className="min-h-9 px-2 text-sm font-bold text-red-700"
          >
            Clear All
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden h-fit rounded-2xl border border-slate-200 bg-white p-5 lg:block">
          <div className="mb-5 flex items-center gap-2 text-lg font-black">
            <SlidersHorizontal className="size-5" />
            Filters
          </div>
          <FilterPanel />
        </aside>

        <main>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-base text-slate-600">
              <strong className="text-slate-900">{directoryQuery.page?.page.totalEstimate ?? rows.length}</strong>{' '}
              {mode === 'businesses' ? 'businesses' : 'people'} found
              {matchedTaxonomy.length > 0 && (
                <span className="ml-2 text-sm font-semibold text-sky-700">
                  · related terms: {matchedTaxonomy.map(t => t.name).join(', ')}
                </span>
              )}
            </p>
            <p className="text-sm text-slate-500">Cursor-paged · {visible.length} loaded</p>
          </div>

          {isLoading || (directoryQuery.loading && !directoryQuery.page) ? (
            <div className={view === 'grid' ? 'grid gap-4 sm:grid-cols-2 2xl:grid-cols-3' : 'grid gap-4'}>
              <NetworkCardSkeleton count={6} />
            </div>
          ) : directoryQuery.error ? (
            <QueryError error={directoryQuery.error} onRetry={directoryQuery.reload} />
          ) : visible.length ? (
            <div className={view === 'grid' ? 'grid gap-4 sm:grid-cols-2 2xl:grid-cols-3' : 'grid gap-4'}>
              {mode === 'businesses'
                ? (visible as Business[]).map(b => (
                  <BusinessCard
                    key={b.id}
                    business={b}
                    context={matchReason(b)}
                    saved={savedBusinessIds.includes(b.id)}
                    onSave={() => {
                      const isSaved = savedBusinessIds.includes(b.id);
                      dispatch(toggleSavedBusiness({ memberId: viewer.id, businessId: b.id }));
                      if (isSaved) {
                        toast.info(`Removed ${b.name} from saved`);
                      } else {
                        toast.success(`Saved ${b.name} to bookmarks`);
                      }
                    }}
                  />
                ))
                : (visible as Member[]).map(m => {
                  const cs = connections.find(c => (c.ownerId === viewer.id && c.targetId === m.id) || (c.targetId === viewer.id && c.ownerId === m.id));
                  const status = cs ? (cs.ownerId === viewer.id ? cs.status : cs.status === 'sent' ? 'received' : cs.status === 'received' ? 'sent' : cs.status) : 'none';
                  return (
                    <MemberCard
                      key={m.id}
                      member={m}
                      context={status === 'connected' ? 'Connected' : m.chapter === viewer.chapter ? 'Same Chapter' : m.city === viewer.city ? 'Same City' : 'Network Member'}
                      connectionLabel={status === 'sent' ? 'Request Sent' : status === 'connected' ? 'Connected' : status === 'received' ? 'Review Request' : 'Connect'}
                      onConnect={status === 'none' ? () => {
                        void connectionCommands.request(m.id, 'Directory discovery').then(r => {
                          if (r.ok) toast.success(`Connection request sent to ${m.name}`);
                        });
                      } : undefined}
                    />
                  );
                })}
            </div>
          ) : (
            <EmptyState
              title="No matching results"
              body="Try removing a filter, searching a broader business term, or expanding the location scope. Hidden businesses and unavailable members remain excluded."
              action={
                <Button onClick={() => {
                  const next = new URLSearchParams();
                  next.set('mode', mode);
                  setParams(next);
                }}>
                  Clear filters and start again
                </Button>
              }
            />
          )}

          <NumberedPagination
            currentPage={directoryQuery.currentPage}
            totalPages={directoryQuery.totalPages}
            totalItems={directoryQuery.totalItems}
            pageSize={directoryQuery.pageSize}
            onPageChange={directoryQuery.goToPage}
            canPrevious={directoryQuery.canPrevious}
            canNext={directoryQuery.canNext}
            itemName={mode === 'businesses' ? 'businesses' : 'people'}
          />
        </main>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-950/50 lg:hidden" onMouseDown={() => setFiltersOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="directory-filter-title"
            className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-auto rounded-t-3xl bg-white p-5 pb-8"
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 -mx-1 mb-5 flex items-center justify-between bg-white px-1 py-1">
              <div>
                <h2 id="directory-filter-title" className="text-2xl font-black">Directory Filters</h2>
                <p className="text-sm text-slate-500">Narrow the network by location, business, trust and relationship.</p>
              </div>
              <button
                type="button"
                ref={closeFilterRef}
                className="grid size-11 place-items-center rounded-xl border border-slate-200"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close directory filters"
              >
                <X className="size-5" />
              </button>
            </div>
            <FilterPanel />
            <Button className="mt-6 w-full" onClick={() => setFiltersOpen(false)}>
              Show {rows.length} results
            </Button>
          </section>
        </div>
      )}
    </div>
  );
}