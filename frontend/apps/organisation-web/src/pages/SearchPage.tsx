import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  X, 
  ArrowRight, 
  Sparkles, 
  CheckSquare, 
  ShieldCheck, 
  Calendar, 
  Building2, 
  User, 
  FileText, 
  MessageSquare, 
  CheckCircle2
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AsyncState } from '@/components/AsyncState';
import { CursorPager } from '@/components/CursorPager';
import { EmptyState } from '@/components/EmptyState';
import { useOrg } from '@/state/OrgStore';
import { canAccess } from '@/security/access';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import type { OrgSearchResult } from '@/domain/types';

export interface EnhancedSearchResult extends OrgSearchResult {
  status?: string;
  category?: string;
}

type SearchCategory = 'ALL' | 'MEMBER' | 'CHAPTER' | 'WORK' | 'MEETING' | 'GOVERNANCE' | 'COMMUNICATION';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('ALL');
  const dq = useDebouncedValue(q, 250);
  const s = useOrg();

  // Local fallback store results
  const local = useMemo<EnhancedSearchResult[]>(() => [
    ...s.members.map(x => ({ type: 'Member', id: x.id, title: x.name, sub: x.business, to: `/org/members/${x.id}`, category: 'MEMBER', status: 'ACTIVE' })),
    ...s.units.filter(x => canAccess(s.actor, { id: x.id, name: x.name, level: x.level }, 'read', s.units, s.scope, s.permissions)).map(x => ({
      type: x.level,
      id: x.id,
      title: x.name,
      sub: `${x.memberCount} members`,
      to: x.level === 'CHAPTER' ? `/org/chapters/${x.id}` : x.level === 'CITY' ? `/org/cities/${x.id}` : x.level === 'REGION' ? `/org/regions/${x.id}` : x.level === 'STATE' ? `/org/states/${x.id}` : x.level === 'NATIONAL' ? '/org/national' : '/org/management',
      category: 'CHAPTER',
      status: 'ACTIVE'
    })),
    ...s.people.map(x => ({ type: 'Person', id: x.id, title: x.name, sub: `${x.position} · ${x.scope.name}`, to: x.converseConversationId ? `/org/converse?conversation=${x.converseConversationId}` : '/org/people', category: 'MEMBER', status: 'ACTIVE' })),
    ...s.committees.map(x => ({ type: 'Committee', id: x.id, title: x.name, sub: x.convener, to: `/org/committees/${x.id}`, category: 'CHAPTER', status: 'ACTIVE' })),
    ...s.tasks.map(x => ({ type: 'Task', id: x.id, title: x.title, sub: x.owner, to: `/org/tasks/${x.id}`, category: 'WORK', status: x.status })),
    ...s.actions.map(x => ({ type: 'Action', id: x.id, title: x.title, sub: x.owner, to: `/org/actions/${x.id}`, category: 'WORK', status: x.status })),
    ...s.approvals.map(x => ({ type: 'Approval', id: x.id, title: x.subject, sub: x.requester, to: `/org/approvals/${x.id}`, category: 'WORK', status: x.status })),
    ...s.cases.map(x => ({ type: 'Member Case', id: x.id, title: x.title, sub: x.owner, to: `/org/member-cases/${x.id}`, category: 'WORK', status: x.status })),
    ...s.meetings.map(x => ({ type: 'Meeting', id: x.id, title: x.title, sub: x.type, to: `/org/meetings/${x.id}`, category: 'MEETING', status: x.status })),
    ...s.programmes.map(x => ({ type: 'Programme', id: x.id, title: x.name, sub: x.owner, to: `/org/programmes/${x.id}`, category: 'MEETING', status: x.status })),
    ...s.events.map(x => ({ type: 'Event', id: x.id, title: x.name, sub: x.owner, to: `/org/events/${x.id}`, category: 'MEETING', status: 'SCHEDULED' })),
    ...s.decisions.map(x => ({ type: 'Decision', id: x.id, title: x.subject, sub: x.authority, to: `/org/decisions/${x.id}`, category: 'GOVERNANCE', status: x.status })),
    ...s.documents.map(x => ({ type: 'Document', id: x.id, title: x.title, sub: `${x.type} · ${x.version}`, to: `/org/documents/${x.id}`, category: 'GOVERNANCE', status: 'PUBLISHED' }))
  ].filter(x => {
    const textMatch = (x.title + ' ' + x.sub + ' ' + x.type).toLowerCase().includes(dq.toLowerCase());
    return textMatch;
  }), [
    dq, s.members, s.units, s.people, s.committees, s.tasks, s.actions, s.approvals,
    s.cases, s.meetings, s.programmes, s.events, s.decisions, s.documents, s.actor, s.scope,s.permissions
  ]);

  // Request to backend org.search
  const req = useMemo(() => ({
    queryId: 'org.search',
    search: dq,
    organisationScope: s.scope.id,
    pageSize: 50,
    parameters: {
      category: selectedCategory !== 'ALL' ? selectedCategory : undefined
    }
  }), [dq, s.scope.id, selectedCategory]);

  const page = useDomainCursorPage<EnhancedSearchResult>(req, local, [dq, selectedCategory], true);

  const rawItems = (page.page?.items as EnhancedSearchResult[]) ?? local;

  // Filter items by category tab on client as well
  const displayedItems = useMemo(() => {
    if (selectedCategory === 'ALL') return rawItems;
    return rawItems.filter(item => {
      if (item.category) return item.category.toUpperCase() === selectedCategory;
      const type = item.type.toUpperCase();
      if (selectedCategory === 'MEMBER') return type.includes('MEMBER') || type.includes('PERSON');
      if (selectedCategory === 'CHAPTER') return type.includes('CHAPTER') || type.includes('CITY') || type.includes('REGION') || type.includes('STATE') || type.includes('COMMITTEE');
      if (selectedCategory === 'WORK') return type.includes('TASK') || type.includes('ACTION') || type.includes('APPROVAL') || type.includes('CASE');
      if (selectedCategory === 'MEETING') return type.includes('MEETING') || type.includes('PROGRAMME') || type.includes('EVENT');
      if (selectedCategory === 'GOVERNANCE') return type.includes('DECISION') || type.includes('DOCUMENT') || type.includes('RISK') || type.includes('ISSUE');
      if (selectedCategory === 'COMMUNICATION') return type.includes('CONVERSE') || type.includes('CHAT') || type.includes('COMMUNICATION');
      return true;
    });
  }, [rawItems, selectedCategory]);

  // Quick Discovery Chips
  const quickChips = [
    { label: 'Pending Approvals', query: 'approval', category: 'WORK' as SearchCategory },
    { label: 'Upcoming Meetings', query: 'meeting', category: 'MEETING' as SearchCategory },
    { label: 'Parivar Members', query: 'member', category: 'MEMBER' as SearchCategory },
    { label: 'Active Tasks', query: 'task', category: 'WORK' as SearchCategory },
    { label: 'Governance Decisions', query: 'decision', category: 'GOVERNANCE' as SearchCategory },
    { label: 'Converse Channels', query: 'converse', category: 'COMMUNICATION' as SearchCategory }
  ];

  // Helper to render entity-specific icons and colors
  const getEntityIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('TASK')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
          <CheckSquare className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('ACTION')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-100">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('APPROVAL')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
          <ShieldCheck className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('MEETING')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100">
          <Calendar className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('PROGRAMME') || t.includes('EVENT')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('MEMBER') || t.includes('PERSON')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <User className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('CHAPTER') || t.includes('CITY') || t.includes('REGION') || t.includes('STATE') || t.includes('UNIT')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
          <Building2 className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('DECISION') || t.includes('DOCUMENT')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
          <FileText className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes('CONVERSATION') || t.includes('COMMUNICATION')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
          <MessageSquare className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
        <FileText className="w-4 h-4" />
      </div>
    );
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const sUpper = status.toUpperCase();
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    if (sUpper === 'DONE' || sUpper === 'APPROVED' || sUpper === 'ACTIVE' || sUpper === 'PAID') {
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (sUpper === 'PENDING' || sUpper === 'IN_REVIEW' || sUpper === 'IDENTIFIED') {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (sUpper === 'SCHEDULED' || sUpper === 'OPEN' || sUpper === 'TODO') {
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (sUpper === 'REJECTED' || sUpper === 'FAILED' || sUpper === 'HIGH') {
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-wider uppercase ${colorClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
        <PageHeader title="Search & Discovery">
          Search permitted records in your scope. Live PostgreSQL indexed, scoped and cursor-paged.
        </PageHeader>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live DB Indexed
          </span>
        </div>
      </div>

      {/* Spotlight Search Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          autoFocus
          aria-label="Search organisational records"
          placeholder="Search members, chapters, meetings, tasks, approvals, decisions…"
          value={q}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Escape') {
              setQ('');
            }
          }}
          className="w-full pl-11 pr-24 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all placeholder:text-slate-400"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
          {q && (
            <button
              onClick={() => setQ('')}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 rounded-md border border-slate-200">
            ESC
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'ALL', label: 'All Records' },
          { id: 'MEMBER', label: 'Members & People' },
          { id: 'CHAPTER', label: 'Parivars & Units' },
          { id: 'WORK', label: 'Tasks & Approvals' },
          { id: 'MEETING', label: 'Meetings & Events' },
          { id: 'GOVERNANCE', label: 'Governance & Decisions' },
          { id: 'COMMUNICATION', label: 'Conversations' }
        ].map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as SearchCategory)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Quick Suggestion Chips (when search is empty) */}
      {!q.trim() && (
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">Quick Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickChips.map(chip => (
              <button
                key={chip.label}
                onClick={() => {
                  setQ(chip.query);
                  setSelectedCategory(chip.category);
                }}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-medium transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{chip.label}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      <AsyncState 
        loading={page.loading} 
        refreshing={page.refreshing} 
        stale={page.stale} 
        error={page.error} 
        onRetry={page.reload}
      >
        {displayedItems.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                {q.trim() ? (
                  <>Showing <strong className="text-slate-800">{displayedItems.length}</strong> records matching "<span className="text-blue-600 font-semibold">{q}</span>"</>
                ) : (
                  <>Showing <strong className="text-slate-800">{displayedItems.length}</strong> permitted records in current scope</>
                )}
              </span>
              <span className="text-[11px] text-slate-400">Click any record to view details</span>
            </div>

            <div className="grid gap-2">
              {displayedItems.map((item, index) => {
                const destination = item.to || (item as any).href || '#';
                return (
                  <Link
                    key={`${item.type}-${item.id}-${index}`}
                    to={destination}
                    className="group bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between gap-3.5"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {getEntityIcon(item.type)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {item.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60 uppercase">
                            {item.type}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {item.sub || (item as any).subtitle || 'No additional details'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors shrink-0">
                      <span className="hidden sm:inline">Open</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>

            <CursorPager
              canPrevious={page.canPrevious}
              canNext={page.canNext}
              onPrevious={page.previous}
              onNext={page.next}
              totalEstimate={page.page?.totalEstimate ?? displayedItems.length}
            />
          </div>
        ) : (
          <EmptyState
            title={q.trim() ? `No records found matching "${q}"` : 'No records available in this category'}
            body="Try modifying your search keywords or switching category filters."
          />
        )}
      </AsyncState>
    </div>
  );
}
