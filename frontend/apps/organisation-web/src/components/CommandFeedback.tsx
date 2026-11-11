import type {ApiErrorEnvelope} from '@/types/api';
export function CommandFeedback({busy,slow,error,onRetry}:{busy:boolean;slow?:boolean;error?:ApiErrorEnvelope;onRetry?:()=>void}){
  if(!busy&&!slow&&!error)return null;
  return <div className={`callout ${error?'warn-callout bg-amber-50/90 border-amber-300 text-amber-950':'bg-blue-50/90 border-blue-200 text-blue-950'} p-4 rounded-xl border mb-4 text-sm`} role={error?'alert':'status'}>
    <div className="font-semibold">{busy?'Saving…':slow?'Completed, but slower than the target response time.':error?.detail}</div>
    {error?.unknownOutcome&&<div className="row-meta text-xs text-amber-800 mt-1"><b>Do not retry blindly.</b> Reload or verify the record first because the server may already have committed the action.</div>}
    {error?.currentVersion!==undefined&&<div className="row-meta text-xs text-slate-500 mt-1">Latest server version: {error.currentVersion}</div>}
    {error?.allowedRecovery?.length?<div className="row-meta text-xs text-slate-500 mt-1">Recovery: {error.allowedRecovery.join(' · ')}</div>:null}
    {error?.fieldErrors?.length?<ul className="mt-2 list-disc list-inside text-xs">{error.fieldErrors.map((f,i)=><li key={`${f.field}-${i}`}><b>{f.field}</b>: {f.message}</li>)}</ul>:null}
    {error?.correlationId&&<div className="row-meta text-xs text-slate-400 mt-1">Reference {error.correlationId}</div>}
    {error?.retryable&&!error.unknownOutcome&&onRetry&&<button className="btn mt-2 px-3 py-1.5 rounded-lg border border-amber-400 bg-white text-amber-900 font-bold text-xs hover:bg-amber-100 transition-colors" onClick={onRetry}>Retry safely</button>}
  </div>;
}

