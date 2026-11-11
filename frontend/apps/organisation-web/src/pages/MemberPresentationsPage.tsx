import {useMemo,useState} from 'react';import {Link,useNavigate} from 'react-router-dom';
import {PageHeader} from '@/components/PageHeader';import {AsyncState} from '@/components/AsyncState';import {CursorPager} from '@/components/CursorPager';import {EmptyState} from '@/components/EmptyState';import {StatusPill} from '@/components/StatusPill';import {CommandFeedback} from '@/components/CommandFeedback';
import {useOrg} from '@/state/OrgStore';import {useDomainCursorPage} from '@/hooks/useDomainCursorPage';import {useRealtimeRefresh} from '@/hooks/useRealtimeRefresh';import {useOrgCommandAction} from '@/hooks/useOrgCommandAction';import {allowedTransitions} from '@/domain/stateMachines';import type {MemberPresentation} from '@/domain/types';
import {authStorage} from '@/utils/authStorage';import {ShieldCheck} from 'lucide-react';
export default function MemberPresentationsPage(){
  const s=useOrg();
  const isTrust=authStorage.isTrustUser();
  const isLeadershipTeam=authStorage.isLeadershipTeam();
  const isReadOnly=isTrust||isLeadershipTeam;
  const nav=useNavigate();
  const cmd=useOrgCommandAction();
  const [show,setShow]=useState(false);
  const [memberId,setMemberId]=useState('');
  const [topic,setTopic]=useState('');
  const req=useMemo(()=>({queryId:'org.member-presentations.list',organisationScope:s.scope.id,pageSize:25}),[s.scope.id]);
  const page=useDomainCursorPage<MemberPresentation>(req,[],[s.scope.id]);
  useRealtimeRefresh(['org.member-presentation.*','org.meeting.*'],page.reload);
  const create=async()=>{
    if(isReadOnly)return;
    if(!memberId||!topic.trim())return;
    const m=s.members.find(x=>x.id===memberId);
    const r=await cmd.run({
      commandType:'org.member-presentation.create',
      aggregateType:'MemberPresentation',
      payload:{memberId,memberName:m?.name??memberId,topic:topic.trim(),presentationType:'BUSINESS',scheduledAt:new Date(Date.now()+14*86400000).toISOString(),status:'Queued'},
      reason:'Schedule Member presentation'
    });
    if(r.ok){setMemberId('');setTopic('');setShow(false);page.reload()}
  };
  const advance=async(p:MemberPresentation,status:string)=>{
    if(isReadOnly)return;
    const r=await cmd.run({
      commandType:'org.member-presentation.update',
      aggregateType:'MemberPresentation',
      aggregateId:p.id,
      expectedVersion:p.version,
      payload:{status},
      reason:`Member presentation transition to ${status}`
    });
    if(r.ok)page.reload()
  };
  return <>
    <PageHeader 
      title="Member Business Presentation (MBP)" 
      actions={
        isTrust ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
            <ShieldCheck className="size-4 text-amber-600"/>
            <span>Trustee Audit Mode (Read-Only)</span>
          </div>
        ) : isLeadershipTeam ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold shadow-2xs">
            <ShieldCheck className="size-4 text-indigo-600"/>
            <span>Leadership Team Mode (Read-Only Audit)</span>
          </div>
        ) : (
          <button className="btn primary px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-colors min-h-[44px]" onClick={()=>setShow(v=>!v)}>Schedule presentation</button>
        )
      }
    >
      Presentation scheduling integrates with Chapter meetings and preserves downstream connections, references and opportunities in their canonical Member domains.
    </PageHeader>
    {isTrust && (
      <div className="mb-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3 text-xs shadow-2xs">
        <ShieldCheck className="size-5 text-blue-600 shrink-0"/>
        <div>
          <span className="font-bold">Trustee Read-Only Oversight: </span>
          <span>Member presentation scheduling is governed exclusively by Parivar Leadership.</span>
        </div>
      </div>
    )}
    {isLeadershipTeam && (
      <div className="mb-4 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-3 text-xs shadow-2xs">
        <ShieldCheck className="size-5 text-indigo-600 shrink-0"/>
        <div>
          <span className="font-bold">Leadership Read-Only Oversight: </span>
          <span>Member presentation scheduling is governed exclusively by Parivar Leadership. You have full audit visibility across all chapters.</span>
        </div>
      </div>
    )}
    <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry}/>
    {!isReadOnly && show && (
      <div className="card form-grid two mb-6 p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-field flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">Member</label>
          <select className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px]" value={memberId} onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>setMemberId(e.target.value)}>
            <option value="">Select Member</option>
            {s.members.map(m=><option value={m.id} key={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="form-field flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">Business / topic</label>
          <input className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px]" value={topic} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setTopic(e.target.value)}/>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button className="btn primary px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-colors min-h-[44px]" disabled={!memberId||!topic.trim()||cmd.busy} onClick={()=>void create()}>Add to presentation queue</button>
        </div>
      </div>
    )}
    <div className="row-actions mb-6 flex flex-wrap items-center gap-2">
      <button className="btn px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors min-h-[44px]" onClick={()=>nav('/org/committees?type=MEMBER_PRESENTATION')}>Presentation Committee</button>
      <Link className="btn px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors min-h-[44px] inline-flex items-center" to="/org/meetings">Meeting agenda</Link>
    </div>
    <AsyncState loading={page.loading} refreshing={page.refreshing} stale={page.stale} error={page.error} onRetry={page.reload}>
      {page.page?.items.length?(
        <div className="list divide-y divide-slate-200/80 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {page.page.items.map(p=>{
            const statusNorm=p.status==='SCHEDULED'?'Scheduled':(p.status||'Queued');
            const next=allowedTransitions('MEMBER_PRESENTATION',statusNorm)[0];
            const name=(p as unknown as {memberName?:string;presenter?:string}).memberName||(p as unknown as {memberName?:string;presenter?:string}).presenter||'Member';
            const dateText=p.scheduledAt?new Date(p.scheduledAt).toLocaleString():'Date pending';
            return <div className="row flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 hover:bg-slate-50/60 transition-colors" key={p.id}>
              <div>
                <b className="font-semibold text-slate-900 text-base">{name}</b>
                <div className="row-meta text-xs text-slate-500 mt-1">{p.topic} · {dateText}{p.meetingId?` · meeting ${p.meetingId}`:''}</div>
              </div>
              <div className="row-actions flex flex-wrap items-center gap-2">
                <StatusPill value={statusNorm}/>
                {!isReadOnly && next && (
                  <button className="btn primary px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs transition-colors min-h-[44px]" disabled={cmd.busy} onClick={()=>void advance(p,next)}>Move to {next}</button>
                )}
              </div>
            </div>
          })}
        </div>
      ):(
        <EmptyState title="No Member presentations scheduled"/>
      )}
      <CursorPager canPrevious={page.canPrevious} canNext={page.canNext} onPrevious={page.previous} onNext={page.next} totalEstimate={page.page?.totalEstimate}/>
    </AsyncState>
  </>
}

