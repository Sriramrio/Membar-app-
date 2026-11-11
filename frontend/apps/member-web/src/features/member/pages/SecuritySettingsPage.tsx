import { useState } from 'react';
import { KeyRound, Laptop, LogOut, ShieldCheck, Smartphone, Eye, EyeOff, X, CheckCircle2, Lock, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHead, StatusPill, Tip } from '@/features/network/components/NetworkUI';
import { boundaryErrorMessage, changePassword } from '@/features/auth/authService';
import { revokeOtherSessions, revokeSession, selectDeviceSessions } from '@/features/platform-runtime/identitySecurityRuntime';

export default function SecuritySettingsPage() {
  const dispatch = useAppDispatch();
  const account = useAppSelector(s => s.auth.account)!;
  const sessions = useAppSelector(s => selectDeviceSessions(s).filter(x => x.accountId === account.id));

  // Password Modal & Form States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const isPasswordValid = next.length >= 12 && /[A-Z]/.test(next) && /[a-z]/.test(next) && /\d/.test(next) && /[^A-Za-z0-9]/.test(next);
  const isMatch = next.length > 0 && next === confirm;

  const handleOpenModal = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setMessage('');
    setIsSuccess(false);
    setShowPasswordModal(true);
  };

  const handleCloseModal = () => {
    if (busy) return;
    setShowPasswordModal(false);
    setMessage('');
    setIsSuccess(false);
  };

  const handleChangePassword = async () => {
    if (next !== confirm) {
      setMessage('New password confirmation does not match.');
      setIsSuccess(false);
      return;
    }
    if (!isPasswordValid) {
      setMessage('Password must be at least 12 characters with upper case, lower case, number and symbol.');
      setIsSuccess(false);
      return;
    }
    setBusy(true);
    setMessage('');
    setIsSuccess(false);
    try {
      const result = await changePassword(account.id, current, next, account.email);
      setMessage(result.message || 'Password updated successfully in database.');
      if (result.ok) {
        setIsSuccess(true);
        setCurrent('');
        setNext('');
        setConfirm('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setIsSuccess(false);
          setMessage('');
        }, 1500);
      } else {
        setIsSuccess(false);
      }
    } catch (err) {
      setIsSuccess(false);
      setMessage(boundaryErrorMessage(err, 'The password could not be updated in database. Try again or check credentials.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHead
        title="Security & Sessions"
        description="Manage password, verification requirements and active sessions."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Password Management Card */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <Lock className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Account Password</h2>
                <p className="text-xs text-slate-500">Secure credentials saved directly to PostgreSQL database</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-[var(--maroon-900,#581c1c)] to-[var(--navy-950,#0f172a)] text-white hover:brightness-110 shadow-xs text-xs font-bold"
            >
              <KeyRound className="size-3.5 mr-1 text-amber-400" />
              Change Password
            </Button>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Account Identity:</span>
              <span className="font-bold text-slate-800">{account.name} ({account.email})</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Password Policy:</span>
              <span className="font-bold text-emerald-700">12+ characters, uppercase, number & symbol required</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Database Storage:</span>
              <span className="inline-flex items-center gap-1 font-bold text-sky-800">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                PostgreSQL user_identities
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Need to update your login password?</span>
            <button
              type="button"
              onClick={handleOpenModal}
              className="text-xs font-bold text-[var(--maroon-900,#581c1c)] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Open Password Editor →
            </button>
          </div>
        </Card>

        {/* Verification Policy Card */}
        <Card>
          <h2 className="text-lg font-black">Verification policy</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <strong>Multi-factor verification</strong>
                <StatusPill tone={account.mfaEnabled ? 'good' : 'warn'}>
                  {account.mfaEnabled ? 'Required' : 'Not required for this preview identity'}
                </StatusPill>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This value comes from the authenticated account/identity policy. Members cannot weaken administrator MFA requirements from this screen.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <strong>One-time-code sign in</strong>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                OTP availability and challenge rules are controlled by the authentication service. There is no client-only switch that pretends to change authentication policy.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Tip>Production MFA and OTP delivery must be enforced by the authoritative identity provider and security policy.</Tip>
          </div>
        </Card>
      </div>

      {/* Device Sessions Card */}
      <Card className="mt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black">Device sessions</h2>
            <p className="mt-1 text-sm text-slate-500">Review recent account sessions and revoke any device you no longer use.</p>
          </div>
          <Button variant="secondary" onClick={() => dispatch(revokeOtherSessions({ accountId: account.id, actor: account.name }))}>
            <LogOut className="size-4" />Sign out other sessions
          </Button>
        </div>
        <div className="mt-5 grid gap-3">
          {sessions.map(s => (
            <div key={s.id} className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${s.revokedAt ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'}`}>
              <div className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600">
                {/android|phone/i.test(s.device) ? <Smartphone className="size-5" /> : <Laptop className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong>{s.device}</strong>
                  {s.current && <StatusPill tone="good">Current</StatusPill>}
                  {s.trusted && !s.revokedAt && <StatusPill tone="info">Trusted</StatusPill>}
                  {s.revokedAt && <StatusPill>Revoked</StatusPill>}
                </div>
                <div className="mt-1 text-sm text-slate-500">{s.browser} · last access {new Date(s.lastAccess).toLocaleString('en-IN')}</div>
              </div>
              {!s.current && !s.revokedAt && (
                <Button variant="secondary" onClick={() => dispatch(revokeSession({ sessionId: s.id, accountId: account.id, actor: account.name }))}>
                  Sign out
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        <ShieldCheck className="size-4" />
        Session revocations are recorded as auditable events in the canonical V6 identity/security state and runtime.
      </div>

      {/* POP-UP CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header with Sethu Maroon / Deep Navy brand color & Close Button */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[var(--maroon-900,#581c1c)] via-[var(--navy-950,#0f172a)] to-[#7f1d1d] p-5 text-white border-b-2 border-amber-500/50">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">Change Password</h3>
                  <p className="text-xs text-amber-200/90">Update login password in database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={busy}
                className="grid size-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                title="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {isSuccess && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                  <span>{message || 'Password updated successfully in database!'}</span>
                </div>
              )}
              {!isSuccess && message && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-800 flex items-center gap-2">
                  <AlertCircle className="size-4.5 text-red-600 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {/* Current Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 pr-10 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                    value={current}
                    onChange={e => setCurrent(e.target.value)}
                    placeholder="Enter your current password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNext ? 'text' : 'password'}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 pr-10 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                    value={next}
                    onChange={e => setNext(e.target.value)}
                    placeholder="At least 12 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNext(!showNext)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNext ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
                  <span className={`px-1.5 py-0.5 rounded ${next.length >= 12 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    12+ chars
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${/[A-Z]/.test(next) ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    Uppercase
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${/[a-z]/.test(next) ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    Lowercase
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${/\d/.test(next) ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    Number
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${/[^A-Za-z0-9]/.test(next) ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    Symbol
                  </span>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={`h-10 w-full rounded-xl border bg-white px-3 pr-10 text-xs text-slate-800 focus:outline-none ${confirm && !isMatch ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-amber-500'}`}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {confirm && !isMatch && (
                  <span className="text-[11px] font-semibold text-red-600 mt-1 block">Passwords do not match</span>
                )}
                {isMatch && (
                  <span className="text-[11px] font-semibold text-emerald-600 mt-1 block flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Passwords match
                  </span>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCloseModal}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy || !current || !isPasswordValid || !isMatch}
                  onClick={handleChangePassword}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--maroon-900,#581c1c)] to-[var(--navy-950,#0f172a)] px-5 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
                >
                  <KeyRound className="size-3.5 text-amber-400" />
                  {busy ? 'Saving in Database…' : 'Save Password in DB'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
