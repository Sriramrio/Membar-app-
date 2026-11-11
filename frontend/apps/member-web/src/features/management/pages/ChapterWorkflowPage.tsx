import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  FileCheck,
  CheckCircle2,
  Clock,
  PlusCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Filter,
  UserCheck,
  Sparkles,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from '@/components/ui/Toast';
import { serverClock } from '@/services/time/serverClock';
import {
  chapterWorkflowApi,
  type ChapterDto,
  type CoordinatorQueueItemDto,
  type ExecutiveQueueItemDto,
  type ChapterGroupMemberDto,
  type MemberRoleAssignmentDto,
  type OnboardingStatusDetailDto
} from '@/services/api/chapterWorkflowApi';

type TabKey = 'registration' | 'coordinator' | 'executive' | 'directory' | 'governance';

export default function ChapterWorkflowPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('registration');
  const [chapters, setChapters] = useState<ChapterDto[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Registration & Payment state
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    categoryId: 'Technology & Cloud',
    chapterId: ''
  });
  const [activeRegistrationId, setActiveRegistrationId] = useState<string>('');
  const [statusDetail, setStatusDetail] = useState<OnboardingStatusDetailDto | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(6000);
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paying, setPaying] = useState<boolean>(false);

  // Coordinator Queue state
  const [coordQueue, setCoordQueue] = useState<CoordinatorQueueItemDto[]>([]);
  const [selectedCoordItem, setSelectedCoordItem] = useState<CoordinatorQueueItemDto | null>(null);
  const [kycDocUrl, setKycDocUrl] = useState<string>('https://documents.sethu.network/kyc/business_license.pdf');
  const [kycNotes, setKycNotes] = useState<string>('Government GSTIN and PAN verified on MCA portal.');
  const [verifyingDoc, setVerifyingDoc] = useState<boolean>(false);

  // Executive Queue state
  const [execQueue, setExecQueue] = useState<ExecutiveQueueItemDto[]>([]);
  const [selectedExecItem, setSelectedExecItem] = useState<ExecutiveQueueItemDto | null>(null);
  const [execRole, setExecRole] = useState<'President' | 'Vice President'>('President');
  const [execRemarks, setExecRemarks] = useState<string>('Candidate demonstrated solid business background and community alignment. Approved for chapter group membership.');
  const [approving, setApproving] = useState<boolean>(false);

  // Chapter Members Directory
  const [chapterMembers, setChapterMembers] = useState<ChapterGroupMemberDto[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);

  // Governance: Roles & Chapter creation
  const [newChapterName, setNewChapterName] = useState<string>('');
  const [newChapterRegion, setNewChapterRegion] = useState<string>('');
  const [newChapterState, setNewChapterState] = useState<string>('Tamil Nadu');
  const [assignMemberId, setAssignMemberId] = useState<string>('');
  const [assignRoleId, setAssignRoleId] = useState<string>('President');
  const [chapterRoles, setChapterRoles] = useState<MemberRoleAssignmentDto[]>([]);

  // Load initial chapters
  const loadChapters = async () => {
    try {
      setLoading(true);
      const res = await chapterWorkflowApi.getChapters();
      setChapters(res);
      if (res.length > 0 && !selectedChapterId) {
        setSelectedChapterId(res[0].id);
        setRegForm(prev => ({ ...prev, chapterId: res[0].id }));
      }
    } catch {
      toast.error('Failed to load chapters from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChapters();
  }, []);

  // Reload queues based on active tab
  useEffect(() => {
    if (activeTab === 'coordinator') loadCoordinatorQueue();
    if (activeTab === 'executive') loadExecutiveQueue();
    if (activeTab === 'directory' && selectedChapterId) loadChapterMembers(selectedChapterId);
    if (activeTab === 'governance' && selectedChapterId) loadChapterRoles(selectedChapterId);
  }, [activeTab, selectedChapterId]);

  const loadCoordinatorQueue = async () => {
    try {
      const queue = await chapterWorkflowApi.getCoordinatorQueue();
      setCoordQueue(queue);
    } catch {
      toast.error('Failed to load Member Coordinator queue.');
    }
  };

  const loadExecutiveQueue = async () => {
    try {
      const queue = await chapterWorkflowApi.getExecutiveQueue();
      setExecQueue(queue);
    } catch {
      toast.error('Failed to load Executive approval queue.');
    }
  };

  const loadChapterMembers = async (chapterId: string) => {
    try {
      setLoadingMembers(true);
      const members = await chapterWorkflowApi.getChapterMembers(chapterId);
      setChapterMembers(members);
    } catch {
      toast.error('Failed to load chapter group members.');
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadChapterRoles = async (chapterId: string) => {
    try {
      const roles = await chapterWorkflowApi.getChapterRoles(chapterId);
      setChapterRoles(roles);
    } catch {
      // Ignored
    }
  };

  // Poll or refresh status detail
  const refreshStatus = async (regId: string) => {
    try {
      const status = await chapterWorkflowApi.getOnboardingStatus(regId);
      setStatusDetail(status);
    } catch {
      // Ignored
    }
  };

  // 1. Submit Registration Form
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.email || !regForm.phone || !regForm.businessName || !regForm.chapterId) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }
    try {
      setLoading(true);
      const res = await chapterWorkflowApi.registerMember(regForm);
      setActiveRegistrationId(res.registrationId);
      setPaymentRef(`UPI-${serverClock.nowMs().toString().slice(-6)}`);
      await refreshStatus(res.registrationId);
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err?.message || 'Bhandhu registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Payment Verification
  const handleVerifyPayment = async () => {
    if (!activeRegistrationId) return;
    try {
      setPaying(true);
      const res = await chapterWorkflowApi.verifyPayment({
        registrationId: activeRegistrationId,
        amount: paymentAmount,
        paymentRef: paymentRef || `UPI-${serverClock.nowMs()}`,
        paymentStatus: 'SUCCESS'
      });
      await refreshStatus(activeRegistrationId);
      toast.success(res.message);
      // Auto switch or alert user
      loadCoordinatorQueue();
    } catch (err: any) {
      toast.error(err?.message || 'Payment verification failed.');
    } finally {
      setPaying(false);
    }
  };

  // 3. Coordinator Verify KYC Document
  const handleCoordinatorVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedCoordItem) return;
    try {
      setVerifyingDoc(true);
      const res = await chapterWorkflowApi.verifyDocument({
        registrationId: selectedCoordItem.registrationId,
        documentUrl: kycDocUrl,
        verifiedBy: 'Member Coordinator Priya',
        status,
        notes: kycNotes
      });
      toast.success(res.message);
      setSelectedCoordItem(null);
      await loadCoordinatorQueue();
      await loadExecutiveQueue();
      if (activeRegistrationId === selectedCoordItem.registrationId) {
        await refreshStatus(activeRegistrationId);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Document verification submission failed.');
    } finally {
      setVerifyingDoc(false);
    }
  };

  // 4. Executive Approve / Reject
  const handleExecutiveApprove = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedExecItem) return;
    try {
      setApproving(true);
      const res = await chapterWorkflowApi.executiveApprove({
        registrationId: selectedExecItem.registrationId,
        approvedBy: 'President Anand Kumar',
        roleAtApproval: execRole,
        status,
        remarks: execRemarks
      });
      toast.success(res.message);
      setSelectedExecItem(null);
      await loadExecutiveQueue();
      if (selectedChapterId) await loadChapterMembers(selectedChapterId);
      if (activeRegistrationId === selectedExecItem.registrationId) {
        await refreshStatus(activeRegistrationId);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Executive approval failed.');
    } finally {
      setApproving(false);
    }
  };

  // 5. Create Chapter
  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterName.trim()) {
      toast.error('Chapter name is required.');
      return;
    }
    try {
      setLoading(true);
      const res = await chapterWorkflowApi.createChapter({
        name: newChapterName.trim(),
        regionId: newChapterRegion.trim(),
        stateId: newChapterState.trim()
      });
      toast.success(`Chapter '${res.name}' created successfully!`);
      setNewChapterName('');
      setNewChapterRegion('');
      await loadChapters();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create chapter.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Assign Role
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignMemberId.trim() || !selectedChapterId) {
      toast.error('Please specify Member ID and Chapter.');
      return;
    }
    try {
      setLoading(true);
      await chapterWorkflowApi.assignRole({
        memberId: assignMemberId.trim(),
        chapterId: selectedChapterId,
        roleId: assignRoleId
      });
      toast.success(`Role '${assignRoleId}' assigned to ${assignMemberId}!`);
      setAssignMemberId('');
      await loadChapterRoles(selectedChapterId);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Banner / Header */}
      <header className="border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                  <Sparkles className="size-3.5 text-sky-600" />
                  Governed Chapter Lifecycle
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  Live Synchronized
                </span>
              </div>
              <h1 className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Chapter Membership & Multi-Stage Approval
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                End-to-end registration, Payment Gate, KYC Verification, Executive Authority, and Group Membership.
              </p>
            </div>

            {/* Chapter Selector */}
            <div className="flex items-center gap-3">
              <label htmlFor="chapter-select" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Chapter:
              </label>
              <select
                id="chapter-select"
                value={selectedChapterId}
                onChange={e => {
                  setSelectedChapterId(e.target.value);
                  setRegForm(prev => ({ ...prev, chapterId: e.target.value }));
                }}
                className="h-10 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {chapters.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.regionId || 'Regional'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {[
              { key: 'registration', label: '1. Register & Payment Gate', icon: CreditCard },
              { key: 'coordinator', label: '2. Member Coordinator KYC', icon: FileCheck, badge: coordQueue.length },
              { key: 'executive', label: '3. President / VP Approval', icon: ShieldCheck, badge: execQueue.length },
              { key: 'directory', label: '4. Parivar Group Directory', icon: Users, badge: chapterMembers.length },
              { key: 'governance', label: '5. Parivar & Role Hierarchy', icon: Layers }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as TabKey)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[var(--navy-900)] text-white shadow-sm shadow-slate-900/10'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? 'text-sky-300' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive ? 'bg-sky-500 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* TAB 1: REGISTRATION & PAYMENT GATE */}
        {activeTab === 'registration' && (
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Step 1: Registration Form */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                  <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
                    <UserCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Step 1: Public Bhandhu Registration</h2>
                    <p className="text-xs text-slate-500">Submit applicant profile to begin governed onboarding</p>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sundaram"
                      value={regForm.fullName}
                      onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm font-medium focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="ramesh@cloudinfra.in"
                        value={regForm.email}
                        onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm font-medium focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98450 12345"
                        value={regForm.phone}
                        onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm font-medium focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Business / Trade Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Sundaram Cloud Solutions"
                        value={regForm.businessName}
                        onChange={e => setRegForm({ ...regForm, businessName: e.target.value })}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm font-medium focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Category Classification
                      </label>
                      <input
                        type="text"
                        placeholder="Cloud Infrastructure & DevOps"
                        value={regForm.categoryId}
                        onChange={e => setRegForm({ ...regForm, categoryId: e.target.value })}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm font-medium focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Target Chapter *
                    </label>
                    <select
                      value={regForm.chapterId}
                      onChange={e => setRegForm({ ...regForm, chapterId: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    >
                      {chapters.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--navy-900)] text-white hover:bg-slate-800 py-3 rounded-xl font-bold"
                  >
                    {loading ? 'Submitting Application…' : 'Submit Application & Proceed to Payment'}
                  </Button>
                </form>
              </Card>

              {/* Step 2: Payment Gate */}
              {activeRegistrationId && (
                <Card className="border-sky-300 bg-sky-50/40 p-6">
                  <div className="flex items-center gap-2.5 border-b border-sky-100 pb-4">
                    <div className="rounded-lg bg-sky-500 p-2 text-white">
                      <CreditCard className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-sky-950">Step 2: Payment Verification Gate</h2>
                      <p className="text-xs text-sky-800">
                        Rule: KYC review is unlocked ONLY after payment is verified.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-xl border border-sky-200 bg-white p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">Dharmic Trust Membership Fee:</span>
                        <span className="text-xl font-black text-slate-900">₹{paymentAmount.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Beneficiary: <strong>Dharmic Business Network Trust</strong>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Bank / UPI Reference Number *
                      </label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={e => setPaymentRef(e.target.value)}
                        placeholder="e.g. UPI-9845-77821"
                        className="mt-1.5 h-11 w-full rounded-xl border border-sky-300 bg-white px-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-300"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleVerifyPayment}
                      disabled={paying}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-xs"
                    >
                      {paying ? 'Verifying Payment…' : 'Confirm & Verify Payment (Unlock KYC)'}
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Application Status Timeline */}
            <div className="lg:col-span-6">
              <Card className="p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="size-5 text-slate-700" />
                    <h2 className="text-lg font-bold text-slate-900">Live Application Status Tracking</h2>
                  </div>
                  {activeRegistrationId && (
                    <Button
                      variant="secondary"
                      onClick={() => refreshStatus(activeRegistrationId)}
                    >
                      Refresh Status
                    </Button>
                  )}
                </div>

                {!activeRegistrationId ? (
                  <div className="py-16 text-center text-slate-500">
                    <AlertCircle className="mx-auto size-10 text-slate-300 mb-2" />
                    <p className="font-semibold">No active application selected.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Submit the form on the left to track the multi-stage approval lifecycle.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    {/* Status Pill */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Current Stage:
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                            statusDetail?.currentStatus === 'APPROVED_AND_ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : statusDetail?.currentStatus === 'PENDING_EXECUTIVE_APPROVAL'
                              ? 'bg-purple-100 text-purple-800'
                              : statusDetail?.currentStatus === 'PENDING_DOC_VERIFICATION'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {statusDetail?.currentStatus || 'PENDING_PAYMENT'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        Applicant: {statusDetail?.registration?.fullName} ({statusDetail?.registration?.businessName})
                      </p>
                      <p className="text-xs text-slate-500">Chapter: {statusDetail?.chapter}</p>
                    </div>

                    {/* Timeline Stages */}
                    <div className="space-y-4">
                      {/* Stage 1 */}
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-emerald-500 p-1 text-white mt-0.5">
                          <CheckCircle2 className="size-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-900">1. Bhandhu Registration Submitted</div>
                          <div className="text-xs text-slate-500">
                            Details received and application ID generated.
                          </div>
                        </div>
                      </div>

                      {/* Stage 2 */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-full p-1 text-white mt-0.5 ${
                            statusDetail?.payment?.paymentStatus === 'SUCCESS' ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <CheckCircle2 className="size-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-900">2. Payment Verification Gate</div>
                          <div className="text-xs text-slate-500">
                            {statusDetail?.payment ? (
                              <span className="text-emerald-700 font-semibold">
                                Verified Ref: {statusDetail.payment.paymentRef} (₹{statusDetail.payment.amount})
                              </span>
                            ) : (
                              'Waiting for verified payment receipt'
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stage 3 */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-full p-1 text-white mt-0.5 ${
                            statusDetail?.documentVerification?.status === 'VERIFIED'
                              ? 'bg-emerald-500'
                              : 'bg-slate-300'
                          }`}
                        >
                          <CheckCircle2 className="size-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-900">
                            3. Member Coordinator KYC Review
                          </div>
                          <div className="text-xs text-slate-500">
                            {statusDetail?.documentVerification ? (
                              <span className="text-emerald-700 font-semibold">
                                KYC Verified by {statusDetail.documentVerification.verifiedBy}
                              </span>
                            ) : (
                              'Exclusive access: Coordinator reviews documents in Tab 2'
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stage 4 */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-full p-1 text-white mt-0.5 ${
                            statusDetail?.executiveApproval?.status === 'APPROVED'
                              ? 'bg-emerald-500'
                              : 'bg-slate-300'
                          }`}
                        >
                          <CheckCircle2 className="size-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-900">
                            4. President / VP Executive Approval
                          </div>
                          <div className="text-xs text-slate-500">
                            {statusDetail?.executiveApproval ? (
                              <span className="text-emerald-700 font-semibold">
                                Approved by {statusDetail.executiveApproval.approvedBy} ({statusDetail.executiveApproval.roleAtApproval})
                              </span>
                            ) : (
                              'Pending final sign-off by Chapter President or VP'
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stage 5 */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-full p-1 text-white mt-0.5 ${
                            statusDetail?.groupMembership ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <CheckCircle2 className="size-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-900">
                            5. Active Chapter Group Membership
                          </div>
                          <div className="text-xs text-slate-500">
                            {statusDetail?.groupMembership ? (
                              <span className="text-emerald-700 font-bold">
                                Member Activated! Listed in Chapter Directory.
                              </span>
                            ) : (
                              'Unlocked automatically upon executive approval'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {statusDetail?.currentStatus === 'PENDING_DOC_VERIFICATION' && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                        <p className="text-xs font-bold text-amber-900">
                          Next Action Required:
                        </p>
                        <p className="text-xs text-amber-800 mt-1">
                          Switch to <strong>Tab 2 (Member Coordinator KYC)</strong> to review documents and forward to the executive team.
                        </p>
                      </div>
                    )}

                    {statusDetail?.currentStatus === 'PENDING_EXECUTIVE_APPROVAL' && (
                      <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
                        <p className="text-xs font-bold text-purple-900">
                          Next Action Required:
                        </p>
                        <p className="text-xs text-purple-800 mt-1">
                          Switch to <strong>Tab 3 (President / VP Approval)</strong> to grant final approval and add member to the chapter group.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: MEMBER COORDINATOR KYC QUEUE */}
        {activeTab === 'coordinator' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Member Coordinator Document Review Inbox</h2>
                <p className="text-sm text-slate-600">
                  Exclusive access: Verify business credentials and KYC for applicants with confirmed payment.
                </p>
              </div>
              <Button variant="secondary" onClick={loadCoordinatorQueue}>
                Refresh Queue
              </Button>
            </div>

            {coordQueue.length === 0 ? (
              <Card className="py-16 text-center text-slate-500">
                <FileCheck className="mx-auto size-12 text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-700">No applicants waiting for KYC verification</h3>
                <p className="text-xs text-slate-500 mt-1">
                  When new members complete registration and payment, their applications appear here.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {coordQueue.map(item => (
                  <Card key={item.registrationId} className="flex flex-col justify-between p-5 hover:border-sky-300 transition-colors">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          Payment Verified
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900">{item.fullName}</h3>
                      <p className="text-sm font-semibold text-slate-700">{item.businessName}</p>
                      <p className="text-xs text-slate-500 mt-1">Chapter: {item.chapterName}</p>

                      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs space-y-1">
                        <div>
                          <span className="text-slate-500">Email:</span> {item.email}
                        </div>
                        <div>
                          <span className="text-slate-500">Phone:</span> {item.phone}
                        </div>
                        <div>
                          <span className="text-slate-500">Payment Ref:</span>{' '}
                          <code className="text-emerald-700 font-bold">{item.payment?.paymentRef || 'Verified'}</code>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="mt-5 w-full bg-sky-600 hover:bg-sky-700 text-white font-bold"
                      onClick={() => setSelectedCoordItem(item)}
                    >
                      Review & Verify KYC
                    </Button>
                  </Card>
                ))}
              </div>
            )}

            {/* Document Review Modal */}
            {selectedCoordItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-bold text-slate-900">Review KYC & Business Documents</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedCoordItem(null)}
                      className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <span className="text-xs font-bold uppercase text-slate-500">Applicant</span>
                      <p className="text-sm font-bold text-slate-900">
                        {selectedCoordItem.fullName} — {selectedCoordItem.businessName}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600">
                        KYC / Business Proof Document URL
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="url"
                          value={kycDocUrl}
                          onChange={e => setKycDocUrl(e.target.value)}
                          className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm focus:border-sky-500 focus:outline-none"
                        />
                        <a
                          href={kycDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600">
                        Verification Notes & Audit Trail
                      </label>
                      <textarea
                        rows={3}
                        value={kycNotes}
                        onChange={e => setKycNotes(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleCoordinatorVerify('REJECTED')}
                        disabled={verifyingDoc}
                        className="flex-1 text-red-600 hover:bg-red-50"
                      >
                        Reject Documents
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleCoordinatorVerify('VERIFIED')}
                        disabled={verifyingDoc}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        {verifyingDoc ? 'Submitting…' : 'Verify & Forward to President'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRESIDENT & VP EXECUTIVE APPROVALS */}
        {activeTab === 'executive' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">President & Vice President Approval Queue</h2>
                <p className="text-sm text-slate-600">
                  Executive authority: Grant final sign-off and activate membership in Chapter Group.
                </p>
              </div>
              <Button variant="secondary" onClick={loadExecutiveQueue}>
                Refresh Queue
              </Button>
            </div>

            {execQueue.length === 0 ? (
              <Card className="py-16 text-center text-slate-500">
                <ShieldCheck className="mx-auto size-12 text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-700">No applicants waiting for executive approval</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Once Member Coordinator verifies documents, applicants appear here for final approval.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {execQueue.map(item => (
                  <Card key={item.registrationId} className="flex flex-col justify-between p-5 border-purple-200 hover:border-purple-300">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                          Ready for Approval
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900">{item.fullName}</h3>
                      <p className="text-sm font-semibold text-slate-700">{item.businessName}</p>
                      <p className="text-xs text-slate-500 mt-1">Chapter: {item.chapterName}</p>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 font-medium">
                          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                          <span>Payment Verified: {item.payment?.paymentRef || '₹6,000 Verified'}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-1.5 text-xs text-sky-800 font-medium">
                          <CheckCircle2 className="size-4 text-sky-600 shrink-0" />
                          <span>
                            KYC Verified by {item.documentVerification?.verifiedBy || 'Coordinator'}
                          </span>
                        </div>
                        {item.documentVerification?.notes && (
                          <p className="text-xs text-slate-500 italic px-1">
                            "{item.documentVerification.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      className="mt-5 w-full bg-[var(--navy-900)] hover:bg-slate-800 text-white font-bold"
                      onClick={() => setSelectedExecItem(item)}
                    >
                      Approve & Add to Chapter Group
                    </Button>
                  </Card>
                ))}
              </div>
            )}

            {/* Executive Approval Modal */}
            {selectedExecItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-bold text-slate-900">Executive Approval & Parivar Induction</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedExecItem(null)}
                      className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <span className="text-xs font-bold uppercase text-slate-500">Applicant Details</span>
                      <p className="text-sm font-bold text-slate-900">
                        {selectedExecItem.fullName} — {selectedExecItem.businessName}
                      </p>
                      <p className="text-xs text-slate-500">Chapter: {selectedExecItem.chapterName}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600">
                        Approver Authority Role
                      </label>
                      <select
                        value={execRole}
                        onChange={e => setExecRole(e.target.value as 'President' | 'Vice President')}
                        className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold focus:border-sky-500 focus:outline-none"
                      >
                        <option value="President">Dharma Dhara (Parivar President)</option>
                        <option value="Vice President">Parivar Vice President</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600">
                        Executive Approval Remarks
                      </label>
                      <textarea
                        rows={3}
                        value={execRemarks}
                        onChange={e => setExecRemarks(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleExecutiveApprove('REJECTED')}
                        disabled={approving}
                        className="flex-1 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleExecutiveApprove('APPROVED')}
                        disabled={approving}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        {approving ? 'Activating…' : 'Approve & Add to Chapter'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CHAPTER GROUP MEMBER DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Chapter Group Member Directory ({chapterMembers.length})
                </h2>
                <p className="text-sm text-slate-600">
                  Approved active members actively inducted into the governed Chapter Group.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => selectedChapterId && loadChapterMembers(selectedChapterId)}
                >
                  Refresh Directory
                </Button>
              </div>
            </div>

            {loadingMembers ? (
              <div className="py-16 text-center text-slate-500">Loading chapter members…</div>
            ) : chapterMembers.length === 0 ? (
              <Card className="py-16 text-center text-slate-500">
                <Users className="mx-auto size-12 text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-700">No active members in this chapter yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Once applicants are approved by the President / VP, they appear here automatically.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {chapterMembers.map(member => (
                  <Card key={member.id} className="p-5 border-slate-200 hover:border-sky-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="size-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base">
                        {member.fullName.charAt(0)}
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        {member.role || 'Member'}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900">{member.fullName}</h3>
                    <p className="text-sm font-semibold text-slate-700">{member.businessName}</p>

                    <div className="mt-4 border-t border-slate-100 pt-3 text-xs space-y-1 text-slate-500">
                      <div>
                        <strong>Member ID:</strong> {member.memberId}
                      </div>
                      {member.email && (
                        <div>
                          <strong>Email:</strong> {member.email}
                        </div>
                      )}
                      {member.phone && (
                        <div>
                          <strong>Phone:</strong> {member.phone}
                        </div>
                      )}
                      <div>
                        <strong>Inducted:</strong> {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: GOVERNANCE & ROLES */}
        {activeTab === 'governance' && (
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Create Chapter */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Building2 className="size-5 text-slate-700" />
                  <h3 className="text-lg font-bold text-slate-900">Create New Parivar</h3>
                </div>

                <form onSubmit={handleCreateChapter} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Chapter Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Madurai West Parivar"
                      value={newChapterName}
                      onChange={e => setNewChapterName(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Region
                      </label>
                      <input
                        type="text"
                        placeholder="Madurai"
                        value={newChapterRegion}
                        onChange={e => setNewChapterRegion(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        State
                      </label>
                      <input
                        type="text"
                        placeholder="Tamil Nadu"
                        value={newChapterState}
                        onChange={e => setNewChapterState(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl">
                    Create Chapter
                  </Button>
                </form>
              </Card>

              {/* Existing Chapters List */}
              <Card className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Active Chapters ({chapters.length})
                </h3>
                <div className="space-y-2">
                  {chapters.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-500">
                          {c.regionId || 'Regional'}, {c.stateId || 'India'}
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Role Hierarchy Assignment */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck className="size-5 text-slate-700" />
                  <h3 className="text-lg font-bold text-slate-900">Assign Parivar Roles (RBAC)</h3>
                </div>

                <form onSubmit={handleAssignRole} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Target Chapter *
                    </label>
                    <select
                      value={selectedChapterId}
                      onChange={e => setSelectedChapterId(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold focus:border-sky-500 focus:outline-none"
                    >
                      {chapters.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Member ID or User ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. member:coordinator-1 or member:anand"
                      value={assignMemberId}
                      onChange={e => setAssignMemberId(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Role to Assign *
                    </label>
                    <select
                      value={assignRoleId}
                      onChange={e => setAssignRoleId(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                    >
                      <option value="President">President (Executive Authority)</option>
                      <option value="Vice President">Vice President (Executive Authority)</option>
                      <option value="Secretary">Secretary</option>
                      <option value="Member Coordinator">Member Coordinator (Exclusive KYC Verification)</option>
                      <option value="Member">Member</option>
                    </select>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl">
                    Save Role Assignment
                  </Button>
                </form>
              </Card>

              {/* Assigned Roles in Chapter */}
              <Card className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Current Role Assignments in Selected Chapter
                </h3>
                {chapterRoles.length === 0 ? (
                  <p className="text-xs text-slate-500">No custom roles assigned yet in this chapter.</p>
                ) : (
                  <div className="space-y-2">
                    {chapterRoles.map(r => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">{r.memberId}</div>
                          <div className="text-xs text-slate-500">
                            Assigned on {new Date(r.assignedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                          {r.roleId}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
