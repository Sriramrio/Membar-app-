import{useMemo,useState}from'react';
import{PageHeader,Loading,ErrorNotice,DataTable,Pill,CommandFeedback,Modal}from'@/components/Ui';
import{usePlatformQuery}from'@/query/usePlatformQuery';
import{useGovernedCommand}from'@/command/useGovernedCommand';
import{useBootstrap}from'@/bootstrap/BootstrapContext';
import{QUERY_IDS,COMMAND_IDS,PERMISSIONS}from'@/contracts/catalogue';
import type{FormDefinition,FormValidationResult}from'@/contracts/platform';

interface Result{items:FormDefinition[]}
const id=()=>globalThis.crypto?.randomUUID?.()??`cmd-${Date.now()}`;

export function FormsPage(){
  const q=usePlatformQuery<Result>({queryId:QUERY_IDS.formList,pagination:{pageSize:100}});
  const[selectedId,setSelectedId]=useState<string>();
  const[showCreate,setShowCreate]=useState(false);
  const c=useGovernedCommand();
  const{has}=useBootstrap();
  const[code,setCode]=useState('');
  const[name,setName]=useState('');
  const[fieldKey,setFieldKey]=useState('');
  const[fieldLabel,setFieldLabel]=useState('');
  const[fieldType,setFieldType]=useState('TEXT');
  const[privacy,setPrivacy]=useState('INTERNAL');
  const[selected]=[useMemo(()=>q.data?.items.find(x=>x.id===selectedId)??q.data?.items[0],[q.data,selectedId])];
  const validation=usePlatformQuery<FormValidationResult>({queryId:QUERY_IDS.formValidate,parameters:{id:selected?.id}},Boolean(selected));

  async function act(command:string){
    if(!selected)return;
    const r=await c.execute({
      commandId:id(),
      command,
      aggregateType:'FormDefinition',
      aggregateId:selected.id,
      expectedVersion:selected.version,
      reason:`Governed form action ${command}`
    });
    if(r){q.refresh();validation.refresh()}
  }

  async function create(){
    if(!code.trim()||!name.trim()||!fieldKey.trim()||!fieldLabel.trim())return;
    const r=await c.execute({
      commandId:id(),
      command:COMMAND_IDS.formPropose,
      aggregateType:'FormDefinition',
      reason:'Create governed form draft',
      payload:{
        code:code.trim().toUpperCase(),
        name:name.trim(),
        consumerWorkspaces:['MEMBER'],
        fields:[{key:fieldKey.trim(),label:fieldLabel.trim(),type:fieldType,privacyClassification:privacy,required:true}]
      }
    });
    if(r){setCode('');setName('');setFieldKey('');setFieldLabel('');setShowCreate(false);q.refresh()}
  }

  return (
    <div className="stack">
      <PageHeader
        title="Forms"
        description="Versioned form definitions. Platform Administration owns schemas; consumer workspaces own submissions. Published versions are immutable."
        actions={has(PERMISSIONS.formsManage)&&<button type="button" className="btn primary" onClick={()=>setShowCreate(true)}>Create draft form</button>}
      />
      <CommandFeedback busy={c.busy} result={c.result} error={c.error} onClear={c.clear}/>
      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Create Draft Form">
        <div className="form-grid">
          <label className="field"><span className="label">Code</span><input className="input" value={code} onChange={e=>setCode(e.target.value)} placeholder="e.g. MEMBER_PROFILE"/></label>
          <label className="field"><span className="label">Name</span><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Form title"/></label>
          <label className="field"><span className="label">First field key</span><input className="input" value={fieldKey} onChange={e=>setFieldKey(e.target.value)} placeholder="e.g. bio"/></label>
          <label className="field"><span className="label">Field label</span><input className="input" value={fieldLabel} onChange={e=>setFieldLabel(e.target.value)} placeholder="Field display label"/></label>
          <label className="field">
            <span className="label">Field type</span>
            <select className="select" value={fieldType} onChange={e=>setFieldType(e.target.value)}>
              <option>TEXT</option><option>TEXTAREA</option><option>NUMBER</option><option>DATE</option><option>BOOLEAN</option><option>SELECT</option><option>MULTI_SELECT</option><option>EMAIL</option><option>PHONE</option>
            </select>
          </label>
          <label className="field">
            <span className="label">Privacy</span>
            <select className="select" value={privacy} onChange={e=>setPrivacy(e.target.value)}>
              <option>PUBLIC</option><option>INTERNAL</option><option>CONFIDENTIAL</option><option>SENSITIVE</option>
            </select>
          </label>
        </div>
        <p className="muted">Advanced field editing remains governed by versioned form commands; this closure UI provides an accessible non-drag creation path.</p>
        <div className="modal-footer">
          <button type="button" className="btn secondary" onClick={()=>setShowCreate(false)}>Cancel</button>
          <button type="button" className="btn primary" disabled={c.busy||!code||!name||!fieldKey||!fieldLabel} onClick={create}>Create draft</button>
        </div>
      </Modal>

      {q.loading?<Loading/>:q.error?<ErrorNotice error={q.error} onRetry={q.refresh}/>:(
        <>
          <DataTable
            label="Forms List"
            selectedId={selected?.id}
            rows={(q.data?.items??[]) as unknown as Record<string,unknown>[]}
            columns={[
              {
                key:'id',
                label:'Form',
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
              {key:'code',label:'Code'},
              {key:'name',label:'Name'},
              {key:'status',label:'Status',render:r=><Pill tone={r.status==='Published'?'good':'warn'}>{String(r.status)}</Pill>},
              {key:'currentVersion',label:'Published version'},
              {key:'version',label:'Record version'}
            ]}
          />

          {selected&&(
            <section className="detail-card">
              <div className="detail-card-head">
                <div className="title">
                  <span>{selected.name}</span>
                  <Pill tone={selected.status==='Published'?'good':'warn'}>{String(selected.status)}</Pill>
                </div>
                <span className="muted">{selected.code} · consumers {(selected.consumerWorkspaces??[]).join(', ')||'—'} · versions {selected.versions.length} · {selected.id}</span>
              </div>
              {selected.versions.at(-1)?.fields?.length?(
                <DataTable
                  label="Current form fields"
                  rows={selected.versions.at(-1)!.fields as unknown as Record<string,unknown>[]}
                  columns={[
                    {key:'key',label:'Key'},
                    {key:'label',label:'Label'},
                    {key:'type',label:'Type'},
                    {key:'required',label:'Required'},
                    {key:'privacyClassification',label:'Privacy'}
                  ]}
                />
              ):null}
              {validation.data&&(
                <div className={validation.data.valid?'notice success':'notice error'}>
                  Definition validation: {validation.data.valid?'PASS':'BLOCKED'}
                  {validation.data.errors.length>0&&<div>{validation.data.errors.join(' · ')}</div>}
                </div>
              )}
              <div className="detail-card-actions">
                {has(PERMISSIONS.formsManage)&&selected.status!=='Retired'&&<button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.formValidate)}>Validate</button>}
                {has(PERMISSIONS.formsPublish)&&selected.status==='Draft'&&<button type="button" className="btn primary" disabled={c.busy||Boolean(validation.data&&!validation.data.valid)} onClick={()=>act(COMMAND_IDS.formPublish)}>Publish</button>}
                {has(PERMISSIONS.formsManage)&&selected.status==='Published'&&<button type="button" className="btn secondary" disabled={c.busy} onClick={()=>act(COMMAND_IDS.formSupersede)}>Supersede</button>}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
