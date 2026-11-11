export function StatusPill({value}:{value?:string}){const val=value||'UNKNOWN';const c=val.toLowerCase().replace(/[^a-z]+/g,'-');return <span className={`status status-${c} inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold capitalize transition-colors border shadow-2xs`}>{val.replaceAll('_',' ')}</span>;}

