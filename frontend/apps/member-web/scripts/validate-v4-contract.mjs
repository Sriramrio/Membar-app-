import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const exists=(p)=>fs.existsSync(path.join(root,p));
let failures=0;let groups=0;
function requireTokens(label,file,tokens){groups++;const text=read(file);const missing=tokens.filter(t=>!text.includes(t));if(missing.length){failures++;console.error(`FAIL: ${label}: ${missing.length} marker(s) missing`);missing.forEach(t=>console.error(`  - ${t}`));}else console.log(`PASS: ${label}: ${tokens.length} required contract markers present`);}
function requireAbsent(label,files,tokens){groups++;const hits=[];for(const f of files){if(!exists(f))continue;const text=read(f);for(const t of tokens)if(text.includes(t))hits.push(`${f}: ${t}`);}if(hits.length){failures++;console.error(`FAIL: ${label}`);hits.forEach(x=>console.error(`  - ${x}`));}else console.log(`PASS: ${label}`);}
function allSourceFiles(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...allSourceFiles(p));else if(/\.(ts|tsx)$/.test(e.name))out.push(path.relative(root,p));}return out;}
const srcFiles=allSourceFiles(path.join(root,'src'));

console.log('SETHU V4 architecture/integration hardening validation');
requireTokens('Member/business graph domain','src/features/network/types.ts',['MemberBusinessAffiliation','BusinessRelationship','CertificationRecord','TaxonomyReference','OpportunityQuestion','primaryRepresentative','authorityLevel']);
requireTokens('Affiliation lifecycle','src/features/network/networkSlice.ts',['upsertAffiliation','setPrimaryAffiliation','endAffiliation','endedReason','applyCertificationReview']);
requireTokens('Governed affiliation UI','src/features/member/pages/MyBusinessesPage.tsx',['WFD-affiliation','setPrimaryAffiliation','endAffiliation','taxonomyRefs','evidenceName','ActionDialog']);
requireTokens('Business detail graph + evidence','src/features/network/pages/memberPages.tsx',['businessRelationships','certificationRecords','taxonomyRefs','verificationStatus']);
requireTokens('Business representative model','src/features/network/types.ts',['primaryRepresentativeId','ownerMemberIds','taxonomyRefs']);
requireTokens('Controlled taxonomy matching','src/features/member/pages/SmartMemberBusinessDirectoryPage.tsx',['taxonomyTerms','matchedTaxonomy','expandedTerms','taxonomyRefs','businessScore','Match score']);
requireTokens('Opportunity commercial chain','src/features/network/networkSlice.ts',['awardResponse','BusinessRelationship','transaction','counterpartyBusinessId']);
requireTokens('Opportunity Q&A + governed form','src/features/network/pages/memberPages.tsx',['askOpportunityQuestion','answerOpportunityQuestion',"purpose==='Opportunity'",'formVersion','customResponses','discussion']);
requireTokens('Event configurable form consumption','src/features/network/pages/memberPages.tsx',["purpose==='Event Registration'",'formVersion','acceptedTerms','waitlist']);
requireTokens('Event historical registration metadata','src/features/network/networkSlice.ts',['registrationResponses','registrationMeta','acceptedTermsAt',"status:'waitlisted'"]);
requireTokens('Event route uses governed implementation','src/features/member/pages/MemberEventDetailPage.tsx',['EventDetailPage']);
requireTokens('Import posts into live domains','src/app/integrationMiddleware.ts',['applyImportRecords','recordImportAppliedIds','reverseImportRecords','removeImportedVisitors']);
requireTokens('Effective assignments feed authorization','src/utils/permissions.ts',['effectiveAssignments','roleAssignments','startsAt','endsAt']);
requireTokens('Workspace hub consumes effective context','src/features/workspaces/pages/WorkspaceHubPage.tsx',['effectiveWorkspaces','effectiveAssignments']);
requireTokens('Workflow definition + RACI enforcement','src/features/enterprise/enterpriseSlice.ts',['workflowActionAllowed','requiredResponsibility.includes','Maker cannot be checker','does not permit','raciAllows']);
requireTokens('Data-quality maker/checker remediation','src/features/enterprise/enterpriseSlice.ts',['Resolution Proposed','applyDataQualityDecision','Data quality remediation','Ready for Decision']);
requireTokens('Governance enforcement/effects','src/features/enterprise/enterpriseSlice.ts',['castGovernanceVote','declareGovernanceRecusal','declareGovernanceConflict','applyGovernanceEffect','effectAppliedAt','immutable']);
requireTokens('Control plane is domain-specific','src/features/enterprise/pages/ControlPlanePages.tsx',['OrganisationHierarchyPage','RACIMatrixPage','WorkflowDesignerPage','FormBuilderPage','NotificationAdministrationPage','PromotionPolicyInventoryPage','ModerationQueuePage']);
requireTokens('Runtime policy/template integration','src/app/integrationMiddleware.ts',['notifyByEvent','setPromotionRuntimePolicy','business.affiliation.decided','certification.reviewed','transaction.status.changed','meeting.completed','reference.status.changed']);
requireTokens('Certification moderation loop','src/app/integrationMiddleware.ts',['openSystemModerationCase','decideModerationCase','applyCertificationReview']);
requireTokens('Security preview hardening','src/features/auth/authService.ts',['crypto.getRandomValues','attempts','expiresAt','sessionStorage','OTP']);
requireAbsent('No hard-coded preview OTP',['src/features/auth/authService.ts'],['246810']);
requireTokens('Protected state is session scoped through canonical persistence boundary','src/app/store.ts',['readRuntimeState','readSafePreferences','writeRuntimeState','writeSafePreferences','SafePersisted']);
requireTokens('Accessible governed dialogs','src/components/ui/ActionDialog.tsx',['aria-modal="true"','Escape','focusables','previous?.focus']);
requireAbsent('No native browser prompt/confirm for business actions',srcFiles,['window.prompt(','window.confirm(']);
requireAbsent('No routed generic OperationalPage',srcFiles,['@/features/operations/OperationalPage','features/operations/OperationalPage']);
requireTokens('Navigation context + operation feedback','src/layouts/MainLayout.tsx',['Breadcrumbs','OperationFeedback','skip-link']);
requireTokens('Route failure boundary','src/routes/AppRoutes.tsx',['RouteErrorBoundary']);
requireTokens('Error envelope mapping','src/services/api/errorMapper.ts',['correlationId','CONFLICT','RATE_LIMIT','OFFLINE','retryable']);
requireTokens('Correlation + idempotency headers','src/services/api/interceptors.ts',['X-Correlation-ID','Idempotency-Key']);
requireTokens('Moderation decisions are auditable','src/features/enterprise/enterpriseSlice.ts',['openSystemModerationCase','decideModerationCase','Moderation decision']);
requireAbsent('Member identity fails closed without seed fallback',['src/features/network/selectors.ts'],['members[0]','member-member']);
requireTokens('Illegal lifecycle transitions are denied and audited','src/app/integrationMiddleware.ts',['Illegal transition from',"result:'Denied'",'updateOpportunityStatus','updateResponseStatus','setPromotionStatus']);
requireAbsent('Durable local storage excludes protected runtime slices',['src/app/store.ts'],['operations:state.operations','visitors:state.enterprise.visitors','payments:state.network.payments','members:state.network.members']);
requireAbsent('No static preview password credential',['src/features/auth/authService.ts','src/features/auth/components/LoginForm.tsx'],['sethu2026','PREVIEW_PASSWORD=']);

if(failures){console.error(`FAIL: ${failures}/${groups} V4 contract groups failed.`);process.exit(1)}
console.log(`PASS: ${groups} V4 architecture/integration contract groups satisfied by source markers.`);
