import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuditEvent } from '@/types/common';
import type { DemoState } from '@/types/screen';

export interface RecordOverride { [field:string]: string | number | boolean | null | undefined }
export interface SavedDraft { screenId:number; key:string; values:Record<string,string>; savedAt:string }
export interface PrototypeActionFeedback { screenId:number; action:string; recordId?:string; message:string; at:string }

interface PrototypeState {
  stateByScreen:Record<number,DemoState>;
  audit:AuditEvent[];
  notifications:number;
  recordOverrides:Record<number,Record<string,RecordOverride>>;
  createdRecords:Record<number,Array<Record<string,unknown>>>;
  drafts:Record<string,SavedDraft>;
  savedItems:string[];
  pollResponses:Record<string,string>;
  settings:Record<string,boolean|string>;
  lastFeedback:PrototypeActionFeedback|null;
}

export const initialPrototypeState:PrototypeState={
  stateByScreen:{},
  audit:[],
  notifications:5,
  recordOverrides:{},
  createdRecords:{},
  drafts:{},
  savedItems:['M-1047','OP-401','RES-201'],
  pollResponses:{'MTG-2409':'Attending'},
  settings:{compactGrid:false,showGuidance:true},
  lastFeedback:null,
};

const slice=createSlice({name:'prototype',initialState:initialPrototypeState,reducers:{
  setDemoState(state,action:PayloadAction<{screenId:number;value:DemoState}>){state.stateByScreen??={};state.stateByScreen[action.payload.screenId]=action.payload.value},
  addAudit(state,action:PayloadAction<AuditEvent>){state.audit??=[];state.audit.unshift(action.payload);state.audit=state.audit.slice(0,100)},
  clearAudit(state){state.audit=[]},
  addRecord(state,action:PayloadAction<{screenId:number;record:Record<string,unknown>}>){
    state.createdRecords??={};
    state.createdRecords[action.payload.screenId]??=[];
    state.createdRecords[action.payload.screenId].unshift(action.payload.record);
    state.createdRecords[action.payload.screenId]=state.createdRecords[action.payload.screenId].slice(0,30);
  },
  patchRecord(state,action:PayloadAction<{screenId:number;recordId:string;changes:RecordOverride}>){
    const {screenId,recordId,changes}=action.payload;
    state.recordOverrides??={};
    state.recordOverrides[screenId]??={};
    state.recordOverrides[screenId][recordId]={...(state.recordOverrides[screenId][recordId]??{}),...changes};
  },
  saveDraft(state,action:PayloadAction<SavedDraft>){state.drafts??={};state.drafts[`${action.payload.screenId}:${action.payload.key}`]=action.payload},
  deleteDraft(state,action:PayloadAction<{screenId:number;key:string}>){if(state.drafts)delete state.drafts[`${action.payload.screenId}:${action.payload.key}`]},
  toggleSavedItem(state,action:PayloadAction<string>){state.savedItems??=[];const id=action.payload;state.savedItems=state.savedItems.includes(id)?state.savedItems.filter(x=>x!==id):[...state.savedItems,id]},
  setPollResponse(state,action:PayloadAction<{key:string;value:string}>){state.pollResponses??={};state.pollResponses[action.payload.key]=action.payload.value},
  setPrototypeSetting(state,action:PayloadAction<{key:string;value:boolean|string}>){state.settings??={};state.settings[action.payload.key]=action.payload.value},
  setFeedback(state,action:PayloadAction<PrototypeActionFeedback|null>){state.lastFeedback=action.payload},
  markNotificationRead(state){state.notifications=Math.max(0,(state.notifications??1)-1)},
  resetPrototype(){return initialPrototypeState},
}});

export const {
  setDemoState,addAudit,clearAudit,addRecord,patchRecord,saveDraft,deleteDraft,toggleSavedItem,setPollResponse,
  setPrototypeSetting,setFeedback,markNotificationRead,resetPrototype
}=slice.actions;
export default slice.reducer;
