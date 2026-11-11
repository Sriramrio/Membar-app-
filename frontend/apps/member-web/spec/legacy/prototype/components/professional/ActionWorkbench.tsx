import { useEffect,useMemo,useState,type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, FileText, FlaskConical, History, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import type { ScreenDefinition } from '@/types/screen';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useAppDispatch,useAppSelector } from '@/app/hooks';
import { addAudit,addRecord,patchRecord,saveDraft,setFeedback } from '../../prototypeSlice';
import { cleaned,fieldLabel,recordId,statusForAction } from './screenUtils';

function uid(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(16).slice(2)}`}
function inputKind(label:string){const x=label.toLowerCase();if(/date|expiry|deadline|starts|ends|follow-up/.test(x))return 'date';if(/email/.test(x))return 'email';if(/mobile|phone/.test(x))return 'tel';if(/amount|quantity|count|capacity|fee|value/.test(x))return 'number';return 'text'}

type OutcomeMode='success'|'validation'|'denied'|'conflict'|'unknown'|'partial'|'dependency';
const outcomeHelp:Record<OutcomeMode,string>={
  success:'Authoritative service accepts the action and returns the resulting record version.',
  validation:'Business/input validation fails; safe input remains editable and no business mutation occurs.',
  denied:'Active role, scope, field or delegation check fails immediately before mutation.',
  conflict:'The record version changed in another session; user must reload, compare or deliberately merge.',
  unknown:'A dependency timed out after submission. The business outcome stays Pending verification until reconciliation.',
  partial:'Only part of a multi-item operation succeeds; item-level outcomes remain explicit and only failed/unprocessed items are retried.',
  dependency:'A downstream service fails before an authoritative business outcome is known; correlation reference and safe retry rules are shown.',
};

export function ActionWorkbench({screen,action,row,open,onOpenChange,onComplete}:{screen:ScreenDefinition;action:string|null;row:Record<string,unknown>|null;open:boolean;onOpenChange:(open:boolean)=>void;onComplete?:(message:string)=>void;}){
  const dispatch=useAppDispatch();
  const account=useAppSelector(s=>s.auth.account);
  const actor=account?.name??'Public user';
  const [reason,setReason]=useState('');
  const [confirm,setConfirm]=useState(false);
  const [busy,setBusy]=useState(false);
  const [fieldValues,setFieldValues]=useState<Record<string,string>>({});
  const [outcomeMode,setOutcomeMode]=useState<OutcomeMode>('success');
  const [inlineResult,setInlineResult]=useState<{tone:'success'|'warning'|'danger'|'info';title:string;body:string}|null>(null);
  const [idempotencyKey,setIdempotencyKey]=useState(()=>`IDEMP-${uid().slice(0,10).toUpperCase()}`);
  const fields=useMemo(()=>cleaned(screen.requiredData).filter(x=>!/^kpis?:/i.test(x)).slice(0,8),[screen.requiredData]);
  const destructive=Boolean(action&&/delete|reject|withdraw|block|suspend|reverse|cancel|revoke/i.test(action));
  const controlled=screen.workspace==='Management'||screen.workspace==='Governance'||screen.workspace==='Platform Admin';
  const targetId=recordId(row)||`${String(screen.id).padStart(2,'0')}-NEW`;

  useEffect(()=>{if(open){setInlineResult(null);setOutcomeMode('success');setIdempotencyKey(`IDEMP-${uid().slice(0,10).toUpperCase()}`)}},[open,action]);
  if(!action)return null;
  const actionName=action;

  function draft(){
    dispatch(saveDraft({screenId:screen.id,key:targetId,values:{...fieldValues,reason},savedAt:new Date().toISOString()}));
    const correlationId=`COR-${uid().slice(0,8).toUpperCase()}`;
    dispatch(addAudit({id:uid(),occurredAt:new Date().toISOString(),recordedAt:new Date().toISOString(),action:'SAVE_DRAFT',resource:screen.route,recordId:targetId,result:'Succeeded',actor,activeAssignment:account?.role,unit:account?.unit,workspace:screen.workspace,reason:'Prototype draft save',policyVersion:'DEMO-POL-v14',idempotencyKey,correlationId}));
    const message=`Draft saved for ${targetId}. No authoritative business state was changed. Audit reference ${correlationId}.`;
    dispatch(setFeedback({screenId:screen.id,action:'SAVE_DRAFT',recordId:targetId,message,at:new Date().toISOString()}));
    onComplete?.(message);onOpenChange(false);
  }

  function failureResult(mode:Exclude<OutcomeMode,'success'>,correlationId:string){
    if(mode==='validation')return {tone:'warning' as const,title:'Validation needs attention',body:`The action was not submitted. Safe input is retained. Fix the highlighted business rule and retry with the same operation context. Reference ${correlationId}.`};
    if(mode==='denied')return {tone:'danger' as const,title:'Permission changed before submit',body:`No mutation occurred. The active role/scope/delegation no longer permits this action. Refresh the workspace context or request authorised help. Reference ${correlationId}.`};
    if(mode==='conflict')return {tone:'warning' as const,title:'Concurrent update detected',body:`No silent overwrite occurred. Reload the latest safe state, compare changes and choose reload, deliberate merge or cancel. Reference ${correlationId}.`};
    if(mode==='unknown')return {tone:'info' as const,title:'Outcome pending verification',body:`The dependency did not return an authoritative result. The operation remains Pending verification; do not repeat it with a new idempotency key. Reconcile using ${correlationId}.`};
    if(mode==='partial')return {tone:'warning' as const,title:'Partially succeeded',body:`Some items succeeded and some remain unprocessed. The prototype records this as partial/pending and retries only failed or unposted items. Reference ${correlationId}.`};
    return {tone:'danger' as const,title:'Dependency unavailable',body:`The downstream dependency failed. Safe input is retained, no final business result is claimed and retry uses the same idempotency key where safe. Reference ${correlationId}.`};
  }

  function submit(event:FormEvent){
    event.preventDefault();
    if((destructive||controlled)&&!confirm)return;
    setBusy(true);
    const correlationId=`COR-${uid().slice(0,8).toUpperCase()}`;
    if(outcomeMode!=='success'){
      const result=failureResult(outcomeMode,correlationId);
      const auditResult=outcomeMode==='unknown'||outcomeMode==='partial'?'Pending':outcomeMode==='denied'?'Denied':'Failed';
      dispatch(addAudit({id:uid(),occurredAt:new Date().toISOString(),recordedAt:new Date().toISOString(),action:actionName.toUpperCase().replace(/\W+/g,'_'),resource:screen.route,recordId:targetId,result:auditResult,actor,activeAssignment:account?.role,unit:account?.unit,workspace:screen.workspace,reason:reason||outcomeHelp[outcomeMode],workflowVersion:'DEMO-WF-v7',policyVersion:'DEMO-POL-v14',idempotencyKey,correlationId}));
      setInlineResult(result);
      dispatch(setFeedback({screenId:screen.id,action:actionName,recordId:targetId,message:result.body,at:new Date().toISOString()}));
      window.setTimeout(()=>setBusy(false),180);
      return;
    }

    const nextStatus=statusForAction(actionName)??(/create|new|register|invite|add/i.test(actionName)?'Draft':undefined);
    let affectedId=targetId;
    if(row&&nextStatus){
      dispatch(patchRecord({screenId:screen.id,recordId:targetId,changes:{status:nextStatus,updated:'Just now'}}));
    }else if(!row&&/create|new|register|invite|add|schedule|submit|publish/i.test(actionName)){
      affectedId=`${String(screen.id).padStart(2,'0')}-${Math.floor(1000+Math.random()*8999)}`;
      const record:Record<string,unknown>={id:affectedId,title:`${screen.title} · prototype record`,status:nextStatus??'Submitted',owner:actor,unit:account?.unit??screen.workspace,updated:'Just now'};
      fields.slice(0,5).forEach((field,index)=>{if(fieldValues[`f${index}`])record[fieldLabel(field)]=fieldValues[`f${index}`]});
      dispatch(addRecord({screenId:screen.id,record}));
    }
    dispatch(addAudit({id:uid(),occurredAt:new Date().toISOString(),recordedAt:new Date().toISOString(),action:actionName.toUpperCase().replace(/\W+/g,'_'),resource:screen.route,recordId:affectedId,result:'Succeeded',actor,activeAssignment:account?.role,unit:account?.unit,workspace:screen.workspace,reason:reason||'Prototype controlled action',workflowVersion:'DEMO-WF-v7',policyVersion:'DEMO-POL-v14',safeDiff:nextStatus?`status → ${nextStatus}`:'action completed',idempotencyKey,correlationId}));
    const message=`${actionName} completed for ${affectedId}. ${nextStatus?`Current prototype status: ${nextStatus}. `:''}Audit reference ${correlationId}.`;
    dispatch(setFeedback({screenId:screen.id,action:actionName,recordId:affectedId,message,at:new Date().toISOString()}));
    setInlineResult({tone:'success',title:'Authoritative prototype outcome recorded',body:message});
    window.setTimeout(()=>{setBusy(false);onComplete?.(message);onOpenChange(false);setReason('');setConfirm(false);setFieldValues({});},300);
  }

  return <Modal open={open} onOpenChange={onOpenChange} title={actionName} description={`${screen.title} · ${row?`selected record ${targetId}`:'new or screen-level action'}`}>
    <form className="grid gap-5" onSubmit={submit}>
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
        <div><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Active user</span><strong className="mt-1 block text-sm text-[var(--navy-900)]">{actor}</strong><small className="text-slate-500">{account?.role??'Public'}</small></div>
        <div><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Scope</span><strong className="mt-1 block text-sm text-[var(--navy-900)]">{account?.unit??screen.workspace}</strong><small className="text-slate-500">{screen.workspace}</small></div>
        <div><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Operation identity</span><strong className="mt-1 block break-all text-xs text-[var(--navy-900)]">{idempotencyKey}</strong><small className="text-slate-500">Reused until outcome is known</small></div>
      </div>

      {destructive&&<Alert tone="warning" title="This action changes or restricts the record">The original state remains auditable. Reversal/correction is represented as a linked event rather than erasing evidence.</Alert>}
      {inlineResult&&<Alert tone={inlineResult.tone} title={inlineResult.title}>{inlineResult.body}</Alert>}

      <section>
        <div className="mb-3 flex items-center gap-2"><FileText className="size-4 text-sky-700"/><h3 className="font-black text-[var(--navy-900)]">Action details</h3></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field,index)=>{const key=`f${index}`;const type=inputKind(field);return <label key={field} className={`grid gap-1.5 text-sm font-semibold text-slate-700 ${/description|summary|notes|purpose|body|evidence/i.test(field)?'sm:col-span-2':''}`}><span>{fieldLabel(field)}{index<2&&<span className="text-red-600"> *</span>}</span>{/description|summary|notes|purpose|body|evidence/i.test(field)?<textarea required={index<2} value={fieldValues[key]??''} onChange={e=>setFieldValues(v=>({...v,[key]:e.target.value}))} className="min-h-24 rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-sky-600 focus:ring-3 focus:ring-sky-100"/>:<input required={index<2} type={type} value={fieldValues[key]??''} onChange={e=>setFieldValues(v=>({...v,[key]:e.target.value}))} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-sky-600 focus:ring-3 focus:ring-sky-100" placeholder={type==='date'?'':`Enter ${fieldLabel(field).toLowerCase()}`}/>}</label>})}
        </div>
        <label className="mt-4 grid gap-1.5 text-sm font-semibold text-slate-700"><span>Reason / decision note{(controlled||destructive)&&<span className="text-red-600"> *</span>}</span><textarea value={reason} required={controlled||destructive} onChange={e=>setReason(e.target.value)} className="min-h-24 rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-sky-600 focus:ring-3 focus:ring-sky-100" placeholder="Record a concise business reason, next action or evidence note."/></label>
      </section>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700"/><div><h3 className="font-black text-emerald-950">Pre-submit controls</h3><ul className="mt-2 grid gap-1 text-sm text-emerald-950/75"><li>Role assignment, organisational scope, field visibility and delegation are rechecked immediately before mutation.</li><li>Idempotency prevents duplicate business effects on repeated click, refresh or retry.</li><li>Record version / ETag is compared to prevent silent overwrite.</li>{controlled&&<li>Controlled actions retain maker/checker, decision reason, evidence and effective policy/workflow version.</li>}</ul></div></div></section>

      <details className="rounded-xl border border-violet-200 bg-violet-50/60 p-4"><summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 font-black text-violet-950"><FlaskConical className="size-4"/>Prototype exception simulator</summary><p className="mt-2 text-sm leading-6 text-violet-900/70">Use this only to verify required non-happy paths. It does not change the screen's production rules.</p><label className="mt-3 grid gap-1.5 text-sm font-semibold text-violet-950"><span>Simulated service outcome</span><select value={outcomeMode} onChange={e=>setOutcomeMode(e.target.value as OutcomeMode)} className="min-h-11 rounded-lg border border-violet-200 bg-white px-3"><option value="success">Success / authoritative</option><option value="validation">Validation 400/422</option><option value="denied">Authorization 403</option><option value="conflict">Conflict 409/412</option><option value="unknown">Unknown dependency outcome</option><option value="partial">Partial success</option><option value="dependency">Dependency 502/504</option></select></label><p className="mt-2 text-xs leading-5 text-violet-900/70">{outcomeHelp[outcomeMode]}</p></details>

      {(destructive||controlled)&&<label className="flex min-h-11 items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm"><input className="mt-1 size-4" type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/><span><strong>I confirm this action in the displayed role context.</strong><span className="mt-1 block text-slate-500">The decision is written to prototype audit history with scope, policy/workflow version, reason, idempotency key and correlation reference.</span></span></label>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4"><div className="flex items-center gap-2 text-xs text-slate-500"><History className="size-4"/><span>Audit + recovery behaviour follows the screen contract.</span></div><div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={draft}><Save className="size-4"/>Save draft</Button>{inlineResult&&outcomeMode!=='success'&&<Button type="button" variant="secondary" onClick={()=>{setInlineResult(null);setOutcomeMode('success')}}><RefreshCw className="size-4"/>Return to safe retry</Button>}<Button type="button" variant="ghost" onClick={()=>onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={busy||((destructive||controlled)&&!confirm)}>{busy?<><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Processing…</>:<><CheckCircle2 className="size-4"/>Confirm {actionName}</>}</Button></div></div>
      {controlled&&<div className="flex flex-wrap gap-2"><Badge>Maker/checker ready</Badge><Badge>Version controlled</Badge><Badge>Evidence preserved</Badge><Badge>Default deny</Badge></div>}
    </form>
  </Modal>;
}
