import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemBranding } from '@/services/brandingService';
import { API_BASE } from '@/services/api';

export function PlatformAdminLoginPage() {
  const navigate = useNavigate();
  const branding = useSystemBranding();
  const [username, setUsername] = useState('platformadmin@dbn.network');
  const [password, setPassword] = useState('Platform@123456');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please provide operator credentials.');
      return;
    }

    setBusy(true);
    try {
      const candidateUrls: string[] = [
        '/api/auth/login',
        'http://localhost:62936/api/auth/login',
        'https://localhost:62935/api/auth/login'
      ];
      const targetBase = API_BASE ? API_BASE.replace(/\/+$/, '') : '';
      if (targetBase) {
        const fullUrl = `${targetBase}/api/auth/login`;
        if (!candidateUrls.includes(fullUrl)) {
          candidateUrls.push(fullUrl);
        }
      }

      let res: Response | null = null;
      let lastError = '';

      for (const loginUrl of candidateUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const r = await fetch(loginUrl, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: username.trim(), password }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (r.ok || r.status === 400 || r.status === 401 || r.status === 403) {
            res = r;
            break;
          } else {
            lastError = `Server returned status ${r.status}`;
          }
        } catch (err: any) {
          lastError = err?.message || 'Network error';
        }
      }

      if (!res) {
        setError(lastError || 'Unable to connect to authentication server. Please check backend connection.');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || data.message || 'Invalid identifier or password.');
        return;
      }

      const resData = await res.json().catch(() => ({}));
      const isTrustee = username.trim().toLowerCase().includes('trustee');
      sessionStorage.setItem('sethu:platform_auth', 'true');
      sessionStorage.setItem('sethu:operator', username.trim());
      sessionStorage.setItem('sethu:role', isTrustee ? 'Trustee' : 'PlatformAdmin');
      if (resData?.token) {
        sessionStorage.setItem('sethu:token', resData.token);
      }
      localStorage.setItem('sethu:platform_auth', 'true');
      localStorage.setItem('sethu:operator', username.trim());
      localStorage.setItem('sethu:role', isTrustee ? 'Trustee' : 'PlatformAdmin');
      navigate(isTrustee ? '/platform-admin/organisation' : '/platform-admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to authentication server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: '#071326',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 16px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%'
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box', margin: 'auto' }}>
        
        {/* Dual Brand Logos (SETHU + DBN) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              padding: '4px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <img
              src={branding.sidebarLogo || "/brand/sethu-logo.jpeg"}
              alt="Org Logo"
              style={{
                height: `${branding.sethuSize ? Math.max(28, Math.min(46, Math.round(branding.sethuSize * 0.9))) : 36}px`,
                width: 'auto',
                maxWidth: '100px',
                objectFit: 'contain',
                borderRadius: '6px',
                display: 'block',
                transition: 'height 0.15s ease'
              }}
            />
          </div>
          <div
            style={{
              padding: '4px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <img
              src={branding.headerLogo || "/brand/dbn-logo.jpeg"}
              alt="Header Logo"
              style={{
                height: `${branding.headerLogoSize ? Math.max(28, Math.min(50, Math.round(branding.headerLogoSize * 0.85))) : 36}px`,
                width: 'auto',
                maxWidth: '110px',
                objectFit: 'contain',
                borderRadius: '6px',
                display: 'block',
                transition: 'height 0.15s ease'
              }}
            />
          </div>
        </div>

        {/* Pill Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(30, 58, 138, 0.4)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#93c5fd',
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '8px',
            textAlign: 'center',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <span>SETHU ENTERPRISE ARCHITECTURE</span>
        </div>

        {/* Main Title */}
        <h1
          style={{
            margin: '0 0 10px 0',
            color: '#ffffff',
            fontSize: '19px',
            fontWeight: 900,
            textAlign: 'center',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}
        >
          Platform Administration Sign-In
        </h1>

        {/* White Card */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '16px 20px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
            boxSizing: 'border-box'
          }}
        >
          {error && (
            <div
              style={{
                marginBottom: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#b91c1c',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Username / Operator ID */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#334155',
                  marginBottom: '4px'
                }}
              >
                EMAIL OR OPERATOR ID
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="platformadmin@dbn.network"
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0f172a',
                    backgroundColor: '#eff6ff',
                    border: '1.5px solid #3b82f6',
                    borderRadius: '10px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#334155',
                  marginBottom: '4px'
                }}
              >
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  style={{
                    width: '100%',
                    padding: '8px 36px 8px 36px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0f172a',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={(e) => (e.target.style.borderColor = '#bfdbfe')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Info Message Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z" />
              </svg>
              <span style={{ fontSize: '11px', color: '#475569', lineHeight: 1.35 }}>
                Managing platform configuration, visual branding & multi-tenant security.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={busy}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '10px',
                backgroundColor: '#2563eb',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.15s ease',
                marginTop: '2px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
            >
              {busy ? (
                <span>Authenticating Operator…</span>
              ) : (
                <>
                  <span>Sign In to Platform Admin</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Text */}
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            Dharmic Business Network Trust · High Integrity Governance Engine
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
            Authorized Scope: Enterprise Platform Control Plane · Multi-Tenant Architecture
          </div>
        </div>

      </div>
    </div>
  );
}
