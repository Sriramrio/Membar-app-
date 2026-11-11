import type { RootState } from '@/app/store';
export type { EffectiveRoleAssignment } from './operationalTypes';
export { addRoleAssignment,updateRoleAssignmentStatus,updateHandover } from './platformRuntimeSlice';
export const selectRoleAssignments=(s:RootState)=>s.platformRuntime.authorisation.assignments;
