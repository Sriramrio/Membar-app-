import { telemetry } from '@/services/telemetry/telemetry';

function report(name:string,value:number,unit='ms'){telemetry.info('performance',name,`${name}: ${Math.round(value*100)/100}${unit}`,{value:Math.round(value*100)/100,unit});}
export function installPerformanceMonitoring(){
  if(typeof window==='undefined'||typeof PerformanceObserver==='undefined')return()=>undefined;
  const observers:PerformanceObserver[]=[];
  const observe=(type:string,handler:(entry:PerformanceEntry)=>void)=>{try{const observer=new PerformanceObserver(list=>list.getEntries().forEach(handler));observer.observe({type,buffered:true} as PerformanceObserverInit);observers.push(observer);}catch(error){void error;}}
  observe('navigation',entry=>report('navigation.duration',entry.duration));
  observe('largest-contentful-paint',entry=>report('web-vital.lcp',entry.startTime));
  let lastLongTask=0;
  observe('longtask',entry=>{const now=Date.now();if(now-lastLongTask>1500){lastLongTask=now;report('main-thread.long-task',entry.duration);}});
  let inp=0;
  let inpTimer:ReturnType<typeof setTimeout>|undefined;
  observe('event',entry=>{const row=entry as PerformanceEntry&{interactionId?:number};if((row.interactionId??0)>0&&entry.duration>inp){inp=entry.duration;if(inpTimer)clearTimeout(inpTimer);inpTimer=setTimeout(()=>report('web-vital.inp',inp),600);}});
  let cls=0;
  let clsTimer:ReturnType<typeof setTimeout>|undefined;
  observe('layout-shift',entry=>{const row=entry as PerformanceEntry&{value?:number;hadRecentInput?:boolean};if(!row.hadRecentInput&&typeof row.value==='number'){cls+=row.value;if(clsTimer)clearTimeout(clsTimer);clsTimer=setTimeout(()=>report('web-vital.cls',cls,'score'),600);}});
  return()=>observers.forEach(o=>o.disconnect());
}
