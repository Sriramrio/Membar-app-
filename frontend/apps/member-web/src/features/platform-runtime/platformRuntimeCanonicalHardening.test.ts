import { describe,expect,it } from 'vitest';
import reducer,{addRoleAssignment,decideModerationCase,openSystemModerationCase,resolveDataQualityIssue,updateHandover,workflowAction} from './platformRuntimeSlice';
import { initialPlatformRuntimeState } from './platformRuntimeData';

const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;

describe('Canonical V6 platform-runtime governance hardening',()=>{
  it('denies maker-checker self approval and writes a denied audit event',()=>{
    const base=clone(initialPlatformRuntimeState);const task=base.workflowRuntime.tasks.find(t=>t.id==='WF-2401')!;
    const state=reducer(base,workflowAction({id:task.id,action:'Approve',actor:task.maker,actorRole:task.accountableRole,reason:'Self approve attempt'}));
    expect(state.workflowRuntime.tasks.find(t=>t.id===task.id)?.status).toBe(task.status);
    expect(state.audit.events[0]?.result).toBe('Denied');
  });

  it('prevents overlapping exclusive offices',()=>{
    const base=clone(initialPlatformRuntimeState);const existing=base.authorisation.assignments.find(r=>r.id==='RA-1')!;
    const state=reducer(base,addRoleAssignment({...existing,id:'RA-overlap',memberName:'Other Officer',accountId:undefined,approvedBy:'Platform Admin'}));
    expect(state.authorisation.assignments.some(r=>r.id==='RA-overlap')).toBe(false);
    expect(state.audit.events[0]?.reason).toBe('Overlapping exclusive office');
  });

  it('requires legal handover sequence and a successor before completion',()=>{
    const base=clone(initialPlatformRuntimeState);const existing=base.authorisation.assignments.find(r=>r.id==='RA-1')!;
    const state=reducer(base,updateHandover({id:existing.id,status:'Complete',actor:'Governance Reviewer'}));
    expect(state.authorisation.assignments.find(r=>r.id===existing.id)?.handoverStatus).toBe(existing.handoverStatus);
    expect(state.audit.events[0]?.result).toBe('Denied');
  });

  it('keeps data-quality remediation pending until workflow approval',()=>{
    const state=reducer(clone(initialPlatformRuntimeState),resolveDataQualityIssue({id:'DQ-1',actor:'Platform Reviewer',resolution:'Evidence uploaded and verified against source'}));
    expect(state.dataQuality.issues.find(x=>x.id==='DQ-1')?.status).toBe('Resolution Proposed');
  });

  it('records explicit moderation resolution rather than a generic action flag',()=>{
    const opened=reducer(clone(initialPlatformRuntimeState),openSystemModerationCase({id:'MOD-P09',resource:'Business',recordId:'business-010',reason:'Certification evidence requires review'}));
    const state=reducer(opened,decideModerationCase({id:'MOD-P09',actor:'Platform Reviewer',resolution:'Remediated',note:'Evidence corrected'}));
    expect(state.moderation.cases.find(x=>x.id==='MOD-P09')?.resolution).toBe('Remediated');
    expect(state.moderation.cases.find(x=>x.id==='MOD-P09')?.status).toBe('Actioned');
  });
});
