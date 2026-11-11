import { stableClientId } from '@/utils/stableId';
import { signOut, selectAssignment, selectWorkspace } from '@/features/auth/authSlice';
import type { Workspace } from '@/types/screen';
import type { RootState } from '@/app/store';

type StoreLike={getState:()=>RootState;dispatch:(action:unknown)=>unknown;subscribe:(listener:()=>void)=>()=>void};
type CrossTabEvent={source:string;type:'auth.signOut'|'auth.workspace'|'auth.assignment';value?:string};

export function installCrossTabSync(store:StoreLike){
  if(typeof window==='undefined'||typeof BroadcastChannel==='undefined')return()=>undefined;
  const source=stableClientId('tab');const channel=new BroadcastChannel('sethu:v6:session');
  let previous=store.getState().auth;let applyingRemote=false;
  const publish=(event:Omit<CrossTabEvent,'source'>)=>channel.postMessage({...event,source} satisfies CrossTabEvent);
  const unsubscribe=store.subscribe(()=>{
    const current=store.getState().auth;
    if(!applyingRemote){
      if(previous.authenticated&&!current.authenticated)publish({type:'auth.signOut'});
      else if(current.authenticated&&previous.activeAssignmentId!==current.activeAssignmentId&&current.activeAssignmentId)publish({type:'auth.assignment',value:current.activeAssignmentId});
      else if(current.authenticated&&previous.activeWorkspace!==current.activeWorkspace&&current.activeWorkspace)publish({type:'auth.workspace',value:current.activeWorkspace});
    }
    previous=current;
  });
  channel.onmessage=(message:MessageEvent<CrossTabEvent>)=>{
    const event=message.data;if(!event||event.source===source)return;
    applyingRemote=true;
    try{
      if(event.type==='auth.signOut')store.dispatch(signOut());
      else if(event.type==='auth.assignment'&&event.value)store.dispatch(selectAssignment(event.value));
      else if(event.type==='auth.workspace'&&event.value)store.dispatch(selectWorkspace(event.value as Workspace));
    }finally{applyingRemote=false;previous=store.getState().auth;}
  };
  return()=>{unsubscribe();channel.close();};
}
