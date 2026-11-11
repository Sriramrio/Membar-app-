import{useMemo,useState}from'react';
import{PageHeader,Loading,ErrorNotice,DataTable,Pill}from'@/components/Ui';
import{usePlatformQuery}from'@/query/usePlatformQuery';
import{useGovernedCommand}from'@/command/useGovernedCommand';
import{useBootstrap}from'@/bootstrap/BootstrapContext';
import{QUERY_IDS,COMMAND_IDS,PERMISSIONS}from'@/contracts/catalogue';
import type{ExportRun}from'@/contracts/platform';

interface Result{items:ExportRun[]}
const commandId=()=>globalThis.crypto?.randomUUID?.()??`cmd-${Date.now()}`;

export function ExportsPage(){
  const q=usePlatformQuery<Result>({queryId:QUERY_IDS.exportList,pagination:{pageSize:100}});
  const[selectedId,setSelectedId]=useState<string>();
  const c=useGovernedCommand();
  const{has}=useBootstrap();
  const selected=useMemo(()=>q.data?.items.find(x=>x.id===selectedId)??q.data?.items[0],[q.data,selectedId]);

  async function act(command:string,payload?:Record<string,unknown>){
    if(!selected)return;
    await c.execute({
      commandId:commandId(),
      command,
      aggregateType:'ExportRun',
      aggregateId:selected.id,
      expectedVersion:(selected as any).version,
      reason:`Governed action ${command}`,
      payload
    });
    q.refresh();
  }

  return (
    <div className="stack">
      <PageHeader title="Exports" description="Governed export jobs. Sensitive exports are audited and use expiring server-generated artifacts."/>
      {c.error&&<ErrorNotice error={c.error} onRetry={c.clear}/>}
      {q.loading?<Loading/>:q.error?<ErrorNotice error={q.error} onRetry={q.refresh}/>:(
        <>
          <DataTable
            label="Exports List"
            selectedId={selected?.id}
            rows={(q.data?.items??[]) as unknown as Record<string,unknown>[]}
            columns={[
              {
                key:'id',
                label:'Export',
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
              {key:'reportType',label:'Report'},
              {key:'scopeId',label:'Scope'},
              {key:'status',label:'Status',render:r=><Pill tone={r.status==='Ready'?'good':r.status==='Cancelled'?'bad':'warn'}>{String(r.status)}</Pill>},
              {key:'sensitive',label:'Sensitive'},
              {key:'expiresAt',label:'Expires'},
              {key:'version',label:'Version'}
            ]}
          />

          {selected&&(
            <section className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  <span>{(selected as any).name??selected.id}</span>
                  <Pill tone={selected.status==='Ready'?'good':selected.status==='Cancelled'?'bad':'warn'}>{selected.status}</Pill>
                </div>
                <span className="muted">{selected.id} · version {(selected as any).version??'—'}</span>
              </div>
              <p className="muted">Report: {selected.reportType} · Scope: {selected.scopeId} · Expires: {selected.expiresAt}</p>
              <div className="detail-card-actions">
                {has(PERMISSIONS.exportManage)&&!['Ready','Downloaded','Expired','Cancelled'].includes(selected.status)&&(
                  <button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.exportCancel)}>Cancel</button>
                )}
                {has(PERMISSIONS.exportManage)&&selected.status==='Ready'&&(
                  <button type="button" className="btn primary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.exportMarkDownloaded)}>Record download</button>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
