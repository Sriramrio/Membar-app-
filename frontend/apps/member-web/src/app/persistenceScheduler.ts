import type { RootState } from './store';
import { env } from '@/config/env';
import { writeRuntimeState, writeSafePreferences } from '@/migrations/storageMigration';
import type { PlatformControlState } from '@/features/control-plane/types';
import { initialNetworkState } from '@/features/network/networkSlice';
import { initialPlatformRuntimeState } from '@/features/platform-runtime/platformRuntimeState';

type State=RootState;
interface SafePersisted {
  network?: Pick<typeof initialNetworkState,'savedBusinessIdsByMember'|'savedOpportunityIdsByMember'|'preferencesByMember'|'promotionViewsByMember'>;
  enterprise?: Record<string,unknown>;
  platformRuntime?: {governance?:Pick<typeof initialPlatformRuntimeState['governance'],'policies'|'policyExceptions'>};
  controlPlane?: Partial<PlatformControlState>;
}

let timer:ReturnType<typeof setTimeout>|undefined;
let previousSafeRefs:unknown[]=[];
let previousRuntimeRefs:unknown[]=[];

function changed(previous:unknown[],next:unknown[]){return previous.length!==next.length||next.some((v,i)=>v!==previous[i]);}

function safeRefs(state:State){return [
  state.network.savedBusinessIdsByMember,state.network.savedOpportunityIdsByMember,state.network.preferencesByMember,state.network.promotionViewsByMember,
  state.platformRuntime.governance.policies,state.platformRuntime.governance.policyExceptions,state.controlPlane,
];}
function runtimeRefs(state:State){return [state.auth,state.network,state.operations,state.platformRuntime,state.controlPlane,state.memberNavigation];}

function safePayload(state:State):SafePersisted{
  const network={savedBusinessIdsByMember:state.network.savedBusinessIdsByMember,savedOpportunityIdsByMember:state.network.savedOpportunityIdsByMember,preferencesByMember:state.network.preferencesByMember,promotionViewsByMember:state.network.promotionViewsByMember};
  if(!env.clientRuntimePersistence)return {network};
  return {
    network,
    platformRuntime:{governance:{policies:state.platformRuntime.governance.policies,policyExceptions:state.platformRuntime.governance.policyExceptions}},
    controlPlane:state.controlPlane,
  };
}

function persist(state:State){
  const nextSafe=safeRefs(state);
  if(changed(previousSafeRefs,nextSafe)){
    writeSafePreferences<SafePersisted>(safePayload(state));
    previousSafeRefs=nextSafe;
  }
  if(env.clientRuntimePersistence){
    const nextRuntime=runtimeRefs(state);
    if(changed(previousRuntimeRefs,nextRuntime)){
      const account=state.auth.account?{...state.auth.account,password:undefined}:null;
      writeRuntimeState({...state,auth:{...state.auth,account}});
      previousRuntimeRefs=nextRuntime;
    }
  }
}

export function scheduleStatePersistence(state:State,delayMs=500){
  if(state.auth.authenticated && changed(previousRuntimeRefs, runtimeRefs(state))) {
    flushStatePersistence(state);
    return;
  }
  if(timer)clearTimeout(timer);
  timer=setTimeout(()=>{timer=undefined;persist(state);},Math.max(100,delayMs));
}

export function flushStatePersistence(state:State){
  if(timer){clearTimeout(timer);timer=undefined;}
  persist(state);
}
