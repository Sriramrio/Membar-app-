import { useState } from 'react';
import { Activity, ClipboardCheck, Clock3, ExternalLink, History, ShieldCheck } from 'lucide-react';
import type { ScreenDefinition } from '@/types/screen';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cleaned,recordId } from './screenUtils';

function label(key:string){return key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())}
function value(v:unknown){if(v===null||v===undefined||v==='')return '—';if(typeof v==='boolean')return v?'Yes':'No';return String(v)}

export function RecordInspector({screen,row,open,onOpenChange,onAction}:{screen:ScreenDefinition;row:Record<string,unknown>|null;open:boolean;onOpenChange:(open:boolean)=>void;onAction:(action:string)=>void}){
  const [tab,setTab]=useState<'details'|'workflow'|'history'>('details');
  if(!row)return null;
  const id=recordId(row);
  return <Modal open={open} onOpenChange={onOpenChange} title={`${screen.title} · ${id}`} description="Prototype record detail with workflow, history and permission-aware actions.">
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2"><Badge className="bg-emerald-50 text-emerald-700">{value(row.status??'Current')}</Badge><Badge>{screen.workspace}</Badge><span className="text-xs text-slate-500">Last verified just now · synthetic demonstration data</span></div>
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Record detail tabs">
        {([['details','Details'],['workflow','Workflow'],['history','History']] as const).map(([key,text])=><button type="button" role="tab" aria-selected={tab===key} key={key} onClick={()=>setTab(key)} className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-bold ${tab===key?'bg-white text-[var(--navy-900)] shadow-sm':'text-slate-500 hover:text-slate-800'}`}>{text}</button>)}
      </div>
      {tab==='details'&&<dl className="grid gap-3 sm:grid-cols-2">{Object.entries(row).map(([k,v])=><div key={k} className="rounded-xl border border-slate-200 bg-white p-3"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label(k)}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value(v)}</dd></div>)}</dl>}
      {tab==='workflow'&&<div className="grid gap-4"><div className="grid gap-3 sm:grid-cols-3">{['Current state','Next control','SLA / timing'].map((x,i)=><div key={x} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-2">{i===0?<Activity className="size-4 text-sky-700"/>:i===1?<ShieldCheck className="size-4 text-emerald-700"/>:<Clock3 className="size-4 text-amber-700"/>}<strong className="text-sm text-[var(--navy-900)]">{x}</strong></div><p className="mt-2 text-sm text-slate-600">{i===0?value(row.status??'Current'):i===1?(cleaned(screen.validation)[0]??'Policy and scope recheck'):'Within configured workflow SLA'}</p></div>)}</div><div className="rounded-xl border border-slate-200 p-4"><h3 className="font-black text-[var(--navy-900)]">Allowed next actions</h3><div className="mt-3 flex flex-wrap gap-2">{screen.primaryActions.slice(0,6).map((action,i)=><Button key={action} variant={i===0?'default':'secondary'} onClick={()=>onAction(action.replace(/[.]+$/,''))}>{action.replace(/[.]+$/,'')}</Button>)}</div></div></div>}
      {tab==='history'&&<ol className="relative grid gap-4 border-l-2 border-slate-200 pl-5"><li><span className="absolute -left-[7px] mt-1 size-3 rounded-full bg-emerald-500"/><div className="flex items-center gap-2"><ClipboardCheck className="size-4 text-emerald-700"/><strong className="text-sm">Current authorised state loaded</strong></div><p className="mt-1 text-sm text-slate-500">Role, unit, field visibility and record version validated for this view.</p></li><li><span className="absolute -left-[7px] mt-1 size-3 rounded-full bg-sky-500"/><div className="flex items-center gap-2"><History className="size-4 text-sky-700"/><strong className="text-sm">Previous update preserved</strong></div><p className="mt-1 text-sm text-slate-500">Historical changes remain linked rather than overwritten.</p></li></ol>}
      <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4"><Button variant="ghost" onClick={()=>onOpenChange(false)}>Close</Button><Button variant="secondary" onClick={()=>onAction(screen.primaryActions[0]?.replace(/[.]+$/,'')??'Open')}><ExternalLink className="size-4"/>{screen.primaryActions[0]?.replace(/[.]+$/,'')??'Open action'}</Button></div>
    </div>
  </Modal>;
}
