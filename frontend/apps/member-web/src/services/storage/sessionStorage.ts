export type StorageResult<T> = { ok:true; value:T } | { ok:false; error:Error };

const asError=(error:unknown)=>error instanceof Error?error:new Error(String(error));

export const sessionStorageService = {
  getResult<T>(key:string):StorageResult<T|undefined>{
    try{
      const raw=sessionStorage.getItem(key);
      if(raw===null) return {ok:true,value:undefined};
      try{return {ok:true,value:JSON.parse(raw) as T}}catch{return {ok:true,value:raw as unknown as T}}
    }catch(error){return {ok:false,error:asError(error)}}
  },
  get<T>(key:string):T|undefined{
    const result=this.getResult<T>(key);
    return result.ok?result.value:undefined;
  },
  setResult<T>(key:string,value:T):StorageResult<undefined>{
    try{sessionStorage.setItem(key,JSON.stringify(value));return {ok:true,value:undefined}}
    catch(error){return {ok:false,error:asError(error)}}
  },
  set<T>(key:string,value:T){return this.setResult(key,value).ok},
  removeResult(key:string):StorageResult<undefined>{
    try{sessionStorage.removeItem(key);return {ok:true,value:undefined}}
    catch(error){return {ok:false,error:asError(error)}}
  },
  remove(key:string){return this.removeResult(key).ok},
  rawGetResult(key:string):StorageResult<string|undefined>{
    try{return {ok:true,value:sessionStorage.getItem(key)??undefined}}
    catch(error){return {ok:false,error:asError(error)}}
  },
  rawSetResult(key:string,value:string):StorageResult<undefined>{
    try{sessionStorage.setItem(key,value);return {ok:true,value:undefined}}
    catch(error){return {ok:false,error:asError(error)}}
  },
};
