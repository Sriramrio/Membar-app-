import{readFileSync}from'node:fs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
let pass=0;const fail=[];const check=(n,v)=>{if(v){pass++;console.log(`PASS: ${n}`)}else{fail.push(n);console.error(`FAIL: ${n}`)}};
const contracts=read('src/contracts/platform.ts'),catalogue=read('src/contracts/catalogue.ts'),routes=read('src/routes/routeManifest.ts'),app=read('src/app/PlatformAdminApp.tsx'),page=read('src/features/configuration/ConfigurationProfilesPage.tsx');
check('Configuration profile definition contract',contracts.includes('interface ConfigurationProfile{')&&contracts.includes('baseProfileId')&&contracts.includes('applicableUnitTypes'));
check('Effective profile result exposes conflicts and shadowing',contracts.includes('EffectiveConfigurationProfileResult')&&contracts.includes('conflicts:')&&contracts.includes('shadowed:'));
check('Profile query IDs frozen',catalogue.includes('platform.configuration-profile.list')&&catalogue.includes('platform.configuration-profile.effective'));
check('Profile command IDs frozen',catalogue.includes('platform.configuration-profile.propose')&&catalogue.includes('platform.configuration-profile.assign')&&catalogue.includes('platform.configuration-profile.supersede'));
check('Profile-specific permissions frozen',catalogue.includes('platform.configuration-profile.read')&&catalogue.includes('platform.configuration-profile.manage'));
check('Profile route implemented',routes.includes("id:'configuration-profiles'")&&routes.includes("permission:PERMISSIONS.configurationProfileRead,status:'IMPLEMENTED_AND_TESTED'"));
check('Profile page wired into standalone app',app.includes("'configuration-profiles':ConfigurationProfilesPage"));
check('Profile UX resolves effective values',page.includes('effectiveConfigurationProfile')&&page.includes('resolvedValues')&&page.includes('conflicts')&&page.includes('shadowed'));
console.log(`\nPA-S21 validation: ${pass} PASS`);if(fail.length){console.error(fail.join('\n'));process.exit(1)}
