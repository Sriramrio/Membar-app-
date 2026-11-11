import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>fs.readFileSync(path.isAbsolute(p)?p:path.join(root,p),'utf8');
const failures=[];let passed=0;
function group(name,file,tokens){const text=read(file);const missing=tokens.filter(t=>!text.includes(t));if(missing.length){failures.push(`${name}: missing ${missing.join(' | ')} in ${file}`);console.error(`FAIL: ${name}`)}else{passed++;console.log(`PASS: ${name}: ${tokens.length} required contract markers present`)}}
function assert(name,ok,detail=''){if(!ok){failures.push(`${name}${detail?`: ${detail}`:''}`);console.error(`FAIL: ${name}`)}else{passed++;console.log(`PASS: ${name}`)}}

group('V5 configuration/version state','src/features/control-plane/types.ts',['PlatformConfigurationVersion','ConfigurationChange','baseArtifactVersion','idempotencyKey','conflictDetected','validatedAt','impactAnalysedAt']);
group('Central module/action/permission registries','src/features/control-plane/types.ts',['ModuleDefinition','ActionDefinition','runtimeActionTypes','PermissionDefinition','ConfigArtifactType']);
group('Organisation hierarchy model','src/features/control-plane/types.ts',['OrganisationUnitTypeDefinition','OrganisationUnitDefinition','parentTypeIds','successorUnitId']);
group('Role catalogue and effective policy model','src/features/control-plane/types.ts',['RoleDefinition','AccessPolicyRule','PolicyOutcome','scopeMode']);
group('RACI/workflow executable model','src/features/control-plane/types.ts',['RaciDefinition','WorkflowBlueprint','WorkflowTransitionDefinition','makerCheckerPolicyId']);
group('SLA and maker-checker policies','src/features/control-plane/types.ts',['SlaPolicy','MakerCheckerPolicy','secondChecker','independentIdentity']);
group('Dynamic form/version contract','src/features/control-plane/types.ts',['DynamicFormDefinition','DynamicFormField','FormFieldType','taxonomyDomain']);
group('Taxonomy and explainable matching','src/features/control-plane/types.ts',['TaxonomyDefinition','MatchingPolicyDefinition','searchableFields','minimumScore']);
group('Notification event/template/routing','src/features/control-plane/types.ts',['NotificationEventDefinition','NotificationTemplateDefinition','NotificationRoutingPolicy','dedupeMinutes']);
group('Promotion policy runtime contract','src/features/control-plane/types.ts',['PromotionPolicyDefinition','memberImpressionCap','moderationRequired']);
group('Import profile configuration','src/features/control-plane/types.ts',['ImportProfile','fieldMap','requiredFields','duplicateFields','postingTarget','reversalSupported']);
group('Integration and webhook contracts','src/features/control-plane/types.ts',['IntegrationDefinition','WebhookDefinition','secretReference','circuitBreakerFailures','signingRequired']);
group('Data-quality/settings/operational policies','src/features/control-plane/types.ts',['DataQualityRuleDefinition','SettingDefinition','SettingOverride','FeatureFlagDefinition','RetentionPolicyDefinition','NumberingRuleDefinition']);
group('Domain-event/security observability','src/features/control-plane/types.ts',['DomainEventCatalogueEntry','DomainEventRecord','SecurityEvent','correlationId','result']);
group('Configuration release lifecycle','src/features/control-plane/controlPlaneSlice.ts',['validateConfigurationChange','analyseConfigurationImpact','submitConfigurationChange','approveConfigurationChange','activateConfigurationChange','rollbackConfigurationChange','Concurrency conflict']);
group('Independent configuration approval','src/features/control-plane/controlPlaneSlice.ts',['Maker cannot approve own configuration change.','Independent checker approval is required before activation.']);
group('Governed rollback','src/features/control-plane/controlPlaneSlice.ts',['Rollback request','rollbackOf:source.id','status:\'Draft\'','idempotencyKey:`rollback:${source.id}`']);
group('Configuration artifact validation','src/features/control-plane/controlPlaneSlice.ts',['validateChange','Notification Route','Maker Checker','Matching Policy','circular reference']);
group('Impact analysis and dependency awareness','src/features/control-plane/controlPlaneSlice.ts',['impactFor','affectedModules','Workflow runtime']);
group('Scope/inheritance selector','src/features/control-plane/selectors.ts',['selectEffectiveSetting','parentId','effectiveFrom','effectiveTo']);
group('Fail-closed RBAC policy engine','src/features/control-plane/policyEngine.ts',['Fail closed: permission missing','No effective role grants this permission.','Deny','descendantUnitIds','requiresReauth']);
group('Platform route authorization','src/routes/ProtectedRoute.tsx',['evaluateControlPermission','platformPathPermission','module-disabled']);
group('Runtime action authorization middleware','src/app/authorizationMiddleware.ts',['runtimeActionTypes','evaluateControlPermission','recordSecurityEvent','Denied sensitive action']);
group('V5 RACI/workflow behavior preserved by V6','src/app/authorizationMiddleware.ts',['Active workflow','V6 RACI denies','Maker/checker policy requires','firstChecker']);
group('Profile-driven import authorization','src/app/authorizationMiddleware.ts',['makerCheckerPolicyId','Maker role must be one of','Checker role must be one of','reversalSupported']);
group('Control-plane runtime synchronisation','src/app/controlPlaneRuntimeMiddleware.ts',['activateConfigurationChange','controlPlaneRuntimeSyncRequested','controlPlaneSync','applyWorkflowSla','slaPolicyId']);
group('V4 data migration compatibility preserved by V6','src/migrations/legacyV4ControlPlane.ts',['hydrateV4PlatformState','preserve','notificationTemplates','promotionPolicies','version:4']);
group('V6 runtime projection preserves retained operational contracts','src/features/control-plane/runtimeProjection.ts',['runtimeWorkflows','runtimeForms','runtimeNotifications','runtimePromotionPolicies','runtimeOrganisationUnits']);
group('Notification routing consumed at runtime','src/app/integrationMiddleware.ts',['notificationRoutes','dedupeMinutes','deliveryMode','notificationTemplates']);
group('Import posting reaches live domains','src/app/integrationMiddleware.ts',['applyImportRecords','saveVisitorDraft','applyApprovedTaxonomyImport','recordImportAppliedIds']);
group('Import validation pinned to profile','src/features/enterprise/enterpriseSlice.ts',['requiredFields','duplicateFields','profileVersion','reversalSupported']);
group('Import application supports business/member domains','src/features/network/networkSlice.ts',['applyImportRecords','Business','MemberBusinessAffiliation','reverseImportRecords']);
group('Platform administration dashboard/control plane','src/features/control-plane/pages/PlatformAdminV6Pages.tsx',['V6 Control Plane','Configuration release queue','Control-plane linkage']);
assert('Governed Platform Admin configuration screens',read('src/features/platform-admin/workflow-taxonomy/WorkflowDesignerPageV6.tsx').includes('Workflow Designer')&&read('src/features/platform-admin/access-control/OrganisationHierarchyPageV6.tsx').includes('Create governed draft')&&read('src/features/platform-admin/access-control/RBACPageV6.tsx').includes('RBAC Policy Engine & Simulator')&&read('src/features/control-plane/components/ConfigurationReleasePanel.tsx').includes('Configuration diff / previous version'));
group('Governed operational policy editors','src/features/control-plane/components/AdminPolicyEditors.tsx',['Import Profile administration','Operational control policies','Security events','Create governed draft']);
group('Configuration release UX gates','src/features/control-plane/components/ConfigurationReleasePanel.tsx',['Validated','Impact analysed','Configuration diff / previous version','disabled={!c.validatedAt||!c.impactAnalysedAt']);
group('Control-plane reusable hooks','src/features/control-plane/hooks.ts',['useEffectiveSetting','usePermissionDecision','useEffectiveWorkflow','useFormDefinition','useNotificationTemplate','useTaxonomy','useOrganisationScope','usePromotionPolicy']);
group('Module registry drives navigation','src/components/layout/Sidebar.tsx',['cp.modules','platformPathPermission','evaluateControlPermission']);
group('Admin command search covers control plane','src/components/layout/Header.tsx',['controlPlane.roles','controlPlane.workflows','controlPlane.forms','controlPlane.taxonomy','controlPlane.integrations','controlPlane.changes']);
group('Protected browser storage boundary','src/app/store.ts',['readRuntimeState','readSafePreferences','writeRuntimeState','writeSafePreferences','SafePersisted','controlPlane']);
const sourceFiles=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(e.name))sourceFiles.push(p)}};walk(path.join(root,'src'));
const all=sourceFiles.map(p=>fs.readFileSync(p,'utf8')).join('\n');
assert('No native window.prompt/confirm business actions',!all.includes('window.prompt(')&&!all.includes('window.confirm('));
assert('No universal static preview OTP',!all.includes("246810"));
assert('No universal static preview password',!all.includes("'Password@123'")&&!all.includes('"Password@123"'));
assert('V5 baseline role compatibility includes Member',read('src/features/control-plane/data.ts').includes("code:'MEMBER'")&&read('src/features/control-plane/data.ts').includes("code:'REGIONAL_CONVENOR'"));
assert('V5 active state carries central registries', ['modules','actions','permissions','roles','accessPolicies','raci','workflows','forms','taxonomy','notificationRoutes','importProfiles','integrations','settings','featureFlags','matchingPolicies','domainEvents'].every(x=>read('src/features/control-plane/data.ts').includes(`${x}:`)));

console.log(`\nSETHU V5 control-plane validation: ${passed} groups passed.`);
if(failures.length){console.error(`\n${failures.length} V5 contract failure(s):`);failures.forEach(x=>console.error(`- ${x}`));process.exit(1)}
console.log('PASS: V5 Platform Administration control-plane contracts are source-linked and V4-compatible.');
