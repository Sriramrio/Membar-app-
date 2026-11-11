export interface CachePolicy{key:string;scope:'user'|'organisation'|'public';ttlMs:number;staleToleranceMs:number;privacy:'public'|'internal'|'restricted'}
export const cachePolicies:Record<string,CachePolicy>={taxonomy:{key:'taxonomy',scope:'public',ttlMs:3600000,staleToleranceMs:86400000,privacy:'public'},orgReference:{key:'org-reference',scope:'organisation',ttlMs:300000,staleToleranceMs:900000,privacy:'internal'},restricted:{key:'restricted',scope:'user',ttlMs:0,staleToleranceMs:0,privacy:'restricted'}};
const referenceQueries=new Set(['org.chapters.list','org.cities.list','org.regions.list','org.states.list','org.people.list']);
export function cachePolicyForQuery(queryId:string){return referenceQueries.has(queryId)?cachePolicies.orgReference:cachePolicies.restricted}
export function fetchCacheMode(queryId:string):RequestCache{return cachePolicyForQuery(queryId).privacy==='restricted'?'no-store':'default'}
