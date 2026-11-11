import {useMemo,useState} from 'react';import {Link,useNavigate} from 'react-router-dom';
import {PageHeader} from '@/components/PageHeader';import {AsyncState} from '@/components/AsyncState';import {CursorPager} from '@/components/CursorPager';import {EmptyState} from '@/components/EmptyState';import {StatusPill} from '@/components/StatusPill';import {CommandFeedback} from '@/components/CommandFeedback';
import {useOrg} from '@/state/OrgStore';import {useDomainCursorPage} from '@/hooks/useDomainCursorPage';import {useRealtimeRefresh} from '@/hooks/useRealtimeRefresh';import {useOrgCommandAction} from '@/hooks/useOrgCommandAction';import {allowedTransitions} from '@/domain/stateMachines';import type {KytSession} from '@/domain/types';
import {authStorage} from '@/utils/authStorage';
import {ShieldCheck} from 'lucide-react';
export default function KytPage(){
  const s=useOrg();
  const nav=useNavigate();
  const cmd=useOrgCommandAction();
  const [show,setShow]=useState(false);
  const [memberId,setMemberId]=useState('');
  const isTrustee=authStorage.isTrustUser();
  const isLeadershipTeam=authStorage.isLeadershipTeam();
  const isReadOnly=isTrustee||isLeadershipTeam;

  const req=useMemo(()=>({queryId:'org.kyt.list',organisationScope:s.scope.id,pageSize:25}),[s.scope.id]);
  const page=useDomainCursorPage<KytSession>(req,[],[s.scope.id]);
  useRealtimeRefresh(['org.kyt.*','member.connection.*','member.reference.*','member.opportunity.*'],page.reload);

  const create=async()=>{
    if(!memberId||isReadOnly)return;
    const m=s.members.find(x=>x.id===memberId);
    const r=await cmd.run({
      commandType:'org.kyt.create',
      aggregateType:'KytSession',
      payload:{memberId,memberName:m?.name??memberId,status:'Planned',scheduledAt:new Date(Date.now()+7*86400000).toISOString(),needs:[],offers:[],potentialConnections:[]},
      reason:'Plan KYT session'
    });
    if(r.ok){setShow(false);setMemberId('');page.reload()}
  };

  const advance=async(k:KytSession,status:string)=>{
    if(isReadOnly)return;
    const r=await cmd.run({
      commandType:'org.kyt.update',
      aggregateType:'KytSession',
      aggregateId:k.id,
      expectedVersion:k.version,
      payload:{status},
      reason:`KYT transition to ${status}`
    });
    if(r.ok)page.reload()
  };

  return <>
    <PageHeader 
      title="KYT — Know Your Team / Member" 
      actions={
        isLeadershipTeam ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold shadow-xs">
            <ShieldCheck className="size-4 text-indigo-600"/>
            Leadership Team Mode (Read-Only)
          </span>
        ) : isTrustee ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold shadow-xs">
            <ShieldCheck className="size-4 text-amber-600"/>
            Trustee Audit Mode (Read-Only)
          </span>
        ) : (
          <button className="btn primary px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-colors min-h-[44px]" onClick={()=>setShow(v=>!v)}>
            Plan KYT
          </button>
        )
      }
    >
      Understand Member businesses, needs and offers; create follow-up connections without replacing canonical Member networking records.
    </PageHeader>

    {isLeadershipTeam && (
      <div className="mb-4 px-4 py-3 bg-indigo-50/80 border border-indigo-200/90 rounded-xl text-indigo-900 text-xs font-medium flex items-center gap-2">
        <ShieldCheck className="size-4 text-indigo-700 shrink-0"/>
        <span>
          <strong>Leadership Read-Only Oversight:</strong> KYT session planning and status updates are managed by Chapter Executive Officers. You have full audit visibility across all chapters.
        </span>
      </div>
    )}

    {isTrustee && (
      <div className="mb-4 px-4 py-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2">
        <ShieldCheck className="size-4 text-amber-700 shrink-0"/>
        <span>
          <strong>Trustee Oversight Notice:</strong> You have read-only audit access across all chapter KYT sessions. Session planning and status transitions are managed by Chapter Leadership.
        </span>
      </div>
    )}

    <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry}/>

    {show && !isReadOnly && (
      <div className="card form-grid two mb-6 p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-field flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">Member</label>
          <select className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px]" value={memberId} onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>setMemberId(e.target.value)}>
            <option value="">Select Member</option>
            {s.members.map(m=><option value={m.id} key={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn primary w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-colors min-h-[44px]" disabled={!memberId||cmd.busy} onClick={()=>void create()}>
            Schedule KYT
          </button>
        </div>
      </div>
    )}

    <div className="row-actions mb-6 flex flex-wrap items-center gap-2">
      <button className="btn px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors min-h-[44px]" onClick={()=>nav('/org/committees?type=KYT')}>KYT Committee</button>
      <Link className="btn px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors min-h-[44px] inline-flex items-center" to="/org/networking">Networking evidence</Link>
    </div>

    <AsyncState loading={page.loading} refreshing={page.refreshing} stale={page.stale} error={page.error} onRetry={page.reload}>
      {page.page?.items.length?(
        <div className="list divide-y divide-slate-200/80 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {page.page.items.map(k=>{
            const currentStatus=k.status||'Planned';
            const next=allowedTransitions('KYT',currentStatus)[0];
            const dateText=k.scheduledAt?new Date(k.scheduledAt).toLocaleString():'Date pending';
            const needsCount=(k.needs??[]).length;
            const offersCount=(k.offers??[]).length;
            const connsCount=(k.potentialConnections??[]).length;
            return <div className="row flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 hover:bg-slate-50/60 transition-colors" key={k.id}>
              <div>
                <b className="font-semibold text-slate-900 text-base">{k.memberName||'Member'}</b>
                <div className="row-meta text-xs text-slate-500 mt-1">{dateText} · needs {needsCount} · offers {offersCount} · potential connections {connsCount}</div>
              </div>
              <div className="row-actions flex flex-wrap items-center gap-2">
                <StatusPill value={currentStatus}/>
                {!isReadOnly&&next&&(
                  <button className="btn primary px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs transition-colors min-h-[44px]" disabled={cmd.busy} onClick={()=>void advance(k,next)}>
                    Move to {next}
                  </button>
                )}
              </div>
            </div>
          })}
        </div>
      ):(
        <EmptyState title="No KYT sessions in this scope" body={isReadOnly?"No KYT sessions have been recorded by chapter leadership in this scope.":"Plan KYT sessions to understand member needs and offers."}/>
      )}
      <CursorPager canPrevious={page.canPrevious} canNext={page.canNext} onPrevious={page.previous} onNext={page.next} totalEstimate={page.page?.totalEstimate}/>
    </AsyncState>
  </>;
}

