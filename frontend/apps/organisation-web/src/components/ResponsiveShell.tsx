import {useEffect,useState} from 'react';import {NavLink,Outlet,useLocation,useNavigate} from 'react-router-dom';
import {CalendarDays,CheckSquare,MessageSquare,MoreHorizontal,Search,Home,Menu,X,User,LogOut,ExternalLink,KeyRound,ChevronDown,MapPin,ShieldCheck} from 'lucide-react';
import {useOrg} from '@/state/OrgStore';
import {telemetry} from '@/services/telemetry';
import {navGroupsFor} from '@/config/navigation';import {NavTree} from '@/components/NavTree';
import {ChangePasswordModal} from '@/components/ChangePasswordModal';
import {authStorage} from '@/utils/authStorage';
import {useSystemBranding, useChapterBranding} from '@/services/brandingService';

const primary=[['/org/today','Today',Home],['/org/action-centre','Actions',CheckSquare],['/org/converse','Converse',MessageSquare],['/org/calendar','Calendar',CalendarDays],['/org/more','More',MoreHorizontal]] as const;

export function formatScopeName(name?: string, isLeadership?: boolean, isTrust?: boolean): string {
  if (isLeadership) return 'Central Leadership';
  if (isTrust) return 'Trustee Governance';
  if (!name || !name.trim()) return 'SETHU Chapter';
  const clean = name.trim();
  if (clean.toLowerCase().includes('all chapters') || clean.toLowerCase().includes('network-wide')) {
    return 'All Chapters (Network-Wide)';
  }
  // Title-case every word (e.g. "salem" -> "Salem", "salem east" -> "Salem East")
  const titleCased = clean.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  // If it already ends with "Chapter", return it as is
  if (/chapter$/i.test(titleCased)) {
    return titleCased;
  }
  return `${titleCased} Chapter`;
}

function MemberProfileCard({
  name,
  position,
  chapterName,
  scopeLevel,
  isLeadership,
  isTrust,
  initials
}: {
  name: string;
  position: string;
  chapterName: string;
  scopeLevel?: string;
  isLeadership?: boolean;
  isTrust?: boolean;
  initials: string;
}) {
  return (
    <div className="mx-2 my-1.5 p-2.5 rounded-xl bg-gradient-to-b from-slate-800/95 via-slate-800/85 to-slate-900/95 border border-slate-700/80 shadow-xs box-border">
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative shrink-0">
          <div className="size-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xs flex items-center justify-center shadow-xs border border-white/20">
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 border border-slate-900" title="Active Verified Leader" />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <strong className="text-xs font-bold text-white truncate block" title={name}>
            {name}
          </strong>
          <div className="flex items-center gap-1 text-[10.5px] font-semibold text-blue-300 mt-0.5 truncate" title={position}>
            <ShieldCheck className="size-2.5 text-blue-400 shrink-0" />
            <span className="truncate">{position}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between gap-1 text-[10px]">
        <div className="flex items-center gap-1 min-w-0 truncate text-slate-300" title={chapterName}>
          <MapPin className="size-2.5 text-amber-400 shrink-0" />
          <span className="truncate font-medium">{chapterName}</span>
        </div>
        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-700 text-slate-300 shrink-0">
          {isLeadership ? 'NATIONAL' : (isTrust ? 'TRUSTEE' : (scopeLevel || 'CHAPTER'))}
        </span>
      </div>
    </div>
  );
}

export function ResponsiveShell(){
  const {actor,scope,setScope,units,availableScopes,activeAssignment,permissions}=useOrg();
  const loc=useLocation();
  const navigate=useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isForcedPasswordChange, setIsForcedPasswordChange] = useState(false);

  useEffect(()=>{telemetry.emit({level:'info',category:'navigation',name:'route.view',data:{path:loc.pathname,scopeId:scope.id,scopeLevel:scope.level}})},[loc.pathname,scope.id,scope.level]);

  // Check if active leader has must_change_password flag set
  useEffect(() => {
    const sess = authStorage.getActiveSession();
    if (sess && sess.mustChangePassword) {
      setIsForcedPasswordChange(true);
      setChangePasswordOpen(true);
    }
  }, []);

  const storedSession = authStorage.getActiveSession();

  const fallbackScopeName = storedSession?.scopeName || storedSession?.activeScope?.name || 'Unverified Chapter';
  const fallbackScopeId = storedSession?.scopeId || storedSession?.activeScope?.id || '';
  const fallbackScopeLevel = storedSession?.scopeLevel || storedSession?.activeScope?.level || 'CHAPTER';

  const safeScope = (scope && scope.name && scope.name !== 'Chapter Unit')
    ? scope
    : { id: fallbackScopeId, name: fallbackScopeName, level: fallbackScopeLevel };

  const safeActor = (actor && actor.name && actor.name !== 'Office Bearer')
    ? actor
    : (storedSession?.actor || {
        id: storedSession?.email || 'usr-officer',
        name: storedSession?.name || 'Officer',
        position: storedSession?.position || storedSession?.role || 'Leader',
      });
  const safeAvailableScopes = Array.isArray(availableScopes) ? availableScopes : [safeScope];
  const safeUnits = Array.isArray(units) ? units : [];

  const navSections = navGroupsFor(safeScope.level || 'CHAPTER', activeAssignment?.roleType, permissions);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => { setDrawer(false); }, [loc.pathname]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);
  const isLeadershipFinance = authStorage.isLeadershipFinance() || safeActor.position === 'Leadership Finance' || storedSession?.position === 'Leadership Finance' || storedSession?.roleType === 'LEADERSHIP_FINANCE';
  const isMemberCoordinator = authStorage.isMemberCoordinator() || safeActor.position === 'Member Coordinator' || storedSession?.position === 'Member Coordinator';
  const isLeadershipTeam = !isLeadershipFinance && !isMemberCoordinator && (safeActor.position === 'Leadership Team' || (safeActor as any).role === 'leadership_team' || storedSession?.position === 'Leadership Team' || storedSession?.roleType === 'LEADERSHIP_TEAM' || String(activeAssignment?.roleType) === 'LEADERSHIP_TEAM' || authStorage.isLeadershipTeam());
  const isTrust = !isLeadershipTeam && !isLeadershipFinance && !isMemberCoordinator && (safeActor.position === 'Trust' || safeActor.position === 'Trustee' || storedSession?.position === 'Trust' || storedSession?.position === 'Trustee' || String(activeAssignment?.roleType) === 'TRUST_ADMINISTRATOR');

  // Hierarchy Level Security: A chapter member/officer cannot switch to higher levels (Region, State, National)
  const HIERARCHY_LEVEL_ORDER: Record<string, number> = {
    CHAPTER: 1,
    CITY: 2,
    REGION: 3,
    STATE: 4,
    NATIONAL: 5
  };
  const actorRoleLevel = (activeAssignment?.organisationLevel || storedSession?.scopeLevel || 'CHAPTER').toUpperCase();
  const maxAllowedRank = (isTrust || isLeadershipTeam || isLeadershipFinance || isMemberCoordinator) ? 99 : (HIERARCHY_LEVEL_ORDER[actorRoleLevel] ?? 1);

  // Filter available scopes strictly to actor's hierarchy level or below (no upward escalation of scope)
  const permittedScopes = safeAvailableScopes.filter(s => {
    if (isTrust || isLeadershipTeam || isLeadershipFinance || isMemberCoordinator) return true;
    const scopeRank = HIERARCHY_LEVEL_ORDER[(s.level || 'CHAPTER').toUpperCase()] ?? 1;
    return scopeRank <= maxAllowedRank;
  });

  const isActualChapter = (name: string, level?: string) => {
    const l = (level || '').toUpperCase();
    if (l === 'REGION' || l === 'STATE' || l === 'NATIONAL' || l === 'CITY') return false;
    const n = (name || '').toLowerCase();
    return !n.includes('region') && !n.includes('state') && !n.includes('national') && !n.includes('management');
  };

  const allowedUnits = permittedScopes
    .map(s => safeUnits.find(u => u.id === s.id) ?? { id: s.id, name: s.name || s.id, level: s.level || 'CHAPTER', status: 'Active', health: 0, memberCount: 0 })
    .filter(u => u.id === 'all' || isActualChapter(u.name, u.level));

  // Self-heal: If current active scope is set higher than permitted level (e.g. user selected Region earlier), reset immediately back to Chapter
  useEffect(() => {
    if (!isTrust && !isLeadershipTeam && (HIERARCHY_LEVEL_ORDER[(safeScope.level || 'CHAPTER').toUpperCase()] ?? 1) > maxAllowedRank) {
      const fallbackChapter = permittedScopes.find(s => (HIERARCHY_LEVEL_ORDER[(s.level || 'CHAPTER').toUpperCase()] ?? 1) <= maxAllowedRank)
        || { id: fallbackScopeId, name: fallbackScopeName, level: 'CHAPTER' as const };
      setScope({ id: fallbackChapter.id, name: fallbackChapter.name, level: fallbackChapter.level || 'CHAPTER' });
    }
  }, [isTrust, isLeadershipTeam, maxAllowedRank, safeScope.level, permittedScopes, fallbackScopeId, fallbackScopeName, setScope]);

  const headerScopeText = isLeadershipTeam
    ? (safeScope.id === 'all' ? 'All Chapters (Leadership)' : safeScope.name)
    : (isTrust ? 'All Chapters' : (safeScope.name || 'Chapter'));
  const headerScopeSubtitle = isLeadershipTeam
    ? 'Leadership Scope · Full Network Governance'
    : (isTrust ? 'Tenant-Wide Scope · Organization' : `${safeScope.name || 'Chapter'} · Chapter Scope`);

  const actorInitials = ((safeActor.name || 'Member').trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('') || 'M').toUpperCase();
  const displayChapterName = formatScopeName(safeScope.name, isLeadershipTeam || isLeadershipFinance, isTrust);
  const branding = useSystemBranding();
  const chapterBranding = useChapterBranding(safeScope.name || safeScope.id);

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <aside className="side-nav">
      <div className="sticky top-0 z-20 bg-[#0b192e] border-b border-slate-800 shrink-0">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid var(--sidebar-border)' }}>
          <img
            src={branding.sidebarLogo || "/brand/sethu-logo.jpeg"}
            alt="SETHU Logo"
            style={{
              width: `${branding.sethuSize || 36}px`,
              height: `${branding.sethuSize || 36}px`,
              borderRadius: `${Math.max(4, Math.round((branding.sethuSize || 36) * 0.2))}px`,
              objectFit: 'contain',
              background: '#ffffff',
              padding: '2px',
              border: '1px solid rgba(255,255,255,0.15)',
              flexShrink: 0,
              transition: 'width 0.15s ease, height 0.15s ease'
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>SETHU</span>
              <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#60a5fa', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', padding: '1px 5px', borderRadius: '4px' }}>
                {isLeadershipFinance ? 'Finance' : (isLeadershipTeam ? 'Leadership' : (isTrust ? 'Trust' : 'Operations'))}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Dharmic Business Network
            </div>
          </div>
        </div>

        {/* High-End Member Profile Card at the top of the Sidebar */}
        <MemberProfileCard
          name={safeActor.name}
          position={safeActor.position}
          chapterName={displayChapterName}
          scopeLevel={safeScope.level}
          isLeadership={isLeadershipTeam}
          isTrust={isTrust}
          initials={actorInitials}
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <NavTree groups={navSections}/>
      </div>
    </aside>
    <header className="topbar gap-2 px-2.5 sm:px-5">
      {/* Top Left: Hamburger Button and Scope/Title */}
      <div className="top-left min-w-0 flex-1 flex items-center gap-1.5 sm:gap-2.5 overflow-hidden">
        <button 
          type="button" 
          className="menu-btn shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors" 
          aria-label="Open navigation menu" 
          aria-expanded={drawer} 
          onClick={()=>setDrawer(true)}
        >
          <Menu size={20}/>
        </button>

        <img
          src={chapterBranding?.logo || chapterBranding?.image || "/brand/Chapter-logo.jpeg"}
          alt={`${displayChapterName} Logo`}
          className="size-7 sm:size-8 rounded-lg bg-white p-0.5 object-contain border border-slate-200 shrink-0 shadow-xs"
        />

        <div className="flex items-center gap-1.5 min-w-0 leading-tight overflow-hidden">
          <strong className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 truncate min-w-0" title={displayChapterName}>
            {displayChapterName}
          </strong>
          {isLeadershipTeam ? (
            <span className="hidden min-[640px]:inline-block px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
              Governance
            </span>
          ) : (
            <span className="hidden min-[640px]:inline-block px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
              Operations
            </span>
          )}
        </div>
      </div>

      {/* Top Tools: Compact Actions */}
      <div className="top-tools flex items-center gap-1 sm:gap-2 shrink-0">
        {(isLeadershipTeam || isLeadershipFinance || isMemberCoordinator) && (
          <div className="relative hidden sm:flex items-center shrink-0">
            <select
              className="h-8 pl-2 pr-6 text-xs font-semibold text-indigo-950 bg-indigo-50/80 hover:bg-indigo-100/70 border border-indigo-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all cursor-pointer truncate max-w-[180px]"
              value={safeScope.id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const val = e.target.value;
                if (val === 'all') {
                  setScope({ id: 'all', name: 'All Chapters (Network-Wide)', level: 'NATIONAL' });
                } else {
                  const u = safeUnits.find(x => x.id === val) || allowedUnits.find(x => x.id === val);
                  if (u) {
                    setScope({ id: u.id, name: u.name, level: u.level || 'CHAPTER' });
                  }
                }
              }}
              title="Filter by Chapter"
            >
              <option value="all">🌟 All Chapters</option>
              {allowedUnits.filter(u => u.id !== 'all').map(u => (
                <option key={u.id} value={u.id}>📍 {formatScopeName(u.name)}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-indigo-600">
              <ChevronDown size={12} />
            </div>
          </div>
        )}

        {!isTrust && !isLeadershipTeam && allowedUnits.length > 1 && (
          <div className="relative hidden sm:flex items-center shrink-0">
            <select 
              className="h-8 pl-2 pr-6 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg focus:outline-none cursor-pointer truncate max-w-[160px]"
              value={safeScope.id} 
              onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>{const u=safeUnits.find(x=>x.id===e.target.value);if(u){const next={id:u.id,name:u.name,level:u.level};setScope(next)}}}
            >
              {allowedUnits.map(u=><option key={u.id} value={u.id}>📍 {formatScopeName(u.name)}</option>)}
            </select>
            <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500">
              <ChevronDown size={12} />
            </div>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200" title={`Current session: ${safeActor.name} (${safeActor.position})`}>
          <User size={13} className="text-blue-600 shrink-0" />
          <span className="font-bold truncate max-w-[100px] text-xs text-slate-700">{safeActor.name}</span>
        </div>

        {/* Header Logo (DBN) */}
        <div className="flex items-center shrink-0 pl-1">
          <img
            src={branding.headerLogo || "/brand/dbn-logo.jpeg"}
            alt="DBN Logo"
            style={{
              height: `${Math.max(32, Math.min(68, branding.headerLogoSize || 42))}px`,
              width: 'auto',
              maxHeight: '68px',
              transition: 'height 0.15s ease'
            }}
            className="object-contain rounded-md bg-white p-0.5 border border-slate-200 shadow-2xs shrink-0"
          />
        </div>

        {/* Change Password Button - Visible on Tablet/Desktop, accessible in Drawer on Mobile */}
        <button
          type="button"
          onClick={() => {
            setIsForcedPasswordChange(false);
            setChangePasswordOpen(true);
          }}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs font-semibold transition-colors shrink-0 h-8 shadow-2xs"
          title="Change account password"
        >
          <KeyRound size={13} className="text-slate-600 shrink-0" />
          <span>Change Password</span>
        </button>

        {/* Search */}
        <NavLink to="/org/search" aria-label="Search" className="p-1.5 text-slate-500 hover:text-slate-800 shrink-0 rounded-lg hover:bg-slate-100 transition-colors">
          <Search size={18}/>
        </NavLink>

        {/* Logout Button - Compact Icon-only on mobile, full on tablet/desktop */}
        <button 
          type="button"
          onClick={() => {
            authStorage.clearAll();
            navigate('/org/login');
          }} 
          className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors shrink-0 h-8 shadow-2xs" 
          title="Logout from account"
        >
          <LogOut size={14} className="text-rose-600 shrink-0" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        <a 
          href="http://localhost:5173/platform-admin/chapters" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-semibold transition-colors shrink-0 h-8" 
          title="Platform Admin: Create chapters, manage office-bearers"
        >
          <ExternalLink size={13} className="text-slate-500" />
          <span>Platform Admin</span>
        </a>
      </div>
    </header>

    {drawer && (
      <div className="drawer-backdrop" onClick={()=>setDrawer(false)}>
        <aside className="drawer" role="dialog" aria-modal="true" aria-label="Navigation menu" onClick={(e:{stopPropagation:()=>void})=>e.stopPropagation()}>
          <div className="drawer-head">
            <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <img
                src={branding.sidebarLogo || "/brand/sethu-logo.jpeg"}
                alt="SETHU"
                style={{
                  width: `${branding.sethuSize ? Math.min(36, branding.sethuSize) : 36}px`,
                  height: `${branding.sethuSize ? Math.min(36, branding.sethuSize) : 36}px`,
                  borderRadius: '8px',
                  objectFit: 'contain',
                  background: '#ffffff',
                  padding: '2px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  flexShrink: 0,
                  transition: 'width 0.15s ease, height 0.15s ease'
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>SETHU</span>
                  <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#60a5fa', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', padding: '1px 5px', borderRadius: '4px' }}>
                    {isLeadershipFinance ? 'Finance' : (isLeadershipTeam ? 'Leadership' : (isTrust ? 'Trust' : 'Operations'))}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Dharmic Business Network
                </div>
              </div>
            </div>
            <button 
              type="button" 
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60 shrink-0 ml-1.5" 
              aria-label="Close navigation menu" 
              onClick={()=>setDrawer(false)}
            >
              <X size={18}/>
            </button>
          </div>

          {/* User profile card inside drawer */}
          <MemberProfileCard
            name={safeActor.name}
            position={safeActor.position}
            chapterName={displayChapterName}
            scopeLevel={safeScope.level}
            isLeadership={isLeadershipTeam}
            isTrust={isTrust}
            initials={actorInitials}
          />

          {/* Scope selection inside drawer */}
          {!isTrust && (allowedUnits.length > 1 || isLeadershipTeam) && (
            <label className="drawer-scope">
              <span>Chapter Filter</span>
              <select 
                value={safeScope.id} 
                onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>{
                  const val=e.target.value;
                  if(val==='all'){
                    setScope({id:'all',name:'All Chapters (Network-Wide)',level:'NATIONAL'});
                  }else{
                    const u=units.find(x=>x.id===val)||allowedUnits.find(x=>x.id===val);
                    if(u)setScope({id:u.id,name:u.name,level:u.level||'CHAPTER'});
                  }
                }}
              >
                {isLeadershipTeam && <option value="all">🌟 All Chapters (Network-Wide)</option>}
                {allowedUnits.filter(u=>u.id!=='all').map(u=><option key={u.id} value={u.id}>📍 {formatScopeName(u.name)}</option>)}
              </select>
            </label>
          )}

          {/* Navigation sections */}
          <NavTree groups={navSections} onNavigate={()=>setDrawer(false)}/>

          {/* Mobile quick actions inside drawer footer */}
          <div className="pt-4 pb-14 border-t border-slate-700/80 flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDrawer(false);
                setIsForcedPasswordChange(false);
                setChangePasswordOpen(true);
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors shadow-xs"
            >
              <KeyRound size={15} className="text-slate-400 shrink-0" />
              <span>Change Password</span>
            </button>

            <NavLink
              to="/org/login"
              onClick={() => {
                setDrawer(false);
                authStorage.clearAll();
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-700/70 text-indigo-200 text-xs font-bold transition-colors shadow-xs"
            >
              <LogOut size={15} className="text-indigo-400 shrink-0" />
              <span>Switch Role / Sign Out</span>
            </NavLink>

            <a
              href="http://localhost:5173/platform-admin/chapters"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <ExternalLink size={15} className="text-slate-400 shrink-0" />
              <span>Platform Admin</span>
            </a>
          </div>
        </aside>
      </div>
    )}
    <main id="main-content" tabIndex={-1} className="content" data-route={loc.pathname}><Outlet/></main>
    <nav className="bottom-nav">{primary.map(([to,label,Icon])=><NavLink key={to} to={to} className={({isActive}:{isActive:boolean})=>isActive?'active':''}><Icon size={20}/><span>{label}</span></NavLink>)}</nav>

    {/* Change Password Modal */}
    <ChangePasswordModal
      isOpen={changePasswordOpen}
      isForced={isForcedPasswordChange}
      identifier={storedSession?.email || ''}
      onClose={() => setChangePasswordOpen(false)}
      onSuccess={() => {
        setChangePasswordOpen(false);
        setIsForcedPasswordChange(false);
      }}
    />
  </div>
}

