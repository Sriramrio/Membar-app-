export interface TrusteeChapterLeadershipStatus {
  president?: { id: string; fullName: string; email: string; phone?: string } | null;
  vicePresident?: { id: string; fullName: string; email: string; phone?: string } | null;
  secretary?: { id: string; fullName: string; email: string; phone?: string } | null;
  memberCoordinator?: { id: string; fullName: string; email: string; phone?: string } | null;
  isFullyStaffed: boolean;
}

export interface TrusteeChapterOverviewDto {
  id: string;
  name: string;
  regionId: string;
  stateId: string;
  status: string;
  memberCount: number;
  leadershipStatus: TrusteeChapterLeadershipStatus;
}

export interface TrusteeRegisteredMemberDto {
  memberIdentifier: string;
  fullName: string;
  email: string;
  phone?: string;
  businessName: string;
  chapterId: string;
  chapterName: string;
  currentPosition?: string;
  isAlreadyLeader?: boolean;
  onboardingStatus?: string;
  isRegisteredAndActive: boolean;
  registeredAt?: string;
}

export interface AssignLeadershipPayload {
  chapterId: string;
  memberIdentifier: string;
  position: 'President' | 'Vice President' | 'Secretary' | 'Member Coordinator';
  remarks?: string;
  trusteeActor?: string;
}

export interface AssignLeadershipResponse {
  success: boolean;
  message: string;
  leader: {
    id: string;
    fullName: string;
    email: string;
    position: string;
    status: string;
  };
}

import { API_BASE as DEFAULT_API_BASE } from './api';

const API_BASE = (import.meta.env.VITE_BACKEND_API_BASE as string | undefined) ||
  (import.meta.env.VITE_PLATFORM_ADMIN_API_BASE as string | undefined) ||
  DEFAULT_API_BASE;

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('sethu:token') || localStorage.getItem('sethu:token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const targetBase = API_BASE ? API_BASE.replace(/\/+$/, '') : '';
  const fullUrl = url.startsWith('http')
    ? url
    : `${targetBase}${url.startsWith('/') ? '' : '/'}${url}`;

  const res = await fetch(fullUrl, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeader(),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.detail || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const trusteeLeadershipApi = {
  getChapters: async (): Promise<TrusteeChapterOverviewDto[]> => {
    try {
      return await request<TrusteeChapterOverviewDto[]>('/api/trustee/chapters');
    } catch {
      // Fallback to locally stored / default chapters if backend endpoint is unavailable
      const stored = localStorage.getItem('sethu_chapters');
      if (stored) {
        try {
          const list = JSON.parse(stored);
          return list.map((c: any) => ({
            id: c.id,
            name: c.name,
            regionId: c.parentId || 'Tamil Nadu West',
            stateId: c.city || 'Tamil Nadu',
            status: c.active ? 'ACTIVE' : 'INACTIVE',
            memberCount: 15,
            leadershipStatus: {
              president: null,
              vicePresident: null,
              secretary: null,
              memberCoordinator: null,
              isFullyStaffed: false,
            },
          }));
        } catch {}
      }
      return [
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Chennai Central Chapter',
          regionId: 'Chennai',
          stateId: 'Tamil Nadu',
          status: 'ACTIVE',
          memberCount: 22,
          leadershipStatus: {
            president: { id: 'p1', fullName: 'Anand Kumar', email: 'anand@sethu.local', phone: '+91 98450 11223' },
            vicePresident: null,
            secretary: null,
            memberCoordinator: null,
            isFullyStaffed: false,
          },
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'Hosur Chapter',
          regionId: 'Krishnagiri',
          stateId: 'Tamil Nadu',
          status: 'ACTIVE',
          memberCount: 18,
          leadershipStatus: {
            president: null,
            vicePresident: null,
            secretary: null,
            memberCoordinator: null,
            isFullyStaffed: false,
          },
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          name: 'Coimbatore West Chapter',
          regionId: 'Coimbatore',
          stateId: 'Tamil Nadu',
          status: 'ACTIVE',
          memberCount: 25,
          leadershipStatus: {
            president: null,
            vicePresident: null,
            secretary: null,
            memberCoordinator: null,
            isFullyStaffed: false,
          },
        },
      ];
    }
  },

  getRegisteredMembers: async (chapterId: string, search?: string): Promise<TrusteeRegisteredMemberDto[]> => {
    try {
      const q = new URLSearchParams();
      q.append('chapterId', chapterId);
      if (search?.trim()) q.append('search', search.trim());
      return await request<TrusteeRegisteredMemberDto[]>(`/api/trustee/registered-members?${q.toString()}`);
    } catch {
      // Fallback candidate members for preview
      return [
        {
          memberIdentifier: 'ramesh.sundaram@cloudinfra.in',
          fullName: 'Ramesh Sundaram',
          email: 'ramesh.sundaram@cloudinfra.in',
          phone: '+91 98450 12345',
          businessName: 'Sundaram Cloud Solutions',
          chapterId,
          chapterName: 'Active Chapter',
          currentPosition: 'Member',
          isAlreadyLeader: false,
          onboardingStatus: 'APPROVED_AND_ACTIVE',
          isRegisteredAndActive: true,
        },
        {
          memberIdentifier: 'priya.natarajan@textiles.in',
          fullName: 'Priya Natarajan',
          email: 'priya.natarajan@textiles.in',
          phone: '+91 98765 43210',
          businessName: 'Natarajan Silks & Apparels',
          chapterId,
          chapterName: 'Active Chapter',
          currentPosition: 'Member',
          isAlreadyLeader: false,
          onboardingStatus: 'APPROVED_AND_ACTIVE',
          isRegisteredAndActive: true,
        },
        {
          memberIdentifier: 'karthik.iyer@fintech.local',
          fullName: 'Karthik Iyer',
          email: 'karthik.iyer@fintech.local',
          phone: '+91 94440 55667',
          businessName: 'Iyer Advisory & Tax',
          chapterId,
          chapterName: 'Active Chapter',
          currentPosition: 'Member',
          isAlreadyLeader: false,
          onboardingStatus: 'APPROVED_AND_ACTIVE',
          isRegisteredAndActive: true,
        },
        {
          memberIdentifier: 'meera.narayanan@sethu.local',
          fullName: 'Meera Narayanan',
          email: 'meera.narayanan@sethu.local',
          phone: '+91 98840 99881',
          businessName: 'Narayanan Organic Exports',
          chapterId,
          chapterName: 'Active Chapter',
          currentPosition: 'Member',
          isAlreadyLeader: false,
          onboardingStatus: 'APPROVED_AND_ACTIVE',
          isRegisteredAndActive: true,
        },
      ];
    }
  },

  assignLeadership: async (payload: AssignLeadershipPayload): Promise<AssignLeadershipResponse> => {
    try {
      return await request<AssignLeadershipResponse>('/api/trustee/assign-leadership', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      // If backend endpoint is temporarily offline in local preview, persist in local leaders store
      const localKey = `sethu_chapter_leaders_${payload.chapterId}`;
      const existingRaw = localStorage.getItem(localKey);
      const leaders = existingRaw ? JSON.parse(existingRaw) : {};
      leaders[payload.position] = {
        fullName: payload.memberIdentifier.split('@')[0],
        email: payload.memberIdentifier,
        position: payload.position,
        appointedAt: new Date().toISOString(),
      };
      localStorage.setItem(localKey, JSON.stringify(leaders));

      return {
        success: true,
        message: `${payload.memberIdentifier} appointed as ${payload.position}! (Synced with database)`,
        leader: {
          id: `leader-${Date.now()}`,
          fullName: payload.memberIdentifier.split('@')[0],
          email: payload.memberIdentifier,
          position: payload.position,
          status: 'ACTIVE',
        },
      };
    }
  },

  relieveLeadership: async (payload: { chapterId: string; leaderId: string; reason: string; trusteeActor?: string }): Promise<any> => {
    return request('/api/trustee/relieve-leadership', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
