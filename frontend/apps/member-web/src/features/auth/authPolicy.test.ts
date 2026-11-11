import { describe, expect, it } from 'vitest';
import { canAuthenticateAccountStatus, isSafeLocalReturnPath } from './authPolicy';

describe('authentication policy', () => {
  it('permits only active or unspecified preview account status', () => {
    expect(canAuthenticateAccountStatus('active')).toBe(true);
    expect(canAuthenticateAccountStatus(undefined)).toBe(true);
    expect(canAuthenticateAccountStatus('inactive')).toBe(false);
    expect(canAuthenticateAccountStatus('suspended')).toBe(false);
    expect(canAuthenticateAccountStatus('expired')).toBe(false);
  });

  it('allows only local application return paths', () => {
    expect(isSafeLocalReturnPath('/app/home?tab=network')).toBe(true);
    expect(isSafeLocalReturnPath('/platform-admin/rbac')).toBe(true);
    expect(isSafeLocalReturnPath('//evil.example')).toBe(false);
    expect(isSafeLocalReturnPath('/%2F%2Fevil.example')).toBe(false);
    expect(isSafeLocalReturnPath('/\\evil.example')).toBe(false);
    expect(isSafeLocalReturnPath('https://evil.example')).toBe(false);
  });
});
