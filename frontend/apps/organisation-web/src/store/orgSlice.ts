import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OrgState, OrgAction } from '@/state/OrgStore';
import type { Task, Approval, Message, Handoff, SupportRequest, ActionItem, JobItem, AuditEvent, WorkStatus, OrgScope } from '@/domain/types';
import { stableId } from '@/utils/ids';
import { serverClock } from '@/services/serverClock';
import { canTaskTransition, canPublishMom } from '@/domain/stateMachines';

export const initialOrgState: OrgState = {
  tasks: [],
  actions: [],
  approvals: [],
  conversations: [],
  messages: [],
  members: [],
  units: [],
  committees: [],
  meetings: [],
  cases: [],
  programmes: [],
  events: [],
  support: [],
  escalations: [],
  handoffs: [],
  operationalExceptions: [],
  risks: [],
  issues: [],
  decisions: [],
  jobs: [],
  documents: [],
  people: [],
  goals: [],
  communications: [],
  feedback: [],
  dataQuality: [],
  notifications: [],
  alerts: [],
  assignments: [],
  chapterCoordinatorResponsibilities: [],
  audits: [],
};

export const orgSlice = createSlice({
  name: 'org',
  initialState: initialOrgState,
  reducers: {
    setOrgState: (_state, action: PayloadAction<OrgState>) => {
      return action.payload;
    },
    patchOrgState: (state, action: PayloadAction<Partial<OrgState>>) => {
      Object.assign(state, action.payload);
    },
    taskStatusChanged: (state, action: PayloadAction<{ id: string; status: WorkStatus }>) => {
      const task = state.tasks.find((x) => x.id === action.payload.id);
      if (task && canTaskTransition(task.status, action.payload.status)) {
        task.status = action.payload.status;
        task.version += 1;
      }
    },
    taskAdded: (state, action: PayloadAction<Omit<Task, 'id' | 'version' | 'timeline'> & { scope?: OrgScope }>) => {
      const defaultScope: OrgScope = action.payload.scope ?? { id: 'SCOPE-DEFAULT', name: 'Default', level: 'CHAPTER' };
      const newTask: Task = {
        ...action.payload,
        id: stableId('task'),
        version: 1,
        scope: defaultScope,
        timeline: [],
      };
      state.tasks.unshift(newTask);
    },
    approvalChanged: (state, action: PayloadAction<{ id: string; status: Approval['status']; reason?: string }>) => {
      const app = state.approvals.find((x) => x.id === action.payload.id);
      if (app) {
        app.status = action.payload.status;
        if (action.payload.reason) app.decisionReason = action.payload.reason;
        app.version += 1;
      }
    },
    approvalAdded: (state, action: PayloadAction<Approval>) => {
      state.approvals.unshift(action.payload);
    },
    messageSent: (state, action: PayloadAction<{ conversationId: string; text: string; sender: string; senderRole: string }>) => {
      const conversation = state.conversations.find((c) => c.id === action.payload.conversationId);
      if (conversation && !conversation.closed && action.payload.text.trim()) {
        const msg: Message = {
          id: stableId('msg'),
          conversationId: action.payload.conversationId,
          sender: action.payload.sender,
          senderRole: action.payload.senderRole,
          text: action.payload.text,
          createdAt: serverClock.now().toISOString(),
          status: 'SENT',
        };
        state.messages.push(msg);
        conversation.lastActivity = msg.createdAt;
      }
    },
    handoffAdded: (state, action: PayloadAction<Omit<Handoff, 'id' | 'correlationId' | 'status'>>) => {
      const h: Handoff = {
        ...action.payload,
        id: stableId('handoff'),
        correlationId: stableId('corr'),
        status: 'Requested',
      };
      state.handoffs.unshift(h);
    },
    supportAdded: (state, action: PayloadAction<{ title: string; requesterScope: OrgScope; targetScope: OrgScope; summary: string }>) => {
      const r: SupportRequest = {
        id: stableId('support'),
        title: action.payload.title,
        requesterScope: action.payload.requesterScope,
        targetScope: action.payload.targetScope,
        status: 'Requested',
        owner: 'Unassigned',
        summary: action.payload.summary,
        version: 1,
      };
      state.support.unshift(r);
    },
    meetingFollowThrough: (state, action: PayloadAction<{ meetingId: string; title: string; owner: string; due: string; decision?: string }>) => {
      const meeting = state.meetings.find((m) => m.id === action.payload.meetingId);
      if (meeting && canPublishMom(meeting.status)) {
        meeting.status = 'Actions Active';
        meeting.version += 1;
        const act: ActionItem = {
          id: stableId('act'),
          title: action.payload.title,
          owner: action.payload.owner,
          sourceType: 'MEETING',
          sourceId: action.payload.meetingId,
          due: action.payload.due,
          status: 'TODO',
          priority: 'HIGH',
          scope: meeting.scope,
          version: 1,
        };
        const task: Task = {
          id: stableId('task'),
          title: action.payload.title,
          description: action.payload.decision || 'Created from meeting follow-through.',
          owner: action.payload.owner,
          sourceType: 'MEETING',
          sourceId: action.payload.meetingId,
          due: action.payload.due,
          priority: 'HIGH',
          status: 'TODO',
          version: 1,
          scope: meeting.scope,
          timeline: [],
        };
        state.actions.unshift(act);
        state.tasks.unshift(task);
      }
    },
    duesReconciled: (state, action: PayloadAction<{ memberId: string }>) => {
      const mem = state.members.find((m) => m.id === action.payload.memberId);
      if (mem) {
        mem.duesStatus = 'Reconciliation';
      }
    },
    jobAdded: (state, action: PayloadAction<{ kind: JobItem['kind']; title: string; requestedBy: string; scope: OrgScope }>) => {
      const j: JobItem = {
        id: stableId('job'),
        kind: action.payload.kind,
        title: action.payload.title,
        status: 'Queued',
        requestedBy: action.payload.requestedBy,
        scope: action.payload.scope,
        requestedAt: serverClock.now().toISOString(),
        progress: 0,
      };
      state.jobs.unshift(j);
    },
    auditAdded: (state, action: PayloadAction<AuditEvent>) => {
      state.audits.unshift(action.payload);
    },
    dispatchLegacyOrgAction: (state, action: PayloadAction<OrgAction>) => {
      const a = action.payload;
      switch (a.type) {
        case 'TASK_STATUS': {
          const t = state.tasks.find((x) => x.id === a.payload.id);
          if (t && canTaskTransition(t.status, a.payload.status)) {
            t.status = a.payload.status;
            t.version += 1;
          }
          break;
        }
        case 'ADD_TASK': {
          const defaultScope: OrgScope = a.payload.scope ?? { id: 'SCOPE-DEFAULT', name: 'Default', level: 'CHAPTER' };
          state.tasks.unshift({ ...a.payload, id: stableId('task'), version: 1, scope: defaultScope, timeline: [] });
          break;
        }
        case 'APPROVAL': {
          const app = state.approvals.find((x) => x.id === a.payload.id);
          if (app) {
            app.status = a.payload.status;
            if (a.payload.reason) app.decisionReason = a.payload.reason;
            app.version += 1;
          }
          break;
        }
        case 'ADD_APPROVAL': {
          const defaultScope = state.units.length
            ? { id: state.units[0].id, name: state.units[0].name, level: state.units[0].level }
            : { id: 'scope-default', name: 'Default Chapter', level: 'CHAPTER' as const };
          state.approvals.unshift({ ...a.payload, id: a.payload.id || stableId('ap'), version: 1, status: 'PENDING', scope: a.payload.scope ?? defaultScope });
          break;
        }
        case 'SEND_MESSAGE': {
          const c = state.conversations.find((x) => x.id === a.payload.conversationId);
          if (c && !c.closed && a.payload.text.trim()) {
            const m: Message = {
              id: stableId('msg'),
              conversationId: a.payload.conversationId,
              sender: 'Current Actor',
              senderRole: 'Office Bearer',
              text: a.payload.text,
              createdAt: serverClock.now().toISOString(),
              status: 'SENT',
            };
            state.messages.push(m);
            c.lastActivity = m.createdAt;
          }
          break;
        }
        case 'ADD_HANDOFF': {
          state.handoffs.unshift({ ...a.payload, id: stableId('handoff'), correlationId: stableId('corr'), status: 'Requested' });
          break;
        }
        case 'ADD_SUPPORT': {
          state.support.unshift({ id: stableId('support'), title: a.payload.title, requesterScope: a.payload.requesterScope, targetScope: a.payload.targetScope, status: 'Requested', owner: 'Unassigned', summary: a.payload.summary, version: 1 });
          break;
        }
        case 'MEETING_FOLLOW_THROUGH': {
          const meeting = state.meetings.find((m) => m.id === a.payload.meetingId);
          if (meeting && canPublishMom(meeting.status)) {
            meeting.status = 'Actions Active';
            meeting.version += 1;
            state.actions.unshift({ id: stableId('act'), title: a.payload.title, owner: a.payload.owner, sourceType: 'MEETING', sourceId: a.payload.meetingId, due: a.payload.due, status: 'TODO', priority: 'HIGH', scope: meeting.scope, version: 1 });
            state.tasks.unshift({ id: stableId('task'), title: a.payload.title, description: a.payload.decision || 'Created from meeting follow-through.', owner: a.payload.owner, sourceType: 'MEETING', sourceId: a.payload.meetingId, due: a.payload.due, priority: 'HIGH', status: 'TODO', version: 1, scope: meeting.scope, timeline: [] });
          }
          break;
        }
        case 'DUES_RECONCILE': {
          const m = state.members.find((x) => x.id === a.payload.memberId);
          if (m) m.duesStatus = 'Reconciliation';
          break;
        }
        case 'ADD_JOB': {
          const defaultScope: OrgScope = { id: 'SCOPE-DEFAULT', name: 'Default', level: 'CHAPTER' };
          state.jobs.unshift({ id: stableId('job'), kind: a.payload.kind, title: a.payload.title, status: 'Queued', requestedBy: 'Actor', scope: defaultScope, requestedAt: serverClock.now().toISOString(), progress: 0 });
          break;
        }
      }
    },
  },
});

export const {
  setOrgState,
  patchOrgState,
  taskStatusChanged,
  taskAdded,
  approvalChanged,
  messageSent,
  handoffAdded,
  supportAdded,
  meetingFollowThrough,
  duesReconciled,
  jobAdded,
  auditAdded,
  dispatchLegacyOrgAction,
} = orgSlice.actions;

export default orgSlice.reducer;
