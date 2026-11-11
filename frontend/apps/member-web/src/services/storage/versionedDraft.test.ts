import { beforeEach, describe, expect, it } from 'vitest';
import { readVersionedDraft, saveVersionedDraft } from './versionedDraft';

type Draft={name:string};
const valid=(value:unknown):value is Draft=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value)&&typeof (value as Draft).name==='string';

beforeEach(()=>{
  const values=new Map<string,string>();
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{
    getItem:(key:string)=>values.get(key)??null,
    setItem:(key:string,value:string)=>{values.set(key,value)},
    removeItem:(key:string)=>{values.delete(key)},
    clear:()=>values.clear(),
    key:(index:number)=>[...values.keys()][index]??null,
    get length(){return values.size},
  }});
});

describe('versioned draft persistence',()=>{
  it('round-trips a compatible validated payload',()=>{
    expect(saveVersionedDraft('draft','screen-a',2,{name:'SETHU'}).ok).toBe(true);
    expect(readVersionedDraft('draft','screen-a',2,valid)).toMatchObject({status:'ready',payload:{name:'SETHU'}});
  });

  it('fails closed for stale schema versions',()=>{
    saveVersionedDraft('draft','screen-a',1,{name:'old'});
    expect(readVersionedDraft('draft','screen-a',2,valid)).toMatchObject({status:'incompatible',foundVersion:1});
  });

  it('rejects corrupt or invalid payloads without throwing',()=>{
    sessionStorage.setItem('draft',JSON.stringify({schemaVersion:2,screenId:'screen-a',savedAt:new Date().toISOString(),payload:{wrong:true}}));
    expect(readVersionedDraft('draft','screen-a',2,valid)).toEqual({status:'invalid',reason:'payload'});
  });
});
