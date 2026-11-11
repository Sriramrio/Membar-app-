export interface PerformanceBudgets {
  uiFeedbackMs:number; cachedUsableMs:number; readP95Ms:number; commandP95Ms:number; searchP95Ms:number; slowRequestMs:number; maxPageSize:number;
}
export const performanceBudgets:PerformanceBudgets={uiFeedbackMs:100,cachedUsableMs:1000,readP95Ms:800,commandP95Ms:1000,searchP95Ms:800,slowRequestMs:2000,maxPageSize:100};
export function classifyLatency(durationMs:number,kind:'read'|'command'|'search'='read'){
 const target=kind==='command'?performanceBudgets.commandP95Ms:kind==='search'?performanceBudgets.searchP95Ms:performanceBudgets.readP95Ms;
 return {targetMs:target,slow:durationMs>target,critical:durationMs>performanceBudgets.slowRequestMs};
}
