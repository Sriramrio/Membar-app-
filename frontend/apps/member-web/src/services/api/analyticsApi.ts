import { apiClient } from './apiClient';

export interface NetworkAnalyticsSnapshotDto {
  connectionsInitiated: number;
  connectionsReceived: number;
  connectionsAccepted: number;
  connectionsPending: number;
  referencesGiven: number;
  referencesReceived: number;
  referencesPending: number;
  meetingsRequested: number;
  meetingsScheduled: number;
  meetingsCompleted: number;
  opportunitiesCreated: number;
  opportunityResponses: number;
  notesPendingFollowUp: number;
  eventsRegistered: number;
}

export interface MemberActionItemDto {
  kind: string;
  itemId: string;
  title: string;
  dueAt: string | null;
}

export const analyticsApi = {
  getSnapshot: (signal?: AbortSignal) =>
    apiClient.get<NetworkAnalyticsSnapshotDto>('/member-analytics/snapshot', { signal, retry: 'safe' }),

  getActionItems: (size = 20, signal?: AbortSignal) =>
    apiClient.get<MemberActionItemDto[]>(`/member-analytics/actions?size=${encodeURIComponent(size)}`, { signal, retry: 'safe' })
};
