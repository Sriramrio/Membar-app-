import { env } from '@/config/env';

export interface CalendarEntryRecord {
  id: string;
  date: string;
  title: string;
  type: string;
  to: string;
  status?: string;
  owner?: string;
}

export interface OrganisationalEventRecord {
  id: string;
  name: string;
  date: string;
  status: string;
  attendance: number;
  owner: string;
  committeeId?: string;
  programmeId?: string;
  version?: number;
  scope?: { id: string; name: string; level: string };
}

export interface OrganisationalTaskRecord {
  id: string;
  title: string;
  description: string;
  owner: string;
  sourceType: string;
  sourceId: string;
  due: string;
  priority: string;
  status: string;
  version: number;
}

export interface OrganisationalMeetingRecord {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  location?: string;
  status: string;
  version: number;
}

export interface OrganisationalApprovalRecord {
  id: string;
  title: string;
  subject: string;
  requester: string;
  due: string;
  priority: string;
  status: string;
  version: number;
}

const getApiBase = () => env.apiBaseUrl || '/api';

export const organisationalApi = {
  getCalendar: async (scopeId?: string, limit = 50, signal?: AbortSignal) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (scopeId) q.set('scopeId', scopeId);
    const res = await fetch(`${getApiBase()}/organisational/calendar?${q}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal
    });
    if (!res.ok) throw new Error(`Calendar fetch failed: ${res.status}`);
    return await res.json() as { items: CalendarEntryRecord[]; totalEstimate: number; hasMore: boolean };
  },

  getEvents: async (scopeId?: string, limit = 50, signal?: AbortSignal) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (scopeId) q.set('scopeId', scopeId);
    const res = await fetch(`${getApiBase()}/organisational/events?${q}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal
    });
    if (!res.ok) throw new Error(`Events fetch failed: ${res.status}`);
    return await res.json() as { items: OrganisationalEventRecord[]; totalEstimate: number; hasMore: boolean };
  },

  createEvent: async (event: Partial<OrganisationalEventRecord>) => {
    const res = await fetch(`${getApiBase()}/organisational/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    if (!res.ok) throw new Error(`Event creation failed: ${res.status}`);
    return await res.json();
  },

  getTasks: async (scopeId?: string, limit = 50, signal?: AbortSignal) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (scopeId) q.set('scopeId', scopeId);
    const res = await fetch(`${getApiBase()}/organisational/tasks?${q}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal
    });
    if (!res.ok) throw new Error(`Tasks fetch failed: ${res.status}`);
    return await res.json() as { items: OrganisationalTaskRecord[]; totalEstimate: number; hasMore: boolean };
  },

  createTask: async (task: Partial<OrganisationalTaskRecord>) => {
    const res = await fetch(`${getApiBase()}/organisational/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (!res.ok) throw new Error(`Task creation failed: ${res.status}`);
    return await res.json();
  },

  completeTask: async (taskId: string) => {
    const res = await fetch(`${getApiBase()}/organisational/tasks/${taskId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`Task complete failed: ${res.status}`);
    return await res.json();
  },

  getMeetings: async (status?: string, limit = 50, signal?: AbortSignal) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (status) q.set('status', status);
    const res = await fetch(`${getApiBase()}/organisational/meetings?${q}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal
    });
    if (!res.ok) throw new Error(`Meetings fetch failed: ${res.status}`);
    return await res.json() as { items: OrganisationalMeetingRecord[]; totalEstimate: number; hasMore: boolean };
  },

  createMeeting: async (meeting: Partial<OrganisationalMeetingRecord>) => {
    const res = await fetch(`${getApiBase()}/organisational/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meeting)
    });
    if (!res.ok) throw new Error(`Meeting creation failed: ${res.status}`);
    return await res.json();
  },

  getApprovals: async (status?: string, limit = 50, signal?: AbortSignal) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (status) q.set('status', status);
    const res = await fetch(`${getApiBase()}/organisational/approvals?${q}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal
    });
    if (!res.ok) throw new Error(`Approvals fetch failed: ${res.status}`);
    return await res.json() as { items: OrganisationalApprovalRecord[]; totalEstimate: number; hasMore: boolean };
  },

  decideApproval: async (approvalId: string, decision: 'APPROVED' | 'REJECTED', decidedBy: string) => {
    const res = await fetch(`${getApiBase()}/organisational/approvals/${approvalId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, decidedBy })
    });
    if (!res.ok) throw new Error(`Approval decision failed: ${res.status}`);
    return await res.json();
  },

  getHierarchySummary: async (signal?: AbortSignal) => {
    const res = await fetch(`${getApiBase()}/organisational/hierarchy/summary`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal
    });
    if (!res.ok) throw new Error(`Hierarchy summary fetch failed: ${res.status}`);
    return await res.json();
  },

  getContinuitySummary: async (signal?: AbortSignal) => {
    const res = await fetch(`${getApiBase()}/organisational/continuity/summary`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal
    });
    if (!res.ok) throw new Error(`Continuity summary fetch failed: ${res.status}`);
    return await res.json();
  }
};
