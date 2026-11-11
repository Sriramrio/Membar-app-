import type { ApiErrorEnvelope } from '@/types/api';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState } from './authTypes';
import { login } from './authService';
import type { Workspace } from '@/types/screen';
import type { AppAccount, AccountAssignment } from '@/types/common';
import { serverClock } from '@/services/time/serverClock';
import { sessionStorageService } from '@/services/storage/sessionStorage';
function firstActiveWorkspace(account:AppAccount){return account.workspaces.find(w=>w!=='Workspace'&&w!=='Public')??account.workspaces[0]??null}
function assignmentFor(account:AppAccount,w:Workspace|null){return account.assignments?.find(a=>a.workspace===w&&a.status==='Active')}
function loadInitialAuthState():AuthState{
  try{
    const account=sessionStorageService.get<AppAccount>('sethu:account');
    if(account){
      const first=firstActiveWorkspace(account);
      const a=assignmentFor(account,first);
      return {authenticated:true,account,activeWorkspace:first,activeUnit:a?.unit??account.unit,activeAssignmentId:a?.id??null,status:'succeeded'};
    }
  }catch(e){void e;}
  return {authenticated:false,account:null,activeWorkspace:null,activeUnit:null,activeAssignmentId:null,status:'idle' as const};
}
const initialState:AuthState=loadInitialAuthState();
function applyAccount(state:AuthState,account:AppAccount){
  state.status='succeeded';
  state.authenticated=true;
  state.account=account;
  const first=firstActiveWorkspace(account);
  state.activeWorkspace=first;
  const a=assignmentFor(account,first);
  state.activeUnit=a?.unit??account.unit;
  state.activeAssignmentId=a?.id??null;
  state.error=undefined;
  sessionStorageService.set('sethu:account', account);
  if ((account as any)?.token) {
    sessionStorageService.set('sethu:token', (account as any).token);
    try { localStorage.setItem('sethu:token', (account as any).token); } catch {}
  }
}
export const signIn=createAsyncThunk('auth/signIn',async({identifier,password}:{identifier:string;password:string},{rejectWithValue})=>{try{return await login(identifier,password)}catch(error){const apiError=error as Partial<ApiErrorEnvelope>;return rejectWithValue(apiError.detail??'Unable to sign in. Check your email or account ID and password.')}});
const authSlice=createSlice({name:'auth',initialState,reducers:{
 signOut:(state)=>{
   sessionStorageService.remove('sethu:account');
   sessionStorageService.remove('sethu:token');
   try { localStorage.removeItem('sethu:token'); } catch {}
   return {authenticated:false,account:null,activeWorkspace:null,activeUnit:null,activeAssignmentId:null,status:'idle' as const};
 },
 authenticateAccount(state,action:PayloadAction<AppAccount>){applyAccount(state,action.payload)},
 selectWorkspace(state,action:PayloadAction<Workspace>){if(!state.account?.workspaces.includes(action.payload))return;state.activeWorkspace=action.payload;const assignment=assignmentFor(state.account,action.payload);state.activeUnit=assignment?.unit??state.account.unit;state.activeAssignmentId=assignment?.id??null;if(assignment){state.account.role=assignment.role;state.account.unit=assignment.unit}},
 selectAssignment(state,action:PayloadAction<string>){const assignment=state.account?.assignments?.find(a=>a.id===action.payload&&a.status==='Active');if(!assignment||!state.account)return;state.activeAssignmentId=assignment.id;state.activeWorkspace=assignment.workspace;state.activeUnit=assignment.unit;state.account.role=assignment.role;state.account.unit=assignment.unit},
 selectMemberContext(state){if(!state.account?.workspaces.includes('Member'))return;const memberAssignment=state.account.assignments?.find(a=>a.workspace==='Member'&&a.status==='Active');state.activeWorkspace='Member';state.activeAssignmentId=memberAssignment?.id??null;state.activeUnit=memberAssignment?.unit??state.account.baseChapter;state.account.role=memberAssignment?.role??'Member';state.account.unit=memberAssignment?.unit??state.account.baseChapter},
  syncEffectiveAssignments(state,action:PayloadAction<AccountAssignment[]>){if(!state.account)return;const memberAssignments=(state.account.assignments??[]).filter(x=>x.workspace==='Member');const payloadNonMember=action.payload.filter(x=>x.workspace!=='Member');const effective=[...memberAssignments,...payloadNonMember].filter((x,i,all)=>all.findIndex(y=>y.id===x.id)===i);state.account.assignments=effective;const today=serverClock.todayIso();const active=effective.filter(x=>x.status==='Active'&&x.startsAt<=today&&x.endsAt>=today);state.account.workspaces=[...new Set(['Member' as Workspace,...active.map(x=>x.workspace)])] as Workspace[];if(state.activeAssignmentId&&!active.some(x=>x.id===state.activeAssignmentId)){const fallback=active.find(x=>x.workspace==='Member')??active[0];state.activeAssignmentId=fallback?.id??null;state.activeWorkspace=state.activeWorkspace??fallback?.workspace??'Member';state.activeUnit=fallback?.unit??state.account.unit;if(fallback){state.account.role=fallback.role;state.account.unit=fallback.unit}}else if(state.activeWorkspace&&!state.account.workspaces.includes(state.activeWorkspace)){const fallback=active.find(x=>x.workspace==='Member')??active[0];state.activeAssignmentId=fallback?.id??null;state.activeWorkspace=fallback?.workspace??'Member';state.activeUnit=fallback?.unit??state.account.unit;if(fallback){state.account.role=fallback.role;state.account.unit=fallback.unit}}},
 restoreSession(_state,action:PayloadAction<AuthState>){return action.payload}
},extraReducers:(builder)=>builder.addCase(signIn.pending,(state)=>{state.status='loading';state.error=undefined}).addCase(signIn.fulfilled,(state,action)=>{applyAccount(state,action.payload)}).addCase(signIn.rejected,(state,action)=>{state.status='failed';state.error=typeof action.payload==='string'?action.payload:'Unable to sign in. Check your email or account ID and password.'})});
export const{signOut,authenticateAccount,selectWorkspace,selectAssignment,selectMemberContext,syncEffectiveAssignments,restoreSession}=authSlice.actions;export default authSlice.reducer;
