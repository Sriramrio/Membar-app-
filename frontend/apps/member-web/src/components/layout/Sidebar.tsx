import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSystemBranding } from '@/services/brandingService';
import {
  ChevronRight,
  LogOut,
  X,
  Sparkles,
  LayoutDashboard,
  Search,
  Grid,
  Bookmark,
  Users,
  MessageSquare,
  UserCheck,
  CalendarCheck2,
  Handshake,
  HeartHandshake,
  Briefcase,
  Layers,
  CheckSquare,
  TrendingUp,
  CalendarDays,
  Calendar,
  Bell,
  Image,
  Newspaper,
  Building2,
  Folder,
  User,
  Store,
  Award,
  CreditCard,
  Activity,
  Shield,
  Lock,
  Smartphone,
  LifeBuoy,
  type LucideIcon,
} from 'lucide-react';
import type { Workspace } from '@/types/screen';
import { cn } from '@/utils/cn';
import { navigation } from '@/config/navigation';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { signOut } from '@/features/auth/authSlice';
import { evaluateControlPermission, platformPathPermission } from '@/features/control-plane/policyEngine';
import { requiredPermissionForWorkspacePath } from '@/features/control-plane/workspaceRoutePermissions';
import { selectRoleAssignments } from '@/features/platform-runtime/authorisationRuntime';
import { selectIdentityRecords } from '@/features/platform-runtime/identitySecurityRuntime';
import { useAppNavigation } from '@/navigation/useAppNavigation';

const navItemIcons: Record<string, LucideIcon> = {
  '/app/home': Sparkles,
  '/app/dashboard': LayoutDashboard,
  '/app/directory': Search,
  '/app/categories': Grid,
  '/app/saved': Bookmark,
  '/app/connections': Users,
  '/app/messages': MessageSquare,
  '/app/suggestions': UserCheck,
  '/app/one-to-one': CalendarCheck2,
  '/app/references': Handshake,
  '/app/thank-you-notes': HeartHandshake,
  '/app/visitors/invite': Users,
  '/app/opportunities': Briefcase,
  '/app/opportunities/my': Layers,
  '/app/responses/my': CheckSquare,
  '/app/transactions': TrendingUp,
  '/app/events': CalendarDays,
  '/app/calendar': Calendar,
  '/app/announcements': Bell,
  '/app/gallery': Image,
  '/app/news': Newspaper,
  '/app/partners': Building2,
  '/app/resources': Folder,
  '/app/profile': User,
  '/app/businesses': Store,
  '/app/membership': Award,
  '/app/attendance': CalendarCheck2,
  '/app/payments': CreditCard,
  '/app/activity': Activity,
  '/app/settings/privacy': Shield,
  '/app/settings/notifications': Bell,
  '/app/settings/security': Lock,
  '/app/settings/install': Smartphone,
  '/app/support': LifeBuoy,
  '/platform-admin/dashboard': LayoutDashboard,
  '/platform-admin/identity': User,
  '/platform-admin/hierarchy': Building2,
  '/platform-admin/roles': Award,
  '/platform-admin/rbac': Shield,
  '/platform-admin/raci': CheckSquare,
  '/platform-admin/workflows': Layers,
  '/platform-admin/lookups': Folder,
  '/platform-admin/forms': CheckSquare,
  '/platform-admin/imports': Folder,
  '/platform-admin/integrations': Activity,
  '/platform-admin/moderation': Shield,
  '/platform-admin/notifications': Bell,
  '/platform-admin/promotions': Award,
  '/platform-admin/audit': Lock,
  '/platform-admin/data-quality': CheckSquare,
  '/platform-admin/settings': Lock,
  '/platform-admin/chapters': Building2,
  '/platform-admin/chapter-workflow': Layers,
};

const routePreloadMap: Record<string, () => Promise<unknown>> = {
  '/app/dashboard': () => import('@/features/member/pages/MemberDashboardPage'),
  '/app/home': () => import('@/features/member/pages/MemberHomePage'),
  // '/workspace': () => import('@/features/workspaces/pages/WorkspaceHubPage'),
  '/app/directory': () => import('@/features/member/pages/SmartMemberBusinessDirectoryPage'),
  '/app/categories': () => import('@/features/member/pages/CategoryIndexPage'),
  '/app/saved': () => import('@/features/member/pages/SavedItemsPage'),
  '/app/connections': () => import('@/features/member/pages/ConnectionsPage'),
  '/app/messages': () => import('@/features/member/pages/ConverseInboxPage'),
  '/app/suggestions': () => import('@/features/member/pages/ConnectionSuggestionsPage'),
  '/app/one-to-one': () => import('@/features/member/pages/OneToOneMeetingsPage'),
  '/app/references': () => import('@/features/member/pages/BusinessReferencesPage'),
  '/app/thank-you-notes': () => import('@/features/member/pages/ThankYouNotesPage'),
  '/app/visitors/invite': () => import('@/features/member/pages/MemberVisitorInvitationsPage'),
  '/app/opportunities': () => import('@/features/member/pages/OpportunityMarketplacePage'),
  '/app/opportunities/my': () => import('@/features/member/pages/MyOpportunitiesPage'),
  '/app/responses/my': () => import('@/features/member/pages/MyResponsesPage'),
  '/app/transactions': () => import('@/features/member/pages/TransactionsPage'),
  '/app/events': () => import('@/features/member/pages/EventsPage'),
  '/app/calendar': () => import('@/features/member/pages/CalendarPage'),
  '/app/announcements': () => import('@/features/member/pages/AnnouncementsPage'),
  '/app/gallery': () => import('@/features/member/pages/PhotoGalleryPage'),
  '/app/news': () => import('@/features/member/pages/NewsPage'),
  '/app/partners': () => import('@/features/member/pages/PartnersPage'),
  '/app/resources': () => import('@/features/member/pages/ResourcesPage'),
  '/app/profile': () => import('@/features/member/pages/MyProfilePage'),
  '/app/businesses': () => import('@/features/member/pages/MyBusinessesPage'),
  '/app/membership': () => import('@/features/member/pages/MembershipPage'),
  '/app/attendance': () => import('@/features/member/pages/MyAttendancePage'),
  '/app/payments': () => import('@/features/member/pages/MyPaymentsPage'),
  '/app/activity': () => import('@/features/member/pages/MyActivityPage'),
  '/app/settings/privacy': () => import('@/features/member/pages/PrivacySettingsPage'),
  '/app/settings/notifications': () => import('@/features/member/pages/NotificationSettingsPage'),
  '/app/settings/security': () => import('@/features/member/pages/SecuritySettingsPage'),
  '/app/settings/install': () => import('@/features/member/pages/InstallOfflinePage'),
  '/app/support': () => import('@/features/member/pages/MemberSupportPage'),
};

export function Sidebar({ workspace, open, onClose }: { workspace: Workspace; open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { go, dirty } = useAppNavigation();
  const auth = useAppSelector((s) => s.auth);
  const account = auth.account;
  const roleAssignments = useAppSelector(selectRoleAssignments);
  const identityRecords = useAppSelector(selectIdentityRecords);
  const cp = useAppSelector((s) => s.controlPlane);
  const asideRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width:1024px)').matches);

  const base = navigation[workspace] ?? navigation.Member ?? [];
  const groups = base;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(min-width:1024px)');
    const sync = () => {
      setDesktop(media.matches);
      if (media.matches && open) {
        onClose();
        if (typeof document !== 'undefined') document.body.style.overflow = '';
      }
    };
    sync();
    if (media.addEventListener) media.addEventListener('change', sync);
    else if ((media as any).addListener) (media as any).addListener(sync);
    return () => {
      if (media.removeEventListener) media.removeEventListener('change', sync);
      else if ((media as any).removeListener) (media as any).removeListener(sync);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || typeof window === 'undefined' || window.matchMedia('(min-width:1024px)').matches) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeRef.current?.focus());
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !asideRef.current) return;
      const focusables = [...asideRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(
        (x) => x.offsetParent !== null,
      );
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
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = oldOverflow === 'hidden' ? '' : oldOverflow;
      if (previous && document.body.contains(previous)) previous.focus?.();
    };
  }, [open, onClose]);

  const inactive = !desktop && !open;
  const branding = useSystemBranding();

  return (
    <aside
      ref={asideRef}
      aria-label={`${workspace} navigation`}
      aria-hidden={inactive || undefined}
      inert={inactive || undefined}
      className={cn(
        'w-[min(88vw,280px)] xl:w-[304px] overflow-y-auto overscroll-contain bg-[var(--navy-950)] px-3 pb-8 text-white shadow-2xl transition-transform duration-200 fixed inset-y-0 left-0 z-50 lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:z-40 lg:w-[280px] xl:w-[304px] lg:translate-x-0 lg:shadow-none border-r border-white/10',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="sticky top-0 z-20 -mx-3 border-b border-white/10 bg-[var(--navy-950)]/95 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={branding.sidebarLogo || "/brand/sethu-logo.jpeg"}
              alt="SETHU"
              style={{
                width: `${branding.sethuSize || 36}px`,
                height: `${branding.sethuSize || 36}px`,
                borderRadius: `${Math.max(6, Math.round((branding.sethuSize || 36) * 0.25))}px`,
                transition: 'width 0.15s ease, height 0.15s ease'
              }}
              className="object-contain bg-white/10 p-0.5 border border-white/15 shrink-0 shadow-sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white">SETHU</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 rounded-sm">
                  {workspace === 'Member' ? 'Bhandhu' : workspace}
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-400 truncate">Dharmic Business Network</div>
              <div className="text-[9px] font-extrabold tracking-wider text-amber-400/90 uppercase truncate">Parasparam Bhavayantah</div>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="grid size-9 place-items-center rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors lg:hidden shrink-0"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <nav className="pt-3">
        {groups.map((group) => (
          <section key={group.label} className="mb-5">
            <h2 className="px-3 pb-2 text-[11px] font-black uppercase tracking-[.14em] text-slate-400/90">{group.label}</h2>
            <ul className="grid gap-1">
              {group.items.map((item) => {
                const ItemIcon = navItemIcons[item.path] ?? LayoutDashboard;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onMouseEnter={() => {
                        routePreloadMap[item.path]?.();
                      }}
                      onFocus={() => {
                        routePreloadMap[item.path]?.();
                      }}
                      onClick={(e) => {
                        if (item.path === location.pathname) {
                          e.preventDefault();
                          if (!desktop) onClose();
                          return;
                        }
                        if (!desktop) {
                          onClose();
                        }
                        if (dirty.dirty) {
                          e.preventDefault();
                          go(item.path, { label: item.label });
                        }
                      }}
                      className={({ isActive }: { isActive: boolean }) =>
                        cn(
                          'group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-200 transition-all duration-150 hover:bg-white/10 hover:text-white',
                          isActive && 'bg-gradient-to-r from-white/15 to-white/5 text-white font-semibold ring-1 ring-white/20 shadow-sm',
                        )
                      }
                    >
                      <ItemIcon
                        className="size-4 shrink-0 text-slate-300 opacity-80 transition-transform group-hover:scale-110 group-hover:opacity-100 group-hover:text-amber-300"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 leading-5 truncate">{item.label}</span>
                      <ChevronRight className="size-3.5 shrink-0 opacity-25 transition-transform group-hover:translate-x-0.5 group-hover:opacity-75" aria-hidden="true" />
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>
      <div className="sticky bottom-0 -mx-3 mt-4 border-t border-white/10 bg-[var(--navy-950)]/95 p-3 backdrop-blur-md">
        <button
          type="button"
          className="flex min-h-10 w-full items-center justify-center gap-2.5 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-slate-200 border border-white/10 px-3 py-2 text-sm font-bold transition-all shadow-xs"
          onClick={() => {
            dispatch(signOut());
            if (!desktop) onClose();
            const targetLogin = workspace === 'Platform Admin' ? '/platformdbnnetwork' : '/login';
            go(targetLogin, { remember: false });
          }}
          aria-label="Sign out"
        >
          <LogOut className="size-4 text-rose-400" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
