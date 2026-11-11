import type {ApiErrorEnvelope,ApiErrorType} from '@/types/api';
const typeFromStatus=(s:number):ApiErrorType=>s===400?'VALIDATION':s===401?'AUTHENTICATION':s===403?'AUTHORIZATION':s===404?'NOT_FOUND':s===409||s===412?'CONFLICT':s===410?'GONE':s===429?'RATE_LIMIT':s>=500?'DEPENDENCY':'UNKNOWN';
type ErrorLike={status?:number;code?:string;message?:string;correlationId?:string;currentVersion?:number;allowedRecovery?:string[];fieldErrors?:Array<{field:string;message:string}>;unknownOutcome?:boolean};
export function toApiError(error:unknown):ApiErrorEnvelope{
  if(error&&typeof error==='object'&&'type' in error&&'status' in error)return error as ApiErrorEnvelope;
  if(error instanceof DOMException&&error.name==='AbortError')return{type:'CANCELLED',code:'REQUEST_CANCELLED',title:'Request cancelled',detail:'The request was cancelled.',status:0,retryable:false};
  const e=(error&&typeof error==='object'?error:{}) as ErrorLike;
  if(e.code==='OFFLINE')return{type:'OFFLINE',code:'OFFLINE',title:'You are offline',detail:e.message||'Reconnect before continuing.',status:0,correlationId:e.correlationId,retryable:true,allowedRecovery:['RECONNECT','RETRY']};
  if(e.code==='QUERY_TIMEOUT')return{type:'DEPENDENCY',code:'QUERY_TIMEOUT',title:'The request took too long',detail:e.message||'The server did not respond within the expected time. Retry safely.',status:504,correlationId:e.correlationId,retryable:true,allowedRecovery:['RETRY']};
  if(e.code==='COMMAND_TIMEOUT'||e.code==='COMMAND_NETWORK_OUTCOME_UNKNOWN')return{type:'UNKNOWN',code:e.code,title:'Command outcome needs verification',detail:e.message||'The command timed out after submission. Verify the latest record state before retrying.',status:Number(e.status||0),correlationId:e.correlationId,retryable:false,currentVersion:e.currentVersion,allowedRecovery:e.allowedRecovery??['RELOAD','VERIFY_BEFORE_RETRY'],fieldErrors:e.fieldErrors,unknownOutcome:true};
  const status=Number(e.status||0);
  return{type:typeFromStatus(status),code:e.code||'REQUEST_FAILED',title:status===409||status===412?'This record changed':'Unable to complete the request',detail:e.message||'Please try again.',status,correlationId:e.correlationId,retryable:status===0||status===429||status>=500,currentVersion:e.currentVersion,allowedRecovery:e.allowedRecovery,fieldErrors:e.fieldErrors,unknownOutcome:e.unknownOutcome};
}
