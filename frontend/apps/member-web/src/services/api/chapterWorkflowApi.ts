import { apiClient } from './apiClient';

export interface ChapterDto {
  id: string;
  name: string;
  regionId?: string | null;
  stateId?: string | null;
  status: string;
  createdAt: string;
}

export interface MemberRoleAssignmentDto {
  id: string;
  memberId: string;
  chapterId: string;
  roleId: string;
  status: string;
  assignedAt: string;
  validUntil?: string | null;
}

export interface MemberRegistrationDto {
  id: string;
  userId?: string | null;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  categoryId?: string | null;
  chapterId: string;
  onboardingStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecordDto {
  id: string;
  registrationId: string;
  amount: number;
  paymentRef: string;
  paymentStatus: string;
  verifiedAt: string;
}

export interface DocumentVerificationDto {
  id: string;
  registrationId: string;
  documentUrl: string;
  verifiedBy: string;
  status: string;
  notes?: string | null;
  verifiedAt: string;
}

export interface ChapterApprovalDto {
  id: string;
  registrationId: string;
  approvedBy: string;
  roleAtApproval: string;
  status: string;
  remarks?: string | null;
  approvedAt: string;
}

export interface ChapterGroupMemberDto {
  id: string;
  chapterId: string;
  memberId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  businessName?: string | null;
  role: string;
  joinedAt: string;
  status: string;
}

export interface CoordinatorQueueItemDto {
  registrationId: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  categoryId?: string | null;
  chapterId: string;
  chapterName: string;
  status: string;
  createdAt: string;
  payment?: PaymentRecordDto | null;
}

export interface ExecutiveQueueItemDto {
  registrationId: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  categoryId?: string | null;
  chapterId: string;
  chapterName: string;
  status: string;
  createdAt: string;
  payment?: PaymentRecordDto | null;
  documentVerification?: DocumentVerificationDto | null;
}

export interface OnboardingStatusDetailDto {
  registration: MemberRegistrationDto;
  chapter: string;
  currentStatus: string;
  payment?: PaymentRecordDto | null;
  documentVerification?: DocumentVerificationDto | null;
  executiveApproval?: ChapterApprovalDto | null;
  groupMembership?: ChapterGroupMemberDto | null;
}

export const chapterWorkflowApi = {
  // 1. Chapters
  getChapters: (signal?: AbortSignal) =>
    apiClient.get<ChapterDto[]>('/chapters', { signal, retry: 'safe' }),

  createChapter: (data: { name: string; regionId?: string; stateId?: string }, signal?: AbortSignal) =>
    apiClient.post<ChapterDto>('/chapters', data, undefined, { signal }),

  getChapterMembers: (chapterId: string, signal?: AbortSignal) =>
    apiClient.get<ChapterGroupMemberDto[]>(`/chapters/${chapterId}/members`, { signal, retry: 'safe' }),

  // 2. Roles
  assignRole: (data: { memberId: string; chapterId: string; roleId: string; validUntil?: string }, signal?: AbortSignal) =>
    apiClient.post<MemberRoleAssignmentDto>('/roles/assign', data, undefined, { signal }),

  getChapterRoles: (chapterId: string, signal?: AbortSignal) =>
    apiClient.get<MemberRoleAssignmentDto[]>(`/roles/chapter/${chapterId}`, { signal, retry: 'safe' }),

  // 3. Member Registration
  registerMember: (data: {
    fullName: string;
    email: string;
    phone: string;
    businessName: string;
    categoryId?: string;
    chapterId: string;
  }, signal?: AbortSignal) =>
    apiClient.post<{ registrationId: string; status: string; message: string; registration: MemberRegistrationDto }>(
      '/members/register',
      data,
      undefined,
      { signal }
    ),

  // 4. Payment Verification Gate
  verifyPayment: (data: { registrationId: string; amount: number; paymentRef: string; paymentStatus?: string }, signal?: AbortSignal) =>
    apiClient.post<{ registrationId: string; status: string; payment: PaymentRecordDto; message: string }>(
      '/payments/verify',
      data,
      undefined,
      { signal }
    ),

  // 5. Member Coordinator KYC Queue & Verify
  getCoordinatorQueue: (signal?: AbortSignal) =>
    apiClient.get<CoordinatorQueueItemDto[]>('/onboarding/coordinator/queue', { signal, retry: 'safe' }),

  verifyDocument: (data: {
    registrationId: string;
    documentUrl: string;
    verifiedBy: string;
    status: 'VERIFIED' | 'REJECTED';
    notes?: string;
  }, signal?: AbortSignal) =>
    apiClient.post<{ registrationId: string; status: string; documentVerification: DocumentVerificationDto; message: string }>(
      '/onboarding/coordinator/verify-doc',
      data,
      undefined,
      { signal }
    ),

  // 6. Executive Queue & Approve
  getExecutiveQueue: (signal?: AbortSignal) =>
    apiClient.get<ExecutiveQueueItemDto[]>('/onboarding/executive/queue', { signal, retry: 'safe' }),

  executiveApprove: (data: {
    registrationId: string;
    approvedBy: string;
    roleAtApproval: 'President' | 'Vice President';
    status: 'APPROVED' | 'REJECTED';
    remarks?: string;
  }, signal?: AbortSignal) =>
    apiClient.post<{
      registrationId: string;
      status: string;
      approval: ChapterApprovalDto;
      membership?: ChapterGroupMemberDto;
      message: string;
    }>('/onboarding/executive/approve', data, undefined, { signal }),

  // 7. Status Tracker
  getOnboardingStatus: (registrationId: string, signal?: AbortSignal) =>
    apiClient.get<OnboardingStatusDetailDto>(`/onboarding/status/${registrationId}`, { signal, retry: 'safe' }),

  getOnboardingStatusByUser: (identifier: string, signal?: AbortSignal) =>
    apiClient.get<OnboardingStatusDetailDto>(`/onboarding/status/by-user?identifier=${encodeURIComponent(identifier)}`, { signal, retry: 'safe' })
};
