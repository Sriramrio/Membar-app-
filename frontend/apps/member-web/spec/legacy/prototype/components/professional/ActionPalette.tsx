import { ArrowRight, CheckCircle2, MousePointerClick } from 'lucide-react';
import type { ScreenDefinition } from '@/types/screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { actionTone,cleaned } from './screenUtils';

export function ActionPalette({screen,onAction}:{screen:ScreenDefinition;onAction:(action:string)=>void}){
  const actions=cleaned(screen.primaryActions);
  if(actions.length===0)return null;
  return <Card className="overflow-hidden p-0">
    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-slate-500"><MousePointerClick className="size-4"/>Working actions</div><p className="mt-1 text-xs leading-5 text-slate-500">Use these controls to exercise the complete screen workflow. Controlled mutations open the policy-aware action workbench.</p></div>
      <Badge className="bg-emerald-50 text-emerald-700"><CheckCircle2 className="mr-1 size-3"/>Interactive</Badge>
    </div>
    <div className="flex flex-wrap gap-2 p-4">{actions.map((action,index)=><Button key={action} variant={index===0?'default':actionTone(action)} onClick={()=>onAction(action)}>{action}{index===0&&<ArrowRight className="size-4"/>}</Button>)}</div>
  </Card>;
}
