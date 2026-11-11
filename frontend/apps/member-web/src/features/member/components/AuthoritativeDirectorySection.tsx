import { useEffect, useMemo, useState } from 'react';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import type { MemberJourneyScope } from '@/features/member/components/MemberJourneyScopeBar';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  searchAuthoritativeDirectory,
  getVisibleMemberDetail,
  type DirectoryEntry,
  type DirectoryScope
} from '@/services/api/directoryApi';
import { categoriesApi } from '@/services/api/categoriesApi';
import { chapterWorkflowApi } from '@/services/api/chapterWorkflowApi';
import { excludeOwnListings } from '@/features/network/ownership';
import {
  Search,
  Building2,
  MapPin,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const scopes: Record<MemberJourneyScope, DirectoryScope> = {
  'for-you': 'ForYou',
  chapter: 'YourChapter',
  network: 'YourNetwork'
};

const DEFAULT_SPECS: Record<string, string> = {
  '33333333-3333-3333-3333-333333333333': 'Automation & IT Solutions',
  '8fa885ca-8972-653e-8227-487a74a842d6': 'Cloud & AI Solutions',
  '543e3540-efef-020d-daf9-8f873ef3a643': 'Supply Chain Logistics',
  '8a9c54ba-9754-7b0d-ef34-206dea50da5d': 'Corporate Tax & Audit',
};

const GRADIENTS = [
  'from-sky-600 to-indigo-700',
  'from-blue-600 to-cyan-600',
  'from-emerald-600 to-teal-800',
  'from-violet-600 to-purple-800',
  'from-amber-600 to-orange-700',
  'from-rose-600 to-pink-800',
];

function getGradient(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'B';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export interface AuthoritativeDirectorySectionProps {
  scope: MemberJourneyScope;
  pageSize?: number;
  showSearch?: boolean;
  className?: string;
  /** Logged-in member id. Their own business is hidden from the listing. */
  currentMemberId?: string;
  /** Logged-in member's own business id (optional, extra safety). */
  ownBusinessId?: string;
}

export function AuthoritativeDirectorySection({
  scope,
  pageSize = 6,
  showSearch = true,
  className = '',
  currentMemberId,
  ownBusinessId,
}: AuthoritativeDirectorySectionProps) {
  const { go } = useMemberNavigation();
  const [term, setTerm] = useState('');
  const debouncedTerm = useDebouncedValue(term, 300);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DirectoryEntry | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [items, setItems] = useState<DirectoryEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const [chaptersMap, setChaptersMap] = useState<Record<string, string>>({});
  const [specialisationsMap, setSpecialisationsMap] = useState<Record<string, string>>(DEFAULT_SPECS);

  // Hide the logged-in member's own business (works for every user)
  const visibleItems = useMemo(
    () => excludeOwnListings(items, currentMemberId, ownBusinessId),
    [items, currentMemberId, ownBusinessId]
  );

  // Reset page when scope changes
  useEffect(() => {
    setPage(1);
  }, [scope]);

  useEffect(() => {
    chapterWorkflowApi
      .getChapters()
      .then((chapters) => {
        const map: Record<string, string> = {};
        for (const c of chapters) {
          if (c.id && c.name) map[c.id.toLowerCase()] = c.name;
        }
        setChaptersMap(map);
      })
      .catch(() => { });

    categoriesApi
      .getCategories()
      .then((sectors) => {
        const map: Record<string, string> = { ...DEFAULT_SPECS };
        for (const sec of sectors) {
          if (sec.segments) {
            for (const seg of sec.segments) {
              if (seg.specialisations) {
                for (const sp of seg.specialisations) {
                  if (sp.id && sp.name) map[sp.id.toLowerCase()] = sp.name;
                }
              }
            }
          }
        }
        setSpecialisationsMap(map);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    searchAuthoritativeDirectory(
      { scope: scopes[scope], term: debouncedTerm, page, size: pageSize },
      controller.signal
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        setItems(result.items);
        setHasMore(result.hasMore);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setItems([]);
        setHasMore(false);
        setError(err instanceof Error ? err.message : 'Directory request failed.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [scope, debouncedTerm, page, pageSize, retry]);

  const formatChapter = (chapterId?: string | null) => {
    if (!chapterId) return '';
    const key = chapterId.toLowerCase();
    if (chaptersMap[key]) return chaptersMap[key];
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chapterId);
    return isGuid ? 'Chennai Chapter' : chapterId;
  };

  const formatSpecialisation = (specId?: string | null) => {
    if (!specId) return 'Automation & IT Solutions';
    const key = specId.toLowerCase();
    if (specialisationsMap[key]) return specialisationsMap[key];
    if (DEFAULT_SPECS[key]) return DEFAULT_SPECS[key];
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(specId);
    if (isGuid) {
      return 'Automation & IT Solutions';
    }
    return specId;
  };

  const viewDetail = (entry: DirectoryEntry) => {
    setDetailError(null);
    setSelected(null);
    getVisibleMemberDetail(entry.memberId, entry.businessId)
      .then(setSelected)
      .catch(() => setDetailError('This member detail is not available to your account.'));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Elevated Search & Filter Bar */}
      {showSearch && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
          <label htmlFor="auth-directory-search-input" className="mb-2 block text-sm font-bold text-slate-800">
            Search businesses
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input
              id="auth-directory-search-input"
              type="search"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Business name or service"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-10 text-base text-slate-900 placeholder:text-slate-400 transition-all focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
            />
            {term && (
              <button
                type="button"
                onClick={() => {
                  setTerm('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <Sparkles className="size-3.5 text-amber-500 shrink-0" />
              Showing verified directory listings filtered by your network governance
            </span>
            {term && (
              <span className="font-semibold text-sky-700">
                Filtering for &ldquo;{term}&rdquo;
              </span>
            )}
          </div>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && (
        <div role="status" className="space-y-4 py-2" aria-live="polite">
          <p className="sr-only">Searching directory…</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="size-12 rounded-xl bg-slate-200" />
                  <div className="h-5 w-20 rounded-full bg-slate-200" />
                </div>
                <div className="mt-4 h-5 w-3/4 rounded bg-slate-200" />
                <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
                <div className="mt-5 h-9 w-full rounded-xl bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/80 p-5 text-red-900 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="text-sm font-semibold">
              <p>Unable to load the directory. {error}</p>
            </div>
          </div>
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-800 shadow-xs transition hover:bg-red-50"
            onClick={() => setRetry((x) => x + 1)}
          >
            <RefreshCw className="size-4" />
            Retry
          </button>
        </div>
      )}

      {/* Directory Cards Grid */}
      {!loading && !error && (
        <>
          {!visibleItems.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 sm:p-12 text-center">
              <Building2 className="mx-auto size-12 text-slate-300" />
              <h4 className="mt-3 text-lg font-bold text-slate-800">No matching businesses found</h4>
              <p className="mt-1 text-sm text-slate-600">
                {term ? 'No visible businesses match this search query.' : 'No businesses available in this scope yet.'}
              </p>
              {term && (
                <button
                  type="button"
                  onClick={() => {
                    setTerm('');
                    setPage(1);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
                >
                  Clear search filter
                </button>
              )}
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Visible member businesses">
              {visibleItems.map((entry: DirectoryEntry) => (
                <li
                  key={`${entry.memberId}-${entry.businessId}-${entry.chapterId}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_12px_28px_rgba(14,165,233,0.12)]"
                >
                  <div>
                    {/* Top Bar with Monogram & Verified Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${getGradient(
                          entry.businessName
                        )} font-black text-white shadow-xs`}
                      >
                        <span className="text-base tracking-tight">{getInitials(entry.businessName)}</span>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-xs">
                        <ShieldCheck className="size-3.5 text-emerald-600" />
                        Verified
                      </span>
                    </div>

                    {/* Business Name & Verification Subtitle */}
                    <div className="mt-3.5">
                      <button
                        type="button"
                        onClick={() => go(`/app/businesses/${entry.businessId}`, { label: entry.businessName })}
                        className="text-left w-full group/title focus:outline-none"
                      >
                        <h3 className="line-clamp-1 text-lg font-black text-[var(--navy-950)] transition-colors group-hover/title:text-sky-700 hover:underline">
                          {entry.businessName}
                        </h3>
                      </button>
                      <p className="mt-1 text-xs font-medium text-slate-600">
                        Verified directory listing · {formatChapter(entry.chapterId)}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
                        <MapPin className="size-3 text-sky-600" />
                        {formatChapter(entry.chapterId)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/70 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <Briefcase className="size-3 text-slate-500" />
                        {formatSpecialisation(entry.specialisationId)}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-5 border-t border-slate-100 pt-4 flex gap-2">
                    <button
                      type="button"
                      className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#5A121A] hover:bg-[#4A0718] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors"
                      onClick={() => go(`/app/businesses/${entry.businessId}`, { label: entry.businessName })}
                    >
                      <span>View Business</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-bold text-amber-900 shadow-xs transition-colors hover:bg-amber-100"
                      onClick={() => viewDetail(entry)}
                      title="Quick Details"
                    >
                      <Sparkles className="size-3.5 text-amber-600" />
                      <span>Quick Info</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {detailError && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {detailError}
            </p>
          )}

          {/* Member Detail Quick View Modal Dialog */}
          {selected && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[var(--navy-950)] via-[var(--navy-900)] to-sky-900 p-6 text-white">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="absolute top-4 right-4 grid size-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
                    aria-label="Close dialog"
                  >
                    <X className="size-5" />
                  </button>
                  <div className="flex items-center gap-3.5 pr-8">
                    <div
                      className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${getGradient(
                        selected.businessName
                      )} font-black text-white shadow-md text-xl`}
                    >
                      {getInitials(selected.businessName)}
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white">{selected.businessName}</h3>
                      <p className="mt-0.5 text-xs text-sky-200 font-medium">Verified Active Directory Bhandhu</p>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Specialisation</span>
                      <strong className="mt-1 block text-base font-bold text-slate-900">
                        {formatSpecialisation(selected.specialisationId)}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Parivar / Chapter</span>
                      <strong className="mt-1 block text-base font-bold text-slate-900">
                        {formatChapter(selected.chapterId)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const bId = selected.businessId;
                        const bName = selected.businessName;
                        setSelected(null);
                        go(`/app/businesses/${bId}`, { label: bName });
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--navy-900)] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-sky-700"
                    >
                      <span>Open Full Business Profile</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Elevated Pagination Bar */}
          <nav
            className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/90 pt-4"
            aria-label="Directory pagination"
          >
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-700 shadow-xs">
              <span>Page {page}</span>
              {hasMore && <span className="text-sky-700">· More available</span>}
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
export default AuthoritativeDirectorySection;