import { apiClient } from './apiClient';
import { toGuid } from './guidUtils';

export interface OpportunityRecord {
  id: string;
  title: string;
  description: string;
  status: string;
  creatorMemberId?: string;
  chapterId?: string;
  createdAt: string;
  updatedAt?: string;
  version?: string;
}

export interface CreateOpportunityRequest {
  businessId?: string;
  title: string;
  description?: string;
  scope?: 'YourNetwork' | 'YourChapter' | string;
  chapterId?: string | null;
  specialisationId?: string | null;
  idempotencyKey?: string;
}

export interface OpportunityActionRequest {
  opportunityId: string;
  action: string;
  title?: string;
  outcome?: string;
  responseId?: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string;
}

export const opportunitiesApi = {
  getOpportunities: (signal?: AbortSignal) =>
    apiClient.get<OpportunityRecord[]>('/opportunities', { signal, retry: 'safe' }),

  getOpportunity: (id: string, signal?: AbortSignal) =>
    apiClient.get<OpportunityRecord>(`/opportunities/${encodeURIComponent(toGuid(id))}`, { signal, retry: 'safe' }),

  createOpportunity: (request: CreateOpportunityRequest, idempotencyKey?: string) => {
    const key = request.idempotencyKey || idempotencyKey || crypto.randomUUID();
    const scope = request.scope === 'YourChapter' ? 'YourChapter' : 'YourNetwork';
    const chapterId = scope === 'YourChapter'
      ? toGuid(request.chapterId || 'chapter:Chennai Chapter', 'chapter:Chennai Chapter')
      : null;
    const payload = {
      businessId: toGuid(request.businessId || 'business:member'),
      title: request.title,
      scope,
      chapterId,
      specialisationId: null,
      idempotencyKey: key,
    };
    return apiClient.post<OpportunityRecord>('/opportunities', payload, undefined, { idempotencyKey: key });
  },

  changeOpportunity: (request: OpportunityActionRequest, version?: string, idempotencyKey?: string) => {
    const key = request.idempotencyKey || idempotencyKey || crypto.randomUUID();
    const payload = {
      opportunityId: toGuid(request.opportunityId),
      action: request.action,
      title: request.title ?? (request.payload?.title as string | undefined),
      outcome: request.outcome ?? (request.payload?.outcome as string | undefined),
      responseId: request.responseId ? toGuid(request.responseId) : undefined,
      idempotencyKey: key,
    };
    return apiClient.post<OpportunityRecord>('/opportunities/actions', payload, version, { idempotencyKey: key });
  },
};

