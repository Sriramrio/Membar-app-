import type { DemoState,ScreenDefinition } from '@/types/screen';
import { useAppDispatch,useAppSelector } from '@/app/hooks';
import { setDemoState } from '../prototypeSlice';
import { Loader } from '@/components/common/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

const states:DemoState[]=['success','loading','empty','filtered-empty','validation','offline','error','denied','not-found','expired','conflict','rate-limit','dependency','unknown','partial'];
const labels:Record<DemoState,string>={
  success:'Success',loading:'Loading',empty:'First-use empty','filtered-empty':'Filtered empty',validation:'Validation 400/422',offline:'Offline',error:'Server 500',denied:'Denied 403','not-found':'Not found 404',expired:'Gone / expired 410',conflict:'Conflict 409/412','rate-limit':'Rate limit 429',dependency:'Dependency 502/504',unknown:'Unknown outcome',partial:'Partial success'
};

export function ScreenStateLab({screen}:{screen:ScreenDefinition}){
  const dispatch=useAppDispatch();
  const state=useAppSelector(s=>s.prototype?.stateByScreen?.[screen.id]??'success');
  const reset=<Button className="mt-3" variant="secondary" onClick={()=>dispatch(setDemoState({screenId:screen.id,value:'success'}))}>Return to current view</Button>;
  return <section className="mt-6">
    <div className="mb-3"><p className="eyebrow">Exception handling</p><h2 className="text-xl font-black text-[var(--navy-900)]">Screen state lab</h2><p className="max-w-4xl text-sm leading-6 text-slate-500">Preview the mandatory non-happy paths for this route. Every state is explicit: unknown is never presented as failed, partial success is itemised, and recoverable input is retained.</p></div>
    <div className="mb-4 flex flex-wrap gap-2">{states.map(x=><Button key={x} variant={state===x?'default':'secondary'} onClick={()=>dispatch(setDemoState({screenId:screen.id,value:x}))}>{labels[x]}</Button>)}</div>
    {state==='loading'&&<Loader label={`Loading ${screen.title}`}/>} 
    {state==='empty'&&<EmptyState title="First-use empty state" description="No records exist yet. The live screen offers the first permitted starter action rather than a dead end."/>}
    {state==='filtered-empty'&&<div><EmptyState title="No matches" description="Current query, scope or status filters returned no records. Clear filters or broaden the search; filter state remains restorable on Back."/>{reset}</div>}
    {state==='validation'&&<div><Alert tone="warning" title="Validation needs attention (400/422)">No business mutation occurred. The error summary links to invalid fields, safe input remains in place, and the violated business rule is shown without technical leakage.</Alert>{reset}</div>}
    {state==='offline'&&<div><Alert tone="warning" title="Offline / network unavailable">Read-only safe cached content may remain visible. A write is never claimed as synced until reconnection, reauthorization and authoritative reconciliation complete.</Alert>{reset}</div>}
    {state==='error'&&<div><Alert tone="danger" title="Unhandled service error (500)">A generic safe message is shown with correlation ID DEMO-5XX-20260922. No stack trace or restricted data is exposed; safe input remains available for an idempotent retry.</Alert>{reset}</div>}
    {state==='denied'&&<div><Alert tone="danger" title="Permission denied (403)">The current identity is known, but the active assignment does not allow this resource, action, scope or field. Protected record details are not disclosed and the denial is auditable.</Alert>{reset}</div>}
    {state==='not-found'&&<div><Alert tone="warning" title="Record not available (404)">The record either does not exist for this viewer or cannot safely be disclosed. The interface avoids confirming protected-record existence and returns to an authorised list/search path.</Alert>{reset}</div>}
    {state==='expired'&&<div><Alert tone="warning" title="Record gone / superseded (410)">The record is expired, withdrawn, archived, merged or superseded. The authorised successor or history path is offered while original evidence remains preserved.</Alert>{reset}</div>}
    {state==='conflict'&&<div><Alert tone="warning" title="Concurrent update detected (409/412)">The record version changed in another session. Reload the latest safe state, compare changes and deliberately merge or abandon; the prototype never silently overwrites.</Alert>{reset}</div>}
    {state==='rate-limit'&&<div><Alert tone="warning" title="Rate limit reached (429)">The action is temporarily throttled. Retry timing is shown, safe input remains intact, and the client avoids automatic retry storms or duplicate effects.</Alert>{reset}</div>}
    {state==='dependency'&&<div><Alert tone="danger" title="External dependency unavailable (502/504)">The downstream integration did not provide a reliable answer. The UI keeps the operation pending/failed only according to authoritative evidence, exposes a reference ID and retries safely with the same operation identity.</Alert>{reset}</div>}
    {state==='unknown'&&<div><Alert tone="info" title="Outcome unknown — reconciliation required">A timeout occurred after submission and the final business outcome is not yet known. Do not repeat with a new idempotency key; reconcile the existing operation before claiming success or failure.</Alert>{reset}</div>}
    {state==='partial'&&<div><Alert tone="warning" title="Partially succeeded">Some items succeeded while others failed or remain unprocessed. Item-level outcomes, totals and next actions are explicit; retry only failed/unprocessed items.</Alert>{reset}</div>}
    {state==='success'&&<Alert tone="success" title="Authoritative state">The screen is showing the normal successful path with the current policy context. Controlled writes still recheck role, scope, field visibility and record version immediately before mutation.</Alert>}
  </section>;
}
