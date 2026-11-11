import { apiClient } from './apiClient';
import { toGuid } from './guidUtils';

export interface MeetingRecord {
  id: string;
  hostMemberId: string;
  guestMemberId: string;
  scheduledAt: string;
  status: string;
  notes?: string;
  location?: string;
  createdAt: string;
  version?: string;
}

export interface CreateMeetingRequest {
  guestMemberId?: string;
  toMemberId?: string;
  scheduledAt?: string;
  proposedAt?: string;
  timeZoneId?: string;
  location?: string;
  notes?: string;
  idempotencyKey?: string;
}

export interface ChangeMeetingRequest {
  meetingId: string;
  action: 'confirm' | 'cancel' | 'reschedule' | 'complete' | string;
  scheduledAt?: string;
  notes?: string;
  outcome?: string;
  idempotencyKey?: string;
}

export const meetingsApi = {
  getMeetings: (signal?: AbortSignal) =>
    apiClient.get<MeetingRecord[]>('/one-to-one', { signal, retry: 'safe' }),

  getMeeting: (id: string, signal?: AbortSignal) =>
    apiClient.get<MeetingRecord>(`/one-to-one/${encodeURIComponent(toGuid(id))}`, { signal, retry: 'safe' }),

  createMeeting: (request: CreateMeetingRequest, idempotencyKey?: string) => {
    const key = request.idempotencyKey || idempotencyKey || crypto.randomUUID();
    const toMemberId = toGuid(request.toMemberId || request.guestMemberId || 'member:member');
    const proposedAt = request.proposedAt || request.scheduledAt || new Date().toISOString();
    const payload = {
      toMemberId,
      proposedAt,
      timeZoneId: request.timeZoneId || 'UTC',
      idempotencyKey: key,
    };
    return apiClient.post<MeetingRecord>('/one-to-one', payload, undefined, { idempotencyKey: key });
  },

  changeMeeting: (request: ChangeMeetingRequest, version?: string, idempotencyKey?: string) => {
    const key = request.idempotencyKey || idempotencyKey || crypto.randomUUID();
    const actionLower = String(request.action).toLowerCase();
    const action = actionLower === 'confirm' ? 'Confirm'
      : actionLower === 'cancel' ? 'Cancel'
      : actionLower === 'reschedule' ? 'Reschedule'
      : actionLower === 'complete' ? 'Complete'
      : request.action;

    const payload = {
      meetingId: toGuid(request.meetingId),
      action,
      idempotencyKey: key,
      time: request.scheduledAt ? new Date(request.scheduledAt).toISOString() : null,
      outcome: request.outcome || request.notes || null,
    };
    return apiClient.post<MeetingRecord>('/one-to-one/actions', payload, version, { idempotencyKey: key });
  },
};

