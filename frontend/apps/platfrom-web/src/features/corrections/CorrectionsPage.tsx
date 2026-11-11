import{useMemo,useState}from'react';
import{PageHeader,Loading,ErrorNotice,DataTable,Pill}from'@/components/Ui';
import{usePlatformQuery}from'@/query/usePlatformQuery';
import{useGovernedCommand}from'@/command/useGovernedCommand';
import{useBootstrap}from'@/bootstrap/BootstrapContext';
import{QUERY_IDS,COMMAND_IDS,PERMISSIONS}from'@/contracts/catalogue';
import type{TechnicalCorrection}from'@/contracts/platform';

interface Result{items:TechnicalCorrection[]}
const commandId=()=>globalThis.crypto?.randomUUID?.()??`cmd-${Date.now()}`;

export function CorrectionsPage(){
  const q=usePlatformQuery<Result>({queryId:QUERY_IDS.correctionList,pagination:{pageSize:100}});
  const[selectedId,setSelectedId]=useState<string>();
  const c=useGovernedCommand();
  const{has}=useBootstrap();
  const selected=useMemo(()=>q.data?.items.find(x=>x.id===selectedId)??q.data?.items[0],[q.data,selectedId]);

  async function act(command:string,payload?:Record<string,unknown>){
    if(!selected)return;
    await c.execute({
      commandId:commandId(),
      command,
      aggregateType:'TechnicalCorrection',
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
        title="Technical Corrections"
        description="Governed correction commands with before/after values, reason, impact, approval and independent verification. There is no arbitrary database-row editor."
      />
      {c.error&&<ErrorNotice error={c.error} onRetry={c.clear}/>}
      {q.loading?<Loading/>:q.error?<ErrorNotice error={q.error} onRetry={q.refresh}/>:(
        <>
          <DataTable
            label="Technical Corrections List"
            selectedId={selected?.id}
            rows={(q.data?.items??[]) as unknown as Record<string,unknown>[]}
            columns={[
              {
                key:'id',
                label:'Correction',
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
              {key:'entityType',label:'Entity type'},
              {key:'entityId',label:'Entity'},
              {key:'status',label:'Status',render:r=><Pill tone={r.status==='Applied'?'good':r.status==='Draft'?'warn':'bad'}>{String(r.status)}</Pill>},
              {key:'proposedBy',label:'Proposed by'},
              {key:'version',label:'Version'}
            ]}
          />

          {selected&&(
            <section className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  <span>{(selected as any).name??selected.id}</span>
                  <Pill tone={selected.status==='Applied'?'good':selected.status==='Draft'?'warn':'bad'}>{selected.status}</Pill>
                </div>
                <span className="muted">{selected.id} · version {(selected as any).version??'—'}</span>
              </div>
              <p className="muted">Entity: {selected.entityType} ({selected.entityId}) · Proposed by: {selected.proposedBy}</p>
              <div className="detail-card-actions">
                {has(PERMISSIONS.correctionManage)&&selected.status==='Draft'&&(
                  <button type="button" className="btn primary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.correctionSubmit)}>Submit</button>
                )}
                {has(PERMISSIONS.correctionReview)&&selected.status==='Pending Review'&&(
                  <button type="button" className="btn primary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.correctionApprove)}>Approve</button>
                )}
                {has(PERMISSIONS.correctionManage)&&selected.status==='Approved'&&(
                  <button type="button" className="btn primary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.correctionApply)}>Apply</button>
                )}
                {has(PERMISSIONS.correctionReview)&&selected.status==='Applied'&&(
                  <button type="button" className="btn primary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.correctionVerify)}>Verify</button>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
