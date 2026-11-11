import{useMemo,useState}from'react';
import{PageHeader,Loading,ErrorNotice,DataTable,Pill,CommandFeedback,Modal}from'@/components/Ui';
import{usePlatformQuery}from'@/query/usePlatformQuery';
import{useGovernedCommand}from'@/command/useGovernedCommand';
import{useBootstrap}from'@/bootstrap/BootstrapContext';
import{QUERY_IDS,COMMAND_IDS,PERMISSIONS}from'@/contracts/catalogue';
import type{WorkflowDefinition,WorkflowValidationResult}from'@/contracts/platform';

interface R{items:WorkflowDefinition[]}
const id=()=>globalThis.crypto?.randomUUID?.()??`cmd-${Date.now()}`;

export function WorkflowsPage(){
  const q=usePlatformQuery<R>({queryId:QUERY_IDS.workflowList,pagination:{pageSize:100}});
  const[sel,setSel]=useState<string>();
  const[showCreate,setShowCreate]=useState(false);
  const c=useGovernedCommand();
  const{has}=useBootstrap();
  const[code,setCode]=useState('');
  const[name,setName]=useState('');
  const[permission,setPermission]=useState('platform.workflow.read');
  const x=useMemo(()=>q.data?.items.find(i=>i.id===sel)??q.data?.items[0],[q.data,sel]);
  const v=usePlatformQuery<WorkflowValidationResult>({queryId:QUERY_IDS.workflowValidate,parameters:{id:x?.id}},Boolean(x));

  async function act(command:string){
    if(!x)return;
    const r=await c.execute({
      commandId:id(),
      command,
      aggregateType:'WorkflowDefinition',
      aggregateId:x.id,
      expectedVersion:x.version,
      reason:`Governed workflow action ${command}`
    });
    if(r){q.refresh();v.refresh()}
  }

  async function create(){
    if(!code.trim()||!name.trim()||!permission.trim())return;
    const r=await c.execute({
      commandId:id(),
      command:COMMAND_IDS.workflowPropose,
      aggregateType:'WorkflowDefinition',
      reason:'Create governed workflow draft',
      payload:{
        code:code.trim().toUpperCase(),
        name:name.trim(),
        consumerWorkspaces:['ORGANISATION'],
        states:[{code:'DRAFT',name:'Draft',initial:true},{code:'CLOSED',name:'Closed',terminal:true}],
        transitions:[{code:'CLOSE',from:'DRAFT',to:'CLOSED',permission:permission.trim(),reasonRequired:true}]
      }
    });
    if(r){setCode('');setName('');setShowCreate(false);q.refresh()}
  }

  return (
    <div className="stack">
      <PageHeader
        title="Workflows"
        description="Versioned workflow definitions. Consumer workspaces execute instances; Platform Administration governs states, transitions, permissions, RACI, SoD, SLA and notifications."
        actions={has(PERMISSIONS.workflowManage)&&<button type="button" className="btn primary" onClick={()=>setShowCreate(true)}>Create draft workflow</button>}
      />
      <CommandFeedback busy={c.busy} result={c.result} error={c.error} onClear={c.clear}/>
      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Create Draft Workflow">
        <div className="form-grid">
          <label className="field"><span className="label">Code</span><input className="input" value={code} onChange={e=>setCode(e.target.value)} placeholder="e.g. WF_APPROVAL"/></label>
          <label className="field"><span className="label">Name</span><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Workflow title"/></label>
          <label className="field"><span className="label">Initial transition permission</span><input className="input" value={permission} onChange={e=>setPermission(e.target.value)} placeholder="e.g. platform.workflow.read"/></label>
        </div>
        <p className="muted">The initial draft is created with one initial and one terminal state so it is structurally valid and can then be versioned by backend workflow-definition commands.</p>
        <div className="modal-footer">
          <button type="button" className="btn secondary" onClick={()=>setShowCreate(false)}>Cancel</button>
          <button type="button" className="btn primary" disabled={c.busy||!code||!name||!permission} onClick={create}>Create draft</button>
        </div>
      </Modal>
      {q.loading?<Loading/>:q.error?<ErrorNotice error={q.error} onRetry={q.refresh}/>:(
        <>
          <DataTable
            label="Workflows List"
            selectedId={x?.id}
            rows={(q.data?.items??[]) as unknown as Record<string,unknown>[]}
            columns={[
              {
                key:'id',
                label:'Workflow',
                render:r=>(
                  <button
                    type="button"
                    className={`table-code-btn ${x?.id===r.id?'active':''}`}
                    onClick={()=>setSel(String(r.id))}
                  >
                    {String(r.id)}
                  </button>
                )
              },
              {key:'code',label:'Code'},
              {key:'name',label:'Name'},
              {key:'status',label:'Status',render:r=><Pill tone={r.status==='Published'?'good':'warn'}>{String(r.status)}</Pill>},
              {key:'currentVersion',label:'Version'}
            ]}
          />

          {x&&(
            <section className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  <span>{x.name}</span>
                  <Pill tone={x.status==='Published'?'good':'warn'}>{String(x.status)}</Pill>
                </div>
                <span className="muted">Consumers {(x.consumerWorkspaces??[]).join(', ')||'—'} · published version {x.currentVersion} · {x.id}</span>
              </div>
              {x.versions.at(-1)?.states?.length?(
                <>
                  <h3 style={{margin:'12px 0 6px',fontSize:'14px',fontWeight:700}}>States</h3>
                  <DataTable label="Workflow states" rows={x.versions.at(-1)!.states as unknown as Record<string,unknown>[]} columns={[{key:'code',label:'Code'},{key:'name',label:'Name'},{key:'initial',label:'Initial'},{key:'terminal',label:'Terminal'}]}/>
                  <h3 style={{margin:'16px 0 6px',fontSize:'14px',fontWeight:700}}>Transitions</h3>
                  <DataTable label="Workflow transitions" rows={x.versions.at(-1)!.transitions as unknown as Record<string,unknown>[]} columns={[{key:'code',label:'Code'},{key:'from',label:'From'},{key:'to',label:'To'},{key:'permission',label:'Permission'},{key:'raciKey',label:'RACI'},{key:'slaPolicyId',label:'SLA'}]}/>
                </>
              ):null}
              {v.data&&(
                <div className={v.data.valid?'notice success':'notice error'}>
                  Workflow validation: {v.data.valid?'PASS':'BLOCKED'}
                  {v.data.errors.length>0&&<div>{v.data.errors.join(' · ')}</div>}
                </div>
              )}
              <div className="detail-card-actions">
                {has(PERMISSIONS.workflowManage)&&<button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.workflowValidate)}>Validate</button>}
                {has(PERMISSIONS.workflowPublish)&&x.status==='Draft'&&<button type="button" className="btn primary" disabled={c.busy||Boolean(v.data&&!v.data.valid)} onClick={()=>act(COMMAND_IDS.workflowPublish)}>Publish</button>}
                {has(PERMISSIONS.workflowManage)&&x.status==='Published'&&<button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.workflowSupersede)}>Supersede</button>}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
