import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/common/Input';
import { ContextBanner, DetailGrid, EnterpriseStatus } from '@/features/member/components/EnterpriseMemberUI';
import { PageHead, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId, businessForMember } from '@/features/network/selectors';
import { createOpportunity, updateOpportunity } from '@/features/network/networkSlice';
import { clearDirtyGuard, setDirtyGuard } from '@/features/member/navigation/memberNavigationSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { ConfigurableFormFields, configurableFormComplete } from '@/components/forms/ConfigurableFormFields';
import { toast } from '@/components/ui/Toast';
import type { Opportunity } from '@/features/network/types';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { serverClock } from '@/services/time/serverClock';
import { stableClientId } from '@/utils/stableId';

const today = () => serverClock.todayIso();
const plusDays = (days:number) => { const d = serverClock.now(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };

export default function CreateOpportunityPage() {
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const newOpportunityId = useRef(stableClientId('opportunity'));
  const { go, back } = useMemberNavigation();
  const [params] = useSearchParams();
  const memberId = useAppSelector(activeMemberId);
  const n=useNetworkSlice(['affiliations', 'businesses', 'categories', 'opportunities'] as const);
  const formDef = useAppSelector(s => s.controlPlane.forms.find(f => f.purpose === 'Opportunity' && f.active));
  const business = businessForMember(n, memberId);
  const editId = params.get('edit');
  const existing = editId ? n.opportunities.find(o => o.id === editId && o.ownerMemberId === memberId) : undefined;
  const initial = useMemo(() => ({
    title: existing?.title ?? '', description: existing?.description ?? '', categoryId: existing?.categoryId ?? business?.categoryIds[0] ?? '',
    location: existing?.location ?? (business ? `${business.city}, ${business.state}` : ''), closingDate: existing?.closingDate ?? plusDays(30),
    budget: existing?.budget ?? '', quantity: existing?.quantity ?? '', uom: existing?.uom ?? 'Nos', timeline: existing?.timeline ?? '',
    attachmentName: existing?.attachmentName ?? '', responseRule: existing?.responseRule ?? 'One response per member business',
    type: existing?.type ?? ('Requirement' as NonNullable<Opportunity['type']>), visibility: existing?.visibility ?? ('network' as Opportunity['visibility']),
  }), [existing?.id, business?.id]);
  const [draft, setDraft] = useState(initial);
  const [custom, setCustom] = useState<Record<string,string|boolean|string[]>>(existing?.customResponses ?? {});
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial) || JSON.stringify(custom) !== JSON.stringify(existing?.customResponses ?? {});

  useEffect(() => { setDraft(initial); setCustom(existing?.customResponses ?? {}); setReview(false); }, [initial, existing?.id]);
  useEffect(() => { dispatch(setDirtyGuard({ dirty, label: existing ? `Opportunity · ${existing.title}` : 'New opportunity', canSaveDraft: false })); return () => { dispatch(clearDirtyGuard()); }; }, [dirty, dispatch, existing?.title]);
  useEffect(() => { const h=(e:BeforeUnloadEvent)=>{ if(dirty){ e.preventDefault(); e.returnValue=''; } }; window.addEventListener('beforeunload',h); return()=>window.removeEventListener('beforeunload',h); }, [dirty]);

  if (!business) return <div><PageHead title="Post an Opportunity" /><ContextBanner title="Business profile required">Add or verify a business affiliation before posting opportunities.</ContextBanner></div>;
  if (editId && !existing) return <div><PageHead title="Edit Opportunity" /><ContextBanner title="Opportunity unavailable" action={<Button onClick={() => go('/app/opportunities/my')}>My Opportunities</Button>}>The opportunity is missing or you are not its owner.</ContextBanner></div>;
  if (existing && !['draft','open'].includes(existing.status)) return <div><PageHead title="Edit Opportunity" /><ContextBanner title="This opportunity is no longer editable" action={<Button onClick={() => go(`/app/opportunities/${existing.id}`)}>View Opportunity</Button>}>Only draft or open opportunities can be edited. Current status: <strong>{existing.status}</strong>.</ContextBanner></div>;

  const validate = () => {
    if (!draft.title.trim() || draft.title.trim().length < 8) { setError('Use a clear requirement title of at least 8 characters.'); return false; }
    if (!draft.description.trim() || draft.description.trim().length < 30) { setError('Describe the business requirement in at least 30 characters.'); return false; }
    if (!draft.categoryId) { setError('Choose the most relevant category.'); return false; }
    if (draft.closingDate < today()) { setError('Closing date must be today or later.'); return false; }
    if (formDef && !configurableFormComplete(formDef.fields, custom, 'member')) { setError('Complete the required configured requirement fields before continuing.'); return false; }
    setError(''); return true;
  };

  const persist = async (status:'draft'|'open') => {
    if (command.busy) return;
    command.clearError();
    if (status === 'open' && !validate()) return;
    if (status === 'draft' && !draft.title.trim()) {
      setError('Please provide at least a title to save a draft.');
      return;
    }
    const changes = {
      ...draft,
      title: draft.title.trim() || 'Untitled Opportunity Draft',
      categoryId: draft.categoryId || business.categoryIds[0] || 'mfg',
      chapterId: business.chapter || 'Chennai Chapter',
      chapter: business.chapter || 'Chennai Chapter',
      customResponses: custom,
      formVersion: formDef ? String(formDef.version) : undefined,
    };
    const aggregateId=existing?.id??newOpportunityId.current;
    const action=existing?updateOpportunity({ opportunityId: existing.id, ownerMemberId: memberId, changes }):createOpportunity({ ownerMemberId: memberId, businessId: business.id, status, ...changes });
    const result=await command.execute({domain:'member',policyId:existing?'opportunity.update':'opportunity.create',command:existing?'opportunity.update':'opportunity.create',aggregateType:'Opportunity',aggregateId,expectedVersion:existing?.version,payload:existing?{opportunityId:existing.id,ownerMemberId:memberId,changes}:{id:aggregateId,ownerMemberId:memberId,businessId:business.id,status,...changes},previewAction:()=>dispatch(action)});
    if(!result.ok)return;
    toast.success(existing?(status === 'draft' ? 'Opportunity draft saved!' : 'Opportunity updated successfully!'):(status === 'draft' ? 'Opportunity saved as draft!' : 'Opportunity published successfully!'), existing?'Opportunity Updated':status === 'draft' ? 'Draft Saved' : 'Opportunity Published');
    dispatch(clearDirtyGuard());
    go('/app/opportunities/my', { label: existing ? 'Opportunity' : 'Post Opportunity' });
  };

  return <div>
    <PageHead eyebrow={existing ? 'Owner workspace' : 'Business requirement'} title={existing ? 'Edit Opportunity' : 'Post an Opportunity'} description="Publish a structured B2B requirement with enough technical and commercial context for relevant businesses to self-qualify." actions={<Button variant="secondary" onClick={() => back('/app/opportunities/my')}>Back</Button>} />
    <div className="mb-5"><CommandExecutionFeedback error={command.error} onRetry={()=>void command.retry()} onDismiss={command.clearError}/></div>
    {existing && <div className="mb-5"><ContextBanner title="Editing an existing opportunity">Current workflow status: <EnterpriseStatus status={existing.status} />. Editing preserves the existing status and response history.</ContextBanner></div>}
    {review ? <Card className="max-w-5xl p-5 sm:p-6">
      <h2 className="text-xl font-black text-[var(--navy-950)]">Review before {existing ? 'saving' : 'publishing'}</h2>
      <p className="mt-1 text-base leading-6 text-slate-600">Check the requirement as a supplier will understand it.</p>
      <div className="mt-5"><DetailGrid items={[{label:'Requirement',value:draft.title},{label:'Type',value:draft.type},{label:'Category',value:n.categories.find(c=>c.id===draft.categoryId)?.name??'Not selected'},{label:'Location',value:draft.location},{label:'Closing date',value:draft.closingDate},{label:'Quantity / UOM',value:draft.quantity?`${draft.quantity} ${draft.uom}`:'Not specified'},{label:'Timeline',value:draft.timeline||'To be agreed'},{label:'Commercial context',value:draft.budget||'Not disclosed'},{label:'Visibility',value:draft.visibility},{label:'Description',value:draft.description}]} /></div>
      {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-base font-semibold text-red-700">{error}</div>}
      <div className="mt-5 flex flex-wrap gap-2"><Button disabled={command.busy} onClick={() => void persist(existing ? existing.status === 'draft' ? 'draft' : 'open' : 'open')}>{command.busy?'Saving…':existing ? 'Save Changes' : 'Publish Opportunity'}</Button><Button variant="secondary" onClick={()=>setReview(false)}>Edit requirement</Button>{!existing && <Button variant="ghost" disabled={command.busy} onClick={()=>void persist('draft')}>Save Draft</Button>}</div>
    </Card> : <Card className="max-w-5xl p-5 sm:p-6">
      <div className="grid gap-6">
        <section><h2 className="text-xl font-black">Requirement</h2><p className="mt-1 text-base text-slate-600">Describe what you need, not only the category name.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Input required label="Requirement title" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="e.g. Precision machined aluminium housings" /></div><label className="grid gap-1.5 text-sm font-bold">Opportunity type<select className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-base font-normal" value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value as NonNullable<Opportunity['type']>})}><option>Requirement</option><option>Offering</option><option>Collaboration</option></select></label><label className="grid gap-1.5 text-sm font-bold">Category<select className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-base font-normal" value={draft.categoryId} onChange={e=>setDraft({...draft,categoryId:e.target.value})}><option value="">Select category</option>{n.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><label className="mt-4 grid gap-1.5 text-sm font-bold">Requirement description<textarea required rows={6} className="rounded-xl border border-slate-300 p-3 text-base font-normal leading-7" value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder="Explain specifications, application, quality expectations and what a supplier needs to know to decide whether to respond." /></label></section>
        <section className="border-t border-slate-200 pt-5"><h2 className="text-xl font-black">Commercial & delivery context</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Input label="Location" value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})}/><Input required label="Closing date" type="date" value={draft.closingDate} onChange={e=>setDraft({...draft,closingDate:e.target.value})}/><Input label="Quantity / volume" value={draft.quantity} onChange={e=>setDraft({...draft,quantity:e.target.value})}/><Input label="UOM" value={draft.uom} onChange={e=>setDraft({...draft,uom:e.target.value})}/><Input label="Required timeline" value={draft.timeline} onChange={e=>setDraft({...draft,timeline:e.target.value})}/><Input label="Budget / commercial range" value={draft.budget} onChange={e=>setDraft({...draft,budget:e.target.value})}/><Input label="Specification reference" value={draft.attachmentName} onChange={e=>setDraft({...draft,attachmentName:e.target.value})}/><Input label="Response rule" value={draft.responseRule} onChange={e=>setDraft({...draft,responseRule:e.target.value})}/><label className="grid gap-1.5 text-sm font-bold">Visibility<select className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-base font-normal" value={draft.visibility} onChange={e=>setDraft({...draft,visibility:e.target.value as Opportunity['visibility']})}><option value="network">Entire network</option><option value="regional">Region</option><option value="chapter">Parivar</option></select></label></div></section>
        {formDef && <section className="rounded-2xl border border-sky-100 bg-sky-50/40 p-5"><h2 className="text-xl font-black text-sky-950">Configured requirement details</h2><p className="mt-1 text-base leading-6 text-sky-900">{formDef.name} · version {formDef.version}. These fields are governed by Platform Administration.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><ConfigurableFormFields fields={formDef.fields} values={custom} onChange={(id,value)=>setCustom(x=>({...x,[id]:value}))} visibility="member" /></div></section>}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-base font-semibold text-red-700">{error}</div>}
        <Tip>Share enough context for businesses to self-qualify, but do not expose confidential drawings, customer data or proprietary IP before an authorised sharing step.</Tip>
        <div className="flex flex-wrap items-center gap-2"><Button disabled={command.busy} onClick={()=>{if(validate())setReview(true)}}>Review {existing ? 'Changes' : '& Publish'}</Button><Button variant="secondary" disabled={command.busy} onClick={()=>persist('draft')}>{command.busy ? 'Saving…' : 'Save Draft'}</Button><Button variant="ghost" disabled={command.busy} onClick={()=>back('/app/opportunities/my')}>Cancel</Button>{dirty && <span className="text-sm font-semibold text-amber-700">Unsaved changes</span>}</div>
      </div>
    </Card>}
  </div>;
}
