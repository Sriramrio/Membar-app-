import { describe, expect, it } from 'vitest';
import { routeConfig } from '@/routes/routeConfig';

describe('enterprise route inventory', () => {
  it('retains the 80 original route contracts and adds four practical member routes', () => expect(routeConfig).toHaveLength(84));
  it('has unique route identifiers', () => expect(new Set(routeConfig.map(route => route.id)).size).toBe(routeConfig.length));
  it('has unique route patterns', () => expect(new Set(routeConfig.map(route => route.path)).size).toBe(routeConfig.length));
  it('keeps the original 80 route ids intact', () => expect(routeConfig.slice(0, 80).map(route => route.id)).toEqual(Array.from({ length: 80 }, (_, index) => index + 1)));
  it('adds dashboard, event discovery, notifications and promotion detail as ids 81–84', () => expect(routeConfig.slice(80).map(route => route.id)).toEqual([81, 82, 83, 84]));
  it('contains the member discovery entry and separate dashboard', () => {
    expect(routeConfig.some(route => route.path === '/app/home')).toBe(true);
    expect(routeConfig.some(route => route.path === '/app/dashboard')).toBe(true);
  });
});
