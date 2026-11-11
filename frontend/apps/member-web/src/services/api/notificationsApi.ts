import { apiClient } from './apiClient';

export interface NotificationDto {
  id: string;
  memberId: string;
  title: string;
  message: string;
  type: string;
  category: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications: (unreadOnly = false, signal?: AbortSignal) =>
    apiClient.get<NotificationDto[]>(`/notifications?unreadOnly=${unreadOnly}`, { signal, retry: 'safe' }),

  markRead: (id: string, idempotencyKey?: string) =>
    apiClient.post<{ success: boolean; unreadCount: number }>(
      `/notifications/${encodeURIComponent(id)}/read`,
      undefined,
      undefined,
      { idempotencyKey }
    ),

  markAllRead: (idempotencyKey?: string) =>
    apiClient.post<{ success: boolean; count: number }>(
      '/notifications/mark-all-read',
      undefined,
      undefined,
      { idempotencyKey }
    ),

  getPreferences: (signal?: AbortSignal) =>
    apiClient.get<Record<string, Record<string, boolean>>>('/notifications/preferences', { signal, retry: 'safe' }),

  savePreferences: (preferences: unknown) =>
    apiClient.put<{ success: boolean }>('/notifications/preferences', preferences),
};
