import { Link, useSearchParams } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatusPill } from '@/components/StatusPill';
import { AsyncState } from '@/components/AsyncState';
import { CursorPager } from '@/components/CursorPager';
import { EmptyState } from '@/components/EmptyState';
import { useOrg } from '@/state/OrgStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import type { MemberSummary } from '@/domain/types';
import { canAccess } from '@/security/access';
import { UserCheck, ArrowRight, Clock, FileCheck } from 'lucide-react';
import { authStorage } from '@/utils/authStorage';

interface IntakeAppSummary {
  id: string;
  applicantFullName: string;
  businessName: string;
  primaryBusinessCategory?: string;
  stage: string;
  donationAmount: number;
  chapterName?: string;
  createdAt: string;
}

export default function MembersPage() {
  const s = useOrg();
  const [params] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'roster' | 'registrations'>('roster');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');
  const [intakeApps, setIntakeApps] = useState<IntakeAppSummary[]>([]);

  const dq = useDebouncedValue(q, 300);
  const requested = params.get('scopeId');
  const requestedUnit = requested ? s.units.find((u) => u.id === requested) : undefined;
  const scopedUnit =
    requestedUnit && canAccess(s.actor, { id: requestedUnit.id, name: requestedUnit.name, level: requestedUnit.level }, 'read', s.units, s.scope, s.permissions)
      ? requestedUnit
      : undefined;
  const queryScope = scopedUnit?.id ?? s.scope.id;

  const local = useMemo(
    () => {
      const activeCh = s.scope.name || '';
      const norm = activeCh.toLowerCase().replace(/chapter/g, '').trim();
      const isTrust = s.actor.position === 'Trust' || activeCh.toLowerCase().includes('all chapters');

      return s.members.filter(
        (m) =>
          (isTrust || !norm || (m.chapter && (
            m.chapter.toLowerCase().replace(/chapter/g, '').trim() === norm ||
            m.chapter.toLowerCase().includes(norm) ||
            norm.includes(m.chapter.toLowerCase().replace(/chapter/g, '').trim())
          ))) &&
          (status === 'ALL' || m.status === status) &&
          (m.name + ' ' + m.business + ' ' + m.specialisation).toLowerCase().includes(dq.toLowerCase())
      );
    },
    [s.members, dq, status, s.scope.name, s.actor.position]
  );

  const request = useMemo(
    () => ({
      queryId: 'org.members.list',
      search: dq,
      filters: status === 'ALL' ? [] : [{ field: 'status', operator: 'eq', value: status }],
      organisationScope: queryScope,
      pageSize: 25
    }),
    [dq, status, queryScope]
  );

  const page = useDomainCursorPage<MemberSummary>(request, local, [queryScope]);
  useRealtimeRefresh(['org.member.*'], page.reload);

  // Fetch pending registrations count from API
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const token = authStorage.getToken();
        const parsed = authStorage.getActiveSession();
        let sessionChId = parsed?.scopeId || '';
        let sessionChName = parsed?.scopeName || '';
        let isTrustUser = parsed?.position === 'Trust' || parsed?.role === 'Trust' || parsed?.roleType === 'TRUST_ADMINISTRATOR';

        const headers: Record<string, string> = { Accept: 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (sessionChId) headers['X-Chapter-Id'] = sessionChId;
        if (sessionChName) headers['X-Chapter-Name'] = sessionChName;

        const targetChId = sessionChId || s.scope.id;
        const queryParam = (!isTrustUser && targetChId) ? `?chapterId=${encodeURIComponent(targetChId)}` : '';

        const res = await fetch(`/api/membership/applications${queryParam}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.applications && Array.isArray(data.applications) ? data.applications : []);
          if (mounted) {
            const activeCh = sessionChName || s.scope.name || '';
            const norm = activeCh.toLowerCase().replace(/chapter/g, '').trim();
            const filtered = (!isTrustUser && norm.length > 0 && !norm.includes('all'))
              ? list.filter((a: any) => {
                  const ch = (a.chapterName || '').toLowerCase().replace(/chapter/g, '').trim();
                  return ch === norm || ch.includes(norm) || norm.includes(ch);
                })
              : list;
            setIntakeApps(filtered);
          }
        }
      } catch (_e: unknown) {
        // Fallback to local default intake applications
      }
    })();
    return () => {
      mounted = false;
    };
  }, [s.scope.id, s.scope.name]);

  const pendingCount = intakeApps.filter((a) => a.stage !== 'Activated').length;

  return (
    <>
      <PageHeader
        title="Members"
        actions={
          <Link
            to="/org/member-onboarding"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
          >
            <UserCheck className="w-4 h-4" />
            <span>Sri Matre Onboarding Portal</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-400 text-amber-950 font-bold rounded-full text-[10px]">
                {pendingCount}
              </span>
            )}
          </Link>
        }
      >
        Operational Member lifecycle{scopedUnit ? ` · ${scopedUnit.name}` : ''}—do not rewrite Member-domain activity.
      </PageHeader>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
            activeTab === 'roster'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Active Member Roster</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-bold">
            {s.members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
            activeTab === 'registrations'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>New Member Registrations</span>
          {pendingCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
              {pendingCount} Pending
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
              {intakeApps.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'roster' ? (
        <>
          <div className="toolbar flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <input
              className="flex-1 p-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 min-h-[44px]"
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
              aria-label="Search members"
              placeholder="Search member, business or specialisation"
            />
            <select
              className="p-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 min-h-[44px]"
              aria-label="Filter members by status"
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option>Active</option>
              <option>Renewal Due</option>
            </select>
          </div>
          <AsyncState
            loading={page.loading}
            refreshing={page.refreshing}
            stale={page.stale}
            error={page.error}
            onRetry={page.reload}
          >
            {page.page?.items.length ? (
              <div className="list space-y-2.5">
                {page.page.items.map((m) => (
                  <Link
                    key={m.id}
                    to={`/org/members/${m.id}`}
                    className="row link-row p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-xs transition-all min-h-[44px]"
                  >
                    <div>
                      <div className="row-title font-bold text-sm text-slate-900">{m.name}</div>
                      <div className="row-meta text-xs text-slate-500 mt-0.5">
                        {m.business} · {m.specialisation} · engagement {m.engagement}%
                      </div>
                    </div>
                    <StatusPill value={m.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="No Members match this view" />
            )}
            <CursorPager
              canPrevious={page.canPrevious}
              canNext={page.canNext}
              onPrevious={page.previous}
              onNext={page.next}
              totalEstimate={page.page?.totalEstimate}
            />
          </AsyncState>
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm text-blue-950">Sri Matre Intake Pipeline Oversight</div>
              <div className="text-xs text-blue-700 mt-0.5">
                Multi-tier RBAC approval flow: Document Verification (A–E) → Committee Approval → DBN Trust Payment Verification & Member ID Issuance.
              </div>
            </div>
            <Link
              to="/org/member-onboarding"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs shrink-0 min-h-[44px]"
            >
              <span>Open Verification Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {intakeApps.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {app.chapterName || 'Hosur Chapter'}
                    </span>
                    <StatusPill value={app.stage} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{app.applicantFullName}</h3>
                  <div className="text-xs font-semibold text-slate-700 mt-0.5">{app.businessName}</div>
                  <div className="text-xs text-slate-500 mt-1">{app.primaryBusinessCategory}</div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ₹{app.donationAmount} Trust Donation
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    to="/org/member-onboarding"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-semibold border border-slate-200 hover:border-blue-200 transition-colors min-h-[44px]"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Review & Verify Application →</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
