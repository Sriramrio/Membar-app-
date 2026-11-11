import type {
 BoardPack,DataQualityIssue,DeviceSession,EffectiveRoleAssignment,PlatformAuditEvent,GovernanceDecision,IdentityRecord,ImportBatch,
 ModerationCase,PlatformRuntimeState,PolicyException,PolicyRecord,StrategyOutcome,VisitorApplication,WorkflowTask,
} from '@/features/platform-runtime/operationalTypes';
import { initialPlatformRuntimeState } from '@/features/platform-runtime/platformRuntimeData';

/** Historical persisted V3/V4/V5 enterprise operational shape. Migration input only. */
export interface LegacyEnterpriseOperationalState {
 visitors:VisitorApplication[];
 workflowTasks:WorkflowTask[];
 imports:ImportBatch[];
 roleAssignments:EffectiveRoleAssignment[];
 policies:PolicyRecord[];
 policyExceptions:PolicyException[];
 boardPacks:BoardPack[];
 strategyOutcomes:StrategyOutcome[];
 moderationCases:ModerationCase[];
 dataQualityIssues:DataQualityIssue[];
 identityRecords:IdentityRecord[];
 governanceDecisions:GovernanceDecision[];
 sessions:DeviceSession[];
 audit:PlatformAuditEvent[];
}

const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;

export function fromLegacyEnterpriseState(source:LegacyEnterpriseOperationalState):PlatformRuntimeState{return{
 visitorOnboarding:{applications:clone(source.visitors)},
 workflowRuntime:{tasks:clone(source.workflowTasks)},
 importOperations:{batches:clone(source.imports)},
 authorisation:{assignments:clone(source.roleAssignments)},
 governance:{policies:clone(source.policies),policyExceptions:clone(source.policyExceptions),boardPacks:clone(source.boardPacks),strategyOutcomes:clone(source.strategyOutcomes),decisions:clone(source.governanceDecisions)},
 moderation:{cases:clone(source.moderationCases)},
 dataQuality:{issues:clone(source.dataQualityIssues)},
 identitySecurity:{identities:clone(source.identityRecords),sessions:clone(source.sessions)},
 audit:{events:clone(source.audit)},
};}

export function toLegacyEnterpriseState(source:PlatformRuntimeState):LegacyEnterpriseOperationalState{return{
 visitors:clone(source.visitorOnboarding.applications),
 workflowTasks:clone(source.workflowRuntime.tasks),
 imports:clone(source.importOperations.batches),
 roleAssignments:clone(source.authorisation.assignments),
 policies:clone(source.governance.policies),
 policyExceptions:clone(source.governance.policyExceptions),
 boardPacks:clone(source.governance.boardPacks),
 strategyOutcomes:clone(source.governance.strategyOutcomes),
 moderationCases:clone(source.moderation.cases),
 dataQualityIssues:clone(source.dataQuality.issues),
 identityRecords:clone(source.identitySecurity.identities),
 governanceDecisions:clone(source.governance.decisions),
 sessions:clone(source.identitySecurity.sessions),
 audit:clone(source.audit.events),
};}

export const initialLegacyEnterpriseOperationalState:LegacyEnterpriseOperationalState=toLegacyEnterpriseState(initialPlatformRuntimeState);
