import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();let failures=0;const pass=m=>console.log(`PASS: ${m}`);const fail=m=>{failures++;console.error(`FAIL: ${m}`)};
const exists=rel=>fs.existsSync(path.join(root,rel));const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const retired=[
 'src/features/network/compatibilityProjection.ts',
 'src/features/network/pages/memberPages.tsx',
 'src/routes/routeCompatibility.ts'
];
for(const f of retired)exists(f)?fail(`retired production artifact still exists: ${f}`):pass(`retired production artifact absent: ${f}`);
const types=read('src/features/network/types.ts');
if(/designation:string;\s*businessId:Id/.test(types))fail('Member.businessId legacy mirror remains in canonical Member type');else pass('Member.businessId legacy mirror removed from canonical type');
if(/ownerMemberIds|primaryRepresentativeId|certifications:string\[\]/.test(types))fail('Business legacy relationship/certification mirrors remain in canonical type');else pass('Business legacy relationship/certification mirrors removed from canonical type');
const data=read('src/features/network/data.ts');
if(/ownerMemberIds|primaryRepresentativeId|certifications:certificationStandardsForBusinessIndex/.test(data))fail('Canonical seed still writes legacy mirrors');else pass('Canonical seed writes affiliation/certification records without legacy mirrors');
const slice=read('src/features/network/networkSlice.ts');
if(/ownerMemberIds|primaryRepresentativeId|certifications:\[\]|designation:String\(row\.designation\?\?'Member'\),businessId,chapter/.test(slice))fail('Canonical reducer/import path still constructs deprecated Member/Business mirrors');else pass('Canonical reducer/import path constructs V6 Member/Business shapes only');
const onboarding=read('src/features/management/pages/NewMemberOnboardingPage.tsx');
if(/ownerMemberIds|primaryRepresentativeId|certifications:\[\]|designation:form\.designation,businessId/.test(onboarding))fail('Member activation still constructs legacy mirrors');else pass('Member activation relies on canonical affiliation creation');
const businessProfile=read('src/features/member/pages/MyBusinessesPage.tsx');
if(/changes:\{businessId:draft\.id/.test(businessProfile))fail('Business profile save still writes Member.businessId');else pass('Business profile save does not write Member.businessId');
const constants=read('src/utils/constants.ts');
if(constants.includes('LEGACY_MEMBER_NAV_STORAGE_KEYS'))fail('Legacy Member navigation storage constants remain in production');else pass('Legacy Member navigation storage constants retired');
const source=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(e.name)&&!p.includes(`${path.sep}migrations${path.sep}`)&&!p.endsWith('.test.ts')&&!p.endsWith('.test.tsx'))source.push(p)}}walk(path.join(root,'src'));
const banned=/compatibilityProjection|network\/pages\/memberPages|routeCompatibility|LEGACY_MEMBER_NAV_STORAGE_KEYS|resolveLegacyRouteAlias/;
const hits=source.filter(p=>banned.test(fs.readFileSync(p,'utf8'))).map(p=>path.relative(root,p).replaceAll('\\','/'));
hits.length?fail(`production source contains retired Member dependency markers: ${hits.join(', ')}`):pass('Production source has zero retired Member dependency markers');
const migration=read('src/migrations/v6BaselineCore.ts');
if(!migration.includes('legacy-member-business')||!migration.includes('legacy-certification-string'))fail('Historical persisted-data migration evidence was lost');else pass('Historical persisted-data migration remains isolated under src/migrations');
if(failures)process.exit(1);console.log('\nSETHU V6 Member Canonical Legacy Retirement validation: PASS (C07).');
