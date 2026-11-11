import type { PlatformControlState } from '@/features/control-plane/types';
import type { WorkflowTaskBlueprint } from './operationalTypes';

export function resolveCanonicalWorkflowBlueprint(state:PlatformControlState,reference:string,caseType?:string):WorkflowTaskBlueprint|undefined {
 const workflow=state.workflows.find(w=>w.active&&w.status==='Active'&&(w.id===reference||w.code===reference||w.name===reference||w.domain===reference));
 if(!workflow)return undefined;
 const sla=workflow.slaPolicyId?state.slaPolicies.find(s=>s.id===workflow.slaPolicyId&&s.active):undefined;
 const hours=sla?Math.max(1,...Object.values(sla.stageHours),sla.escalationHours):48;
 return {definitionId:workflow.id,caseType:caseType??workflow.name,workflowVersion:`${workflow.code}@v${workflow.version}`,slaHours:hours};
}

import type { RootState } from '@/app/store';
export { createWorkflowTask,workflowAction } from './platformRuntimeSlice';
export const selectWorkflowTasks=(s:RootState)=>s.platformRuntime.workflowRuntime.tasks;
