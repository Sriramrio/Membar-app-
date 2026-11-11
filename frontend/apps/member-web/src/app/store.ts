import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';
import { readRuntimeState, readSafePreferences, writeMigrationMarker } from '@/migrations/storageMigration';
import { migrateToV6Baseline } from '@/migrations/v6Baseline';
import { initialNetworkState } from '@/features/network/networkSlice';
import { initialOperationsState } from '@/features/operations/operationsSlice';
import { initialPlatformRuntimeState } from '@/features/platform-runtime/platformRuntimeState';
import { integrationMiddleware } from './integrationMiddleware';
import { authorizationMiddleware } from './authorizationMiddleware';
import { initialPlatformControlState } from '@/features/control-plane/data';
import type { PlatformControlState } from '@/features/control-plane/types';
import { controlPlaneRuntimeMiddleware, controlPlaneRuntimeSyncRequested } from './controlPlaneRuntimeMiddleware';
import { scheduleStatePersistence, flushStatePersistence } from './persistenceScheduler';
import { env } from '@/config/env';
import { mutationMode } from '@/services/api/domainPersistence';

interface SafePersisted {
  network?: Pick<typeof initialNetworkState,'savedBusinessIdsByMember'|'savedOpportunityIdsByMember'|'preferencesByMember'|'promotionViewsByMember'>;
  enterprise?: Record<string,unknown>; // legacy persisted compatibility, consumed only by migration
  platformRuntime?: {governance?:Pick<typeof initialPlatformRuntimeState['governance'],'policies'|'policyExceptions'>};
  controlPlane?: Partial<PlatformControlState>;
}

function getPreloadedState(): ReturnType<typeof rootReducer> | undefined {
  const serverAuthoritative=mutationMode()==='server-authoritative';
  const rawRuntime=env.clientRuntimePersistence?readRuntimeState<Partial<ReturnType<typeof rootReducer>>>():undefined;
  const runtime=serverAuthoritative&&rawRuntime
    ? ({ auth: rawRuntime.auth, memberNavigation: rawRuntime.memberNavigation } as Partial<ReturnType<typeof rootReducer>>)
    : rawRuntime;
  const safeRaw=readSafePreferences<SafePersisted>();
  const safe=env.clientRuntimePersistence?safeRaw:(safeRaw?{network:safeRaw.network}:undefined);
  if(!runtime&&!safe)return undefined;
  const baseState=rootReducer(undefined,{type:'@@INIT'});
  const migrated=migrateToV6Baseline({runtime:runtime as Record<string,any>|undefined,safe:safe as any,baseState:baseState as unknown as Record<string,any>});
  writeMigrationMarker(migrated.metadata);
  return migrated.state as ReturnType<typeof rootReducer>;
}
const preloadedState=getPreloadedState();
export const store=configureStore({reducer:rootReducer,preloadedState,middleware:(getDefault)=>getDefault({serializableCheck:{warnAfter:64}}).concat(authorizationMiddleware,integrationMiddleware,controlPlaneRuntimeMiddleware)});
store.dispatch(controlPlaneRuntimeSyncRequested());
store.subscribe(()=>scheduleStatePersistence(store.getState()));
if(typeof window!=='undefined'){
  const flush=()=>flushStatePersistence(store.getState());
  window.addEventListener('pagehide',flush);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});
}
export type RootState=ReturnType<typeof store.getState>;
export type AppDispatch=typeof store.dispatch;
