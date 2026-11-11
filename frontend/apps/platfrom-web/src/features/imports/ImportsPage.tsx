import{useMemo,useState}from'react';
import{PageHeader,Loading,ErrorNotice,DataTable,Pill}from'@/components/Ui';
import{usePlatformQuery}from'@/query/usePlatformQuery';
import{useGovernedCommand}from'@/command/useGovernedCommand';
import{useBootstrap}from'@/bootstrap/BootstrapContext';
import{QUERY_IDS,COMMAND_IDS,PERMISSIONS}from'@/contracts/catalogue';
import type{ImportRun}from'@/contracts/platform';

interface Result{items:ImportRun[]}
const commandId=()=>globalThis.crypto?.randomUUID?.()??`cmd-${Date.now()}`;

export function ImportsPage(){
  const q=usePlatformQuery<Result>({queryId:QUERY_IDS.importList,pagination:{pageSize:100}});
  const[selectedId,setSelectedId]=useState<string>();
  const c=useGovernedCommand();
  const{has}=useBootstrap();
  const selected=useMemo(()=>q.data?.items.find(x=>x.id===selectedId)??q.data?.items[0],[q.data,selectedId]);

  async function act(command:string,payload?:Record<string,unknown>){
    if(!selected)return;
    await c.execute({
      commandId:commandId(),
      command,
      aggregateType:'ImportRun',
      aggregateId:selected.id,
      expectedVersion:(selected as any).version,
      reason:`Governed action ${command}`,
      payload
    });
    q.refresh();
  }

  return (
    <div className="stack">
      <PageHeader
        title="Imports"
        description="Governed asynchronous import lifecycle: validate → preview/stage → review → approve → post → reconcile. No direct canonical-data mutation from the browser."
      />
      {c.error&&<ErrorNotice error={c.error} onRetry={c.clear}/>}
      {q.loading?<Loading/>:q.error?<ErrorNotice error={q.error} onRetry={q.refresh}/>:(
        <>
          <DataTable
            label="Imports List"
            selectedId={selected?.id}
            rows={(q.data?.items??[]) as unknown as Record<string,unknown>[]}
            columns={[
              {
                key:'id',
                label:'Import',
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
              {key:'domain',label:'Domain'},
              {key:'source',label:'Source'},
              {key:'status',label:'Status',render:r=><Pill tone={r.status==='Posted'?'good':r.status==='Failed'?'bad':'warn'}>{String(r.status)}</Pill>},
              {key:'rows',label:'Rows'},
              {key:'invalid',label:'Invalid'},
              {key:'version',label:'Version'}
            ]}
          />

          {selected&&(
            <section className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  <span>{(selected as any).name??selected.id}</span>
                  <Pill tone={selected.status==='Posted'?'good':selected.status==='Failed'?'bad':'warn'}>{selected.status}</Pill>
                </div>
                <span className="muted">{selected.id} · version {(selected as any).version??'—'}</span>
              </div>
              <p className="muted">Domain: {selected.domain} · Source: {selected.source} · Rows: {selected.rows} (Invalid: {selected.invalid})</p>
              <div className="detail-card-actions">
                {has(PERMISSIONS.importManage)&&selected.status==='Validation'&&<button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.importValidate)}>Validate</button>}
                {has(PERMISSIONS.importManage)&&['Validation','Preview'].includes(selected.status)&&<button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.importStage)}>Stage</button>}
                {has(PERMISSIONS.importManage)&&selected.status==='Staged'&&<button type="button" className="btn primary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.importSubmit)}>Submit</button>}
                {has(PERMISSIONS.importReview)&&selected.status==='Pending Review'&&<button type="button" className="btn primary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.importApprove)}>Approve</button>}
                {has(PERMISSIONS.importManage)&&selected.status==='Approved'&&<button type="button" className="btn primary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.importPost)}>Post</button>}
                {has(PERMISSIONS.importManage)&&selected.status==='Posted'&&<button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.importReconcile)}>Reconcile</button>}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
