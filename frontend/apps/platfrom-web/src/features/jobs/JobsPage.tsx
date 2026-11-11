import{useMemo,useState}from'react';
import{PageHeader,Loading,ErrorNotice,DataTable}from'@/components/Ui';
import{usePlatformQuery}from'@/query/usePlatformQuery';
import{useGovernedCommand}from'@/command/useGovernedCommand';
import{useBootstrap}from'@/bootstrap/BootstrapContext';
import{QUERY_IDS,COMMAND_IDS,PERMISSIONS}from'@/contracts/catalogue';
import type{PlatformJob}from'@/contracts/platform';
import{TabulatorGridAdapter}from'@/components/TabulatorGridAdapter';

interface Result{items:PlatformJob[]}
const commandId=()=>globalThis.crypto?.randomUUID?.()??`cmd-${Date.now()}`;

export function JobsPage(){
  const q=usePlatformQuery<Result>({queryId:QUERY_IDS.jobList,pagination:{pageSize:100}});
  const[selectedId,setSelectedId]=useState<string>();
  const c=useGovernedCommand();
  const{has}=useBootstrap();
  const selected=useMemo(()=>q.data?.items.find(x=>x.id===selectedId)??q.data?.items[0],[q.data,selectedId]);

  async function act(command:string,payload?:Record<string,unknown>){
    if(!selected)return;
    await c.execute({
      commandId:commandId(),
      command,
      aggregateType:'PlatformJob',
      aggregateId:selected.id,
      expectedVersion:(selected as any).version,
      reason:`Governed action ${command}`,
      payload
    });
    q.refresh();
  }

  return (
    <div className="stack">
      <PageHeader title="Background Jobs" description="Operational job monitoring with controlled retry/cancel actions and safe failure summaries."/>
      {c.error&&<ErrorNotice error={c.error} onRetry={c.clear}/>}
      {q.loading?<Loading/>:q.error?<ErrorNotice error={q.error} onRetry={q.refresh}/>:(
        <>
          <DataTable
            label="Background Jobs List"
            selectedId={selected?.id}
            rows={(q.data?.items??[]) as unknown as Record<string,unknown>[]}
            columns={[
              {
                key:'id',
                label:'Job',
                render:r=>(
                  <button
                    type="button"
                    className={`table-code-btn ${selected?.id===r.id?'active':''}`}
                    onClick={()=>setSelectedId(String(r.id))}
                  >
                    {String(r.id)}
                  </button>
                )
              },
              {key:'type',label:'Type'},
              {key:'status',label:'Status'},
              {key:'progress',label:'Progress %'},
              {key:'scope',label:'Scope'},
              {key:'failure',label:'Safe failure'},
              {key:'version',label:'Version'}
            ]}
          />

          {selected&&(
            <section className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  <span>{(selected as any).name??selected.id}</span>
                </div>
                <span className="muted">{selected.id} · version {(selected as any).version??'—'}</span>
              </div>
              <p className="muted">Scope: {String(selected.scope??'—')} · Status: {String(selected.status??'—')}{selected.failure?` · Failure: ${selected.failure}`:''}</p>
              <div className="detail-card-actions">
                {has(PERMISSIONS.jobsManage)&&selected.status==='Failed'&&(
                  <button type="button" className="btn primary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.jobRetry)}>Retry</button>
                )}
                {has(PERMISSIONS.jobsManage)&&['Queued','Running','Retrying'].includes(selected.status)&&(
                  <button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.jobCancel)}>Cancel</button>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}