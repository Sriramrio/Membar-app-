import {env} from '@/config/env';
import {stableId} from '@/utils/ids';
import {serverClock} from './serverClock';
import {toApiError} from './errorMapper';import {telemetry} from './telemetry';
import {authStorage} from '@/utils/authStorage';
import {assertBootstrapContract,type OrganisationalBootstrap} from '@/contracts/runtimeContracts';

export type OrgBootstrap=OrganisationalBootstrap;
export async function fetchOrgBootstrap(signal?:AbortSignal):Promise<OrgBootstrap>{
  if(env.useMocks) throw new Error('Production bootstrap is unavailable in explicit preview mode.');
  const correlationId=stableId('corr');
  const requestId=stableId('req');
  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(new DOMException('Bootstrap timed out','AbortError')),12000);
  const abort=()=>ctl.abort(signal?.reason);
  signal?.addEventListener('abort',abort,{once:true});
  try{
    const token = authStorage.getToken();

    const reqHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'X-Correlation-ID': correlationId,
      'X-Request-ID': requestId
    };
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    const res=await fetch(`${env.apiBaseUrl}/v3/organisational/bootstrap`,{
      method:'GET',credentials:'include',cache:'no-store',
      headers: reqHeaders,
      signal:ctl.signal
    });
    if(!res.ok){
      let body:Record<string,unknown>={};
      try{body=await res.json() as Record<string,unknown>}catch{body={}}
      throw Object.assign(new Error(typeof body.message==='string'?body.message:`Bootstrap failed (${res.status})`),{
        status:res.status,code:typeof body.code==='string'?body.code:undefined,
        correlationId:typeof body.correlationId==='string'?body.correlationId:correlationId,
        allowedRecovery:Array.isArray(body.allowedRecovery)?body.allowedRecovery:undefined
      });
    }
    const data=assertBootstrapContract(await res.json());
    if(!data.actor?.id||!data.actor?.name||!data.activeScope?.id||!Array.isArray(data.availableScopes)||!Array.isArray(data.units)||!Array.isArray(data.permissions)||!data.sessionRevision){
      throw Object.assign(new Error('Bootstrap response is incomplete.'),{code:'INVALID_BOOTSTRAP',correlationId});
    }

    const scopeIds=new Set(data.availableScopes.map(x=>x.id));
    if(!scopeIds.has(data.activeScope.id))throw Object.assign(new Error('Bootstrap active scope is not authorised.'),{code:'INVALID_BOOTSTRAP_SCOPE',correlationId});
    if(new Set(data.units.map(x=>x.id)).size!==data.units.length)throw Object.assign(new Error('Bootstrap contains duplicate organisation units.'),{code:'INVALID_BOOTSTRAP_UNITS',correlationId});
    if(data.serverTime)serverClock.sync(data.serverTime);
    telemetry.emit({level:'info',category:'runtime',name:'bootstrap.completed',data:{scopeId:data.activeScope.id,scopeCount:data.availableScopes.length,sessionRevision:data.sessionRevision,correlationId}});
    return data;
  }catch(error){telemetry.emit({level:'error',category:'runtime',name:'bootstrap.failed',data:{correlationId}});throw toApiError(error)}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
