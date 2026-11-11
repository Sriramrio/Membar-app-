import { apiClient } from './apiClient';

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
export interface ProviderHealthResult { status: 'Connected'|'Degraded'|'Disconnected'|'Disabled'; success: boolean; detail?: string; checkedAt: string; correlationId: string }
export interface ServerAuthorizationDecision { allowed: boolean; reason: string; permission: string; policyVersion?: string; correlationId: string }
export interface NotificationDeliveryRequest { eventCode: string; recipientIds: string[]; channel?: string; variables: Record<string,string>; dedupeKey?: string }
export interface NotificationDeliveryResult { accepted: boolean; deliveryIds: string[]; correlationId: string }

export const PRODUCTION_PROVIDER_ENDPOINTS = {
  paymentSession: '/v6/payments/sessions',
  paymentStatus: '/v6/payments/status',
  paymentReceipt: '/v6/payments/receipts',
  notificationDeliveries: '/v6/notifications/deliveries',
  integrationHealth: '/v6/integrations/health-checks',
  auditQuery: '/v6/audit/query',
  authorizationEvaluate: '/v6/authorization/evaluate',
} as const;

export const createPaymentSession=(request:PaymentSessionRequest)=>apiClient.post<PaymentSessionResponse>(PRODUCTION_PROVIDER_ENDPOINTS.paymentSession,request,undefined,{idempotencyKey:`payment-session:${request.memberId}:${request.paymentId}:${request.purpose}`});
export const getPaymentStatus=(paymentId:string)=>apiClient.post<PaymentSessionResponse>(PRODUCTION_PROVIDER_ENDPOINTS.paymentStatus,{paymentId},undefined,{retry:'safe'});
export const getPaymentReceipt=(paymentId:string)=>apiClient.post<{documentId:string;downloadUrl?:string;correlationId:string}>(PRODUCTION_PROVIDER_ENDPOINTS.paymentReceipt,{paymentId},undefined,{retry:'safe'});
export const requestNotificationDelivery=(request:NotificationDeliveryRequest)=>apiClient.post<NotificationDeliveryResult>(PRODUCTION_PROVIDER_ENDPOINTS.notificationDeliveries,request,undefined,{idempotencyKey:request.dedupeKey});
export const runIntegrationHealth=(integrationId:string)=>apiClient.post<ProviderHealthResult>(PRODUCTION_PROVIDER_ENDPOINTS.integrationHealth,{integrationId},undefined,{retry:'safe'});
export const queryImmutableAudit=<T>(query:Record<string,unknown>)=>apiClient.post<{events:T[];correlationId:string}>(PRODUCTION_PROVIDER_ENDPOINTS.auditQuery,query,undefined,{retry:'safe'});
export const evaluateServerAuthorization=(input:{permission:string;workspace:string;unit?:string;resource?:string;action?:string})=>apiClient.post<ServerAuthorizationDecision>(PRODUCTION_PROVIDER_ENDPOINTS.authorizationEvaluate,input,undefined,{retry:'safe'});
