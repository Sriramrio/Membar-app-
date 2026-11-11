import { telemetry } from './telemetry';

let installed=false;
export function installGlobalErrorCapture(){
  if(installed||typeof window==='undefined')return;
  installed=true;
  window.addEventListener('error',event=>{
    telemetry.error('global','window.error',event.error??event.message,{filename:event.filename||undefined,line:event.lineno||undefined,column:event.colno||undefined});
  });
  window.addEventListener('unhandledrejection',event=>{
    telemetry.error('global','window.unhandledrejection',event.reason);
  });
}
