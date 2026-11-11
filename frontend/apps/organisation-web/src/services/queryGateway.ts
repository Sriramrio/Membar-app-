import {env} from '@/config/env';
import {serverClock} from './serverClock';
import {telemetry} from './telemetry';
import {stableId} from '@/utils/ids';
import {isKnownQueryId} from '@/contracts/catalog';
import {fetchCacheMode,cachePolicyForQuery} from './cachePolicy';import {crossTab} from './crossTab';
import type {OrganisationalQueryRequest} from '@/contracts/runtimeContracts';
export type OrgQuery=OrganisationalQueryRequest;

type MemoryCacheEntry={expiresAt:number;value:unknown};
const memoryCache=new Map<string,MemoryCacheEntry>();
const cacheKey=(q:OrgQuery)=>JSON.stringify(q);
function cachedValue<T>(q:OrgQuery){const policy=cachePolicyForQuery(q.queryId);if(policy.ttlMs<=0)return undefined;const key=cacheKey(q);const hit=memoryCache.get(key);if(!hit)return undefined;if(hit.expiresAt<=Date.now()){memoryCache.delete(key);return undefined}return hit.value as T}
function remember<T>(q:OrgQuery,value:T){const policy=cachePolicyForQuery(q.queryId);if(policy.ttlMs<=0)return;memoryCache.set(cacheKey(q),{expiresAt:Date.now()+policy.ttlMs,value});if(memoryCache.size>200){const first=memoryCache.keys().next().value;if(first)memoryCache.delete(first)}}
export function invalidateQueryMemoryCache(){memoryCache.clear()}

type QueryErrorBody={message?:string;code?:string;correlationId?:string;currentVersion?:number;allowedRecovery?:string[];fieldErrors?:Array<{field:string;message:string}>};
const retryableStatus=(s:number)=>s===429||s===502||s===503||s===504;
const delay=(ms:number,signal?:AbortSignal)=>new Promise<void>((resolve,reject)=>{const timer=setTimeout(resolve,ms);signal?.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'))},{once:true})});
const retryDelay=(attempt:number,response?:Response)=>{const ra=response?.headers.get('Retry-After');if(ra){const sec=Number(ra);if(Number.isFinite(sec))return Math.min(5000,sec*1000);const at=Date.parse(ra);if(Number.isFinite(at))return Math.min(5000,Math.max(0,at-Date.now()))}return Math.min(2000,250*2**attempt)};
export function cleanQueryEndpoint(queryId: string): string {
  const map: Record<string, string> = {
    'org.today': 'dashboard',
    'org.action-centre': 'action-centre',
    'org.search': 'search',
    'org.hierarchy.summary': 'hierarchy',
    'org.hierarchy.rollup': 'hierarchy-rollup',
    'org.calendar.list': 'calendar',
    'org.goals.list': 'goals',
    'org.plans.list': 'plans',
    'org.projects.list': 'projects',
    'org.handoffs.list': 'handoffs',
    'org.networking.summary': 'networking',
    'org.reports.summary': 'reports',
    'org.reports.list': 'reports',
    'org.continuity.summary': 'continuity',
    'org.chapter.operations.summary': 'chapter-operations',
    'org.meeting.agenda-candidates': 'agenda-candidates',
    'org.approvals.list': 'approvals',
    'org.people.list': 'people',
    'org.assignments.list': 'assignments',
    'org.chapter-coordinators.list': 'chapter-coordinators',
    'org.delegations.list': 'delegations',
    'org.handovers.list': 'handover',
    'org.availability.list': 'availability',
    'org.members.list': 'members',
    'org.member-growth.list': 'member-growth',
    'org.member-cases.list': 'member-cases',
    'org.member-dues.list': 'member-dues',
    'org.chapters.list': 'chapters',
    'org.cities.list': 'cities',
    'org.regions.list': 'regions',
    'org.states.list': 'states',
    'org.committees.list': 'committees',
    'org.programmes.list': 'programmes',
    'org.events.list': 'events',
    'org.attendance.list': 'attendance',
    'org.kyt.list': 'kyt',
    'org.member-presentations.list': 'member-presentations',
    'org.meetings.list': 'meetings',
    'org.mom.list': 'mom',
    'org.tasks.list': 'tasks',
    'org.actions.list': 'actions',
    'org.decisions.list': 'decisions',
    'org.support-requests.list': 'support',
    'org.escalations.list': 'escalations',
    'org.exceptions.list': 'exceptions',
    'org.risks.list': 'risks',
    'org.issues.list': 'issues',
    'org.notifications.list': 'notifications',
    'org.alerts.list': 'alerts',
    'org.communications.list': 'communications',
    'org.volunteer-digest.summary': 'volunteer-digest',
    'org.converse.inbox': 'converse-inbox',
    'org.converse.messages': 'converse-messages',
    'org.converse.participants': 'converse-participants',
    'org.polls.list': 'polls',
    'org.surveys.list': 'surveys',
    'org.data-quality.list': 'data-quality',
    'org.documents.list': 'documents',
    'org.jobs.list': 'jobs',
    'org.audit.list': 'audit',
    'org.record.get': 'record'
  };
  return map[queryId] || queryId.replace(/^org\./, '').replace(/\.(list|summary)$/, '');
}

import {authStorage} from '@/utils/authStorage';

function linkedSignal(external?:AbortSignal,timeoutMs=12000){const ctl=new AbortController();let timedOut=false;const timer=setTimeout(()=>{timedOut=true;ctl.abort(new DOMException('Timed out','AbortError'))},timeoutMs);const onAbort=()=>ctl.abort(external?.reason);external?.addEventListener('abort',onAbort,{once:true});return{signal:ctl.signal,timedOut:()=>timedOut,cleanup:()=>{clearTimeout(timer);external?.removeEventListener('abort',onAbort)}}}

export async function queryServer<T>(q:OrgQuery,signal?:AbortSignal){if(!isKnownQueryId(q.queryId))throw new Error(`Unknown organisational queryId: ${q.queryId}`);if(env.useMocks)throw new Error('Server query unavailable in preview mode');const cached=cachedValue<T>(q);if(cached!==undefined)return cached;if(typeof navigator!=='undefined'&&!navigator.onLine)throw Object.assign(new Error('Reconnect before refreshing this view.'),{code:'OFFLINE'});const started=performance.now();const correlationId=stableId('corr');const requestId=stableId('req');const token=authStorage.getToken();const reqHeaders:Record<string,string>={'content-type':'application/json','X-Correlation-ID':correlationId,'X-Request-ID':requestId};if(token)reqHeaders['Authorization']=`Bearer ${token}`;let attempt=0;const endpoint=cleanQueryEndpoint(q.queryId);while(true){const linked=linkedSignal(signal);let res:Response|undefined;try{res=await fetch(`${env.apiBaseUrl}/v3/organisational/${endpoint}`,{method:'POST',credentials:'include',cache:fetchCacheMode(q.queryId),headers:reqHeaders,body:JSON.stringify({...q,pageSize:Math.min(q.pageSize??25,100)}),signal:linked.signal});if(!res.ok){if(retryableStatus(res.status)&&attempt<2){const wait=retryDelay(attempt,res);attempt++;linked.cleanup();await delay(wait,signal);continue}throw await safeError(res,correlationId)}const data=await res.json() as T&{serverTime?:string};if(data.serverTime)serverClock.sync(data.serverTime);remember(q,data);telemetry.emit({level:'info',category:'performance',name:'query.completed',data:{queryId:q.queryId,durationMs:Math.round(performance.now()-started),attempts:attempt+1,correlationId}});return data}catch(error){const externalCancelled=Boolean(signal?.aborted);const timeout=linked.timedOut();if(externalCancelled)throw error;if(timeout&&attempt<2){const wait=retryDelay(attempt);attempt++;linked.cleanup();await delay(wait,signal);continue}if(timeout)throw Object.assign(new Error('The query timed out after safe retries.'),{status:504,code:'QUERY_TIMEOUT',correlationId,allowedRecovery:['RETRY']});if(error instanceof DOMException&&error.name==='AbortError')throw error;if(attempt<2&&!(error&&typeof error==='object'&&'status' in error)){const wait=retryDelay(attempt);attempt++;linked.cleanup();await delay(wait,signal);continue}telemetry.emit({level:'error',category:'api',name:'query.failed',data:{queryId:q.queryId,durationMs:Math.round(performance.now()-started),attempts:attempt+1,correlationId,timeout}});throw error}finally{linked.cleanup()}}}
async function safeError(r:Response,fallbackCorrelationId:string){let body:QueryErrorBody={};try{body=await r.json() as QueryErrorBody}catch{body={}}if(r.status===401)crossTab.publish({type:'SESSION_REVOKED'});return Object.assign(new Error(body.message||`Request failed (${r.status})`),{status:r.status,code:body.code,correlationId:body.correlationId||fallbackCorrelationId,currentVersion:body.currentVersion,allowedRecovery:body.allowedRecovery,fieldErrors:body.fieldErrors})}
