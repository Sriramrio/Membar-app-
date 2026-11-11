import { apiClient } from './apiClient';

export interface MembershipContextDto {
  memberId: string;
  tier: string;
  status: string;
  startDate: string;
  endDate: string;
  canRenew: boolean;
  renewalFee: number;
}

export interface PaymentSessionRequest {
  paymentId: string;
  memberId: string;
  purpose: 'membership' | 'member-payment';
  returnPath: string;
}

export interface PaymentSessionResponse {
  sessionId: string;
  status: 'created' | 'pending' | 'paid' | 'failed' | 'cancelled';
  checkoutUrl?: string;
  providerReference?: string;
  version?: string;
  correlationId: string;
}

export const membershipApi = {
  getMembershipContext: (signal?: AbortSignal) =>
    apiClient.get<MembershipContextDto>('/membership/me', { signal, retry: 'safe' }),

  renewMembership: (months = 12, tierId?: string, idempotencyKey?: string) =>
    apiClient.post<MembershipContextDto>(
      '/membership/renew',
      { months, tierId },
      undefined,
      { idempotencyKey }
    ),

  createPaymentSession: (request: PaymentSessionRequest) =>
    apiClient.post<PaymentSessionResponse>(
      '/membership/payments/sessions',
      request,
      undefined,
      { idempotencyKey: `payment-session:${request.memberId}:${request.paymentId}:${request.purpose}` }
    ),

  getPaymentStatus: (paymentId: string) =>
    apiClient.get<PaymentSessionResponse>(
      `/membership/payments/status/${encodeURIComponent(paymentId)}`,
      { retry: 'safe' }
    ),

  getPaymentReceipt: (paymentId: string) =>
    apiClient.get<{ documentId: string; downloadUrl?: string; correlationId: string }>(
      `/membership/payments/receipts/${encodeURIComponent(paymentId)}`,
      { retry: 'safe' }
    ),
};
