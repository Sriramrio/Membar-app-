import { useCallback, useEffect, useState } from 'react';
import { PageHead } from '@/features/network/components/NetworkUI';
import { apiClient } from '@/services/api/apiClient';

type Payment = { paymentRequestId:string; chapterId:string; amount:number; currency:string; status:string; version:number; purpose:string; submittedUtr?:string|null };
type Result = { accepted:boolean; code:string; paymentRequestId:string; version?:number };
const endpoint='/v6/manual-payments';

/** Payment claims are never marked paid by the client; only server finance approval can change status. */
export default function MyPaymentsPage() {
  const [rows,setRows]=useState<Payment[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [active,setActive]=useState<Payment|null>(null);
  const [utr,setUtr]=useState('');
  const [date,setDate]=useState('');
  const [mode,setMode]=useState('Bank Transfer');
  const [submitting,setSubmitting]=useState(false);
  const refresh=useCallback(async()=>{
    setLoading(true);
    try { setRows(await apiClient.get<Payment[]>(`${endpoint}/mine`,{retry:'safe'}));setError(''); }
    catch {setRows([]);setError('Payment records could not be retrieved from the server. No payment status is assumed.');}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(!active||submitting)return;
    setSubmitting(true);setNotice('');
    const idempotencyKey=crypto.randomUUID();
    try{
      const result=await apiClient.post<Result>(`${endpoint}/claims`,{
        paymentRequestId:active.paymentRequestId,amount:active.amount,currency:active.currency,
        utr:utr.trim(),paymentDate:date,mode,idempotencyKey
      },undefined,{idempotencyKey});
      if(!result.accepted)throw new Error(result.code);
      setNotice('Payment details submitted for independent bank-statement verification. This is not a paid receipt.');
      setActive(null);setUtr('');setDate('');await refresh();
    }catch{setError('Submission could not be confirmed. Check the server record before retrying to avoid a duplicate claim.');}
    finally{setSubmitting(false);}
  }
  return <main className="space-y-5">
    <PageHead title="My Payments" description="Submit bank transfer details for authorised finance verification."/>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
    {notice&&<p role="status" className="rounded-lg bg-blue-50 p-3 text-blue-800">{notice}</p>}
    <button type="button" className="rounded-lg border px-4 py-2" onClick={()=>void refresh()} disabled={loading}>Refresh payment records</button>
    {loading?<p>Loading authorised payment records…</p>:rows.length===0?<p>No payment obligations are currently available from the server.</p>:
    <div className="space-y-3">{rows.map(p=><section key={p.paymentRequestId} className="rounded-xl border p-4">
      <div className="font-semibold">{p.purpose} · {new Intl.NumberFormat('en-IN',{style:'currency',currency:p.currency}).format(p.amount)}</div>
      <p className="text-sm">Status: {p.status} · Reference: {p.paymentRequestId}</p>
      {p.submittedUtr&&<p className="text-sm">Submitted UTR: {p.submittedUtr}</p>}
      {['Requested','ClarificationRequired','Rejected'].includes(p.status)&&<button type="button" className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-white" onClick={()=>{setActive(p);setError('');}}>Submit bank transaction details</button>}
      {p.status==='VerificationPending'&&<p className="text-sm">Finance review is pending. Do not submit the same claim again.</p>}
      {p.status==='Approved'&&<p className="text-sm">Bank payment verified by finance; membership activation remains subject to separate approval and processing.</p>}
    </section>)}</div>}
    {active&&<form className="space-y-3 rounded-xl border p-4" onSubmit={submit}>
      <h2 className="font-semibold">Submit transfer for {active.purpose}</h2>
      <p className="text-sm">Expected amount: {active.amount} {active.currency}. Use the payment reference shown above, not another member's payment.</p>
      <label className="block">UTR / bank transaction reference<input required maxLength={140} className="block w-full rounded border p-2" value={utr} onChange={e=>setUtr(e.target.value)}/></label>
      <label className="block">Date of payment<input required type="date" className="block w-full rounded border p-2" max={new Date().toISOString().slice(0,10)} value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label className="block">Payment mode<select className="block w-full rounded border p-2" value={mode} onChange={e=>setMode(e.target.value)}><option>Bank Transfer</option><option>UPI</option><option>NEFT</option><option>RTGS</option><option>IMPS</option></select></label>
      <div className="flex gap-3"><button disabled={submitting} type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white">{submitting?'Submitting…':'Submit for verification'}</button><button type="button" onClick={()=>setActive(null)}>Cancel</button></div>
    </form>}
  </main>;
}
