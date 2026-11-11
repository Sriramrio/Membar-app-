export interface ChapterDto {
  id: string;
  name: string;
  code?: string | null;
  regionId?: string | null;
  stateId?: string | null;
  status: string;
  createdAt: string;
  image?: string | null;
  logo?: string | null;
}

export interface MemberRoleAssignmentDto {
  id: string;
  memberId: string;
  fullName?: string;
  email?: string;
  chapterId?: string;
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

export interface VerifiedMemberDto {
  memberIdentifier: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  chapterId: string;
  paymentStatus: string;
  amountPaid: number;
  onboardingStatus: string;
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
  chapterName?: string | null;
  payment?: PaymentRecordDto | null;
  documentVerification?: DocumentVerificationDto | null;
  approvals: ChapterApprovalDto[];
  groupMembership?: ChapterGroupMemberDto | null;
}

import { API_BASE } from './api';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('sethu:token') || localStorage.getItem('sethu:token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const targetBase = API_BASE ? API_BASE.replace(/\/+$/, '') : '';
  const fullUrl = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `${targetBase}${url.startsWith('/') ? '' : '/'}${url}`;

  const res = await fetch(fullUrl, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeader(),
      ...(init?.headers ?? {}),
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
  getChapters: async (): Promise<ChapterDto[]> => {
    return request<ChapterDto[]>('/api/chapters?all=true');
  },

  createChapter: async (data: {
    name: string;
    regionId?: string;
    stateId?: string;
    status?: string;
    image?: string;
    logo?: string;
    chapterImage?: string;
    chapterLogo?: string;
  }): Promise<ChapterDto> => {
    return request<ChapterDto>('/api/chapters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getChapterMembers: async (chapterId: string): Promise<ChapterGroupMemberDto[]> => {
    return request<ChapterGroupMemberDto[]>(`/api/chapters/${encodeURIComponent(chapterId)}/members`);
  },

  getVerifiedMembers: async (chapterId: string): Promise<VerifiedMemberDto[]> => {
    return request<VerifiedMemberDto[]>(`/api/chapters/${encodeURIComponent(chapterId)}/verified-members`);
  },

  assignRole: async (data: {
    memberId: string;
    chapterId: string;
    roleId: string;
    validUntil?: string;
  }): Promise<MemberRoleAssignmentDto> => {
    return request<MemberRoleAssignmentDto>('/api/roles/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getChapterRoles: async (chapterId: string): Promise<MemberRoleAssignmentDto[]> => {
    return request<MemberRoleAssignmentDto[]>(`/api/roles/chapter/${encodeURIComponent(chapterId)}`);
  },

  registerMember: async (data: {
    fullName: string;
    email: string;
    phone: string;
    businessName: string;
    categoryId?: string;
    chapterId: string;
    userId?: string;
  }): Promise<MemberRegistrationDto> => {
    return request<MemberRegistrationDto>('/api/members/register', {
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

  getCoordinatorQueue: async (): Promise<CoordinatorQueueItemDto[]> => {
    return request<CoordinatorQueueItemDto[]>('/api/onboarding/coordinator/queue');
  },

  verifyDocument: async (data: {
    registrationId: string;
    documentUrl: string;
    verifiedBy: string;
    isApproved: boolean;
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
    isApproved: boolean;
    remarks?: string;
  }): Promise<ChapterApprovalDto> => {
    return request<ChapterApprovalDto>('/api/onboarding/executive/approve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getOnboardingStatus: async (registrationId: string): Promise<OnboardingStatusDetailDto> => {
    return request<OnboardingStatusDetailDto>(`/api/onboarding/status/${encodeURIComponent(registrationId)}`);
  },

  // Leadership Credential & Account Management
  getLeaders: async (params?: { organizationId?: string; chapterId?: string; position?: string; isActive?: boolean }): Promise<ChapterLeaderDto[]> => {
    const q = new URLSearchParams();
    if (params?.organizationId) q.append('organizationId', params.organizationId);
    if (params?.chapterId) q.append('chapterId', params.chapterId);
    if (params?.position) q.append('position', params.position);
    if (params?.isActive !== undefined) q.append('isActive', String(params.isActive));
    return request<ChapterLeaderDto[]>(`/api/platform-admin/leaders?${q.toString()}`);
  },

  createLeader: async (data: CreateLeaderPayload): Promise<CreateLeaderResponse> => {
    return request<CreateLeaderResponse>('/api/platform-admin/leaders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateLeader: async (id: string, data: { fullName?: string; phone?: string; isActive: boolean }): Promise<any> => {
    return request(`/api/platform-admin/leaders/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deactivateLeader: async (id: string): Promise<any> => {
    return request(`/api/platform-admin/leaders/${encodeURIComponent(id)}/deactivate`, {
      method: 'POST',
    });
  },

  resetLeaderPassword: async (id: string, newPassword?: string): Promise<{ success: boolean; message: string; credentials: { username: string; temporaryPassword: string; mustChangePassword: boolean } }> => {
    return request(`/api/platform-admin/leaders/${encodeURIComponent(id)}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },
};

export interface ChapterLeaderDto {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  position: string;
  role: string;
  organizationId: string;
  chapterId?: string | null;
  chapterName?: string;
  mustChangePassword: boolean;
  isActive: boolean;
  isLocked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLeaderPayload {
  fullName: string;
  email: string;
  phone?: string;
  position: string;
  organizationId: string;
  chapterId?: string | null;
  customInitialPassword?: string;
}

export interface CreateLeaderResponse {
  success: boolean;
  message: string;
  leader: ChapterLeaderDto;
  credentials: {
    username: string;
    temporaryPassword: string;
    mustChangePassword: boolean;
    scope: string;
    message: string;
  };
}

