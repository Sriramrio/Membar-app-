import { useMemo,useState } from 'react';
import { Download } from 'lucide-react';
import { useAppDispatch,useAppSelector, useNetworkSlice } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { updateMember } from '@/features/network/networkSlice';
import { EmptyState,PageHead,SearchField,StatusPill } from '@/features/network/components/NetworkUI';
import { descendantUnitNames } from '@/features/platform-runtime/organisationScope';
import { exportToCsv } from '@/utils/exportCsv';
import { toast } from '@/components/ui/Toast';

export default function MemberManagementLivePage(){
  const dispatch=useAppDispatch();
  const n=useNetworkSlice(['affiliations', 'businesses', 'members'] as const);
  const auth=useAppSelector(s=>s.auth);
  const units=useAppSelector(s=>s.controlPlane.organisationUnits);
  const unitScope=descendantUnitNames(units,auth.activeUnit);
  const scopedMembers=n.members.filter(m=>!unitScope.length||unitScope.includes(m.chapter));
  const [q,setQ]=useState('');
  const [chapter,setChapter]=useState('');
  const [status,setStatus]=useState<'all'|'active'|'suspended'>('all');
  const chapters=[...new Set(scopedMembers.map(m=>m.chapter))].sort();
  const rows=scopedMembers.filter(m=>(!q||`${m.name} ${m.designation} ${m.email} ${m.chapter} ${n.businesses.find(b=>n.affiliations.some(a=>a.memberId===m.id&&a.businessId===b.id&&a.active&&a.verificationStatus==='Verified'))?.name??''}`.toLowerCase().includes(q.toLowerCase()))&&(!chapter||m.chapter===chapter)&&(status==='all'||(m.status??'active')===status));

  const downloadCsv=()=>{
    if(!rows.length){
      toast.warning('No member records to export.');
      return;
    }
    const headers=['Member ID','Full Name','Designation','Company / Business','Chapter','Email','Phone','Status'];
    const data=rows.map(m=>{
      const b=n.businesses.find(x=>n.affiliations.some(a=>a.memberId===m.id&&a.businessId===x.id&&a.active&&a.verificationStatus==='Verified'));
      return [
        m.id,
        m.name,
        m.designation,
        b?.name??'N/A',
        m.chapter,
        m.email,
        m.phone??'N/A',
        m.status??'active'
      ];
    });
    exportToCsv(`members-${chapter||'all-chapters'}-${new Date().toISOString().slice(0,10)}`,headers,data);
    toast.success('Members CSV downloaded successfully!', 'Export Completed');
  };

  return <div>
    <PageHead
      title="Member Management"
      description="Search, review and manage member access across the organisation."
      actions={<Button variant="secondary" onClick={downloadCsv} disabled={!rows.length}><Download className="size-4"/>Download CSV</Button>}
    />
    <div className="mb-5 grid gap-3 md:grid-cols-[1fr_240px_180px_auto]">
      <SearchField value={q} onChange={setQ} placeholder="Search members, businesses, email or chapter…"/>
      <select className="min-h-11 rounded-xl border border-slate-300 bg-white px-3" value={chapter} onChange={e=>setChapter(e.target.value)}>
        <option value="">All chapters</option>
        {chapters.map(x=><option key={x}>{x}</option>)}
      </select>
      <select className="min-h-11 rounded-xl border border-slate-300 bg-white px-3" value={status} onChange={e=>setStatus(e.target.value as typeof status)}>
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>
      <Button variant="secondary" onClick={downloadCsv} disabled={!rows.length}><Download className="size-4"/>Download CSV</Button>
    </div>
    <div className="grid gap-3">{rows.map(m=>{
      const b=n.businesses.find(x=>n.affiliations.some(a=>a.memberId===m.id&&a.businessId===x.id&&a.active&&a.verificationStatus==='Verified'));
      const current=m.status??'active';
      return <Card key={m.id} className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="font-black">{m.name}</div>
          <div className="text-sm text-slate-600">{m.designation} · {b?.name}</div>
          <div className="text-sm text-slate-500">{m.chapter} · {m.email}</div>
        </div>
        <StatusPill tone={current==='active'?'good':'bad'}>{current}</StatusPill>
        <Button variant={current==='active'?'secondary':'default'} onClick={()=>{
          const next = current==='active'?'suspended':'active';
          dispatch(updateMember({id:m.id,changes:{status:next}}));
          if(next==='suspended'){
            toast.error(`Member access suspended for ${m.name}.`, 'Access Suspended');
          } else {
            toast.success(`Member access restored for ${m.name}!`, 'Access Restored');
          }
        }}>{current==='active'?'Suspend access':'Restore access'}</Button>
      </Card>;
    })}
    {!rows.length&&<EmptyState title="No members match" body="Adjust the current filters."/>}
    </div>
  </div>;
}

