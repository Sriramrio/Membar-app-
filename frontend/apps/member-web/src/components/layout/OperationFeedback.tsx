import { useState, useEffect } from 'react';
import { useAppSelector } from '@/app/hooks';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { selectAuditEvents } from '@/features/platform-runtime/auditRuntime';

export function OperationFeedback(){
  const event=useAppSelector(s=>selectAuditEvents(s).find(a=>a.result==='Denied'||a.result==='Failed'));
  const [dismissed,setDismissed]=useState<string|null>(null);

  useEffect(()=>{
    if(event && event.id !== dismissed){
      toast.error(event.reason ?? 'The operation was stopped safely.', event.result==='Denied'?'Action Not Permitted':'Operation Failed');
    }
  },[event?.id]);

  if(!event||dismissed===event.id)return null;
  return <div className="px-4 pt-3"><Alert tone="danger" title={event.result==='Denied'?'Action was not permitted':'Action could not be completed'}><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span>{event.reason??'The operation was stopped safely.'} <span className="text-sm">Correlation: {event.correlationId}</span></span><Button variant="secondary" onClick={()=>setDismissed(event.id)}>Dismiss</Button></div></Alert></div>;
}

