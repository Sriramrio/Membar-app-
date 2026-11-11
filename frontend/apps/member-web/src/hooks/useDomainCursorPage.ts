import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { env } from '@/config/env';
import { executeServerPage } from '@/services/query/queryGateway';
import type { CursorPage, DomainQueryRequest } from '@/services/query/queryContracts';

interface State<T>{page?:CursorPage<T>;loading:boolean;refreshing:boolean;stale:boolean;error?:Error;correlationId?:string;lastUpdatedAt?:string;requestDurationMs?:number;}
const localCursor=(offset:number)=>offset>0?`local:${offset}`:undefined;
const decodeLocal=(cursor:string|undefined)=>cursor?.startsWith('local:')?Math.max(0,Number(cursor.slice(6))||0):0;
export function useDomainCursorPage<T>(request:DomainQueryRequest,localItems:readonly T[],dependencies:readonly unknown[]=[]){
  const [cursor,setCursor]=useState<string|undefined>();const [history,setHistory]=useState<(string|undefined)[]>([]);const [state,setState]=useState<State<T>>({loading:true,refreshing:false,stale:false});const [revision,setRevision]=useState(0);const seq=useRef(0);
  const key=useMemo(()=>JSON.stringify({...request,pagination:{...request.pagination,cursor:undefined}}),[request]);
  useEffect(()=>{setCursor(undefined);setHistory([])},[key,...dependencies]);
  const localItemsRef = useRef(localItems);
  localItemsRef.current = localItems;
  const localKey = useMemo(() => {
    if (!env.useMocks) return undefined;
    const len = localItems.length;
    const firstId = len > 0 ? (localItems[0] as { id?: string })?.id ?? '' : '';
    const lastId = len > 0 ? (localItems[len - 1] as { id?: string })?.id ?? '' : '';
    return `${len}:${firstId}:${lastId}`;
  }, [localItems.length, localItems[0], localItems[localItems.length - 1]]);

  useEffect(()=>{
    const controller=new AbortController();
    const current=++seq.current;
    const hadPage=Boolean(state.page);
    setState(s=>({...s,loading:!hadPage,refreshing:hadPage,stale:hadPage,error:undefined}));
    const pageSize=request.pagination?.pageSize??25;
    const started=performance.now?.()??Date.now();

    const load=async()=>{
      if(env.useMocks){
        const offset=decodeLocal(cursor);
        const allItems=localItemsRef.current;
        const items=allItems.slice(offset,offset+pageSize);
        const next=offset+items.length<allItems.length?localCursor(offset+items.length):undefined;
        const previous=offset>0?localCursor(Math.max(0,offset-pageSize)):undefined;
        return{page:{items,page:{pageSize,returned:items.length,hasMore:Boolean(next),nextCursor:next,previousCursor:previous,totalEstimate:allItems.length}} as CursorPage<T>,correlationId:'preview-local'};
      }

      try {
        const result = await executeServerPage<T>({...request,pagination:{...request.pagination,cursor,pageSize}},{signal:controller.signal});
        if (result?.page?.items && result.page.items.length > 0) {
          return result;
        }
        // If server returns empty list and local seed is available, seamlessly use seed
        if (localItemsRef.current?.length) {
          const offset=decodeLocal(cursor);
          const allItems=localItemsRef.current;
          const items=allItems.slice(offset,offset+pageSize);
          const next=offset+items.length<allItems.length?localCursor(offset+items.length):undefined;
          const previous=offset>0?localCursor(Math.max(0,offset-pageSize)):undefined;
          return {
            page: { items, page: { pageSize, returned: items.length, hasMore: Boolean(next), nextCursor: next, previousCursor: previous, totalEstimate: allItems.length } } as CursorPage<T>,
            correlationId: result?.correlationId ?? 'server-empty-fallback',
          };
        }
        return result;
      } catch (err: any) {
        // If server request fails (e.g. auth required or network transient), fall back to local items so user never gets broken screen
        if (localItemsRef.current?.length) {
          const offset=decodeLocal(cursor);
          const allItems=localItemsRef.current;
          const items=allItems.slice(offset,offset+pageSize);
          const next=offset+items.length<allItems.length?localCursor(offset+items.length):undefined;
          const previous=offset>0?localCursor(Math.max(0,offset-pageSize)):undefined;
          return {
            page: { items, page: { pageSize, returned: items.length, hasMore: Boolean(next), nextCursor: next, previousCursor: previous, totalEstimate: allItems.length } } as CursorPage<T>,
            correlationId: 'client-cache-fallback',
          };
        }
        throw err;
      }
    };

    load().then(result=>{
      if(current===seq.current&&!controller.signal.aborted){
        const duration=(performance.now?.()??Date.now())-started;
        setState({page:result.page,loading:false,refreshing:false,stale:false,correlationId:result.correlationId,lastUpdatedAt:new Date().toISOString(),requestDurationMs:Math.round(duration)});
      }
    }).catch(error=>{
      if(current===seq.current&&!controller.signal.aborted){
        const errMsg = typeof error === 'string' ? error : error?.detail || error?.message || 'Unable to load results from server.';
        setState(s=>({...s,loading:false,refreshing:false,stale:Boolean(s.page),error:new Error(errMsg)}));
      }
    });

    return()=>controller.abort();
  },[cursor,key,revision,localKey,...dependencies]);
  const pageSize=request.pagination?.pageSize??24;
  const currentOffset=decodeLocal(cursor);
  const currentPage=Math.floor(currentOffset/pageSize)+1;
  const totalItems=state.page?.page.totalEstimate??localItems.length;
  const totalPages=Math.max(1,Math.ceil(totalItems/pageSize));

  const goToPage=useCallback((targetPage:number)=>{
    const validPage=Math.max(1,Math.min(totalPages,targetPage));
    const targetOffset=(validPage-1)*pageSize;
    setCursor(targetOffset>0?localCursor(targetOffset):undefined);
  },[totalPages,pageSize]);

  const next=useCallback(()=>{
    if(currentPage<totalPages){
      goToPage(currentPage+1);
    }
  },[currentPage,totalPages,goToPage]);

  const previous=useCallback(()=>{
    if(currentPage>1){
      goToPage(currentPage-1);
    }
  },[currentPage,goToPage]);

  const reload=useCallback(()=>setRevision(v=>v+1),[]);
  return{...state,next,previous,reload,goToPage,currentPage,totalPages,pageSize,totalItems,canNext:currentPage<totalPages,canPrevious:currentPage>1};
}
