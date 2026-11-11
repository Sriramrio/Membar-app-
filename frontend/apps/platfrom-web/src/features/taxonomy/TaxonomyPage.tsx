import{useMemo,useState}from'react';
import{PageHeader,Loading,ErrorNotice,DataTable,Pill}from'@/components/Ui';
import{usePlatformQuery}from'@/query/usePlatformQuery';
import{useGovernedCommand}from'@/command/useGovernedCommand';
import{useBootstrap}from'@/bootstrap/BootstrapContext';
import{QUERY_IDS,COMMAND_IDS,PERMISSIONS}from'@/contracts/catalogue';
import type{TaxonomyNode,TaxonomyImpactResult}from'@/contracts/platform';

interface TaxonomyPageResult{items:TaxonomyNode[]}
const cmdId=()=>globalThis.crypto?.randomUUID?.()??`cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function TaxonomyPage(){
  const q=usePlatformQuery<TaxonomyPageResult>({
    queryId:QUERY_IDS.taxonomyList,
    pagination:{pageSize:100},
    sort:[{field:'family',direction:'asc'},{field:'name',direction:'asc'}]
  });
  const[selectedId,setSelectedId]=useState<string>();
  const command=useGovernedCommand();
  const{has}=useBootstrap();
  const selected=useMemo(()=>q.data?.items.find(x=>x.id===selectedId)??q.data?.items[0],[q.data,selectedId]);
  const impact=usePlatformQuery<TaxonomyImpactResult>({queryId:QUERY_IDS.taxonomyImpact,parameters:{id:selected?.id}},Boolean(selected));

  async function act(name:string,payload?:Record<string,unknown>){
    if(!selected)return;
    try{
      await command.execute({
        commandId:cmdId(),
        command:name,
        aggregateType:'TaxonomyNode',
        aggregateId:selected.id,
        expectedVersion:selected.version,
        reason:`Platform Administration taxonomy action: ${name}`,
        payload
      });
      q.refresh();
      impact.refresh();
    }catch{/* structured command state renders the failure */}
  }

  const children=(q.data?.items??[]).filter(x=>x.parentId===selected?.id);

  return (
    <div className="stack">
      <PageHeader
        title="Taxonomy"
        description="Canonical, versioned Platform Administration taxonomy. Business Sector → Segment → Specialisation is managed here; consumer workspaces reference published nodes but do not own this definition."
      />
      {command.error&&<ErrorNotice error={command.error} onRetry={command.clear}/>}
      {command.result&&<div className="notice">Taxonomy command accepted · version {String(command.result.version??'—')} · audit {command.result.auditId??'—'}</div>}
      {q.loading?<Loading/>:q.error?<ErrorNotice error={q.error} onRetry={q.refresh}/>:(
        <>
          <DataTable
            label="Taxonomy nodes"
            selectedId={selected?.id}
            rows={(q.data?.items??[]) as unknown as Record<string,unknown>[]}
            columns={[
              {
                key:'id',
                label:'Node',
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
              {key:'family',label:'Family'},
              {key:'code',label:'Code'},
              {key:'name',label:'Name'},
              {key:'parentId',label:'Parent'},
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
                <span className="muted">{selected.family} · {selected.code} · v{selected.version}</span>
              </div>
              <p className="muted">Parent: {selected.parentId??'—'} · Children: {children.length} · Synonyms: {(selected.synonyms??[]).join(', ')||'—'}</p>
              {impact.loading?<Loading label="Checking taxonomy impact…"/>:impact.error?<ErrorNotice error={impact.error} onRetry={impact.refresh}/>:impact.data&&(
                <div className="notice">Retirement readiness: <strong>{impact.data.canRetire?'No blocking dependency detected':'Blocked'}</strong> · children {impact.data.children} · known references {impact.data.referencedBy}{impact.data.blockingReasons.length>0&&<div className="muted">{impact.data.blockingReasons.join(' · ')}</div>}</div>
              )}
              <div className="detail-card-actions">
                {selected.status==='Active'&&has(PERMISSIONS.taxonomyManage)&&(
                  <button type="button" className="btn secondary" disabled={command.busy} onClick={()=>act(COMMAND_IDS.taxonomySupersede)}>Supersede</button>
                )}
                {selected.status!=='Retired'&&has(PERMISSIONS.taxonomyManage)&&(
                  <button type="button" className="btn danger" disabled={command.busy||Boolean(impact.data&&!impact.data.canRetire)} onClick={()=>act(COMMAND_IDS.taxonomyRetire)}>Retire</button>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}