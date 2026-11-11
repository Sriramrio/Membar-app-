import {useState,useEffect} from 'react';
import {NavLink,Outlet,useLocation,useNavigate,Navigate} from 'react-router-dom';
import {useBootstrap} from '@/bootstrap/BootstrapContext';
import {menuFor} from '@/navigation/menu';
import {routeIcons} from '@/navigation/routeIcons';
import {LucideIcon} from '@/components/LucideIcon';
import {useSystemBranding} from '@/services/brandingService';
import {API_BASE} from '@/services/api';

export function PlatformAdminShell(){
  const branding = useSystemBranding();
  const {bootstrap} = useBootstrap();
  const groups = menuFor(bootstrap?.permissions??[]);
  const [drawer,setDrawer] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();

  const isAuth = typeof window !== 'undefined' && (
    sessionStorage.getItem('sethu:platform_auth') === 'true' ||
    localStorage.getItem('sethu:platform_auth') === 'true'
  );

  useEffect(()=>{setDrawer(false);},[loc.pathname]);
  useEffect(()=>{
    if(!drawer) return;
    const onKey = (e: KeyboardEvent)=>{if(e.key==='Escape')setDrawer(false);};
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[drawer]);

  const handleSignOut = async () => {
    try {
      const logoutUrl = API_BASE ? `${API_BASE.replace(/\/+$/, '')}/api/auth/logout` : '/api/auth/logout';
      await fetch(logoutUrl, { method: 'POST', credentials: 'include' }).catch(() => null);
      sessionStorage.removeItem('sethu:platform_auth');
      sessionStorage.removeItem('sethu:operator');
      localStorage.removeItem('sethu:platform_auth');
      localStorage.removeItem('sethu:operator');
    } catch {}
    navigate('/login', { replace: true });
  };

  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <header className="mobile-header">
        <button
          type="button"
          className="menu-btn"
          aria-label="Open navigation menu"
          aria-expanded={drawer}
          onClick={()=>setDrawer(true)}
        >
          <LucideIcon name="menu" size={22}/>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={branding.sidebarLogo || "/brand/sethu-logo.jpeg"}
            alt="SETHU"
            style={{
              width: `${branding.sethuSize ? Math.min(32, Math.max(24, branding.sethuSize - 4)) : 28}px`,
              height: `${branding.sethuSize ? Math.min(32, Math.max(24, branding.sethuSize - 4)) : 28}px`,
              borderRadius: '6px',
              background: '#fff',
              objectFit: 'contain',
              padding: '2px',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
          />
          <div className="brand" style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Platform Admin</div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            color: '#fca5a5',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Sign out"
        >
          <LucideIcon name="log-out" size={18} />
        </button>
      </header>
      {drawer && <div className="drawer-backdrop" onClick={()=>setDrawer(false)} />}
      <aside className={`sidebar${drawer?' open':''}`} aria-label="Platform Administration navigation">
        <div className="sidebar-head">
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={branding.sidebarLogo || "/brand/sethu-logo.jpeg"}
              alt="SETHU"
              style={{
                width: `${branding.sethuSize || 32}px`,
                height: `${branding.sethuSize || 32}px`,
                borderRadius: `${Math.max(4, Math.round((branding.sethuSize || 32) * 0.2))}px`,
                objectFit: 'contain',
                background: '#ffffff',
                padding: '2px',
                border: '1px solid rgba(255,255,255,0.15)',
                flexShrink: 0,
                transition: 'width 0.15s ease, height 0.15s ease'
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>SETHU</span>
                <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fbbf24', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', padding: '1px 5px', borderRadius: '3px' }}>
                  Admin
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Dharmic Business Network
              </div>
            </div>
          </div>
          <button
            type="button"
            className="menu-btn close-btn"
            aria-label="Close navigation menu"
            onClick={()=>setDrawer(false)}
          >
            <LucideIcon name="x" size={20}/>
          </button>
        </div>
        {/* Scrollable Navigation Area */}
        <nav className="sidebar-nav" aria-label="Primary">
          {groups.map((g: any) => (
            <div key={g.group}>
              <div className="nav-group" aria-hidden="true">{g.group}</div>
              {g.items.map((i: any) => (
                <NavLink
                  key={i.id}
                  className={({isActive})=>`nav-link${isActive?' active':''}`}
                  to={i.path}
                  onClick={()=>setDrawer(false)}
                >
                  <span className="nav-icon"><LucideIcon name={routeIcons[i.id]??'circle-help'} size={17}/></span>
                  <span className="nav-label">{i.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Pinned Sign Out Button in Sidebar Footer */}
        <div className="sidebar-footer">
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
              e.currentTarget.style.color = '#fca5a5';
            }}
          >
            <LucideIcon name="log-out" size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
      <main id="main" className="main" tabIndex={-1}>
        {/* Top Header Bar for Desktop */}
        <div className="desktop-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '9999px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              Platform Administration Console
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={branding.headerLogo || "/brand/dbn-logo.jpeg"} alt="DBN" style={{ height: `${Math.max(32, Math.min(68, branding.headerLogoSize || 42))}px`, width: 'auto', maxHeight: '68px', objectFit: 'contain', borderRadius: '6px', background: '#fff', padding: '2px', border: '1px solid #e2e8f0', transition: 'height 0.15s ease' }} />
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#b91c1c',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.borderColor = '#fca5a5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              title="Sign out of Platform Administration"
            >
              <LucideIcon name="log-out" size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
        <div className="shell-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
