import type { DashboardPeriod,DashboardPeriodKey } from './types';
const iso=(d:Date)=>d.toISOString().slice(0,10);
const startOfMonth=(d:Date)=>new Date(d.getFullYear(),d.getMonth(),1);
const endOfMonth=(d:Date)=>new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59,999);
const startOfQuarter=(d:Date)=>new Date(d.getFullYear(),Math.floor(d.getMonth()/3)*3,1);
export function resolveDashboardPeriod(key:DashboardPeriodKey='month',now=new Date(),custom?:{start:string;end:string}):DashboardPeriod{
 let start:Date,end:Date,label:string;
 if(key==='custom'&&custom){start=new Date(`${custom.start}T00:00:00`);end=new Date(`${custom.end}T23:59:59`);label='Custom';}
 else if(key==='last-month'){const ref=new Date(now.getFullYear(),now.getMonth()-1,1);start=startOfMonth(ref);end=endOfMonth(ref);label='Last Month';}
 else if(key==='quarter'){start=startOfQuarter(now);end=new Date(start.getFullYear(),start.getMonth()+3,0,23,59,59);label='Quarter';}
 else if(key==='year'){start=new Date(now.getFullYear(),0,1);end=new Date(now.getFullYear(),11,31,23,59,59);label='Year';}
 else {start=startOfMonth(now);end=now;label='This Month';}
 const span=Math.max(86400000,end.getTime()-start.getTime()+86400000);const comparisonEnd=new Date(start.getTime()-86400000);const comparisonStart=new Date(comparisonEnd.getTime()-span+86400000);
 return{key,label,start:iso(start),end:iso(end),comparisonStart:iso(comparisonStart),comparisonEnd:iso(comparisonEnd)};
}
export const inPeriod=(value:string|undefined,p:Pick<DashboardPeriod,'start'|'end'>)=>Boolean(value&&value.slice(0,10)>=p.start&&value.slice(0,10)<=p.end);
