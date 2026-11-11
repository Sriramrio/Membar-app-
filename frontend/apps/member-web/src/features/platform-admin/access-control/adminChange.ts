import { stableClientId } from '@/utils/stableId';
import type { useAppDispatch } from '@/app/hooks';
import { proposeConfigurationChange } from '@/features/control-plane/controlPlaneSlice';
import type { ConfigArtifactType } from '@/features/control-plane/types';
export const newAdminId=(prefix:string)=>stableClientId(prefix);
export const adminSelectClass='min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100';
export function proposeAdminChange(dispatch:ReturnType<typeof useAppDispatch>,actor:string,artifactType:ConfigArtifactType,artifactId:string,draft:unknown,changeSummary:string,reason:string,affectedModules:string[]){dispatch(proposeConfigurationChange({artifactType,artifactId,draft,actor,changeSummary,reason,affectedModules}))}
