import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { AsyncState } from '@/components/AsyncState';
import { RecordNotFound } from '@/components/RecordNotFound';
import { DomainLifecycleActions } from '@/components/DomainLifecycleActions';
import { useOrg } from '@/state/OrgStore';
import { useDomainRecord } from '@/hooks/useDomainRecord';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import type { LifecycleDomain } from '@/domain/stateMachines';

// Clean SVG Icons for exact rendering without package version mismatch
function ArrowLeftIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function ArrowRightIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function LifeBuoyIcon({ className = 'size-4.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
      <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
    </svg>
  );
}

function ShieldAlertIcon({ className = 'size-4.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Zm0 13.036h.008v.008H12v-.008Z" />
    </svg>
  );
}

function AlertTriangleIcon({ className = 'size-4.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function FileCheckIcon({ className = 'size-4.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function ScaleIcon({ className = 'size-4.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
    </svg>
  );
}

function TargetIcon({ className = 'size-4.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ClockIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UserIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function BuildingIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function ExternalLinkIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

function HistoryIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function InfoIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
    </svg>
  );
}

function LayersIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function CalendarIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

type Kind =
  | 'TASK'
  | 'ACTION'
  | 'APPROVAL'
  | 'MEMBER_CASE'
  | 'COMMITTEE'
  | 'PROGRAMME'
  | 'EVENT'
  | 'SUPPORT'
  | 'ESCALATION'
  | 'HANDOFF'
  | 'EXCEPTION'
  | 'RISK'
  | 'ISSUE'
  | 'DECISION'
  | 'JOB'
  | 'DOCUMENT'
  | 'COMMUNICATION'
  | 'FEEDBACK'
  | 'GOAL'
  | 'DATA_QUALITY'
  | 'NOTIFICATION'
  | 'ALERT';

const lifecycleKind: Partial<Record<Kind, LifecycleDomain>> = {
  MEMBER_CASE: 'MEMBER_CASE',
  COMMITTEE: 'COMMITTEE',
  PROGRAMME: 'PROGRAMME',
  EVENT: 'EVENT',
  SUPPORT: 'SUPPORT',
  ESCALATION: 'ESCALATION',
  HANDOFF: 'HANDOFF',
  EXCEPTION: 'EXCEPTION',
  RISK: 'RISK',
  ISSUE: 'ISSUE',
  COMMUNICATION: 'COMMUNICATION',
  FEEDBACK: 'FEEDBACK',
  GOAL: 'GOAL',
  DATA_QUALITY: 'DATA_QUALITY',
  NOTIFICATION: 'NOTIFICATION'
};

const back: Record<Kind, { path: string; label: string }> = {
  TASK: { path: '/org/tasks', label: 'Tasks' },
  ACTION: { path: '/org/actions', label: 'Actions' },
  APPROVAL: { path: '/org/approvals', label: 'Approvals' },
  MEMBER_CASE: { path: '/org/member-cases', label: 'Member Cases' },
  COMMITTEE: { path: '/org/committees', label: 'Committees' },
  PROGRAMME: { path: '/org/programmes', label: 'Programmes' },
  EVENT: { path: '/org/events', label: 'Events' },
  SUPPORT: { path: '/org/support', label: 'Support & Intervention' },
  ESCALATION: { path: '/org/escalations', label: 'Escalations' },
  HANDOFF: { path: '/org/handoffs', label: 'Handoffs' },
  EXCEPTION: { path: '/org/exceptions', label: 'Exceptions' },
  RISK: { path: '/org/risks', label: 'Risks' },
  ISSUE: { path: '/org/issues', label: 'Issues' },
  DECISION: { path: '/org/decisions', label: 'Decisions' },
  JOB: { path: '/org/jobs', label: 'Jobs' },
  DOCUMENT: { path: '/org/documents', label: 'Documents' },
  COMMUNICATION: { path: '/org/communications', label: 'Communications' },
  FEEDBACK: { path: '/org/polls', label: 'Feedback & Polls' },
  GOAL: { path: '/org/goals', label: 'Goals' },
  DATA_QUALITY: { path: '/org/data-quality', label: 'Data Quality' },
  NOTIFICATION: { path: '/org/notifications', label: 'Notifications' },
  ALERT: { path: '/org/alerts', label: 'Alerts' }
};

const eventRule: Record<Kind, string> = {
  TASK: 'org.task.*',
  ACTION: 'org.action.*',
  APPROVAL: 'org.approval.*',
  MEMBER_CASE: 'org.member-case.*',
  COMMITTEE: 'org.committee.*',
  PROGRAMME: 'org.programme.*',
  EVENT: 'org.event.*',
  SUPPORT: 'org.support-request.*',
  ESCALATION: 'org.escalation.*',
  HANDOFF: 'org.handoff.*',
  EXCEPTION: 'org.exception.*',
  RISK: 'org.risk.*',
  ISSUE: 'org.issue.*',
  DECISION: 'org.decision.*',
  JOB: 'org.job.*',
  DOCUMENT: 'org.document.*',
  COMMUNICATION: 'org.communication.*',
  FEEDBACK: 'org.poll.*',
  GOAL: 'org.goal.*',
  DATA_QUALITY: 'org.data-quality.*',
  NOTIFICATION: 'org.notification.*',
  ALERT: 'org.alert.*'
};

function sourceLink(sourceType?: string, sourceId?: string) {
  if (!sourceType || !sourceId) return undefined;
  const t = sourceType.toUpperCase().replaceAll('_', '');
  if (t === 'MEETING') return `/org/meetings/${sourceId}`;
  if (t === 'EVENT') return `/org/events/${sourceId}`;
  if (t === 'MEMBER' || t === 'MEMBERNETWORKING') return `/org/members/${sourceId}`;
  if (t === 'TASK') return `/org/tasks/${sourceId}`;
  if (t === 'ACTION') return `/org/actions/${sourceId}`;
  if (t === 'SUPPORTREQUEST' || t === 'SUPPORT') return `/org/support/${sourceId}`;
  if (t === 'ESCALATION') return `/org/escalations/${sourceId}`;
  if (t === 'MEMBERCASE') return `/org/member-cases/${sourceId}`;
  if (t === 'PROGRAMME') return `/org/programmes/${sourceId}`;
  if (t === 'COMMITTEE') return `/org/committees/${sourceId}`;
  if (t === 'GOAL') return `/org/goals/${sourceId}`;
  if (t === 'APPROVAL') return `/org/approvals/${sourceId}`;
  return undefined;
}

function formatDate(val: unknown): string {
  if (!val) return '—';
  try {
    const d = new Date(String(val));
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return String(val);
  }
}

function getStatusStyle(status: string) {
  const s = (status || '').toUpperCase().replaceAll(' ', '_');
  if (s === 'APPROVED' || s === 'RESOLVED' || s === 'CLOSED' || s === 'MITIGATED' || s === 'COMPLETED' || s === 'ACTIVE') {
    return {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      border: 'border-l-emerald-500'
    };
  }
  if (s === 'CRITICAL' || s === 'REJECTED' || s === 'HIGH') {
    return {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      border: 'border-l-rose-500'
    };
  }
  if (s === 'MEDIUM' || s === 'UNDER_REVIEW' || s === 'PENDING' || s === 'IN_PROGRESS' || s === 'SUBMITTED') {
    return {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      border: 'border-l-amber-500'
    };
  }
  return {
    bg: 'bg-sky-50 text-[#1b5fa7] border-sky-200',
    dot: 'bg-[#1b5fa7]',
    border: 'border-l-[#1b5fa7]'
  };
}

function getKindIcon(kind: Kind) {
  switch (kind) {
    case 'SUPPORT':
      return <LifeBuoyIcon className="size-4.5 text-[#1b5fa7]" />;
    case 'ESCALATION':
      return <ShieldAlertIcon className="size-4.5 text-rose-500" />;
    case 'EXCEPTION':
      return <FileCheckIcon className="size-4.5 text-amber-500" />;
    case 'RISK':
      return <AlertTriangleIcon className="size-4.5 text-orange-500" />;
    case 'ISSUE':
      return <ShieldAlertIcon className="size-4.5 text-red-500" />;
    case 'DECISION':
      return <ScaleIcon className="size-4.5 text-blue-500" />;
    case 'GOAL':
      return <TargetIcon className="size-4.5 text-emerald-500" />;
    default:
      return <InfoIcon className="size-4.5 text-slate-500" />;
  }
}

export function OperationalRecordDetailPage({ kind }: { kind: Kind }) {
  const { id } = useParams<{ id: string }>();
  const s = useOrg();

  const localSources: Partial<Record<Kind, unknown[]>> = {
    TASK: s.tasks,
    ACTION: s.actions,
    APPROVAL: s.approvals,
    MEMBER_CASE: s.cases,
    COMMITTEE: s.committees,
    PROGRAMME: s.programmes,
    EVENT: s.events,
    SUPPORT: s.support,
    ESCALATION: s.escalations,
    HANDOFF: s.handoffs,
    EXCEPTION: s.operationalExceptions,
    RISK: s.risks,
    ISSUE: s.issues,
    DECISION: s.decisions,
    JOB: s.jobs,
    DOCUMENT: s.documents,
    COMMUNICATION: s.communications,
    FEEDBACK: s.feedback,
    GOAL: s.goals,
    DATA_QUALITY: s.dataQuality,
    NOTIFICATION: s.notifications,
    ALERT: s.alerts
  };

  const source = localSources[kind] as Array<{ id: string }> | undefined;
  const local = source?.find(v => v.id === id) as Record<string, unknown> | undefined;

  const detail = useDomainRecord<Record<string, unknown>>(
    { entityType: kind, id, organisationScope: s.scope.id },
    local,
    Boolean(id)
  );

  useRealtimeRefresh([eventRule[kind]], detail.reload, e => !id || !e.aggregateId || e.aggregateId === id);

  const record = (detail.record || local) as Record<string, unknown> | undefined;

  const backInfo = back[kind] ?? { path: '/org/tasks', label: 'Records' };

  if (!detail.loading && !record && !detail.error) {
    return <RecordNotFound title={`${kind.replaceAll('_', ' ')} not found`} backTo={backInfo.path} backLabel={`Back to ${backInfo.label}`} />;
  }

  // Extract structured values
  const title = record ? String(record.title ?? record.subject ?? record.name ?? `${kind.replaceAll('_', ' ')} ${id}`) : '';
  const status = record && typeof record.status === 'string' ? record.status : 'Active';
  const severity = record && typeof (record.severity ?? record.impact ?? record.priority) === 'string' ? String(record.severity ?? record.impact ?? record.priority) : undefined;
  
  // Scopes
  const requesterScope = (record?.requesterScope ?? record?.from) as { name?: string; level?: string } | undefined;
  const targetScope = (record?.targetScope ?? record?.to) as { name?: string; level?: string } | undefined;

  // Narrative texts
  const summary = record ? String(record.summary ?? record.description ?? record.context ?? '') : '';
  const desiredHelp = record ? String(record.desiredHelp ?? record.reason ?? record.mandate ?? '') : '';
  const mitigationPlan = record ? String(record.mitigationPlan ?? record.resolutionPlan ?? '') : '';
  const contingencyPlan = record ? String(record.contingencyPlan ?? record.rootCause ?? '') : '';

  // Ownership & Dates
  const owner = record ? String(record.owner ?? record.requester ?? record.authority ?? record.convener ?? '') : '';
  const dateDue = record ? (record.due ?? record.targetDate ?? record.effectiveDate ?? record.reviewDate ?? record.timeline) : undefined;
  const dateCreated = record ? (record.requestedAt ?? record.createdAt ?? record.date) : undefined;

  const srcType = record && typeof record.sourceType === 'string' ? record.sourceType : undefined;
  const srcId = record && typeof record.sourceId === 'string' ? record.sourceId : undefined;
  const src = sourceLink(srcType, srcId);
  const memberId = record && typeof record.memberId === 'string' ? record.memberId : undefined;
  const meetingId = record && typeof record.meetingId === 'string' ? record.meetingId : undefined;

  const statusStyle = getStatusStyle(status);

  return (
    <AsyncState
      loading={detail.loading && !record}
      refreshing={detail.refreshing}
      stale={detail.stale}
      error={detail.error}
      onRetry={detail.reload}
    >
      {record && (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
          {/* Top Breadcrumb & Back Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to={backInfo.path}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1b5fa7] transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeftIcon className="size-3.5" />
              <span>Back to {backInfo.label}</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">ID: {String(id).slice(0, 8)}...</span>
              <Link
                to={`/org/audit?q=${encodeURIComponent(String(id ?? ''))}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <HistoryIcon className="size-3.5 text-slate-500" />
                <span>Audit Trail</span>
              </Link>
            </div>
          </div>

          {/* Single Master Outer Container Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* 1. Hero Header Section */}
            <div className={`p-6 md:p-8 border-b border-slate-200/80 border-l-4 ${statusStyle.border} bg-slate-50/40`}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  {/* Kind & Status Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      {getKindIcon(kind)}
                      {kind.replaceAll('_', ' ')}
                    </span>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${statusStyle.bg}`}>
                      <span className={`size-1.5 rounded-full ${statusStyle.dot}`} />
                      {status.toUpperCase()}
                    </span>

                    {severity && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          severity.toUpperCase() === 'CRITICAL' || severity.toUpperCase() === 'HIGH'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : severity.toUpperCase() === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {severity} Priority
                      </span>
                    )}
                  </div>

                  {/* Big Title */}
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                    {title}
                  </h1>

                  {/* Scope Path Summary */}
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                    <BuildingIcon className="size-3.5 text-slate-400" />
                    <span>Scope: {s.scope.name} ({s.scope.level})</span>
                    {record.version !== undefined && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span>Version {String(record.version)}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-start shrink-0 flex-wrap">
                  {src && (
                    <Link
                      to={src}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                    >
                      <ExternalLinkIcon className="size-3.5 text-slate-500" />
                      <span>Open Linked Source</span>
                    </Link>
                  )}
                  {memberId && (
                    <Link
                      to={`/org/members/${memberId}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                    >
                      <UserIcon className="size-3.5 text-slate-500" />
                      <span>Member Profile</span>
                    </Link>
                  )}
                  {meetingId && (
                    <Link
                      to={`/org/meetings/${meetingId}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                    >
                      <CalendarIcon className="size-3.5 text-slate-500" />
                      <span>Linked Meeting</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Operational Coordination Path Section */}
            {(requesterScope || targetScope) && (
              <div className="px-6 md:px-8 py-5 border-b border-slate-200/80 bg-gradient-to-r from-sky-50/50 via-slate-50/40 to-indigo-50/50">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <LayersIcon className="size-3.5 text-[#1b5fa7]" />
                  Operational Coordination Path
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                  <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex-1">
                    <div className="size-8 rounded-lg bg-sky-50 flex items-center justify-center text-[#1b5fa7] font-bold text-xs shrink-0">
                      FR
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Origin / Requester</div>
                      <div className="font-bold text-slate-800 text-xs">{requesterScope?.name || s.scope.name}</div>
                      <span className="text-[10px] text-slate-500 font-medium">({requesterScope?.level || s.scope.level})</span>
                    </div>
                  </div>

                  <div className="flex justify-center text-slate-400">
                    <ArrowRightIcon className="size-5 shrink-0 hidden sm:block text-[#1b5fa7]" />
                    <span className="sm:hidden font-bold text-xs text-[#1b5fa7]">↓ Escalate / Route to</span>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex-1">
                    <div className="size-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                      TO
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Target Operational Level</div>
                      <div className="font-bold text-slate-800 text-xs">{targetScope?.name || 'Higher Regional Scope'}</div>
                      <span className="text-[10px] text-slate-500 font-medium">({targetScope?.level || 'REGION'})</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Main Content Split Grid */}
            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Columns: Overview, Details, Plans, Actions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Case Overview & Narrative */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <InfoIcon className="size-4 text-[#1b5fa7]" />
                      Case Overview & Narrative
                    </h2>
                  </div>

                  {summary ? (
                    <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-4 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                      {summary}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No primary summary narrative supplied.</p>
                  )}

                  {desiredHelp && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Desired Outcome / Specific Assistance
                      </span>
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-slate-800 text-xs leading-relaxed">
                        {desiredHelp}
                      </div>
                    </div>
                  )}

                  {mitigationPlan && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Mitigation / Resolution Strategy
                      </span>
                      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-slate-800 text-xs leading-relaxed">
                        {mitigationPlan}
                      </div>
                    </div>
                  )}

                  {contingencyPlan && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Contingency Plan / Root Cause Analysis
                      </span>
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs leading-relaxed">
                        {contingencyPlan}
                      </div>
                    </div>
                  )}
                </div>

                {/* Lifecycle & Actions */}
                {lifecycleKind[kind] && (
                  <div className="pt-4 border-t border-slate-100">
                    <DomainLifecycleActions
                      domain={lifecycleKind[kind]!}
                      record={record}
                      onChanged={detail.reload}
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Metadata, Ownership & Dates */}
              <div className="space-y-6 lg:border-l lg:border-slate-100 lg:pl-8">
                {/* Ownership & Responsibilities */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                    <UserIcon className="size-4 text-[#1b5fa7]" />
                    Ownership & Authority
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold block uppercase">Designated Owner / Lead</span>
                      <span className="text-xs font-bold text-slate-800">
                        {owner || 'Chapter Leadership'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold block uppercase">Operating Level</span>
                      <span className="text-xs font-medium text-slate-700">
                        {s.scope.name} ({s.scope.level})
                      </span>
                    </div>

                    {record.canonicalCaseId && (
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block uppercase">Canonical Case ID</span>
                        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {String(record.canonicalCaseId)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timing & Timeline */}
                <div className="space-y-3.5 pt-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                    <ClockIcon className="size-4 text-[#1b5fa7]" />
                    Timing & Deadlines
                  </h3>

                  <div className="space-y-3">
                    {dateCreated && (
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block uppercase">Logged / Requested</span>
                        <span className="text-xs font-medium text-slate-700">
                          {formatDate(dateCreated)}
                        </span>
                      </div>
                    )}

                    {dateDue && (
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block uppercase">Target / Due Date</span>
                        <span className="text-xs font-bold text-slate-900">
                          {formatDate(dateDue)}
                        </span>
                      </div>
                    )}

                    {record.respondedAt && (
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block uppercase">Last Response</span>
                        <span className="text-xs font-medium text-slate-700">
                          {formatDate(record.respondedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Unified Bottom Action Footer */}
            <div className="px-6 md:px-8 py-4 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Record active under <strong className="text-slate-700">{s.scope.name}</strong>
              </span>

              <Link
                to={backInfo.path}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b5fa7] hover:bg-[#174f89] text-white font-bold text-xs shadow-xs transition-all"
                style={{ color: '#ffffff' }}
              >
                <ArrowLeftIcon className="size-3.5" />
                <span>Return to {backInfo.label}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </AsyncState>
  );
}

export const TaskDetailPage = () => <OperationalRecordDetailPage kind="TASK" />;
export const ActionDetailPage = () => <OperationalRecordDetailPage kind="ACTION" />;
export const ApprovalDetailPage = () => <OperationalRecordDetailPage kind="APPROVAL" />;
export const MemberCaseDetailPage = () => <OperationalRecordDetailPage kind="MEMBER_CASE" />;
export const CommitteeDetailPage = () => <OperationalRecordDetailPage kind="COMMITTEE" />;
export const ProgrammeDetailPage = () => <OperationalRecordDetailPage kind="PROGRAMME" />;
export const EventDetailPage = () => <OperationalRecordDetailPage kind="EVENT" />;
export const SupportDetailPage = () => <OperationalRecordDetailPage kind="SUPPORT" />;
export const EscalationDetailPage = () => <OperationalRecordDetailPage kind="ESCALATION" />;
export const HandoffDetailPage = () => <OperationalRecordDetailPage kind="HANDOFF" />;
export const ExceptionDetailPage = () => <OperationalRecordDetailPage kind="EXCEPTION" />;
export const RiskDetailPage = () => <OperationalRecordDetailPage kind="RISK" />;
export const IssueDetailPage = () => <OperationalRecordDetailPage kind="ISSUE" />;
export const DecisionDetailPage = () => <OperationalRecordDetailPage kind="DECISION" />;
export const JobDetailPage = () => <OperationalRecordDetailPage kind="JOB" />;
export const DocumentDetailPage = () => <OperationalRecordDetailPage kind="DOCUMENT" />;
export const CommunicationDetailPage = () => <OperationalRecordDetailPage kind="COMMUNICATION" />;
export const FeedbackDetailPage = () => <OperationalRecordDetailPage kind="FEEDBACK" />;
export const GoalDetailPage = () => <OperationalRecordDetailPage kind="GOAL" />;
export const DataQualityDetailPage = () => <OperationalRecordDetailPage kind="DATA_QUALITY" />;
export const NotificationDetailPage = () => <OperationalRecordDetailPage kind="NOTIFICATION" />;
export const AlertDetailPage = () => <OperationalRecordDetailPage kind="ALERT" />;
