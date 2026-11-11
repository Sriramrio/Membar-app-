import { describe, expect, it } from 'vitest';
import { toApiError } from './errorMapper';

const axiosError=(status:number,body:Record<string,unknown>={},code?:string)=>({
  isAxiosError:true,
  code,
  config:{headers:{'X-Correlation-ID':'corr-test'}},
  response:{status,data:body,headers:{}},
});

describe('API error mapping',()=>{
  it('maps concurrency and rate-limit failures into structured recovery contracts',()=>{
    expect(toApiError(axiosError(409,{currentVersion:'v12'}))).toMatchObject({type:'CONFLICT',status:409,currentVersion:'v12',correlationId:'corr-test'});
    expect(toApiError(axiosError(429))).toMatchObject({type:'RATE_LIMIT',status:429,retryable:true});
  });

  it('maps cancellation as non-retryable rather than as a server failure',()=>{
    expect(toApiError(axiosError(0,{},'ERR_CANCELED'))).toMatchObject({type:'CANCELLED',code:'REQUEST_CANCELLED',retryable:false});
  });

  it('preserves server-provided validation details',()=>{
    const error=toApiError(axiosError(422,{type:'VALIDATION',code:'INVALID_FIELD',detail:'Correct the highlighted value.',fieldErrors:[{field:'email',message:'Invalid email'}]}));
    expect(error).toMatchObject({type:'VALIDATION',code:'INVALID_FIELD',status:422});
    expect(error.fieldErrors).toEqual([{field:'email',message:'Invalid email'}]);
  });
});
