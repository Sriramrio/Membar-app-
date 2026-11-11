import fs from 'node:fs';
const nav=fs.readFileSync(new URL('../src/config/navigation.ts',import.meta.url),'utf8');
const shell=fs.readFileSync(new URL('../src/components/ResponsiveShell.tsx',import.meta.url),'utf8');
const more=fs.readFileSync(new URL('../src/pages/MorePage.tsx',import.meta.url),'utf8');
const checks=[
 ['role priority map present',nav.includes('CHAPTER_SECRETARY')&&nav.includes('CHAPTER_TREASURER')&&nav.includes('REGION_COORDINATOR')&&nav.includes('MANAGEMENT_REVIEWER')],
 ['navigation uses permissions',nav.includes('hasPermissionId')&&nav.includes('requiredPermission')],
 ['shell passes active assignment role',shell.includes('activeAssignment?.roleType')&&shell.includes('permissions')],
 ['More shows same effective navigation',more.includes('activeAssignment?.roleType')&&more.includes('permissions')]
];
for(const [n,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${n}`);if(!ok)process.exitCode=1}
