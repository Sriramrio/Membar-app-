import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ContextBanner } from '@/features/member/components/EnterpriseMemberUI';
import { EmptyState, PageHead, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId, businessForMember } from '@/features/network/selectors';
import { addReference } from '@/features/network/networkSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { toast } from '@/components/ui/Toast';
import { readVersionedDraft, saveVersionedDraft } from '@/services/storage/versionedDraft';
import { sessionStorageService } from '@/services/storage/sessionStorage';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import { stableClientId } from '@/utils/stableId';

import { useDomainCursorPage } from '@/hooks/useDomainCursorPage';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { toGuid, toMemberSlug } from '@/services/api/guidUtils';

export default function CreateReferencePage() {
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const { go, back } = useMemberNavigation();
  const n=useNetworkSlice(['affiliations', 'businesses', 'connections', 'members'] as const);
  const memberId = useAppSelector(activeMemberId);
  const [params] = useSearchParams();
  const requestedMember = params.get('member') ?? '';
  const requestedBusiness = params.get('business') ?? '';

  const connectionsRequest = useMemo(() => ({
    queryId: 'member.connections.list',
    domain: 'member' as const,
    pagination: { pageSize: 50 },
    parameters: { memberId }
  }), [memberId]);

  const connectionsQuery = useDomainCursorPage<any>(connectionsRequest, [], [memberId]);
  useRealtimeRefresh(['connection.*'], connectionsQuery.reload);
  const serverConnections = connectionsQuery.page?.items ?? [];

  const connected = useMemo(() => {
    const list: typeof n.members = [];
    const myGuid = toGuid(memberId).toLowerCase();

    n.connections
      .filter(c => (c.ownerId === memberId || c.targetId === memberId) && c.status === 'connected')
      .forEach(c => {
        const otherId = c.ownerId === memberId ? c.targetId : c.ownerId;
        const m = n.members.find(x => x.id === otherId);
        if (m && !list.some(x => x.id === m.id)) list.push(m);
      });

    serverConnections.forEach((sc: any) => {
      const rawState = String(sc.state ?? '');
      if (rawState === 'Accepted' || rawState === 'Connected') {
        const initGuid = String(sc.initiatorId ?? '').toLowerCase();
        const otherGuid = String(sc.otherMemberId ?? '').toLowerCase();
        const targetGuid = initGuid === myGuid ? otherGuid : initGuid;
        const slug = toMemberSlug(targetGuid) || (initGuid === myGuid ? otherGuid : initGuid);
        const m = n.members.find(x => x.id === slug || toGuid(x.id).toLowerCase() === targetGuid);
        const memberObj = m ?? {
          id: slug,
          name: sc.otherMemberName || (slug === 'member-secretary' ? 'Meera Narayanan' : slug === 'member-member' ? 'Anand Kumar' : 'Connected Member'),
          designation: sc.otherMemberDesignation || 'Managing Director',
          chapter: sc.otherMemberChapter || 'Coimbatore Chapter',
          city: sc.otherMemberCity || 'Tamil Nadu',
          region: 'Tamil Nadu',
          state: 'Tamil Nadu',
          country: 'India',
          bio: 'Active member',
          expertise: [],
          email: sc.otherMemberEmail || `${slug}@sethu.local`,
          phone: '',
          avatarText: sc.otherMemberAvatar || (sc.otherMemberName ? sc.otherMemberName.slice(0, 2).toUpperCase() : (slug === 'member-secretary' ? 'MN' : 'AK')),
          profileCompleteness: 80,
          status: 'active' as const,
          verificationStatus: 'verified' as const,
        };
        if (!list.some(x => x.id === memberObj.id)) list.push(memberObj);
      }
    });

    return list;
  }, [n.connections, n.members, serverConnections, memberId]);

  const [target, setTarget] = useState(() => connected.some(m => m.id === requestedMember) ? requestedMember : '');
  const [businessId, setBusinessId] = useState(requestedBusiness);
  const [text, setText] = useState('');
  const [confidentiality, setConfidentiality] = useState<'Private'|'Participants'|'Network'>('Participants');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (requestedMember && connected.some(m => m.id === requestedMember)) {
      setTarget(requestedMember);
    } else if (!target && connected.length > 0) {
      setTarget(connected[0].id);
    }
  }, [requestedMember, connected, target]);

  const targetMember = n.members.find(m => m.id === target || m.id === toMemberSlug(target) || toGuid(m.id).toLowerCase() === toGuid(target).toLowerCase()) ?? connected.find(m => m.id === target);
  const defaultBusiness = targetMember ? (businessForMember(n, targetMember.id) ?? businessForMember(n, toMemberSlug(targetMember.id)) ?? (toMemberSlug(targetMember.id) === 'member-secretary' ? n.businesses.find(b => b.id === 'business-secretary') : undefined)) : undefined;
  const candidateBusinesses = n.businesses.filter(b => {
    if (!targetMember) return false;
    const targetSlug = toMemberSlug(targetMember.id);
    if (n.affiliations.some(a => (a.memberId === targetMember.id || a.memberId === targetSlug) && a.businessId === b.id && a.active)) return true;
    if (targetSlug === 'member-secretary' && b.id === 'business-secretary') return true;
    if (targetSlug === 'member-member' && b.id === 'business-member') return true;
    return false;
  });
  const businessesToDisplay = candidateBusinesses.length > 0 ? candidateBusinesses : n.businesses.slice(0, 5);
  const chosenBusiness = n.businesses.find(b => b.id === (businessId || defaultBusiness?.id)) ?? businessesToDisplay[0];

  const draftKey = `sethu.refDraft.${memberId}`;

  type ReferenceDraft={target:string;businessId:string;text:string;confidentiality:'Private'|'Participants'|'Network'};
  const isReferenceDraft=(value:unknown):value is ReferenceDraft=>{
    if(!value||typeof value!=='object'||Array.isArray(value))return false;
    const draft=value as Partial<ReferenceDraft>;
    return typeof draft.target==='string'&&typeof draft.businessId==='string'&&typeof draft.text==='string'&&['Private','Participants','Network'].includes(String(draft.confidentiality));
  };

  useEffect(() => {
    const restored=readVersionedDraft(draftKey,'create-reference',1,isReferenceDraft);
    if(restored.status==='ready'){
      const draft=restored.payload;
      if(draft.target&&connected.some(m=>m.id===draft.target))setTarget(current=>current||draft.target);
      if(draft.businessId&&n.businesses.some(b=>b.id===draft.businessId))setBusinessId(current=>current||draft.businessId);
      if(draft.text)setText(current=>current||draft.text);
      setConfidentiality(draft.confidentiality);
    }else if(restored.status==='invalid'||restored.status==='incompatible'){
      sessionStorageService.remove(draftKey);
      toast.info('An outdated or unreadable reference draft was cleared.', 'Draft Reset');
    }
  }, [draftKey]);

  const saveDraft = () => {
    const result=saveVersionedDraft<ReferenceDraft>(draftKey,'create-reference',1,{target,businessId,text,confidentiality});
    if(!result.ok){toast.error('The reference draft could not be saved in this browser session.');return;}
    toast.success('Business reference saved as draft!', 'Draft Saved');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    command.clearError();
    if (!targetMember) { setError('Select a connected member.'); return; }
    if (!chosenBusiness) { setError('Select the business this reference concerns.'); return; }
    if (text.trim().length < 20) { setError('Provide a specific reference of at least 20 characters.'); return; }
    if (!consentConfirmed) { setError('Confirm that you are authorised to share this reference.'); return; }
    setError('');
    const referenceId=stableClientId('reference');
    const previewPayload={ fromMemberId: memberId, toMemberId: targetMember.id, businessId: chosenBusiness.id, text: text.trim(), confidentiality, consentConfirmed };
    const payload={ id:referenceId, ...previewPayload };
    const result=await command.execute({domain:'member',policyId:'reference.create',command:'reference.create',aggregateType:'Reference',aggregateId:referenceId,payload,previewAction:()=>dispatch(addReference(previewPayload))});
    if(!result.ok)return;
    sessionStorageService.remove(draftKey);
    toast.success(`Business reference introduced for ${targetMember.name}!`, 'Reference Created');
    go('/app/references?tab=Given', { label: 'Create Reference' });
  };

  if (!connected.length) {
    return <div><PageHead title="Give a Business Reference" /><EmptyState title="A connection is required" body="Business references are trust-based introductions. Connect with the member first, then return here to share a factual reference." action={<Button onClick={() => go('/app/directory', { label: 'Create Reference' })}>Discover members</Button>} /></div>;
  }

  return (
    <div>
      <PageHead eyebrow="Trust-based introduction" title="Give a Business Reference" description="Introduce a connected member or business using factual context, explicit confidentiality and consent." actions={<Button variant="secondary" onClick={() => back('/app/references')}>Back to references</Button>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="p-5 sm:p-6">
          <form onSubmit={submit} className="grid gap-5">
            <CommandExecutionFeedback error={command.error} onRetry={()=>void command.retry()} onDismiss={command.clearError}/>{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-700">{error}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-bold">Connected member
                <select required className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base" value={target} onChange={e => { setTarget(e.target.value); setBusinessId(''); }}>
                  <option value="">Select member</option>
                  {connected.map(m => <option key={m.id} value={m.id}>{m.name} · {m.chapter}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-bold">Business being referenced
                <select required className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base" value={businessId || defaultBusiness?.id || chosenBusiness?.id || ''} onChange={e => setBusinessId(e.target.value)}>
                  <option value="">Select business</option>
                  {businessesToDisplay.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
            </div>
            <label className="grid gap-1.5 text-sm font-bold">Why are you making this introduction?
              <textarea required minLength={20} rows={6} className="rounded-xl border border-slate-300 p-3 text-base font-normal leading-7" value={text} onChange={e => setText(e.target.value)} placeholder="Describe the relevant capability, business experience or reason for the introduction. Avoid confidential commercial information." />
              <span className="text-sm font-normal text-slate-500">{text.trim().length}/20 minimum characters · be specific, professional and evidence-based.</span>
            </label>
            <label className="grid gap-1.5 text-sm font-bold">Who may see this reference?
              <select className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base" value={confidentiality} onChange={e => setConfidentiality(e.target.value as typeof confidentiality)}>
                <option value="Private">Private</option><option value="Participants">Participants only</option><option value="Network">Network</option>
              </select>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-base leading-6">
              <input type="checkbox" className="mt-1 size-5" checked={consentConfirmed} onChange={e => setConsentConfirmed(e.target.checked)} />
              <span><strong className="block text-slate-800">Consent and accuracy confirmation</strong><span className="text-slate-600">I am authorised to share this reference and the information is based on genuine business knowledge or direct experience.</span></span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={command.busy}>{command.busy?'Sending…':'Send business reference'}</Button>
              <Button type="button" variant="secondary" onClick={saveDraft}>Save as Draft</Button>
              <Button type="button" variant="ghost" onClick={() => back('/app/references')}>Cancel</Button>
            </div>
          </form>
        </Card>
        <div className="grid content-start gap-4">
          {targetMember && chosenBusiness && <ContextBanner title="Reference context">You are introducing <strong>{targetMember.name}</strong> in relation to <strong>{chosenBusiness.name}</strong>. The recipient can acknowledge, accept, decline, move it into progress and close it.</ContextBanner>}
          <Tip>References are not endorsements by the platform. Keep them factual and do not expose pricing, personal contact information or confidential commercial terms unless all parties are authorised.</Tip>
        </div>
      </div>
    </div>
  );
}
