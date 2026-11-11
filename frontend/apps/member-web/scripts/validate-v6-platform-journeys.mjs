import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root=path.resolve(new URL('..',import.meta.url).pathname);let failures=0,checks=0;
const read=f=>readFile(path.join(root,f),'utf8');const pass=m=>{checks++;console.log(`PASS: ${m}`)};const fail=m=>{checks++;failures++;console.error(`FAIL: ${m}`)};
async function markers(label,file,required){const t=await read(file);const miss=required.filter(x=>!t.includes(x));miss.length?fail(`${label} — missing ${miss.join(' | ')}`):pass(`${label} — ${required.length} handoffs`)}
await markers('Identity: Platform Admin mutation','src/features/platform-admin/identity/IdentityAdministrationPageV6.tsx',['updateIdentityRecord','Mandatory reason']);
await markers('Identity: protected access','src/routes/ProtectedRoute.tsx',['selectIdentityRecords','canIdentityAccessProtectedWorkspace','/access-status?status=']);
await markers('Identity: audited reducer','src/features/platform-runtime/platformRuntimeSlice.ts',['Update identity control',"resource:'Identity'"]);
await markers('Role: creation enters governance','src/features/platform-runtime/platformRuntimeSlice.ts',['addRoleAssignment','Pending Approval','Independent governance approval queue','Activate Role Assignment']);
await markers('Role: governance activation','src/features/platform-runtime/platformRuntimeSlice.ts',['Activate Role Assignment','approvedBy=d.id','applyGovernanceEffect']);
await markers('Role: protected route uses assignments','src/routes/ProtectedRoute.tsx',['selectRoleAssignments','effectiveWorkspaces','canAccessPath']);
await markers('Workflow: Control Plane creates task','src/app/controlPlaneRuntimeMiddleware.ts',['createWorkflowTask','resolveCanonicalWorkflowBlueprint','recordAudit']);
await markers('Workflow: Management executes task','src/features/management/pages/WorkflowInboxPage.tsx',['selectWorkflowTasks','workflowAction','RACI']);
await markers('Workflow: lifecycle/audit enforcement','src/features/platform-runtime/platformRuntimeSlice.ts',['workflowActionAllowed','Maker cannot be checker','Workflow ${a.payload.action}']);
await markers('Visitor: Public registration','src/features/public/pages/VisitorRegistrationPage.tsx',['saveVisitorDraft','submitVisitorRegistration']);
await markers('Visitor: Management review','src/features/management/pages/VisitorManagementPage.tsx',['verifyVisitorEmail','recommendVisitor','decideVisitor']);
await markers('Visitor: Member activation','src/features/management/pages/NewMemberOnboardingPage.tsx',['linkActivatedMember']);
await markers('Visitor: audit trail','src/features/platform-runtime/platformRuntimeSlice.ts',['Submit visitor registration','Membership decision →','Activate member from verified visitor']);
await markers('Governance: exception request','src/features/governance/pages/PolicyExceptionsPage.tsx',['selectPolicies','upsertPolicyException']);
await markers('Governance: vote/conflict/finalize','src/features/governance/pages/DecisionRegisterPage.tsx',['castGovernanceVote','declareGovernanceConflict','decideGovernance']);
await markers('Governance: guarded effect/audit','src/features/platform-runtime/platformRuntimeSlice.ts',['governanceFinalizationReason','applyGovernanceEffect','Governance decision →']);
await markers('Moderation: integration opens case','src/app/integrationMiddleware.ts',['openSystemModerationCase','applyCertificationReview']);
await markers('Moderation: Platform Admin claim/decision','src/features/platform-admin/pages/ModerationQueuePage.tsx',['claimModerationCase','decideModerationCase','Resolution note']);
await markers('Moderation: guarded/audited reducer','src/features/platform-runtime/platformRuntimeSlice.ts',['canTransitionModeration','Claim moderation case','Moderation decision →']);
await markers('Data quality: configured findings','src/features/platform-admin/pages/DataQualityCentrePage.tsx',['evaluateConfiguredDataQuality','registerDataQualityIssue','assignDataQualityIssue','resolveDataQualityIssue']);
await markers('Data quality: guarded remediation','src/features/platform-runtime/platformRuntimeSlice.ts',['canTransitionDataQuality','Resolution Proposed','Approve data-quality resolution']);
await markers('Data quality: workflow handoff','src/app/controlPlaneRuntimeMiddleware.ts',['assignDataQualityIssue','resolveDataQualityIssue','createWorkflowTask']);
await markers('Import: Platform Admin lifecycle','src/features/platform-admin/operations/ImportCentrePageV6.tsx',['validateImport','submitImportForCheck','approveImport','postImport','reverseImport']);
await markers('Import: maker/checker/reconcile audit','src/features/platform-runtime/platformRuntimeSlice.ts',['Maker/checker segregation','Checker Approved','Reconcile posted import','Reverse posted import']);
const sm=await import(pathToFileURL(path.join(root,'src/features/platform-runtime/stateMachines.ts')).href);
const pure=[
 ['identity Active grants protected workspace',sm.canIdentityAccessProtectedWorkspace('Active')],['identity Suspended blocks protected workspace',!sm.canIdentityAccessProtectedWorkspace('Suspended')],
 ['workflow Open → Claim',sm.workflowActionAllowed('Open','Claim').ok],['workflow terminal blocks Approve',!sm.workflowActionAllowed('Approved','Approve').ok],
 ['visitor Draft → Verification Pending',sm.canTransitionVisitor('Draft','Verification Pending')],['visitor Activated terminal',!sm.canTransitionVisitor('Activated','Approval Pending')],
 ['import Uploaded → Mapping',sm.canTransitionImport('Uploaded','Mapping')],['import Maker Submitted → Checker Approved',sm.canTransitionImport('Maker Submitted','Checker Approved')],['import Posted → Reconciled',sm.canTransitionImport('Posted','Reconciled')],['import Reversed terminal',!sm.canTransitionImport('Reversed','Posted')],
 ['moderation Open → Investigating',sm.canTransitionModeration('Open','Investigating')],['moderation Actioned terminal',!sm.canTransitionModeration('Actioned','Investigating')],
 ['DQ Open → Assigned',sm.canTransitionDataQuality('Open','Assigned')],['DQ Assigned → Resolution Proposed',sm.canTransitionDataQuality('Assigned','Resolution Proposed')],['DQ proposed → Resolved',sm.canTransitionDataQuality('Resolution Proposed','Resolved')],['DQ Resolved terminal',!sm.canTransitionDataQuality('Resolved','Assigned')],
 ['assignment Pending Approval → Active',sm.canTransitionAssignment('Pending Approval','Active')],['assignment Expired terminal',!sm.canTransitionAssignment('Expired','Active')],
 ['governance blocks conflict',sm.governanceFinalizationReason({immutable:false,votesFor:4,votesAgainst:0,abstentions:0,quorumRequired:3,conflicts:['x'],conflictRecords:[]})==='Unresolved conflict'],['governance blocks missing quorum',sm.governanceFinalizationReason({immutable:false,votesFor:1,votesAgainst:0,abstentions:0,quorumRequired:3,conflicts:[],conflictRecords:[]})==='Quorum not met'],['governance clean quorum allowed',sm.governanceFinalizationReason({immutable:false,votesFor:3,votesAgainst:0,abstentions:0,quorumRequired:3,conflicts:[],conflictRecords:[]})==='']
];
for(const [label,ok] of pure)ok?pass(`Pure lifecycle — ${label}`):fail(`Pure lifecycle — ${label}`);
const types=await read('src/features/platform-runtime/operationalTypes.ts');types.includes('export interface IdentityRecord')?pass('Canonical IdentityRecord is explicitly typed'):fail('Canonical IdentityRecord missing');
if(failures){console.error(`\nSETHU V6 Platform cross-workspace journey validation: FAIL (${failures}/${checks}).`);process.exit(1)}
console.log(`\nSETHU V6 Platform cross-workspace journey validation: PASS (${checks}/${checks} checks).`);
console.log('NOTE: P12 executes dependency-free lifecycle functions and validates cross-workspace UI/reducer/middleware handoffs structurally; dependency-backed component/browser execution remains P14.');
