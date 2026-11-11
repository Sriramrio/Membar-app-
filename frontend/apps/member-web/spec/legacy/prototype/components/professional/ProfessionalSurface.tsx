import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowRight, BellRing, BriefcaseBusiness, Building2, CalendarDays,
  CheckCircle2, ChevronRight, CircleDollarSign, CloudOff, Database, Download, Eye, FileText,
  GitBranch, Info, Layers3, LayoutGrid, List, LockKeyhole, MapPin, MessageSquare, Network,
  Plus, RefreshCw, Save, Search, Send, Settings, ShieldCheck, SlidersHorizontal, Star, Tag,
  TestTube2, TrendingUp, UploadCloud, UserRoundCheck, Users, Wifi, Workflow
} from 'lucide-react';
import type { ScreenDefinition } from '@/types/screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Stepper } from '@/components/ui/Stepper';
import { Table } from '@/components/common/Table';
import { Input } from '@/components/common/Input';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectWorkspace } from '@/features/auth/authSlice';
import { toggleSavedItem, setPollResponse, setPrototypeSetting, patchRecord, addAudit, setFeedback } from '../../prototypeSlice';
import { rowsForScreen, type DemoRow } from '../../demoData';
import { ActionWorkbench } from './ActionWorkbench';
import { RecordInspector } from './RecordInspector';
import { actionTone, cleaned, recordId, screenKind } from './screenUtils';
import { ActionPalette } from './ActionPalette';
import { SmartField } from './SmartField';

function uid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function strip(s: string) {
  return s.replace(/[.]+$/, '').trim();
}

function text(v: unknown) {
  return v === null || v === undefined || v === '' ? '—' : String(v);
}

function rowStatus(row: Record<string, unknown>) {
  return text(row.status ?? row.stage ?? row.state ?? row.result ?? 'Current');
}

function statusTone(status: string) {
  const x = status.toLowerCase();
  if (/active|approved|published|reconciled|posted|connected|healthy|complete|finalised|current|effective|succeeded|verified|ready/.test(x)) return 'bg-emerald-50 text-emerald-700';
  if (/reject|denied|blocked|failed|overdue|disputed|high|exception/.test(x)) return 'bg-red-50 text-red-700';
  if (/pending|await|review|action|watch|due|scheduled|draft|warning|closing|degraded/.test(x)) return 'bg-amber-50 text-amber-700';
  return 'bg-sky-50 text-sky-700';
}

function applyOverrides(rows: DemoRow[], overrides: Record<string, Record<string, unknown>> | undefined): DemoRow[] {
  return rows.map(row => {
    const id = recordId(row);
    return overrides?.[id] ? ({ ...row, ...overrides[id] } as DemoRow) : row;
  });
}

function Metric({ label, value, note, Icon = TrendingUp }: { label: string; value: string; note: string; Icon?: typeof TrendingUp }) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="absolute right-3 top-3 grid size-9 place-items-center rounded-xl bg-slate-50 text-slate-500">
        <Icon className="size-4" />
      </div>
      <span className="text-xs font-bold uppercase tracking-[.08em] text-slate-500">{label}</span>
      <strong className="mt-2 block pr-10 text-2xl font-black tracking-tight text-[var(--navy-900)]">{value}</strong>
      <small className="mt-1 block text-slate-500">{note}</small>
    </Card>
  );
}

function Toolbar({ screen, rows, onAction, onRefresh, onExport }: { screen: ScreenDefinition; rows: DemoRow[]; onAction: (a: string) => void; onRefresh: () => void; onExport: () => void }) {
  return (
    <Card className="p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <strong className="text-sm text-[var(--navy-900)]">Workspace records</strong>
          <p className="mt-1 text-xs text-slate-500">{rows.length} records in your current scope</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onRefresh}><RefreshCw className="size-4" />Refresh</Button>
          <Button variant="secondary" onClick={onExport}><Download className="size-4" />Export CSV</Button>
          {screen.primaryActions.slice(0, 2).map((action, index) => (
            <Button key={action} variant={index === 0 ? 'default' : actionTone(action)} onClick={() => onAction(strip(action))}>
              {index === 0 && <Plus className="size-4" />}
              {strip(action)}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function RecordExplorer({ screen, rows, onSelect, onAction }: { screen: ScreenDefinition; rows: DemoRow[]; onSelect: (row: DemoRow) => void; onAction: (a: string) => void }) {
  const [params, setParams] = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const query = params.get('q') ?? '';
  const status = params.get('status') ?? 'All';
  const view = (params.get('view') === 'grid' ? 'grid' : 'table') as 'grid' | 'table';
  const scope = params.get('scope') ?? 'All';
  const sort = params.get('sort') ?? 'default';
  const statuses = Array.from(new Set(rows.map(rowStatus))).sort();
  const scopes = Array.from(new Set(rows.map(row => text(row.scope ?? row.unit ?? row.chapter ?? row.location ?? 'All')).filter(x => x !== '—' && x !== 'All'))).slice(0, 20);

  function update(key: string, value: string, defaultValue?: string) {
    const next = new URLSearchParams(params);
    if (!value || value === defaultValue) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  function clearFilters() {
    const next = new URLSearchParams(params);
    ['q', 'status', 'scope', 'sort'].forEach(k => next.delete(k));
    setParams(next, { replace: true });
  }

  const filtered = useMemo(() => {
    const list = rows.filter(row => {
      const bag = Object.values(row).join(' ').toLowerCase();
      const matchQuery = !query.trim() || bag.includes(query.toLowerCase());
      const matchStatus = status === 'All' || rowStatus(row) === status;
      const rowScope = text(row.scope ?? row.unit ?? row.chapter ?? row.location ?? 'All');
      const matchScope = scope === 'All' || rowScope === scope;
      return matchQuery && matchStatus && matchScope;
    });
    if (sort === 'status') return [...list].sort((a, b) => rowStatus(a).localeCompare(rowStatus(b)));
    if (sort === 'recent') return [...list].reverse();
    return list;
  }, [rows, query, status, scope, sort]);

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <Card className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => update('q', e.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-3 focus:ring-sky-100"
              placeholder={`Search within ${screen.title.toLowerCase()}...`}
              aria-label={`Search ${screen.title}`}
            />
          </div>
          <select
            aria-label="Status filter"
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"
            value={status}
            onChange={e => update('status', e.target.value, 'All')}
          >
            <option>All</option>
            {statuses.map(x => <option key={x}>{x}</option>)}
          </select>
          <Button variant="secondary" onClick={() => setShowAdvanced(v => !v)} aria-expanded={showAdvanced}>
            <SlidersHorizontal className="size-4" />
            {showAdvanced ? 'Hide filters' : 'More filters'}
          </Button>
          <div className="flex rounded-xl border border-slate-200 p-1">
            <button
              type="button"
              className={`grid size-9 place-items-center rounded-lg ${view === 'table' ? 'bg-[var(--navy-900)] text-white' : 'text-slate-500'}`}
              onClick={() => update('view', 'table', 'table')}
              aria-label="Table view"
            >
              <List className="size-4" />
            </button>
            <button
              type="button"
              className={`grid size-9 place-items-center rounded-lg ${view === 'grid' ? 'bg-[var(--navy-900)] text-white' : 'text-slate-500'}`}
              onClick={() => update('view', 'grid', 'table')}
              aria-label="Card view"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>
        {showAdvanced && (
          <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="grid gap-1 text-xs font-bold text-slate-500">
              <span>Organisational / record scope</span>
              <select value={scope} onChange={e => update('scope', e.target.value, 'All')} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
                <option>All</option>
                {scopes.map(x => <option key={x}>{x}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-bold text-slate-500">
              <span>Sort</span>
              <select value={sort} onChange={e => update('sort', e.target.value, 'default')} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
                <option value="default">Recommended order</option>
                <option value="status">Status</option>
                <option value="recent">Most recent</option>
              </select>
            </label>
            <Button variant="ghost" className="self-end" onClick={clearFilters}>Clear filters</Button>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>{filtered.length} of {rows.length} records</span>
          <span>Filters stay applied while you inspect a record and return.</span>
        </div>
      </Card>

      {view === 'table' ? (
        <Table data={filtered} ariaLabel={`${screen.title} records`} onRowClick={row => onSelect(row as DemoRow)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(row => (
            <button
              key={recordId(row)}
              type="button"
              onClick={() => onSelect(row)}
              className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_2px_16px_rgba(15,23,42,.04)] transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">{recordId(row)}</span>
                  <h3 className="mt-1 truncate text-base font-black text-[var(--navy-900)]">
                    {text(row.title ?? row.member ?? row.business ?? row.record ?? row.process ?? row.policy ?? row.meeting ?? row.form ?? row.integration ?? row.setting)}
                  </h3>
                </div>
                <Badge className={statusTone(rowStatus(row))}>{rowStatus(row)}</Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                {Object.entries(row).filter(([k]) => !['id', 'status', 'title', 'member', 'business', 'record'].includes(k)).slice(0, 3).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="capitalize text-slate-400">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <strong className="truncate text-right text-slate-700">{text(v)}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-bold text-sky-700">
                <span>View details</span>
                <ChevronRight className="size-4 transition group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <Alert tone="info" title="No records match current filters">
          <span>Broaden search query or clear active filters. Filter state is preserved during navigation.</span>
          <Button className="ml-3" variant="secondary" onClick={clearFilters}>Clear filters</Button>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {screen.primaryActions.slice(0, 5).map(action => (
          <Button key={action} variant={actionTone(action)} onClick={() => onAction(strip(action))}>
            {strip(action)}
          </Button>
        ))}
      </div>
    </div>
  );
}

function DashboardSurface({ screen, onAction }: { screen: ScreenDefinition; onAction: (a: string) => void }) {
  const navigate = useNavigate();
  const cards = screen.id === 2 ? [
    ['Business References', '18', '6 need action', Network],
    ['Transactions', '7', '3 need confirmation', CircleDollarSign],
    ['Attendance', '86%', '8 of 9 finalised', UserRoundCheck],
    ['Member Interactions', '42', '+12 this month', Activity]
  ] : screen.id === 43 ? [
    ['Active Members', '1,284', '98.7% verified', Users],
    ['Pending Workflows', '19', '4 due today', Workflow],
    ['Attendance Rate', '86%', 'Finalised period', UserRoundCheck],
    ['Payment Exceptions', '7', '₹62,500 under review', CircleDollarSign]
  ] : screen.id === 56 ? [
    ['Open Decisions', '8', '2 need action', ShieldCheck],
    ['Policy Exceptions', '4', '1 expiring soon', AlertTriangle],
    ['Strategic Outcomes', '12', '9 on track', TrendingUp],
    ['Role Changes', '6', 'Next 30 days', Users]
  ] : screen.id === 59 ? [
    ['Objectives', '8', '6 on track', TrendingUp],
    ['Initiatives', '14', '3 need attention', BriefcaseBusiness],
    ['Measures', '22', '18 current', Activity],
    ['Review Actions', '5', '2 due this month', CheckCircle2]
  ] : [
    ['Availability', '99.98%', 'Last 30 days', Wifi],
    ['Security Signals', '3', 'No critical', LockKeyhole],
    ['Integration Jobs', '14', '2 retrying', Database],
    ['Data Quality Issues', '27', '6 high priority', TestTube2]
  ];

  const worklistRoute = screen.id === 2
    ? '/app/activity'
    : screen.id === 43
    ? '/manage/workflows'
    : screen.id === 56
    ? '/governance/decisions'
    : screen.id === 59
    ? '/governance/strategy'
    : '/platform-admin/audit';

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, note, Icon]) => (
          <Metric key={String(label)} label={String(label)} value={String(value)} note={String(note)} Icon={Icon as typeof TrendingUp} />
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[var(--navy-900)]">Priority Action Worklist</h3>
              <p className="text-sm text-slate-500">Actionable items sorted by SLA and operational priority.</p>
            </div>
            <Button variant="secondary" onClick={() => navigate(worklistRoute)}>
              Open Full Worklist
              <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="mt-4 grid gap-3">
            {[
              ['Due today', 'Confirm pending business / workflow action', 'Record is within active role scope'],
              ['New', 'Review recently assigned governance item', 'Evidence and audit trail attached'],
              ['Attention', 'Resolve operational exception before SLA', 'Escalation policy configured']
            ].map(([state, title, note], i) => (
              <button
                type="button"
                key={title}
                onClick={() => onAction(i === 0 ? (screen.primaryActions[0] ? strip(screen.primaryActions[0]) : 'Open action') : 'Review Record')}
                className="flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50/30"
              >
                <Badge className={i === 2 ? 'bg-red-50 text-red-700' : i === 0 ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}>
                  {state}
                </Badge>
                <div className="min-w-0 flex-1">
                  <strong className="block text-sm text-slate-800">{title}</strong>
                  <span className="text-xs text-slate-500">{note}</span>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-emerald-700" />
            <h3 className="text-lg font-black text-[var(--navy-900)]">Operational Signal</h3>
          </div>
          <div className="mt-5 flex h-40 items-end gap-3" aria-label="Operational trend chart">
            {[42, 58, 51, 68, 73, 82, 91].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-lg bg-sky-600/80 transition-all hover:bg-sky-600" style={{ height: `${v}%` }} />
                <span className="text-[10px] font-bold text-slate-400">W{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Weekly operational progression across active chapters and governed workflows.</p>
        </Card>
      </section>
    </div>
  );
}

function DetailSurface({ screen, rows, onSelect, onAction }: { screen: ScreenDefinition; rows: DemoRow[]; onSelect: (r: DemoRow) => void; onAction: (a: string) => void }) {
  const row = rows[0] ?? {};
  const id = recordId(row);
  return (
    <div className="w-full min-w-0 max-w-full space-y-5">
      <Card className="w-full min-w-0 max-w-full overflow-hidden p-0">
        <div className="bg-gradient-to-r from-[var(--navy-950)] to-[var(--navy-800)] p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="bg-white/10 text-white">{id}</Badge>
              <h2 className="mt-3 text-2xl font-black">{text(row.title ?? row.headline ?? row.member ?? row.business ?? row.need ?? row.meeting ?? screen.title)}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">{screen.purpose}</p>
            </div>
            <Badge className="bg-white text-[var(--navy-900)]">{rowStatus(row)}</Badge>
          </div>
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          {Object.entries(row).filter(([k]) => !['id', 'status', 'title', 'headline', 'member', 'business', 'need', 'meeting'].includes(k)).slice(0, 9).map(([k, v]) => (
            <div key={k} className="border-b border-r border-slate-100 p-4">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{k.replace(/([A-Z])/g, ' $1')}</span>
              <strong className="mt-1 block text-sm text-slate-800">{text(v)}</strong>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,.36fr)]">
        <Card className="w-full min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-[var(--navy-900)]">Workflow & Activity History</h3>
            <Button variant="secondary" onClick={() => onSelect(row)}><Eye className="size-4" />Inspect Full Record</Button>
          </div>
          <ol className="mt-5 grid gap-4 border-l-2 border-slate-200 pl-5">
            {['Record loaded with current access', 'Latest workflow state loaded', 'Next action is ready'].map((x, i) => (
              <li key={x} className="relative">
                <span className={`absolute -left-[27px] mt-1 size-3 rounded-full ${i === 2 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <strong className="text-sm text-slate-800">{x}</strong>
                <p className="mt-1 text-xs text-slate-500">
                  {i === 0 ? 'Field visibility and relationship rules applied.' : i === 1 ? 'Record version checked before showing action controls.' : 'SLA, owner and recovery path remain active.'}
                </p>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="w-full min-w-0 max-w-full overflow-hidden">
          <h3 className="font-black text-[var(--navy-900)]">Available Operations</h3>
          <div className="mt-3 grid gap-2">
            {screen.primaryActions.slice(0, 6).map((action, i) => (
              <Button key={action} variant={i === 0 ? 'default' : actionTone(action)} className="justify-start" onClick={() => onAction(strip(action))}>
                {strip(action)}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function FormSurface({ screen, onAction }: { screen: ScreenDefinition; onAction: (a: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const fields = cleaned(screen.requiredData).filter(x => !/^kpis?:/i.test(x)).slice(0, 12);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    onAction(screen.primaryActions.find(a => /submit|save|publish|create|update|verify|send/i.test(a)) ? strip(screen.primaryActions.find(a => /submit|save|publish|create|update|verify|send/i.test(a))!) : strip(screen.primaryActions[0] ?? 'Save Record'));
  }

  if (submitted) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-4">
        <Alert tone="success" title="Form validation passed">
          Values successfully captured and staged for controlled workflow processing.
        </Alert>
        <div>
          <Button variant="secondary" onClick={() => setSubmitted(false)}>Return to Edit Form</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full min-w-0 max-w-full space-y-5">
      <Card>
        <div className="mb-5">
          <h3 className="text-lg font-black text-[var(--navy-900)]">{screen.title} Details</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">Complete required inputs below. Permissions and validation rules are evaluated upon submission.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field, i) => (
            <SmartField key={field} label={field} required={i < 3 || /consent/i.test(field)} value={values[field] ?? ''} onChange={value => setValues(v => ({ ...v, [field]: value }))} />
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <span className="text-xs text-slate-500">Draft-safe · validation-aware · dual-approval enforced on commit</span>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => onAction('Save draft')}>
              <Save className="size-4" />
              Save In-Progress Draft
            </Button>
            <Button type="submit">
              Validate & Proceed
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}

function ProfileSurface({ screen, rows, onAction, onSelect }: { screen: ScreenDefinition; rows: DemoRow[]; onAction: (a: string) => void; onSelect: (r: DemoRow) => void }) {
  const title = screen.id === 32 ? 'Personal & Professional Profile' : screen.id === 33 ? 'Associated Businesses' : screen.id === 34 ? 'Private Family Information' : 'Membership Identity & Tenure';
  const privacy = screen.id === 34 ? 'Highly restricted: visible only for an explicitly approved organisational purpose.' : screen.id === 35 ? 'Membership and tenure history are server-authoritative and effective-dated.' : 'Visibility and approval state are shown per field or record.';
  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,.38fr)]">
        <Card className="w-full min-w-0 max-w-full overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[var(--navy-900)]">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">Review approved values, privacy classification, and workflow state before editing.</p>
            </div>
            <Button onClick={() => onAction(screen.primaryActions[0] ? strip(screen.primaryActions[0]) : 'Update Information')}>
              <Plus className="size-4" />
              {screen.primaryActions[0] ? strip(screen.primaryActions[0]) : 'Update Information'}
            </Button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {rows.map(row => (
              <button
                type="button"
                key={recordId(row)}
                onClick={() => onSelect(row)}
                className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300 hover:bg-sky-50/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-[.12em] text-slate-400">{recordId(row)}</span>
                    <strong className="mt-1 block text-sm text-[var(--navy-900)]">{text(row.field ?? row.business ?? row.relation ?? row.membershipNo ?? row.record)}</strong>
                  </div>
                  <Badge className={statusTone(rowStatus(row))}>{rowStatus(row)}</Badge>
                </div>
                <dl className="mt-3 grid gap-2 text-xs text-slate-600">
                  {Object.entries(row).filter(([k]) => !['id', 'status', 'field', 'business', 'relation', 'membershipNo', 'record'].includes(k)).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 border-t border-slate-100 pt-2">
                      <dt className="font-bold capitalize text-slate-400">{k.replace(/([A-Z])/g, ' $1')}</dt>
                      <dd className="max-w-[62%] text-right font-semibold text-slate-700">{text(v)}</dd>
                    </div>
                  ))}
                </dl>
              </button>
            ))}
          </div>
        </Card>
        <div className="grid gap-4">
          <Card className="border-sky-200 bg-sky-50/50">
            <ShieldCheck className="size-6 text-sky-700" />
            <h3 className="mt-3 font-black text-[var(--navy-900)]">Privacy & Governance</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{privacy}</p>
            <ul className="mt-3 grid gap-2 text-sm text-slate-600">
              <li>• Approved attributes remain effective while updates are reviewed.</li>
              <li>• Sensitive identifiers are masked in lists, exports, and audit logs.</li>
              <li>• Lineage preserves prior versions across all effective date ranges.</li>
            </ul>
          </Card>
          <Card>
            <h3 className="font-black text-[var(--navy-900)]">Quick Actions</h3>
            <div className="mt-3 grid gap-2">
              {screen.primaryActions.slice(0, 6).map((action, i) => (
                <Button key={action} variant={i === 0 ? 'default' : actionTone(action)} className="justify-start" onClick={() => onAction(strip(action))}>
                  {strip(action)}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CalendarSurface({ screen, rows, onAction }: { screen: ScreenDefinition; rows: DemoRow[]; onAction: (a: string) => void }) {
  const dispatch = useAppDispatch();
  const responses = useAppSelector(s => s.prototype?.pollResponses ?? {});
  const selected = String(rows[0]?.id ?? 'MTG-2409');
  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
        <Card className="w-full min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-[var(--navy-900)]">Schedule</h3>
              <p className="text-sm text-slate-500">Meetings, chapter assemblies and one-to-one commitments.</p>
            </div>
            <Button onClick={() => onAction(screen.primaryActions[0] ? strip(screen.primaryActions[0]) : 'Schedule Meeting')}>
              <CalendarDays className="size-4" />
              {screen.primaryActions[0] ? strip(screen.primaryActions[0]) : 'Schedule Meeting'}
            </Button>
          </div>
          <div className="mt-5 grid gap-3">
            {rows.slice(0, 5).map(row => (
              <button key={recordId(row)} type="button" onClick={() => onAction('Inspect Schedule')} className="grid min-h-20 grid-cols-[4rem_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-sky-300">
                <div className="grid size-14 place-items-center rounded-xl bg-sky-50 text-center text-xs font-black text-sky-700">
                  <CalendarDays className="size-5" />
                </div>
                <div className="min-w-0">
                  <strong className="block truncate text-sm text-slate-800">{text(row.title ?? row.meeting ?? row.participant)}</strong>
                  <span className="mt-1 block text-xs text-slate-500">{text(row.date)} · {text(row.venue ?? row.mode ?? row.unit)}</span>
                </div>
                <Badge className={statusTone(rowStatus(row))}>{rowStatus(row)}</Badge>
              </button>
            ))}
          </div>
        </Card>
        <Card className="w-full min-w-0 max-w-full overflow-hidden">
          <h3 className="text-lg font-black text-[var(--navy-900)]">Attendance / RSVP</h3>
          <p className="mt-1 text-sm text-slate-500">Confirm attendance status. Time constraints and eligibility enforced by policy.</p>
          <div className="mt-5 grid gap-2">
            {['Attending', 'Not attending', 'Maybe'].map(option => (
              <button
                type="button"
                key={option}
                onClick={() => dispatch(setPollResponse({ key: selected, value: option }))}
                className={`min-h-12 rounded-xl border px-4 text-left text-sm font-bold transition ${responses[selected] === option ? 'border-sky-600 bg-sky-50 text-sky-800' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                {option}
                {responses[selected] === option && <CheckCircle2 className="float-right size-5 text-sky-700" />}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <h4 className="font-bold text-[var(--navy-900)]">Attendance Guidelines</h4>
            <ul className="mt-2 grid gap-1 text-sm text-slate-600">
              <li>• Poll closures enforce authoritative time limits.</li>
              <li>• Substitute representatives must be nominated 24 hours prior.</li>
              <li>• Meeting minutes and attendance records are immutably archived.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MessagesSurface({ screen, onAction }: { screen: ScreenDefinition; onAction: (a: string) => void }) {
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState<Record<number, string[]>>({});
  const [query, setQuery] = useState('');
  const conversations = [
    ['Ramesh Iyer', 'Direct · Connected', '2'],
    ['Hosur Chapter Business Forum', 'Chapter Group', '5'],
    ['Deepa Raman', 'Connection Pending', '0']
  ];
  const visible = conversations.map((item, index) => ({ item, index })).filter(({ item }) => !query.trim() || item.join(' ').toLowerCase().includes(query.toLowerCase()));
  const activeConversation = conversations[active] ?? conversations[0];

  return (
    <div className="w-full min-w-0 max-w-full">
      <div className="grid min-h-[34rem] w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[19rem_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 p-3 md:border-b-0 md:border-r">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm"
            placeholder="Search conversations"
            aria-label="Search conversations"
          />
        </div>
        <div className="mt-3 grid gap-1">
          {visible.map(({ item: [name, scope, count], index: i }) => (
            <button
              type="button"
              key={name}
              onClick={() => setActive(i)}
              className={`rounded-xl p-3 text-left transition ${active === i ? 'bg-sky-50 ring-1 ring-sky-200' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm text-slate-800">{name}</strong>
                {Number(count) > 0 && <Badge className="bg-[var(--maroon-700)] text-white">{count}</Badge>}
              </div>
              <span className="mt-1 block text-xs text-slate-500">{scope}</span>
            </button>
          ))}
          {visible.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No conversations match “{query}”.</p>}
        </div>
      </aside>
      <section className="flex min-w-0 flex-col">
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 px-4">
          <div>
            <strong className="text-slate-800">{activeConversation[0]}</strong>
            <span className="block text-xs text-slate-500">{activeConversation[1]}</span>
          </div>
          <Button variant="ghost" onClick={() => onAction('Conversation details')}><Info className="size-4" />View Details</Button>
        </header>
        <div className="flex-1 space-y-3 bg-slate-50/50 p-5" aria-live="polite">
          <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white p-3 text-sm shadow-sm">
            I have shared the updated requirement for your review.
          </div>
          <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[var(--navy-900)] p-3 text-sm text-white">
            Thank you. I will review and respond today.
          </div>
          {(sent[active] ?? []).map((x, i) => (
            <div key={`${active}-${i}`} className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[var(--navy-900)] p-3 text-sm text-white">
              {x}
            </div>
          ))}
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (message.trim() && active !== 2) {
              setSent(v => ({ ...v, [active]: [...(v[active] ?? []), message.trim()] }));
              setMessage('');
            }
          }}
          className="flex gap-2 border-t border-slate-200 p-3"
        >
          <input
            disabled={active === 2}
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="min-h-11 flex-1 rounded-xl border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            placeholder={active === 2 ? 'Messaging unlocks after bilateral connection acceptance' : 'Write a secure message…'}
          />
          <Button type="submit" disabled={active === 2 || !message.trim()}><Send className="size-4" />Send Message</Button>
        </form>
      </section>
    </div>
    </div>
  );
}

function SettingsSurface({ screen, rows, onAction }: { screen: ScreenDefinition; rows: DemoRow[]; onAction: (a: string) => void }) {
  const dispatch = useAppDispatch();
  const state = useAppSelector(s => s.prototype?.settings ?? {});

  if (screen.id === 41) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,.42fr)]">
          <Card className="w-full min-w-0 max-w-full overflow-hidden">
            <h3 className="text-lg font-black text-[var(--navy-900)]">Security Controls & Credentials</h3>
            <p className="mt-1 text-sm text-slate-500">Multi-factor authentication, trusted devices, and active session management.</p>
            <div className="mt-5 divide-y divide-slate-100">
              {rows.map(row => (
                <div key={recordId(row)} className="flex flex-wrap items-center gap-4 py-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><LockKeyhole className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <strong className="text-sm text-slate-800">{text(row.control)}</strong>
                    <p className="mt-1 text-xs text-slate-500">{text(row.value)} · Risk tier: {text(row.risk)}</p>
                  </div>
                  <Button variant="secondary" onClick={() => onAction(`Configure ${text(row.control)}`)}>Configure</Button>
                </div>
              ))}
            </div>
          </Card>
          <Card className="w-full min-w-0 max-w-full overflow-hidden">
            <ShieldCheck className="size-6 text-sky-700" />
            <h3 className="mt-3 font-black text-[var(--navy-900)]">Assurance Policy</h3>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
              <li>• Sessions automatically expire after 15 minutes of inactivity.</li>
              <li>• Privileged actions require biometric or hardware-token step-up.</li>
              <li>• All administrative operations produce immutable audit entries.</li>
            </ul>
          </Card>
        </div>
      </div>
    );
  }

  if (screen.id === 42) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {rows.map((row, i) => (
            <Card key={recordId(row)} className="w-full min-w-0 max-w-full overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-sky-50 text-sky-700">
                  {i === 0 ? <Wifi className="size-5" /> : i === 1 ? <Download className="size-5" /> : <CloudOff className="size-5" />}
                </span>
                <Badge className={statusTone(rowStatus(row))}>{rowStatus(row)}</Badge>
              </div>
              <h3 className="mt-4 font-black text-[var(--navy-900)]">{text(row.capability)}</h3>
              <dl className="mt-3 grid gap-2 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase text-slate-400">Offline Availability</dt>
                  <dd className="font-semibold text-slate-700">{text(row.offline)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-slate-400">Encrypted Storage</dt>
                  <dd className="font-semibold text-slate-700">{text(row.sensitiveData)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-slate-400">Update Policy</dt>
                  <dd className="font-semibold text-slate-700">{text(row.update)}</dd>
                </div>
              </dl>
              <Button
                className="mt-4 w-full"
                variant={i === 0 ? 'default' : 'secondary'}
                onClick={() => onAction(i === 0 ? 'Install PWA Application' : i === 1 ? 'Refresh Offline Cache' : 'Review Security Policy')}
              >
                {i === 0 ? 'Install PWA Application' : i === 1 ? 'Refresh Offline Cache' : 'Review Security Policy'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,.42fr)]">
        <Card className="w-full min-w-0 max-w-full overflow-hidden">
          <div className="grid gap-1">
            <h3 className="text-lg font-black text-[var(--navy-900)]">Platform Configuration</h3>
            <p className="text-sm text-slate-500">Configure parameters; security baselines remain locked by policy.</p>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {rows.map(row => {
              const key = `${screen.id}:${recordId(row)}`;
              const current = state[key] ?? !/off|disabled/i.test(Object.values(row).join(' '));
              const locked = /mandatory.*yes|locked on/i.test(Object.values(row).join(' ').toLowerCase());
              return (
                <div key={recordId(row)} className="flex flex-wrap items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <strong className="text-sm text-slate-800">{text(row.setting ?? row.topic ?? row.control ?? row.capability)}</strong>
                    <p className="mt-1 text-xs text-slate-500">{text(row.impact ?? row.value ?? row.offline ?? row.mandatory ?? 'Managed setting')}{locked ? ' · mandatory baseline' : ''}</p>
                  </div>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => dispatch(setPrototypeSetting({ key, value: !current }))}
                    className={`relative h-7 w-12 rounded-full transition ${current ? 'bg-emerald-600' : 'bg-slate-300'} disabled:cursor-not-allowed disabled:opacity-60`}
                    aria-label={`Toggle ${text(row.setting ?? row.topic ?? row.control)}`}
                    aria-pressed={Boolean(current)}
                  >
                    <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${current ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => onAction(screen.primaryActions[0] ? strip(screen.primaryActions[0]) : 'Save Platform Settings')}>
              Save Platform Settings
            </Button>
          </div>
        </Card>
        <Card className="w-full min-w-0 max-w-full overflow-hidden">
          <Settings className="size-6 text-sky-700" />
          <h3 className="mt-3 font-black text-[var(--navy-900)]">Governance Policy</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
            <li>• Mandatory compliance rules cannot be overridden by tenant settings.</li>
            <li>• Global setting changes generate immutable audit trails.</li>
            <li>• Multi-tenant parameter modifications require dual governance authorization.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function MatrixSurface({ screen, rows, onAction }: { screen: ScreenDefinition; rows: DemoRow[]; onAction: (a: string) => void }) {
  const [simulated, setSimulated] = useState(false);
  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <Alert tone="info" title={screen.id === 68 ? 'Default Deny Policy & Matrix' : 'Segregation-Aware Responsibility Model'}>
        {screen.id === 68
          ? 'Authoritative server evaluations enforce resource, action, scope, field masking, and tenure rules on every controlled endpoint.'
          : 'RACI matrix establishes accountability boundaries and dual-approval enforcement.'}
      </Alert>
      <Table data={rows} ariaLabel={screen.title} />
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-black text-[var(--navy-900)]">{screen.id === 68 ? 'Policy Simulator' : 'Segregation Validator'}</h3>
            <p className="mt-1 text-sm text-slate-500">Simulate role actions against active policies in safe sandbox mode.</p>
          </div>
          <Button onClick={() => setSimulated(true)}>
            <TestTube2 className="size-4" />
            Run Simulation
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {['Role / Process', 'Resource / Step', 'Action / Accountable', 'Scope / Unit'].map(x => (
            <label key={x} className="grid gap-1.5 text-sm font-semibold">
              <span>{x}</span>
              <select className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-medium text-slate-700">
                <option>Active Role Context</option>
                <option>Alternative Chapter Context</option>
              </select>
            </label>
          ))}
        </div>
        {simulated && (
          <div className="mt-4">
            <Alert tone="success" title="Simulation Result: Allowed with Field Masking">
              Rule evaluated against Policy Engine v14. Action permitted with restricted attribute masking.
            </Alert>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => onAction(screen.primaryActions[0] ? strip(screen.primaryActions[0]) : 'Save Policy Version')}>
            {screen.primaryActions[0] ? strip(screen.primaryActions[0]) : 'Save Policy Version'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function DesignerSurface({ screen, rows, onAction }: { screen: ScreenDefinition; rows: DemoRow[]; onAction: (a: string) => void }) {
  const states = screen.id === 70
    ? ['Draft', 'Under Review', 'Checker Approval', 'Approved', 'Published']
    : screen.id === 66
    ? ['Country', 'State', 'Region', 'City', 'Chapter', 'Member']
    : screen.id === 72
    ? ['Identity', 'Business Profile', 'Consent & Terms', 'Review Draft', 'Submit']
    : screen.id === 76
    ? ['Template Catalog', 'Delivery Channels', 'Audience Scope', 'Rate Limits & Retry', 'Audit & Status']
    : screen.id === 77
    ? ['Placement', 'Scope', 'Eligibility', 'Commercial Terms', 'Creative Asset', 'Schedule']
    : ['Parent Taxonomy', 'Category', 'Subcategory', 'Synonyms', 'Publish'];

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <Card className="w-full min-w-0 max-w-full overflow-hidden p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-black text-[var(--navy-900)]">Visual Configuration Canvas</h3>
            <p className="text-sm text-slate-500">Inspect step definitions, SLA thresholds, and conditional transitions.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onAction('Preview Layout')}><Eye className="size-4" />Preview Layout</Button>
            <Button onClick={() => onAction(screen.primaryActions[0] ? strip(screen.primaryActions[0]) : 'Publish Configuration')}>
              {screen.primaryActions[0] ? strip(screen.primaryActions[0]) : 'Publish Configuration'}
            </Button>
          </div>
        </div>
        <div className="mt-6 w-full min-w-0 max-w-full overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
          <div className="flex min-w-max items-center gap-3">
            {states.map((state, i) => (
              <div key={state} className="flex items-center gap-3">
                <button
                  type="button"
                  className="w-48 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-400 hover:bg-sky-50/30"
                  onClick={() => onAction(`Inspect Node: ${state}`)}
                >
                  <div className="flex items-center justify-between">
                    <Badge className="bg-sky-100 text-sky-800 font-bold">Step {i + 1}</Badge>
                    <span className="text-[10px] font-bold text-slate-400">Node</span>
                  </div>
                  <strong className="mt-3 block text-sm font-black text-[var(--navy-900)]">{state}</strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">Owner · Rules · SLA · Evidence</span>
                </button>
                {i < states.length - 1 && <ArrowRight className="size-5 shrink-0 text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </Card>
      <RecordExplorer screen={screen} rows={rows} onSelect={() => onAction('Open Configuration')} onAction={onAction} />
    </div>
  );
}

function ImportSurface({ screen, rows, onAction }: { screen: ScreenDefinition; rows: DemoRow[]; onAction: (a: string) => void }) {
  const steps = [
    { title: 'Stage Batch', description: 'Raw file ingestion' },
    { title: 'Map Fields', description: 'Schema alignment' },
    { title: 'Validate', description: 'Format & rule checks' },
    { title: 'Reconcile', description: 'Deduplication' },
    { title: 'Checker Approval', description: 'Dual sign-off' },
    { title: 'Post', description: 'Commit to ledger' }
  ];
  const [step, setStep] = useState(2);

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,.35fr)]">
        <Card className="w-full min-w-0 max-w-full overflow-hidden">
          {/* Responsive Modern Stepper */}
          <Stepper
            steps={steps}
            currentStep={step}
            onStepClick={setStep}
            className="mb-6"
          />

          <div className="mt-5 w-full min-w-0 max-w-full">
            <Table data={rows} ariaLabel="Import batches" />
          </div>
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
              <div>
                <strong className="text-sm text-amber-950">Validation Staging Preview</strong>
                <p className="mt-1 text-sm text-amber-900/70">
                  Staged records have not altered live operational data. Duplicate and anomalous rows must be resolved prior to dual-checker authorization.
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card className="w-full min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-sky-50 text-sky-700">
              <UploadCloud className="size-6" />
            </span>
            <div>
              <h3 className="font-black text-[var(--navy-900)]">Staging Environment</h3>
              <span className="text-xs text-slate-500">File Ingestion & Schema Alignment</span>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Staged File</span>
                <span>member-import-q3.xlsx</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Total rows</span>
                <span>{rows.length * 15} records</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => onAction(screen.primaryActions[0] ? strip(screen.primaryActions[0]) : 'Authorize Import')}>
              {screen.primaryActions[0] ? strip(screen.primaryActions[0]) : 'Authorize Import'}
            </Button>
          </div>
          <div className="mt-5 text-sm leading-6 text-slate-600">
            <strong className="text-[var(--navy-900)]">Governance & Integrity Controls</strong>
            <p className="mt-1">Dual-checker verification · Idempotent batch key · Immutable transaction audit.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportSurface({ screen, rows, onAction, onSelect }: { screen: ScreenDefinition; rows: DemoRow[]; onAction: (a: string) => void; onSelect: (r: DemoRow) => void }) {
  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Current Records" value={String(rows.length)} note="In current scope" Icon={Database} />
        <Metric label="Action Required" value={String(rows.filter(r => /action|high|open|denied|pending/i.test(rowStatus(r))).length)} note="Requires review" Icon={AlertTriangle} />
        <Metric label="Data Freshness" value="< 5m" note="Live synchronized source" Icon={RefreshCw} />
        <Metric label="Export Compliance" value="Governed" note="Field masking enforced" Icon={Download} />
      </section>
      <RecordExplorer screen={screen} rows={rows} onSelect={onSelect} onAction={onAction} />
    </div>
  );
}

function WorkflowSurface({ screen, rows, onAction, onSelect }: { screen: ScreenDefinition; rows: DemoRow[]; onAction: (a: string) => void; onSelect: (r: DemoRow) => void }) {
  const groups = ['New / Assigned', 'In Review', 'Awaiting Approval', 'Completed'];
  const split = groups.map((group, gi) => ({ group, items: rows.filter((_, i) => i % groups.length === gi) }));

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {groups.map((g, i) => (
          <Metric
            key={g}
            label={g}
            value={String(split[i].items.length)}
            note={i === 0 ? 'Recently queued workflow' : i === 1 ? 'Under evaluation' : i === 2 ? 'Awaiting dual sign-off' : 'Closed with full audit'}
            Icon={i === 3 ? CheckCircle2 : i === 2 ? ShieldCheck : Workflow}
          />
        ))}
      </section>
      <div className="w-full min-w-0 max-w-full overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
        <div className="grid min-w-[64rem] grid-cols-4 gap-4">
          {split.map(({ group, items }, gi) => (
            <section key={group} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-[var(--navy-900)]">{group}</h3>
                <Badge className="bg-white text-slate-700 shadow-sm">{items.length}</Badge>
              </div>
              <div className="grid gap-3">
                {(items.length ? items : rows.slice(gi, gi + 1)).map(row => (
                  <button
                    type="button"
                    key={`${group}-${recordId(row)}`}
                    onClick={() => onSelect(row)}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <strong className="text-sm text-slate-800">{text(row.subject ?? row.title ?? row.member ?? row.campaign ?? row.proposal ?? row.policy ?? row.record ?? screen.title)}</strong>
                      <ChevronRight className="size-4 shrink-0 text-slate-400" />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{text(row.process ?? row.unit ?? row.owner ?? row.stage ?? 'Scoped workflow')}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge className={statusTone(rowStatus(row))}>{rowStatus(row)}</Badge>
                      <span className="text-[11px] font-semibold text-slate-400">SLA: {text(row.sla ?? 'Standard')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {screen.primaryActions.slice(0, 6).map(action => (
          <Button key={action} variant={actionTone(action)} onClick={() => onAction(strip(action))}>
            {strip(action)}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ContentSurface({ screen, rows, onAction, onSelect }: { screen: ScreenDefinition; rows: DemoRow[]; onAction: (a: string) => void; onSelect: (r: DemoRow) => void }) {
  const [query, setQuery] = useState('');
  const filtered = rows.filter(r => !query.trim() || Object.values(r).join(' ').toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <Card className="p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm"
              placeholder={`Search ${screen.title.toLowerCase()}…`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {screen.primaryActions.slice(0, 3).map(action => (
              <Button key={action} variant={actionTone(action)} onClick={() => onAction(strip(action))}>
                {strip(action)}
              </Button>
            ))}
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((row, i) => (
          <article key={recordId(row)} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
            <div className={`grid h-24 place-items-center ${i % 3 === 0 ? 'bg-sky-50' : i % 3 === 1 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
              <span className="grid size-12 place-items-center rounded-2xl bg-white shadow-sm text-[var(--navy-900)]">
                {screen.id === 27 ? <Eye className="size-6" /> : screen.id === 29 ? <Network className="size-6" /> : screen.id === 30 ? <FileText className="size-6" /> : screen.id === 31 ? <ShieldCheck className="size-6" /> : <BellRing className="size-6" />}
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-[.12em] text-slate-400">{recordId(row)}</span>
                  <h3 className="mt-1 line-clamp-2 font-black text-[var(--navy-900)]">{text(row.title ?? row.headline ?? row.partner ?? row.album ?? row.article ?? row.subject ?? row.record)}</h3>
                </div>
                <Badge className={statusTone(rowStatus(row))}>{rowStatus(row)}</Badge>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{text(row.body ?? row.benefit ?? row.category ?? row.topic ?? row.audience ?? row.unit ?? screen.purpose)}</p>
              <button
                type="button"
                onClick={() => onSelect(row)}
                className="mt-4 flex min-h-11 w-full items-center justify-between border-t border-slate-100 pt-3 text-sm font-bold text-sky-700 hover:text-sky-800"
              >
                <span>View Full Content</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && <Alert tone="info" title="No content matches">Clear active query or return to default feed.</Alert>}
    </div>
  );
}

function WorkspaceSurface() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const account = useAppSelector(s => s.auth.account);
  const workspaces = account?.workspaces ?? ['Member', 'Management', 'Governance', 'Platform Admin'];
  const route = (w: string) =>
    w === 'Member' ? '/app/home' :
    w === 'Management' ? '/manage/dashboard' :
    w === 'Governance' ? '/governance/dashboard' :
    '/platform-admin/dashboard';

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {workspaces.map((workspace, i) => (
        <button
          type="button"
          key={workspace}
          onClick={() => {
            dispatch(selectWorkspace(workspace));
            navigate(route(workspace));
          }}
          className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <span className="grid size-12 place-items-center rounded-xl bg-sky-50 text-sky-700 transition group-hover:bg-sky-100">
              {i === 0 ? <Users /> : i === 1 ? <Workflow /> : i === 2 ? <ShieldCheck /> : <Database />}
            </span>
            <ArrowRight className="size-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-sky-700" />
          </div>
          <h3 className="mt-5 text-xl font-black text-[var(--navy-900)]">{workspace}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {workspace === 'Member'
              ? 'Networking, business references, opportunities, meetings, and member profile.'
              : workspace === 'Management'
              ? 'Operations, attendance, payment reconciliation, and membership approvals.'
              : workspace === 'Governance'
              ? 'Strategy, board decisions, elections, and compliance oversight.'
              : 'Enterprise identity, hierarchy, policy matrix, integrations, and audit.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge className="bg-sky-50 text-sky-800 font-semibold">{account?.role ?? 'Executive'}</Badge>
            <Badge className="bg-slate-100 text-slate-700 font-semibold">{account?.unit ?? 'All Chapters'}</Badge>
          </div>
        </button>
      ))}
    </div>
  );
}

export function ProfessionalSurface({ screen }: { screen: ScreenDefinition }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const overrides = useAppSelector(s => s.prototype?.recordOverrides?.[screen.id]);
  const createdRecords = useAppSelector(s => s.prototype?.createdRecords?.[screen.id] ?? []);
  const feedback = useAppSelector(s => s.prototype?.lastFeedback);
  const auditEvents = useAppSelector(s => s.prototype?.audit ?? []);
  const actor = useAppSelector(s => s.auth?.account?.name ?? 'Authenticated Reviewer');
  const [selected, setSelected] = useState<DemoRow | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [actionRow, setActionRow] = useState<DemoRow | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const baseRows = useMemo(() => rowsForScreen(screen), [screen]);
  const liveAuditRows = useMemo<DemoRow[]>(
    () => (auditEvents ?? []).map(event => ({
      id: event.id,
      occurred: event.occurredAt,
      actor: event.actor,
      assignment: event.activeAssignment ?? '—',
      portal: event.workspace,
      action: event.action,
      resource: event.recordId ?? event.resource,
      result: event.result,
      correlationId: event.correlationId,
      status: event.result
    })),
    [auditEvents]
  );

  const sourceRows = useMemo(
    () => screen.id === 78 ? [...liveAuditRows, ...baseRows] : screen.id === 38 ? [...liveAuditRows.slice(0, 12), ...baseRows] : [...(createdRecords as DemoRow[]), ...baseRows],
    [screen.id, liveAuditRows, baseRows, createdRecords]
  );
  const rows = useMemo(() => applyOverrides(sourceRows, overrides as Record<string, Record<string, unknown>> | undefined), [sourceRows, overrides]);
  const kind = screenKind(screen);

  function openRow(row: DemoRow) {
    setSelected(row);
    setInspectorOpen(true);
  }

  function openAction(next: string, row: DemoRow | null = selected) {
    const x = next.toLowerCase();
    if (/workspace/.test(x) && screen.id !== 1) { navigate('/workspace'); return; }
    if (/create reference|new reference/.test(x) && screen.id !== 11) { navigate('/app/references/new'); return; }
    if (/create opportunity|new opportunity/.test(x) && screen.id !== 16) { navigate('/app/opportunities/new'); return; }
    if ((/respond|express interest/.test(x)) && (screen.id === 15 || screen.id === 17)) { navigate('/app/opportunities/op-401/respond'); return; }
    if (/message/.test(x) && [5, 6, 9].includes(screen.id)) { navigate('/app/messages/conv-1001'); return; }
    if (/one-to-one/.test(x) && screen.id !== 13) { navigate('/app/one-to-one'); return; }
    setAction(next);
    setActionRow(row ?? null);
  }

  function refresh() {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 450);
  }

  function exportData() {
    const safeHeaders = Object.keys(rows[0] ?? {});
    const csv = [safeHeaders.join(','), ...rows.map(r => safeHeaders.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sethu-${screen.id}-${screen.title.toLowerCase().replace(/\W+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    const correlationId = `COR-${uid().slice(0, 8).toUpperCase()}`;
    dispatch(addAudit({ id: uid(), occurredAt: new Date().toISOString(), action: 'EXPORT', resource: screen.route, result: 'Succeeded', actor, workspace: screen.workspace, correlationId }));
    dispatch(setFeedback({ screenId: screen.id, action: 'EXPORT', message: `Scoped CSV export prepared. Audit reference ${correlationId}.`, at: new Date().toISOString() }));
  }

  let body: ReactNode;
  if (screen.id === 1) body = <WorkspaceSurface />;
  else if (kind === 'dashboard') body = <DashboardSurface screen={screen} onAction={a => openAction(a, null)} />;
  else if (kind === 'profile') body = <ProfileSurface screen={screen} rows={rows} onAction={a => openAction(a, null)} onSelect={openRow} />;
  else if (kind === 'messages') body = <MessagesSurface screen={screen} onAction={a => openAction(a, null)} />;
  else if (kind === 'calendar') body = <CalendarSurface screen={screen} rows={rows} onAction={a => openAction(a, null)} />;
  else if (kind === 'workflow') body = <WorkflowSurface screen={screen} rows={rows} onAction={a => openAction(a, null)} onSelect={openRow} />;
  else if (kind === 'content') body = <ContentSurface screen={screen} rows={rows} onAction={a => openAction(a, null)} onSelect={openRow} />;
  else if (kind === 'settings') body = <SettingsSurface screen={screen} rows={rows} onAction={a => openAction(a, null)} />;
  else if (kind === 'matrix') body = <MatrixSurface screen={screen} rows={rows} onAction={a => openAction(a, null)} />;
  else if (kind === 'designer') body = <DesignerSurface screen={screen} rows={rows} onAction={a => openAction(a, null)} />;
  else if (kind === 'import') body = <ImportSurface screen={screen} rows={rows} onAction={a => openAction(a, null)} />;
  else if (kind === 'report') body = <ReportSurface screen={screen} rows={rows} onAction={a => openAction(a, null)} onSelect={openRow} />;
  else if (kind === 'form') body = <FormSurface screen={screen} onAction={a => openAction(a, null)} />;
  else if (kind === 'detail') body = <DetailSurface screen={screen} rows={rows} onSelect={openRow} onAction={a => openAction(a, rows[0] ?? null)} />;
  else body = <RecordExplorer screen={screen} rows={rows} onSelect={openRow} onAction={a => openAction(a, null)} />;

  const showToolbar = screen.id !== 1 && ['detail', 'report'].includes(kind);

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      {feedback?.screenId === screen.id && <Alert tone="success" title="Action Completed">{feedback.message}</Alert>}
      <ActionPalette screen={screen} onAction={a => openAction(a, null)} />
      {refreshing && <Alert tone="info" title="Refreshing records">Updating records for your current access.</Alert>}
      {showToolbar && <Toolbar screen={screen} rows={rows} onAction={a => openAction(a, null)} onRefresh={refresh} onExport={exportData} />}
      {body}
      <RecordInspector screen={screen} row={selected} open={inspectorOpen} onOpenChange={setInspectorOpen} onAction={a => { setInspectorOpen(false); openAction(a, selected); }} />
      <ActionWorkbench
        screen={screen}
        action={action}
        row={actionRow}
        open={Boolean(action)}
        onOpenChange={open => !open && setAction(null)}
        onComplete={() => {
          if (actionRow) {
            const status = /approve/i.test(action ?? '') ? 'Approved' : undefined;
            if (status) dispatch(patchRecord({ screenId: screen.id, recordId: recordId(actionRow), changes: { status } }));
          }
        }}
      />
    </div>
  );
}
