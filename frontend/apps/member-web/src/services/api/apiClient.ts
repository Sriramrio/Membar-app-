import axios, { type AxiosRequestConfig } from 'axios';
import { axiosInstance } from './axiosInstance';
import { toApiError } from './errorMapper';
import { telemetry } from '@/services/telemetry/telemetry';
import { classifyLatency } from '@/config/performanceBudgets';

export interface ApiRequestOptions {
  signal?: AbortSignal;
  maxRetries?: number;
  retry?: 'none' | 'safe';
  idempotencyKey?: string;
}

const delay=(ms:number,signal?:AbortSignal)=>new Promise<void>((resolve,reject)=>{
  if(signal?.aborted){reject(new DOMException('Request cancelled','AbortError'));return;}
  const timer=setTimeout(resolve,ms);
  signal?.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Request cancelled','AbortError'))},{once:true});
});

function retryAfterMs(error:unknown){
  if(!axios.isAxiosError(error))return undefined;
  const raw=error.response?.headers?.['retry-after'];
  if(raw===undefined)return undefined;
  const seconds=Number(raw);
  if(Number.isFinite(seconds))return Math.max(0,Math.min(seconds*1000,30_000));
  const at=Date.parse(String(raw));
  return Number.isFinite(at)?Math.max(0,Math.min(at-Date.now(),30_000)):undefined;
}

function retryableTransport(error:unknown){
  if(!axios.isAxiosError(error))return false;
  if(error.code==='ERR_CANCELED')return false;
  const status=error.response?.status;
  return status===429||status===502||status===503||status===504||!error.response;
}

async function request<T>(operation:(config:AxiosRequestConfig)=>Promise<{data:T}>,options:ApiRequestOptions={},defaultRetry=false,kind:'read'|'command'|'search'='read'){
  const retryEnabled=options.retry==='safe'||(options.retry===undefined&&defaultRetry);
  const maxRetries=retryEnabled?Math.max(0,Math.min(options.maxRetries??2,3)):0;
  let attempt=0;const started=performance.now?.()??Date.now();
  for(;;){
    try{
      const data=(await operation({signal:options.signal})).data;
      const duration=(performance.now?.()??Date.now())-started;const budget=classifyLatency(duration,kind);
      telemetry.info('performance','api.request.completed',`API ${kind} completed`,{durationMs:Math.round(duration),targetMs:budget.targetMs,slow:budget.slow,critical:budget.critical,attempts:attempt+1});
      return data;
    }catch(error){
      if(attempt>=maxRetries||!retryableTransport(error)||options.signal?.aborted){
        const duration=(performance.now?.()??Date.now())-started;telemetry.warning('performance','api.request.failed-latency','API request failed',{durationMs:Math.round(duration),attempts:attempt+1});
        throw toApiError(error);
      }
      const wait=retryAfterMs(error)??Math.min(250*(2**attempt),2_000);
      attempt+=1;
      try{await delay(wait,options.signal)}catch(cancelled){throw toApiError(cancelled)}
    }
  }
}

const headers=(version?:string,idempotencyKey?:string)=>({
  ...(version?{'If-Match':version}:{}),
  ...(idempotencyKey?{'Idempotency-Key':idempotencyKey}:{}),
});

export const apiClient={
  get:<T>(url:string,options?:ApiRequestOptions)=>request<T>(config=>axiosInstance.get<T>(url,config),options,true,'read'),
  post:<T>(url:string,body?:unknown,version?:string,options?:ApiRequestOptions)=>request<T>(config=>axiosInstance.post<T>(url,body,{...config,headers:headers(version,options?.idempotencyKey)}),options,false,'command'),
  put:<T>(url:string,body?:unknown,version?:string,options?:ApiRequestOptions)=>request<T>(config=>axiosInstance.put<T>(url,body,{...config,headers:headers(version,options?.idempotencyKey)}),options,false,'command'),
  patch:<T>(url:string,body?:unknown,version?:string,options?:ApiRequestOptions)=>request<T>(config=>axiosInstance.patch<T>(url,body,{...config,headers:headers(version,options?.idempotencyKey)}),options,false,'command'),
  delete:<T>(url:string,version?:string,options?:ApiRequestOptions)=>request<T>(config=>axiosInstance.delete<T>(url,{...config,headers:headers(version,options?.idempotencyKey)}),options,false,'command'),
};
