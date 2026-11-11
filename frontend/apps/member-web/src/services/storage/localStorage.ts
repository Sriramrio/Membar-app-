export type StorageResult<T> = { ok:true; value:T } | { ok:false; error:Error };

const asError=(error:unknown)=>error instanceof Error?error:new Error(String(error));

export const localStorageService = {
  getResult<T>(key:string):StorageResult<T|undefined>{
    try{
      const raw=localStorage.getItem(key);
      if(raw===null) return {ok:true,value:undefined};
      try{return {ok:true,value:JSON.parse(raw) as T}}catch{return {ok:true,value:raw as unknown as T}}
    }catch(error){return {ok:false,error:asError(error)}}
  },
  get<T>(key:string):T|undefined{
    const result=this.getResult<T>(key);
    return result.ok?result.value:undefined;
  },
  setResult<T>(key:string,value:T):StorageResult<undefined>{
    try{localStorage.setItem(key,JSON.stringify(value));return {ok:true,value:undefined}}
    catch(error){return {ok:false,error:asError(error)}}
  },
  set<T>(key:string,value:T){return this.setResult(key,value).ok},
  removeResult(key:string):StorageResult<undefined>{
    try{localStorage.removeItem(key);return {ok:true,value:undefined}}
    catch(error){return {ok:false,error:asError(error)}}
  },
  remove(key:string){return this.removeResult(key).ok},
};
