import {telemetry} from './telemetry';
let initialized=false;
export function initWebTelemetry(){
  if(initialized||typeof window==='undefined')return;
  initialized=true;
  window.addEventListener('error',e=>telemetry.emit({level:'error',category:'ui',name:'window.error',data:{message:e.message,source:e.filename,line:e.lineno,column:e.colno}}));
  window.addEventListener('unhandledrejection',e=>telemetry.emit({level:'error',category:'ui',name:'promise.unhandled',data:{reason:String(e.reason)}}));
  if(typeof PerformanceObserver==='undefined')return;
  try{
    const observer=new PerformanceObserver(list=>{
      for(const entry of list.getEntries()){
        if(entry.entryType==='largest-contentful-paint')telemetry.emit({level:'info',category:'web-vital',name:'LCP',data:{value:Math.round(entry.startTime)}});
        if(entry.entryType==='layout-shift'){
          const shift=entry as PerformanceEntry&{value?:number;hadRecentInput?:boolean};
          if(!shift.hadRecentInput)telemetry.emit({level:'info',category:'web-vital',name:'CLS.sample',data:{value:shift.value??0}});
        }
        if(entry.entryType==='event'&&entry.duration>0){
          const eventEntry=entry as PerformanceEntry&{interactionId?:number};
          telemetry.emit({level:'info',category:'web-vital',name:'INP.sample',data:{duration:Math.round(entry.duration),interactionId:eventEntry.interactionId??0}});
        }
        if(entry.entryType==='longtask')telemetry.emit({level:'warning',category:'performance',name:'longtask',data:{duration:Math.round(entry.duration)}});
      }
    });
    for(const type of ['largest-contentful-paint','layout-shift','event','longtask']){
      try{observer.observe({type,buffered:true,durationThreshold:type==='event'?40:undefined} as PerformanceObserverInit)}
      catch(error){telemetry.emit({level:'info',category:'telemetry',name:'performance.entry.unsupported',data:{type,error:String(error)}})}
    }
  }catch(error){telemetry.emit({level:'warning',category:'telemetry',name:'performance.observer.failed',data:{error:String(error)}})}
}
