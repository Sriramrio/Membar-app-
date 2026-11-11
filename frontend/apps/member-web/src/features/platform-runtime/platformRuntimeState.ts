import { initialPlatformRuntimeState } from './platformRuntimeData';
import type { PlatformRuntimeState } from './operationalTypes';

export type { PlatformRuntimeState } from './operationalTypes';
export { initialPlatformRuntimeState } from './platformRuntimeData';

export function mergePlatformRuntimeState(incoming:Partial<PlatformRuntimeState>|undefined,base:PlatformRuntimeState=initialPlatformRuntimeState):PlatformRuntimeState{
 const i=incoming as PlatformRuntimeState|undefined;
 return {
  visitorOnboarding:{applications:Array.isArray(i?.visitorOnboarding?.applications)?i.visitorOnboarding.applications:base.visitorOnboarding.applications},
  workflowRuntime:{tasks:Array.isArray(i?.workflowRuntime?.tasks)?i.workflowRuntime.tasks:base.workflowRuntime.tasks},
  importOperations:{batches:Array.isArray(i?.importOperations?.batches)?i.importOperations.batches:base.importOperations.batches},
  authorisation:{assignments:Array.isArray(i?.authorisation?.assignments)?i.authorisation.assignments:base.authorisation.assignments},
  governance:{
   policies:Array.isArray(i?.governance?.policies)?i.governance.policies:base.governance.policies,
   policyExceptions:Array.isArray(i?.governance?.policyExceptions)?i.governance.policyExceptions:base.governance.policyExceptions,
   boardPacks:Array.isArray(i?.governance?.boardPacks)?i.governance.boardPacks:base.governance.boardPacks,
   strategyOutcomes:Array.isArray(i?.governance?.strategyOutcomes)?i.governance.strategyOutcomes:base.governance.strategyOutcomes,
   decisions:Array.isArray(i?.governance?.decisions)?i.governance.decisions:base.governance.decisions,
  },
  moderation:{cases:Array.isArray(i?.moderation?.cases)?i.moderation.cases:base.moderation.cases},
  dataQuality:{issues:Array.isArray(i?.dataQuality?.issues)?i.dataQuality.issues:base.dataQuality.issues},
  identitySecurity:{
   identities:Array.isArray(i?.identitySecurity?.identities)?i.identitySecurity.identities:base.identitySecurity.identities,
   sessions:Array.isArray(i?.identitySecurity?.sessions)?i.identitySecurity.sessions:base.identitySecurity.sessions,
  },
  audit:{events:Array.isArray(i?.audit?.events)?i.audit.events:base.audit.events},
 };
}
