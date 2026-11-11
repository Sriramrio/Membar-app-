import {useState} from 'react';
import type {CommandRequest,CommandResponse,StructuredError} from '@/contracts/platform';
import{runCommand}from'@/services/api';import{asStructuredError}from'@/errors/errorUtils';
export function useGovernedCommand(){const[busy,setBusy]=useState(false);const[result,setResult]=useState<CommandResponse>();const[error,setError]=useState<StructuredError>();async function execute(request:CommandRequest):Promise<CommandResponse|undefined>{setBusy(true);setError(undefined);try{const r=await runCommand(request);setResult(r);return r}catch(e){setError(asStructuredError(e));return undefined}finally{setBusy(false)}}return{busy,result,error,execute,clear:()=>{setResult(undefined);setError(undefined)}}}
