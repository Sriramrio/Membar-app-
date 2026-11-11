import type { Workspace } from './screen';

export interface AccountAssignment {
  id:string;
  workspace:Exclude<Workspace,'Public'|'Workspace'>;
  role:string;
  unit:string;
  unitType:'Chapter'|'City'|'Region'|'State'|'National'|'Platform';
  startsAt:string;
  endsAt:string;
  status:'Scheduled'|'Active'|'Expired'|'Revoked';
}
export interface AppAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  baseChapter: string;
  workspaces: Workspace[];
  role: string;
  unit: string;
  status?: 'active' | 'inactive' | 'suspended' | 'expired';
  assignments?: AccountAssignment[];
  mfaEnabled?: boolean;
  memberId?: string;
}
export interface AuditEvent {
  id: string;
  occurredAt: string;
  recordedAt?: string;
  action: string;
  resource: string;
  recordId?: string;
  result: 'Succeeded' | 'Denied' | 'Pending' | 'Failed';
  actor: string;
  activeAssignment?: string;
  unit?: string;
  workspace: Workspace | 'System';
  reason?: string;
  workflowVersion?: string;
  policyVersion?: string;
  safeDiff?: string;
  idempotencyKey?: string;
  correlationId: string;
}
