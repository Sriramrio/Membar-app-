import type { DynamicFormDefinition, DynamicFormField } from '@/features/control-plane/types';
import { Card } from '@/components/ui/Card';

function FieldPreview({field}:{field:DynamicFormField}){
  const common='min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700';
  if(field.type==='textarea') return <textarea disabled rows={3} className={`${common} py-2`} placeholder={field.placeholder||'Long text response'}/>;
  if(['select','taxonomy','member','business','organisation'].includes(field.type)) return <select disabled className={common}><option>{field.options?.[0]??(field.type==='taxonomy'?`${field.taxonomyDomain??'Configured'} lookup`:`${field.type} lookup`)}</option></select>;
  if(field.type==='multiselect') return <select multiple disabled className={`${common} min-h-24 py-2`}>{(field.options?.length?field.options:['Configured options']).map(x=><option key={x}>{x}</option>)}</select>;
  if(field.type==='radio') return <div className="grid gap-2">{(field.options?.length?field.options:['Option 1','Option 2']).map(x=><label key={x} className="flex items-center gap-2 text-sm"><input disabled type="radio" name={`preview-${field.id}`}/>{x}</label>)}</div>;
  if(['checkbox','declaration','acknowledgement'].includes(field.type)) return <label className="flex items-start gap-2 text-sm text-slate-700"><input disabled type="checkbox" className="mt-1"/><span>{field.placeholder||field.helpText||'Confirmation / acknowledgement'}</span></label>;
  if(field.type==='file'||field.type==='image') return <input disabled type="file" className={`${common} py-2`}/>;
  if(field.type==='address') return <textarea disabled rows={3} className={`${common} py-2`} placeholder="Address"/>;
  if(field.type==='repeater'||field.type==='table') return <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">Repeatable/table structure rendered by its runtime consumer.</div>;
  if(field.type==='hidden') return <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">Hidden runtime field: {String(field.defaultValue??'')}</div>;
  if(field.type==='calculated') return <output className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Calculated at runtime</output>;
  const type=field.type==='datetime'?'datetime-local':field.type==='currency'||field.type==='percentage'?'number':field.type;
  return <input disabled type={type} className={common} placeholder={field.placeholder||`Example ${field.label.toLowerCase()}`}/>;
}

export function FormRuntimePreview({form}:{form:DynamicFormDefinition}){
  const sections=new Map<string,DynamicFormField[]>();
  for(const field of form.fields){const key=field.section?.trim()||'Form fields';const rows=sections.get(key)??[];rows.push(field);sections.set(key,rows)}
  return <Card className="border-sky-200 bg-sky-50/40">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="text-sm font-black uppercase tracking-wide text-sky-700">Non-mutating runtime preview</div><h2 className="mt-1 text-xl font-black text-slate-950">{form.name||'Untitled form'}</h2>{form.description&&<p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{form.description}</p>}</div>
      <div className="rounded-full border border-sky-200 bg-white px-3 py-1 text-sm font-bold text-sky-800">v{form.version} · {form.purpose}</div>
    </div>
    {form.instructions&&<div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{form.instructions}</div>}
    <div className="mt-5 grid gap-5">{[...sections.entries()].map(([section,fields])=><section key={section} className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="font-black text-slate-900">{section}</h3><div className="mt-4 grid gap-4 md:grid-cols-2">{fields.map(field=><div key={field.id} className={field.type==='textarea'||field.type==='address'||field.type==='table'||field.type==='repeater'?'md:col-span-2':''}><label className="grid gap-1.5 text-sm font-bold text-slate-800"><span>{field.label}{field.required&&<span className="ml-1 text-rose-700" aria-label="required">*</span>}</span><FieldPreview field={field}/>{field.helpText&&<span className="text-sm font-normal text-slate-500">{field.helpText}</span>}</label></div>)}</div></section>)}</div>
    {form.confirmationMessage&&<p className="mt-4 text-sm text-slate-500">On successful runtime submission: {form.confirmationMessage}</p>}
    <p className="mt-4 text-sm font-semibold text-slate-500">Preview only. No submission, workflow action or runtime record is created.</p>
  </Card>
}
