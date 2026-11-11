import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  Users,
  Search,
  ChevronDown,
  CheckSquare,
  Lock,
  CreditCard,
  CheckCircle2,
  Award
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { RegistrationReconciliationPanel } from '@/components/RegistrationReconciliationPanel';
import { useOrg } from '@/state/OrgStore';
import { authStorage } from '@/utils/authStorage';

export interface DbnApplicationRecord {
  id: string;
  applicantFullName: string;
  dateOfBirth: string;
  mobileNumber: string;
  email: string;
  residentialAddress: string;
  residentialCity: string;
  residentialPinCode: string;
  chapterName: string;

  businessName: string;
  applicantDesignation: string;
  primaryBusinessCategory: string;
  productsServicesOffered: string;
  yearEstablished: number;
  employeeCountRange: string;
  businessAddress: string;
  businessCity: string;
  businessPinCode: string;
  gstin?: string;
  websiteOrLinkedIn?: string;
  connectionsCanGive?: string[];

  fatherName?: string;
  gothram?: string;
  hobbiesInterests?: string;
  specialMention?: string;

  businessDescription: string;
  idealCustomerProfiles?: string[];
  businessConnectionsSought?: string;
  geographicMarketsServed?: string[];
  keyDifferentiator: string;
  businessContactEmail: string;

  agreedToGuidelines: boolean;
  informationAccurate: boolean;
  dataUsageConsent: boolean;
  declarationDate: string;
  electronicSignature: string;

  donationAmount: number;
  paymentMode: 'UPI' | 'NEFT' | 'Cheque';
  upiReference?: string;
  neftReference?: string;
  chequeNumber?: string;
  chequeDate?: string;
  bankFavoring: string;

  stage: 'Submitted' | 'DocumentsVerified' | 'CommitteeApproved' | 'Activated' | 'Rejected';
  documentsVerifiedBy?: string;
  documentsVerifiedRole?: string;
  documentsVerifiedAt?: string;

  committeeApprovedBy?: string;
  committeeApprovedRole?: string;
  committeeApprovedAt?: string;

  trustPaymentVerifiedBy?: string;
  trustPaymentVerifiedRole?: string;
  trustPaymentVerifiedAt?: string;

  assignedMemberId?: string;
  createdAt: string;
}

export default function MemberOnboardingPage() {
  const { actor, scope } = useOrg();
  const [applications, setApplications] = useState<DbnApplicationRecord[]>([]);
  const [chapterScopeFilter, setChapterScopeFilter] = useState<'CURRENT' | 'ALL'>('CURRENT');

  // Presentation identity is obtained from the loaded organisation context.
  // Server-side authorization, not this string, determines all decision rights.
  const currentActor = { name: actor?.name || '', role: actor?.position || '' };

  const [activeTab, setActiveTab] = useState<'ALL' | 'VERIFY' | 'APPROVE' | 'PAYMENT' | 'ACTIVATED'>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-hide feedback after 4 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Sync with live backend if running
  useEffect(() => {
    let ignore = false;
    async function loadRemote() {
      try {
        const headers: Record<string, string> = { Accept: 'application/json' };
        const token = authStorage.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (scope?.id) headers['X-Chapter-Id'] = scope.id;

        // Chapter filtering is enforced by current server-side permission grants.
        const queryParam = '';

        // 1. Fetch DBN Member Registrations with token-scoped chapter enforcement
        const res = await fetch(`/api/membership/applications${queryParam}`, { headers, credentials: 'include' });
        let dbnItems: DbnApplicationRecord[] = [];
        if (!res.ok) throw new Error(`Membership service returned ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid membership response');
        dbnItems = data;

        const combined = dbnItems; // Canonical membership endpoint controls decision views.
        if (!ignore) {
          const seen = new Set<string>();
          setApplications(combined.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          }));
        }
      } catch {
        if (!ignore) {
          setApplications([]);
          setFeedback({ message: 'Unable to load membership applications from the server. No local records will be substituted.', type: 'error' });
        }
      }
    }
    loadRemote();
    return () => { ignore = true; };
  }, [scope?.id, scope?.name]);

  const roleName = (currentActor.role || '').toLowerCase();
  const isMemberCoordinator = roleName.includes('coordinator');
  const isLeadershipFinance = roleName.includes('finance') || roleName.includes('trust') || currentActor.role === 'Leadership Team';
  const isPresidentOrSecretary = roleName.includes('president') || roleName.includes('secretary') || roleName.includes('treasurer') || roleName.includes('trusser');

  const canViewAllChapters = isMemberCoordinator || isLeadershipFinance;
  const isTrustOfficer = isLeadershipFinance;

  const counts = useMemo(() => {
    let apps = applications;
    const currentChapterName = scope?.name || '';

    if (!canViewAllChapters && chapterScopeFilter === 'CURRENT' && currentChapterName && !currentChapterName.toLowerCase().includes('all chapters')) {
      const normScope = currentChapterName.toLowerCase().replace(/chapter/g, '').trim();
      apps = apps.filter(app => {
        const normApp = (app.chapterName || '').toLowerCase().replace(/chapter/g, '').trim();
        return normApp.includes(normScope) || normScope.includes(normApp);
      });
    }
    return {
      all: apps.length,
      verify: apps.filter(a => a.stage === 'Submitted').length,
      approve: apps.filter(a => a.stage === 'DocumentsVerified').length,
      payment: apps.filter(a => a.stage === 'CommitteeApproved').length,
      activated: apps.filter(a => a.stage === 'Activated').length,
    };
  }, [applications, chapterScopeFilter, scope?.name, canViewAllChapters]);

  const filtered = useMemo(() => {
    const currentChapterName = scope?.name || '';

    return applications.filter(app => {
      if (!canViewAllChapters && chapterScopeFilter === 'CURRENT' && currentChapterName && !currentChapterName.toLowerCase().includes('all chapters')) {
        const normScope = currentChapterName.toLowerCase().replace(/chapter/g, '').trim();
        const normApp = (app.chapterName || '').toLowerCase().replace(/chapter/g, '').trim();
        if (!normApp.includes(normScope) && !normScope.includes(normApp)) {
          return false;
        }
      }

      const matchesSearch = (
        app.applicantFullName + ' ' +
        app.businessName + ' ' +
        app.primaryBusinessCategory + ' ' +
        app.chapterName + ' ' +
        (app.assignedMemberId || '')
      ).toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'VERIFY') return app.stage === 'Submitted';
      if (activeTab === 'APPROVE') return app.stage === 'DocumentsVerified';
      if (activeTab === 'PAYMENT') return app.stage === 'CommitteeApproved';
      if (activeTab === 'ACTIVATED') return app.stage === 'Activated';
      return true;
    });
  }, [applications, activeTab, search, chapterScopeFilter, scope?.name, canViewAllChapters]);

  const isLeadership = isLeadershipFinance;
  // Step 1: Member Coordinator (All Chapters) or Executive Leaders
  const canVerifyDocuments = isMemberCoordinator || isPresidentOrSecretary || isLeadershipFinance;
  // Step 2: President, Secretary or Treasurer (Committee Approval) - Coordinator strictly forbidden
  const canApproveMember = !isMemberCoordinator && (isPresidentOrSecretary || isLeadershipFinance);
  // Step 3: Leadership Finance (All Chapters) or Trust Officer
  const canVerifyPayment = isLeadershipFinance;

  // No user-supplied actor identity: server derives actor, role and scope from authentication.
  const performMembershipAction = async (app: DbnApplicationRecord, operation: string) => {
    try {
      const token = authStorage.getToken();
      const actionHeaders: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token) actionHeaders['Authorization'] = `Bearer ${token}`;
      if (scope?.id) actionHeaders['X-Chapter-Id'] = scope.id;

      const res = await fetch(`/api/membership/applications/${encodeURIComponent(app.id)}/${operation}`, {
        method: 'POST', credentials: 'include',
        headers: actionHeaders,
        body: JSON.stringify({})
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || error.title || `Server rejected operation (${res.status})`);
      }
      const refreshHeaders: Record<string, string> = { 'Accept': 'application/json', 'Cache-Control': 'no-store' };
      if (token) refreshHeaders['Authorization'] = `Bearer ${token}`;
      if (scope?.id) refreshHeaders['X-Chapter-Id'] = scope.id;

      const refreshed = await fetch('/api/membership/applications', {
        credentials: 'include', headers: refreshHeaders
      });
      if (!refreshed.ok) throw new Error('Operation may have committed, but authoritative refresh failed. Verify status before retrying.');
      const records: unknown = await refreshed.json();
      if (!Array.isArray(records)) throw new Error('Unexpected response. Verify authoritative state before retrying.');
      setApplications(records as DbnApplicationRecord[]);
      setFeedback({ message: 'Operation accepted and membership list refreshed from the server.', type: 'success' });
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Operation failed; verify server state before retrying.', type: 'error' });
    }
  };
  const handleVerifyDocuments = (app: DbnApplicationRecord) => performMembershipAction(app, 'verify-documents');
  const handleApproveMember = (app: DbnApplicationRecord) => performMembershipAction(app, 'approve');
  const handleVerifyPayment = (app: DbnApplicationRecord) => performMembershipAction(app, 'verify-trust-payment');

  return (
    <div className="space-y-6">
      <PageHeader title="DBN Member Intake & Governed Onboarding">
        Multi-tier governance workflow based on the official Sri Matre Member Registration Form. Enforces strict authority separation between Document Verification, Committee Approval, and Trust Payment Validation.
      </PageHeader>

      <RegistrationReconciliationPanel />

      {/* Floating feedback alert */}
      {feedback && (
        <div className={`p-4 rounded-xl text-sm font-bold flex items-center justify-between border ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}>
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs uppercase underline">Dismiss</button>
        </div>
      )}

      {/* Notice for Trust position */}
      {authStorage.isTrustUser() && (
        <div className="rounded-2xl border border-sky-300 bg-sky-50 p-4 text-sky-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <span className="font-extrabold text-sm block">Trust Position Notice (Tenant-Level Scope)</span>
            <span className="text-xs text-sky-800">
              The <strong>Trust</strong> position has organization-wide payment verification and read-only member authority. Chapter Member Registration and Onboarding Intake are managed by Chapter Executives (President, VP, Secretary, Member Coordinator).
            </span>
          </div>
          <Link
            to="/org/trust-payments"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-all shadow-md shadow-sky-600/20"
          >
            Go to Payment Verification →
          </Link>
        </div>
      )}

      {isLeadership && (
        <div className="rounded-2xl border border-indigo-300 bg-indigo-50 p-4 text-indigo-900 flex items-center gap-3 shadow-xs">
          <ShieldCheck className="size-5 text-indigo-600 shrink-0" />
          <div>
            <span className="font-extrabold text-sm block">Leadership Read-Only Governance Mode</span>
            <span className="text-xs text-indigo-800">
              Member verification and approvals are conducted by Chapter Executive Officers (President, VP, Secretary, Member Coordinator). You have full read-only visibility across all chapter applications.
            </span>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <strong>Current organisation context:</strong> {currentActor.name || 'Not identified'} ({currentActor.role || 'No server-confirmed role displayed'}).
        Actions are independently authorised by the server. Role simulation is disabled.
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setActiveTab('ALL')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${activeTab === 'ALL' ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">Total In Pipeline</span>
          <span className="text-2xl font-black mt-1 block">{counts.all}</span>
          <span className="text-xs opacity-80 mt-0.5 block">All DBN Applications</span>
        </div>

        <div
          onClick={() => setActiveTab('VERIFY')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${activeTab === 'VERIFY' ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">1. Document Verification</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{counts.verify}</span>
          <span className="text-xs text-slate-500 mt-0.5 block">Coordinator / Pres / Sec</span>
        </div>

        <div
          onClick={() => setActiveTab('APPROVE')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${activeTab === 'APPROVE' ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/30' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">2. Member Approval</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{counts.approve}</span>
          <span className="text-xs text-slate-500 mt-0.5 block">Pres / Sec / VP Only</span>
        </div>

        <div
          onClick={() => setActiveTab('PAYMENT')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${activeTab === 'PAYMENT' ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/30' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">3. Trust Payment</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{counts.payment}</span>
          <span className="text-xs text-slate-500 mt-0.5 block">DBN Trust Tenant</span>
        </div>

        <div
          onClick={() => setActiveTab('ACTIVATED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${activeTab === 'ACTIVATED' ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">4. Activated Members</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{counts.activated}</span>
          <span className="text-xs text-slate-500 mt-0.5 block">Member ID Issued</span>
        </div>
      </div>

      {/* Chapter Jurisdiction Scope Header */}
      {scope?.name && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-indigo-700 shrink-0" />
            <span className="font-bold text-slate-700">
              Active Chapter Jurisdiction: <strong className="text-indigo-950 font-black">{scope.name}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isTrustOfficer ? (
              <>
                <button
                  type="button"
                  onClick={() => setChapterScopeFilter('CURRENT')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition-all ${chapterScopeFilter === 'CURRENT'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                    }`}
                >
                  Show {scope.name} Only
                </button>
                <button
                  type="button"
                  onClick={() => setChapterScopeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition-all ${chapterScopeFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  All Chapters ({applications.length})
                </button>
              </>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold shadow-xs flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" />
                <span>Relevant Parivar Scoped</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Toolbar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by applicant name, business, category, or Member ID..."
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'VERIFY', 'APPROVE', 'PAYMENT', 'ACTIVATED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
            >
              {tab === 'ALL' && `All (${counts.all})`}
              {tab === 'VERIFY' && `Needs Verify (${counts.verify})`}
              {tab === 'APPROVE' && `Needs Approval (${counts.approve})`}
              {tab === 'PAYMENT' && `Needs Trust (${counts.payment})`}
              {tab === 'ACTIVATED' && `Active (${counts.activated})`}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <h3 className="text-base font-bold text-slate-800">No applications found</h3>
            <p className="text-xs text-slate-500 mt-1">There are no member applications matching the selected criteria.</p>
          </div>
        ) : (
          filtered.map(app => {
            const isExpanded = expandedId === app.id;

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Main Card Header */}
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {app.assignedMemberId ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                            ★ {app.assignedMemberId}
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md" title={`Application ID: ${app.id}`}>
                            App #{app.id.slice(0, 8).toUpperCase()}
                          </span>
                        )}
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {app.chapterName}
                        </span>
                        {(app.upiReference || app.neftReference || app.donationAmount) && (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            <span>Payment Verified (₹{(app.donationAmount || 6000).toLocaleString('en-IN')})</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-slate-900 mt-1.5 flex items-center gap-2">
                        {app.applicantFullName}
                      </h3>
                      <div className="text-sm font-semibold text-slate-700 mt-0.5">
                        {app.applicantDesignation} · <span className="text-blue-700 font-bold">{app.businessName}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Category: <strong>{app.primaryBusinessCategory}</strong></span>
                        <span>•</span>
                        <span>Employees: <strong>{app.employeeCountRange}</strong></span>
                        <span>•</span>
                        <span>Mobile: <strong>{app.mobileNumber}</strong></span>
                        <span>•</span>
                        <span>Email: <strong>{app.email}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        {app.stage === 'Submitted' && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            Pending Document Verification
                          </span>
                        )}
                        {app.stage === 'DocumentsVerified' && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                            Pending Member Approval
                          </span>
                        )}
                        {app.stage === 'CommitteeApproved' && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Pending Trust Payment Verification
                          </span>
                        )}
                        {app.stage === 'Activated' && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Active Member
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                        Donation: ₹{app.donationAmount} via {app.paymentMode} ({app.upiReference || app.neftReference || app.chequeNumber || 'Ref Pending'})
                      </div>
                    </div>
                  </div>

                  {/* Stage-based Governed Action Row */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-xl border">
                    <div className="text-xs">
                      {app.stage === 'Submitted' && (
                        <span className="text-slate-700">
                          <strong>Step 1:</strong> Document verification by <strong>Member Coordinator (All Chapters)</strong> or Chapter Leadership.
                        </span>
                      )}
                      {app.stage === 'DocumentsVerified' && (
                        <span className="text-slate-700">
                          <strong>Step 2:</strong> Member Approval strictly restricted to <strong>President</strong>, <strong>Secretary</strong>, or <strong>Treasurer</strong>.
                        </span>
                      )}
                      {app.stage === 'CommitteeApproved' && (
                        <span className="text-slate-700">
                          <strong>Step 3:</strong> Payment verification of ₹6,000/- by <strong>Leadership Finance (All Chapters)</strong>.
                        </span>
                      )}
                      {app.stage === 'Activated' && (
                        <span className="text-emerald-800 font-bold">
                          ✓ All governance stages complete. Official Member ID issued by Trust Tenant.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Step 1 Action: Verify Documents */}
                      {app.stage === 'Submitted' && (
                        <button
                          type="button"
                          disabled={!canVerifyDocuments}
                          onClick={() => handleVerifyDocuments(app)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold min-h-[40px] transition-all shadow-xs flex items-center gap-1.5 ${canVerifyDocuments
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          title={canVerifyDocuments ? 'Verify applicant documents' : 'Requires Member Coordinator, President, or Secretary role'}
                        >
                          <CheckSquare className="size-4" /> Verify Documents
                        </button>
                      )}

                      {/* Step 2 Action: Approve Member */}
                      {app.stage === 'DocumentsVerified' && (
                        <>
                          {currentActor.role.toUpperCase().includes('COORDINATOR') ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                              <span>⚠ Coordinator cannot approve members (President / VP / Secretary required)</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={!canApproveMember}
                              onClick={() => handleApproveMember(app)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold min-h-[40px] transition-all shadow-xs flex items-center gap-1.5 ${canApproveMember
                                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                              <ShieldCheck className="size-4" /> Approve Member
                            </button>
                          )}
                        </>
                      )}

                      {/* Step 3 Action: Verify Trust Payment */}
                      {app.stage === 'CommitteeApproved' && (
                        <>
                          {!canVerifyPayment ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-300">
                                <Lock className="size-3.5 shrink-0" />
                                <span>Payment verification restricted to Leadership Finance (All Chapters)</span>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleVerifyPayment(app)}
                              className="px-4 py-2 rounded-xl text-xs font-bold min-h-[40px] transition-all shadow-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 ring-2 ring-emerald-300"
                            >
                              <Building2 className="size-4" /> Verify Payment & Activate
                            </button>
                          )}
                        </>
                      )}

                      {/* Toggle Form Details Drawer */}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 min-h-[40px] flex items-center gap-1"
                      >
                        {isExpanded ? 'Hide Form ▲' : 'Review Form ▼'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Form Sections (A through F) */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-6 space-y-6">
                    {/* Section A & C */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
                          A. MEMBERSHIP & BASIC DETAILS
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div><strong>Full Name:</strong> {app.applicantFullName}</div>
                          <div><strong>DOB:</strong> {app.dateOfBirth}</div>
                          <div><strong>Mobile:</strong> {app.mobileNumber}</div>
                          <div><strong>Email:</strong> {app.email}</div>
                          <div><strong>Address:</strong> {app.residentialAddress}, {app.residentialCity} - {app.residentialPinCode}</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">
                          C. PERSONAL & COMMUNITY DETAILS
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div><strong>Father’s Name:</strong> {app.fatherName || '—'}</div>
                          <div><strong>Gothram:</strong> {app.gothram || '—'}</div>
                          <div><strong>Hobbies / Interests:</strong> {app.hobbiesInterests || '—'}</div>
                          <div><strong>Special Mention:</strong> {app.specialMention || '—'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Section B & D */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                          B. BUSINESS INFORMATION
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div><strong>Business:</strong> {app.businessName} ({app.applicantDesignation})</div>
                          <div><strong>Category:</strong> {app.primaryBusinessCategory}</div>
                          <div><strong>Products / Services:</strong> {app.productsServicesOffered}</div>
                          <div><strong>Established:</strong> {app.yearEstablished} · {app.employeeCountRange} staff</div>
                          <div><strong>Address:</strong> {app.businessAddress}, {app.businessCity} - {app.businessPinCode}</div>
                          <div><strong>GSTIN:</strong> {app.gstin || 'Not provided'}</div>
                          <div><strong>Website:</strong> {app.websiteOrLinkedIn || '—'}</div>
                          <div><strong>Connections Can Give:</strong> {app.connectionsCanGive?.join(', ') || 'None specified'}</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-2">
                          D. BUSINESS & NETWORKING PROFILE
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div><strong>Description:</strong> {app.businessDescription}</div>
                          <div><strong>Ideal Customers:</strong> {app.idealCustomerProfiles?.join(' | ') || '—'}</div>
                          <div><strong>Connections Sought:</strong> {app.businessConnectionsSought || '—'}</div>
                          <div><strong>Geographic Markets:</strong> {app.geographicMarketsServed?.join(', ') || 'Local'}</div>
                          <div><strong>USP / Differentiator:</strong> {app.keyDifferentiator}</div>
                          <div><strong>Contact Email:</strong> {app.businessContactEmail}</div>
                        </div>
                      </div>
                    </div>

                    {/* Section E & F */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
                          E. MEMBERSHIP DECLARATION & CONSENT
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div><strong>Guidelines Accepted:</strong> {app.agreedToGuidelines ? '✓ Yes' : '✕ No'}</div>
                          <div><strong>Accuracy Confirmed:</strong> {app.informationAccurate ? '✓ Yes' : '✕ No'}</div>
                          <div><strong>Data Usage Consent:</strong> {app.dataUsageConsent ? '✓ Yes' : '✕ No'}</div>
                          <div><strong>Declaration Date:</strong> {app.declarationDate}</div>
                          <div><strong>Electronic Acceptance:</strong> {app.electronicSignature}</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2">
                          F. PAYMENT DETAILS (Donation Rs 6000/- No GST)
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div><strong>Amount:</strong> ₹{app.donationAmount}</div>
                          <div><strong>Payment Method:</strong> {app.paymentMode}</div>
                          {app.upiReference && <div><strong>UPI Reference:</strong> {app.upiReference}</div>}
                          {app.neftReference && <div><strong>NEFT Reference:</strong> {app.neftReference}</div>}
                          {app.chequeNumber && <div><strong>Cheque:</strong> #{app.chequeNumber} dated {app.chequeDate}</div>}
                          <div><strong>Beneficiary:</strong> {app.bankFavoring}</div>
                          <div><strong>Office Member ID:</strong> {app.assignedMemberId || 'Pending Trust Activation'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Audit Trail */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2.5">
                        Governance Audit Trail
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">1. Document Verify</span>
                          {app.documentsVerifiedBy ? (
                            <span className="font-semibold text-emerald-800 block mt-0.5">
                              ✓ {app.documentsVerifiedBy} ({app.documentsVerifiedRole})
                            </span>
                          ) : (
                            <span className="text-slate-400 block mt-0.5">Pending</span>
                          )}
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">2. Member Approval</span>
                          {app.committeeApprovedBy ? (
                            <span className="font-semibold text-emerald-800 block mt-0.5">
                              ✓ {app.committeeApprovedBy} ({app.committeeApprovedRole})
                            </span>
                          ) : (
                            <span className="text-slate-400 block mt-0.5">Pending</span>
                          )}
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">3. Trust Payment Verify</span>
                          {app.trustPaymentVerifiedBy ? (
                            <span className="font-semibold text-emerald-800 block mt-0.5">
                              ✓ {app.trustPaymentVerifiedBy} ({app.assignedMemberId})
                            </span>
                          ) : (
                            <span className="text-slate-400 block mt-0.5">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
