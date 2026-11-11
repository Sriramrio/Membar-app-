import type { RootState } from '@/app/store';
export type { PolicyRecord,PolicyException,BoardPack,StrategyOutcome,GovernanceDecision } from './operationalTypes';
export { acknowledgeBoardPack,upsertPolicy,upsertPolicyException,upsertStrategyOutcome,castGovernanceVote,declareGovernanceConflict,declareGovernanceRecusal,resolveGovernanceConflict,decideGovernance } from './platformRuntimeSlice';
export const selectPolicies=(s:RootState)=>s.platformRuntime.governance.policies;
export const selectPolicyExceptions=(s:RootState)=>s.platformRuntime.governance.policyExceptions;
export const selectBoardPacks=(s:RootState)=>s.platformRuntime.governance.boardPacks;
export const selectStrategyOutcomes=(s:RootState)=>s.platformRuntime.governance.strategyOutcomes;
export const selectGovernanceDecisions=(s:RootState)=>s.platformRuntime.governance.decisions;
export const selectGovernanceAudit=(s:RootState)=>s.platformRuntime.audit.events.filter(a=>a.workspace==='Governance'||a.resource==='GovernanceDecision'||a.resource==='RoleAssignment');
