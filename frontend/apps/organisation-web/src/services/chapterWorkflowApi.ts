export interface ChapterDto {
  id: string;
  name: string;
  regionId?: string | null;
  stateId?: string | null;
  status: string;
  createdAt: string;
  coordinatorName?: string | null;
  coordinatorEmail?: string | null;
  coordinatorPhone?: string | null;
  memberCount?: number;
  openTasks?: number;
  health?: number;
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

export interface UserLeadershipAccessDto {
  isAuthorized: boolean;
  identifier: string;
  assignments: Array<{
    assignmentId: string;
    memberId: string;
    chapterId: string;
    chapterName: string;
    roleId: string;
    assignedAt: string;
  }>;
  primaryChapterId?: string | null;
  primaryChapterName?: string | null;
  primaryRole?: string | null;
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

export interface RegistrationListItemDto {
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
  updatedAt?: string;
  payment?: PaymentRecordDto | null;
  documentVerification?: DocumentVerificationDto | null;
  executiveApproval?: ChapterApprovalDto | null;
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
  registration: any;
  chapter?: string | null;
  currentStatus: string;
  payment?: PaymentRecordDto | null;
  documentVerification?: DocumentVerificationDto | null;
  executiveApproval?: ChapterApprovalDto | null;
  groupMembership?: ChapterGroupMemberDto | null;
}

import { env } from '@/config/env';
import { authStorage } from '@/utils/authStorage';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const normalizedUrl = url.startsWith('/api')
    ? `${env.apiBaseUrl}${url.substring(4)}`
    : (url.startsWith('http') ? url : `${env.apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`);

  const res = await fetch(normalizedUrl, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    let errorDetail = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.title || errJson.message || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return (await res.json()) as T;
}

export const chapterWorkflowApi = {
  getChapters: async (all: boolean = true): Promise<ChapterDto[]> => {
    return request<ChapterDto[]>(`/api/chapters${all ? '?all=true' : ''}`);
  },

  createChapter: async (payload: { name: string; regionId?: string; stateId?: string }): Promise<ChapterDto> => {
    return request<ChapterDto>('/api/chapters', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getMyChapter: async (): Promise<ChapterDto> => {
    return request<ChapterDto>('/api/org/my-chapter');
  },

  getChapterRoles: async (chapterId: string): Promise<MemberRoleAssignmentDto[]> => {
    return request<MemberRoleAssignmentDto[]>(`/api/roles/chapter/${encodeURIComponent(chapterId)}`);
  },

  getUserLeadershipAccess: async (identifier: string): Promise<UserLeadershipAccessDto> => {
    return request<UserLeadershipAccessDto>(`/api/roles/user-access?identifier=${encodeURIComponent(identifier)}`);
  },

  getMemberRegistrations: async (chapterId?: string): Promise<RegistrationListItemDto[]> => {
    // In Organization Web, leader strictly calls /api/org/my-chapter/registrations to guarantee chapter-scoped isolation
    try {
      const myRegs = await request<RegistrationListItemDto[]>('/api/org/my-chapter/registrations');
      if (Array.isArray(myRegs)) return myRegs;
    } catch {
      // Fallback if super admin
    }

    const url = chapterId && chapterId !== 'all'
      ? `/api/members/registrations?chapterId=${encodeURIComponent(chapterId)}`
      : '/api/members/registrations';
    return request<RegistrationListItemDto[]>(url);
  },

  getCoordinatorQueue: async (): Promise<CoordinatorQueueItemDto[]> => {
    return request<CoordinatorQueueItemDto[]>('/api/onboarding/coordinator/queue');
  },

  verifyDocument: async (data: {
    registrationId: string;
    documentUrl?: string;
    verifiedBy: string;
    status: 'VERIFIED' | 'REJECTED';
    notes?: string;
  }): Promise<DocumentVerificationDto> => {
    return request<DocumentVerificationDto>('/api/onboarding/coordinator/verify-doc', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getExecutiveQueue: async (): Promise<ExecutiveQueueItemDto[]> => {
    return request<ExecutiveQueueItemDto[]>('/api/onboarding/executive/queue');
  },

  executiveApprove: async (data: {
    registrationId: string;
    approvedBy: string;
    roleAtApproval: string;
    status: 'APPROVED' | 'REJECTED';
    remarks?: string;
  }): Promise<ChapterApprovalDto> => {
    return request<ChapterApprovalDto>('/api/onboarding/executive/approve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyPayment: async (data: {
    registrationId: string;
    amount: number;
    paymentRef: string;
    paymentStatus?: string;
  }): Promise<PaymentRecordDto> => {
    return request<PaymentRecordDto>('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        paymentStatus: data.paymentStatus ?? 'SUCCESS',
      }),
    });
  },

  getOnboardingStatus: async (registrationId: string): Promise<OnboardingStatusDetailDto> => {
    return request<OnboardingStatusDetailDto>(`/api/onboarding/status/${encodeURIComponent(registrationId)}`);
  },

  getOnboardingStatusByUser: async (identifier: string): Promise<OnboardingStatusDetailDto> => {
    return request<OnboardingStatusDetailDto>(`/api/onboarding/status/by-user?identifier=${encodeURIComponent(identifier)}`);
  },

  // Leadership Portal & Credential Management
  leadershipPortalLogin: async (identifier: string, password: string): Promise<any> => {
    return request<any>('/api/auth/leadership-portal-login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  changePassword: async (data: { currentPassword: string; newPassword: string; confirmNewPassword: string; identifier?: string }): Promise<{ success: boolean; message: string; mustChangePassword: boolean }> => {
    try {
      return await request<{ success: boolean; message: string; mustChangePassword: boolean }>('/api/org/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (err?.status === 404 || String(err?.message || '').includes('404')) {
        return await request<{ success: boolean; message: string; mustChangePassword: boolean }>('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      throw err;
    }
  },

  getScopedMembers: async (params?: { chapterFilter?: string; search?: string }): Promise<ScopedMembersResponseDto> => {
    const q = new URLSearchParams();
    if (params?.chapterFilter) q.append('chapterFilter', params.chapterFilter);
    if (params?.search) q.append('search', params.search);
    return request<ScopedMembersResponseDto>(`/api/org/scoped/members?${q.toString()}`);
  },

  registerScopedMember: async (data: { fullName: string; email: string; phone: string; businessName?: string; categoryId?: string }): Promise<any> => {
    return request<any>('/api/org/scoped/members/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Trust Payment Verification Module (Tenant-Wide)
  getTrustPayments: async (params?: { chapterId?: string; status?: string; startDate?: string; endDate?: string; search?: string }): Promise<TrustPaymentsResponseDto> => {
    const q = new URLSearchParams();
    if (params?.chapterId) q.append('chapterId', params.chapterId);
    if (params?.status) q.append('status', params.status);
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    if (params?.search) q.append('search', params.search);
    return request<TrustPaymentsResponseDto>(`/api/org/trust/payments?${q.toString()}`);
  },

  verifyTrustPayment: async (paymentId: string, remarks?: string): Promise<any> => {
    return request<any>('/api/org/trust/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ paymentId, remarks }),
    });
  },

  rejectTrustPayment: async (paymentId: string, rejectionReason: string): Promise<any> => {
    return request<any>('/api/org/trust/payments/reject', {
      method: 'POST',
      body: JSON.stringify({ paymentId, rejectionReason }),
    });
  },

  bulkVerifyTrustPayments: async (paymentIds: string[], remarks?: string): Promise<any> => {
    return request<any>('/api/org/trust/payments/bulk-verify', {
      method: 'POST',
      body: JSON.stringify({ paymentIds, remarks }),
    });
  },

  getTrusteeChapters: async (): Promise<TrusteeChapterItemDto[]> => {
    return request<TrusteeChapterItemDto[]>('/api/trustee/chapters');
  },

  getTrusteeRegisteredMembers: async (chapterId: string, search?: string): Promise<TrusteeRegisteredMemberDto[]> => {
    const query = new URLSearchParams({ chapterId });
    if (search) query.append('search', search);
    return request<TrusteeRegisteredMemberDto[]>(`/api/trustee/registered-members?${query.toString()}`);
  },

  getChapterLeadershipMatrix: async (chapterId: string): Promise<ChapterLeadershipMatrixDto> => {
    return request<ChapterLeadershipMatrixDto>(`/api/trustee/chapter-leadership/${encodeURIComponent(chapterId)}`);
  },

  assignChapterLeadership: async (data: {
    chapterId: string;
    memberIdentifier: string;
    position: string;
    remarks?: string;
    trusteeActor?: string;
  }): Promise<{ success: boolean; message: string; leader: ChapterLeaderItemDto }> => {
    return request<{ success: boolean; message: string; leader: ChapterLeaderItemDto }>('/api/trustee/assign-leadership', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  relieveChapterLeadership: async (data: {
    chapterId: string;
    leaderId: string;
    reason: string;
    trusteeActor?: string;
  }): Promise<{ success: boolean; message: string; leader: ChapterLeaderItemDto }> => {
    return request<{ success: boolean; message: string; leader: ChapterLeaderItemDto }>('/api/trustee/relieve-leadership', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  suspendChapterLeadership: async (data: {
    chapterId: string;
    leaderId: string;
    reason: string;
    suspendMembership?: boolean;
    trusteeActor?: string;
  }): Promise<{ success: boolean; message: string; leader: ChapterLeaderItemDto }> => {
    return request<{ success: boolean; message: string; leader: ChapterLeaderItemDto }>('/api/trustee/suspend-leadership', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reinstateChapterLeadership: async (data: {
    chapterId: string;
    leaderId: string;
    remarks?: string;
    trusteeActor?: string;
  }): Promise<{ success: boolean; message: string; leader: ChapterLeaderItemDto }> => {
    return request<{ success: boolean; message: string; leader: ChapterLeaderItemDto }>('/api/trustee/reinstate-leadership', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export interface TrustPaymentItemDto {
  paymentId: string;
  registrationId?: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  businessName: string;
  chapterId: string;
  chapterName: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  transactionId: string;
  proofUrl?: string;
  status: string;
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
  rejectionReason?: string;
  isLocked: boolean;
  source: string;
}

export interface ChapterSummaryBreakdownDto {
  chapterId: string;
  chapterName: string;
  count: number;
  totalAmount: number;
  pendingCount: number;
  verifiedCount: number;
}

export interface TrustPaymentsResponseDto {
  scope: string;
  totalCount: number;
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  pendingAmount: number;
  verifiedAmount: number;
  rejectedAmount: number;
  chapterBreakdown: ChapterSummaryBreakdownDto[];
  payments: TrustPaymentItemDto[];
}

export interface ScopedMemberItemDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  categoryId?: string | null;
  chapterId: string;
  chapterName: string;
  status: string;
  registeredBy?: string | null;
  registeredByPosition?: string | null;
  createdAt: string;
  source: string;
}

export interface ScopedMembersResponseDto {
  scope: string;
  leaderPosition: string;
  isReadOnly: boolean;
  count: number;
  members: ScopedMemberItemDto[];
}

export interface TrusteeChapterItemDto {
  id: string;
  name: string;
  regionId?: string | null;
  stateId?: string | null;
  status: string;
  memberCount: number;
  leadershipStatus: {
    president: { id: string; fullName: string; email: string; phone?: string } | null;
    vicePresident: { id: string; fullName: string; email: string; phone?: string } | null;
    secretary: { id: string; fullName: string; email: string; phone?: string } | null;
    memberCoordinator: { id: string; fullName: string; email: string; phone?: string } | null;
    isFullyStaffed: boolean;
  };
}

export interface TrusteeRegisteredMemberDto {
  memberIdentifier: string;
  fullName: string;
  email: string;
  phone?: string;
  businessName?: string;
  chapterId: string;
  chapterName: string;
  currentPosition: string;
  isAlreadyLeader: boolean;
  onboardingStatus: string;
  isRegisteredAndActive: boolean;
  registeredAt: string;
}

export interface ChapterLeaderItemDto {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  position: string;
  role: string;
  isActive: boolean;
  relievedAt?: string;
  suspendedAt?: string;
  status: 'ACTIVE' | 'RELIEVED' | 'SUSPENDED';
  actionReason?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterLeadershipMatrixDto {
  chapter: {
    id: string;
    name: string;
    regionId?: string;
    stateId?: string;
    status: string;
  };
  positions: {
    president: ChapterLeaderItemDto | null;
    vicePresident: ChapterLeaderItemDto | null;
    secretary: ChapterLeaderItemDto | null;
    memberCoordinator: ChapterLeaderItemDto | null;
  };
  history: ChapterLeaderItemDto[];
}

