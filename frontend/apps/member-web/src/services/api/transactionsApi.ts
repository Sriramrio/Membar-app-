import { apiClient } from './apiClient';
import { toGuid } from './guidUtils';

export interface TransactionRecord {
  id: string;
  memberId: string;
  buyerBusinessId: string;
  counterpartyBusinessId: string;
  amount: number;
  currency: string;
  status: string;
  notes?: string;
  createdAt: string;
  version?: string;
}

export interface CreateTransactionRequest {
  buyerBusinessId?: string;
  counterpartyBusinessId: string;
  referenceId?: string | null;
  opportunityId?: string | null;
  amount: number;
  currency?: string;
  notes?: string;
}

export const transactionsApi = {
  getTransactions: (signal?: AbortSignal) =>
    apiClient.get<TransactionRecord[]>('/transactions', { signal, retry: 'safe' }),

  createTransaction: (request: CreateTransactionRequest, idempotencyKey?: string) => {
    const key = idempotencyKey || crypto.randomUUID();
    const payload = {
      buyerBusinessId: toGuid(request.buyerBusinessId || 'business:member'),
      counterpartyBusinessId: toGuid(request.counterpartyBusinessId),
      referenceId: request.referenceId ? toGuid(request.referenceId) : null,
      opportunityId: request.opportunityId ? toGuid(request.opportunityId) : null,
      amount: request.amount,
      currency: request.currency || 'INR',
      notes: request.notes ?? null,
    };
    return apiClient.post<TransactionRecord>('/transactions', payload, undefined, { idempotencyKey: key });
  },

  updateStatus: (id: string, status: string, version?: string, idempotencyKey?: string) => {
    const key = idempotencyKey || crypto.randomUUID();
    return apiClient.post<TransactionRecord>(
      `/transactions/${encodeURIComponent(toGuid(id))}/status`,
      { status },
      version,
      { idempotencyKey: key }
    );
  },
};

