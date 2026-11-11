import{useMemo,useState}from'react';
import{PageHeader,Loading,ErrorNotice,DataTable,Pill}from'@/components/Ui';
import{usePlatformQuery}from'@/query/usePlatformQuery';
import{useGovernedCommand}from'@/command/useGovernedCommand';
import{useBootstrap}from'@/bootstrap/BootstrapContext';
import{QUERY_IDS,COMMAND_IDS,PERMISSIONS}from'@/contracts/catalogue';
import type{ReferenceDataItem,ReferenceDataImpactResult}from'@/contracts/platform';

interface Result{items:ReferenceDataItem[]}
const cmdId=()=>globalThis.crypto?.randomUUID?.()??`cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function ReferenceDataPage(){
  const q=usePlatformQuery<Result>({
    queryId:QUERY_IDS.referenceDataList,
    pagination:{pageSize:100},
    sort:[{field:'domain',direction:'asc'},{field:'code',direction:'asc'}]
  });
  const[selectedId,setSelectedId]=useState<string>();
  const command=useGovernedCommand();
  const{has}=useBootstrap();
  const selected=useMemo(()=>q.data?.items.find(x=>x.id===selectedId)??q.data?.items[0],[q.data,selectedId]);
  const impact=usePlatformQuery<ReferenceDataImpactResult>({queryId:QUERY_IDS.referenceDataImpact,parameters:{id:selected?.id}},Boolean(selected));

  async function act(name:string,payload?:Record<string,unknown>){
    if(!selected)return;
    await command.execute({
      commandId:cmdId(),
      command:name,
      aggregateType:'ReferenceDataItem',
      aggregateId:selected.id,
      expectedVersion:selected.version,
      reason:`Platform Administration reference-data action: ${name}`,
      payload
    });
    q.refresh();
    impact.refresh();
  }

  return (
    <div className="stack">
      <PageHeader
        title="Reference Data"
        description="Governed external/general reference values with provenance, source version and lifecycle history. Reference codes remain stable for consumers."
      />
      {command.error&&<ErrorNotice error={command.error} onRetry={command.clear}/>}
      {command.result&&<div className="notice">Reference-data command accepted · version {String(command.result.version??'—')} · audit {command.result.auditId??'—'}</div>}
      {q.loading?<Loading/>:q.error?<ErrorNotice error={q.error} onRetry={q.refresh}/>:(
        <>
          <DataTable
            label="Reference Data List"
            selectedId={selected?.id}
            rows={(q.data?.items??[]) as unknown as Record<string,unknown>[]}
            columns={[
              {
                key:'id',
                label:'Item',
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
              {key:'code',label:'Stable code'},
              {key:'name',label:'Name'},
              {key:'source',label:'Source'},
              {key:'sourceVersion',label:'Source version'},
              {key:'status',label:'Status',render:r=><Pill tone={r.status==='Active'?'good':r.status==='Retired'?'bad':'warn'}>{String(r.status)}</Pill>},
              {key:'version',label:'Version'}
            ]}
          />

          {selected&&(
            <section className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  <span>{selected.name}</span>
                  <Pill tone={selected.status==='Active'?'good':selected.status==='Retired'?'bad':'warn'}>{selected.status}</Pill>
                </div>
                <span className="muted">{selected.domain} · {selected.code} · {selected.source} · v{selected.version}</span>
              </div>
              {impact.data&&(
                <div className="notice">
                  Known references: {impact.data.referencedBy} · retirement {impact.data.canRetire?'available':'blocked'}
                  {impact.data.blockingReasons.length>0&&<div className="muted">{impact.data.blockingReasons.join(' · ')}</div>}
                </div>
              )}
              <div className="detail-card-actions">
                {selected.status==='Active'&&has(PERMISSIONS.referenceDataManage)&&(
                  <button type="button" className="btn secondary" disabled={command.busy} onClick={()=>act(COMMAND_IDS.referenceDataSupersede)}>Supersede</button>
                )}
                {selected.status!=='Retired'&&has(PERMISSIONS.referenceDataManage)&&(
                  <button type="button" className="btn danger" disabled={command.busy||Boolean(impact.data&&!impact.data.canRetire)} onClick={()=>act(COMMAND_IDS.referenceDataRetire)}>Retire</button>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}