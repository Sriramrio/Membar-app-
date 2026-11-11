import type { RootState } from '@/app/store';
export type { DataQualityIssue } from './operationalTypes';
export { registerDataQualityIssue,assignDataQualityIssue,resolveDataQualityIssue,applyDataQualityDecision } from './platformRuntimeSlice';
export const selectDataQualityIssues=(s:RootState)=>s.platformRuntime.dataQuality.issues;
