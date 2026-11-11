import {env} from '@/config/env';
import {isKnownCommandId} from '@/contracts/catalog';
import {stableId} from '@/utils/ids';
import {offlinePolicy} from './offlinePolicy';
import {telemetry} from './telemetry';import {crossTab} from './crossTab';
import {authStorage} from '@/utils/authStorage';
import {assertCommandResponseLike,type OrganisationalCommandRequest} from '@/contracts/runtimeContracts';

export type OrgCommand<T=unknown>=OrganisationalCommandRequest<T>;
type CommandErrorBody={message?:string;code?:string;correlationId?:string;currentVersion?:number;allowedRecovery?:string[];fieldErrors?:Array<{field:string;message:string}>};
async function commandError(res:Response,fallbackCorrelationId:string){let body:CommandErrorBody={};try{body=await res.json() as CommandErrorBody}catch{body={}}if(res.status===401)crossTab.publish({type:'SESSION_REVOKED'});return Object.assign(new Error(body.message||`Command failed (${res.status})`),{status:res.status,code:body.code,correlationId:body.correlationId||fallbackCorrelationId,currentVersion:body.currentVersion,allowedRecovery:body.allowedRecovery,fieldErrors:body.fieldErrors})}

export async function executeCommand<T,R=unknown>(cmd:OrgCommand<T>,preview?:()=>R|Promise<R>){
  if(!isKnownCommandId(cmd.commandType))throw new Error(`Unknown organisational commandId: ${cmd.commandType}`);
  const policy=offlinePolicy(cmd.commandType);
  if(typeof navigator!=='undefined'&&!navigator.onLine&&policy==='online-required')throw Object.assign(new Error('Reconnect before continuing.'),{code:'OFFLINE',correlationId:cmd.commandId});
  const started=performance.now();
  if(env.useMocks){const result=await preview?.();telemetry.emit({level:'info',category:'performance',name:'command.preview.completed',data:{commandType:cmd.commandType,durationMs:Math.round(performance.now()-started),commandId:cmd.commandId}});return result as R}
  const correlationId=stableId('corr');
  const requestId=stableId('req');
  const controller=new AbortController();
  let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;controller.abort(new DOMException('Timed out','AbortError'))},15000);
  try{
    const token = authStorage.getToken();
    const reqHeaders: Record<string, string> = {
      'content-type':'application/json',
      'Idempotency-Key':cmd.commandId,
      'X-Correlation-ID':correlationId,
      'X-Request-ID':requestId,
      ...(cmd.expectedVersion!==undefined?{'If-Match':String(cmd.expectedVersion)}:{})
    };
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    const actionEndpoint = cmd.commandType.replace(/^org\./, '').replace(/\./g, '-');
    const res=await fetch(`${env.apiBaseUrl}/v3/organisational/command/${actionEndpoint}`,{method:'POST',credentials:'include',headers:reqHeaders,body:JSON.stringify(cmd),signal:controller.signal});
    if(!res.ok)throw await commandError(res,correlationId);
    const contentType=res.headers.get('content-type')||'';
    const result=assertCommandResponseLike<R>(res.status===204||!contentType.includes('application/json')?undefined:await res.json());
    telemetry.emit({level:'info',category:'performance',name:'command.transport.completed',data:{commandType:cmd.commandType,durationMs:Math.round(performance.now()-started),commandId:cmd.commandId,correlationId}});
    return result;
  }catch(error){
    telemetry.emit({level:'error',category:'api',name:'command.failed',data:{commandType:cmd.commandType,durationMs:Math.round(performance.now()-started),commandId:cmd.commandId,correlationId,timedOut}});
    if(timedOut)throw Object.assign(new Error('The command timed out after submission. The outcome is unknown; reload or verify the record before retrying.'),{status:0,code:'COMMAND_TIMEOUT',correlationId,allowedRecovery:['RELOAD','VERIFY_BEFORE_RETRY'],unknownOutcome:true});
    // Once an unsafe command has been submitted, a transport failure cannot prove that
    // the server did not commit it. Treat network loss conservatively as an unknown
    // outcome and force authoritative verification before retrying.
    if(error instanceof TypeError)throw Object.assign(new Error('The connection was lost after the command was submitted. Verify the latest record state before retrying.'),{status:0,code:'COMMAND_NETWORK_OUTCOME_UNKNOWN',correlationId,allowedRecovery:['RELOAD','VERIFY_BEFORE_RETRY'],unknownOutcome:true});
    throw error;
  }finally{clearTimeout(timer)}
}
