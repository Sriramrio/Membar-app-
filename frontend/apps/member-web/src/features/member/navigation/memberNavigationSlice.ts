import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Workspace } from '@/types/screen';

export interface NavigationOrigin {
  id:string;
  workspace:Workspace;
  pathname:string;
  search:string;
  sourceModule?:string;
  sourceLabel?:string;
  returnLabel?:string;
  entityType?:string;
  entityId?:string;
  tab?:string;
  filter?:string;
  sort?:string;
  pagination?:string;
  scrollY:number;
  createdAt:string;
}
export interface DirtyGuard { dirty:boolean; label?:string; canSaveDraft?:boolean; draftKey?:string }
export interface PendingNavigation { kind:'go'|'back'; to:string; origin?:NavigationOrigin; restoreScrollY?:number; replace?:boolean }
export interface MemberNavigationState {
  stack:NavigationOrigin[];
  lastByWorkspace:Partial<Record<Workspace,NavigationOrigin>>;
  dirtyGuard:DirtyGuard;
  pendingNavigation?:PendingNavigation;
}
const initialState:MemberNavigationState={stack:[],lastByWorkspace:{},dirtyGuard:{dirty:false}};
const slice=createSlice({name:'memberNavigation',initialState,reducers:{
 rememberWorkspaceContext(state,action:PayloadAction<NavigationOrigin>){state.lastByWorkspace[action.payload.workspace]=action.payload},
 pushNavigationOrigin(state,action:PayloadAction<NavigationOrigin>){const last=state.stack.at(-1);if(last&&last.pathname===action.payload.pathname&&last.search===action.payload.search)return;state.stack.push(action.payload);if(state.stack.length>20)state.stack.shift();state.lastByWorkspace[action.payload.workspace]=action.payload},
 popNavigationOrigin(state){state.stack.pop()},
 clearNavigationOrigins(state){state.stack=[]},
 setDirtyGuard(state,action:PayloadAction<DirtyGuard>){state.dirtyGuard=action.payload},
 clearDirtyGuard(state){state.dirtyGuard={dirty:false}},
 setPendingNavigation(state,action:PayloadAction<PendingNavigation>){state.pendingNavigation=action.payload},
 clearPendingNavigation(state){state.pendingNavigation=undefined},
 pruneWorkspaceOrigins(state,action:PayloadAction<Workspace>){state.stack=state.stack.filter(x=>x.workspace!==action.payload);delete state.lastByWorkspace[action.payload]},
}});
export const {rememberWorkspaceContext,pushNavigationOrigin,popNavigationOrigin,clearNavigationOrigins,setDirtyGuard,clearDirtyGuard,setPendingNavigation,clearPendingNavigation,pruneWorkspaceOrigins}=slice.actions;
export default slice.reducer;
