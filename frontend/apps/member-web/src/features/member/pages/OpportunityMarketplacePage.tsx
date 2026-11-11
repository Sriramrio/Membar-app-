import { useMemo } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/common/Input';
import { FilterChip } from '@/features/member/components/EnterpriseMemberUI';
import { MemberJourneyScopeBar } from '@/features/member/components/MemberJourneyScopeBar';
import { useMemberJourneyScope } from '@/features/member/navigation/useMemberJourneyScope';
import { EmptyState, OpportunityCard, PageHead, SearchField, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId, selectActiveBusiness } from '@/features/network/selectors';
import { selectMemberEntities,selectBusinessEntities,selectOpportunities } from '@/features/network/readModel';
import { toggleSavedOpportunity } from '@/features/network/networkSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import type { Opportunity } from '@/features/network/types';
import { AnalyticsSummary } from '@/features/member/analytics/AnalyticsSummary';
import { buildPersonalNetworkingAnalytics } from '@/features/member/analytics/networkingAnalytics';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { QueryError,QueryLoading } from '@/components/data/QueryState';
import { serverClock } from '@/services/time/serverClock';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

export default function OpportunityMarketplacePage() {
  const dispatch = useAppDispatch();
  const { go } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const memberEntities=useAppSelector(selectMemberEntities);
  const businessEntities=useAppSelector(selectBusinessEntities);
  const opportunities=useAppSelector(selectOpportunities);
  const categories=useAppSelector(s=>s.network.categories);
  const savedIds=useAppSelector(s=>s.network.savedOpportunityIdsByMember[memberId]??[]);
  const intelligence = useAppSelector(s => buildPersonalNetworkingAnalytics(s, memberId, 'month')); 
  const member = memberEntities[memberId];
  const business = useAppSelector(selectActiveBusiness);
  const [sp, setSp] = useSearchParams();
  const { scope, setScope } = useMemberJourneyScope();
  const q = sp.get('q') ?? '';
  const debouncedQ = useDebouncedValue(q,300);
  const category = sp.get('category') ?? '';
  const location = sp.get('location') ?? '';
  const closing = sp.get('closing') ?? 'all';
  const type = sp.get('type') ?? '';
  const savedOnly = sp.get('saved') === '1';
  const chapterFilter = sp.get('chapter') ?? '';

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(sp);
    if (value && value !== 'all') next.set(key, value); else next.delete(key);
    setSp(next, { replace: true });
  };

  const closingLimit = closing === '7' || closing === '30'
    ? (() => { const d = serverClock.now(); d.setDate(d.getDate() + Number(closing)); return d.toISOString().slice(0, 10); })()
    : undefined;

  const matchReason = (o: Opportunity) => {
    const owner = memberEntities[o.ownerMemberId];
    const reasons: string[] = [];
    if (business?.categoryIds.includes(o.categoryId)) reasons.push('matches your business category');
    if (owner?.chapter === member?.chapter) reasons.push('same chapter');
    else if (owner?.city === member?.city) reasons.push('same city');
    else if (owner?.state === member?.state) reasons.push('same state');
    const text = `${o.title} ${o.description}`.toLowerCase();
    const capability = business?.capabilities.find(x => text.includes(x.toLowerCase()));
    if (capability) reasons.unshift(`matches ${capability}`);
    return reasons.slice(0, 2).join(' + ') || 'available in your permitted network scope';
  };

  const relevance = (o: Opportunity) => {
    const owner = memberEntities[o.ownerMemberId];
    let score = 0;
    if (business?.categoryIds.includes(o.categoryId)) score += 6;
    if (owner?.chapter === member?.chapter) score += 5;
    if (owner?.city === member?.city) score += 4;
    if (owner?.region === member?.region) score += 3;
    if (owner?.state === member?.state) score += 2;
    return score;
  };

  const localRows = useMemo(() => opportunities
    .filter(o => {if(o.status!=='open'||o.ownerMemberId===memberId)return false;const owner=memberEntities[o.ownerMemberId];const ownerBusiness=businessEntities[o.businessId];if(!member||!owner||owner.status==='suspended'||!ownerBusiness||ownerBusiness.visibility==='hidden')return false;if(o.visibility==='network')return true;if(o.visibility==='chapter')return owner.chapter===member.chapter;return owner.region===member.region})
    .filter(o => !q || `${o.title} ${o.description} ${o.location} ${businessEntities[o.businessId]?.name ?? ''}`.toLowerCase().includes(q.toLowerCase()))
    .filter(o => !category || o.categoryId === category)
    .filter(o => !type || o.type === type)
    .filter(o => !location || o.location.toLowerCase().includes(location.toLowerCase()))
    .filter(o => !closingLimit || o.closingDate <= closingLimit)
    .filter(o => !savedOnly || savedIds.includes(o.id))
    .filter(o => {
      const owner = memberEntities[o.ownerMemberId];
      if (scope === 'chapter') return owner?.chapter === member?.chapter;
      return !chapterFilter || owner?.chapter === chapterFilter;
    })
    .sort((a, b) => relevance(b) - relevance(a) || a.closingDate.localeCompare(b.closingDate)), [opportunities,memberEntities,businessEntities,savedIds,memberId,q,category,type,location,closingLimit,savedOnly,chapterFilter,scope,member?.chapter]);

  const queryRequest=useMemo(()=>({queryId:'member.opportunities.marketplace',domain:'member' as const,search:debouncedQ||undefined,filters:[{field:'status',operator:'eq' as const,value:'open'},...(category?[{field:'categoryId',operator:'eq' as const,value:category}]:[]),...(type?[{field:'type',operator:'eq' as const,value:type}]:[]),...(location?[{field:'location',operator:'contains' as const,value:location}]:[]),...(closingLimit?[{field:'closingDate',operator:'lte' as const,value:closingLimit}]:[]),...(savedOnly?[{field:'savedByMemberId',operator:'eq' as const,value:memberId}]:[]),...(scope==='chapter'&&member?[{field:'ownerChapter',operator:'eq' as const,value:member.chapter}]:chapterFilter?[{field:'ownerChapter',operator:'eq' as const,value:chapterFilter}]:[])],sort:[{field:'relevance',direction:'desc' as const},{field:'closingDate',direction:'asc' as const}],pagination:{pageSize:30},parameters:{viewerMemberId:memberId}}),[debouncedQ,category,type,location,closingLimit,savedOnly,memberId,scope,chapterFilter,member?.chapter]);
  const query=useDomainCursorPage<Opportunity>(queryRequest,localRows,[debouncedQ,category,type,location,closingLimit,savedOnly,scope,chapterFilter,memberId]);useRealtimeRefresh(['opportunity.*','opportunity-response.*','business.*'],query.reload);
  const rows=query.page?.items??[];

  const activeFilters = [
    category && { key: 'category', label: `Category: ${categories.find(c => c.id === category)?.name ?? category}` },
    type && { key: 'type', label: `Type: ${type}` },
    location && { key: 'location', label: `Location: ${location}` },
    closing !== 'all' && { key: 'closing', label: `Closing: ${closing} days` },
    savedOnly && { key: 'saved', label: 'Saved only' },
  ].filter(Boolean) as Array<{key:string;label:string}>;

  return (
    <div>
      <PageHead eyebrow="B2B opportunity discovery" title="Opportunity Marketplace" description="Find requirements, offerings and collaborations that fit your business capabilities, location and network scope." actions={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => go('/app/opportunities/my', { label: 'Opportunity Marketplace' })}>My Opportunities</Button><Button variant="secondary" onClick={() => go('/app/responses/my', { label: 'Opportunity Marketplace' })}>My Responses</Button><Button onClick={() => go('/app/opportunities/new', { label: 'Opportunity Marketplace' })}><Plus className="size-4" />Post Opportunity</Button></div>} />

      <MemberJourneyScopeBar value={scope} onChange={setScope} className="mb-5" />

      <section className="mb-5"><div className="mb-2"><h2 className="font-black text-[var(--navy-950)]">Opportunity activity · This Month</h2><p className="text-sm text-slate-500">Created, relevant, responded, pending and linked outcomes.</p></div><AnalyticsSummary items={intelligence.business.opportunities} onOpen={route=>go(route,{label:'Opportunity Analytics'})}/></section>

      <Card className="mb-5 p-5">
        <SearchField value={q} onChange={v => set('q', v)} placeholder="Search requirements, products, services, capabilities or businesses…" />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-1.5 text-sm font-bold">Category<select className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base" value={category} onChange={e => set('category', e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-bold">Opportunity type<select className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base" value={type} onChange={e => set('type', e.target.value)}><option value="">All types</option><option>Requirement</option><option>Offering</option><option>Collaboration</option></select></label>
          <Input label="Location" placeholder="City, state or region" value={location} onChange={e => set('location', e.target.value)} />
          <label className="grid gap-1.5 text-sm font-bold">Closing window<select className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base" value={closing} onChange={e => set('closing', e.target.value)}><option value="all">Any closing date</option><option value="7">Closes in 7 days</option><option value="30">Closes in 30 days</option></select></label>
          <div className="flex items-end"><Button className="w-full" variant={savedOnly ? 'default' : 'secondary'} onClick={() => set('saved', savedOnly ? '' : '1')}>{savedOnly ? 'Showing saved' : 'Show saved'}</Button></div>
        </div>
        {activeFilters.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2"><SlidersHorizontal className="size-4 text-slate-400" />{activeFilters.map(f => <FilterChip key={f.key} label={f.label} onRemove={() => set(f.key, f.key === 'closing' ? 'all' : '')} />)}<Button variant="ghost" onClick={() => setSp(new URLSearchParams())}>Clear all</Button></div>}
      </Card>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-base font-semibold text-slate-600">{query.page?.page.totalEstimate??rows.length} opportunity{rows.length === 1 ? '' : 'ies'} found</p><p className="text-sm text-slate-500">Sorted by relevance, then closing date</p></div>
      {query.loading&&!query.page?<QueryLoading label="Loading opportunities…"/>:query.error?<QueryError error={query.error} onRetry={query.reload}/>:<><div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{rows.map(o => <OpportunityCard key={o.id} opportunity={o} categoryName={categories.find(c => c.id === o.categoryId)?.name ?? 'Opportunity'} businessName={businessEntities[o.businessId]?.name ?? 'Network business'} saved={savedIds.includes(o.id)} onSave={() => dispatch(toggleSavedOpportunity({ memberId, opportunityId: o.id }))} matchReason={matchReason(o)} />)}</div>
      {!rows.length && <EmptyState title="No opportunities match these filters" body="Broaden your category, location or closing-date filters, or review your business capabilities to improve matching." action={<Button variant="secondary" onClick={() => setSp(new URLSearchParams())}>Clear filters</Button>} />}<div className="mt-5 flex justify-between"><Button variant="secondary" onClick={query.previous} disabled={!query.canPrevious}>Previous</Button><Button variant="secondary" onClick={query.next} disabled={!query.canNext}>Next</Button></div></>}
      <div className="mt-6"><Tip>Match explanations are based on declared business/category and geography signals. They are guidance, not an automated qualification or award decision.</Tip></div>
    </div>
  );
}
