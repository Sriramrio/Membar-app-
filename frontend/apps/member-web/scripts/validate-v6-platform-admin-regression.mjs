import fs from 'node:fs';
import path from 'node:path';
const read=p=>fs.readFileSync(path.resolve(p),'utf8');
let passed=0; const fail=[];
const check=(name,ok)=>{if(ok){console.log(`PASS: ${name}`);passed++}else{console.error(`FAIL: ${name}`);fail.push(name)}};
const routes=read('src/routes/routeConfig.tsx');
const giant=read('src/features/control-plane/pages/PlatformAdminV6Pages.tsx');
const form=read('src/features/platform-admin/form-builder/FormBuilderPageV6.tsx');
const integration=read('src/features/platform-admin/operations/IntegrationAdministrationPageV6.tsx');
const settings=read('src/features/platform-admin/settings/PlatformSettingsPageV6.tsx');

const identity=read('src/features/platform-admin/identity/IdentityAdministrationPageV6.tsx');
const promotion=read('src/features/platform-admin/policies/PromotionPolicyPageV6.tsx');
const imports=read('src/features/platform-admin/operations/ImportCentrePageV6.tsx');

const release=read('src/features/control-plane/components/ConfigurationReleasePanel.tsx');
const slice=read('src/features/control-plane/controlPlaneSlice.ts');
const paDir='src/features/platform-admin';
const walk=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const paSource=walk(paDir).filter(x=>/\.tsx?$/.test(x)).map(read).join('\n');
const priority=[
 ['/platform-admin/hierarchy','OrganisationHierarchyPage'],['/platform-admin/roles','RoleCatalogueAssignmentsPage'],['/platform-admin/rbac','RBACMatrixPage'],['/platform-admin/raci','RACIMatrixPage'],['/platform-admin/workflows','WorkflowDesignerPage'],['/platform-admin/lookups','LookupsTaxonomiesPage'],['/platform-admin/forms','FormBuilderPage'],['/platform-admin/imports','ImportCentrePage'],['/platform-admin/integrations','IntegrationAdministrationPage'],['/platform-admin/notifications','NotificationAdministrationPage'],['/platform-admin/settings','PlatformSettingsPage']
];
for(const [route,marker] of priority) check(`Priority route registered: ${route}`,routes.includes(route)&&routes.includes(marker));
check('Form Builder has Save Draft',form.includes('Save Draft'));
check('Form Builder has runtime Preview',form.includes('Preview Form')&&form.includes('FormRuntimePreview'));
check('Form Builder requires saved draft before release',form.includes('Save Draft before preparing'));
check('Form Builder links governed release',form.includes('prepareRelease')&&form.includes('releaseChangeId'));
check('Form activation retains version semantics',slice.includes("artifactType==='Form'")&&slice.includes('formHistory'));
check('Integration health does not fabricate Connected',integration.includes("status:'Degraded'")&&integration.includes('live health was not fabricated'));
check('Integration editor never accepts plaintext secret field',!/label=\"Secret value\"|secretValue\s*[:=]/.test(integration));
check('Settings editor is typed',settings.includes("type==='boolean'")&&settings.includes("type==='number'")&&settings.includes("type==='json'"));
check('Identity status/MFA changes require reason dialog',identity.includes('Mandatory reason')&&identity.includes('ActionDialog'));
check('Promotion policy has real governed revision editor',promotion.includes('Create governed revision')&&!promotion.includes('memberImpressionCap+1'));
check('Import Centre accepts real CSV file input and maps rows',imports.includes('type=\"file\"')&&imports.includes('parseCsv')&&imports.includes('file.text()')&&imports.includes('mapRecord'));
check('Release panel filters status/artifact/query',release.includes('status')&&release.includes('artifactType')&&release.includes('query'));
check('No native browser prompt/confirm in Platform Admin',!/window\.(prompt|confirm)\s*\(/.test(paSource));
check('No empty Platform Admin click handler',!/onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(paSource));
check('No stale V5 current-control-plane label in Platform Admin',!paSource.includes('active V5 control plane'));
for(const stale of ['WorkflowDesignerV6','TaxonomyV6','ImportCentreV6','IntegrationAdministrationV6','NotificationAdministrationV6','PlatformSettingsV6','FormBuilderV6']) check(`Stale giant-page implementation retired: ${stale}`,!giant.includes(`function ${stale}`));
check('ActionDialog UX validator is registered',JSON.parse(read('package.json')).scripts['validate:v6:platform-admin:ux']==='node scripts/validate-v6-platform-admin-ux.mjs');
if(fail.length){console.error(`\nPlatform Admin regression validation failed: ${fail.length} group(s).`);process.exit(1)}
console.log(`\nPlatform Admin regression validation: ${passed} groups passed.`);
console.log('PASS: priority Platform Admin routes and hardened interaction contracts remain source-wired.');
