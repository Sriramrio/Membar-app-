import { useMemo,useState } from 'react';
import { BookOpen, CheckCircle2, CircleHelp, Database, Lightbulb, LockKeyhole, Route, ShieldCheck, TestTube2, Undo2, X } from 'lucide-react';
import type { ScreenDefinition } from '@/types/screen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cleaned } from './screenUtils';

function miniList(items:string[],limit=4){return cleaned(items).slice(0,limit)}

function GuideList({items,tone='slate'}:{items:string[];tone?:'slate'|'amber'|'emerald'|'violet'|'sky'}){
  const dot=tone==='amber'?'bg-amber-500':tone==='emerald'?'bg-emerald-600':tone==='violet'?'bg-violet-600':tone==='sky'?'bg-sky-600':'bg-slate-500';
  return <ul className="grid gap-2 text-sm leading-5 text-slate-600">{items.map((x,i)=><li key={`${i}-${x}`} className="flex gap-2"><span className={`mt-2 size-1.5 shrink-0 rounded-full ${dot}`}/><span>{x}</span></li>)}</ul>;
}

export function ScreenGuide({screen,compact=false}:{screen:ScreenDefinition;compact?:boolean}){
  const [open,setOpen]=useState(!compact);
  const tips=useMemo(()=>miniList(screen.ux,4),[screen.ux]);
  const data=useMemo(()=>miniList(screen.requiredData,5),[screen.requiredData]);
  const controls=useMemo(()=>miniList(screen.validation,4),[screen.validation]);
  const exceptions=useMemo(()=>miniList(screen.edgeCases,4),[screen.edgeCases]);
  const recovery=useMemo(()=>miniList(screen.recovery,3),[screen.recovery]);
  const outcomes=useMemo(()=>miniList(screen.outcomes,3),[screen.outcomes]);
  const roles=useMemo(()=>miniList(screen.roles,3),[screen.roles]);

  if(!open){
    return <Button variant="secondary" onClick={()=>setOpen(true)} className="shrink-0"><CircleHelp className="size-4"/>Screen guide</Button>;
  }

  return <aside className="overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50 to-white shadow-[0_8px_28px_rgba(2,132,199,.08)]" aria-label="Screen guidance">
    <div className="flex items-start justify-between gap-4 border-b border-sky-100 px-5 py-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-sky-700"><BookOpen className="size-4"/>In-screen operating guide</div>
        <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-600">{screen.purpose}</p>
        <div className="mt-3 flex flex-wrap gap-2"><Badge className="bg-white text-sky-700">Screen {String(screen.id).padStart(2,'0')}</Badge><Badge className="bg-white text-sky-700">{screen.workspace}</Badge>{roles.map(r=><Badge key={r} className="bg-white text-slate-700">{r}</Badge>)}</div>
      </div>
      {compact&&<button type="button" className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-white" onClick={()=>setOpen(false)} aria-label="Close screen guide"><X className="size-4"/></button>}
    </div>

    <div className="grid gap-0 divide-y divide-sky-100 xl:grid-cols-3 xl:divide-x xl:divide-y-0">
      <section className="p-5">
        <div className="mb-2 flex items-center gap-2 font-extrabold text-[var(--navy-900)]"><Lightbulb className="size-4 text-amber-600"/>How to use it</div>
        <GuideList items={tips.length?tips:[screen.purpose]} tone="amber"/>
      </section>
      <section className="p-5">
        <div className="mb-2 flex items-center gap-2 font-extrabold text-[var(--navy-900)]"><Database className="size-4 text-sky-700"/>Information handled</div>
        <GuideList items={data.length?data:['Current authorised record and workflow context.']} tone="sky"/>
      </section>
      <section className="p-5">
        <div className="mb-2 flex items-center gap-2 font-extrabold text-[var(--navy-900)]"><ShieldCheck className="size-4 text-emerald-600"/>Validation & controls</div>
        <GuideList items={controls.length?controls:['Current role, scope and record version are checked before mutation.']} tone="emerald"/>
      </section>
    </div>

    <div className="grid gap-4 border-t border-sky-100 bg-white/70 p-5 md:grid-cols-3">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 font-extrabold text-[var(--navy-900)]"><Route className="size-4 text-sky-700"/>What happens next</div>
        <GuideList items={outcomes.length?outcomes:['Return to the authorised list or related record with state preserved.']} tone="sky"/>
      </section>
      <section className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
        <div className="mb-2 flex items-center gap-2 font-extrabold text-[var(--navy-900)]"><TestTube2 className="size-4 text-violet-600"/>Watch for these cases</div>
        <GuideList items={exceptions.length?exceptions:['Session, scope, network and concurrent-record changes are handled explicitly.']} tone="violet"/>
      </section>
      <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <div className="mb-2 flex items-center gap-2 font-extrabold text-[var(--navy-900)]"><Undo2 className="size-4 text-amber-700"/>Recovery behaviour</div>
        <GuideList items={recovery.length?recovery:['Retain safe input, reconcile authoritative state and retry idempotently when permitted.']} tone="amber"/>
      </section>
    </div>

    <div className="flex flex-wrap items-center gap-2 border-t border-sky-100 px-5 py-3 text-xs text-slate-500">
      <Badge className="bg-white text-sky-700"><LockKeyhole className="mr-1 size-3"/>Permission-aware</Badge>
      <Badge className="bg-white text-sky-700">Idempotent actions</Badge>
      <Badge className="bg-white text-sky-700">Conflict-safe</Badge>
      <Badge className="bg-white text-sky-700">Audit-ready</Badge>
      <span>Every controlled mutation is re-authorised against the current identity, assignment, unit, field visibility and record version.</span>
    </div>
  </aside>;
}

export function CompactGuideCard({screen}:{screen:ScreenDefinition}){
  return <Card className="border-sky-200 bg-sky-50/60"><div className="flex gap-3"><CircleHelp className="mt-0.5 size-5 shrink-0 text-sky-700"/><div><h3 className="font-black text-[var(--navy-900)]">What matters on this screen</h3><p className="mt-1 text-sm leading-6 text-slate-600">{cleaned(screen.validation)[0]??screen.purpose}</p><div className="mt-2 flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="size-3.5"/>Current role and scope are rechecked before write actions.</div></div></div></Card>;
}
