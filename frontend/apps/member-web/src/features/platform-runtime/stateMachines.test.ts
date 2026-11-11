import { describe, expect, it } from 'vitest';
import {
  canIdentityAccessProtectedWorkspace,
  canTransitionAssignment,
  canTransitionDataQuality,
  canTransitionImport,
  canTransitionModeration,
  canTransitionVisitor,
  governanceFinalizationReason,
  managementDecisionRoleAllowed,
  membershipDecisionRoleAllowed,
  workflowActionAllowed,
} from './stateMachines';

describe('canonical operational state machines', () => {
  it('fails closed for identity and accountable-role decisions', () => {
    expect(canIdentityAccessProtectedWorkspace('Active')).toBe(true);
    expect(canIdentityAccessProtectedWorkspace('Suspended')).toBe(false);
    expect(managementDecisionRoleAllowed('Chapter Secretary', 'chapter-secretary')).toBe(true);
    expect(managementDecisionRoleAllowed('Chapter Secretary', 'State Reviewer')).toBe(false);
    expect(membershipDecisionRoleAllowed('Chapter Secretary')).toBe(true);
    expect(membershipDecisionRoleAllowed('State Reviewer')).toBe(false);
  });

  it('enforces terminal and legal operational transitions', () => {
    expect(workflowActionAllowed('Claimed', 'Approve').ok).toBe(true);
    expect(workflowActionAllowed('Approved', 'Reject').ok).toBe(false);
    expect(canTransitionVisitor('Approved', 'Activated')).toBe(true);
    expect(canTransitionVisitor('Activated', 'Approved')).toBe(false);
    expect(canTransitionImport('Maker Submitted', 'Checker Approved')).toBe(true);
    expect(canTransitionImport('Reversed', 'Posted')).toBe(false);
    expect(canTransitionModeration('Open', 'Investigating')).toBe(true);
    expect(canTransitionModeration('Actioned', 'Open')).toBe(false);
    expect(canTransitionDataQuality('Assigned', 'Resolution Proposed')).toBe(true);
    expect(canTransitionDataQuality('Resolved', 'Assigned')).toBe(false);
    expect(canTransitionAssignment('Pending Approval', 'Active')).toBe(true);
    expect(canTransitionAssignment('Expired', 'Active')).toBe(false);
  });

  it('blocks governance finalisation when immutable, conflicted or below quorum', () => {
    const base={immutable:false,votesFor:2,votesAgainst:0,abstentions:0,quorumRequired:2,conflicts:[],conflictRecords:[]};
    expect(governanceFinalizationReason(base)).toBe('');
    expect(governanceFinalizationReason({...base,immutable:true})).toBe('Decision is already immutable');
    expect(governanceFinalizationReason({...base,conflicts:['member-1']})).toBe('Unresolved conflict');
    expect(governanceFinalizationReason({...base,votesFor:1,quorumRequired:2})).toBe('Quorum not met');
  });
});
