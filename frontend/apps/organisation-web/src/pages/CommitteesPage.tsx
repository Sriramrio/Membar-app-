import {useMemo} from 'react';import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {PageHeader} from '@/components/PageHeader';import {StatusPill} from '@/components/StatusPill';import {AsyncState} from '@/components/AsyncState';import {CursorPager} from '@/components/CursorPager';import {EmptyState} from '@/components/EmptyState';
import {useOrg} from '@/state/OrgStore';import {useDomainCursorPage} from '@/hooks/useDomainCursorPage';import {useRealtimeRefresh} from '@/hooks/useRealtimeRefresh';import {useOrgCommandAction} from '@/hooks/useOrgCommandAction';import {CommandFeedback} from '@/components/CommandFeedback';import type {Committee} from '@/domain/types';
import {authStorage} from '@/utils/authStorage';import {ShieldCheck} from 'lucide-react';

export default function CommitteesPage(){
  const s=useOrg();
  const nav=useNavigate();
  const [params]=useSearchParams();
  const cmd=useOrgCommandAction();
  const isLeadershipTeam=authStorage.isLeadershipTeam();
  const isTrust=authStorage.isTrustUser();
  const isReadOnly=isTrust||isLeadershipTeam;

  const requested=params.get('scopeId');
  const requestedType=params.get('type');
  const requestedUnit=requested?s.units?.find(u=>u.id===requested):undefined;
  const queryScope=requestedUnit?.id??s.scope?.id;
  const local=useMemo(()=>(s.committees||[]).filter(c=>(!requestedUnit||c.scope?.id===requestedUnit.id)&&(!requestedType||c.committeeType===requestedType)),[s.committees,requestedUnit,requestedType]);
  const req=useMemo(()=>({queryId:'org.committees.list',organisationScope:queryScope,pageSize:25,filters:requestedType?[{field:'committeeType',operator:'eq',value:requestedType}]:undefined}),[queryScope,requestedType]);
  const page=useDomainCursorPage<Committee>(req,local,[queryScope]);
  useRealtimeRefresh(['org.committee.*','org.assignment.*'],page.reload);

  const review=async(c:Committee)=>{
    if(isReadOnly) return;
    const result=await cmd.run({commandType:'org.committee.update',aggregateType:'Committee',aggregateId:c.id,expectedVersion:c.version,payload:{status:'Under Review'},reason:'Committee operational review'});
    if(result.ok)page.reload();
  };

  return <>
    <PageHeader 
      title="Working Committees"
      actions={
        isLeadershipTeam ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold shadow-2xs">
            <ShieldCheck className="size-4 text-indigo-600"/>
            <span>Leadership Team Mode (Read-Only Audit)</span>
          </div>
        ) : isTrust ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
            <ShieldCheck className="size-4 text-amber-600"/>
            <span>Trustee Audit Mode (Read-Only)</span>
          </div>
        ) : null
      }
    >
      Mandate → membership → Converse → meetings → actions → outcomes → term closure.
    </PageHeader>
    {isLeadershipTeam && (
      <div className="mb-4 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-3 text-xs shadow-2xs">
        <ShieldCheck className="size-5 text-indigo-600 shrink-0"/>
        <div>
          <span className="font-bold">Leadership Read-Only Oversight: </span>
          <span>Committee management and review workflows are governed by Parivar Executive Officers. You have full read-only governance visibility across all chapters.</span>
        </div>
      </div>
    )}
    <CommandFeedback busy={cmd.busy} slow={cmd.slow} error={cmd.error} onRetry={cmd.retry}/>
    <AsyncState loading={page.loading} refreshing={page.refreshing} stale={page.stale} error={page.error} onRetry={page.reload}>
      {page.page?.items?.length?(
        <div className="list divide-y divide-slate-200/80 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden w-full min-w-0 max-w-full box-border">
          {page.page.items.map(c=>(
            <div className="row flex flex-col md:flex-row md:items-center justify-between p-3.5 sm:p-5 gap-3 sm:gap-4 hover:bg-slate-50/60 transition-colors w-full min-w-0 box-border overflow-hidden" key={c.id}>
              <div className="min-w-0 flex-1">
                <Link className="row-title font-semibold text-slate-900 hover:text-blue-600 transition-colors text-sm sm:text-base truncate block" to={`/org/committees/${c.id}`}>{c.name}</Link>
                <div className="row-meta text-xs text-slate-500 mt-1 break-words">{c.committeeType?.replaceAll('_',' ')??'Working Committee'} · Convener {c.convener} · {c.members?.length ?? 0} members · term ends {c.termEnd}</div>
              </div>
              <div className="row-actions flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 min-w-0">
                <StatusPill value={c.status}/>
                <button className="btn px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors min-h-[38px] sm:min-h-[44px]" onClick={()=>nav(`/org/converse?contextType=Committee&contextId=${encodeURIComponent(c.id)}`)}>Open Converse</button>
                {!isReadOnly && (
                  <button className="btn px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors min-h-[38px] sm:min-h-[44px]" disabled={cmd.busy||c.status==='Under Review'||c.status==='Closed'||c.status==='Archived'} onClick={()=>void review(c)}>Start review</button>
                )}
                <button className="btn primary px-3 sm:px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs transition-colors min-h-[38px] sm:min-h-[44px]" onClick={()=>nav(`/org/committees/${c.id}`)}>Open workspace</button>
              </div>
            </div>
          ))}
        </div>
      ):(
        <EmptyState title="No Working Committees in this scope"/>
      )}
      <CursorPager canPrevious={page.canPrevious} canNext={page.canNext} onPrevious={page.previous} onNext={page.next} totalEstimate={page.page?.totalEstimate}/>
    </AsyncState>
    <div className="card mt-14 p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Committee closure safeguards</h2>
      <p className="text-sm text-slate-600 leading-relaxed">Close or transfer open actions and tasks, preserve historical Converse, record outcomes, archive the term and initialise the next term cleanly.</p>
    </div>
  </>
}
