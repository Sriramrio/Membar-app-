import { useEffect, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  Home,
  MoreHorizontal,
  Search,
  X,
  Plus,
  Handshake,
  CalendarPlus2,
  CalendarDays,
  MessageCircle,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { navigation } from '@/config/navigation';
import { useAppNavigation } from '@/navigation/useAppNavigation';

const primary = [
  ['/app/home', 'Home', Home],
  ['/app/directory', 'Directory', Search],
  ['/app/calendar', 'Activities', BriefcaseBusiness],
] as const;

const primaryPaths = new Set(primary.map((x) => x[0]));

export function MobileBottomNav() {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { go } = useAppNavigation();
  const loc = useLocation();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);

  const secondary = (navigation.Member ?? [])
    .flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })))
    .filter((i) => !primaryPaths.has(i.path as never));

  useEffect(() => {
    setOpen(false);
    setCreateOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    if (!createOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCreateOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [createOpen]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'
        ),
      ].filter((x) => x.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = oldOverflow === 'hidden' ? '' : oldOverflow;
      const target = previous && document.body.contains(previous) ? previous : moreButtonRef.current;
      target?.focus?.();
    };
  }, [open]);

  const quickCreateItems = [
    { label: 'Schedule 1:1', route: '/app/one-to-one', Icon: CalendarPlus2 },
    { label: 'Give Reference', route: '/app/references/new', Icon: Handshake },
    { label: 'Post Opportunity', route: '/app/opportunities/new', Icon: BriefcaseBusiness },
    { label: 'Find Members', route: '/app/directory', Icon: Search },
    { label: 'Chapter Events', route: '/app/events', Icon: CalendarDays },
    { label: 'Converse', route: '/app/messages', Icon: MessageCircle },
  ];

  return (
    <>
      {/* ✺ Sleek, Compact & Responsive Mobile Bottom Navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t border-slate-200/90 bg-white/95 px-1 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Member quick navigation"
      >
        {/* 1. Home */}
        <NavLink
          to="/app/home"
          onClick={(e) => {
            e.preventDefault();
            go('/app/home', { label: 'Featured & Discover' });
          }}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
              isActive || loc.pathname === '/app/home' || loc.pathname === '/app'
                ? 'font-black text-[var(--navy-900)]'
                : 'font-semibold text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Home className="size-4.5" aria-hidden="true" />
          <span className="mt-0.5 text-[10px] uppercase tracking-wider">Home</span>
        </NavLink>

        {/* 2. Directory */}
        <NavLink
          to="/app/directory"
          onClick={(e) => {
            e.preventDefault();
            go('/app/directory', { label: 'Directory' });
          }}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
              isActive
                ? 'font-black text-[var(--navy-900)]'
                : 'font-semibold text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Search className="size-4.5" aria-hidden="true" />
          <span className="mt-0.5 text-[10px] uppercase tracking-wider">Directory</span>
        </NavLink>

        {/* 3. Center Compact Action Button (FAB) */}
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            aria-label="Quick create"
            onClick={() => setCreateOpen(true)}
            className="grid size-11 -translate-y-2 place-items-center rounded-full bg-gradient-to-tr from-[#7C0928] via-[#8C1D36] to-[#BC5100] text-white shadow-lg ring-2 ring-white transition hover:scale-105 active:scale-95"
          >
            <Plus className="size-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Activities / Calendar */}
        <NavLink
          to="/app/calendar"
          onClick={(e) => {
            e.preventDefault();
            go('/app/calendar', { label: 'Calendar' });
          }}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
              isActive
                ? 'font-black text-[var(--navy-900)]'
                : 'font-semibold text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <BriefcaseBusiness className="size-4.5" aria-hidden="true" />
          <span className="mt-0.5 text-[10px] uppercase tracking-wider">Activities</span>
        </NavLink>

        {/* 5. More Sheet Opener */}
        <button
          ref={moreButtonRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="member-more-dialog"
          onClick={() => setOpen(true)}
          className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
            secondary.some(
              (x) => loc.pathname === x.path || loc.pathname.startsWith(`${x.path}/`)
            )
              ? 'font-black text-[var(--navy-900)]'
              : 'font-semibold text-slate-500 hover:text-slate-800'
          }`}
        >
          <MoreHorizontal className="size-4.5" aria-hidden="true" />
          <span className="mt-0.5 text-[10px] uppercase tracking-wider">More</span>
        </button>
      </nav>

      {/* Quick Create Bottom Sheet */}
      {createOpen && (
        <div
          className="fixed inset-0 z-[96] bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
          onMouseDown={() => setCreateOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Quick create"
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-slate-200 bg-white p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-[var(--navy-950)]">Quick Action</h2>
                <p className="text-xs text-slate-500">Fast action shortcuts for your active session.</p>
              </div>
              <button
                type="button"
                aria-label="Close quick create"
                className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                onClick={() => setCreateOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {quickCreateItems.map(({ label, route, Icon }) => (
                <button
                  key={route}
                  type="button"
                  className="flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 text-left font-bold text-[var(--navy-950)] transition hover:border-amber-400 hover:bg-white hover:shadow-sm"
                  onClick={() => {
                    setCreateOpen(false);
                    go(route, { label });
                  }}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--navy-950)] text-amber-300">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* More Navigation Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-[95] bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
          role="presentation"
          onMouseDown={() => setOpen(false)}
        >
          <section
            id="member-more-dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-more-title"
            className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-auto overscroll-contain rounded-t-3xl border-t border-slate-200 bg-white p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 -mx-1 mb-4 flex items-center justify-between border-b border-slate-100 bg-white/95 px-1 py-2 backdrop-blur-sm">
              <div>
                <h2 id="member-more-title" className="text-xl font-black text-[var(--navy-950)]">
                  More Navigation
                </h2>
                <p className="text-xs text-slate-500">Explore community, business, and account journeys.</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close more navigation"
                onClick={() => setOpen(false)}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-4">
              {(navigation.Member ?? []).map((group) => {
                const items = group.items.filter((i) => !primaryPaths.has(i.path as never));
                if (!items.length) return null;
                return (
                  <section key={group.label}>
                    <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-amber-800">
                      {group.label}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((item) => (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            go(item.path, { label: item.label });
                          }}
                          className={`min-h-10 rounded-xl border p-2.5 text-left text-xs font-bold transition ${
                            loc.pathname === item.path
                              ? 'border-amber-400 bg-amber-50/80 text-[var(--navy-950)] shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
