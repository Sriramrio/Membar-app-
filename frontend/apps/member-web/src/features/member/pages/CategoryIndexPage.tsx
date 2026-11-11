import { useEffect, useState, useMemo } from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';
import { Layers3, ArrowRight, FolderTree, Tag } from 'lucide-react';
import { useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageHead, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId, affiliatedBusinessIdsForMember, opportunityVisibleToMember } from '@/features/network/selectors';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { categoriesApi, type CategorySectorDto } from '@/services/api/categoriesApi';
import { searchAuthoritativeDirectory } from '@/services/api/directoryApi';

export default function CategoryIndexPage() {
  const { go } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const n = useNetworkSlice(['affiliations', 'businesses', 'categories', 'members', 'opportunities'] as const);

  const [liveCategories, setLiveCategories] = useState<CategorySectorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState('');
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState('');
  const [selectedSpecFilter, setSelectedSpecFilter] = useState('');
  const [liveMemberSlotMap, setLiveMemberSlotMap] = useState<Record<string, { memberName: string; chapterId?: string }>>({});

  const filteredLiveCategories = useMemo(() => {
    return liveCategories.map(sec => {
      if (selectedSectorFilter && sec.id !== selectedSectorFilter) return null;
      const q = searchFilter.trim().toLowerCase();
      const secMatch = !q || sec.name.toLowerCase().includes(q);

      const matchingSegments = (sec.segments || []).map(seg => {
        if (selectedSegmentFilter && seg.id !== selectedSegmentFilter) return null;
        const segMatch = !q || seg.name.toLowerCase().includes(q);
        const matchingSpecs = (seg.specialisations || []).filter(sp => {
          if (selectedSpecFilter && sp.id !== selectedSpecFilter) return false;
          if (q && !sp.name.toLowerCase().includes(q)) return false;
          return true;
        });

        if (selectedSpecFilter) {
          if (matchingSpecs.length > 0) {
            return {
              ...seg,
              specialisations: matchingSpecs
            };
          }
          return null;
        }

        if (secMatch || segMatch || matchingSpecs.length > 0) {
          return {
            ...seg,
            specialisations: (!q || secMatch || segMatch) ? seg.specialisations : matchingSpecs
          };
        }
        return null;
      }).filter(Boolean) as typeof sec.segments;

      if (matchingSegments.length > 0) {
        return {
          ...sec,
          segments: matchingSegments
        };
      }
      return null;
    }).filter(Boolean) as CategorySectorDto[];
  }, [liveCategories, searchFilter, selectedSectorFilter, selectedSegmentFilter, selectedSpecFilter]);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    async function loadTaxonomy() {
      try {
        const data = await categoriesApi.getCategories(controller.signal);
        if (mounted && Array.isArray(data) && data.length > 0) {
          setLiveCategories(data);
          setIsLiveConnected(true);
          setLoading(false);
        }
      } catch {}
      try {
        const r1 = await fetch('/api/categories', { signal: controller.signal });
        if (r1.ok) {
          const d1 = await r1.json();
          if (mounted && Array.isArray(d1) && d1.length > 0) {
            setLiveCategories(d1);
            setIsLiveConnected(true);
            setLoading(false);
          }
        }
      } catch {}
      try {
        const r2 = await fetch('http://localhost:62936/api/categories', { signal: controller.signal });
        if (r2.ok) {
          const d2 = await r2.json();
          if (mounted && Array.isArray(d2) && d2.length > 0) {
            setLiveCategories(d2);
            setIsLiveConnected(true);
            setLoading(false);
          }
        }
      } catch {}
      if (mounted) setLoading(false);

      // Load live directory members to accurately map slots
      try {
        const dir = await searchAuthoritativeDirectory({ scope: 'YourNetwork', page: 1, size: 50 }, controller.signal);
        if (mounted && dir && Array.isArray(dir.items)) {
          const map: Record<string, { memberName: string; chapterId?: string }> = {};
          for (const item of dir.items) {
            if (item.specialisationId) {
              map[item.specialisationId.toLowerCase()] = {
                memberName: item.businessName,
                chapterId: item.chapterId
              };
            }
          }
          setLiveMemberSlotMap(map);
        }
      } catch {}
    }
    void loadTaxonomy();
    return () => { mounted = false; controller.abort(); };
  }, []);

  // Redux fallback rows
  const reduxRows = n.categories.map((c) => {
    const businesses = n.businesses.filter((b) => b.visibility !== 'hidden' && b.categoryIds.includes(c.id));
    const businessIds = new Set(businesses.map((b) => b.id));
    const members = n.members.filter((m) => m.status !== 'suspended' && affiliatedBusinessIdsForMember(n, m.id).some((id) => businessIds.has(id)));
    const opportunities = n.opportunities.filter((o) => o.categoryId === c.id && o.status === 'open' && opportunityVisibleToMember({ network: n }, o, memberId));
    return { c, businesses, members, opportunities };
  });

  return (
    <div>
      <PageHead
        // eyebrow={isLiveConnected ? "Database Connected (643 Governed Categories)" : undefined}
        title="Business Categories"
        // description="Explore all 27 Industries → 105 Groups → 643 Categories. Click any category to view assigned members."
      />

      {/* Real-time Category Search Bar */}
      <div className="my-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <label htmlFor="category-search-input" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
          Search all  categories across the network
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="category-search-input"
            type="search"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Type any Industry, Group, or Category (e.g. Chemicals, Logistics, IT, Machinery)..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {searchFilter && (
          <p className="mt-2 text-xs font-medium text-sky-700">
            Showing matching categories for &ldquo;{searchFilter}&rdquo; ({filteredLiveCategories.length} sectors matching)
          </p>
        )}

        {/* Active Filter Pills Bar */}
        {(searchFilter || selectedSectorFilter || selectedSegmentFilter || selectedSpecFilter) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
            <span className="text-xs font-bold text-slate-500">Active filters:</span>
            {searchFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                Text: &ldquo;{searchFilter}&rdquo;
                <button type="button" onClick={() => setSearchFilter('')} className="hover:text-red-600"><X className="size-3" /></button>
              </span>
            )}
            {selectedSectorFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
                Sector: {liveCategories.find(s => s.id === selectedSectorFilter)?.name}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSectorFilter('');
                    setSelectedSegmentFilter('');
                    setSelectedSpecFilter('');
                  }}
                  className="hover:text-red-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {selectedSegmentFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                Group: {(() => {
                  const sec = liveCategories.find(s => s.id === selectedSectorFilter);
                  return sec?.segments?.find(g => g.id === selectedSegmentFilter)?.name || 'Group';
                })()}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSegmentFilter('');
                    setSelectedSpecFilter('');
                  }}
                  className="hover:text-red-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {selectedSpecFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 border border-sky-200 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                Specialisation: {(() => {
                  const sec = liveCategories.find(s => s.id === selectedSectorFilter);
                  const seg = sec?.segments?.find(g => g.id === selectedSegmentFilter);
                  return seg?.specialisations?.find(sp => sp.id === selectedSpecFilter)?.name || 'Slot';
                })()}
                <button
                  type="button"
                  onClick={() => setSelectedSpecFilter('')}
                  className="hover:text-red-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedSectorFilter('');
                setSelectedSegmentFilter('');
                setSelectedSpecFilter('');
                setSearchFilter('');
              }}
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-100 transition"
            >
              <RotateCcw className="size-3" />
              <span>Clear All Filters</span>
            </button>
          </div>
        )}

        {/* 3-Tier Taxonomy Filter Bar */}
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Filter className="size-3 text-sky-600" />
              Filter by Sector, Segment & Specialisation
            </span>
            {(selectedSectorFilter || selectedSegmentFilter || selectedSpecFilter || searchFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSectorFilter('');
                  setSelectedSegmentFilter('');
                  setSelectedSpecFilter('');
                  setSearchFilter('');
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 hover:underline"
              >
                <RotateCcw className="size-3" />
                <span>Clear filters</span>
              </button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {/* 1. Sector Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Filter by Sector (Industry)
              </label>
              <select
                aria-label="Filter by Sector"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition focus:border-sky-500 focus:outline-none"
                value={selectedSectorFilter}
                onChange={e => {
                  setSelectedSectorFilter(e.target.value);
                  setSelectedSegmentFilter('');
                  setSelectedSpecFilter('');
                }}
              >
                <option value="">All Sectors ({liveCategories.length || 27})</option>
                {liveCategories.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Segment Dropdown */}
            {(() => {
              const curSec = liveCategories.find(s => s.id === selectedSectorFilter);
              const curSegs = curSec?.segments || [];
              return (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Filter by Segment (Business Group)
                  </label>
                  <select
                    disabled={!selectedSectorFilter}
                    aria-label="Filter by Segment"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition focus:border-sky-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    value={selectedSegmentFilter}
                    onChange={e => {
                      setSelectedSegmentFilter(e.target.value);
                      setSelectedSpecFilter('');
                    }}
                  >
                    <option value="">{selectedSectorFilter ? `All Segments (${curSegs.length})` : "Select Sector first"}</option>
                    {curSegs.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              );
            })()}

            {/* 3. Specialisation Dropdown */}
            {(() => {
              const curSec = liveCategories.find(s => s.id === selectedSectorFilter);
              const curSeg = curSec?.segments?.find(g => g.id === selectedSegmentFilter);
              const curSpecs = curSeg?.specialisations || [];
              return (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Filter by Specialisation (Slot)
                  </label>
                  <select
                    disabled={!selectedSegmentFilter}
                    aria-label="Filter by Specialisation"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition focus:border-sky-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    value={selectedSpecFilter}
                    onChange={e => {
                      setSelectedSpecFilter(e.target.value);
                    }}
                  >
                    <option value="">{selectedSegmentFilter ? `All Specialisations (${curSpecs.length})` : "Select Segment first"}</option>
                    {curSpecs.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                  </select>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <p className="animate-pulse">Loading governed business categories from database…</p>
        </div>
      ) : isLiveConnected && liveCategories.length > 0 ? (
        /* LIVE API VIEW FROM DATABASE */
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredLiveCategories.map((sector) => {
            const totalSpecialisations = sector.segments.reduce((acc, seg) => acc + (seg.specialisations?.length || 0), 0);
            return (
              <Card key={sector.id} className="flex h-full flex-col p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-800">
                    <Layers3 className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-[var(--navy-950)]">{sector.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Governed Business Sector
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{sector.segments.length} segments</Badge>
                  <Badge>{totalSpecialisations} specialisations</Badge>
                </div>

                {sector.segments.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Segments & Specialisations</div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {sector.segments.map((seg) => (
                        <div key={seg.id} className="rounded-lg bg-slate-50 p-2.5 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <FolderTree className="size-3.5 text-sky-600" />
                            <span>{seg.name}</span>
                          </div>
                          {seg.specialisations && seg.specialisations.length > 0 && (
                            <div className="mt-2 space-y-1.5 pl-2">
                              {seg.specialisations.map((sp) => {
                                const liveSlot = liveMemberSlotMap[sp.id.toLowerCase()];
                                const assignedName = liveSlot ? liveSlot.memberName : n.members.find(m => {
                                  const biz = n.businesses.find(b => b.ownerMemberId === m.id || affiliatedBusinessIdsForMember(n, m.id).includes(b.id));
                                  return biz && ((biz as any).specialisationId === sp.id || (biz as any).categoryIds?.includes(sp.id));
                                })?.name;
                                return (
                                  <div
                                    key={sp.id}
                                    className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 border border-slate-200/80 hover:border-sky-300 transition"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <Tag className="size-3 text-sky-600 shrink-0" />
                                      <span className="font-semibold text-slate-800 text-[11px]">{sp.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {assignedName ? (
                                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                          <span className="size-1.5 rounded-full bg-emerald-500" />
                                          {assignedName}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200">
                                          Vacant Slot
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => go(`/app/directory?scope=network&sectorId=${encodeURIComponent(sector.id)}&segmentId=${encodeURIComponent(seg.id)}&specialisationId=${encodeURIComponent(sp.id)}`, { label: sp.name })}
                                        className="text-[10px] font-bold text-sky-600 hover:text-sky-800 hover:underline"
                                      >
                                        View in Directory →
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Button
                    variant="secondary"
                    onClick={() => go(`/app/directory?scope=network&sectorId=${encodeURIComponent(sector.id)}&q=${encodeURIComponent(sector.name)}`, { label: sector.name })}
                  >
                    Browse network <ArrowRight className="size-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : reduxRows.length ? (
        /* REDUX FALLBACK */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {reduxRows.map(({ c, businesses, members, opportunities }) => (
            <Card key={c.id} className="flex h-full flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-800">
                  <Layers3 className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-[var(--navy-950)]">{c.name}</h2>
                  <p className="mt-1 text-base leading-7 text-slate-600">{c.description}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{businesses.length} businesses</Badge>
                <Badge>{members.length} members</Badge>
                <Badge>{opportunities.length} open opportunities</Badge>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Button variant="secondary" onClick={() => go(`/app/directory?category=${encodeURIComponent(c.id)}`, { label: 'Business Categories' })}>
                  Browse network <ArrowRight className="size-4" />
                </Button>
                <Button variant="ghost" onClick={() => go(`/app/opportunities?category=${encodeURIComponent(c.id)}`, { label: 'Business Categories' })}>
                  View opportunities
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No business categories are available"
          body="The governed taxonomy has no categories visible to this Member workspace. Contact platform administration if this is unexpected."
        />
      )}

      <div className="mt-5">
        <Tip>Category counts respect business visibility and opportunity-scope rules. Hidden businesses and inaccessible opportunities are not included.</Tip>
      </div>
    </div>
  );
}
