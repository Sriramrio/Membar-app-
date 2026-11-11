import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';
import { useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageHead, SearchField, StatusPill } from '@/features/network/components/NetworkUI';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { activeMemberId, selectActiveMember } from '@/features/network/selectors';
import type { GalleryItem } from '@/features/network/types';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { QueryError, QueryLoading } from '@/components/data/QueryState';

// Curated SVG visual themes for gallery items when binary photos are not uploaded
const galleryVisuals: Record<string, { gradient: string; accent: string }> = {
  'GAL-1': {
    gradient: 'from-blue-600 via-sky-500 to-indigo-700',
    accent: 'Networking & Structured Business Exchange',
  },
  'GAL-2': {
    gradient: 'from-amber-500 via-orange-600 to-red-600',
    accent: 'Buyer–Seller Strategic Interactions',
  },
};

export default function PhotoGalleryPage() {
  const { go } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const member = useAppSelector(selectActiveMember);
  const n = useNetworkSlice(['galleryItems','events'] as const);
  const [q, setQ] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const localPublished = n.galleryItems.filter((x) => x.published);

  const queryRequest = useMemo(
    () => ({
      queryId: 'member.gallery.list',
      domain: 'member' as const,
      parameters: { search: q || undefined },
      pagination: { pageSize: 50 },
    }),
    [q]
  );

  const query = useDomainCursorPage<GalleryItem>(queryRequest, localPublished, [memberId, member?.chapter, q]);
  useRealtimeRefresh(['gallery.*', 'org.gallery.*'], query.reload);

  const serverCards = query.page?.items?.map((item: any) => ({
    id: item.id ?? item.galleryId,
    title: item.title,
    caption: item.caption ?? item.description ?? '',
    eventId: item.eventId || undefined,
    mediaLabel: item.mediaLabel ?? item.category ?? 'Event Photo',
    imageUrl: item.imageUrl,
    published: true,
    createdAt: item.createdAt ?? item.takenAt ?? new Date().toISOString(),
  })) as GalleryItem[] | undefined;

  const cards = serverCards ?? localPublished;

  const isGuid = (val?: string) => !val || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  // Human-readable filter options (NO UUIDs!)
  const filterOptions = useMemo(() => {
    const list: { value: string; label: string }[] = [];

    // Categories (e.g. "Chapter Meeting", "Industrial Visit", "Networking Gala")
    const categories = new Set<string>();
    cards.forEach((c) => {
      if (c.mediaLabel && !isGuid(c.mediaLabel)) {
        categories.add(c.mediaLabel);
      }
    });
    categories.forEach((cat) => {
      list.push({ value: `cat:${cat}`, label: cat });
    });

    // Named Events only
    const eventsSeen = new Set<string>();
    cards.forEach((c) => {
      if (c.eventId) {
        const ev = n.events.find((e) => e.id === c.eventId);
        if (ev?.name && !isGuid(ev.name) && !eventsSeen.has(ev.id)) {
          eventsSeen.add(ev.id);
          list.push({ value: `event:${ev.id}`, label: ev.name });
        }
      }
    });

    return list;
  }, [cards, n.events]);

  const displayCards = useMemo(() => {
    return cards.filter((item) => {
      const matchesSearch =
        !q ||
        `${item.title} ${item.caption} ${item.mediaLabel}`.toLowerCase().includes(q.toLowerCase());

      let matchesFilter = true;
      if (selectedFilter !== 'all') {
        if (selectedFilter.startsWith('cat:')) {
          matchesFilter = item.mediaLabel === selectedFilter.replace('cat:', '');
        } else if (selectedFilter.startsWith('event:')) {
          matchesFilter = item.eventId === selectedFilter.replace('event:', '');
        }
      }

      return matchesSearch && matchesFilter;
    });
  }, [cards, q, selectedFilter]);

  const activeIndex = activeItem ? displayCards.findIndex((c) => c.id === activeItem.id) : -1;

  useEffect(() => {
    if (!activeItem) {
      setZoomLevel(1);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveItem(null);
      if (e.key === 'ArrowRight' && activeIndex < displayCards.length - 1) {
        setActiveItem(displayCards[activeIndex + 1]);
        setZoomLevel(1);
      }
      if (e.key === 'ArrowLeft' && activeIndex > 0) {
        setActiveItem(displayCards[activeIndex - 1]);
        setZoomLevel(1);
      }
      if (e.key === '+' || e.key === '=') setZoomLevel((z) => Math.min(2.5, z + 0.25));
      if (e.key === '-') setZoomLevel((z) => Math.max(0.75, z - 0.25));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeItem, activeIndex, displayCards]);

  const openZoom = (item: GalleryItem) => {
    setActiveItem(item);
    setZoomLevel(1);
  };

  return (
    <div>
      <PageHead
        title="Gallery"
        description="Official chapter meetings, networking events, celebrations and delegations."
      />

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <SearchField value={q} onChange={setQ} placeholder="Search gallery highlights by title, caption, or tag…" />
        </div>
        <div className="w-full sm:w-64 shrink-0">
          <select
            aria-label="Filter by Category"
            className="w-full min-h-12 rounded-xl border border-slate-300 bg-white px-3.5 text-base font-normal text-slate-800 outline-none focus:border-sky-600 focus:ring-3 focus:ring-sky-100 transition shadow-2xs"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {query.loading && !query.page ? (
        <div className="mt-5">
          <QueryLoading label="Loading gallery items…" />
        </div>
      ) : query.error ? (
        <div className="mt-5">
          <QueryError error={query.error} onRetry={query.reload} />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {displayCards.map((item) => {
          const event = item.eventId ? n.events.find((e) => e.id === item.eventId) : undefined;
          const visual = galleryVisuals[item.id] ?? {
            gradient: 'from-slate-700 via-slate-800 to-navy-950',
            accent: 'Network Activity',
          };

          return (
            <article
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-sky-300"
            >
              {/* Image Banner with Zoom Button Overlay */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900 cursor-pointer" onClick={() => openZoom(item)}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${visual.gradient} opacity-90 transition-transform duration-300 group-hover:scale-105 flex items-center justify-center p-6 text-white text-center`}>
                    <div>
                      <span className="inline-block rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-sm font-bold uppercase tracking-wider mb-2">
                        {visual.accent}
                      </span>
                      <h3 className="text-lg font-black">{item.title}</h3>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openZoom(item);
                  }}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-black/60 backdrop-blur-md px-3 py-1.5 text-sm font-bold text-white transition hover:bg-black/80"
                  aria-label={`Zoom image: ${item.title}`}
                >
                  <ZoomIn className="size-4" />
                  <span>Zoom view</span>
                </button>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone="info">{item.mediaLabel}</StatusPill>
                  {event && <StatusPill>{event.type}</StatusPill>}
                </div>
                <h2 className="mt-3 text-lg font-black text-slate-900">{item.title}</h2>
                <p className="mt-2 text-base leading-7 text-slate-600">{item.caption}</p>
                <div className="mt-3 text-sm text-slate-500">
                  Published {new Date(item.createdAt).toLocaleDateString('en-IN')}
                </div>
                {event && (
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => go(`/app/events/${event.id}`, { label: 'Gallery' })}
                  >
                    View related event
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      )}

      {!displayCards.length && !query.loading && (
        <div className="mt-5">
          <EmptyState
            title="No published gallery items found"
            body="Try another search or event. Gallery items only appear after publication."
          />
        </div>
      )}

      {/* Full-Screen Zoom Lightbox Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md text-white animate-in fade-in duration-200"
          onClick={() => setActiveItem(null)}
        >
          {/* Top Bar Controls */}
          <div
            className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <strong className="block text-base font-bold text-white">{activeItem.title}</strong>
              <small className="text-sm text-slate-400">
                {activeItem.mediaLabel} · {Math.round(zoomLevel * 100)}% zoom
              </small>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                className="grid size-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                title="Zoom In (+)"
                aria-label="Zoom in"
              >
                <ZoomIn className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                className="grid size-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                title="Zoom Out (-)"
                aria-label="Zoom out"
              >
                <ZoomOut className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="grid size-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                title="Reset Zoom"
                aria-label="Reset zoom"
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="ml-2 grid size-10 place-items-center rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition"
                title="Close (Esc)"
                aria-label="Close zoom preview"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Main Visual Viewport */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-auto p-4 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Prev Arrow */}
            {activeIndex > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveItem(cards[activeIndex - 1]);
                  setZoomLevel(1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 grid size-12 place-items-center rounded-full bg-black/60 hover:bg-black/90 text-white shadow-xl transition"
                aria-label="Previous image"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            {/* Display Box with Zoom Scaling */}
            <div
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-w-4xl max-h-[70vh] aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-2xl transition-transform duration-150 flex items-center justify-center bg-slate-900 border border-white/20 text-center relative"
            >
              {activeItem.imageUrl ? (
                <div className="relative w-full h-full flex flex-col justify-between">
                  <img
                    src={activeItem.imageUrl}
                    alt={activeItem.title}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-left">
                    <h3 className="text-lg font-bold text-white">{activeItem.title}</h3>
                    {activeItem.caption && <p className="text-sm text-slate-200 mt-1">{activeItem.caption}</p>}
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/30 text-sky-200 border border-sky-400/30">
                      {activeItem.mediaLabel}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="max-w-xl p-8">
                  <ImageIcon className="mx-auto size-16 text-sky-400 mb-4 opacity-80" />
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{activeItem.title}</h2>
                  <p className="mt-3 text-base text-slate-300 leading-relaxed">{activeItem.caption}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full bg-sky-500/20 px-3 py-1 text-sm font-bold text-sky-300 border border-sky-400/30">
                      {activeItem.mediaLabel}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-slate-300">
                      {new Date(activeItem.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Next Arrow */}
            {activeIndex < displayCards.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  setActiveItem(displayCards[activeIndex + 1]);
                  setZoomLevel(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 grid size-12 place-items-center rounded-full bg-black/60 hover:bg-black/90 text-white shadow-xl transition"
                aria-label="Next image"
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </div>

          {/* Bottom Caption Bar */}
          <div className="border-t border-white/10 bg-black/50 px-6 py-3 text-center text-sm text-slate-300">
            {activeItem.caption} · Use <kbd className="rounded bg-white/20 px-1 py-0.5 text-sm">←</kbd> and <kbd className="rounded bg-white/20 px-1 py-0.5 text-sm">→</kbd> to browse, <kbd className="rounded bg-white/20 px-1 py-0.5 text-sm">+</kbd> / <kbd className="rounded bg-white/20 px-1 py-0.5 text-sm">-</kbd> to zoom, <kbd className="rounded bg-white/20 px-1 py-0.5 text-sm">Esc</kbd> to close
          </div>
        </div>
      )}
    </div>
  );
}
