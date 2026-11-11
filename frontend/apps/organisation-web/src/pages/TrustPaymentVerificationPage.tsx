import React, { useCallback, useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import axios from 'axios';

type Payment={ paymentRequestId:string;chapterId:string;amount:number;currency:string;status:string;version:number;purpose:string;submittedUtr?:string|null;submittedDate?:string|null;submittedMode?:string|null };
type Result={accepted:boolean;code:string;paymentRequestId:string;version?:number};
const base='/api/v6/manual-payments';
const client=axios.create({withCredentials:true,headers:{Accept:'application/json','Content-Type':'application/json'},xsrfCookieName:'XSRF-TOKEN',xsrfHeaderName:'X-XSRF-TOKEN'});

/** Only authenticated finance grants from the server determine which payments appear. */
export default function TrustPaymentVerificationPage(){
 const [rows,setRows]=useState<Payment[]>([]);const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');const [notice,setNotice]=useState('');
 const [selected,setSelected]=useState<Payment|null>(null);const [checkedSource,setCheckedSource]=useState('OfficialBankStatement');
 const [checkedDate,setCheckedDate]=useState('');const [checkedUtr,setCheckedUtr]=useState('');
 const [checkedAmount,setCheckedAmount]=useState('');const [reason,setReason]=useState('');
 const [beneficiaryMatched,setBeneficiaryMatched]=useState(false);const [utrMatched,setUtrMatched]=useState(false);
 const [amountMatched,setAmountMatched]=useState(false);const [dateMatched,setDateMatched]=useState(false);
 const [submitting,setSubmitting]=useState(false);
 const refresh=useCallback(async()=>{
  setLoading(true);try{const res=await client.get<Payment[]>(`${base}/finance-queue`);setRows(res.data);setError('');}
  catch{setRows([]);setError('Authoritative finance queue unavailable or access denied. No payment decisions can be made.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 function choose(p:Payment){setSelected(p);setCheckedUtr(p.submittedUtr??'');setCheckedAmount(String(p.amount));setCheckedDate('');setReason('');setBeneficiaryMatched(false);setUtrMatched(false);setAmountMatched(false);setDateMatched(false);}
 async function decide(event: { preventDefault?: () => void } | undefined, decision: 'Approved'|'ClarificationRequired'|'Rejected'){
  event?.preventDefault?.();if(!selected||submitting)return;
  if(decision==='Approved'&&(!beneficiaryMatched||!utrMatched||!amountMatched||!dateMatched)){
    setError('All four comparisons against the actual bank record are required before approval.');return;
  }
  setSubmitting(true);setError('');setNotice('');const idempotencyKey=crypto.randomUUID();
  try{
    const res=await client.post<Result>(`${base}/verification`,{
      paymentRequestId:selected.paymentRequestId,expectedVersion:selected.version,
      checkedSource,checkedDate,checkedUtr:checkedUtr.trim(),checkedAmount:Number(checkedAmount),
      currency:selected.currency,beneficiaryMatched,utrMatched,amountMatched,dateMatched,
      decision,reasonCode:reason.trim(),idempotencyKey
    },{headers:{'Idempotency-Key':idempotencyKey}});
    if(!res.data.accepted)throw new Error(res.data.code);
    setNotice(`Server accepted finance decision: ${res.data.code}. This is not proof of membership activation.`);
    setSelected(null);await refresh();
  }catch{setError('Finance decision was not confirmed by the server. Recheck the queue before retrying.');}
  finally{setSubmitting(false);}
 }
 return <main className="space-y-5 p-4">
  <h1 className="text-2xl font-bold">Bank Statement Verification</h1>
  <p>Review only against actual bank records. The member's UTR is a claim, not confirmation of credit. Permission and Parivar scope are enforced on the server.</p>
  <button type="button" className="rounded border px-4 py-2" disabled={loading} onClick={()=>void refresh()}>Refresh verified queue</button>
  {error&&<p role="alert" className="rounded bg-red-50 p-3 text-red-800">{error}</p>}
  {notice&&<p role="status" className="rounded bg-blue-50 p-3 text-blue-800">{notice}</p>}
  {loading?<p>Loading finance queue…</p>:rows.length===0?<p>No pending payment claims are available in your authorised finance scope.</p>:
  <div className="space-y-3">{rows.map(p=><article className="rounded border p-3" key={p.paymentRequestId}>
   <p className="font-semibold">{p.purpose} · {p.amount} {p.currency} · {p.status}</p>
   <p className="text-sm">Payment: {p.paymentRequestId} · Chapter: {p.chapterId} · UTR: {p.submittedUtr??'Not supplied'}</p>
   <button type="button" className="mt-2 rounded bg-slate-900 px-3 py-2 text-white" onClick={()=>choose(p)}>Compare with bank statement</button>
  </article>)}</div>}
  {selected&&<form className="space-y-3 rounded border p-4" onSubmit={(e: FormEvent<HTMLFormElement>)=>void decide(e,'Approved')}>
   <h2 className="font-semibold">Independent bank-record comparison</h2>
   <p className="text-sm">Claimed UTR: {selected.submittedUtr}; Amount: {selected.amount} {selected.currency}. Version: {selected.version}</p>
   <label className="block">Bank evidence source<select className="block w-full rounded border p-2" value={checkedSource} onChange={(e: ChangeEvent<HTMLSelectElement>)=>setCheckedSource(e.target.value)}><option value="OfficialBankStatement">Official bank statement</option><option value="AuthorisedBankPortal">Authorised bank portal</option><option value="FinanceBankRecord">Finance bank record</option></select></label>
   <label className="block">Bank credit date<input required type="date" max={new Date().toISOString().slice(0,10)} value={checkedDate} onChange={(e: ChangeEvent<HTMLInputElement>)=>setCheckedDate(e.target.value)} className="block w-full rounded border p-2"/></label>
   <label className="block">Bank UTR<input required maxLength={140} value={checkedUtr} onChange={(e: ChangeEvent<HTMLInputElement>)=>setCheckedUtr(e.target.value)} className="block w-full rounded border p-2"/></label>
   <label className="block">Bank credit amount<input required type="number" min="0.01" step="0.01" value={checkedAmount} onChange={(e: ChangeEvent<HTMLInputElement>)=>setCheckedAmount(e.target.value)} className="block w-full rounded border p-2"/></label>
   <label className="block">Decision evidence / reason code<input required maxLength={120} value={reason} onChange={(e: ChangeEvent<HTMLInputElement>)=>setReason(e.target.value)} className="block w-full rounded border p-2"/></label>
   {([[beneficiaryMatched,setBeneficiaryMatched,'Receiving beneficiary matched'],[utrMatched,setUtrMatched,'Bank reference matched'],[amountMatched,setAmountMatched,'Amount and currency matched'],[dateMatched,setDateMatched,'Credit date matched']] as const).map(([value,update,label])=><label key={label} className="block"><input type="checkbox" checked={value} onChange={(e: ChangeEvent<HTMLInputElement>)=>update(e.target.checked)}/> {label}</label>)}
   <div className="flex flex-wrap gap-2"><button type="submit" disabled={submitting||!checkedDate||!reason.trim()} className="rounded bg-green-800 px-3 py-2 text-white">Approve bank receipt</button><button type="button" disabled={submitting||!checkedDate||!reason.trim()} onClick={()=>void decide(undefined,'ClarificationRequired')} className="rounded border px-3 py-2">Request clarification</button><button type="button" disabled={submitting||!checkedDate||!reason.trim()} onClick={()=>void decide(undefined,'Rejected')} className="rounded border px-3 py-2">Reject</button><button type="button" onClick={()=>setSelected(null)}>Cancel</button></div>
  </form>}
 </main>;
}



