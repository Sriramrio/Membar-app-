import type { RootState } from '@/app/store';
export type { PlatformAuditEvent } from './operationalTypes';
export { recordAudit } from './platformRuntimeSlice';
export const selectAuditEvents=(s:RootState)=>s.platformRuntime.audit.events;
