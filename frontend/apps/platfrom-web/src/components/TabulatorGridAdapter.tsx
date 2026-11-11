import{useEffect,useMemo,useRef,useState}from'react';
import{EnterpriseDataTable,type EnterpriseColumn}from'@/components/EnterpriseDataTable';

type Row=Record<string,unknown>;
type TabulatorInstance={destroy?:()=>void;replaceData?:(rows:Row[])=>void};
type TabulatorCtor=new(el:HTMLElement,options:Record<string,unknown>)=>TabulatorInstance;
declare global{interface Window{Tabulator?:TabulatorCtor}}

/**
 * Progressive Tabulator adapter.
 * - No CDN loading and no hidden network dependency.
 * - If an approved Tabulator runtime is supplied by the host, it upgrades.
 * - Otherwise the accessible EnterpriseDataTable remains fully functional.
 */
export function TabulatorGridAdapter({rows,columns,label='Data grid',pageSize=25}:{rows:Row[];columns:EnterpriseColumn[];label?:string;pageSize?:number}){
  const host=useRef<HTMLDivElement>(null);const instance=useRef<TabulatorInstance|undefined>(undefined);const[enhanced,setEnhanced]=useState(false);
  const tabulatorColumns=useMemo(()=>columns.map(c=>({title:c.label,field:c.key,headerSort:c.sortable!==false,responsive:c.hideBelow==='sm'?1:c.hideBelow==='md'?2:c.hideBelow==='lg'?3:0})),[columns]);
  useEffect(()=>{if(!host.current||!window.Tabulator){setEnhanced(false);return;}instance.current=new window.Tabulator(host.current,{data:rows,layout:'fitColumns',responsiveLayout:'collapse',pagination:true,paginationMode:'local',paginationSize:pageSize,movableColumns:false,columns:tabulatorColumns,placeholder:'No records',height:'auto'});setEnhanced(true);return()=>{instance.current?.destroy?.();instance.current=undefined;setEnhanced(false)}},[pageSize,tabulatorColumns]);
  useEffect(()=>{if(enhanced)instance.current?.replaceData?.(rows)},[rows,enhanced]);
  if(!enhanced)return <EnterpriseDataTable rows={rows} columns={columns} label={label} pageSize={pageSize}/>;
  return <div className="tabulator-host" role="region" aria-label={`${label} enhanced data grid`} ref={host}/>;
}
