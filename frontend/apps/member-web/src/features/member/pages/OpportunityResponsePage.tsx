import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/common/Input';
import { ContextBanner, DetailGrid, EnterpriseStatus } from '@/features/member/components/EnterpriseMemberUI';
import { EmptyState, PageHead, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId, businessForMember, opportunityVisibleToMember } from '@/features/network/selectors';
import { addNotification, saveResponseDraft, submitResponse } from '@/features/network/networkSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { clearDirtyGuard, setDirtyGuard } from '@/features/member/navigation/memberNavigationSlice';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { stableClientId } from '@/utils/stableId';

export default function OpportunityResponsePage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const newResponseId=useRef(stableClientId('response'));
  const { go, back } = useMemberNavigation();
  const n=useNetworkSlice(['affiliations', 'businesses', 'certificationRecords', 'members', 'opportunities', 'responses'] as const);
  const memberId = useAppSelector(activeMemberId);
  const business = businessForMember(n, memberId);
  const opportunity = n.opportunities.find(o => o.id === id);
  const existing = n.responses.find(r => r.opportunityId === id && r.memberId === memberId);
  const [summary, setSummary] = useState(existing?.summary ?? '');
  const [solution, setSolution] = useState(existing?.solution ?? '');
  const [capacity, setCapacity] = useState(existing?.capacity ?? '');
  const [leadTime, setLeadTime] = useState(existing?.leadTime ?? '');
  const [commercial, setCommercial] = useState(existing?.commercialNote ?? '');
  const [supporting, setSupporting] = useState(existing?.supportingNote ?? '');
  const [certificationIds, setCertificationIds] = useState<string[]>(existing?.certificationIds ?? []);
  const [review, setReview] = useState(false);
  const [error, setError] = useState('');
  const initialSignature = JSON.stringify({ summary: existing?.summary ?? '', solution: existing?.solution ?? '', capacity: existing?.capacity ?? '', leadTime: existing?.leadTime ?? '', commercial: existing?.commercialNote ?? '', supporting: existing?.supportingNote ?? '', certificationIds: existing?.certificationIds ?? [] });
  const currentSignature = JSON.stringify({ summary, solution, capacity, leadTime, commercial, supporting, certificationIds });
  const dirty = initialSignature !== currentSignature;
  useEffect(() => { dispatch(setDirtyGuard({ dirty, label: 'Opportunity response', canSaveDraft: false })); return () => { dispatch(clearDirtyGuard()); }; }, [dirty, dispatch]);
  useEffect(() => { const h=(e:BeforeUnloadEvent)=>{ if(dirty){ e.preventDefault(); e.returnValue=''; } }; window.addEventListener('beforeunload',h); return()=>window.removeEventListener('beforeunload',h); }, [dirty]);

  if (!business || !opportunity || opportunity.status !== 'open' || opportunity.ownerMemberId === memberId || !opportunityVisibleToMember({ network: n }, opportunity, memberId)) {
    return <div><PageHead title="Respond to Opportunity" /><EmptyState title="This opportunity is not available for response" body="It may be closed, owned by you, or outside your current network scope." action={<Button variant="secondary" onClick={() => back('/app/opportunities')}>Return to marketplace</Button>} /></div>;
  }

  if (existing && existing.status !== 'draft') {
    return <div><PageHead title="Response already submitted" /><ContextBanner title="Your response is already in the buyer workflow" action={<Button onClick={() => go('/app/responses/my', { label: opportunity.title })}>View My Responses</Button>}>Current status: <strong>{existing.status}</strong>. Use My Responses to track progress and the opportunity page to continue discussions.</ContextBanner></div>;
  }

  const certs = n.certificationRecords.filter(c => c.businessId === business.id && c.verificationStatus === 'Verified');
  const payload = () => ({ opportunityId: opportunity.id, memberId, businessId: business.id, summary: summary.trim(), solution: solution.trim() || undefined, capacity: capacity.trim() || undefined, leadTime: leadTime.trim(), commercialNote: commercial.trim(), certificationIds, supportingNote: supporting.trim() || undefined });
  const validate = () => {
    if (summary.trim().length < 20) { setError('Explain your relevant capability in at least 20 characters.'); return false; }
    if (!solution.trim()) { setError('Describe the proposed solution or approach.'); return false; }
    if (!leadTime.trim()) { setError('Provide an indicative lead time.'); return false; }
    setError(''); return true;
  };
  const saveDraft = () => { dispatch(saveResponseDraft(payload())); dispatch(clearDirtyGuard()); go('/app/responses/my', { label: opportunity.title }); };
  const submit = async (e?: FormEvent) => { e?.preventDefault(); command.clearError(); if (!validate()) return; const responsePayload=payload();const aggregateId=existing?.id??newResponseId.current;const result=await command.execute({domain:'member',policyId:'opportunity.response.submit',command:'opportunity.response.submit',aggregateType:'OpportunityResponse',aggregateId,expectedVersion:existing?.version,payload:{id:aggregateId,...responsePayload,status:'submitted'},previewAction:()=>{dispatch(submitResponse(responsePayload));dispatch(addNotification({ memberId: opportunity.ownerMemberId, text: `New response to ${opportunity.title}`, href: `/app/opportunities/${opportunity.id}` }))}});if(!result.ok)return;dispatch(clearDirtyGuard());go('/app/responses/my', { label: opportunity.title }); };

  return (
    <div>
      <PageHead eyebrow="Supplier response" title="Respond to Opportunity" description="Submit the capability and commercial context needed for buyer review." actions={<Button variant="secondary" onClick={() => back(`/app/opportunities/${opportunity.id}`)}>Back to requirement</Button>} />
      <div className="mb-5"><ContextBanner title={opportunity.title}>Responding as <strong>{business.name}</strong>. Your response will remain linked to this business and your Member identity.</ContextBanner></div>
      <div className="mb-5"><CommandExecutionFeedback error={command.error} onRetry={()=>void command.retry()} onDismiss={command.clearError}/></div>

      {review ? (
        <Card className="max-w-4xl p-5 sm:p-6">
          <h2 className="text-xl font-black text-[var(--navy-950)]">Review before submitting</h2>
          <p className="mt-1 text-base text-slate-600">Check the response as the buyer will understand it.</p>
          <div className="mt-5"><DetailGrid items={[{ label: 'Business', value: business.name }, { label: 'Lead time', value: leadTime }, { label: 'Capability statement', value: summary }, { label: 'Proposed solution', value: solution }, { label: 'Capacity', value: capacity || 'Not specified' }, { label: 'Commercial note', value: commercial || 'Not specified' }, { label: 'Certifications', value: certificationIds.length ? certs.filter(c => certificationIds.includes(c.id)).map(c => c.standard).join(', ') : 'None attached' }, { label: 'Supporting note', value: supporting || 'None' }]} /></div>
          {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-700">{error}</div>}
          <div className="mt-5 flex flex-wrap gap-2"><Button disabled={command.busy} onClick={() => void submit()}>{command.busy?'Submitting…':'Submit Response'}</Button><Button variant="secondary" onClick={() => setReview(false)}>Edit response</Button><Button variant="ghost" onClick={saveDraft}>Save Draft</Button></div>
        </Card>
      ) : (
        <Card className="max-w-4xl p-5 sm:p-6">
          <form className="grid gap-5" onSubmit={e => { e.preventDefault(); if (validate()) setReview(true); }}>
            {existing?.status === 'draft' && <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4"><span className="text-base font-semibold text-amber-900">You are continuing a saved draft.</span><EnterpriseStatus status="draft" tone="warning" /></div>}
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-700">{error}</div>}
            <label className="grid gap-1.5 text-sm font-bold">Capability statement<textarea required minLength={20} rows={5} className="rounded-xl border border-slate-300 p-3 text-base font-normal leading-7" value={summary} onChange={e => setSummary(e.target.value)} placeholder="Explain the directly relevant capabilities, experience and fit." /></label>
            <label className="grid gap-1.5 text-sm font-bold">Proposed solution / approach<textarea required rows={4} className="rounded-xl border border-slate-300 p-3 text-base font-normal leading-7" value={solution} onChange={e => setSolution(e.target.value)} placeholder="Describe how you would address the requirement at a practical level." /></label>
            <div className="grid gap-4 md:grid-cols-2"><Input label="Available capacity" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 5,000 units/month" /><Input required label="Indicative lead time" value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="e.g. 4 weeks after PO" /></div>
            <label className="grid gap-1.5 text-sm font-bold">Commercial note <span className="font-normal text-slate-500">Optional at this stage</span><textarea rows={3} className="rounded-xl border border-slate-300 p-3 text-base font-normal leading-7" value={commercial} onChange={e => setCommercial(e.target.value)} placeholder="Example: pricing after drawing/specification review." /></label>
            {certs.length > 0 && <fieldset><legend className="text-sm font-bold">Relevant verified certifications <span className="font-normal text-slate-500">Optional</span></legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{certs.map(c => <label key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-base"><input type="checkbox" className="size-5" checked={certificationIds.includes(c.id)} onChange={e => setCertificationIds(e.target.checked ? [...certificationIds, c.id] : certificationIds.filter(id => id !== c.id))} /><span>{c.standard}</span></label>)}</div></fieldset>}
            <label className="grid gap-1.5 text-sm font-bold">Supporting information <span className="font-normal text-slate-500">Optional</span><textarea rows={3} className="rounded-xl border border-slate-300 p-3 text-base font-normal leading-7" value={supporting} onChange={e => setSupporting(e.target.value)} placeholder="Mention a relevant project, capability evidence or clarification without exposing confidential IP." /></label>
            <Tip>Do not include confidential customer data, drawings or proprietary IP in an initial response unless a governed sharing mechanism authorises it.</Tip>
            <div className="flex flex-wrap gap-2"><Button type="submit">Review & Submit</Button><Button type="button" variant="secondary" onClick={saveDraft}>Save Draft</Button><Button type="button" variant="ghost" onClick={() => back(`/app/opportunities/${opportunity.id}`)}>Cancel</Button></div>
          </form>
        </Card>
      )}
    </div>
  );
}
