import { apiClient } from './apiClient';

export interface MemberContext {
  memberId: string;
  primaryChapterId: string;
  primaryBusinessId: string | null;
  primaryBusinessName: string | null;
  membershipStatus: string;
}

export interface MemberProfileDto {
  memberId: string;
  userId?: string;
  fullName?: string;
  name?: string;
  designation?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  businessName?: string;
  businessId?: string;
  isContactVerified?: boolean;
  status?: string;
  version?: string | number;
  specialisationId?: string;
  specialisationName?: string;
  segmentId?: string;
  segmentName?: string;
  sectorId?: string;
  sectorName?: string;
}

export interface AnalyticsSnapshotDto {
  thankYouNotesGiven: number;
  thankYouNotesReceived: number;
  oneToOnesCompleted: number;
  referencesGiven: number;
  referencesReceived: number;
  opportunitiesShared: number;
  attendanceRatePercentage: number;
}

export const meApi = {
  getMyContext: (signal?: AbortSignal) =>
    apiClient.get<MemberContext>('/v1/me/context', { signal, retry: 'safe' }),

  getMyProfile: (signal?: AbortSignal) =>
    apiClient.get<MemberProfileDto>('/v1/me/profile', { signal, retry: 'safe' }),

  updateMyProfile: (profile: Partial<MemberProfileDto>, version?: string, idempotencyKey?: string) => {
    const payload = {
      name: profile.name ?? profile.fullName ?? null,
      phoneNumber: profile.phoneNumber ?? profile.phone ?? null,
      email: profile.email ?? null,
      businessName: profile.businessName ?? null,
      specialisationId: profile.specialisationId ?? null,
    };
    return apiClient.put<MemberProfileDto>('/v1/me/profile', payload, version, { idempotencyKey });
  },

  getAnalyticsSnapshot: (signal?: AbortSignal) =>
    apiClient.get<AnalyticsSnapshotDto>('/member-analytics/snapshot', { signal, retry: 'safe' }),

  getAnalyticsTargets: (signal?: AbortSignal) =>
    apiClient.get<Record<string, unknown>>('/member-analytics/targets', { signal, retry: 'safe' }),

  getAnalyticsActivity: (signal?: AbortSignal) =>
    apiClient.get<Record<string, unknown>[]>('/member-analytics/activity', { signal, retry: 'safe' }),
};

