import{useMemo,useState}from'react';
import{PageHeader,Loading,ErrorNotice,DataTable,Pill}from'@/components/Ui';
import{usePlatformQuery}from'@/query/usePlatformQuery';
import{useGovernedCommand}from'@/command/useGovernedCommand';
import{useBootstrap}from'@/bootstrap/BootstrapContext';
import{QUERY_IDS,COMMAND_IDS,PERMISSIONS}from'@/contracts/catalogue';
import type{DataQualityFinding}from'@/contracts/platform';
import{TabulatorGridAdapter}from'@/components/TabulatorGridAdapter';

interface Result{items:DataQualityFinding[]}
const commandId=()=>globalThis.crypto?.randomUUID?.()??`cmd-${Date.now()}`;

export function DataQualityPage(){
  const q=usePlatformQuery<Result>({queryId:QUERY_IDS.dataQualityList,pagination:{pageSize:100}});
  const[selectedId,setSelectedId]=useState<string>();
  const c=useGovernedCommand();
  const{has}=useBootstrap();
  const selected=useMemo(()=>q.data?.items.find(x=>x.id===selectedId)??q.data?.items[0],[q.data,selectedId]);

  async function act(command:string,payload?:Record<string,unknown>){
    if(!selected)return;
    await c.execute({
      commandId:commandId(),
      command,
      aggregateType:'DataQualityFinding',
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
        title="Data Quality"
        description="Canonical findings and governed remediation lifecycle. Findings are corrected through controlled commands, never direct database editing."
      />
      {c.error&&<ErrorNotice error={c.error} onRetry={c.clear}/>}
      {q.loading?<Loading/>:q.error?<ErrorNotice error={q.error} onRetry={q.refresh}/>:(
        <>
          <DataTable
            label="Data Quality Findings List"
            selectedId={selected?.id}
            rows={(q.data?.items??[]) as unknown as Record<string,unknown>[]}
            columns={[
              {
                key:'id',
                label:'Finding',
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
              {key:'severity',label:'Severity'},
              {key:'status',label:'Status',render:r=><Pill tone={r.status==='Verified'?'good':r.status==='Detected'?'warn':'bad'}>{String(r.status)}</Pill>},
              {key:'sourceWorkspace',label:'Source workspace'},
              {key:'scopeId',label:'Scope'},
              {key:'version',label:'Version'}
            ]}
          />

          {selected&&(
            <section className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  <span>{(selected as any).name??selected.id}</span>
                  <Pill tone={selected.status==='Verified'?'good':selected.status==='Detected'?'warn':'bad'}>{selected.status}</Pill>
                </div>
                <span className="muted">{selected.id} · version {(selected as any).version??'—'}</span>
              </div>
              <p className="muted">Type: {selected.type} · Severity: {selected.severity} · Source: {selected.sourceWorkspace} · Scope: {selected.scopeId}</p>
              <div className="detail-card-actions">
                {has(PERMISSIONS.dataQualityManage)&&['Detected','Triaged'].includes(selected.status)&&(
                  <button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.dataQualityAssign,{owner:'pa-admin-001'})}>Assign</button>
                )}
                {has(PERMISSIONS.dataQualityRemediate)&&['Assigned','Investigating'].includes(selected.status)&&(
                  <button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.dataQualityProposeCorrection,{correction:{mode:'GOVERNED_CORRECTION'}})}>Propose correction</button>
                )}
                {has(PERMISSIONS.dataQualityReview)&&selected.status==='Revalidated'&&(
                  <button type="button" className="btn primary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.dataQualityVerify)}>Verify</button>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}