import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {env} from '@/config/env';
import type {OrgQuery} from '@/services/queryGateway';
import {runtimeProviders} from '@/infrastructure/runtimeProviders';
import {assertObjectResponse} from '@/contracts/runtimeContracts';
import {toApiError} from '@/services/errorMapper';
import type {ApiErrorEnvelope} from '@/types/api';

interface ProjectionState<T>{data?:T;loading:boolean;refreshing:boolean;stale:boolean;error?:ApiErrorEnvelope;lastUpdatedAt?:string;requestDurationMs?:number}
export function useDomainProjection<T>(request:OrgQuery,localData:T,deps:readonly unknown[]=[],enabled=true){
  const [revision,setRevision]=useState(0);
  const [state,setState]=useState<ProjectionState<T>>({loading:enabled,refreshing:false,stale:false});
  const seq=useRef(0);
  const key=useMemo(()=>JSON.stringify(request),[request]);
  const localDependency=env.useMocks?localData:undefined;
  useEffect(()=>{if(!enabled){setState(x=>({...x,loading:false,refreshing:false}));return}const ctl=new AbortController();const current=++seq.current;const had=state.data!==undefined;setState(x=>({...x,loading:!had,refreshing:had,stale:had,error:undefined}));const started=performance.now();const load=async()=>env.useMocks?localData:assertObjectResponse<T>(await runtimeProviders().query.execute<unknown>(request,ctl.signal),request.queryId);load().then(data=>{if(current===seq.current&&!ctl.signal.aborted)setState({data,loading:false,refreshing:false,stale:false,lastUpdatedAt:new Date().toISOString(),requestDurationMs:Math.round(performance.now()-started)})}).catch(error=>{if(current===seq.current&&!ctl.signal.aborted)setState(x=>({...x,loading:false,refreshing:false,stale:x.data!==undefined,error:toApiError(error)}))});return()=>ctl.abort()},[key,revision,localDependency,enabled,...deps]);
  const reload=useCallback(()=>setRevision(x=>x+1),[]);
  return{...state,reload};
}
