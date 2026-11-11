import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import type {BootstrapResponse,StructuredError} from '@/contracts/platform';
import {loadBootstrap} from '@/services/api';
import {asStructuredError} from '@/errors/errorUtils';
interface State{bootstrap?:BootstrapResponse;loading:boolean;error?:StructuredError;refresh:()=>void;has:(permission:string)=>boolean}
const Ctx=createContext<State|undefined>(undefined);
export function BootstrapProvider({children}:{children:ReactNode}){const[nonce,setNonce]=useState(0);const[bootstrap,setBootstrap]=useState<BootstrapResponse>();const[loading,setLoading]=useState(true);const[error,setError]=useState<StructuredError>();useEffect(()=>{const c=new AbortController();let active=true;setLoading(true);loadBootstrap(c.signal).then(x=>{if(active){setBootstrap(x);setError(undefined)}}).catch(e=>{if(active&&(e as Error)?.name!=='AbortError')setError(asStructuredError(e))}).finally(()=>{if(active)setLoading(false)});return()=>{active=false;c.abort()}},[nonce]);const value=useMemo<State>(()=>({bootstrap,loading,error,refresh:()=>setNonce(x=>x+1),has:(p)=>Boolean(bootstrap?.permissions.includes(p))}),[bootstrap,loading,error]);return <Ctx.Provider value={value}>{children}</Ctx.Provider>}
export function useBootstrap(){const v=useContext(Ctx);if(!v)throw new Error('BootstrapProvider missing');return v}
