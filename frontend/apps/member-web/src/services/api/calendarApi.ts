import { apiClient } from './apiClient';
import { toGuid } from './guidUtils';

export interface CalendarEventRecord {
  id: string;
  name: string;
  description: string;
  dateTime: string;
  location?: string;
  chapterId?: string;
  registeredCount: number;
  isRegistered?: boolean;
}

export interface EventRegistrationActionRequest {
  eventId: string;
  action: 'register' | 'cancel' | string;
}

export const calendarApi = {
  getEvents: (signal?: AbortSignal) =>
    apiClient.get<CalendarEventRecord[]>('/calendar/events', { signal, retry: 'safe' }),

  getEventDetail: (id: string, signal?: AbortSignal) =>
    apiClient.get<CalendarEventRecord>(`/calendar/events/${encodeURIComponent(toGuid(id))}`, { signal, retry: 'safe' }),

  registerForEvent: (eventId: string, action: 'register' | 'cancel' | string = 'register', idempotencyKey?: string) => {
    const key = idempotencyKey || crypto.randomUUID();
    return apiClient.post<void>(
      '/calendar/free-events/actions',
      {
        eventId: toGuid(eventId),
        action,
        idempotencyKey: key,
      },
      undefined,
      { idempotencyKey: key }
    );
  },
};

