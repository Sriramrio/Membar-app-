import { apiClient } from './apiClient';
import { toGuid } from './guidUtils';

export interface ConnectionRecord {
  id: string;
  sourceMemberId: string;
  targetMemberId: string;
  state: 'pending' | 'connected' | 'rejected' | 'disconnected' | 'blocked';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version?: string;
}

export interface ConnectionActionRequest {
  connectionId?: string;
  otherMemberId?: string;
  action: 'accept' | 'reject' | 'disconnect' | 'block' | 'cancel' | string;
  idempotencyKey?: string;
}

export interface MemberSuggestion {
  memberId: string;
  name: string;
  chapter: string;
  businessName: string;
  specialisation: string;
  mutualCount: number;
}

function mapConnectionAction(action: string): string {
  const lower = action.toLowerCase();
  switch (lower) {
    case 'request': return 'Request';
    case 'accept': return 'Accept';
    case 'reject':
    case 'decline': return 'Decline';
    case 'cancel':
    case 'withdraw': return 'Cancel';
    case 'disconnect':
    case 'remove': return 'Remove';
    case 'block': return 'Block';
    case 'unblock': return 'Unblock';
    default: return action;
  }
}

export const connectionsApi = {
  getConnections: (signal?: AbortSignal) =>
    apiClient.get<ConnectionRecord[]>('/connections', { signal, retry: 'safe' }),

  getSuggestions: (signal?: AbortSignal) =>
    apiClient.get<MemberSuggestion[]>('/connections/suggestions', { signal, retry: 'safe' }),

  requestConnection: (targetMemberId: string, notes?: string, idempotencyKey?: string) => {
    const key = idempotencyKey || crypto.randomUUID();
    return apiClient.post<{ accepted: boolean; code: string; message: string }>(
      '/connections/actions',
      {
        otherMemberId: toGuid(targetMemberId),
        action: 'Request',
        idempotencyKey: key,
      },
      undefined,
      { idempotencyKey: key }
    );
  },

  changeState: (targetMemberId: string, action: 'accept' | 'reject' | 'disconnect' | 'block' | 'cancel' | string, version?: string, idempotencyKey?: string) => {
    const key = idempotencyKey || crypto.randomUUID();
    return apiClient.post<{ accepted: boolean; code: string; message: string }>(
      '/connections/actions',
      {
        otherMemberId: toGuid(targetMemberId),
        action: mapConnectionAction(action),
        idempotencyKey: key,
      },
      version,
      { idempotencyKey: key }
    );
  },
};

