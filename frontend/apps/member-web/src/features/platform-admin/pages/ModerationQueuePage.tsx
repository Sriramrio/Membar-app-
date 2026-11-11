import { useState } from 'react';
import { useAppDispatch,useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { PageHead,StatusPill } from '@/features/network/components/NetworkUI';
import { claimModerationCase,decideModerationCase,selectModerationCases } from '@/features/platform-runtime/moderationRuntime';
import { canModeratePlatform } from '@/features/platform-admin/access-control/platformAccess';
import { resourceTarget } from '@/navigation/entityTargets';
import { useAppNavigation } from '@/navigation/useAppNavigation';

export default function ModerationQueuePage(){
 const {go}=useAppNavigation();const dispatch=useAppDispatch();const cases=useAppSelector(selectModerationCases);const account=useAppSelector(s=>s.auth.account);const actor=account?.name??'Platform reviewer';const canModerate=canModeratePlatform(account?.role);
 const [pending,setPending]=useState<{id:string;resolution:'Verified'|'Rejected'|'Remediated'|'No Action';title:string}|null>(null);
 return <div><PageHead title="Moderation Queue" description="Reported or system-flagged network records are assigned, investigated and closed with explicit, auditable resolution."/>
  <div className="grid gap-4">{cases.length?cases.map(c=><Card key={c.id}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-black">{c.resource} · {c.recordId}</h2>{resourceTarget(c.resource,c.recordId)&&<button type="button" className="mt-1 text-sm font-bold text-sky-700 hover:underline" onClick={()=>go(resourceTarget(c.resource,c.recordId)!,{label:'Moderation source record'})}>Open governed record</button>}<p className="mt-1 text-sm text-slate-600">{c.reason}</p><p className="mt-1 text-sm text-slate-500">Reporter: {c.reporter} · Owner: {c.owner??'Unassigned'}{c.resolution?` · Resolution: ${c.resolution}`:''}</p>{c.resolutionNote&&<p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm">{c.resolutionNote}</p>}</div><StatusPill tone={c.status==='Actioned'?'good':c.status==='Open'?'warn':c.status==='Dismissed'?'neutral':'info'}>{c.status}</StatusPill></div>{canModerate&&!['Actioned','Dismissed'].includes(c.status)&&<div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={()=>dispatch(claimModerationCase({id:c.id,actor}))}>Claim</Button>{c.resource==='Certification'?<><Button onClick={()=>setPending({id:c.id,resolution:'Verified',title:`Verify certification ${c.recordId}`})}>Verify evidence</Button><Button variant="danger" onClick={()=>setPending({id:c.id,resolution:'Rejected',title:`Reject certification ${c.recordId}`})}>Reject evidence</Button></>:<Button onClick={()=>setPending({id:c.id,resolution:'Remediated',title:`Resolve ${c.resource} case`})}>Resolve</Button>}<Button variant="secondary" onClick={()=>setPending({id:c.id,resolution:'No Action',title:`Dismiss ${c.resource} case`})}>Dismiss</Button></div>}</Card>):<Card><p className="text-sm text-slate-600">No moderation cases require review.</p></Card>}</div>
  <ActionDialog open={Boolean(pending)} title={pending?.title??'Moderation decision'} description="Record the reviewer rationale. The decision is audited and may update the governed domain record." inputLabel="Resolution note" requireValue confirmLabel={pending?.resolution==='Rejected'?'Reject':pending?.resolution==='No Action'?'Dismiss':'Confirm'} confirmVariant={pending?.resolution==='Rejected'?'danger':'default'} onClose={()=>setPending(null)} onConfirm={note=>{if(pending&&canModerate)dispatch(decideModerationCase({id:pending.id,actor,resolution:pending.resolution,note}))}}/>
 </div>;
}
