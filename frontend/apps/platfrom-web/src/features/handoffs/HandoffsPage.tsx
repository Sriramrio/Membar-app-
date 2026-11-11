import{useMemo,useState}from'react';
import{PageHeader,Loading,ErrorNotice,DataTable,Pill}from'@/components/Ui';
import{usePlatformQuery}from'@/query/usePlatformQuery';
import{useGovernedCommand}from'@/command/useGovernedCommand';
import{QUERY_IDS,COMMAND_IDS,PERMISSIONS}from'@/contracts/catalogue';
import{useBootstrap}from'@/bootstrap/BootstrapContext';
import type{HandoffReference}from'@/contracts/platform';

interface R{items:HandoffReference[]}
const cid=()=>globalThis.crypto?.randomUUID?.()??`cmd-${Date.now()}`;

export function HandoffsPage(){
  const q=usePlatformQuery<R>({queryId:QUERY_IDS.handoffList,pagination:{pageSize:100}});
  const[id,setId]=useState<string>();
  const c=useGovernedCommand();
  const{has}=useBootstrap();
  const selected=useMemo(()=>q.data?.items.find(x=>x.id===id)??q.data?.items[0],[q.data,id]);

  async function act(command:string,payload?:Record<string,unknown>){
    if(!selected)return;
    await c.execute({
      commandId:cid(),
      command,
      aggregateType:'Handoff',
      aggregateId:selected.id,
      expectedVersion:selected.version,
      reason:`Technical handoff action ${command}`,
      payload
    });
    q.refresh();
  }

  return (
    <div className="stack">
      <PageHeader
        title="Technical Handoffs"
        description="Platform Administration receives and resolves technical requests without taking ownership of the source Member, Organisation or Governance business record."
      />
      {c.error&&<ErrorNotice error={c.error} onRetry={c.clear}/>}
      {q.loading?<Loading/>:q.error?<ErrorNotice error={q.error} onRetry={q.refresh}/>:(
        <>
          <DataTable
            label="Technical Handoffs List"
            selectedId={selected?.id}
            rows={(q.data?.items??[]) as unknown as Record<string,unknown>[]}
            columns={[
              {
                key:'id',
                label:'Handoff',
                render:r=>(
                  <button
                    type="button"
                    className={`table-code-btn ${selected?.id===r.id?'active':''}`}
                    onClick={()=>setId(String(r.id))}
                  >
                    {String(r.id)}
                  </button>
                )
              },
              {key:'sourceWorkspace',label:'Source'},
              {key:'sourceType',label:'Source type'},
              {key:'requestedCapability',label:'Capability'},
              {key:'status',label:'Status',render:r=><Pill tone={r.status==='Implemented'?'good':'warn'}>{String(r.status)}</Pill>},
              {key:'version',label:'Version'}
            ]}
          />

          {selected&&(
            <section className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  <span>{selected.id}</span>
                  <Pill tone={selected.status==='Implemented'?'good':'warn'}>{selected.status}</Pill>
                </div>
                <span className="muted">v{selected.version} · Source: {selected.sourceWorkspace}</span>
              </div>
              <p>{selected.summary}</p>
              <p className="muted">Source record remains canonical in {selected.sourceWorkspace}.</p>
              <div className="detail-card-actions">
                {has(PERMISSIONS.handoffManage)&&selected.status==='Requested'&&(
                  <button type="button" className="btn primary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.handoffAccept)}>Accept</button>
                )}
                {has(PERMISSIONS.handoffManage)&&selected.status==='Accepted'&&(
                  <button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.handoffAssign,{assignedTo:'pa-admin-001'})}>Assign</button>
                )}
                {has(PERMISSIONS.handoffManage)&&selected.status==='Assigned'&&(
                  <button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.handoffStart)}>Start</button>
                )}
                {has(PERMISSIONS.handoffReview)&&selected.status==='Implemented'&&(
                  <button type="button" className="btn primary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.handoffVerify)}>Verify</button>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
