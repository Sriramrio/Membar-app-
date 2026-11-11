export interface TelemetryEvent{at:string;level:'info'|'warning'|'error';category:string;name:string;data?:Record<string,unknown>}
const events:TelemetryEvent[]=[]; export const telemetry={emit:(e:Omit<TelemetryEvent,'at'>)=>events.push({...e,at:new Date().toISOString()}),snapshot:()=>[...events]};
