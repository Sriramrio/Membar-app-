import { apiClient } from './apiClient';

export type VisitorInvitation = {
  id: string; reference: string; firstName: string; lastName: string;
  companyName: string; email: string; mobile: string; status: string;
  createdAt: string; expiresAt: string; chapterId: string;
};
export type VisitorInvitationList = { items: VisitorInvitation[]; page: number; pageSize: number };
export type InvitationSummary = { invitationsCreated: number; deliveryPending: number; cancelled: number; from: string; toExclusive: string };
export type CreateVisitorInvitation = {
  firstName: string; lastName: string; companyName: string;
  email: string; mobile: string; idempotencyKey: string;
};
export type OfficialConversionRow = { id:string; invitationId:string; activatedAt:string; chapterId:string };
export type OfficialConversionPage = { total:number; page:number; pageSize:number; periodBasis:string; items:OfficialConversionRow[] };
export const visitorInvitationsApi = {
  conversions: (from:string,toExclusive:string,page=1,signal?:AbortSignal) => {
    if (!Number.isInteger(page) || page < 1) throw new Error('Invalid conversion history page.');
    const params = new URLSearchParams({from,toExclusive,page:String(page),pageSize:'10'});
    return apiClient.get<OfficialConversionPage>(`/api/v1/me/visitor-invitations/conversions?${params}`, {signal});
  },
  list: (page = 1, signal?: AbortSignal) => apiClient.get<VisitorInvitationList>(`/api/v1/me/visitor-invitations?page=${page}&pageSize=20`, { signal }),
  summary: (from: string, toExclusive: string, signal?: AbortSignal) => apiClient.get<InvitationSummary>(`/api/v1/me/visitor-invitations/summary?from=${encodeURIComponent(from)}&toExclusive=${encodeURIComponent(toExclusive)}`, {signal}),
  cancel: (id: string) => apiClient.post<{ id: string; status: string; replayed: boolean }>(`/api/v1/me/visitor-invitations/${encodeURIComponent(id)}/cancel`, {}),
  create: (input: CreateVisitorInvitation) => apiClient.post<{ id: string; reference: string; status: string; replayed: boolean }>('/api/v1/me/visitor-invitations', input, undefined, { idempotencyKey: input.idempotencyKey }),
};
