import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
let pass=0;
const check=(name,ok)=>{if(!ok){console.error('FAIL',name);process.exitCode=1}else{console.log('PASS',name);pass++}};
check("Feature page", read('src/features/features/FeaturesPage.tsx').includes('feature flags never grant authorization'));
check("Feature contract", read('src/contracts/platform.ts').includes('interface FeatureDefinition'));
check("Feature route", read('src/routes/routeManifest.ts').includes('PERMISSIONS.featuresRead'));
if(!process.exitCode)console.log('PA-S31: '+pass+' checks PASS');
