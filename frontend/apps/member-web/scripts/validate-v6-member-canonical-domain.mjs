import { readFile } from 'node:fs/promises';
const root=new URL('..',import.meta.url).pathname;
const read=async p=>readFile(`${root}${p}`,'utf8');
let failures=0;
function pass(msg){console.log(`PASS: ${msg}`)}
function fail(msg){failures++;console.error(`FAIL: ${msg}`)}
async function requireMarkers(label,file,markers){const t=await read(file);const missing=markers.filter(m=>!t.includes(m));missing.length?fail(`${label}: missing ${missing.join(', ')}`):pass(`${label}: ${markers.length} canonical markers present`);return t}
const slice=await requireMarkers('Canonical network state','/src/features/network/networkSlice.ts',["affiliations:[...affiliations]","certificationRecords:[...certificationRecords]",'upsertAffiliation','setPrimaryAffiliation','endAffiliation','upsertCertificationRecord','applyCertificationReview']);
if(slice.includes('syncLegacyAffiliationMirrors')||slice.includes('syncLegacyCertificationMirror'))fail('Canonical network reducers still synchronize deprecated mirrors');else pass('Canonical network reducers do not synchronize deprecated mirrors');
await requireMarkers('Canonical seed ownership','/src/features/network/data.ts',['canonicalMemberBusinessLinks','export const affiliations','export const certificationRecords']);
const data=await read('/src/features/network/data.ts');if(/ownerMemberIds|primaryRepresentativeId|certifications:certificationStandardsForBusinessIndex/.test(data))fail('Canonical seed still materialises deprecated Member/Business mirrors');else pass('Canonical seed materialises relationships/certifications only in canonical records');
await requireMarkers('Canonical V6 selectors','/src/features/network/selectors.ts',['verifiedAffiliationsForMember','businessForMember','verifiedAffiliationsForBusiness','authoritativeRepresentativeMemberIdsForBusiness','primaryRepresentativeMemberIdForBusiness','certificationRecordsForBusiness','certificationStandardsForBusiness']);
const dq=await read('/src/features/control-plane/dataQualityEngine.ts');
if(dq.includes('b.id===m.businessId'))fail('Data quality Member business rule still reads legacy Member.businessId');else pass('Data quality Member business rule uses canonical affiliation state');
const files=['/src/features/member/pages/ConnectionsPage.tsx','/src/features/member/pages/CreateReferencePage.tsx','/src/features/member/pages/TransactionsPage.tsx','/src/features/member/pages/MemberDetailPage.tsx'];
for(const f of files){const t=await read(f);if(/(?:member|targetMember|target)\.businessId/.test(t))fail(`${f} still reads legacy Member.businessId`);else pass(`${f} has no legacy Member.businessId read`)}
const directory=await read('/src/features/member/pages/SmartMemberBusinessDirectoryPage.tsx');
if(/\bb\.certifications\b/.test(directory))fail('Directory still reads deprecated Business.certifications mirror');else pass('Directory certification discovery uses canonical certificationRecords');
const dataTest=await read('/src/features/network/networkData.test.ts');
if(!dataTest.includes('links members and businesses through canonical affiliations'))fail('Network seed test is not canonical-affiliation based');else pass('Network seed test asserts canonical affiliations');
const hardening=await read('/src/features/network/networkCanonicalHardening.test.ts');
if(hardening.includes("?.businessId).toBe('business-007')")||hardening.includes('?.certifications)'))fail('Canonical hardening tests still assert legacy mirrors');else pass('Canonical hardening tests assert canonical records');
if(failures)process.exit(1);
console.log('\nSETHU V6 Member Canonical Domain/State validation: PASS (C02).');
