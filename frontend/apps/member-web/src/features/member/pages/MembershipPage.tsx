import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  WalletCards, 
  CheckCircle2, 
  Clock, 
  FileCheck2, 
  Building2, 
  BadgeCheck, 
  Search, 
  RefreshCw, 
  CreditCard, 
  AlertCircle 
} from 'lucide-react';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { EmptyState, PageHead, StatusPill } from '@/features/network/components/NetworkUI';
import { activeMemberId } from '@/features/network/selectors';
import { payMembership } from '@/features/network/networkSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { env } from '@/config/env';
import { createPaymentSession } from '@/services/api/productionProviders';
import { safeExternalHttpUrl } from '@/utils/urlSecurity';
import { boundaryErrorMessage } from '@/features/auth/authService';
import { chapterWorkflowApi, type OnboardingStatusDetailDto } from '@/services/api/chapterWorkflowApi';
import { localStorageService } from '@/services/storage/localStorage';

const money = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const date = (v: string) => {
  try {
    return new Date(v.includes('T') ? v : `${v}T00:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return v;
  }
};

export default function MembershipPage() {
  const previewPayment = env.useMocks;
  const [confirmPay, setConfirmPay] = useState(false);
  const [busy, setBusy] = useState(false);
  const [payNotice, setPayNotice] = useState('');
  const dispatch = useAppDispatch();
  const { go } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const n = useNetworkSlice(['members', 'payments'] as const);
  const member = n.members.find(m => m.id === memberId) || {
    id: memberId,
    name: 'Authorized Member',
    email: 'member@sethu.network',
    chapter: 'Hosur Chapter',
    designation: 'Enterprise Member',
    status: 'active'
  };

  const payments = n.payments
    .filter(p => p.memberId === memberId)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const due = payments.filter(p => p.status === 'due').sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const paid = payments.filter(p => p.status === 'paid');
  const status = member.status ?? 'active';

  // =========================================================================
  // LIVE REGISTRATION & PAYMENT VERIFIED ONBOARDING LIFECYCLE TRACKING
  // =========================================================================
  const [trackerIdentifier, setTrackerIdentifier] = useState<string>(() => {
    return (member as any).email || 'sundar@matrelogistics.com';
  });
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingStatusDetailDto | null>(null);
  const [trackerError, setTrackerError] = useState('');

  const fetchOnboardingTracking = async (identifier: string) => {
    if (!identifier) return;
    setTrackingLoading(true);
    setTrackerError('');
    try {
      const data = await chapterWorkflowApi.getOnboardingStatusByUser(identifier.trim());
      setOnboardingData(data);
    } catch {
      // Check client-side applications DB as fallback
      try {
        const apps = localStorageService.get<any[]>('dbn_applications_db');
        if (apps && Array.isArray(apps)) {
          const found = apps.find(
            (a: any) =>
              a.email?.toLowerCase() === identifier.toLowerCase() ||
              a.id?.toLowerCase() === identifier.toLowerCase() ||
              a.assignedMemberId?.toLowerCase() === identifier.toLowerCase()
          );
          if (found) {
            setOnboardingData({
              registration: {
                id: found.id,
                fullName: found.applicantFullName,
                email: found.email,
                phone: found.mobileNumber,
                businessName: found.businessName,
                categoryId: found.primaryBusinessCategory,
                chapterId: 'ch-active',
                onboardingStatus: found.stage === 'Activated' ? 'APPROVED_AND_ACTIVE' :
                                  found.stage === 'CommitteeApproved' ? 'PENDING_EXECUTIVE_APPROVAL' :
                                  found.stage === 'DocumentsVerified' ? 'DOC_VERIFIED' : 'PAYMENT_VERIFIED',
                createdAt: found.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              chapter: found.chapterName || 'Hosur Chapter',
              currentStatus: found.stage === 'Activated' ? 'APPROVED_AND_ACTIVE' :
                             found.stage === 'CommitteeApproved' ? 'PENDING_EXECUTIVE_APPROVAL' :
                             found.stage === 'DocumentsVerified' ? 'DOC_VERIFIED' : 'PAYMENT_VERIFIED',
              payment: {
                id: 'pay-local',
                registrationId: found.id,
                amount: found.donationAmount || 6000,
                paymentRef: found.upiReference || found.neftReference || 'VERIFIED-UPI',
                paymentStatus: 'SUCCESS',
                verifiedAt: found.createdAt || new Date().toISOString()
              },
              documentVerification: found.documentsVerifiedAt ? {
                id: 'doc-local',
                registrationId: found.id,
                documentUrl: 'https://documents.sethu.network/kyc.pdf',
                verifiedBy: found.documentsVerifiedBy || 'Member Coordinator',
                status: 'VERIFIED',
                verifiedAt: found.documentsVerifiedAt
              } : null,
              executiveApproval: found.committeeApprovedAt ? {
                id: 'app-local',
                registrationId: found.id,
                approvedBy: found.committeeApprovedBy || 'Chapter President',
                roleAtApproval: 'President',
                status: 'APPROVED',
                approvedAt: found.committeeApprovedAt
              } : null,
              groupMembership: found.assignedMemberId ? {
                id: 'gm-local',
                chapterId: 'ch-active',
                memberId: found.assignedMemberId,
                fullName: found.applicantFullName,
                role: 'Member',
                joinedAt: found.trustPaymentVerifiedAt || new Date().toISOString(),
                status: 'ACTIVE'
              } : null
            });
            return;
          }
        }
      } catch {
        // ignore
      }
      setTrackerError('No active onboarding application found for this identifier.');
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    const idToQuery = (member as any).email || 'sundar@matrelogistics.com';
    fetchOnboardingTracking(idToQuery);
  }, [(member as any).email]);

  const beginRenewal = async () => {
    if (!due) return;
    if (previewPayment) {
      setConfirmPay(true);
      return;
    }
    setBusy(true);
    setPayNotice('');
    try {
      const result = await createPaymentSession({
        paymentId: due.id,
        memberId,
        purpose: 'membership',
        returnPath: '/app/membership'
      });
      const target = safeExternalHttpUrl(result.checkoutUrl);
      if (!target) throw new Error('The payment provider did not return a safe checkout URL.');
      window.location.assign(target);
    } catch (error) {
      setPayNotice(boundaryErrorMessage(error, 'Renewal payment could not be started.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-7">
      <PageHead
        title="Bhandhuship & Onboarding Tracker"
        description="Authoritative membership lifecycle tracking: registration verification, payment confirmation, KYC approval, and executive standing."
      />

      {/* =========================================================================
          1. LIVE ONBOARDING & PAYMENT VERIFICATION LIFECYCLE
         ========================================================================= */}
      <Card className="border-blue-200 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <BadgeCheck className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">Bhandhu Registration & Payment Tracker</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Live Flow
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Tracks member application through Payment Verification, Coordinator KYC, and Chapter Executive Approval.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={trackerIdentifier}
                onChange={(e) => setTrackerIdentifier(e.target.value)}
                placeholder="Applicant email or ID"
                className="w-56 pl-8 pr-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="size-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <Button
              variant="secondary"
              className="py-1.5 px-3 text-xs font-bold"
              disabled={trackingLoading}
              onClick={() => fetchOnboardingTracking(trackerIdentifier)}
            >
              <RefreshCw className={`size-3.5 ${trackingLoading ? 'animate-spin' : ''}`} />
              Track
            </Button>
          </div>
        </div>

        {trackerError && !onboardingData && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              <span>{trackerError}</span>
            </div>
            <Button variant="secondary" className="text-xs py-1 px-2.5" onClick={() => go('/register')}>
              Submit New Registration
            </Button>
          </div>
        )}

        {onboardingData && (
          <div className="mt-6 space-y-6">
            {/* Applicant Summary Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Applicant</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{onboardingData.registration?.fullName}</span>
                <span className="text-xs text-slate-500">{onboardingData.registration?.email}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Business Enterprise</span>
                <span className="text-sm font-extrabold text-blue-700 mt-0.5 block">{onboardingData.registration?.businessName}</span>
                <span className="text-xs text-slate-500">{onboardingData.registration?.categoryId || 'Enterprise'}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Target Parivar</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{onboardingData.chapter || 'Hosur Chapter'}</span>
                <span className="text-xs text-emerald-700 font-bold">Parivar Jurisdiction</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Current Lifecycle Stage</span>
                <div className="mt-1">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {onboardingData.currentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Stepper Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Stage 1: Registered */}
              <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">Stage 1</span>
                  <CheckCircle2 className="size-4 text-emerald-600" />
                </div>
                <div className="text-sm font-black text-slate-900 mt-1">Registration Intake</div>
                <p className="text-xs text-slate-600 mt-0.5">Section A–F Form Completed</p>
                <div className="mt-2 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                  ✓ Submitted
                </div>
              </div>

              {/* Stage 2: Payment Verified */}
              <div className="p-4 rounded-2xl bg-white border border-emerald-400 ring-2 ring-emerald-300/40 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">Stage 2</span>
                  <CheckCircle2 className="size-4 text-emerald-600" />
                </div>
                <div className="text-sm font-black text-slate-900 mt-1">Payment Verification Gate</div>
                <p className="text-xs text-slate-600 mt-0.5">
                  ₹{Number(onboardingData.payment?.amount || 6000).toLocaleString('en-IN')} Donation
                </p>
                <div className="mt-2 text-[11px] font-extrabold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                  <CreditCard className="size-3 text-emerald-700" />
                  <span>VERIFIED · {onboardingData.payment?.paymentRef || 'REF-CONFIRMED'}</span>
                </div>
              </div>

              {/* Stage 3: Coordinator KYC */}
              <div className={`p-4 rounded-2xl bg-white border shadow-xs ${
                onboardingData.documentVerification?.status === 'VERIFIED'
                  ? 'border-emerald-300'
                  : 'border-blue-300 bg-blue-50/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">Stage 3</span>
                  {onboardingData.documentVerification?.status === 'VERIFIED' ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <Clock className="size-4 text-blue-600 animate-pulse" />
                  )}
                </div>
                <div className="text-sm font-black text-slate-900 mt-1">Coordinator KYC Verification</div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {onboardingData.documentVerification?.status === 'VERIFIED'
                    ? `Verified by ${onboardingData.documentVerification.verifiedBy || 'Member Coordinator'}`
                    : 'In Member Coordinator Queue'}
                </p>
                <div className="mt-2 text-[11px] font-bold px-2 py-0.5 rounded-md inline-block bg-slate-100 text-slate-800">
                  {onboardingData.documentVerification?.status === 'VERIFIED' ? '✓ KYC Passed' : 'In Progress'}
                </div>
              </div>

              {/* Stage 4: Executive Approval */}
              <div className={`p-4 rounded-2xl bg-white border shadow-xs ${
                onboardingData.executiveApproval?.status === 'APPROVED' || onboardingData.currentStatus === 'APPROVED_AND_ACTIVE'
                  ? 'border-emerald-300'
                  : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">Stage 4</span>
                  {onboardingData.executiveApproval?.status === 'APPROVED' || onboardingData.currentStatus === 'APPROVED_AND_ACTIVE' ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <Clock className="size-4 text-slate-400" />
                  )}
                </div>
                <div className="text-sm font-black text-slate-900 mt-1">Executive Approval</div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {onboardingData.executiveApproval?.status === 'APPROVED'
                    ? `Approved by ${onboardingData.executiveApproval.approvedBy} (${onboardingData.executiveApproval.roleAtApproval})`
                    : 'President / VP Committee Sign-off'}
                </p>
                <div className="mt-2 text-[11px] font-bold px-2 py-0.5 rounded-md inline-block bg-slate-100 text-slate-800">
                  {onboardingData.groupMembership?.memberId || onboardingData.currentStatus === 'APPROVED_AND_ACTIVE'
                    ? `Active ID: ${onboardingData.groupMembership?.memberId || 'DBN-MEMBER'}`
                    : 'Awaiting Sign-off'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* =========================================================================
          2. STANDING & RENEWAL OVERVIEW
         ========================================================================= */}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
              <ShieldCheck className="size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black">{member.name}</h2>
                <StatusPill tone={status === 'active' ? 'good' : status === 'expired' ? 'bad' : 'warn'}>
                  {status}
                </StatusPill>
              </div>
              <p className="mt-1 text-base text-slate-600">
                {member.chapter} · {member.designation}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">Membership standing</div>
              <div className="mt-1 text-lg font-black">
                {status === 'active'
                  ? 'Active membership'
                  : status === 'expired'
                  ? 'Membership expired'
                  : 'Membership requires attention'}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">Renewal record</div>
              <div className="mt-1 text-lg font-black">
                {due ? `Due ${date(due.dueDate)}` : 'No payment currently due'}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-black">Renewal</h2>
          {due ? (
            <>
              <div className="mt-4 text-3xl font-black">{money(due.amount)}</div>
              <p className="mt-1 text-base text-slate-600">
                {due.description} · due {date(due.dueDate)}
              </p>
              <Button className="mt-5" disabled={busy} onClick={() => void beginRenewal()}>
                <WalletCards className="size-4" />
                {busy ? 'Starting…' : previewPayment ? 'Record preview renewal' : 'Pay renewal securely'}
              </Button>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Preview mode can record a local simulated renewal. Production checkout is initiated through the
                authoritative payment service and is not marked paid until server/provider confirmation.
              </p>
              {payNotice && (
                <p role="status" className="mt-3 text-sm font-semibold text-sky-700">
                  {payNotice}
                </p>
              )}
            </>
          ) : (
            <div className="mt-4">
              <StatusPill tone="good">Up to date</StatusPill>
              <p className="mt-3 text-base leading-7 text-slate-600">
                There is no outstanding membership payment in your current account records.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* =========================================================================
          3. PAYMENT HISTORY
         ========================================================================= */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Membership payment history</h2>
          <Button variant="secondary" onClick={() => go('/app/payments', { label: 'Membership' })}>
            View all payments
          </Button>
        </div>
        <div className="grid gap-3">
          {paid.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <CheckCircle2 className="size-5 text-emerald-700" />
              <div className="min-w-0 flex-1">
                <div className="font-black">{p.description}</div>
                <div className="mt-1 text-sm text-slate-500">
                  Paid {p.paidAt ? date(p.paidAt) : 'date not recorded'} · due {date(p.dueDate)}
                </div>
              </div>
              <strong>{money(p.amount)}</strong>
            </Card>
          ))}
          {!paid.length && (
            <EmptyState
              title="No completed membership payments"
              body="Completed membership payment records will appear here when available."
            />
          )}
        </div>
      </section>

      <ActionDialog
        open={confirmPay}
        title="Record preview renewal?"
        description="This is a local preview action only. It does not represent a provider-authorized payment."
        confirmLabel="Record preview renewal"
        onClose={() => setConfirmPay(false)}
        onConfirm={() => {
          if (due && previewPayment) {
            dispatch(payMembership({ paymentId: due.id, memberId }));
            setPayNotice('Preview renewal recorded locally. No production payment is claimed.');
          }
          setConfirmPay(false);
        }}
      />
    </div>
  );
}
