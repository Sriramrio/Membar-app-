import {
  Bell,
  Building2,
  CalendarDays,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useAppDispatch,
  useAppSelector,
  useNetworkSlice,
} from "@/app/hooks";

import {
  selectWorkspace,
  signOut,
} from "@/features/auth/authSlice";

import {
  activeMemberId,
  opportunityVisibleToMember,
} from "@/features/network/selectors";

import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/features/network/networkSlice";

import { toast } from "@/components/ui/Toast";
import { workspaceHome } from "@/config/navigation";
import { RoleContextBar } from "./RoleContextBar";
import { useAppNavigation } from "@/navigation/useAppNavigation";
import { safeNavigationTarget } from "@/navigation/entityTargets";
import { serverClock } from "@/services/time/serverClock";
import { SethuLogo } from "@/components/brand/SethuLogo";
import { useSystemBranding } from "@/services/brandingService";

/* ==========================================
   RESPONSIVE DBN BRAND LOGO

   The logo is rendered as a contained
   background image rather than an <img>.
   This prevents global img styling from
   expanding it across the dashboard.
========================================== */

function DbnBrandLogo() {
  const branding = useSystemBranding();
  const dbnLogo = branding.headerLogo || "/brand/dbn-logo.jpeg";
  const headerHeight = Math.max(32, Math.min(80, branding.headerLogoSize || 48));

  return (
    <div className="flex items-center justify-center shrink-0">
      <img
        src={dbnLogo}
        alt="Dharmic Business Network"
        style={{
          height: `${headerHeight}px`,
          width: "auto",
          maxHeight: "80px",
          objectFit: "contain",
          transition: "height 0.15s ease",
        }}
        className="shrink-0"
      />
    </div>
  );
}

/* ==========================================
   SEARCH RESULT ICON
========================================== */

type SearchResult = {
  key: string;
  label: string;
  meta: string;
  href: string;
  icon: "member" | "business" | "opportunity" | "event";
};

function SearchResultIcon({
  kind,
}: {
  kind: SearchResult["icon"];
}) {
  switch (kind) {
    case "member":
      return <UserRound className="size-4" />;

    case "business":
      return <Building2 className="size-4" />;

    case "event":
      return <CalendarDays className="size-4" />;

    default:
      return <MessageSquare className="size-4" />;
  }
}

/* ==========================================
   MAIN HEADER COMPONENT
========================================== */

export function Header({
  onMenu,
}: {
  onMenu: () => void;
}) {
  const branding = useSystemBranding();
  const { go } = useAppNavigation();
  const dispatch = useAppDispatch();

  const auth = useAppSelector((s) => s.auth);

  const network = useNetworkSlice([
    "businesses",
    "categories",
    "events",
    "members",
    "notifications",
    "opportunities",
  ] as const);

  const memberId = useAppSelector(activeMemberId);

  const [query, setQuery] = useState("");
  const [mobileSearch, setMobileSearch] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  const input = useRef<HTMLInputElement | null>(null);

  /* ======================================
     MOBILE SEARCH FOCUS
  ====================================== */

  useEffect(() => {
    if (mobileSearch) {
      input.current?.focus();
    }
  }, [mobileSearch]);

  /* ======================================
     MEMBER NOTIFICATIONS
  ====================================== */

  const notices = network.notifications
    .filter(
      (n) =>
        n.memberId === memberId &&
        (!n.availableAt ||
          new Date(n.availableAt).getTime() <=
          serverClock.nowMs())
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const unread = notices.filter((n) => !n.read).length;

  /* ======================================
     SEARCH RESULTS
  ====================================== */

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();

    if (!q) return [];

    const out: SearchResult[] = [];

    network.members
      .filter(
        (m) =>
          m.status !== "suspended" &&
          `${m.name} ${m.designation} ${m.expertise.join(" ")}`
            .toLowerCase()
            .includes(q)
      )
      .slice(0, 3)
      .forEach((m) =>
        out.push({
          key: m.id,
          label: m.name,
          meta: `Bhandhu · ${m.chapter}`,
          href: `/app/members/${m.id}`,
          icon: "member",
        })
      );

    network.businesses
      .filter(
        (b) =>
          b.visibility !== "hidden" &&
          `${b.name} ${b.capabilities.join(" ")} ${b.products.join(" ")}`
            .toLowerCase()
            .includes(q)
      )
      .slice(0, 3)
      .forEach((b) =>
        out.push({
          key: b.id,
          label: b.name,
          meta: `Business · ${b.city}`,
          href: `/app/businesses/${b.id}`,
          icon: "business",
        })
      );

    network.opportunities
      .filter(
        (o) =>
          o.status === "open" &&
          opportunityVisibleToMember(
            { network },
            o,
            memberId
          ) &&
          `${o.title} ${o.description} ${o.location}`
            .toLowerCase()
            .includes(q)
      )
      .slice(0, 3)
      .forEach((o) =>
        out.push({
          key: o.id,
          label: o.title,
          meta: "Opportunity",
          href: `/app/opportunities/${o.id}`,
          icon: "opportunity",
        })
      );

    network.events
      .filter((e) =>
        `${e.name} ${e.city} ${e.type}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 2)
      .forEach((e) =>
        out.push({
          key: e.id,
          label: e.name,
          meta: `Event · ${e.city}`,
          href: `/app/events/${e.id}`,
          icon: "event",
        })
      );

    network.categories
      .filter((c) =>
        `${c.name} ${c.description}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 2)
      .forEach((c) =>
        out.push({
          key: c.id,
          label: c.name,
          meta: "Business category",
          href: `/app/directory?category=${c.id}`,
          icon: "business",
        })
      );

    const resources = [
      ["Opportunity response checklist", "/app/resources"],
      ["Business profile completeness guide", "/app/resources"],
      ["One-to-one meeting template", "/app/resources"],
      ["Export readiness starter pack", "/app/resources"],
    ];

    resources
      .filter(([name]) => name.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach(([name, href], i) =>
        out.push({
          key: `resource-${i}-${name}`,
          label: name,
          meta: "Resource",
          href,
          icon: "business",
        })
      );

    return out.slice(0, 9);
  }, [query, network, memberId]);

  /* ======================================
     SEARCH NAVIGATION
  ====================================== */

  const choose = (href: string) => {
    setQuery("");
    setMobileSearch(false);

    if (
      href.startsWith("/app") &&
      auth.account?.workspaces.includes("Member") &&
      auth.activeWorkspace !== "Member"
    ) {
      dispatch(selectWorkspace("Member"));
    }

    go(href, { label: "Search result" });
  };

  /* ======================================
     SEARCH INPUT
  ====================================== */

  const searchBox = (
    <div className="relative w-full min-w-0">
      <Search
        className="
          pointer-events-none
          absolute left-3.5 top-1/2
          size-4 -translate-y-1/2
          text-slate-400
        "
      />

      <input
        ref={input}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="
          h-10 w-full min-w-0
          rounded-xl border border-slate-200
          bg-slate-50/90
          pl-10 pr-9
          text-sm text-slate-800
          placeholder:text-slate-400
          outline-none
          transition-all
          focus:border-amber-500
          focus:bg-white
          focus:ring-2
          focus:ring-amber-500/20
        "
        placeholder="Search bhandhus, businesses, opportunities…"
        aria-label="Search network"
      />

      {query ? (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="
            absolute right-3 top-1/2
            -translate-y-1/2
            text-slate-400
            hover:text-slate-600
          "
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : (
        <kbd
          className="
            pointer-events-none
            absolute right-2.5 top-1/2
            hidden -translate-y-1/2
            items-center rounded
            border border-slate-200
            bg-white px-1.5 py-0.5
            text-[10px] font-semibold
            text-slate-400
            xl:inline-flex
          "
        >
          ⌘K
        </kbd>
      )}

      {results.length > 0 && (
        <div
          className="
            absolute top-[calc(100%+.45rem)]
            z-[70] max-h-[30rem]
            w-full min-w-0
            overflow-auto rounded-2xl
            border border-slate-200
            bg-white p-1.5 shadow-2xl
            sm:min-w-[300px]
          "
        >
          {results.map((r) => (
            <button
              key={`${r.icon}-${r.key}`}
              type="button"
              onClick={() => choose(r.href)}
              className="
                flex min-h-12 w-full
                items-center gap-3
                rounded-xl px-3 py-2
                text-left transition-colors
                hover:bg-slate-50
              "
            >
              <span
                className="
                  grid size-8 shrink-0
                  place-items-center
                  rounded-lg bg-slate-100
                  text-slate-600
                "
              >
                <SearchResultIcon kind={r.icon} />
              </span>

              <span className="min-w-0 flex-1">
                <strong
                  className="
                    block truncate text-sm
                    text-[var(--navy-950)]
                  "
                >
                  {r.label}
                </strong>

                <small className="block truncate text-xs text-slate-500">
                  {r.meta}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  /* ======================================
     PUBLIC HEADER
  ====================================== */

  if (!auth.authenticated) {
    return (
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div
          className="
            mx-auto flex h-16
            max-w-[120rem]
            items-center justify-between
            gap-3 px-3
            sm:h-20 sm:px-6
          "
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={branding.sidebarLogo || "/brand/sethu-logo.jpeg"}
              alt="SETHU"
              style={{
                height: `${Math.max(28, Math.min(52, branding.sethuSize || 36))}px`,
                width: 'auto',
                borderRadius: '8px'
              }}
              className="shrink-0 object-contain shadow-xs"
            />

            <span
              className="
                text-lg font-black
                tracking-tight text-[#5A121A]
                sm:text-xl
              "
            >
              SETHU
            </span>
          </div>

          <div className="shrink-0 flex items-center">
            <DbnBrandLogo />
          </div>
        </div>

        <div
          className="
            h-0.5 bg-gradient-to-r
            from-[var(--navy-900)]
            via-sky-600
            to-[var(--orange-500)]
          "
        />
      </header>
    );
  }

  /* ======================================
     AUTHENTICATED APPLICATION HEADER
  ====================================== */

  return (
    <>
      <header
        className="
          sticky top-0 z-30
          w-full min-w-0
          border-b border-slate-200/80
          bg-white/95
          shadow-xs backdrop-blur-md
          lg:pl-[280px]
          xl:pl-[304px]
        "
      >
        <div
          className="
            mx-auto max-w-[120rem]
            min-w-0 px-2.5
            sm:px-6
          "
        >
          <div
            className="
              flex min-h-[64px] sm:min-h-[72px] h-auto py-1 sm:py-1.5 min-w-0
              items-center justify-between
              gap-2 sm:gap-3
            "
          >
            {/* =================================
                MOBILE LOGO AND MENU
            ================================= */}


            {/* MOBILE / TABLET HEADER BRAND */}
            <div className="flex min-w-0 items-center gap-2 lg:hidden">

              {/* Sidebar Toggle */}
              <button
                type="button"
                onClick={onMenu}
                className="
      grid size-9 shrink-0
      place-items-center
      rounded-xl
      border border-slate-200
      bg-white
      text-slate-700
      hover:bg-slate-50
      sm:size-10
    "
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </button>

              {/* Actual DBN Brand Logo */}
              <button
                type="button"
                onClick={() =>
                  go(workspaceHome(auth.activeWorkspace), {
                    label: "Workspace home",
                  })
                }
                className="
      flex min-w-0
      items-center justify-center
      rounded-lg
    "
                aria-label="Dharmic Business Network home"
              >
                <span className="sethu-mobile-logo-frame">
                  <img
                    src={branding.headerLogo || "/brand/dbn-logo.jpeg"}
                    alt="Dharmic Business Network"
                    className="sethu-mobile-logo-image"
                    width={160}
                    height={80}
                    loading="eager"
                  />
                </span>
              </button>

            </div>

            {/* =================================
                DESKTOP SEARCH AND ROLE
            ================================= */}

            <div
              className="
                hidden min-w-0 max-w-2xl
                flex-1 items-center gap-3
                lg:flex
              "
            >
              <div className="w-full min-w-0 max-w-md xl:max-w-lg">
                {searchBox}
              </div>

              <RoleContextBar />
            </div>

            {/* =================================
                HEADER RIGHT ACTIONS
            ================================= */}

            <div
              className="
                flex min-w-0 shrink-0
                items-center justify-end
                gap-1.5 sm:gap-2
              "
            >
              {/* Mobile Search */}

              <button
                type="button"
                onClick={() => setMobileSearch(true)}
                className="
                  grid size-9 shrink-0
                  place-items-center
                  rounded-xl
                  border border-slate-200
                  text-slate-700
                  transition
                  hover:bg-slate-50
                  sm:size-10 lg:hidden
                "
                aria-label="Search"
              >
                <Search className="size-5" />
              </button>

              {/* MEMBER ACTIONS */}

              {auth.activeWorkspace === "Member" && (
                <>
                  {/* Converse */}

                  <button
                    type="button"
                    onClick={() =>
                      go("/app/messages", {
                        label: "Converse",
                      })
                    }
                    className="
                      grid size-9 shrink-0
                      place-items-center
                      rounded-xl
                      border border-slate-200
                      hover:bg-slate-50
                      sm:size-11
                    "
                    aria-label="Converse"
                  >
                    <MessageSquare className="size-5" />
                  </button>

                  {/* Notifications */}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setNoticeOpen((v) => !v)
                      }
                      className="
                        relative grid size-9
                        shrink-0 place-items-center
                        rounded-xl
                        border border-slate-200
                        hover:bg-slate-50
                        sm:size-11
                      "
                      aria-label={`${unread} unread notifications`}
                      aria-expanded={noticeOpen}
                    >
                      <Bell className="size-5" />

                      {unread > 0 && (
                        <span
                          className="
                            absolute right-0.5 top-0.5
                            grid min-h-4 min-w-4
                            place-items-center
                            rounded-full bg-red-600
                            px-1 text-[10px]
                            font-black text-white
                            sm:right-1 sm:top-1
                          "
                        >
                          {unread}
                        </span>
                      )}
                    </button>

                    {noticeOpen && (
                      <>
                        <div
                          className="
                            fixed inset-0 z-[65]
                            bg-slate-950/20
                            backdrop-blur-xs
                            sm:bg-transparent
                          "
                          onClick={() =>
                            setNoticeOpen(false)
                          }
                          aria-hidden="true"
                        />

                        <div
                          className="
                            fixed inset-x-2 top-16
                            z-[70]
                            max-h-[calc(100dvh-5rem)]
                            overflow-y-auto
                            overscroll-contain
                            rounded-2xl
                            border border-slate-200
                            bg-white p-2.5 shadow-2xl
                            sm:absolute
                            sm:inset-x-auto
                            sm:right-0 sm:top-13
                            sm:w-[360px]
                            sm:max-h-[30rem]
                          "
                        >
                          <div
                            className="
                              flex items-center
                              justify-between
                              border-b border-slate-100
                              px-2 pb-2
                            "
                          >
                            <strong
                              className="
                                text-base font-black
                                text-[var(--navy-950)]
                              "
                            >
                              Notifications
                            </strong>

                            <div className="flex items-center gap-2">
                              {unread > 0 && (
                                <button
                                  type="button"
                                  className="
                                    text-xs font-bold
                                    text-slate-500
                                    hover:text-slate-800
                                  "
                                  onClick={() => {
                                    dispatch(
                                      markAllNotificationsRead(
                                        memberId
                                      )
                                    );

                                    toast.success(
                                      "All notifications marked as read",
                                      "Notifications"
                                    );
                                  }}
                                >
                                  Mark all read
                                </button>
                              )}

                              <button
                                type="button"
                                className="
                                  text-sm font-bold
                                  text-sky-700
                                  hover:underline
                                "
                                onClick={() => {
                                  setNoticeOpen(false);

                                  go("/app/notifications", {
                                    label: "Notifications",
                                  });
                                }}
                              >
                                View all
                              </button>

                              <button
                                type="button"
                                onClick={() => setNoticeOpen(false)}
                                className="
                                  grid size-7
                                  place-items-center
                                  rounded-lg
                                  text-slate-400
                                  hover:text-slate-700
                                  hover:bg-slate-100
                                  transition-colors
                                  ml-1
                                "
                                aria-label="Close notifications"
                                title="Close notifications"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-1 divide-y divide-slate-100">
                            {notices.slice(0, 5).map((n) => (
                              <button
                                key={n.id}
                                type="button"
                                onClick={() => {
                                  dispatch(
                                    markNotificationRead({
                                      notificationId: n.id,
                                      memberId,
                                    })
                                  );

                                  setNoticeOpen(false);

                                  go(
                                    safeNavigationTarget(
                                      n.href
                                    ),
                                    {
                                      label: "Notification",
                                    }
                                  );
                                }}
                                className={`
                                  w-full rounded-xl
                                  p-3 text-left
                                  text-sm
                                  transition-colors
                                  hover:bg-slate-50
                                  ${n.read
                                    ? "text-slate-600"
                                    : "bg-sky-50/70 font-semibold text-slate-900"
                                  }
                                `}
                              >
                                {n.text}

                                <small
                                  className="
                                    mt-1 block
                                    text-xs font-normal
                                    text-slate-500
                                  "
                                >
                                  {new Date(
                                    n.createdAt
                                  ).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    }
                                  )}
                                </small>
                              </button>
                            ))}

                            {!notices.length && (
                              <div
                                className="
                                  py-6 text-center
                                  text-sm text-slate-500
                                "
                              >
                                No notifications
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* User Profile */}

              {auth.account?.name && (
                <button
                  type="button"
                  onClick={() =>
                    go("/app/profile", {
                      label: "My Profile",
                    })
                  }
                  className="
                    hidden max-w-[170px]
                    items-center gap-2
                    rounded-xl
                    border border-slate-200
                    px-2.5 py-1.5
                    transition
                    hover:bg-slate-50
                    xl:flex
                  "
                  title={`${auth.account.name} · View Profile`}
                >
                  <span
                    className="
                      grid size-7 shrink-0
                      place-items-center
                      rounded-lg
                      bg-[var(--navy-900)]
                      text-xs font-black
                      text-white
                    "
                  >
                    {auth.account.name
                      .split(" ")
                      .map((x) => x[0])
                      .slice(0, 2)
                      .join("")}
                  </span>

                  <span
                    className="
                      truncate text-sm
                      font-bold
                      text-[var(--navy-950)]
                    "
                  >
                    {auth.account.name}
                  </span>
                </button>
              )}

              {/* Logout */}

              <button
                type="button"
                onClick={() => {
                  dispatch(signOut());

                  go("/login", {
                    remember: false,
                  });
                }}
                className="
                  hidden size-11 shrink-0
                  place-items-center
                  rounded-xl
                  border border-slate-200
                  hover:bg-slate-50
                  sm:grid
                "
                aria-label="Sign out"
              >
                <LogOut className="size-5 text-slate-600" />
              </button>

              {/* =================================
                  FIXED RESPONSIVE DBN LOGO
                  No oversized img element
              ================================= */}

              <div
                className="
                  hidden shrink-0
                  sm:flex items-center
                "
              >
                <DbnBrandLogo />
              </div>
            </div>
          </div>

          {/* Mobile / Tablet Role Context */}

          <div
            className="
              flex justify-center
              overflow-x-hidden
              border-t border-slate-100
              px-2 py-2
              lg:hidden
            "
          >
            <RoleContextBar />
          </div>
        </div>

        {/* Brand Accent Border */}

        <div
          className="
            h-0.5 bg-gradient-to-r
            from-[var(--navy-900)]
            via-amber-500
            to-[var(--maroon-700)]
          "
        />
      </header>

      {/* ======================================
          MOBILE AND TABLET SEARCH OVERLAY
      ====================================== */}

      {mobileSearch && (
        <div
          className="
            fixed inset-x-0 top-0
            z-[80]
            bg-white p-3 shadow-xl
            lg:hidden
          "
        >
          <div className="flex min-w-0 gap-2">
            {searchBox}

            <button
              type="button"
              onClick={() => {
                setMobileSearch(false);
                setQuery("");
              }}
              className="
                grid size-11 shrink-0
                place-items-center
                rounded-xl
                border border-slate-200
              "
              aria-label="Close search"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}