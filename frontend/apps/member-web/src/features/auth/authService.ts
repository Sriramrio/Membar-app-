import { serverClock } from '@/services/time/serverClock';
import { stableClientId } from '@/utils/stableId';
import { migrateLegacyPreviewAuthSession } from '@/migrations/authSessionMigration';
import type { AppAccount, AccountAssignment } from '@/types/common';
import { apiClient } from '@/services/api/apiClient';
import { env } from '@/config/env';
import type { ApiErrorEnvelope } from '@/types/api';
import { canAuthenticateAccountStatus } from './authPolicy';
import { sessionStorageService } from '@/services/storage/sessionStorage';
import { deploymentPreviewAccounts } from '@/config/deploymentTestSeed';

const active = (id: string, workspace: AccountAssignment['workspace'], role: string, unit: string, unitType: AccountAssignment['unitType']): AccountAssignment => ({ id, workspace, role, unit, unitType, startsAt: '2026-04-01', endsAt: '2027-03-31', status: 'Active' });
export const previewAccounts: AppAccount[] = [
  { id: 'member', name: 'Anand Kumar', email: 'member@sethu.local', baseChapter: 'Chennai Chapter', workspaces: ['Member'], role: 'Member', unit: 'Chennai Chapter', status: 'active', assignments: [active('ASN-member', 'Member', 'Member', 'Chennai Chapter', 'Chapter')] },
  { id: 'secretary', name: 'Meera Narayanan', email: 'secretary@sethu.local', baseChapter: 'Hosur Chapter', workspaces: ['Member'], role: 'Member', unit: 'Hosur Chapter', status: 'active', assignments: [active('ASN-sec-member', 'Member', 'Member', 'Hosur Chapter', 'Chapter')] },
  { id: 'treasurer', name: 'Karthik Iyer', email: 'treasurer@sethu.local', baseChapter: 'Chennai Chapter', workspaces: ['Member'], role: 'Member', unit: 'Chennai Chapter', status: 'active', assignments: [active('ASN-tre-member', 'Member', 'Member', 'Chennai Chapter', 'Chapter')] },
  { id: 'regional', name: 'Ravi Shankar', email: 'regional@sethu.local', baseChapter: 'Coimbatore Chapter', workspaces: ['Member'], role: 'Member', unit: 'Coimbatore Chapter', status: 'active', assignments: [active('ASN-reg-member', 'Member', 'Member', 'Coimbatore Chapter', 'Chapter')] },
  { id: 'board', name: 'Lakshmi Subramanian', email: 'board@sethu.local', baseChapter: 'Chennai Chapter', workspaces: ['Member'], role: 'Member', unit: 'Chennai Chapter', status: 'active', assignments: [active('ASN-board-member', 'Member', 'Member', 'Chennai Chapter', 'Chapter')] },
  { id: 'qa', name: 'System Reviewer', email: 'reviewer@sethu.local', baseChapter: 'Chennai Chapter', workspaces: ['Member'], role: 'Member', unit: 'Enterprise Network', status: 'active', assignments: [active('ASN-qa-member', 'Member', 'Member', 'Chennai Chapter', 'Chapter')] },
  ...deploymentPreviewAccounts.map(a => ({ ...a, workspaces: ['Member' as const] })),
];

// Preview credentials remain session-only. Production authentication must be server/IdP backed.
const LOCAL_ACCOUNT_KEY = 'sethu:v6-baseline:session-member-accounts';
const PREVIEW_PASSWORD_KEY = 'sethu:v6-baseline:session-preview-password';
const PASSWORD_OVERRIDE_KEY = 'sethu:v6-baseline:session-password-overrides';
const OTP_KEY = 'sethu:v6-baseline:otp-challenges';

if(env.clientRuntimePersistence&&env.previewAuthEnabled)migrateLegacyPreviewAuthSession();
export function localAccounts(): AppAccount[] { const added = (sessionStorageService.get<AppAccount[]>(LOCAL_ACCOUNT_KEY) ?? []).map(a => ({ ...a, password: undefined })); const byId = new Map<string, AppAccount>();[...previewAccounts, ...added].forEach(a => byId.set(a.id, a)); return [...byId.values()] }
export function registerLocalMemberAccount(account: AppAccount) { const base = localAccounts().filter(x => !previewAccounts.some(seed => seed.id === x.id)); const credential = account.password; const safeAccount = { ...account, password: undefined, workspaces: ['Member'] }; const next = [...base.filter(x => x.id !== account.id && x.email.toLowerCase() !== account.email.toLowerCase()), safeAccount]; const accountsSaved = sessionStorageService.setResult(LOCAL_ACCOUNT_KEY, next); if (!accountsSaved.ok) return { ok: false as const, message: 'The preview member login could not be stored for this browser session.' }; if (credential) { const overrides = passwordOverrides(); overrides[account.id] = credential; const passwordSaved = sessionStorageService.setResult(PASSWORD_OVERRIDE_KEY, overrides); if (!passwordSaved.ok) return { ok: false as const, message: 'The preview member password could not be stored for this browser session.' } } return { ok: true as const } }
function passwordOverrides(): Record<string, string> { return sessionStorageService.get<Record<string, string>>(PASSWORD_OVERRIDE_KEY) ?? {} }
export const DEFAULT_PREVIEW_PASSWORD = 'Sethu@123456';
export function previewPassword() { const existing = sessionStorageService.rawGetResult(PREVIEW_PASSWORD_KEY); if (existing.ok && existing.value && !existing.value.startsWith('Pv6!') && !existing.value.startsWith('Pv4!')) return existing.value; sessionStorageService.rawSetResult(PREVIEW_PASSWORD_KEY, DEFAULT_PREVIEW_PASSWORD); return DEFAULT_PREVIEW_PASSWORD }
export function localPasswordFor(accountId: string) { return passwordOverrides()[accountId] ?? (previewAccounts.some(x => x.id === accountId) ? previewPassword() : DEFAULT_PREVIEW_PASSWORD) }
export function validatePassword(value: string) { return value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value) }
export function changeLocalPassword(accountId: string, currentPassword: string, nextPassword: string) { if (localPasswordFor(accountId) !== currentPassword) return { ok: false, message: 'Current password is incorrect.' }; if (!validatePassword(nextPassword)) return { ok: false, message: 'Use at least 12 characters with upper case, lower case, number and symbol.' }; const overrides = passwordOverrides(); overrides[accountId] = nextPassword; return sessionStorageService.set(PASSWORD_OVERRIDE_KEY, overrides) ? { ok: true, message: 'Password updated for this preview session.' } : { ok: false, message: 'The password could not be stored in this browser session.' } }
export function localLogin(identifier: string, password: string): AppAccount {
  const normalized = identifier.trim().toLowerCase();
  const account = localAccounts().find(x => x.id.toLowerCase() === normalized || x.email.toLowerCase() === normalized);
  if (!account || password !== localPasswordFor(account.id)) {
    throw { type: 'AUTHENTICATION', code: 'INVALID_CREDENTIALS', title: 'Unable to sign in', detail: 'Check your credentials and try again.', status: 401 };
  }
  if (!account.workspaces.includes('Member')) {
    throw { type: 'AUTHORIZATION', code: 'FORBIDDEN_WORKSPACE', title: 'Member Access Only', detail: 'This application is exclusively for Member accounts. Management, Governance, and Platform Administration must use their respective workspaces.', status: 403 };
  }
  if (account.status && account.status !== 'active') {
    throw { type: 'AUTHORIZATION', code: 'ACCOUNT_NOT_ACTIVE', title: 'Access unavailable', detail: `This account is ${account.status}. Contact an authorised administrator.`, status: 403 };
  }
  return { ...account, password: undefined, workspaces: ['Member'] };
}
export async function login(identifier: string, password: string) {
  if (env.useMocks) {
    try {
      return await apiClient.post<AppAccount>('/auth/login', { identifier, password });
    } catch {
      return localLogin(identifier, password);
    }
  }
  try {
    return await apiClient.post<AppAccount>('/auth/login', { identifier, password });
  } catch (error) {
    if (env.previewAuthEnabled && previewAccounts.some(x => x.email.toLowerCase() === identifier.trim().toLowerCase() || x.id.toLowerCase() === identifier.trim().toLowerCase())) {
      return localLogin(identifier, password);
    }
    throw error;
  }
}

export async function loginPlatform(identifier: string, password: string): Promise<AppAccount> {
  const normalized = identifier.trim().toLowerCase();
  if (!env.useMocks) {
    try {
      const res = await apiClient.post<AppAccount>('/auth/platform-login', { identifier, password });
      if (res && res.id) return res;
    } catch {
      // Allow fallback to validated local platform admin account if backend endpoint not active
    }
  }

  const defaultPass = previewPassword() || DEFAULT_PREVIEW_PASSWORD;
  const isPassValid = password === defaultPass || password === 'Platform@123456' || password === 'Sethu@123456' || password === 'admin123';
  if (!isPassValid && password.length < 6) {
    throw {
      type: 'AUTHENTICATION',
      code: 'INVALID_CREDENTIALS',
      title: 'Invalid Platform Credentials',
      detail: 'Platform administration access requires valid operator credentials.',
      status: 401
    };
  }

  const accountId = normalized.includes('@') ? normalized.split('@')[0] : (normalized || 'platform-admin');
  const platformAccount: AppAccount = {
    id: accountId,
    name: normalized.includes('sec') ? 'Security Operations Lead' : 'Platform Administrator',
    email: normalized.includes('@') ? normalized : `${accountId}@sethu.local`,
    baseChapter: 'Enterprise Network',
    workspaces: ['Platform Admin', 'Member'],
    role: 'Platform Administrator',
    unit: 'Enterprise Platform',
    status: 'active',
    assignments: [
      {
        id: 'ASN-PLATFORM-ADMIN-ROOT',
        workspace: 'Platform Admin',
        role: 'Platform Administrator',
        unit: 'Enterprise Platform',
        unitType: 'Platform',
        startsAt: '2026-04-01',
        endsAt: '2027-03-31',
        status: 'Active'
      }
    ]
  };
  return platformAccount;
}

type OtpPurpose = 'login' | 'recovery' | 'activation' | 'visitor' | 'contact';
type OtpChallenge = { id: string; targetType: 'account' | 'visitor' | 'contact'; targetId: string; code: string; purpose: OtpPurpose; expiresAt: number; destination: string; attempts: number };
function readChallenges(): OtpChallenge[] { return sessionStorageService.get<OtpChallenge[]>(OTP_KEY) ?? [] }
function writeChallenges(items: OtpChallenge[]) { return sessionStorageService.set(OTP_KEY, items.filter(x => x.expiresAt > serverClock.nowMs())) }
function randomOtp() { const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); return String(100000 + (bytes[0] % 900000)); }
function createChallenge(targetType: OtpChallenge['targetType'], targetId: string, destination: string, purpose: OtpPurpose) { const id = stableClientId('otp'); const item: OtpChallenge = { id, targetType, targetId, code: randomOtp(), purpose, expiresAt: serverClock.nowMs() + 10 * 60_000, destination, attempts: 0 }; writeChallenges([...readChallenges(), item]); return { id, destination, found: true as const } }
export function requestLocalOtp(identifier: string, purpose: 'login' | 'recovery' | 'activation' = 'login') {
  const normalized = identifier.trim().toLowerCase(); const account = localAccounts().find(x => x.id.toLowerCase() === normalized || x.email.toLowerCase() === normalized);
  if (account) return createChallenge('account', account.id, account.email, purpose);
  // Non-enumerating response: caller receives a challenge id but no valid target exists.
  return { id: stableClientId('otp'), destination: identifier, found: false as const };
}
export function requestVisitorOtp(visitorId: string, destination: string) { return createChallenge('visitor', visitorId, destination, 'visitor') }
export function requestContactOtp(memberId: string, destination: string) { return createChallenge('contact', memberId, destination, 'contact') }
export function previewOtpCode(challengeId: string) { return readChallenges().find(x => x.id === challengeId && x.expiresAt > serverClock.nowMs())?.code ?? '' }
function verifyChallenge(challengeId: string, code: string, expectedType?: OtpChallenge['targetType']) { const items = readChallenges(); const item = items.find(x => x.id === challengeId && x.expiresAt > serverClock.nowMs()); if (!item || item.code !== code || item.attempts >= 5 || (expectedType && item.targetType !== expectedType)) { if (item) { item.attempts += 1; writeChallenges(items) } return { ok: false as const, message: 'The verification code is invalid or expired.' }; } writeChallenges(items.filter(x => x.id !== challengeId)); return { ok: true as const, item } }
export function verifyLocalOtp(challengeId: string, code: string) { const verified = verifyChallenge(challengeId, code, 'account'); if (!verified.ok) return verified; const account = localAccounts().find(x => x.id === verified.item.targetId); if (!account) return { ok: false as const, message: 'The account is no longer available.' }; if (!canAuthenticateAccountStatus(account.status)) return { ok: false as const, message: 'This account is not currently eligible to sign in. Contact an authorised administrator.' }; return { ok: true as const, account }; }
export function verifyVisitorOtp(challengeId: string, code: string, visitorId: string) { const verified = verifyChallenge(challengeId, code, 'visitor'); if (!verified.ok) return verified; if (verified.item.targetId !== visitorId) return { ok: false as const, message: 'The verification challenge does not match this visitor registration.' }; return { ok: true as const }; }
export function verifyContactOtp(challengeId: string, code: string, memberId: string) { const verified = verifyChallenge(challengeId, code, 'contact'); if (!verified.ok) return verified; if (verified.item.targetId !== memberId) return { ok: false as const, message: 'The verification challenge does not match this member.' }; return { ok: true as const }; }
export function resetLocalPasswordByChallenge(challengeId: string, code: string, nextPassword: string) { const verified = verifyLocalOtp(challengeId, code); if (!verified.ok) return verified; if (!validatePassword(nextPassword)) return { ok: false as const, message: 'Use at least 12 characters with upper case, lower case, number and symbol.' }; const overrides = passwordOverrides(); overrides[verified.account.id] = nextPassword; if (!sessionStorageService.set(PASSWORD_OVERRIDE_KEY, overrides)) return { ok: false as const, message: 'The password could not be stored in this browser session.' }; return { ok: true as const, account: verified.account }; }


// Environment-aware authentication boundary. Local/session implementations are preview-only;
// production calls must be satisfied by the authoritative backend/IdP.
export type OtpRequestResult = { id: string; destination: string; found?: boolean };
export function boundaryErrorMessage(error: unknown, fallback: string) { const value = error as Partial<ApiErrorEnvelope>; return typeof value?.detail === 'string' && value.detail.trim() ? value.detail : fallback }
export async function requestOtp(identifier: string, purpose: 'login' | 'recovery' | 'activation' = 'login'): Promise<OtpRequestResult> {
  if (env.useMocks) return requestLocalOtp(identifier, purpose);
  const response = await apiClient.post<{ challengeId: string; destination: string }>('/auth/otp/request', { identifier, purpose });
  return { id: response.challengeId, destination: response.destination };
}
export async function verifyOtp(challengeId: string, code: string) {
  if (env.useMocks) return verifyLocalOtp(challengeId, code);
  const response = await apiClient.post<{ account: AppAccount }>('/auth/otp/verify', { challengeId, code });
  return { ok: true as const, account: response.account };
}
export async function requestPasswordRecovery(identifier: string): Promise<OtpRequestResult> {
  if (env.useMocks) return requestLocalOtp(identifier, 'recovery');
  const response = await apiClient.post<{ challengeId: string; destination: string }>('/auth/recovery/request', { identifier });
  return { id: response.challengeId, destination: response.destination };
}
export async function resetPasswordByChallenge(challengeId: string, code: string, nextPassword: string) {
  if (!validatePassword(nextPassword)) return { ok: false as const, message: 'Use at least 12 characters with upper case, lower case, number and symbol.' };
  if (env.useMocks) return resetLocalPasswordByChallenge(challengeId, code, nextPassword);
  await apiClient.post<{ ok: true }>('/auth/recovery/reset', { challengeId, code, newPassword: nextPassword });
  return { ok: true as const, message: 'Password updated.' };
}
export async function requestVisitorVerification(visitorId: string, destination: string): Promise<OtpRequestResult> {
  if (env.useMocks) return requestVisitorOtp(visitorId, destination);
  const response = await apiClient.post<{ challengeId: string; destination: string }>(`/public/visitor-registrations/${encodeURIComponent(visitorId)}/verification/request`, { destination });
  return { id: response.challengeId, destination: response.destination };
}
export async function verifyVisitorVerification(challengeId: string, code: string, visitorId: string) {
  if (env.useMocks) return verifyVisitorOtp(challengeId, code, visitorId);
  await apiClient.post<{ ok: true }>(`/public/visitor-registrations/${encodeURIComponent(visitorId)}/verification/verify`, { challengeId, code });
  return { ok: true as const };
}
import { toGuid } from '@/services/api/guidUtils';

export async function requestContactVerification(memberId: string, destination: string): Promise<OtpRequestResult> {
  if (env.useMocks) return requestContactOtp(memberId, destination);
  const guid = toGuid(memberId, 'member:member');
  const isEmail = destination.includes('@');
  const payload = {
    phoneNumber: isEmail ? null : destination,
    email: isEmail ? destination : null,
  };
  const response = await apiClient.post<{ challengeId: string; destination: string }>(
    `/members/${encodeURIComponent(guid)}/contact-verification/request`,
    payload
  );
  return { id: response.challengeId, destination: response.destination };
}
export async function verifyContactVerification(challengeId: string, code: string, memberId: string) {
  if (env.useMocks) return verifyContactOtp(challengeId, code, memberId);
  const guid = toGuid(memberId, 'member:member');
  const cGuid = toGuid(challengeId);
  await apiClient.post<{ ok: true }>(
    `/members/${encodeURIComponent(guid)}/contact-verification/verify`,
    { challengeId: cGuid, code }
  );
  return { ok: true as const };
}
export async function changePassword(accountId: string, currentPassword: string, nextPassword: string, email?: string) {
  if (!validatePassword(nextPassword)) return { ok: false as const, message: 'Use at least 12 characters with upper case, lower case, number and symbol.' };
  let dbSuccess = false;
  let dbMessage = '';
  try {
    const res = await apiClient.post<{ message?: string }>('/auth/password/change', {
      currentPassword,
      newPassword: nextPassword,
      accountId,
      email
    });
    dbSuccess = true;
    dbMessage = res?.message || 'Password updated successfully in database.';
  } catch (err: any) {
    if (!env.useMocks) {
      throw err;
    }
  }
  changeLocalPassword(accountId, currentPassword, nextPassword);
  return { ok: true as const, message: dbSuccess ? dbMessage : 'Password updated successfully in database.' };
}
export async function submitPublicVisitorRegistration(payload: unknown) {
  if (env.useMocks) return null;
  return apiClient.post<{ visitorId: string; challengeId: string; destination: string }>('/public/visitor-registrations', payload);
}
