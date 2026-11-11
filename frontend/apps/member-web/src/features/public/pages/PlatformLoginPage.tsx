import { useState, type FormEvent } from 'react';
import { ShieldAlert, Lock, KeyRound, Server, ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { authenticateAccount, selectWorkspace } from '@/features/auth/authSlice';
import { loginPlatform } from '@/features/auth/authService';
import { useSystemBranding } from '@/services/brandingService';

export default function PlatformLoginPage() {
  const branding = useSystemBranding();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get('returnTo') || '/platform-admin/dashboard';
  const accessDenied = params.get('denied') === '1';

  const [identifier, setIdentifier] = useState('platformadmin@dbn.network');
  const [password, setPassword] = useState('Platform@123456');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('Please provide operator identifier and authorization key.');
      return;
    }

    setBusy(true);
    try {
      const account = await loginPlatform(identifier.trim(), password);
      dispatch(authenticateAccount(account));
      dispatch(selectWorkspace('Platform Admin'));
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      setError(err?.detail || err?.title || 'Unable to authenticate operator. Check credentials.');
    } finally {
      setBusy(false);
    }
  }

  function handleDemoCredentials(type: 'admin' | 'security') {
    if (type === 'admin') {
      setIdentifier('platform.admin@sethu.local');
      setPassword('Platform@123456');
    } else {
      setIdentifier('sec-lead@sethu.local');
      setPassword('Platform@123456');
    }
    setError('');
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Top Banner / Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 py-2 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={branding.sidebarLogo || "/brand/sethu-logo.jpeg"}
              alt="DBN SETHU"
              style={{
                height: `${branding.sethuSize ? Math.max(26, Math.min(38, Math.round(branding.sethuSize * 0.9))) : 32}px`,
                width: 'auto',
                transition: 'height 0.15s ease'
              }}
              className="rounded-md bg-white p-0.5 object-contain"
            />
            <img
              src={branding.headerLogo || "/brand/dbn-logo.jpeg"}
              alt="DBN Logo"
              style={{
                height: `${branding.headerLogoSize ? Math.max(26, Math.min(42, Math.round(branding.headerLogoSize * 0.85))) : (branding.sethuSize ? Math.max(26, Math.min(38, Math.round(branding.sethuSize * 0.9))) : 32)}px`,
                width: 'auto',
                transition: 'height 0.15s ease'
              }}
              className="rounded-md bg-white p-0.5 object-contain"
            />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Dharmic Business Network</div>
              <div className="text-sm font-extrabold text-white tracking-tight leading-none">Platform Administration Hub</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Operational Gateway v7.1
            </span>
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-400 hover:text-sky-300 transition-colors px-2.5 py-1 rounded-md border border-slate-800 hover:border-slate-700 bg-slate-900/80"
            >
              Member Portal &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-4 my-auto overflow-hidden">
        <div className="w-full max-w-4xl grid lg:grid-cols-12 gap-5 items-center">
          
          {/* Left Security Context Panel */}
          <div className="lg:col-span-5 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/20">
              <ShieldAlert className="size-3 text-rose-400" />
              Restricted Operations Area
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Platform Operator Sign In
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                You are entering the central SETHU management and governance plane. Regulates multi-tenant identities, RBAC, visual branding, and system audits.
              </p>
            </div>

            {accessDenied && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <div className="font-bold">Access Escalation Required</div>
                  <div className="text-[11px] text-amber-400/90 mt-0.5">
                    Your current session lacks the Platform Admin privilege required for this resource. Sign in with an authorised operator account below.
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs space-y-0.5">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-sky-400" />
                  Canonical Role Enforced
                </div>
                <div className="text-[11px] text-slate-400">All actions are recorded in immutable audit logs with cryptographic attribution.</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs space-y-0.5">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <Server className="size-3.5 text-emerald-400" />
                  Multi-Tenant Separation
                </div>
                <div className="text-[11px] text-slate-400">Cross-tenant boundaries, Parivar registries, and core data quality controls.</div>
              </div>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Console Authentication</div>
                  <h2 className="text-lg font-black text-white mt-0.5">Operator Credentials</h2>
                </div>
                <div className="size-8 rounded-lg bg-sky-500/10 border border-sky-500/20 grid place-items-center text-sky-400">
                  <Lock className="size-4" />
                </div>
              </div>

              {error && (
                <div className="mt-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="size-3.5 text-rose-400 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-3 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Operator ID / Email
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="platform.admin@sethu.local"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors text-xs sm:text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Authorization Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter administrator password"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors text-xs sm:text-sm font-medium pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                    <span>MFA / Security Token (Optional)</span>
                    <span className="text-[9.5px] text-slate-500 font-normal">If enrolled</span>
                  </label>
                  <input
                    type="password"
                    maxLength={8}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="6-digit authenticator code"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors text-xs font-mono tracking-widest"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Verifying Operator Context…
                      </span>
                    ) : (
                      <>
                        <span>Enter Platform Administration</span>
                        <ArrowRight className="size-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Developer / Demo Quick-fill Controls */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Evaluation Quick Credentials
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDemoCredentials('admin')}
                    className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-[11px] font-medium text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="size-3 text-sky-400" />
                    Load Platform Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoCredentials('security')}
                    className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-[11px] font-medium text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="size-3 text-emerald-400" />
                    Load Security Lead
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-2 text-center text-[10px] text-slate-500">
        <p>&copy; 2026 Dharmic Business Network (DBN) — SETHU Platform Architecture. Restricted to authorized administrators.</p>
      </footer>
    </div>
  );
}
