import type { RootState } from '@/app/store';
export type { ModerationCase } from './operationalTypes';
export { upsertModerationCase,claimModerationCase,openSystemModerationCase,decideModerationCase } from './platformRuntimeSlice';
export const selectModerationCases=(s:RootState)=>s.platformRuntime.moderation.cases;
