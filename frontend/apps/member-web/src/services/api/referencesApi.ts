import { apiClient } from './apiClient';
import { toGuid } from './guidUtils';

export interface ReferenceRecord {
  id: string;
  sourceMemberId: string;
  targetMemberId: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  version?: string;
}

export interface CreateReferenceRequest {
  targetMemberId?: string;
  toMemberId?: string;
  description?: string;
  businessId?: string;
  introducedMemberId?: string | null;
  idempotencyKey?: string;
}

export interface UpdateReferenceRequest {
  referenceId: string;
  status?: string;
  action?: string;
  notes?: string;
  outcome?: string;
  followUpAt?: string | null;
  idempotencyKey?: string;
}

export const referencesApi = {
  getReferences: (signal?: AbortSignal) =>
    apiClient.get<ReferenceRecord[]>('/references', { signal, retry: 'safe' }),

  createReference: (request: CreateReferenceRequest, idempotencyKey?: string) => {
    const key = request.idempotencyKey || idempotencyKey || crypto.randomUUID();
    const toMemberId = toGuid(request.toMemberId || request.targetMemberId || 'member:member');
    const introducedMemberId = request.introducedMemberId ? toGuid(request.introducedMemberId) : null;
    const payload = {
      toMemberId,
      introducedMemberId,
      idempotencyKey: key,
    };
    return apiClient.post<ReferenceRecord>('/references', payload, undefined, { idempotencyKey: key });
  },

  updateReference: (request: UpdateReferenceRequest, version?: string, idempotencyKey?: string) => {
    const key = request.idempotencyKey || idempotencyKey || crypto.randomUUID();
    const action = request.action || request.status || 'update';
    const payload = {
      referenceId: toGuid(request.referenceId),
      action,
      idempotencyKey: key,
      outcome: request.outcome || request.notes || null,
      followUpAt: request.followUpAt ? new Date(request.followUpAt).toISOString() : null,
    };
    return apiClient.post<ReferenceRecord>('/references/actions', payload, version, { idempotencyKey: key });
  },
};

