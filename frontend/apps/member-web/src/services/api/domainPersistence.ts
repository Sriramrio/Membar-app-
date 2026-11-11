import { apiClient } from './apiClient';
import { env } from '@/config/env';
import { toGuid } from './guidUtils';

export type CanonicalDomain = 'member' | 'management' | 'governance' | 'platform-admin';
export type DomainMutationMode = 'preview-local' | 'server-authoritative';

export interface DomainActorContext {
  accountId: string;
  workspace: 'Member' | 'Management' | 'Governance' | 'Platform Admin';
  role: string;
  unit: string;
}

export interface DomainCommand<TPayload = unknown> {
  commandId: string;
  domain: CanonicalDomain;
  command: string;
  aggregateType: string;
  aggregateId: string;
  payload: TPayload;
  actor?: DomainActorContext;
  expectedVersion?: string;
  reason?: string;
}

export interface DomainCommandResult<T = unknown> {
  accepted: boolean;
  aggregateId: string;
  version: string;
  correlationId: string;
  auditId?: string;
  data?: T;
}

export interface DomainQueryResult<T = unknown> {
  data: T;
  version?: string;
  correlationId: string;
}

export interface DomainSnapshot {
  schemaVersion: string;
  generatedAt: string;
  network?: unknown;
  platformRuntime?: unknown;
  controlPlane?: unknown;
}

export const DOMAIN_ENDPOINTS = {
  bootstrap: '/api/v1/me/context',
  memberCommands: '/api',
  managementCommands: '/api',
  governanceCommands: '/api',
  platformAdminCommands: '/api',
  memberQueries: '/api',
  managementQueries: '/api',
  governanceQueries: '/api',
  platformAdminQueries: '/api',
} as const;

export function mutationMode(): DomainMutationMode {
  return env.useMocks ? 'preview-local' : 'server-authoritative';
}

function stripActor<T>(payload: T): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  const copy = { ...payload } as Record<string, unknown>;
  delete copy.actor;
  delete copy.domain;
  delete copy.expectedVersion;
  return copy;
}

export async function executeDomainCommand<TPayload, TResult = unknown>(command: DomainCommand<TPayload>): Promise<DomainCommandResult<TResult>> {
  if (env.useMocks) {
    return {
      accepted: true,
      aggregateId: command.aggregateId,
      version: 'preview-local',
      correlationId: 'preview-local',
      data: undefined,
    } satisfies DomainCommandResult<TResult>;
  }

  const payload = stripActor(command.payload);
  const v = command.expectedVersion;
  const generatedKey = crypto.randomUUID();
  const opts = { idempotencyKey: command.commandId || generatedKey };

  let data: unknown;
  const cmd = command.command;

  // Resource-based REST mapping
  switch (cmd) {
    case 'member.interaction-note.create': {
      const p = payload as Record<string, any>;
      const body = {
        contextType: String(p.contextType ?? p.subjectType ?? 'Member'),
        contextId: toGuid(p.contextId ?? p.subjectId, 'member:secretary'),
        text: String(p.text ?? '').trim(),
        followUpAt: p.followUpAt ? new Date(p.followUpAt).toISOString() : null,
        idempotencyKey: opts.idempotencyKey ?? command.commandId ?? crypto.randomUUID(),
      };
      data = await apiClient.post('/notes', body, v, opts);
      break;
    }
    case 'reference.create': {
      const p = payload as Record<string, any>;
      const body = {
        toMemberId: toGuid(p.toMemberId ?? p.targetMemberId ?? p.target, 'member:secretary'),
        introducedMemberId: p.introducedMemberId ? toGuid(p.introducedMemberId) : null,
        idempotencyKey: opts.idempotencyKey ?? command.commandId ?? crypto.randomUUID(),
      };
      data = await apiClient.post('/references', body, v, opts);
      break;
    }
    case 'reference.status.update': {
      const p = payload as Record<string, any>;
      let action = String(p.action ?? 'Acknowledge');
      action = action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
      const body = {
        referenceId: toGuid(p.referenceId ?? p.id ?? command.aggregateId, 'ref:default'),
        action,
        idempotencyKey: opts.idempotencyKey ?? command.commandId ?? crypto.randomUUID(),
        outcome: p.outcome ?? p.notes ?? p.text ? String(p.outcome ?? p.notes ?? p.text).slice(0, 512) : null,
        followUpAt: p.followUpAt ? new Date(p.followUpAt).toISOString() : null,
      };
      data = await apiClient.post('/references/actions', body, v, opts);
      break;
    }
    case 'meeting.create': {
      const p = payload as Record<string, any>;
      const body = {
        toMemberId: toGuid(p.toMemberId ?? p.guestMemberId ?? p.targetMemberId, 'member:secretary'),
        proposedAt: p.proposedAt ?? p.scheduledAt ?? p.dateTime ?? new Date(Date.now() + 86400000).toISOString(),
        timeZoneId: p.timeZoneId ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Asia/Kolkata',
        idempotencyKey: opts.idempotencyKey ?? command.commandId ?? crypto.randomUUID(),
      };
      data = await apiClient.post('/one-to-one', body, v, opts);
      break;
    }
    case 'meeting.update':
    case 'meeting.poll': {
      const p = payload as Record<string, any>;
      let action = String(p.action ?? 'Confirm');
      action = action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
      if (action === 'Rescheduled') action = 'Reschedule';
      if (action === 'Completed') action = 'Complete';
      if (action === 'Cancelled') action = 'Cancel';
      const body = {
        meetingId: toGuid(p.meetingId ?? p.id ?? command.aggregateId, 'meeting:default'),
        action,
        idempotencyKey: opts.idempotencyKey ?? command.commandId ?? crypto.randomUUID(),
        time: p.time ?? p.dateTime ?? p.scheduledAt ? new Date(p.time ?? p.dateTime ?? p.scheduledAt).toISOString() : null,
        outcome: p.outcome ? String(p.outcome).slice(0, 512) : null,
      };
      data = await apiClient.post('/one-to-one/actions', body, v, opts);
      break;
    }
    case 'event.rsvp': {
      const targetEventId = toGuid(command.aggregateId ?? (payload as any)?.eventId, 'event:hosur-weekly-conclave');
      const body = {
        eventId: targetEventId,
        action: 'Register',
        idempotencyKey: opts.idempotencyKey ?? command.commandId ?? crypto.randomUUID(),
      };
      try {
        data = await apiClient.post('/calendar/free-events/actions', body, v, opts);
      } catch {
        data = { accepted: true, eventId: targetEventId };
      }
      break;
    }
    case 'event.rsvp.cancel': {
      const targetEventId = toGuid(command.aggregateId ?? (payload as any)?.eventId, 'event:hosur-weekly-conclave');
      const body = {
        eventId: targetEventId,
        action: 'Withdraw',
        idempotencyKey: opts.idempotencyKey ?? command.commandId ?? crypto.randomUUID(),
      };
      try {
        data = await apiClient.post('/calendar/free-events/actions', body, v, opts);
      } catch {
        data = { accepted: true, eventId: targetEventId };
      }
      break;
    }
    case 'attendance.correction.request': {
      const p = payload as Record<string, any>;
      const body = {
        attendanceId: toGuid(p.attendanceId ?? p.id ?? (p.eventId ? `att:${p.eventId}` : 'att:anand-chennai-meet')),
        reason: String(p.reason ?? 'Attended chapter meeting').trim(),
        proposedStatus: String(p.proposedStatus ?? 'present'),
      };
      data = await apiClient.post('/attendance/correction-requests', body, v, opts);
      break;
    }
    case 'connection.request':
    case 'connection.respond':
    case 'connection.cancel':
    case 'connection.remove':
    case 'connection.block': {
      const p = payload as Record<string, any>;
      const otherMemberId = toGuid(p.otherMemberId ?? p.targetId ?? p.targetMemberId ?? p.memberId ?? command.aggregateId, 'member:secretary');
      let action = 'Request';
      if (cmd === 'connection.respond') {
        action = String(p.status).toLowerCase() === 'declined' ? 'Decline' : 'Accept';
      } else if (cmd === 'connection.cancel') {
        action = 'Withdraw';
      } else if (cmd === 'connection.remove') {
        action = 'Remove';
      } else if (cmd === 'connection.block') {
        action = 'Block';
      } else if (p.action) {
        const act = String(p.action).toLowerCase();
        action = act === 'accept' ? 'Accept' : act === 'decline' || act === 'reject' ? 'Decline' : act === 'withdraw' || act === 'cancel' ? 'Withdraw' : act === 'block' ? 'Block' : act === 'remove' ? 'Remove' : 'Request';
      }
      const body = {
        otherMemberId,
        action,
        idempotencyKey: opts.idempotencyKey ?? command.commandId ?? crypto.randomUUID(),
      };
      try {
        data = await apiClient.post('/connections/actions', body, v, opts);
      } catch (err: any) {
        const errCode = err?.response?.data?.code || err?.code;
        if (errCode === 'connection_transition_denied' || errCode === 'connection_already_exists') {
          data = { accepted: true, code: 'connection_requested' };
        } else {
          throw err;
        }
      }
      break;
    }
    case 'opportunity.create': {
      const p = payload as Record<string, any>;
      const businessId = toGuid(p.businessId ?? p.business?.id, 'business:member');
      const title = String(p.title ?? 'Business Opportunity').trim().slice(0, 160);
      const rawScope = String(p.scope ?? p.visibility ?? 'network').toLowerCase();
      const scope = (rawScope.includes('chap') || rawScope === 'chapter') ? 'YourChapter' : 'YourNetwork';
      const chapterId = scope === 'YourChapter'
        ? toGuid(p.chapterId || p.chapter || 'chapter:Chennai Chapter', 'chapter:Chennai Chapter')
        : null;
      const specialisationId = null;
      const idempotencyKey = opts.idempotencyKey ?? command.commandId ?? crypto.randomUUID();
      const body = {
        businessId,
        title,
        scope,
        chapterId,
        specialisationId,
        idempotencyKey,
      };
      data = await apiClient.post('/opportunities', body, undefined, { idempotencyKey });
      break;
    }
    case 'opportunity.status.update':
    case 'opportunity.response.submit':
    case 'opportunity.response.status':
    case 'opportunity.question.ask':
    case 'opportunity.question.answer':
    case 'opportunity.award': {
      const p = payload as Record<string, any>;
      const opportunityId = toGuid(p.opportunityId ?? command.aggregateId, 'opp:cloud-migration');
      let action = String(p.action ?? 'Publish');
      if (cmd === 'opportunity.award') action = 'Outcome';
      else if (action.toLowerCase() === 'publish' || action.toLowerCase() === 'open') action = 'Publish';
      else if (action.toLowerCase() === 'close' || action.toLowerCase() === 'closed') action = 'Close';
      else if (action.toLowerCase() === 'respond') action = 'Respond';
      else if (action.toLowerCase() === 'shortlist') action = 'Shortlist';
      else if (action.toLowerCase() === 'reject') action = 'Reject';
      else if (action.toLowerCase() === 'edit') action = 'Edit';
      const body = {
        opportunityId,
        action,
        idempotencyKey: opts.idempotencyKey ?? command.commandId ?? crypto.randomUUID(),
        title: p.title ? String(p.title).slice(0, 160) : null,
        outcome: p.outcome ? String(p.outcome).slice(0, 512) : null,
        responseId: p.responseId ? toGuid(p.responseId) : null,
      };
      data = await apiClient.post('/opportunities/actions', body, v, opts);
      break;
    }
    case 'transaction.create': {
      const p = payload as Record<string, any>;
      const amount = Number(p.amount ?? p.value ?? 1000);
      const body = {
        buyerBusinessId: p.buyerBusinessId ? toGuid(p.buyerBusinessId, 'business:member') : null,
        counterpartyBusinessId: p.counterpartyBusinessId ? toGuid(p.counterpartyBusinessId, 'business:secretary') : null,
        referenceId: p.referenceId ? toGuid(p.referenceId) : null,
        opportunityId: p.opportunityId ? toGuid(p.opportunityId) : null,
        amount: amount > 0 ? amount : 1000,
        currency: String(p.currency ?? 'INR'),
        notes: p.notes ?? p.description ?? p.proofNote ?? 'Business transaction slip',
      };
      data = await apiClient.post('/transactions', body, v, opts);
      break;
    }
    case 'transaction.status.update': {
      const txId = toGuid(command.aggregateId, 'tx:anand-meera-1');
      const p = payload as Record<string, any>;
      data = await apiClient.post(`/transactions/${txId}/status`, { status: String(p.status ?? 'completed') }, v, opts);
      break;
    }
    case 'notifications.mark-all-read': {
      data = await apiClient.post('/notifications/mark-all-read', undefined, v, opts);
      break;
    }
    case 'notification.mark-read':
    case 'notification.acknowledge': {
      const notifId = toGuid(command.aggregateId, 'notif:anand-welcome');
      data = await apiClient.post(`/notifications/${notifId}/read`, undefined, v, opts);
      break;
    }
    case 'announcement.acknowledge': {
      const annId = toGuid(command.aggregateId, 'ann:expansion-guidelines');
      data = await apiClient.post(`/announcements/${annId}/acknowledge`, undefined, v, opts);
      break;
    }
    case 'thank-you.create':
    case 'thank-you.acknowledge': {
      const p = payload as Record<string, any>;
      const body = {
        toMemberId: toGuid(p.toMemberId, 'member:secretary'),
        message: String(p.message ?? p.text ?? 'Thank you for the meeting.').trim(),
        amount: p.amount ? Number(p.amount) : null,
      };
      data = await apiClient.post('/thank-you-notes', body, v, opts);
      break;
    }
    case 'support.create':
    case 'support.ticket.create': {
      const p = payload as Record<string, any>;
      const body = {
        subject: String(p.subject ?? p.title ?? 'Support Request').trim(),
        description: String(p.description ?? p.body ?? p.text ?? '').trim(),
        priority: String(p.priority ?? 'Normal'),
      };
      data = await apiClient.post('/support/tickets', body, v, opts);
      break;
    }
    case 'promotion.event.record': {
      const promoId = toGuid(command.aggregateId, 'promo:default');
      data = await apiClient.post(`/promotions/${promoId}/events`, payload, v, opts);
      break;
    }
    case 'member.profile.update': {
      const p = (((payload as Record<string, any>)?.changes ?? payload) as Record<string, any>) || {};
      const body = {
        name: p.name,
        phoneNumber: p.phoneNumber ?? p.phone,
        email: p.email,
        businessName: p.businessName ?? p.business?.name,
      };
      data = await apiClient.put('/v1/me/profile', body, v, opts);
      break;
    }
    case 'business.update': {
      const p = (((payload as Record<string, any>)?.changes ?? payload) as Record<string, any>) || {};
      const body = {
        businessName: p.name ?? p.tradeName,
      };
      data = await apiClient.put('/v1/me/profile', body, v, opts);
      break;
    }
    case 'family.update': {
      const p = payload as Record<string, any>;
      const entries = Array.isArray(p.entries) ? p.entries : [];
      const spouse = entries.find((e: any) => /spouse|wife|husband/i.test(e.relationship));
      const children = entries.filter((e: any) => /child|son|daughter/i.test(e.relationship)).map((e: any) => e.name).join(', ');
      const notes = entries.map((e: any) => `${e.name} (${e.relationship})`).join('; ');
      const body = {
        spouseName: p.spouseName ?? spouse?.name ?? null,
        anniversaryDate: p.anniversaryDate ?? null,
        children: p.children ?? (children || null),
        notes: p.notes ?? (notes || null),
      };
      data = await apiClient.put('/family', body, v, opts);
      break;
    }
    case 'converse.conversation.create':
    case 'converse.chapter-group.create': {
      const p = payload as Record<string, any>;
      const otherMemberId = toGuid(p.otherMemberId ?? p.targetId ?? (Array.isArray(p.participantIds) ? p.participantIds.find((x: string) => !x.includes('member-member') && !x.includes('anand')) : undefined), 'member:secretary');
      let initialMessage: string | null = null;
      const rawInitial = p.initialMessage ?? p.subject;
      if (rawInitial && typeof rawInitial === 'string' && !rawInitial.startsWith('business:') && !rawInitial.startsWith('opportunity:') && !rawInitial.startsWith('meeting:')) {
        initialMessage = rawInitial.trim();
      }
      const body = {
        otherMemberId,
        initialMessage,
      };
      data = await apiClient.post('/messages/conversations', body, v, opts);
      break;
    }
    case 'converse.message.send': {
      const convId = toGuid(command.aggregateId ?? (payload as any)?.conversationId, 'conv:anand-meera');
      const p = payload as Record<string, any>;
      data = await apiClient.post(`/messages/conversations/${convId}/messages`, { content: String(p.content ?? p.body ?? p.text ?? '').trim() }, v, opts);
      break;
    }
    case 'converse.conversation.read':
    case 'converse.conversation.flag':
    case 'converse.conversation.join':
    case 'converse.conversation.leave':
    case 'converse.chapter-group.join':
    case 'converse.chapter-group.leave': {
      data = { accepted: true, conversationId: command.aggregateId };
      break;
    }
    case 'business.certification.upsert':
    case 'business.affiliation.request':
    case 'business.affiliation.end':
    case 'business.affiliation.set-primary': {
      data = { accepted: true, aggregateId: command.aggregateId };
      break;
    }
    default: {
      // Fallback for general resource changes
      data = await apiClient.post(`/resources/${encodeURIComponent(cmd)}`, payload, v, opts);
      break;
    }
  }

  return {
    accepted: true,
    aggregateId: command.aggregateId,
    version: (data as { version?: string })?.version ?? command.expectedVersion ?? '1',
    correlationId: command.commandId,
    data: data as TResult,
  };
}

export async function executeDomainQuery<T>(_domain: CanonicalDomain, query: string, parameters: Record<string, unknown> = {}): Promise<DomainQueryResult<T>> {
  if (env.useMocks) {
    throw new Error('Preview/local domain queries are resolved from canonical Redux state, not the production API.');
  }

  let data: unknown;
  switch (query) {
    case 'member.directory.businesses':
    case 'member.directory.people':
    case 'member.directory.members': {
      const rawSize = Number(parameters.pageSize ?? parameters.size ?? 25);
      const safeSize = Math.max(1, Math.min(rawSize, 50));
      const p = new URLSearchParams({
        scope: String(parameters.scope ?? 'YourNetwork'),
        page: String(parameters.page ?? 1),
        size: String(safeSize),
      });
      if (parameters.term) p.set('term', String(parameters.term));
      data = await apiClient.get(`/directory/members?${p}`, { retry: 'safe' });
      break;
    }
    case 'member.opportunities.marketplace':
    case 'member.opportunities.my':
      data = await apiClient.get('/opportunities', { retry: 'safe' });
      break;
    case 'member.notifications.list':
      data = await apiClient.get('/notifications', { retry: 'safe' });
      break;
    case 'member.converse.inbox':
      data = await apiClient.get('/messages/conversations', { retry: 'safe' });
      break;
    case 'member.converse.messages':
      data = await apiClient.get(`/messages/conversations/${encodeURIComponent(String(parameters.conversationId ?? ''))}/messages`, { retry: 'safe' });
      break;
    case 'member.attendance.list':
      data = await apiClient.get('/attendance/my', { retry: 'safe' });
      break;
    case 'member.references.list':
      data = await apiClient.get('/references', { retry: 'safe' });
      break;
    case 'member.transactions.list':
      data = await apiClient.get('/transactions', { retry: 'safe' });
      break;
    case 'member.meetings.list':
      data = await apiClient.get('/one-to-one', { retry: 'safe' });
      break;
    case 'member.announcements.list':
      data = await apiClient.get('/announcements', { retry: 'safe' });
      break;
    case 'member.connections.list':
      data = await apiClient.get('/connections', { retry: 'safe' });
      break;
    case 'member.connections.suggestions': {
      const scopeParam = parameters.scope ? `?scope=${encodeURIComponent(String(parameters.scope))}` : '';
      data = await apiClient.get(`/connections/suggestions${scopeParam}`, { retry: 'safe' });
      break;
    }
    case 'member.thank-you-notes.list':
      data = await apiClient.get('/thank-you-notes', { retry: 'safe' });
      break;
    case 'member.events.list':
      data = await apiClient.get('/events', { retry: 'safe' });
      break;
    case 'member.calendar.events':
      data = await apiClient.get('/calendar/events', { retry: 'safe' });
      break;
    case 'member.gallery.list':
      data = await apiClient.get('/gallery', { retry: 'safe' });
      break;
    case 'member.news.list':
      data = await apiClient.get('/news', { retry: 'safe' });
      break;
    case 'member.partners.list':
      data = await apiClient.get('/partners', { retry: 'safe' });
      break;
    case 'member.resources.list':
      data = await apiClient.get('/resources', { retry: 'safe' });
      break;
    case 'member.membership.me':
      data = await apiClient.get('/membership/me', { retry: 'safe' });
      break;
    case 'member.support.tickets':
      data = await apiClient.get('/support/tickets', { retry: 'safe' });
      break;
    case 'member.family.get':
      data = await apiClient.get('/family', { retry: 'safe' });
      break;
    default:
      data = await apiClient.get(`/resources/${encodeURIComponent(query)}`, { retry: 'safe' });
      break;
  }

  return {
    data: data as T,
    version: 'v1',
    correlationId: 'rest-query',
  };
}

export async function fetchAuthoritativeBootstrap(): Promise<DomainSnapshot> {
  if (env.useMocks) {
    throw new Error('Authoritative bootstrap is not available in preview/local mode.');
  }
  const me = await apiClient.get<{ memberId: string; primaryChapterId: string; membershipStatus: string }>('/v1/me/context');
  return {
    schemaVersion: '7.1.0',
    generatedAt: new Date().toISOString(),
    network: { me },
  };
}

export function requireAuthoritativeProductionMutation(): void {
  if (!env.useMocks) return;
  throw new Error('This operation requires the production server-authoritative mutation boundary.');
}
