import type { ChangeEvent } from 'react';

type Props={label:string;value:string;required?:boolean;onChange:(value:string)=>void};

const options=(label:string)=>{
  const x=label.toLowerCase();
  if(/status|stage/.test(x))return ['Draft','Pending review','Approved','Active','Closed'];
  if(/visibility|audience|scope/.test(x))return ['Private','Connections only','Chapter','City','Region','State','Country'];
  if(/category/.test(x))return ['Manufacturing','Industrial Automation','Professional Services','Industrial Supplies','Packaging'];
  if(/type/.test(x))return ['Standard','Member','Business','Event','Operational'];
  if(/state/.test(x))return ['Tamil Nadu','Karnataka','Kerala','Maharashtra'];
  if(/city/.test(x))return ['Hosur','Chennai','Coimbatore','Bengaluru'];
  return null;
};

export function SmartField({label,value,required,onChange}:Props){
  const key=label.toLowerCase();
  const selectOptions=options(label);
  const common='min-h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-sky-600 focus:ring-3 focus:ring-sky-100';
  const textarea=/description|summary|notes|purpose|body|reason|evidence|write-up|agenda|interests/i.test(label);
  const checkbox=/consent|acknowledge|confirmed|agree/i.test(label);
  const date=/date|deadline|expiry|effective/i.test(label);
  const email=/email/i.test(label);
  const phone=/mobile|phone/i.test(label);
  const amount=/fee|amount|budget|value|quantity/i.test(label);
  if(checkbox)return <label className="flex min-h-11 items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={value==='yes'} onChange={e=>onChange(e.target.checked?'yes':'')} className="mt-1 size-4" required={required}/><span>{label}{required&&<span className="text-red-600"> *</span>}</span></label>;
  return <label className={`grid gap-1.5 text-sm font-semibold text-slate-700 ${textarea?'md:col-span-2':''}`}><span>{label}{required&&<span className="text-red-600"> *</span>}</span>{selectOptions?<select required={required} value={value} onChange={(e:ChangeEvent<HTMLSelectElement>)=>onChange(e.target.value)} className={common}><option value="">Select {label.toLowerCase()}</option>{selectOptions.map(item=><option key={item} value={item}>{item}</option>)}</select>:textarea?<textarea required={required} value={value} onChange={e=>onChange(e.target.value)} className="min-h-28 rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-sky-600 focus:ring-3 focus:ring-sky-100" placeholder={`Enter ${label.toLowerCase()}`}/>:<input required={required} value={value} onChange={e=>onChange(e.target.value)} className={common} type={date?'date':email?'email':phone?'tel':amount?'number':'text'} inputMode={phone?'tel':amount?'decimal':undefined} placeholder={date?'':`Enter ${label.toLowerCase()}`}/>}</label>;
}
