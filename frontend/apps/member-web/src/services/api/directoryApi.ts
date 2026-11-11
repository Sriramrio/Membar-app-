import { apiClient } from './apiClient';

/** Exact DTO contract of GET /api/v1/directory/members (DirectoryPageDto). */
export type DirectoryScope = 'ForYou' | 'YourChapter' | 'YourNetwork';
export interface DirectoryEntry {
  memberId: string;
  businessId: string;
  businessName: string;
  specialisationId: string;
  chapterId: string;
}
export interface DirectoryPage {
  items: DirectoryEntry[];
  page: number;
  size: number;
  hasMore: boolean;
}
export interface DirectorySearch {
  scope: DirectoryScope;
  term?: string;
  sectorId?: string;
  segmentId?: string;
  specialisationId?: string;
  page: number;
  size: number;
}
export function searchAuthoritativeDirectory(query: DirectorySearch, signal?: AbortSignal): Promise<DirectoryPage> {
  const safeSize = Math.max(1, Math.min(query.size || 24, 50));
  const params = new URLSearchParams({ scope: query.scope, page: String(query.page), size: String(safeSize) });
  if (query.term?.trim()) params.set('term', query.term.trim());
  if (query.sectorId) params.set('sectorId', query.sectorId);
  if (query.segmentId) params.set('segmentId', query.segmentId);
  if (query.specialisationId) params.set('specialisationId', query.specialisationId);
  return apiClient.get<DirectoryPage>(`/v1/directory/members?${params}`, { signal, retry: 'safe' });
}

/** Public directory details return only the allowlisted fields of DirectoryEntryDto. */
export function getVisibleMemberDetail(memberId: string, businessId: string, signal?: AbortSignal): Promise<DirectoryEntry> {
  return apiClient.get<DirectoryEntry>(`/v1/directory/members/${encodeURIComponent(memberId)}/businesses/${encodeURIComponent(businessId)}`, { signal, retry: 'safe' });
}
export interface MemberContext { memberId: string; primaryChapterId: string; primaryBusinessId: string | null; primaryBusinessName: string | null; membershipStatus: string; }
export function getCurrentMemberContext(signal?: AbortSignal): Promise<MemberContext> {
  return apiClient.get<MemberContext>('/v1/me/context', { signal, retry: 'safe' });
}
