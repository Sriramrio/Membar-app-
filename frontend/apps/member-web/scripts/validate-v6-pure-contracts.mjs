import { canAuthenticateAccountStatus,isSafeLocalReturnPath } from '../src/features/auth/authPolicy.ts';
import { safeExternalHttpUrl } from '../src/utils/urlSecurity.ts';
import {
 canIdentityAccessProtectedWorkspace,workflowActionAllowed,managementDecisionRoleAllowed,membershipDecisionRoleAllowed,
 canTransitionVisitor,canTransitionImport,canTransitionModeration,canTransitionDataQuality,canTransitionAssignment,governanceFinalizationReason
} from '../src/features/platform-runtime/stateMachines.ts';
let pass=0,fail=0;const ok=(name,cond)=>{if(cond){pass++;console.log(`PASS: ${name}`)}else{fail++;console.error(`FAIL: ${name}`)}};
ok('active identity allowed',canIdentityAccessProtectedWorkspace('Active'));
ok('suspended identity denied',!canIdentityAccessProtectedWorkspace('Suspended'));
ok('inactive preview auth denied',!canAuthenticateAccountStatus('inactive'));
ok('safe local return allowed',isSafeLocalReturnPath('/app/home?from=login'));
ok('protocol-relative return denied',!isSafeLocalReturnPath('//evil.example'));
ok('encoded protocol-relative return denied',!isSafeLocalReturnPath('/%2F%2Fevil.example'));
ok('external domain normalises to HTTPS',safeExternalHttpUrl('example.com')==='https://example.com/');
ok('javascript URL denied',safeExternalHttpUrl('javascript:alert(1)')===undefined);
ok('data URL denied',safeExternalHttpUrl('data:text/html,hello')===undefined);
ok('workflow claimed can approve',workflowActionAllowed('Claimed','Approve').ok);
ok('workflow approved cannot reject',!workflowActionAllowed('Approved','Reject').ok);
ok('accountable role normalization works',managementDecisionRoleAllowed('Chapter Secretary','chapter-secretary'));
ok('wrong accountable role denied',!managementDecisionRoleAllowed('Chapter Secretary','State Reviewer'));
ok('membership decision allows Chapter Secretary',membershipDecisionRoleAllowed('Chapter Secretary'));
ok('membership decision denies State Reviewer',!membershipDecisionRoleAllowed('State Reviewer'));
ok('visitor Approved→Activated allowed',canTransitionVisitor('Approved','Activated'));
ok('visitor Activated terminal',!canTransitionVisitor('Activated','Approved'));
ok('import maker→checker allowed',canTransitionImport('Maker Submitted','Checker Approved'));
ok('import Reversed terminal',!canTransitionImport('Reversed','Posted'));
ok('moderation Open→Investigating allowed',canTransitionModeration('Open','Investigating'));
ok('moderation Actioned terminal',!canTransitionModeration('Actioned','Open'));
ok('DQ Assigned→Resolution Proposed allowed',canTransitionDataQuality('Assigned','Resolution Proposed'));
ok('DQ Resolved terminal',!canTransitionDataQuality('Resolved','Assigned'));
ok('assignment Pending Approval→Active allowed',canTransitionAssignment('Pending Approval','Active'));
ok('assignment Expired terminal',!canTransitionAssignment('Expired','Active'));
const base={immutable:false,votesFor:2,votesAgainst:0,abstentions:0,quorumRequired:2,conflicts:[],conflictRecords:[]};
ok('governance clean quorum finalizable',governanceFinalizationReason(base)==='');
ok('governance immutable blocked',governanceFinalizationReason({...base,immutable:true})==='Decision is already immutable');
ok('governance conflict blocked',governanceFinalizationReason({...base,conflicts:['member-1']})==='Unresolved conflict');
ok('governance insufficient quorum blocked',governanceFinalizationReason({...base,votesFor:1})==='Quorum not met');
if(fail){console.error(`\nPure executable contracts: FAIL — ${pass} passed, ${fail} failed.`);process.exit(1)}
console.log(`\nPure executable contracts: PASS — ${pass}/${pass}.`);
