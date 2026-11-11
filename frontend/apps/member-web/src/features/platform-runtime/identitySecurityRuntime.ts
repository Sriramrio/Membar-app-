import type { RootState } from '@/app/store';
export type { IdentityRecord,DeviceSession } from './operationalTypes';
export { updateIdentityRecord,revokeSession,revokeOtherSessions } from './platformRuntimeSlice';
export const selectIdentityRecords=(s:RootState)=>s.platformRuntime.identitySecurity.identities;
export const selectDeviceSessions=(s:RootState)=>s.platformRuntime.identitySecurity.sessions;
export const selectIdentityForAccount=(accountId?:string)=>(s:RootState)=>accountId?s.platformRuntime.identitySecurity.identities.find(i=>i.accountId===accountId):undefined;
