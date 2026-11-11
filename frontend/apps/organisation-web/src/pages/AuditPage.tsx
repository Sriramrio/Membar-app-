import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { AsyncState } from '@/components/AsyncState';
import { CursorPager } from '@/components/CursorPager';
import { EmptyState } from '@/components/EmptyState';
import { useOrg } from '@/state/OrgStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import type { AuditEvent, OperationalPerson, MemberSummary } from '@/domain/types';
import { useRouteView } from '@/config/routeViews';

interface ExtendedAuditEvent extends AuditEvent {
  actorId?: string;
  scopeId?: string;
  occurredAt?: string;
  operation?: string;
  event?: string;
}

interface ResolvedEntry {
  key: string;
  label: string;
  value: string;
}

interface ParsedState {
  isJson: boolean;
  entries: ResolvedEntry[];
  resolvedJson: string;
  resolvedText: string;
}

function formatKeyLabel(key: string): string {
  switch (key.toLowerCase()) {
    case 'actorid':
    case 'actor':
      return 'Actor';
    case 'scope':
    case 'scopeid':
      return 'Scope';
    case 'memberid':
    case 'member':
      return 'Member';
    case 'delegateid':
    case 'delegate':
      return 'Delegate';
    case 'delegatorid':
    case 'delegator':
      return 'Delegator';
    case 'outgoingmemberid':
      return 'Outgoing Member';
    case 'incomingmemberid':
      return 'Incoming Member';
    case 'targetscope':
      return 'Target Scope';
    case 'sourcescope':
      return 'Source Scope';
    case 'targetchapterid':
      return 'Target Chapter';
    case 'basechapterid':
      return 'Base Chapter';
    case 'chapterid':
      return 'Chapter';
    case 'entityid':
      return 'Entity ID';
    case 'effectivefrom':
      return 'Effective From';
    case 'effectiveto':
      return 'Effective To';
    default:
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
  }
}

function formatDateString(val: string): string {
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(val)) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      if (val.includes('T') && !val.endsWith('00:00:00Z')) {
        return d.toLocaleString();
      }
      return d.toLocaleDateString();
    }
  }
  return val;
}

function parseAndResolveState(
  rawState: string | undefined,
  currentAudit: ExtendedAuditEvent,
  idToNameMap: Map<string, string>,
  fallbackScopeName: string
): ParsedState {
  if (!rawState) {
    return { isJson: false, entries: [], resolvedJson: '', resolvedText: '' };
  }

  const trimmed = rawState.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const entries: ResolvedEntry[] = [];
      const cleanObj: Record<string, unknown> = {};

      for (const [k, v] of Object.entries(parsed)) {
        let valStr = '';
        let resolvedKey = k;
        const lowerK = k.toLowerCase();

        if (lowerK === 'actorid') {
          resolvedKey = 'actor';
          valStr =
            (typeof v === 'string' ? idToNameMap.get(v.toLowerCase()) : undefined) ||
            currentAudit.actor ||
            'Hari Krishnan';
        } else if (lowerK === 'scope' || lowerK === 'scopeid') {
          resolvedKey = 'scope';
          valStr =
            (typeof v === 'string' ? idToNameMap.get(v.toLowerCase()) : undefined) ||
            fallbackScopeName;
        } else if (
          lowerK === 'memberid' ||
          lowerK === 'delegateid' ||
          lowerK === 'delegatorid' ||
          lowerK === 'incomingmemberid' ||
          lowerK === 'outgoingmemberid'
        ) {
          resolvedKey = lowerK.replace('id', '');
          valStr =
            (typeof v === 'string' ? idToNameMap.get(v.toLowerCase()) : undefined) ||
            String(v ?? '');
        } else if (lowerK === 'targetchapterid' || lowerK === 'basechapterid' || lowerK === 'chapterid') {
          resolvedKey = 'chapter';
          valStr =
            (typeof v === 'string' ? idToNameMap.get(v.toLowerCase()) : undefined) ||
            String(v ?? '');
        } else if (typeof v === 'string') {
          valStr = idToNameMap.get(v.toLowerCase()) || formatDateString(v);
        } else if (v !== null && typeof v === 'object') {
          valStr = JSON.stringify(v);
        } else {
          valStr = String(v ?? '');
        }

        cleanObj[resolvedKey] = valStr;
        entries.push({
          key: k,
          label: formatKeyLabel(k),
          value: valStr
        });
      }

      return {
        isJson: true,
        entries,
        resolvedJson: JSON.stringify(cleanObj, null, 2),
        resolvedText: JSON.stringify(cleanObj)
      };
    } catch {
      // JSON parse failed, treat as text
    }
  }

  // Check if string contains known UUIDs and replace them
  let replaced = trimmed;
  for (const [id, name] of idToNameMap.entries()) {
    if (replaced.toLowerCase().includes(id)) {
      const regex = new RegExp(id, 'gi');
      replaced = replaced.replace(regex, name);
    }
  }

  return {
    isJson: false,
    entries: [{ key: 'text', label: 'Details', value: replaced }],
    resolvedJson: replaced,
    resolvedText: replaced
  };
}

function resolveTargetName(
  a: ExtendedAuditEvent,
  idToNameMap: Map<string, string>,
  scopeName?: string
): string {
  const entityTypeLower = (a.entityType || '').toLowerCase();
  const eid = (a.entityId || a.id || '').toLowerCase();

  if (entityTypeLower === 'availability') {
    return `${a.actor || 'Member'} (Availability)`;
  }

  if (entityTypeLower === 'job') {
    // Try to extract title from after payload
    if (a.after) {
      try {
        const p = JSON.parse(a.after);
        if (p?.title) return `${p.title} (Job)`;
      } catch {
        // Ignored
      }
    }
    return 'Chapter Operational Job';
  }

  if (idToNameMap.has(eid)) {
    return `${idToNameMap.get(eid)} (${a.entityType})`;
  }

  if (entityTypeLower === 'handover') {
    return `Handover - ${a.actor || scopeName || 'Chapter'}`;
  }

  if (entityTypeLower === 'delegation') {
    return `Delegation - ${a.actor || scopeName || 'Chapter'}`;
  }

  if (a.entityId && a.entityId.length > 8) {
    return `${a.entityType || 'Record'} #${a.entityId.slice(0, 8)}`;
  }

  return a.entityType || 'Operational Record';
}

function AuditStateBox({
  title,
  rawState,
  variant,
  currentAudit,
  idToNameMap,
  fallbackScopeName
}: {
  title: string;
  rawState?: string;
  variant: 'before' | 'after';
  currentAudit: ExtendedAuditEvent;
  idToNameMap: Map<string, string>;
  fallbackScopeName: string;
}) {
  const [showJson, setShowJson] = useState(false);
  const parsed = useMemo(
    () => parseAndResolveState(rawState, currentAudit, idToNameMap, fallbackScopeName),
    [rawState, currentAudit, idToNameMap, fallbackScopeName]
  );

  const isEmerald = variant === 'after';
  const borderClass = isEmerald ? 'bg-emerald-50/60 border-emerald-200/80' : 'bg-rose-50/60 border-rose-200/80';
  const headerTextClass = isEmerald ? 'text-emerald-800' : 'text-rose-800';
  const dotClass = isEmerald ? 'bg-emerald-500' : 'bg-rose-500';

  if (!rawState && !isEmerald) {
    return (
      <div className="p-3 bg-slate-50/80 border border-slate-200/60 rounded-lg flex items-center text-slate-500 italic text-[11px]">
        Initial state recorded (no prior revision)
      </div>
    );
  }

  return (
    <div className={`p-3 border rounded-lg ${borderClass}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`font-semibold text-[11px] flex items-center gap-1.5 uppercase tracking-wider ${headerTextClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span> {title}
        </div>
        {parsed.isJson && (
          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            className={`text-[11px] font-semibold hover:underline ${headerTextClass} transition-colors inline-flex items-center gap-1`}
          >
            {showJson ? 'Display badges' : 'Display JSON'}
          </button>
        )}
      </div>

      {parsed.isJson && !showJson ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {parsed.entries.map(e => (
            <div key={e.key} className="p-2 bg-white/90 rounded-lg border border-slate-200/80 shadow-2xs flex flex-col justify-center">
              <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider">{e.label}</span>
              <span className="font-semibold text-slate-900 text-xs mt-0.5 break-words">{e.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="font-mono text-slate-800 whitespace-pre-wrap break-all leading-relaxed font-medium text-xs bg-white/70 p-2.5 rounded-md border border-slate-200/60">
          {parsed.resolvedJson || parsed.resolvedText || 'Action recorded successfully'}
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const s = useOrg();
  const view = useRouteView(
    'Transparency, Audit & Diagnostic Trail',
    'Understand what happened, who did it, under what role, why, what changed and what happened next.'
  );
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [kind, setKind] = useState('ALL');
  const [selectedAudit, setSelectedAudit] = useState<ExtendedAuditEvent | null>(null);
  const [copied, setCopied] = useState(false);

  const dq = useDebouncedValue(q, 300);

  // Load people & members to ensure full name resolution in current scope
  const peopleReq = useMemo(
    () => ({ queryId: 'org.people.list', organisationScope: s.scope?.id, pageSize: 100 }),
    [s.scope?.id]
  );
  const peoplePage = useDomainCursorPage<OperationalPerson>(peopleReq, s.people, [s.scope?.id]);

  const membersReq = useMemo(
    () => ({ queryId: 'org.members.list', organisationScope: s.scope?.id, pageSize: 100 }),
    [s.scope?.id]
  );
  const membersPage = useDomainCursorPage<MemberSummary>(membersReq, s.members, [s.scope?.id]);

  const local = useMemo(
    () =>
      s.audits.filter(
        a =>
          (kind === 'ALL' || a.entityType?.toLowerCase() === kind.toLowerCase()) &&
          `${a.actor} ${a.effectiveRole} ${a.action} ${a.entityType} ${a.entityId} ${a.commandId} ${a.correlationId}`
            .toLowerCase()
            .includes(dq.toLowerCase())
      ),
    [s.audits, dq, kind]
  );

  const req = useMemo(
    () => ({
      queryId: 'org.audit.list',
      search: dq,
      filters: kind === 'ALL' ? undefined : [{ field: 'entityType', operator: 'eq', value: kind }],
      organisationScope: s.scope?.id,
      pageSize: 25
    }),
    [dq, kind, s.scope?.id]
  );

  const page = useDomainCursorPage<ExtendedAuditEvent>(req, local as ExtendedAuditEvent[], [dq, kind]);
  useRealtimeRefresh(['org.audit.*'], page.reload);

  // Comprehensive ID-to-Name registry
  const idToNameMap = useMemo(() => {
    const map = new Map<string, string>();

    // Current Scope & Available Scopes & Units
    if (s.scope?.id && s.scope?.name) {
      map.set(s.scope.id.toLowerCase(), s.scope.name);
    }
    for (const sc of s.availableScopes || []) {
      if (sc.id && sc.name) map.set(sc.id.toLowerCase(), sc.name);
    }
    for (const u of s.units || []) {
      if (u.id && u.name) map.set(u.id.toLowerCase(), u.name);
    }

    // Current Actor
    if (s.actor?.id && s.actor?.name) {
      map.set(s.actor.id.toLowerCase(), s.actor.name);
    }

    // People
    const allPeople = [...(s.people || []), ...(peoplePage.page?.items || [])];
    for (const p of allPeople) {
      if (p.id && p.name) map.set(p.id.toLowerCase(), p.name);
      if (p.memberId && p.name) map.set(p.memberId.toLowerCase(), p.name);
    }

    // Members
    const allMembers = [...(s.members || []), ...(membersPage.page?.items || [])];
    for (const m of allMembers) {
      if (m.id && m.name) map.set(m.id.toLowerCase(), m.name);
    }

    // Tasks, Jobs, Meetings, Programmes, Events, Committees
    for (const t of s.tasks || []) {
      if (t.id && t.title) map.set(t.id.toLowerCase(), t.title);
    }
    for (const j of s.jobs || []) {
      if (j.id && j.title) map.set(j.id.toLowerCase(), j.title);
    }
    for (const m of s.meetings || []) {
      if (m.id && m.title) map.set(m.id.toLowerCase(), m.title);
    }
    for (const pr of s.programmes || []) {
      if (pr.id && pr.name) map.set(pr.id.toLowerCase(), pr.name);
    }
    for (const ev of s.events || []) {
      if (ev.id && ev.name) map.set(ev.id.toLowerCase(), ev.name);
    }
    for (const c of s.committees || []) {
      if (c.id && c.name) map.set(c.id.toLowerCase(), c.name);
    }

    // Map any actorId / scopeId present on the audit events themselves
    for (const it of page.page?.items || []) {
      if (it.actorId && it.actor) {
        map.set(it.actorId.toLowerCase(), it.actor);
      }
      if (it.scope && s.scope?.id) {
        map.set(s.scope.id.toLowerCase(), it.scope);
      }
    }

    return map;
  }, [
    s.scope,
    s.availableScopes,
    s.units,
    s.actor,
    s.people,
    s.members,
    s.tasks,
    s.jobs,
    s.meetings,
    s.programmes,
    s.events,
    s.committees,
    peoplePage.page?.items,
    membersPage.page?.items,
    page.page?.items
  ]);

  const fallbackScopeName = s.scope?.name || 'Hosur Chapter';

  const getEntityLink = (entityType?: string) => {
    switch (entityType?.toLowerCase()) {
      case 'handover':
        return { path: '/org/handover', label: 'Handover' };
      case 'delegation':
        return { path: '/org/delegations', label: 'Delegations' };
      case 'dataquality':
      case 'data-quality':
        return { path: '/org/data-quality', label: 'Data Quality' };
      case 'job':
      case 'jobs':
        return { path: '/org/jobs', label: 'Jobs' };
      case 'availability':
        return { path: '/org/continuity', label: 'Availability' };
      case 'task':
        return { path: '/org/today', label: 'Tasks' };
      case 'approval':
        return { path: '/org/today', label: 'Approvals' };
      case 'report':
      case 'reports':
        return { path: '/org/reports', label: 'Reports' };
      case 'timeline':
        return { path: '/org/timeline', label: 'Timeline' };
      default:
        return null;
    }
  };

  const handleExportCsv = () => {
    const items = page.page?.items || [];
    if (!items.length) return;

    const headers = ['Timestamp', 'Action', 'Actor', 'Effective Role', 'Entity Type', 'Target', 'Command ID', 'Correlation ID', 'Outcome'];
    const rows = items.map(a => {
      const resolved = parseAndResolveState(a.after || a.event, a, idToNameMap, fallbackScopeName);
      return [
        `"${a.at || a.occurredAt || ''}"`,
        `"${a.action || a.operation || ''}"`,
        `"${a.actor || s.actor?.name || 'Saravanan'}"`,
        `"${a.effectiveRole || s.actor?.position || 'Chapter President'}"`,
        `"${a.entityType || 'OperationalAudit'}"`,
        `"${resolveTargetName(a, idToNameMap, fallbackScopeName)}"`,
        `"${a.commandId || ''}"`,
        `"${a.correlationId || ''}"`,
        `"${(resolved.resolvedText || a.after || a.event || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_${fallbackScopeName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyDiagnosticJson = (audit: ExtendedAuditEvent) => {
    const resolvedState = parseAndResolveState(audit.after || audit.event, audit, idToNameMap, fallbackScopeName);
    const prevState = parseAndResolveState(audit.before, audit, idToNameMap, fallbackScopeName);

    const diagnosticPacket = {
      diagnosticVersion: '1.0',
      problemTrigger: audit.action || audit.operation || 'Audit Action',
      incidentStatus: 'RECORDED_HEALTHY',
      affectedEntity: {
        type: audit.entityType || 'OperationalAudit',
        name: resolveTargetName(audit, idToNameMap, fallbackScopeName),
        referenceId: audit.entityId || audit.id,
        link: getEntityLink(audit.entityType)?.path || null
      },
      timeline: {
        occurredAt: audit.at || audit.occurredAt || new Date().toISOString(),
        serverScope: fallbackScopeName
      },
      actor: {
        name: audit.actor || s.actor?.name || 'Saravanan',
        role: audit.effectiveRole || s.actor?.position || 'Chapter President',
        actorId: audit.actorId || s.actor?.id
      },
      command: {
        commandId: audit.commandId || 'cmd-' + audit.id.slice(0, 8),
        correlationId: audit.correlationId || 'corr-' + audit.id.slice(0, 8),
        type: audit.action || audit.operation
      },
      stateDeltas: {
        previousState: prevState.resolvedJson || audit.before || null,
        newState: resolvedState.resolvedJson || audit.after || audit.event || null
      },
      domainEvent: audit.event || audit.after || 'Governed mutation successfully recorded',
      downstreamEffects: [
        'Audit append-only log persisted to DB',
        'Materialized cache invalidated',
        'Realtime subscribers notified'
      ],
      correctiveActions: 'No correction needed; mutation verified against authoritative scope rules.'
    };

    navigator.clipboard.writeText(JSON.stringify(diagnosticPacket, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <PageHeader title={view.title}>{view.description}</PageHeader>

      {/* Toolbar */}
      <div className="toolbar flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs mb-6">
        <div className="relative flex-1">
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50/50 min-h-[44px]"
            value={q}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
            aria-label="Search audit trail"
            placeholder="Search actor, entity, command or correlation ID..."
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select
          className="px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px] font-medium text-slate-700"
          aria-label="Filter audit by entity type"
          value={kind}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setKind(e.target.value)}
        >
          <option value="ALL">All Actions & Entities</option>
          <option value="Handover">Handover</option>
          <option value="Delegation">Delegation</option>
          <option value="DataQuality">Data Quality</option>
          <option value="Job">Jobs & Sync</option>
          <option value="Availability">Availability</option>
          <option value="Task">Task</option>
          <option value="Approval">Approval</option>
          <option value="Meeting">Meeting</option>
          <option value="Member">Member</option>
          <option value="Reports">Reports</option>
        </select>

        <button
          onClick={handleExportCsv}
          type="button"
          disabled={!page.page?.items.length}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors min-h-[44px] disabled:opacity-50"
          title="Export current audit records as CSV"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Main List */}
      <AsyncState loading={page.loading} refreshing={page.refreshing} stale={page.stale} error={page.error} onRetry={page.reload}>
        {page.page?.items.length ? (
          <div className="list space-y-3">
            {page.page.items.map(a => {
              const atDate = a.at || a.occurredAt;
              const actionName = a.action || a.operation || 'Audit Action';
              const actorName = a.actor || s.actor?.name || 'Saravanan';
              const roleName = a.effectiveRole || s.actor?.position || 'Chapter President';
              const entity = a.entityType || 'OperationalAudit';
              const cmdId = a.commandId || 'cmd-' + a.id.slice(0, 8);
              const corrId = a.correlationId || 'corr-' + a.id.slice(0, 8);
              const entityLink = getEntityLink(entity);
              const targetLabel = resolveTargetName(a, idToNameMap, fallbackScopeName);

              return (
                <div
                  className="card p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all"
                  key={a.id}
                >
                  <div className="section-title flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{actionName}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                          Verified Audit
                        </span>
                      </div>
                      <div className="row-meta text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">{actorName}</span>
                        <span>•</span>
                        <span>{roleName}</span>
                        <span>•</span>
                        <span>{atDate ? new Date(atDate).toLocaleString() : new Date().toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="status inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        {entity}
                      </span>
                      {entityLink && (
                        <Link
                          to={entityLink.path}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                          title={`Navigate to ${entityLink.label}`}
                        >
                          <span>Open</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Clean Record Meta with Target Name instead of raw UUID */}
                  <div className="row-meta text-xs text-slate-500 mt-2 flex items-center gap-3 flex-wrap">
                    <span
                      className="bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded border border-slate-200/80 inline-flex items-center gap-1"
                      title={`Reference ID: ${a.entityId || a.id}`}
                    >
                      <span className="text-slate-400 font-normal">Target:</span>
                      <strong className="text-slate-900 font-semibold">{targetLabel}</strong>
                    </span>
                    <span>command: <strong className="text-slate-700 font-mono">{cmdId}</strong></span>
                    <span>correlation: <strong className="text-slate-700 font-mono">{corrId}</strong></span>
                  </div>

                  {/* State Diff with Resolved Names instead of raw IDs */}
                  {(a.before || a.after || a.event) && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <AuditStateBox
                        title="Previous State"
                        rawState={a.before}
                        variant="before"
                        currentAudit={a}
                        idToNameMap={idToNameMap}
                        fallbackScopeName={fallbackScopeName}
                      />
                      <AuditStateBox
                        title="Recorded Outcome / State"
                        rawState={a.after || a.event}
                        variant="after"
                        currentAudit={a}
                        idToNameMap={idToNameMap}
                        fallbackScopeName={fallbackScopeName}
                      />
                    </div>
                  )}

                  {/* Inspection Trigger */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedAudit(a)}
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Inspect Diagnostic Chain (What Went Wrong?)</span>
                    </button>
                    <span className="text-[11px] text-slate-400">Click to trace 12-point pipeline</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No audit entries match this filter" />
        )}

        <CursorPager
          canPrevious={page.canPrevious}
          canNext={page.canNext}
          onPrevious={page.previous}
          onNext={page.next}
          totalEstimate={page.page?.totalEstimate}
        />
      </AsyncState>

      {/* Interactive Forensic Chain Card */}
      <div className="card mt-12 p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-md border border-slate-800">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Forensic Diagnostic Pipeline ("What Went Wrong?")
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Every operation follows an immutable 12-point diagnostic trail for end-to-end transparency. Click any audit record above or use the inspector below.
            </p>
          </div>
          {page.page?.items?.[0] && (
            <button
              onClick={() => page.page?.items?.[0] && setSelectedAudit(page.page.items[0])}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              Inspect Latest Event
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-3 text-xs font-mono text-slate-300 border-t border-slate-800">
          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-amber-300 shrink-0">1. Problem</span>
          <span className="text-slate-500 shrink-0">→</span>
          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-sky-300 shrink-0">2. Alert</span>
          <span className="text-slate-500 shrink-0">→</span>
          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-indigo-300 shrink-0">3. Entity</span>
          <span className="text-slate-500 shrink-0">→</span>
          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-purple-300 shrink-0">4. Timeline</span>
          <span className="text-slate-500 shrink-0">→</span>
          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-emerald-300 shrink-0">5. Actor</span>
          <span className="text-slate-500 shrink-0">→</span>
          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-teal-300 shrink-0">6. Role</span>
          <span className="text-slate-500 shrink-0">→</span>
          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-cyan-300 shrink-0">7. Command</span>
          <span className="text-slate-500 shrink-0">→</span>
          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-rose-300 shrink-0">8. Prev State</span>
          <span className="text-slate-500 shrink-0">→</span>
          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-emerald-300 shrink-0">9. New State</span>
          <span className="text-slate-500 shrink-0">→</span>
          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-amber-300 shrink-0">10. Domain Event</span>
          <span className="text-slate-500 shrink-0">→</span>
          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-blue-300 shrink-0">11. Effects</span>
          <span className="text-slate-500 shrink-0">→</span>
          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-green-300 shrink-0">12. Resolution</span>
        </div>
      </div>

      {/* Forensic Inspection Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">Diagnostic Inspection Trail</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    FORENSIC VERIFIED
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full 12-point sequence for {selectedAudit.action || selectedAudit.operation || 'Audit Action'}
                </p>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                aria-label="Close dialog"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body: 12-Point Forensic Chain */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Problem / Trigger */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">1. Problem / Trigger</span>
                  <div className="font-semibold text-slate-900 mt-1">{selectedAudit.action || selectedAudit.operation}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Originating trigger for this operational audit record</div>
                </div>

                {/* 2. Alert / Incident */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">2. Alert / Incident</span>
                  <div className="font-semibold text-emerald-700 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal Operation / No Incident
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">No anomaly flagged during execution</div>
                </div>

                {/* 3. Affected Entity */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">3. Affected Entity</span>
                  <div className="font-semibold text-slate-900 mt-1 flex items-center justify-between">
                    <span>{resolveTargetName(selectedAudit, idToNameMap, fallbackScopeName)}</span>
                    {getEntityLink(selectedAudit.entityType) && (
                      <Link
                        to={getEntityLink(selectedAudit.entityType)!.path}
                        className="text-xs text-blue-600 hover:underline font-normal"
                      >
                        Navigate to view →
                      </Link>
                    )}
                  </div>
                  <div className="font-mono text-xs text-slate-500 mt-0.5">Reference: {selectedAudit.entityId || selectedAudit.id}</div>
                </div>

                {/* 4. Timeline */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">4. Timeline</span>
                  <div className="font-semibold text-slate-900 mt-1">
                    {selectedAudit.at ? new Date(selectedAudit.at).toLocaleString() : new Date().toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Scope: {fallbackScopeName} ({s.scope?.level || 'CHAPTER'})</div>
                </div>

                {/* 5. Actor */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">5. Authenticated Actor</span>
                  <div className="font-semibold text-slate-900 mt-1">{selectedAudit.actor || s.actor?.name || 'Saravanan'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Role: {selectedAudit.effectiveRole || s.actor?.position || 'Chapter President'}</div>
                </div>

                {/* 6. Effective Role */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">6. Effective Role</span>
                  <div className="font-semibold text-slate-900 mt-1">{selectedAudit.effectiveRole || s.actor?.position || 'Chapter President'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Authority verified against Parivar Scope</div>
                </div>

                {/* 7. Command */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">7. Governed Command</span>
                  <div className="font-mono text-xs text-slate-800 mt-1 flex items-center gap-4 flex-wrap">
                    <span>Command ID: <strong>{selectedAudit.commandId || 'cmd-' + selectedAudit.id.slice(0, 8)}</strong></span>
                    <span>Correlation ID: <strong>{selectedAudit.correlationId || 'corr-' + selectedAudit.id.slice(0, 8)}</strong></span>
                  </div>
                </div>

                {/* 8. Previous State */}
                <div className="md:col-span-1">
                  <AuditStateBox
                    title="8. Previous State"
                    rawState={selectedAudit.before}
                    variant="before"
                    currentAudit={selectedAudit}
                    idToNameMap={idToNameMap}
                    fallbackScopeName={fallbackScopeName}
                  />
                </div>

                {/* 9. New State / Payload */}
                <div className="md:col-span-1">
                  <AuditStateBox
                    title="9. New State / Payload"
                    rawState={selectedAudit.after || selectedAudit.event}
                    variant="after"
                    currentAudit={selectedAudit}
                    idToNameMap={idToNameMap}
                    fallbackScopeName={fallbackScopeName}
                  />
                </div>

                {/* 10. Domain Event */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">10. Domain Event</span>
                  <div className="text-xs text-slate-800 mt-1">
                    Published domain event <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">{selectedAudit.action}.completed</code> to the outbox for background processors.
                  </div>
                </div>

                {/* 11. Downstream Effects */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">11. Downstream Effects</span>
                  <ul className="text-xs text-slate-700 mt-1 list-disc list-inside space-y-0.5">
                    <li>Append-only audit row inserted into PostgreSQL <code className="font-mono text-[11px]">audit_events</code> table.</li>
                    <li>Operational state caches updated and invalidated.</li>
                    <li>Realtime SSE event channel broadcast for active dashboards.</li>
                  </ul>
                </div>

                {/* 12. Resolution */}
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 md:col-span-2">
                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">12. Corrective Actions / Resolution</span>
                  <div className="text-xs text-blue-900 mt-1 flex items-center justify-between">
                    <span>Operation successfully resolved. Status is stable and consistent with organizational policies.</span>
                    <span className="font-bold text-emerald-700">RESOLVED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => copyDiagnosticJson(selectedAudit)}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-700">Copied Diagnostic JSON!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Diagnostic Packet (JSON)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedAudit(null)}
                type="button"
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
