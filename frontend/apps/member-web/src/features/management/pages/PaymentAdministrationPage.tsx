import { useMemo,useState } from 'react';
import { Download, WalletCards } from 'lucide-react';
import { useAppDispatch,useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { payMembership,updatePaymentStatus } from '@/features/network/networkSlice';
import { PageHead,StatusPill } from '@/features/network/components/NetworkUI';
import { descendantUnitNames } from '@/features/platform-runtime/organisationScope';
import { exportToCsv } from '@/utils/exportCsv';
import { toast } from '@/components/ui/Toast';

const fmt=(n:number)=>new Intl.NumberFormat('en-IN').format(n);
const fmtDate=(v:string,time=false)=>new Date(v).toLocaleString('en-IN',time?{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'}:{day:'numeric',month:'short',year:'numeric'});

export default function PaymentAdministrationLivePage(){
  const dispatch=useAppDispatch();
  const n=useNetworkSlice(['members', 'payments'] as const);
  const auth=useAppSelector(s=>s.auth);
  const units=useAppSelector(s=>s.controlPlane.organisationUnits);
  const unitScope=descendantUnitNames(units,auth.activeUnit);
  const scopedMemberIds=new Set(n.members.filter(m=>!unitScope.length||unitScope.includes(m.chapter)).map(m=>m.id));
  const [status,setStatus]=useState<'all'|'due'|'paid'|'failed'>('all');
  const rows=n.payments.filter(p=>scopedMemberIds.has(p.memberId)).filter(p=>status==='all'||p.status===status).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));

  const downloadCsv=()=>{
    if(!rows.length){
      toast.warning('No payment records to export.');
      return;
    }
    const headers=['Payment ID','Member Name','Member ID','Description','Amount (INR)','Due Date','Paid Date','Status'];
    const data=rows.map(p=>{
      const member=n.members.find(m=>m.id===p.memberId);
      return [
        p.id,
        member?.name??'Unknown',
        p.memberId,
        p.description,
        p.amount,
        p.dueDate,
        p.paidAt??'N/A',
        p.status
      ];
    });
    exportToCsv(`payments-report-${status}-${new Date().toISOString().slice(0,10)}`,headers,data);
    toast.success('Payments CSV downloaded successfully!', 'Export Completed');
  };

  return <div>
    <PageHead
      title="Payment Administration"
      description="Review membership payment status and reconcile eligible records."
      actions={<Button variant="secondary" onClick={downloadCsv} disabled={!rows.length}><Download className="size-4"/>Download CSV</Button>}
    />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <select className="min-h-11 rounded-xl border border-slate-300 bg-white px-3" value={status} onChange={e=>setStatus(e.target.value as typeof status)}>
        <option value="all">All payments</option>
        <option value="due">Due</option>
        <option value="paid">Paid</option>
        <option value="failed">Failed</option>
      </select>
      <Button variant="secondary" onClick={downloadCsv} disabled={!rows.length}><Download className="size-4"/>Download CSV</Button>
    </div>
    <div className="grid gap-3">{rows.map(p=><Card key={p.id} className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><WalletCards className="size-5"/></div><div className="flex-1"><div className="font-black">{n.members.find(m=>m.id===p.memberId)?.name}</div><div className="text-sm text-slate-600">{p.description} · due {fmtDate(p.dueDate)}</div></div><div className="font-black">₹{fmt(p.amount)}</div><StatusPill tone={p.status==='paid'?'good':p.status==='due'?'warn':'bad'}>{p.status}</StatusPill>{p.status!=='paid'&&<Button onClick={()=>{ dispatch(payMembership({paymentId:p.id,memberId:p.memberId})); toast.success('Payment marked as paid!', 'Reconciled'); }}>Mark paid</Button>}{p.status==='failed'&&<Button variant="secondary" onClick={()=>{ dispatch(updatePaymentStatus({paymentId:p.id,status:'due'})); toast.info('Payment returned to due status.', 'Updated'); }}>Return to due</Button>}</Card>)}</div>
  </div>;
}

