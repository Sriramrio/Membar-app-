import { stableClientId } from '@/utils/stableId';
import { useEffect, useState } from 'react';
import { CalendarDays, MessageSquare, StickyNote } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/common/Input';
import { ContextBanner, DetailGrid, EnterpriseStatus } from '@/features/member/components/EnterpriseMemberUI';
import { EmptyState, PageHead, Section, Tip } from '@/features/network/components/NetworkUI';
import { activeMemberId, directConversationBetween, opportunityVisibleToMember, savedOpportunities } from '@/features/network/selectors';
import { addInteractionNote,addNotification, answerOpportunityQuestion, askOpportunityQuestion, awardResponse, toggleSavedOpportunity, updateOpportunityStatus, updateResponseStatus } from '@/features/network/networkSlice';
import { useMemberNavigation } from '@/features/member/navigation/useMemberNavigation';
import { converseThreadPath } from '@/features/member/navigation/converseRoute';
import type { Opportunity, OpportunityResponse } from '@/features/network/types';
import { canTransitionResponse } from '@/features/network/stateMachines';
import { useGovernedCommand } from '@/hooks/useGovernedCommand';
import { useConnectionCommands } from '@/hooks/useConnectionCommands';
import { CommandExecutionFeedback } from '@/components/commands/CommandExecutionFeedback';
import type { OpportunityQuestion } from '@/features/network/types';
import { apiClient } from '@/services/api/apiClient';

function fmt(value: string) { return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const connectionCommands = useConnectionCommands();
  const noteCommand=useGovernedCommand();
  const { go, back } = useMemberNavigation();
  const memberId = useAppSelector(activeMemberId);
  const n=useNetworkSlice(['businesses', 'categories', 'certificationRecords', 'conversations', 'interactionNotes', 'members', 'opportunities', 'opportunityQuestions', 'responses', 'savedOpportunityIdsByMember'] as const);
  const opportunity = n.opportunities.find(o => o.id === id);
  const [serverOpportunity, setServerOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(!opportunity);
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [noteOpen,setNoteOpen]=useState(false);

  useEffect(() => {
    if (opportunity || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiClient.get<any>(`/opportunities/${id}`)
      .then(res => {
        if (res) {
          const item: Opportunity = {
            id: String(res.id),
            ownerMemberId: String(res.ownerMemberId),
            businessId: String(res.businessId),
            title: res.title,
            description: res.description ?? `Business requirement: ${res.title}. Available within the verified network.`,
            categoryId: res.categoryId ?? 'cat-services',
            location: res.chapterName ?? 'Tamil Nadu, India',
            closingDate: res.closingDate ?? new Date(Date.now() + 30 * 86400000).toISOString(),
            status: (res.status?.toLowerCase() === 'open' ? 'open' : res.status?.toLowerCase() === 'draft' ? 'draft' : 'closed') as Opportunity['status'],
            createdAt: res.createdAt ?? new Date().toISOString(),
            visibility: 'network',
          };
          setServerOpportunity(item);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, opportunity]);

  const activeOpp = opportunity ?? serverOpportunity;

  if (loading && !activeOpp) {
    return (
      <div className="p-6">
        <PageHead title="Loading Opportunity..." />
        <Card className="p-8 text-center text-slate-500">Loading requirement details...</Card>
      </div>
    );
  }

  if (!activeOpp || (opportunity && !opportunityVisibleToMember({ network: n }, activeOpp, memberId))) {
    return <div><PageHead title="Opportunity" /><EmptyState title="Opportunity unavailable" body="This opportunity does not exist or is outside your current network scope." action={<Button variant="secondary" onClick={() => back('/app/opportunities')}>Return to marketplace</Button>} /></div>;
  }

  const business = n.businesses.find(b => b.id === activeOpp.businessId);
  const owner = n.members.find(m => m.id === activeOpp.ownerMemberId);
  const response = n.responses.find(r => r.opportunityId === activeOpp.id && r.memberId === memberId);
  const ownerView = activeOpp.ownerMemberId === memberId;
  const responses = n.responses.filter(r => r.opportunityId === activeOpp.id && r.status !== 'draft');
  const questions = n.opportunityQuestions.filter(q => q.opportunityId === activeOpp.id);
  const saved = savedOpportunities(n, memberId).includes(activeOpp.id);
  const closed = activeOpp.status !== 'open';

  const updateResponse = async (r:OpportunityResponse,status:OpportunityResponse['status']) =>
    command.execute({domain:'member',policyId:'opportunity.response.status',command:'opportunity.response.status',aggregateType:'OpportunityResponse',aggregateId:r.id,expectedVersion:r.version,payload:{responseId:r.id,status},previewAction:()=>dispatch(updateResponseStatus({responseId:r.id,actorMemberId:memberId,status}))});

  const discuss = async (r: OpportunityResponse) => {
    const statusResult=await updateResponse(r,'discussion');
    if(!statusResult.ok)return;
    const existing = directConversationBetween(n, memberId, r.memberId);
    if (existing) return go(converseThreadPath(existing.id, `opportunity:${opportunity.id}`), { label: opportunity.title });
    const conversation=await connectionCommands.createDirectConversation(r.memberId,`opportunity:${opportunity.id}`,opportunity.title);
    if(conversation.ok)go(converseThreadPath(conversation.conversationId, `opportunity:${opportunity.id}`), { label: opportunity.title });
  };

  const messageOwner = async () => {
    if (!owner || owner.id === memberId) return;
    const existing = directConversationBetween(n, memberId, owner.id);
    if (existing) return go(converseThreadPath(existing.id, `opportunity:${opportunity.id}`), { label: opportunity.title });
    const conversation=await connectionCommands.createDirectConversation(owner.id,`opportunity:${opportunity.id}`,opportunity.title);
    if(conversation.ok)go(converseThreadPath(conversation.conversationId, `opportunity:${opportunity.id}`), { label: opportunity.title });
  };

  const selectSupplier = async (r: OpportunityResponse) => {
    await command.execute({domain:'member',policyId:'opportunity.award',command:'opportunity.award',aggregateType:'Opportunity',aggregateId:opportunity.id,expectedVersion:opportunity.version,payload:{opportunityId:opportunity.id,responseId:r.id},previewAction:()=>{dispatch(awardResponse({opportunityId:opportunity.id,responseId:r.id,ownerMemberId:memberId}));responses.forEach(item=>dispatch(addNotification({memberId:item.memberId,text:item.id===r.id?`Your response was selected for ${opportunity.title}`:`Supplier selection completed for ${opportunity.title}`,href:item.id===r.id?`/app/transactions?opportunity=${opportunity.id}`:`/app/opportunities/${opportunity.id}`})))}});
  };

  const changeOpportunityStatus=(status:'open'|'closed')=>command.execute({domain:'member',policyId:'opportunity.status.update',command:'opportunity.status.update',aggregateType:'Opportunity',aggregateId:opportunity.id,expectedVersion:opportunity.version,payload:{opportunityId:opportunity.id,status},previewAction:()=>dispatch(updateOpportunityStatus({opportunityId:opportunity.id,ownerMemberId:memberId,status}))});

  const ask = async () => {
    if (question.trim().length < 5) return;
    const questionId=stableClientId('opq');
    const previewPayload={opportunityId:opportunity.id,askedBy:memberId,question:question.trim()};
    const result=await command.execute({domain:'member',policyId:'opportunity.question.ask',command:'opportunity.question.ask',aggregateType:'OpportunityQuestion',aggregateId:questionId,payload:{id:questionId,...previewPayload},previewAction:()=>dispatch(askOpportunityQuestion(previewPayload))});
    if(result.ok)setQuestion('');
  };
  const answer=async(q:OpportunityQuestion,value:string)=>{const answer=value.trim();if(!answer)return;const result=await command.execute({domain:'member',policyId:'opportunity.question.answer',command:'opportunity.question.answer',aggregateType:'OpportunityQuestion',aggregateId:q.id,expectedVersion:q.version,payload:{questionId:q.id,answer},previewAction:()=>dispatch(answerOpportunityQuestion({id:q.id,answeredBy:memberId,answer}))});if(result.ok)setAnswers(current=>({...current,[q.id]:''}))};

  return (
    <div>
      <PageHead
        eyebrow={ownerView ? 'My published opportunity' : 'Business opportunity'}
        title={opportunity.title}
        description={ownerView ? 'Manage the requirement, clarifications, supplier responses and commercial outcome from one workspace.' : 'Understand the requirement, buyer context and response status before choosing the next action.'}
        actions={<><Button variant="secondary" onClick={() => back(ownerView ? '/app/opportunities/my' : '/app/opportunities')}>Back</Button>{!ownerView && <Button variant="secondary" onClick={() => dispatch(toggleSavedOpportunity({ memberId, opportunityId: opportunity.id }))}>{saved ? 'Remove saved' : 'Save opportunity'}</Button>}</>}
      />
      <CommandExecutionFeedback error={command.error??connectionCommands.error??noteCommand.error} onRetry={()=>void (command.error?command.retry():connectionCommands.error?connectionCommands.retry():noteCommand.retry())} onDismiss={()=>{command.clearError();connectionCommands.clearError();noteCommand.clearError()}}/>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2"><EnterpriseStatus status={opportunity.status} tone={opportunity.status === 'open' ? 'success' : opportunity.status === 'rejected' || opportunity.status === 'expired' ? 'danger' : 'neutral'} />{opportunity.type && <EnterpriseStatus status={opportunity.type} tone="info" />}</div>
            <button type="button" onClick={() => business && go(`/app/businesses/${business.id}`, { label: opportunity.title })} className="mt-4 text-lg font-black text-sky-800 hover:underline">{business?.name ?? 'Network business'}</button>
            <p className="mt-4 max-w-4xl text-base leading-7 text-slate-700">{opportunity.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!ownerView && !response && opportunity.status === 'open' && <Button onClick={() => go(`/app/opportunities/${opportunity.id}/respond`, { label: opportunity.title })}>Respond to Opportunity</Button>}
            {!ownerView && response && <Button onClick={() => go('/app/responses/my', { label: opportunity.title })}>View My Response</Button>}
            {!ownerView && owner && <Button variant="secondary" disabled={command.busy||connectionCommands.busy} onClick={()=>void messageOwner()}><MessageSquare className="size-4" />Converse with buyer</Button>}
            {!ownerView && owner && <Button variant="secondary" onClick={() => go(`/app/one-to-one?member=${owner.id}&business=${opportunity.businessId}&opportunity=${opportunity.id}`, { label: opportunity.title })}><CalendarDays className="size-4" />Schedule meeting</Button>}
            {!ownerView&&owner&&<Button variant="secondary" onClick={()=>setNoteOpen(true)}><StickyNote className="size-4"/>Add opportunity note</Button>}
            {ownerView && opportunity.status === 'draft' && <Button disabled={command.busy} onClick={()=>void changeOpportunityStatus('open')}>Publish draft</Button>}
            {ownerView && opportunity.status === 'open' && <Button variant="secondary" disabled={command.busy} onClick={()=>void changeOpportunityStatus('closed')}>Close opportunity</Button>}
          </div>
        </div>

        <div className="mt-6"><DetailGrid items={[
          { label: 'Category', value: n.categories.find(c => c.id === opportunity.categoryId)?.name ?? 'Not categorised' },
          { label: 'Location', value: opportunity.location },
          { label: 'Closing date', value: fmt(opportunity.closingDate) },
          { label: 'Quantity / UOM', value: opportunity.quantity ? `${opportunity.quantity} ${opportunity.uom ?? ''}` : 'Discuss with buyer' },
          { label: 'Timeline', value: opportunity.timeline || 'To be agreed' },
          { label: 'Commercial context', value: opportunity.budget || 'Not disclosed' },
        ]} /></div>

        {opportunity.attachmentName && <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-base"><strong>Specification / attachment reference:</strong> {opportunity.attachmentName}</div>}
        {opportunity.customResponses && Object.keys(opportunity.customResponses).length > 0 && <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/50 p-5"><h3 className="text-lg font-black text-sky-950">Configured requirement details {opportunity.formVersion ? `· ${opportunity.formVersion}` : ''}</h3><div className="mt-4"><DetailGrid items={Object.entries(opportunity.customResponses).map(([key,value]) => ({ label: key, value: Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value) }))} /></div></div>}
      </Card>

      {response && !ownerView && <div className="mt-5"><ContextBanner title="Your response is in this opportunity workflow" action={<Button variant="secondary" onClick={() => go('/app/responses/my', { label: opportunity.title })}>Track response</Button>}>Current status: <strong>{response.status}</strong>. Continue conversations and meetings from this opportunity so the business context stays connected.</ContextBanner></div>}
      {closed && !ownerView && !response && <div className="mt-5"><ContextBanner title="This opportunity is no longer accepting responses">The requirement is currently <strong>{opportunity.status}</strong>. You can still review the business and any permitted public clarification history.</ContextBanner></div>}
      {!ownerView&&owner&&n.interactionNotes.filter(note=>note.authorMemberId===memberId&&note.targetMemberId===owner.id&&note.contextType==='Opportunity'&&note.contextId===opportunity.id).length>0&&<Card className="mt-5 p-4"><h3 className="font-black">My opportunity notes</h3><div className="mt-3 grid gap-2">{n.interactionNotes.filter(note=>note.authorMemberId===memberId&&note.targetMemberId===owner.id&&note.contextType==='Opportunity'&&note.contextId===opportunity.id).map(note=><div key={note.id} className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950">{note.text}</div>)}</div></Card>}

      <div className="mt-8 grid gap-8">
        <Section title={`Questions & Clarifications (${questions.length})`} subtitle="Use non-confidential questions to clarify the requirement before sharing sensitive information.">
          <div className="grid gap-4">
            {questions.map(q => { const asker = n.members.find(m => m.id === q.askedBy); return <Card key={q.id} className="p-5"><div className="text-base font-black text-[var(--navy-950)]">{asker?.name ?? 'Member'} asked</div><p className="mt-2 text-base leading-7 text-slate-700">{q.question}</p>{q.answer ? <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-base leading-7 text-emerald-900"><strong>Buyer answer:</strong> {q.answer}</div> : ownerView ? <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Input label="Answer" value={answers[q.id] ?? ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} /></div><Button disabled={command.busy} onClick={() => void answer(q,answers[q.id]??'')}>Answer</Button></div> : <EnterpriseStatus status="Awaiting answer" tone="warning" />}</Card>; })}
            {!ownerView && opportunity.status === 'open' && <Card className="p-5"><label className="grid gap-1.5 text-sm font-bold">Ask a non-confidential clarification<textarea rows={3} className="rounded-xl border border-slate-300 p-3 text-base font-normal leading-7" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask only what is needed to decide whether your business can respond." /></label><Button className="mt-3" variant="secondary" onClick={()=>void ask()} disabled={question.trim().length < 5||command.busy}>Ask question</Button></Card>}
            {!questions.length && ownerView && <EmptyState title="No questions yet" body="Supplier clarification questions will appear here." />}
          </div>
        </Section>

        {ownerView && <Section title={`Supplier Responses (${responses.length})`} subtitle="Compare capability, solution, lead time and verified evidence before deciding the next commercial step.">
          <div className="grid gap-4">{responses.map(r => { const respondent = n.members.find(m => m.id === r.memberId); const supplier = n.businesses.find(b => b.id === r.businessId); const attachedCerts = n.certificationRecords.filter(c => r.certificationIds?.includes(c.id)); return <Card key={r.id} className="p-5"><div className="flex flex-col gap-5 xl:flex-row xl:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><button type="button" className="text-lg font-black text-sky-800 hover:underline" onClick={() => supplier && go(`/app/businesses/${supplier.id}`, { label: opportunity.title })}>{supplier?.name ?? respondent?.name}</button><p className="mt-1 text-sm text-slate-500">Submitted {fmt(r.createdAt)}</p></div><EnterpriseStatus status={r.status} tone={r.status === 'won' || r.status === 'accepted' ? 'success' : r.status === 'not-selected' || r.status === 'declined' ? 'danger' : 'info'} /></div><div className="mt-4"><DetailGrid items={[{ label: 'Capability statement', value: r.summary }, { label: 'Proposed solution', value: r.solution || 'Not provided' }, { label: 'Capacity', value: r.capacity || 'Not provided' }, { label: 'Lead time', value: r.leadTime }, { label: 'Commercial note', value: r.commercialNote || 'Not provided' }, { label: 'Verified certifications', value: attachedCerts.length ? attachedCerts.map(c => c.standard).join(', ') : 'None attached' }]} /></div>{r.supportingNote && <p className="mt-4 rounded-xl bg-slate-50 p-4 text-base leading-6 text-slate-700">{r.supportingNote}</p>}</div>{opportunity.status === 'open' && <div className="flex flex-wrap gap-2 xl:max-w-[320px] xl:justify-end">{canTransitionResponse(r.status,'shortlisted')&&r.status!=='shortlisted'&&<Button variant="secondary" disabled={command.busy} onClick={()=>void updateResponse(r,'shortlisted')}>Shortlist</Button>}{canTransitionResponse(r.status,'discussion')&&r.status!=='discussion'&&<Button variant="secondary" disabled={command.busy||connectionCommands.busy} onClick={() => void discuss(r)}>Discuss</Button>}{canTransitionResponse(r.status,'won')&&<Button disabled={command.busy} onClick={() => void selectSupplier(r)}>Select supplier</Button>}</div>}</div></Card>; })}{!responses.length && <EmptyState title="No responses yet" body="Responses from eligible suppliers will appear here as they are submitted." />}</div>
        </Section>}
      </div>
      <div className="mt-7"><Tip>Supplier selection should be based on your organisation’s commercial and technical process. SETHU preserves network context and workflow state; it does not make the procurement decision for you.</Tip></div>
      {!ownerView&&owner&&<ActionDialog open={noteOpen} title={`Add opportunity note · ${owner.name}`} description="This private note remains separate from Converse and stays linked to this opportunity." inputLabel="Opportunity note" requireValue confirmLabel="Save note" onClose={()=>setNoteOpen(false)} onConfirm={async text=>{const payload={authorMemberId:memberId,targetMemberId:owner.id,businessId:opportunity.businessId,contextType:'Opportunity' as const,contextId:opportunity.id,noteType:'Opportunity' as const,text,visibility:'Private' as const};const result=await noteCommand.execute({domain:'member',policyId:'member.interaction-note.create',command:'member.interaction-note.create',aggregateType:'MemberInteractionNote',aggregateId:`note-${opportunity.id}-${memberId}`,payload,previewAction:()=>dispatch(addInteractionNote(payload))});return result.ok;}}/>}
    </div>
  );
}
