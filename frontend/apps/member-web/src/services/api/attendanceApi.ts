import { apiClient } from './apiClient';
import { toGuid } from './guidUtils';

export interface AttendanceDto {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  correctionStatus?: string;
  correctionReason?: string;
}

export interface AttendancePageDto {
  items: AttendanceDto[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AttendanceCorrectionRequest {
  attendanceId?: string;
  eventId?: string;
  reason: string;
  proposedStatus?: string;
}

export const attendanceApi = {
  getMyAttendance: (status?: string, page = 1, pageSize = 50, signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set('status', status);
    return apiClient.get<AttendancePageDto>(`/attendance/my?${params}`, { signal, retry: 'safe' });
  },

  requestCorrection: (request: AttendanceCorrectionRequest, idempotencyKey?: string) =>
    apiClient.post<{ success: boolean; message: string }>(
      '/attendance/correction-requests',
      {
        attendanceId: toGuid(request.attendanceId || request.eventId || 'attendance:default'),
        reason: request.reason,
        proposedStatus: request.proposedStatus || 'present',
      },
      undefined,
      { idempotencyKey }
    ),
};

