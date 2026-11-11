import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, LogIn } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/common/Input';
import { boundaryErrorMessage, previewAccounts, previewPassword, requestOtp } from '../authService';
import { isSafeLocalReturnPath } from '../authPolicy';
import { signIn } from '../authSlice';
import { workspaceHome } from '@/config/navigation';
import { canAccessPath } from '@/utils/permissions';
import { selectRoleAssignments } from '@/features/platform-runtime/authorisationRuntime';
import { env } from '@/config/env';

export function LoginForm({ returnTo = '' }: { returnTo?: string }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const roleAssignments = useAppSelector(selectRoleAssignments);
  const [searchParams] = useSearchParams();
  const previewMode = searchParams.get('preview') !== '0';
  const showPreviewCredentials = env.previewAuthEnabled && previewMode;
  const status = useAppSelector((state) => state.auth.status);
  const error = useAppSelector((state) => state.auth.error);
  const [identifier, setIdentifier] = useState('member@sethu.local');
  const [password, setPassword] = useState(previewPassword());
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [notice, setNotice] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const safeReturn = isSafeLocalReturnPath(returnTo) ? returnTo : '';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    if (!identifier.trim()) return;

    if (mode === 'otp') {
      setOtpBusy(true);
      try {
        const challenge = await requestOtp(identifier.trim(), 'login');
        const query = new URLSearchParams({ challenge: challenge.id, destination: challenge.destination });
        if (safeReturn) query.set('returnTo', safeReturn);
        if (showPreviewCredentials) query.set('preview', '1');
        navigate(`/login/otp?${query.toString()}`);
        return;
      } catch (errorValue) {
        setNotice(boundaryErrorMessage(errorValue, 'A verification code could not be requested. Try again or contact support.'));
        return;
      } finally {
        setOtpBusy(false);
      }
    }

    if (!password) return;
    const result = await dispatch(signIn({ identifier: identifier.trim(), password }));
    if (signIn.fulfilled.match(result)) {
      const account = result.payload;
      if (account.status && account.status !== 'active') {
        setNotice('This account is not currently eligible to sign in. Contact an authorised administrator.');
        return;
      }
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
      const targetAllowed = safeReturn && safeReturn !== '/unauthorized' && safeReturn !== '/login' && safeReturn.startsWith('/app') && canAccessPath(account, safeReturn, roleAssignments);
      if (targetAllowed) {
        navigate(safeReturn, { replace: true });
        return;
      }
      navigate('/app/home', { replace: true });
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="grid gap-4">
        <Input
          label="Email or account ID"
          type="text"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          autoComplete="username"
          required
          placeholder="name@example.com"
        />
        {mode === 'password' && (
          <div className="relative">
            <Input
              label="Password"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-8 grid size-11 place-items-center rounded-lg hover:bg-slate-100"
              onClick={() => setShow((value) => !value)}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        )}
        {error && mode === 'password' && <p className="text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {notice && <p className="text-sm font-semibold text-amber-800" role="status">{notice}</p>}
        <Button type="submit" disabled={status === 'loading' || otpBusy || !identifier.trim() || (mode === 'password' && !password)}>
          {mode === 'otp' ? <KeyRound className="size-4" /> : <LogIn className="size-4" />}
          {status === 'loading' ? 'Signing in…' : otpBusy ? 'Requesting code…' : mode === 'otp' ? 'Send one-time code' : 'Sign in'}
        </Button>

        {showPreviewCredentials && (
          <details className="group rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-sm shadow-xs">
            <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 font-bold text-slate-900 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Demo & QA Test Credentials</span>
              </div>
              <span className="rounded-md border border-sky-300 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-sky-800 shadow-xs">Password: {previewPassword()}</span>
            </summary>
            <p className="mt-2 text-xs leading-5 text-slate-600 font-medium">
              Click any demo role below to autofill and test the application with one click:
            </p>
            <div className="mt-2.5 grid max-h-56 grid-cols-1 gap-1.5 overflow-auto pr-1 sm:grid-cols-2">
              {previewAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  className="min-h-11 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-sky-400 hover:bg-sky-50/50 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  onClick={() => {
                    setIdentifier(account.email);
                    setPassword(previewPassword());
                    setMode('password');
                  }}
                >
                  <strong className="block text-sm font-bold text-slate-900">{account.name}</strong>
                  <span className="block text-sm font-semibold text-slate-600">{account.id} · {account.role}</span>
                  <span className="block truncate text-xs font-semibold text-sky-700">{account.baseChapter}</span>
                  <span className="block truncate text-sm text-slate-500">{account.email}</span>
                </button>
              ))}
            </div>
          </details>
        )}
      </form>
    </div>
  );
}
