import { describe, expect, it } from 'vitest';
import { safeExternalHttpUrl } from './urlSecurity';

describe('external URL security', () => {
  it('normalises domain-only URLs to HTTPS', () => {
    expect(safeExternalHttpUrl('example.com/catalogue')).toBe('https://example.com/catalogue');
  });

  it('allows explicit HTTP/HTTPS and rejects executable/unsupported schemes', () => {
    expect(safeExternalHttpUrl('https://example.com')).toBe('https://example.com/');
    expect(safeExternalHttpUrl('http://localhost:3000')).toBe('http://localhost:3000/');
    expect(safeExternalHttpUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeExternalHttpUrl('data:text/html,hello')).toBeUndefined();
    expect(safeExternalHttpUrl('ftp://example.com/file')).toBeUndefined();
  });
});
